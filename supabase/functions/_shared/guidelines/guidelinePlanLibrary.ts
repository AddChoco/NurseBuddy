import type { GuidelineId } from './types.ts';
import type { GuidelineDefinition } from './types.ts';
import type { AssessmentType } from './facilityTemplateMode.ts';
import { lookupGuidelineDefinition } from './guidelineDefinitions.ts';
import {
  extractPlanCompletionPrompts,
  extractPlanSectionLines,
  extractPlanStandingInstructions,
  getFacilityFormTemplate,
} from './facilityFormTemplates.ts';

export interface GuidelinePlanLibraryEntry {
  /** Exact predefined plan lines from the facility fillable template PLAN section */
  predefinedPlanStatements: string[];
  /** Colon-ended prompts that may receive supported values */
  completionPrompts: string[];
  /** Standing facility instruction lines ending with "." that must be preserved exactly */
  standingInstructions: string[];
}

export function getFacilityPlanLibraryEntry(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): GuidelinePlanLibraryEntry {
  const template = getFacilityFormTemplate(def, assessmentType);
  const predefinedPlanStatements = extractPlanSectionLines(template);

  return {
    predefinedPlanStatements,
    completionPrompts: extractPlanCompletionPrompts(template),
    standingInstructions: extractPlanStandingInstructions(template),
  };
}

export function getGuidelinePlanLibraryEntry(
  guidelineId: GuidelineId,
  assessmentType: AssessmentType,
): GuidelinePlanLibraryEntry {
  const def = lookupGuidelineDefinition(guidelineId);
  return getFacilityPlanLibraryEntry(def, assessmentType);
}

function formatPlanList(title: string, items: string[]): string {
  if (items.length === 0) return `${title}:\n- None specified.`;
  return `${title}:\n${items.map((item) => `- ${item}`).join('\n')}`;
}

export function buildGuidelinePlanLibraryBlock(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string {
  const plan = getFacilityPlanLibraryEntry(def, assessmentType);

  return `=== FACILITY GUIDELINE PLAN LIBRARY (mandatory Plan source — do not invent generic plan text) ===
Guideline: ${def.displayName}
Assessment type: ${assessmentType}

The SOAP Plan must be assembled ONLY from the predefined plan statements below and the PLAN section of the EXACT FILLABLE FACILITY TEMPLATE.
These two sources must match. Facility compliance is the highest priority — not AI-generated plan wording.

PLAN ASSEMBLY RULES:
1. Include every predefined plan statement from this library in the same order.
2. Preserve every standing instruction line ending with "." exactly as written — even when the action did not occur.
3. Fill colon-ended prompts only with information supported by the nurse narrative.
4. Do not replace facility plan statements with generic wording such as "Continue to monitor."
5. Do not omit any predefined plan statement because the nurse narrative omitted it.
6. Do not invent medications, treatments, provider orders, or notifications.

${formatPlanList('PREDEFINED PLAN STATEMENTS (use exactly — populate colon prompts only when supported)', plan.predefinedPlanStatements)}

${formatPlanList('COMPLETION PROMPTS (fill only when supported; leave blank otherwise)', plan.completionPrompts)}

${formatPlanList('STANDING INSTRUCTIONS (preserve exactly on their own lines)', plan.standingInstructions)}`;
}

export function validatePlanAgainstLibrary(
  planText: string,
  guidelineId: GuidelineId,
  assessmentType: AssessmentType,
): string[] {
  const plan = getGuidelinePlanLibraryEntry(guidelineId, assessmentType);
  const errors: string[] = [];
  const lower = planText.toLowerCase();

  for (const statement of plan.predefinedPlanStatements) {
    if (statement.endsWith(':')) {
      if (!planText.includes(statement)) {
        errors.push(`Required facility Plan prompt missing: ${statement}`);
      }
      continue;
    }

    if (!planText.includes(statement)) {
      errors.push(`Required predefined Plan statement missing: ${statement}`);
    }
  }

  if (/\bcontinue to monitor\b/i.test(planText) && !plan.predefinedPlanStatements.some((line) => /continue to monitor/i.test(line))) {
    errors.push('Plan contains generic "Continue to monitor" wording not defined in the facility Plan library');
  }

  if (plan.standingInstructions.length > 0) {
    const missingStanding = plan.standingInstructions.filter((line) => !planText.includes(line));
    if (missingStanding.length > 0) {
      errors.push(`Standing facility Plan instructions missing: ${missingStanding.slice(0, 2).join('; ')}`);
    }
  }

  if (plan.predefinedPlanStatements.length === 0 && !lower.trim()) {
    errors.push('Plan section is empty but no predefined plan statements were found for this guideline');
  }

  return errors;
}

export function listGuidelinePlanLibraryIds(): GuidelineId[] {
  return [
    'vomiting',
    'elevated_temperature',
    'uti',
    'fall',
    'head_injury',
    'suspected_fracture_dislocation',
    'pica',
    'skin_impairment',
    'respiratory',
    'adventitious_lung_sounds',
    'abdominal_distention_pain',
    'constipation',
    'diarrhea',
    'enteral_feeding_tolerance',
    'enteral_tube_insertion',
    'hypothermia',
    'hypoglycemia',
    'hyperglycemia',
    'medication_change',
    'seizure',
    'transfer_out_back',
    'post_sedation',
    'post_anesthesia',
    'crisis_physical_restraint',
    'crisis_chemical_restraint',
    'crisis_mechanical_restraint',
    'pain',
    'other',
  ];
}
