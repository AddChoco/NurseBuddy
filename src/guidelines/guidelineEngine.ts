import type {
  AssessmentField,
  DocumentationTypeId,
  GuidelineCrossReferenceRule,
  GuidelineDefinition,
  GuidelineDocumentationDefinition,
  MissingInfoCategory,
} from './types';
import { resolveDocumentationTypeId } from './documentationTypes';
import { detectAssessmentType, FACILITY_TEMPLATE_MODE_INSTRUCTIONS } from './facilityTemplateMode';
import type { AssessmentType } from './facilityTemplateMode';
import {
  formatItemList,
  isPlaceholderContent,
} from './placeholders';

export function fieldFromLabel(
  label: string,
  options: {
    critical?: boolean;
    description?: string;
    matchKeywords?: string[];
    category?: MissingInfoCategory;
    conditionalWhen?: string;
  } = {},
): AssessmentField {
  return {
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    label,
    critical: options.critical,
    description: options.description,
    matchKeywords: options.matchKeywords,
    category: options.category,
    conditionalWhen: options.conditionalWhen,
  };
}

export function fieldsFromLabels(
  labels: string[],
  options: { critical?: boolean; matchKeywords?: string[] } = {},
): AssessmentField[] {
  return labels.map((label) => fieldFromLabel(label, options));
}

export function getFieldMatchKeywords(def: GuidelineDefinition, label: string): string[] {
  const fromChecklist = def.missingInformationChecklist.find((field) => field.label === label);
  if (fromChecklist?.matchKeywords?.length) return fromChecklist.matchKeywords;

  const fromRequired = def.assessment.requiredFields.find((field) => field.label === label);
  if (fromRequired?.matchKeywords?.length) return fromRequired.matchKeywords;

  const fromOptional = def.assessment.optionalFields.find((field) => field.label === label);
  if (fromOptional?.matchKeywords?.length) return fromOptional.matchKeywords;

  return [label.toLowerCase()];
}

// ---------------------------------------------------------------------------
// Guideline registry lookups
// ---------------------------------------------------------------------------

export function getGuidelineDefinition(
  id: GuidelineDefinition['id'],
  registry: Record<GuidelineDefinition['id'], GuidelineDefinition>,
): GuidelineDefinition {
  return registry[id];
}

export function getGuidelineByDisplayName(
  name: string,
  definitions: GuidelineDefinition[],
): GuidelineDefinition | undefined {
  return definitions.find((def) => def.displayName === name);
}

// ---------------------------------------------------------------------------
// Backward-compatible accessors (current UI + aiEngine)
// ---------------------------------------------------------------------------

export function getRequiredAssessmentAreaLabels(def: GuidelineDefinition): string[] {
  return def.assessment.requiredFields.map((field) => field.label);
}

export function getOptionalAssessmentAreaLabels(def: GuidelineDefinition): string[] {
  return def.assessment.optionalFields.map((field) => field.label);
}

export function getMissingInformationChecklistLabels(def: GuidelineDefinition): string[] {
  return def.missingInformationChecklist.map((field) => field.label);
}

export function getCriticalMissingFieldLabels(def: GuidelineDefinition): string[] {
  return def.missingInformationChecklist
    .filter((field) => field.critical)
    .map((field) => field.label);
}

// ---------------------------------------------------------------------------
// Documentation type resolution
// ---------------------------------------------------------------------------

const DOC_TYPE_TO_KEY: Partial<Record<
  DocumentationTypeId,
  keyof GuidelineDocumentationDefinition
>> = {
  initial_assessment: 'initialAssessment',
  follow_up_assessment: 'followUpAssessment',
  resolution_assessment: 'resolutionAssessment',
  soap_note: 'soapNote',
  sbar: 'sbar',
  lar_guardian_email: 'larGuardianEmail',
  provider_notification: 'providerNotification',
};

export function getDocumentationTypeInstructions(
  def: GuidelineDefinition,
  docTypeId: DocumentationTypeId,
) {
  const key = DOC_TYPE_TO_KEY[docTypeId];
  if (!key) return def.documentation.providerNotification;
  return def.documentation[key];
}

export function getDocumentationInstructionsByOutputLabel(
  def: GuidelineDefinition,
  outputLabel: string,
) {
  const docTypeId = resolveDocumentationTypeId(outputLabel);
  if (!docTypeId) return undefined;
  return getDocumentationTypeInstructions(def, docTypeId);
}

function resolveAssessmentDocumentationKey(
  assessmentType: AssessmentType,
): keyof GuidelineDocumentationDefinition {
  switch (assessmentType) {
    case 'follow_up':
      return 'followUpAssessment';
    case 'resolution':
      return 'resolutionAssessment';
    default:
      return 'initialAssessment';
  }
}

export function getAssessmentInstructionsForType(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
) {
  const key = resolveAssessmentDocumentationKey(assessmentType);
  return def.documentation[key];
}

function buildSoapAssessmentTemplateBlock(
  def: GuidelineDefinition,
  clinicalText: string,
): string {
  if (!clinicalText.trim()) return '';

  const assessmentType = detectAssessmentType(clinicalText);
  const assessmentInstructions = getAssessmentInstructionsForType(def, assessmentType);
  if (!assessmentInstructions.applicable || isPlaceholderContent(assessmentInstructions.instructions)) {
    return '';
  }

  return `FACILITY FORM TEMPLATE FOR THIS ASSESSMENT TYPE:
Complete this facility form exactly in your SOAP output. Preserve every section heading and colon-ended prompt on its own line. Leave prompts visible when information is missing. Do not convert to paragraph form or bullet lists.

${assessmentInstructions.instructions}`;
}

export function isDocumentationTypeApplicable(
  def: GuidelineDefinition,
  docTypeId: DocumentationTypeId,
): boolean {
  const instructions = getDocumentationTypeInstructions(def, docTypeId);
  if (docTypeId === 'resolution_assessment') {
    return def.resolutionCriteria.applicable && instructions.applicable;
  }
  return instructions.applicable;
}

// ---------------------------------------------------------------------------
// Cross-reference support (supporting facility guidelines)
// ---------------------------------------------------------------------------

function normalizeClinicalText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function getActiveCrossReferenceRules(
  def: GuidelineDefinition,
  clinicalText: string,
): GuidelineCrossReferenceRule[] {
  if (!def.crossReferenceRules || !clinicalText.trim()) return [];

  const normalized = normalizeClinicalText(clinicalText);
  return def.crossReferenceRules.rules.filter((rule) =>
    rule.triggerKeywords.some((keyword) => normalized.includes(normalizeClinicalText(keyword))),
  );
}

export function getReviewAreaLabels(
  def: GuidelineDefinition,
  clinicalText: string,
  resolveGuideline: (id: GuidelineDefinition['id']) => GuidelineDefinition,
): string[] {
  const labels = getMissingInformationChecklistLabels(def);
  const seen = new Set(labels);

  for (const rule of getActiveCrossReferenceRules(def, clinicalText)) {
    const crossDef = resolveGuideline(rule.guidelineId);
    for (const label of getMissingInformationChecklistLabels(crossDef)) {
      if (!seen.has(label)) {
        seen.add(label);
        labels.push(label);
      }
    }
  }

  return labels;
}

export function findGuidelineDefForArea(
  primaryDef: GuidelineDefinition,
  area: string,
  clinicalText: string,
  resolveGuideline: (id: GuidelineDefinition['id']) => GuidelineDefinition,
): GuidelineDefinition {
  const hasLabel = (definition: GuidelineDefinition) =>
    definition.missingInformationChecklist.some((field) => field.label === area) ||
    definition.assessment.requiredFields.some((field) => field.label === area) ||
    definition.assessment.optionalFields.some((field) => field.label === area);

  if (hasLabel(primaryDef)) return primaryDef;

  for (const rule of getActiveCrossReferenceRules(primaryDef, clinicalText)) {
    const crossDef = resolveGuideline(rule.guidelineId);
    if (hasLabel(crossDef)) return crossDef;
  }

  return primaryDef;
}

const CROSS_REF_DOCUMENTATION_TYPES: DocumentationTypeId[] = [
  'soap_note',
  'sbar',
  'provider_notification',
  'provider_notification_sbar',
];

export const PROVIDER_NOTIFICATION_SBAR_LABEL = 'Provider Notification (SBAR)';

function buildPrimaryDocumentationBlock(
  def: GuidelineDefinition,
  outputLabel: string,
): string {
  if (outputLabel === PROVIDER_NOTIFICATION_SBAR_LABEL) {
    const sbarInstructions = getDocumentationTypeInstructions(def, 'sbar');
    const providerInstructions = getDocumentationTypeInstructions(def, 'provider_notification');
    const blocks: string[] = [];

    if (sbarInstructions.applicable && !isPlaceholderContent(sbarInstructions.instructions)) {
      blocks.push(`FACILITY-SPECIFIC SBAR RULES:\n${sbarInstructions.instructions}`);
    }
    if (providerInstructions.applicable && !isPlaceholderContent(providerInstructions.instructions)) {
      blocks.push(
        `FACILITY-SPECIFIC PROVIDER NOTIFICATION RULES:\n${providerInstructions.instructions}`,
      );
    }

    return blocks.join('\n\n');
  }

  const docTypeId = resolveDocumentationTypeId(outputLabel);
  if (!docTypeId || docTypeId === 'provider_notification_sbar') return '';

  const docInstructions = getDocumentationTypeInstructions(def, docTypeId);
  if (!docInstructions.applicable) {
    return `FACILITY DOCUMENTATION NOTE: ${outputLabel} is not applicable for the ${def.displayName} guideline.`;
  }

  if (isPlaceholderContent(docInstructions.instructions)) return '';

  return `FACILITY-SPECIFIC ${outputLabel.toUpperCase()} RULES:\n${docInstructions.instructions}`;
}

function resolveCrossReferenceDocTypes(outputLabel: string): DocumentationTypeId[] {
  if (outputLabel === PROVIDER_NOTIFICATION_SBAR_LABEL) {
    return ['sbar', 'provider_notification'];
  }

  const docTypeId = resolveDocumentationTypeId(outputLabel);
  if (!docTypeId || docTypeId === 'provider_notification_sbar') return [];
  return CROSS_REF_DOCUMENTATION_TYPES.includes(docTypeId) ? [docTypeId] : [];
}

function buildCrossReferenceDocumentationBlock(
  def: GuidelineDefinition,
  outputLabel: string,
  clinicalText: string,
  resolveGuideline: (id: GuidelineDefinition['id']) => GuidelineDefinition,
): string {
  const docTypeIds = resolveCrossReferenceDocTypes(outputLabel);
  if (docTypeIds.length === 0 || !def.crossReferenceRules || !clinicalText.trim()) return '';

  const activeRules = getActiveCrossReferenceRules(def, clinicalText);
  if (activeRules.length === 0) return '';

  const sections = activeRules.flatMap((rule) => {
    const crossDef = resolveGuideline(rule.guidelineId);
    return docTypeIds.map((docTypeId) => {
      const docInstructions = getDocumentationTypeInstructions(crossDef, docTypeId);
      if (!docInstructions.applicable || isPlaceholderContent(docInstructions.instructions)) {
        return `Supporting rules from ${crossDef.displayName} (apply when related findings are documented):\n${formatItemList(crossDef.prohibitedAssumptions, 'Follow general accuracy rules.')}`;
      }

      return `Supporting rules from ${crossDef.displayName} (apply when related findings are documented — do not generate a separate note):
${docInstructions.instructions}

Prohibited assumptions from ${crossDef.displayName}:
${formatItemList(crossDef.prohibitedAssumptions, 'Follow general accuracy rules.')}`;
    });
  });

  return `CROSS-REFERENCED FACILITY GUIDELINE SUPPORT:
${def.crossReferenceRules.instructions}

${sections.join('\n\n')}

Do not automatically generate separate notes for cross-referenced guidelines unless explicitly requested.`;
}

// ---------------------------------------------------------------------------
// Prompt assembly (used by Supabase edge function)
// ---------------------------------------------------------------------------

function formatAssessmentFields(fields: AssessmentField[], emptyMessage: string): string {
  if (fields.length === 0) return `- ${emptyMessage}`;
  return fields
    .map((field) => {
      const suffix = field.critical ? ' (critical)' : '';
      const description = field.description ? ` — ${field.description}` : '';
      return `- ${field.label}${suffix}${description}`;
    })
    .join('\n');
}

export function buildGuidelineContextBlock(def: GuidelineDefinition): string {
  const description = isPlaceholderContent(def.description)
    ? 'Awaiting facility guideline document.'
    : def.description;

  const terminologyRules = isPlaceholderContent(def.terminologyRules)
    ? 'Use "resident" unless nurse terminology setting specifies otherwise.'
    : def.terminologyRules;

  const followUpFrequency = isPlaceholderContent(def.followUpRequirements.frequency)
    ? 'Awaiting facility follow-up schedule.'
    : def.followUpRequirements.frequency;

  const resolutionBlock = def.resolutionCriteria.applicable
    ? `Resolution criteria:
${formatItemList(def.resolutionCriteria.criteria, 'Awaiting facility resolution criteria.')}

Resolution instructions:
${isPlaceholderContent(def.resolutionCriteria.instructions) ? 'Awaiting facility resolution instructions.' : def.resolutionCriteria.instructions}`
    : 'Resolution assessment: Not applicable for this guideline.';

  return `FACILITY GUIDELINE: ${def.displayName}

Description: ${description}

Required assessment fields:
${formatAssessmentFields(def.assessment.requiredFields, 'None specified yet.')}

Optional assessment fields:
${formatAssessmentFields(def.assessment.optionalFields, 'None specified yet.')}

Missing-information checklist:
${formatAssessmentFields(def.missingInformationChecklist, 'None specified yet.')}

Follow-up requirements:
- Frequency: ${followUpFrequency}
- Monitoring points:
${formatItemList(def.followUpRequirements.monitoringPoints, 'Awaiting facility monitoring points.')}
- Reassessment criteria:
${formatItemList(def.followUpRequirements.reassessmentCriteria, 'Awaiting facility reassessment criteria.')}
- Instructions: ${isPlaceholderContent(def.followUpRequirements.instructions) ? 'Awaiting facility follow-up instructions.' : def.followUpRequirements.instructions}

${resolutionBlock}

Notification rules:
- Provider notification: ${isPlaceholderContent(def.notificationRules.providerNotification) ? 'Awaiting facility provider notification rules.' : def.notificationRules.providerNotification}
- LAR/Guardian notification: ${isPlaceholderContent(def.notificationRules.larGuardianNotification) ? 'Awaiting facility LAR/guardian notification rules.' : def.notificationRules.larGuardianNotification}
- Triggers:
${formatItemList(def.notificationRules.triggers, 'Awaiting facility notification triggers.')}
- Do not auto-notify unless:
${formatItemList(def.notificationRules.prohibitedAutoNotifications, 'Follow general notification prohibitions.')}

Education / instruction requirements:
- Resident: ${isPlaceholderContent(def.educationRequirements.residentInstructions) ? 'Awaiting facility resident education requirements.' : def.educationRequirements.residentInstructions}
- Staff: ${isPlaceholderContent(def.educationRequirements.staffInstructions) ? 'Awaiting facility staff education requirements.' : def.educationRequirements.staffInstructions}
- LAR/Guardian: ${isPlaceholderContent(def.educationRequirements.larGuardianInstructions) ? 'Awaiting facility LAR/guardian education requirements.' : def.educationRequirements.larGuardianInstructions}

Prohibited assumptions:
${formatItemList(def.prohibitedAssumptions, 'Follow general accuracy rules until facility rules are loaded.')}

Terminology rules:
${terminologyRules}${def.crossReferenceRules ? `

Guideline cross-references:
${def.crossReferenceRules.instructions}
${formatItemList(
  def.crossReferenceRules.rules.map(
    (rule) => `${rule.guidelineId}: apply when input includes related findings (${rule.triggerKeywords.slice(0, 5).join(', ')}${rule.triggerKeywords.length > 5 ? ', …' : ''})`,
  ),
  'None specified.',
)}` : ''}`;
}

export function buildGuidelineDocumentationInstructionBlock(
  def: GuidelineDefinition,
  outputLabel: string,
  clinicalText = '',
  resolveGuideline?: (id: GuidelineDefinition['id']) => GuidelineDefinition,
): string {
  const primaryBlock = buildPrimaryDocumentationBlock(def, outputLabel);
  const crossBlock =
    resolveGuideline && clinicalText.trim()
      ? buildCrossReferenceDocumentationBlock(def, outputLabel, clinicalText, resolveGuideline)
      : '';

  const templateBlock = outputLabel === 'SOAP Note' ? FACILITY_TEMPLATE_MODE_INSTRUCTIONS : '';
  const assessmentTemplateBlock =
    outputLabel === 'SOAP Note' ? buildSoapAssessmentTemplateBlock(def, clinicalText) : '';

  return [templateBlock, assessmentTemplateBlock, primaryBlock, crossBlock].filter(Boolean).join('\n\n');
}
