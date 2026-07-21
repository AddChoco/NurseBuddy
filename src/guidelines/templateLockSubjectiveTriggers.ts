import type { AssessmentType } from './facilityTemplateMode';
import type { GuidelineDefinition } from './types';

const PLACEHOLDER_TRIGGER_PATTERN = /^(?:n\/?a|none|unknown|not (?:available|documented|provided)|unable to (?:determine|assess))\.?$/i;
const TEMPLATE_ARTIFACT_PATTERN = /^(?:subjective|assessment trigger|reason for assessment)\s*:?$/i;
const TRIGGER_CONTEXT_PATTERN = /\b(?:reported|reports?|complains?|follow[- ]?up|reassessment|resolution|initial assessment|procedure|return(?:ed)?|per (?:the )?(?:facility )?guideline|due to|because of|following|after)\b/i;
const OBJECTIVE_ONLY_PATTERN = /\b(?:resting comfortably|vital signs?|blood pressure|pulse|heart rate|respirations?|oxygen saturation|spo2|temperature|administered|given|observed|measured)\b/i;

/**
 * Returns true when model output cannot safely serve as the Subjective reason
 * for completing the template-locked note.
 */
export function isInvalidSubjectiveAssessmentTrigger(value: string): boolean {
  const trigger = value.trim();
  if (!trigger) return true;
  if (PLACEHOLDER_TRIGGER_PATTERN.test(trigger)) return true;
  if (TEMPLATE_ARTIFACT_PATTERN.test(trigger)) return true;

  return OBJECTIVE_ONLY_PATTERN.test(trigger) && !TRIGGER_CONTEXT_PATTERN.test(trigger);
}

function getAssessmentTypeLabel(assessmentType: AssessmentType): string {
  switch (assessmentType) {
    case 'initial':
      return 'initial assessment';
    case 'follow_up':
      return 'follow-up assessment';
    case 'resolution':
      return 'resolution assessment';
    case 'procedure':
      return 'procedure assessment';
    case 'return':
      return 'return assessment';
    default:
      return 'assessment';
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function buildElevatedTemperatureTrigger(input: string, terminology: string): string | null {
  const priorTemperature = input.match(
    /last elevated temperature was\s+(\d+(?:\.\d+)?\s*°?\s*F)\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{3,4})/i,
  );
  if (!priorTemperature) return null;

  const temperature = priorTemperature[1].replace(/\s+/g, '').replace(/F$/i, '°F').replace(/°°/g, '°');
  return `${capitalize(terminology)} is on Elevated Temperature Guideline following a temperature of ${temperature} on ${priorTemperature[2]} at ${priorTemperature[3]}.`;
}

function buildVomitingTrigger(input: string): string | null {
  const episode = input.match(
    /\b(one|two|three|\d+)\s+(?:emesis|vomiting)\s+episodes?\s+(yesterday(?:\s+at\s+\d{3,4})?(?:\s+after\s+[^.]+)?)/i,
  );
  if (!episode || !/\bDSP reported\b/i.test(input)) return null;

  return `DSP reported ${episode[1].toLowerCase()} episode${episode[1].toLowerCase() === 'one' ? '' : 's'} of vomiting ${episode[2].trim()}.`;
}

/**
 * Builds a deterministic trigger without inferring who reported the event or
 * adding symptoms and findings that were not supplied by the nurse.
 */
export function buildGuidelineSubjectiveTrigger(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  input: string,
  terminology: string,
): string {
  if (def.id === 'elevated_temperature') {
    const trigger = buildElevatedTemperatureTrigger(input, terminology);
    if (trigger) return trigger;
  }

  if (def.id === 'vomiting') {
    const trigger = buildVomitingTrigger(input);
    if (trigger) return trigger;
  }

  return `${def.displayName} ${getAssessmentTypeLabel(assessmentType)} completed per facility guideline.`;
}
