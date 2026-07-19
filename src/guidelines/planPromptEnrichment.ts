import type { GuidelineDefinition } from './types';
import type { AssessmentType } from './facilityTemplateMode';
import { STAFF_EDUCATION_PROMPT } from './facilityTemplateMode';
import { detectStaffUnderstandingConfirmed } from './clinicalFactExtraction';
import {
  extractPlanCompletionPrompts,
  extractPlanStandingInstructions,
  getFacilityFormTemplate,
} from './facilityFormTemplates';
import { getGuidelineRequirementConfig } from './guidelineRequirementConfigs';
import {
  createPlanDocumentationContext,
  evaluateGuidelinePlanRules,
  shouldPopulateNursingInterventionsFromRules,
  type PlanEnrichmentInput,
} from './guidelinePlanRuleEngine';

export type { PlanEnrichmentInput };

const NURSING_INTERVENTIONS_PROMPT = 'Nursing interventions completed:';

function resolveNursingInterventionsPrompt(template: string): string | null {
  const prompts = extractPlanCompletionPrompts(template);
  return prompts.find((prompt) => /^Nursing interventions completed:$/i.test(prompt))
    ?? prompts.find((prompt) => /nursing interventions completed:/i.test(prompt))
    ?? null;
}

const STAFF_EDUCATION_PROVIDED_PATTERNS = [
  /\bstaff instructed\b/i,
  /\bdsp instructed\b/i,
  /\beducation provided\b/i,
  /직원에게\s*교육(?:함|했)/i,
  /dsp(?:에게|한테)\s*.*(?:설명|교육)(?:함|했)/i,
  /모니터(?:하고|하)?\s*.*보고(?:하)?(?:도록)?\s*설명(?:함|했)/i,
];

export interface PlanEnrichmentOptions {
  autoCompleteStaffEducation: boolean;
}

export interface PlanEnrichmentResult {
  plan: string;
  nursingInterventionsSummary: string | null;
  staffEducationInstruction: string | null;
  staffUnderstandingValue: string | null;
  staffUnderstandingConfirmed: boolean;
  staffEducationGenerated: boolean;
  reviewWarnings: string[];
}

function detectStaffEducationProvided(input: string): boolean {
  return STAFF_EDUCATION_PROVIDED_PATTERNS.some((pattern) => pattern.test(input));
}

function getPromptValue(
  plan: string,
  prompt: string,
  standingInstructions: ReadonlySet<string> = new Set(),
): string | null {
  const lines = plan.split('\n');
  const promptIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return trimmed === prompt || trimmed.startsWith(`${prompt} `);
  });
  if (promptIndex === -1) return null;

  const sameLine = lines[promptIndex].trim();
  if (sameLine.length > prompt.length) {
    return sameLine.slice(prompt.length).trim();
  }

  for (let index = promptIndex + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (!trimmed) continue;
    if (/^[^:\n]+:\s*$/.test(trimmed)) break;
    if (standingInstructions.has(trimmed)) break;
    return trimmed;
  }

  return null;
}

function setPromptValue(
  plan: string,
  prompt: string,
  value: string,
  standingInstructions: ReadonlySet<string> = new Set(),
): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) return plan;

  const existing = getPromptValue(plan, prompt, standingInstructions);
  if (existing) return plan;

  const lines = plan.split('\n');
  const promptIndex = lines.findIndex((line) => line.trim() === prompt || line.trim().startsWith(`${prompt} `));
  if (promptIndex === -1) return plan;

  const sameLine = lines[promptIndex].trim();
  if (sameLine.length > prompt.length) {
    lines[promptIndex] = `${prompt} ${trimmedValue}`;
    return lines.join('\n');
  }

  lines.splice(promptIndex + 1, 0, trimmedValue);
  return lines.join('\n');
}

function insertLineBefore(plan: string, beforeLine: string, lineToInsert: string): string {
  const trimmedInsert = lineToInsert.trim();
  if (!trimmedInsert || plan.includes(trimmedInsert)) return plan;

  const lines = plan.split('\n');
  const targetIndex = lines.findIndex((line) => line.trim() === beforeLine);
  if (targetIndex === -1) return plan;

  lines.splice(targetIndex, 0, trimmedInsert);
  return lines.join('\n');
}

export function buildNursingInterventionsSummary(
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  enrichmentInput?: PlanEnrichmentInput,
): string {
  const context = createPlanDocumentationContext(input, def, enrichmentInput);
  const template = getFacilityFormTemplate(def, assessmentType);
  const standingInstructions = [...extractPlanStandingInstructions(template)];
  const templateHasStaffMonitoringInstruction = standingInstructions.some((line) =>
    /dsp instructed|staff instructed|monitor for and immediately report/i.test(line),
  );
  const evaluation = evaluateGuidelinePlanRules(
    def,
    assessmentType,
    context,
    templateHasStaffMonitoringInstruction,
    getStaffMonitoringInstructions(def, assessmentType),
    true,
  );

  return evaluation.nursingInterventionsSummary
    ?? `Nursing interventions completed according to the ${def.displayName} Guideline.`;
}

export function getStaffMonitoringInstructions(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string | null {
  const config = getGuidelineRequirementConfig(def.id, assessmentType);
  return config?.staffMonitoringInstructions ?? null;
}

export function enrichFacilityPlanPrompts(
  plan: string,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  options: PlanEnrichmentOptions,
  enrichmentInput?: PlanEnrichmentInput,
): PlanEnrichmentResult {
  const reviewWarnings: string[] = [];
  let enrichedPlan = plan;
  let nursingInterventionsSummary: string | null = null;
  let staffEducationInstruction: string | null = null;
  let staffUnderstandingValue: string | null = null;
  let staffEducationGenerated = false;

  const template = getFacilityFormTemplate(def, assessmentType);
  const standingInstructions = new Set(extractPlanStandingInstructions(template));
  const templateHasStaffMonitoringInstruction = [...standingInstructions].some((line) =>
    /dsp instructed|staff instructed|monitor for and immediately report/i.test(line),
  );
  const explicitStaffMonitoringInstructions = getStaffMonitoringInstructions(def, assessmentType);
  const context = createPlanDocumentationContext(input, def, { ...enrichmentInput, plan });

  const ruleEvaluation = evaluateGuidelinePlanRules(
    def,
    assessmentType,
    context,
    templateHasStaffMonitoringInstruction,
    explicitStaffMonitoringInstructions,
    options.autoCompleteStaffEducation,
  );

  if (shouldPopulateNursingInterventionsFromRules(def, assessmentType, context)) {
    nursingInterventionsSummary = ruleEvaluation.nursingInterventionsSummary;
    const nursingInterventionsPrompt = resolveNursingInterventionsPrompt(template);
    if (nursingInterventionsSummary && nursingInterventionsPrompt) {
      enrichedPlan = setPromptValue(
        enrichedPlan,
        nursingInterventionsPrompt,
        nursingInterventionsSummary,
        standingInstructions,
      );
    }
  }

  const shouldGenerateStaffEducation =
    options.autoCompleteStaffEducation
    || detectStaffEducationProvided(input)
    || Boolean(explicitStaffMonitoringInstructions)
    || templateHasStaffMonitoringInstruction;

  if (shouldGenerateStaffEducation) {
    staffEducationInstruction = explicitStaffMonitoringInstructions ?? null;

    if (staffEducationInstruction) {
      enrichedPlan = insertLineBefore(
        enrichedPlan,
        STAFF_EDUCATION_PROMPT,
        staffEducationInstruction,
      );
    }

    if (ruleEvaluation.staffEducationApplicable) {
      staffEducationGenerated = true;
    }
  }

  const staffUnderstandingConfirmed = detectStaffUnderstandingConfirmed(input);
  if (staffEducationGenerated || staffUnderstandingConfirmed) {
    staffUnderstandingValue = ruleEvaluation.staffUnderstandingText;
    if (staffUnderstandingValue) {
      enrichedPlan = setPromptValue(
        enrichedPlan,
        STAFF_EDUCATION_PROMPT,
        staffUnderstandingValue,
        standingInstructions,
      );
    }
  }

  return {
    plan: enrichedPlan,
    nursingInterventionsSummary,
    staffEducationInstruction,
    staffUnderstandingValue,
    staffUnderstandingConfirmed,
    staffEducationGenerated,
    reviewWarnings,
  };
}

export function planDocumentsNursingInterventions(
  plan: string,
  def?: GuidelineDefinition,
  assessmentType?: AssessmentType,
): boolean {
  const standingInstructions = def && assessmentType
    ? new Set(extractPlanStandingInstructions(getFacilityFormTemplate(def, assessmentType)))
    : new Set<string>();
  const prompt = def && assessmentType
    ? resolveNursingInterventionsPrompt(getFacilityFormTemplate(def, assessmentType))
    : NURSING_INTERVENTIONS_PROMPT;
  if (!prompt) return false;
  const value = getPromptValue(plan, prompt, standingInstructions);
  return Boolean(value && value.trim().length > 0);
}

export function planDocumentsPirCompleted(
  plan: string,
  def?: GuidelineDefinition,
  assessmentType?: AssessmentType,
): boolean {
  const standingInstructions = def && assessmentType
    ? new Set(extractPlanStandingInstructions(getFacilityFormTemplate(def, assessmentType)))
    : new Set<string>();
  const value = getPromptValue(plan, 'Post Injury Report (PIR) completed:', standingInstructions);
  return Boolean(value && /completed/i.test(value));
}
