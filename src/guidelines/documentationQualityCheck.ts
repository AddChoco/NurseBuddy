import type { GuidelineDefinition } from './types';
import type { AssessmentType } from './facilityTemplateMode';
import {
  inferMissingInfoCategory,
  shouldCheckMissingField,
} from './facilityTemplateMode';
import type { MissingInfoCategory } from './types';
import { extractClinicalFacts } from './clinicalFactExtraction';
import { parseDocumentedEventTime } from './eventTimeParsing';
import { getFieldMatchKeywords } from './guidelineEngine';
import type { PlanEnrichmentResult } from './planPromptEnrichment';
import { getFacilityPromptValue } from './planPromptEnrichment';
import { extractPlanStandingInstructions, getFacilityFormTemplate } from './facilityFormTemplates';
import { STAFF_EDUCATION_PROMPT } from './facilityTemplateMode';
import { detectStaffUnderstandingConfirmed } from './clinicalFactExtraction';
import type { TemplateLockSchema, TemplateLockValues } from './templateLockMode';
import { getTemplateLockFieldById, isStructuredFieldDocumented } from './templateLockMode';
import { getFieldIdForChecklistLabel } from './templateLockPopulation';

export interface CategorizedMissingItem {
  label: string;
  category: MissingInfoCategory;
  reason?: string;
}

export interface DocumentationQualityCheckResult {
  provided: string[];
  missing: string[];
  categorizedMissing: CategorizedMissingItem[];
  scorePercent: number;
}

const ENTERAL_APPLICABILITY_PATTERN = /enteral|g-tube|gtube|g tube|tube feed|tube feeding|feeding rate|jevity|osmolite|ml\/hr|ml\/hour/i;

const SUPPLEMENTAL_CHECK_ITEMS: Array<{
  label: string;
  documentedLabel: string;
  category: MissingInfoCategory;
  isPresent: (args: QualityCheckContext) => boolean;
  isApplicable?: (args: QualityCheckContext) => boolean;
}> = [
  {
    label: 'Event time',
    documentedLabel: 'Event time documented',
    category: 'facility_required',
    isPresent: ({ facts, searchableText }) =>
      Boolean(facts.eventTime || parseDocumentedEventTime(searchableText)),
  },
  {
    label: 'Nursing interventions',
    documentedLabel: 'Nursing interventions documented',
    category: 'facility_required',
    isPresent: ({ facts, enrichment, planText, input, standingInstructions, templateLockValues, templateLockSchema }) => {
      if (templateLockValues && templateLockSchema) {
        return isStructuredFieldDocumented(
          templateLockValues,
          'nursingInterventionsCompleted',
          templateLockSchema,
        );
      }
      if (enrichment?.nursingInterventionsSummary) return true;
      return Boolean(
        facts.nursingInterventionsCompleted
        && (/nursing interventions completed:\s*\n[^\n:]+/i.test(planText)
          || /nursing interventions completed:\s+\S/i.test(planText)),
      );
    },
  },
  {
    label: 'Staff instructions',
    documentedLabel: 'DSP monitoring instructions included',
    category: 'clinically_useful',
    isPresent: ({ soapText }) =>
      /\b(?:dsp\/staff|dsp|staff) instructed to monitor\b/i.test(soapText),
  },
  {
    label: 'Staff understanding confirmation',
    documentedLabel: 'Staff understanding confirmation documented',
    category: 'facility_required',
    isPresent: ({ facts, enrichment, planText, input, standingInstructions }) =>
      staffUnderstandingDocumented({ input, searchableText: '', soapText: '', planText, facts, enrichment, standingInstructions }),
  },
];

interface QualityCheckContext {
  input: string;
  searchableText: string;
  soapText: string;
  planText: string;
  facts: ReturnType<typeof extractClinicalFacts>;
  enrichment?: PlanEnrichmentResult | null;
  standingInstructions: ReadonlySet<string>;
  templateLockValues?: TemplateLockValues | null;
  templateLockSchema?: TemplateLockSchema | null;
}

function normalizeSearchText(parts: string[]): string {
  return parts.join('\n').toLowerCase();
}

function fieldDocumentedLabel(label: string): string {
  return `${label} documented`;
}

function fieldMissingLabel(label: string, category: MissingInfoCategory): string {
  if (/if identified|if applicable|if suspected|when applicable/i.test(label)) return label;
  if (category === 'clinically_useful') return `${label}, if known`;
  return label;
}

function keywordPresent(keywords: string[], searchableText: string, rawText: string): boolean {
  return keywords.some((keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    if (searchableText.includes(normalizedKeyword)) return true;
    try {
      return new RegExp(keyword, 'i').test(rawText);
    } catch {
      return false;
    }
  });
}

function isUnknownPlaceholder(value: string): boolean {
  return /^(unknown|n\/a|not documented|not reported|none)$/i.test(value.trim());
}

function stripTemplatePromptLabels(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^[^:\n]+:\s*$/.test(line.trim()))
    .join('\n');
}

function staffUnderstandingDocumented(context: QualityCheckContext): boolean {
  if (context.templateLockValues && context.templateLockSchema) {
    return isStructuredFieldDocumented(
      context.templateLockValues,
      'staffUnderstandingConfirmation',
      context.templateLockSchema,
    );
  }

  const promptValue = getFacilityPromptValue(
    context.planText,
    STAFF_EDUCATION_PROMPT,
    context.standingInstructions,
  );
  if (promptValue && !isUnknownPlaceholder(promptValue)) return true;

  if (context.enrichment?.staffUnderstandingConfirmed) return true;
  if (context.enrichment?.staffUnderstandingValue && !/^pending/i.test(context.enrichment.staffUnderstandingValue)) {
    return true;
  }

  return detectStaffUnderstandingConfirmed(context.input);
}

function promptValuePresent(
  promptLabel: string,
  planText: string,
  standingInstructions: ReadonlySet<string>,
): string | null {
  const prompt = promptLabel.endsWith(':') ? promptLabel : `${promptLabel}:`;
  const value = getFacilityPromptValue(planText, prompt, standingInstructions);
  if (!value || isUnknownPlaceholder(value)) return null;
  return value;
}

function isFieldPresent(
  fieldLabel: string,
  def: GuidelineDefinition,
  context: QualityCheckContext,
): boolean {
  if (context.templateLockValues && context.templateLockSchema) {
    const fieldId = getFieldIdForChecklistLabel(context.templateLockSchema, fieldLabel);
    if (fieldId) {
      return isStructuredFieldDocumented(context.templateLockValues, fieldId, context.templateLockSchema);
    }

    const normalizedLabel = fieldLabel.toLowerCase();
    const matchingField = context.templateLockSchema.fields.find((field) => {
      const promptLabel = field.label.replace(/:\s*$/, '').toLowerCase();
      return promptLabel === normalizedLabel
        || normalizedLabel.includes(promptLabel)
        || promptLabel.includes(normalizedLabel);
    });
    if (matchingField) {
      return isStructuredFieldDocumented(
        context.templateLockValues,
        matchingField.id,
        context.templateLockSchema,
      );
    }
  }

  const evidenceText = stripTemplatePromptLabels(context.searchableText);

  if (/gastric bleeding/i.test(fieldLabel)) {
    const value = promptValuePresent('Gastric bleeding if suspected:', context.soapText, context.standingInstructions);
    if (value) return true;
    return /gastric bleeding|hematemesis|blood in vomit|coffee ground|bloody emesis|no bleeding|without blood|bleeding (?:not|ruled out)/i.test(evidenceText);
  }

  if (/enteral feeding rate/i.test(fieldLabel)) {
    const value = promptValuePresent('Enteral feeding rate:', context.soapText, context.standingInstructions);
    if (value) return true;
  }

  if (/positioning per pnmp/i.test(fieldLabel)) {
    const value = promptValuePresent('Positioning per PNMP:', context.soapText, context.standingInstructions);
    if (value) return true;
    return /upright|positioned|positioning|pnmp|head of bed|hob|side lying|semi-fowler|fowler/i.test(context.searchableText);
  }

  if (/date\/time\/description of vomitus/i.test(fieldLabel)) {
    const eventTime = context.facts.eventTime || parseDocumentedEventTime(context.input);
    const hasDescription = /vomit|emesis|undigested|description of vomitus|threw up/i.test(context.searchableText);
    return Boolean(eventTime && hasDescription);
  }

  const promptCandidates = [
    `${fieldLabel}:`,
    fieldLabel.replace('Analysis of Intake and Output', 'Intake/output'),
    fieldLabel.replace('Presence or Absence of Nausea', 'Presence or absence of nausea'),
  ];

  for (const prompt of promptCandidates) {
    const value = promptValuePresent(prompt, context.soapText, context.standingInstructions);
    if (value) return true;
  }

  const keywords = getFieldMatchKeywords(def, fieldLabel);
  return keywordPresent(keywords, evidenceText.toLowerCase(), evidenceText);
}

function isFieldApplicable(
  fieldLabel: string,
  clinicalText: string,
): boolean {
  if (/enteral feeding rate/i.test(fieldLabel)) {
    return ENTERAL_APPLICABILITY_PATTERN.test(clinicalText);
  }
  return true;
}

function fieldWeight(category: MissingInfoCategory): number {
  if (category === 'facility_required') return 2;
  return 1;
}

function compareMissingCategory(
  left: MissingInfoCategory,
  right: MissingInfoCategory,
): number {
  const order: MissingInfoCategory[] = ['facility_required', 'conditional', 'clinically_useful'];
  return order.indexOf(left) - order.indexOf(right);
}

export function buildDocumentationQualityCheck(args: {
  input: string;
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  def: GuidelineDefinition;
  assessmentType: AssessmentType;
  enrichment?: PlanEnrichmentResult | null;
  templateLockValues?: TemplateLockValues | null;
  templateLockSchema?: TemplateLockSchema | null;
}): DocumentationQualityCheckResult {
  const combinedSoap = [args.soap.subjective, args.soap.objective, args.soap.assessment, args.soap.plan].join('\n');
  const standingInstructions = new Set(extractPlanStandingInstructions(getFacilityFormTemplate(args.def, args.assessmentType)));
  const searchableText = normalizeSearchText([args.input, combinedSoap]);
  const facts = extractClinicalFacts(args.input, args.def.id);
  const context: QualityCheckContext = {
    input: args.input,
    searchableText,
    soapText: combinedSoap,
    planText: args.soap.plan,
    facts,
    enrichment: args.enrichment,
    standingInstructions,
    templateLockValues: args.templateLockValues,
    templateLockSchema: args.templateLockSchema,
  };

  const provided: string[] = [];
  const categorizedMissing: CategorizedMissingItem[] = [];
  let earnedPoints = 0;
  let totalPoints = 0;
  let missingRequiredField = false;

  const trackField = (
    label: string,
    documentedLabel: string,
    category: MissingInfoCategory,
    present: boolean,
    applicable: boolean,
    reason?: string,
  ) => {
    if (!applicable) return;

    const weight = fieldWeight(category);
    totalPoints += weight;

    if (present) {
      earnedPoints += weight;
      if (!provided.includes(documentedLabel)) provided.push(documentedLabel);
      return;
    }

    if (category === 'facility_required') missingRequiredField = true;

    categorizedMissing.push({
      label: fieldMissingLabel(label, category),
      category,
      reason,
    });
  };

  for (const field of args.def.missingInformationChecklist) {
    const category = inferMissingInfoCategory(field);
    const applicable =
      isFieldApplicable(field.label, args.input)
      && shouldCheckMissingField(field, args.input, args.assessmentType);
    const present = isFieldPresent(field.label, args.def, context);

    trackField(
      field.label,
      fieldDocumentedLabel(field.label),
      category,
      present,
      applicable,
      category === 'conditional' ? field.conditionalWhen : undefined,
    );
  }

  for (const item of SUPPLEMENTAL_CHECK_ITEMS) {
    const applicable = item.isApplicable ? item.isApplicable(context) : true;
    const present = item.isPresent(context);
    trackField(item.label, item.documentedLabel, item.category, present, applicable);
  }

  const staffInstructionsPresent = SUPPLEMENTAL_CHECK_ITEMS[2].isPresent(context);
  const staffUnderstandingPresent = SUPPLEMENTAL_CHECK_ITEMS[3].isPresent(context);
  if (staffInstructionsPresent && !staffUnderstandingPresent) {
    categorizedMissing.push({
      label: 'Staff understanding confirmation not documented',
      category: 'facility_required',
      reason: 'Staff instructions are documented without confirmed understanding',
    });
    missingRequiredField = true;
  }

  categorizedMissing.sort((left, right) => compareMissingCategory(left.category, right.category));

  let scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
  if (missingRequiredField && scorePercent === 100) {
    scorePercent = Math.max(0, scorePercent - 1);
  }
  if (missingRequiredField) {
    scorePercent = Math.min(scorePercent, 99);
  }

  return {
    provided,
    missing: categorizedMissing.map((item) => item.label),
    categorizedMissing,
    scorePercent,
  };
}
