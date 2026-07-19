import type { GuidelineDefinition } from './types.ts';
import type { AssessmentType } from './facilityTemplateMode.ts';
import { STAFF_EDUCATION_PROMPT } from './facilityTemplateMode.ts';
import {
  detectNursingInterventionsCompleted,
  detectStaffUnderstandingConfirmed,
  extractClinicalFacts,
  type ClinicalFacts,
} from './clinicalFactExtraction.ts';
import {
  extractPlanSectionLines,
  extractPlanStandingInstructions,
  getFacilityFormTemplate,
} from './facilityFormTemplates.ts';
import {
  getGuidelineRequirementConfig,
} from './guidelineRequirementConfigs.ts';

const NURSING_INTERVENTIONS_PROMPT = 'Nursing interventions completed:';

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

function capitalizeFirstWord(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatAssessedAreas(areas: string[]): string {
  const normalized = areas.map((area) => area.toLowerCase());
  if (normalized.length === 0) return '';
  if (normalized.length === 1) return `${capitalizeFirstWord(normalized[0])} was assessed.`;
  if (normalized.length === 2) {
    return `${capitalizeFirstWord(normalized[0])} and ${normalized[1]} were assessed.`;
  }
  const last = normalized[normalized.length - 1];
  const rest = normalized.slice(0, -1).join(', ');
  return `${capitalizeFirstWord(rest)}, and ${last} were assessed.`;
}

function extractMedicationReviewSentence(input: string, facts: ClinicalFacts): string | null {
  const aspirinMatch = input.match(/\baspirin\s+81\s*mg\b/i);
  if (aspirinMatch) return 'Current aspirin use was reviewed.';

  if (facts.medications.length > 0) {
    const medList = facts.medications.join(', ');
    return `Current ${medList} use was reviewed.`;
  }

  if (/\b(?:taking|on|uses?)\s+(?:aspirin|eliquis|warfarin|plavix|blood thinner|anticoagulant)\b/i.test(input)) {
    return 'Current anticoagulant or antiplatelet medication use was reviewed.';
  }

  return null;
}

function buildFallFollowUpNursingInterventionsSummary(
  input: string,
  facts: ClinicalFacts,
): string {
  const assessedAreas: string[] = [];

  if (/\bvital signs\b|\bvitals\b/i.test(input) || facts.vitalSigns) {
    assessedAreas.push('vital signs');
  }
  if (/\bneurological\b|\bmental status\b/i.test(input) || facts.neurologicalAssessment) {
    assessedAreas.push('neurological and mental status');
  }
  if (/\bpain\b/i.test(input) || facts.painPresent !== null) {
    assessedAreas.push('pain');
  }
  if (/\bbruising\b|\bskin\b|\bvisible injury\b/i.test(input) || facts.visibleInjury) {
    assessedAreas.push('skin condition');
  }
  if (/\bmobility\b|\bambulat|\bwalker\b|\bgait\b|\btransfer\b|\brange of motion\b/i.test(input)) {
    assessedAreas.push('mobility');
  }

  const parts = ['Follow-up nursing assessment completed.'];
  if (assessedAreas.length > 0) {
    parts.push(formatAssessedAreas(assessedAreas));
  }

  const medicationReview = extractMedicationReviewSentence(input, facts);
  if (medicationReview) parts.push(medicationReview);

  if (parts.length === 1) {
    return 'Nursing interventions completed according to the Fall or Suspected Fall Guideline.';
  }

  return parts.join(' ');
}

function buildGenericNursingInterventionsSummary(
  def: GuidelineDefinition,
  input: string,
  facts: ClinicalFacts,
): string {
  if (def.id === 'fall' && /\bfollow[- ]?up\b/i.test(input)) {
    return buildFallFollowUpNursingInterventionsSummary(input, facts);
  }

  const eventPhrase = facts.eventType === 'fall'
    ? 'Resident assessed following reported fall.'
    : facts.eventType === 'head injury'
      ? 'Resident assessed following reported head injury.'
      : null;

  if (eventPhrase) return eventPhrase;

  return `Nursing interventions completed according to the ${def.displayName} Guideline.`;
}

export function buildNursingInterventionsSummary(
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string {
  const facts = extractClinicalFacts(input, def.id);

  if (def.id === 'fall' && (assessmentType === 'follow_up' || assessmentType === 'resolution' || /\bfollow[- ]?up\b/i.test(input))) {
    return buildFallFollowUpNursingInterventionsSummary(input, facts);
  }

  return buildGenericNursingInterventionsSummary(def, input, facts);
}

export function getStaffMonitoringInstructions(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string | null {
  const config = getGuidelineRequirementConfig(def.id, assessmentType);
  return config?.staffMonitoringInstructions ?? null;
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

export function enrichFacilityPlanPrompts(
  plan: string,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  options: PlanEnrichmentOptions,
): PlanEnrichmentResult {
  const reviewWarnings: string[] = [];
  let enrichedPlan = plan;
  let nursingInterventionsSummary: string | null = null;
  let staffEducationInstruction: string | null = null;
  let staffUnderstandingValue: string | null = null;
  let staffEducationGenerated = false;

  const template = getFacilityFormTemplate(def, assessmentType);
  const standingInstructions = new Set(extractPlanStandingInstructions(template));

  if (detectNursingInterventionsCompleted(input)) {
    nursingInterventionsSummary = buildNursingInterventionsSummary(input, def, assessmentType);
    enrichedPlan = setPromptValue(
      enrichedPlan,
      NURSING_INTERVENTIONS_PROMPT,
      nursingInterventionsSummary,
      standingInstructions,
    );
  }

  const shouldGenerateStaffEducation =
    options.autoCompleteStaffEducation
    || detectStaffEducationProvided(input)
    || Boolean(getStaffMonitoringInstructions(def, assessmentType));

  if (shouldGenerateStaffEducation) {
    staffEducationInstruction =
      getStaffMonitoringInstructions(def, assessmentType)
      ?? null;

    if (staffEducationInstruction) {
      enrichedPlan = insertLineBefore(
        enrichedPlan,
        STAFF_EDUCATION_PROMPT,
        staffEducationInstruction,
      );
      staffEducationGenerated = true;
    }
  }

  const staffUnderstandingConfirmed = detectStaffUnderstandingConfirmed(input);
  if (staffUnderstandingConfirmed) {
    staffUnderstandingValue = 'DSP verbalized understanding of the instructions provided.';
    enrichedPlan = setPromptValue(
      enrichedPlan,
      STAFF_EDUCATION_PROMPT,
      staffUnderstandingValue,
      standingInstructions,
    );
  } else if (staffEducationGenerated) {
    reviewWarnings.push('Confirm whether DSP verbalized or demonstrated understanding.');
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
  const value = getPromptValue(plan, NURSING_INTERVENTIONS_PROMPT, standingInstructions);
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
