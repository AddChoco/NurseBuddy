import type { AssessmentField, MissingInfoCategory } from './types';

export type AssessmentType =
  | 'initial'
  | 'follow_up'
  | 'resolution'
  | 'procedure'
  | 'return'
  | 'other';

const ASSESSMENT_TYPE_PATTERNS: { type: AssessmentType; patterns: RegExp[] }[] = [
  { type: 'resolution', patterns: [/resolution assessment/i, /closing assessment/i, /closing guideline/i] },
  { type: 'follow_up', patterns: [/follow-up assessment/i, /follow up assessment/i, /follow-up/i, /reassessment/i] },
  { type: 'initial', patterns: [/initial assessment/i, /initial evaluation/i] },
  { type: 'procedure', patterns: [/procedure assessment/i, /post procedure/i, /post-procedure/i] },
  { type: 'return', patterns: [/return assessment/i, /transfer back/i, /returned from/i] },
];

export function detectAssessmentType(clinicalText: string): AssessmentType {
  const text = clinicalText.toLowerCase();
  for (const entry of ASSESSMENT_TYPE_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.type;
    }
  }
  return 'other';
}

const CLINICALLY_USEFUL_LABEL_PATTERNS = [
  /report time/i,
  /reporter name/i,
  /reporter title/i,
  /exact intervention time/i,
  /notification time/i,
  /name\/title of the person notified/i,
  /date\/time/i,
];

const CONDITIONAL_LABEL_PATTERNS = [
  /pcp notification/i,
  /provider notification/i,
  /provider order/i,
  /rncm notification/i,
  /effectiveness/i,
  /resolution status/i,
  /explicit resolution/i,
  /lar.*notif/i,
  /respiratory therapy notification/i,
  /rt notification/i,
];

export function inferMissingInfoCategory(field: AssessmentField): MissingInfoCategory {
  if (field.category) return field.category;

  if (CONDITIONAL_LABEL_PATTERNS.some((pattern) => pattern.test(field.label))) {
    return 'conditional';
  }

  if (CLINICALLY_USEFUL_LABEL_PATTERNS.some((pattern) => pattern.test(field.label))) {
    return 'clinically_useful';
  }

  return field.critical === false ? 'clinically_useful' : 'facility_required';
}

function hasMedicationOrInterventionEvidence(text: string): boolean {
  return /administered|given|prn|medication|suppository|dulcolax|tylenol|acetaminophen|mar|emar|intervention completed|ice pack|nebulizer/i.test(text);
}

function hasAbnormalFindingsOrNotificationEvidence(text: string): boolean {
  return /abnormal|notified|notify pcp|pcp called|provider called|complication|worsening|elevated|fever|pain score|ineffective|abnormal finding/i.test(text);
}

function hasProviderOrderEvidence(text: string): boolean {
  return /provider order|physician order|pcp order|orders received|as ordered|new order|discontinued/i.test(text);
}

export function shouldCheckMissingField(
  field: AssessmentField,
  clinicalText: string,
  assessmentType: AssessmentType = detectAssessmentType(clinicalText),
): boolean {
  const category = inferMissingInfoCategory(field);
  if (category !== 'conditional') return true;

  const label = field.label;
  const conditionalWhen = field.conditionalWhen?.toLowerCase() ?? '';

  if (/pcp|provider.*notif/i.test(label) || conditionalWhen.includes('pcp')) {
    return hasAbnormalFindingsOrNotificationEvidence(clinicalText);
  }

  if (/provider order/i.test(label) || conditionalWhen.includes('provider order')) {
    return hasProviderOrderEvidence(clinicalText) || hasAbnormalFindingsOrNotificationEvidence(clinicalText);
  }

  if (/effectiveness/i.test(label) || conditionalWhen.includes('medication')) {
    return hasMedicationOrInterventionEvidence(clinicalText);
  }

  if (/resolution|resolved/i.test(label) || conditionalWhen.includes('resolution')) {
    return assessmentType === 'resolution';
  }

  if (/rt notification|respiratory therapy/i.test(label)) {
    return /respiratory distress|shortness of breath|dyspnea|suction|oxygen therapy|breathing treatment|hypoxia|desat/i.test(clinicalText);
  }

  return true;
}

export function getFieldByLabel(
  def: { missingInformationChecklist: AssessmentField[]; assessment: { requiredFields: AssessmentField[]; optionalFields: AssessmentField[] } },
  label: string,
): AssessmentField | undefined {
  return (
    def.missingInformationChecklist.find((field) => field.label === label)
    ?? def.assessment.requiredFields.find((field) => field.label === label)
    ?? def.assessment.optionalFields.find((field) => field.label === label)
  );
}

export type DocumentationOutputMode = 'facility_template' | 'narrative_soap';

export const DEFAULT_DOCUMENTATION_OUTPUT_MODE: DocumentationOutputMode = 'facility_template';

export function resolveDocumentationOutputMode(
  mode?: string | null,
): DocumentationOutputMode {
  if (mode === 'narrative_soap') return 'narrative_soap';
  return DEFAULT_DOCUMENTATION_OUTPUT_MODE;
}

export function isFacilityTemplateMode(mode?: string | null): boolean {
  return resolveDocumentationOutputMode(mode) === 'facility_template';
}

export interface FacilityTemplateOptions {
  /** When true (default), auto-complete standard staff education prompts after nursing instructions are documented. */
  autoCompleteStaffEducation?: boolean;
}

export const DEFAULT_FACILITY_TEMPLATE_OPTIONS: Required<FacilityTemplateOptions> = {
  autoCompleteStaffEducation: true,
};

export function resolveFacilityTemplateOptions(
  options?: FacilityTemplateOptions,
): Required<FacilityTemplateOptions> {
  return {
    autoCompleteStaffEducation: options?.autoCompleteStaffEducation ?? DEFAULT_FACILITY_TEMPLATE_OPTIONS.autoCompleteStaffEducation,
  };
}

export const STAFF_EDUCATION_PROMPT = 'Staff verbalized or demonstrated understanding of instructions provided:';

export function buildStaffEducationAutoCompleteBlock(
  autoCompleteStaffEducation: boolean,
): string {
  if (!autoCompleteStaffEducation) {
    return `STAFF EDUCATION DOCUMENTATION:
- Do not document "${STAFF_EDUCATION_PROMPT}" unless the narrative explicitly confirms staff verbalized or demonstrated understanding.
- Do not invent staff education completion.`;
  }

  return `STAFF EDUCATION AUTO-COMPLETION (enabled by default):
When nursing instructions, DSP monitoring instructions, or other staff education are documented in the Plan, you MAY automatically complete:
${STAFF_EDUCATION_PROMPT}
DSP verbalized understanding of the instructions provided.

Use this only when instructions were provided in the note. Do NOT use it when the narrative explicitly states staff did not verbalize understanding or education was not provided.`;
}

export function buildFacilityTemplatePlanRules(autoCompleteStaffEducation: boolean): string {
  const staffEducationRule = autoCompleteStaffEducation
    ? `- ${STAFF_EDUCATION_PROMPT} — may be auto-completed per STAFF EDUCATION AUTO-COMPLETION rules when nursing instructions are documented`
    : `- ${STAFF_EDUCATION_PROMPT} — leave blank unless explicitly supported by the narrative`;

  return `PLAN PROMPT RULES IN FACILITY TEMPLATE MODE:

The Plan must use the facility guideline template as the base. Preserve every standing facility instruction line exactly as written in the template. Only populate blank colon-ended prompts with supported information. Do not replace facility instructions with generic AI wording.

1. Status / completion prompts — populate only when supported by the narrative:
   - PIR completed:
   - PCP notified:
   - LAR notified:
   - Nursing interventions completed:
   ${staffEducationRule}

2. Standing facility instruction statements — preserve these exactly on their own lines even when the action was not confirmed. Do not rewrite, shorten, or replace them:
   - Continue temperature assessments according to the Elevated Temperature Guideline.
   - Nurse to notify PCP of abnormal findings and complications.
   - DSP instructed to monitor for and immediately report...
   - Assess every shift for 24 hours after resident is symptom free.
   - Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report when continued follow-up is required.

Standing instructions are facility requirements, not claims that the action already occurred.`;
}

export const FACILITY_TEMPLATE_COMPLETION_DIRECTIVE = `Complete the exact facility template. Template fidelity is the highest priority.

Preserve every facility prompt label, standalone instruction, and prompt order exactly as defined in the EXACT FILLABLE FACILITY TEMPLATE. Fill the template rather than rewriting it into a generic SOAP note.

Use natural professional nursing language inside the values entered after each prompt — especially in Objective — while keeping every original prompt label visible on its own line.`;

export const FACILITY_TEMPLATE_MODE_INSTRUCTIONS = `FACILITY TEMPLATE COMPLETION MODE (default for SOAP Note):

You are completing the selected EPSSLC facility guideline template exactly — NOT writing a generic ChatGPT SOAP note.

The generated SOAP note MUST preserve the facility template exactly. Template fidelity is the highest priority.

DO NOT:
- Merge multiple facility prompts into one line or one label
- Combine separate prompts such as "Date/Time:" and "Description of Vomitus:" into "Date/Time/Description of Vomitus: 1730, undigested food"
- Convert the template into unstructured paragraph form without prompt labels
- Replace facility prompts with bullet lists
- Remove required facility prompts because information is missing
- Collapse multiple facility prompts into one paragraph
- Change the order of prompts defined by the guideline
- Rewrite standing facility Plan instructions with generic AI wording
- Rewrite the note like ChatGPT wrote a SOAP note

The output should look like a completed EPSSLC facility form — as if a nurse filled in the facility form, not a rewritten clinical narrative.

NEVER MERGE TEMPLATE PROMPTS:
Every prompt defined by the facility guideline must remain an independent prompt on its own line.

WRONG:
Date/Time/Description of Vomitus: 1730, undigested food

CORRECT:
Date/Time:
1730

Description of Vomitus:
Undigested food

FORM PRESERVATION RULES:
1. Use the facility section labels and prompt order from the selected guideline (e.g., S:, O:, A:, P: or SUBJECTIVE:, OBJECTIVE:, etc.) — match the guideline exactly.
2. Every facility prompt ending with ":" MUST remain visible on its own line as an independent label.
3. Enter supported values on the line immediately following the prompt label, or after the colon on the same line ONLY when a single short value belongs to that one prompt. Never combine two prompt labels on one line.
4. If no information is available for a colon-ended prompt, LEAVE THE PROMPT IN PLACE. Do not delete it. Do not omit it. Leave the value blank.
5. Standalone facility statements ending with "." must be preserved exactly as written (e.g., "See Interactive View Assessment." and "Nurse to notify PCP of abnormal findings and complications.").
6. Do not add unsupported findings, diagnoses, interventions, notifications, instructions, medication details, or outcomes.
7. Track missing information separately — do not insert assumptions into the SOAP note.

EXAMPLE COMPLETED FORM STYLE (adapt prompts to the selected guideline — do not invent content):

S:
At 20:15, DSP reported that the individual was found on the floor beside the bed. The fall was unwitnessed.

O:
See Interactive View Assessment.
Other relevant assessment findings:

Individual resting quietly in bed. Respirations even and unlabored. No signs of aspiration or respiratory distress noted. Abdomen soft and non-tender. No pain reported during abdominal assessment. Vital signs within normal limits.

A:
Fall Follow-up.

P:
Nursing interventions completed:
Individual assessed following reported fall.
Nurse to notify oncoming nurse via 24-hour report/nurse-to-nurse if follow-up is indicated.
Staff verbalized or demonstrated understanding of instructions provided:
DSP verbalized understanding of the instructions provided.

(Include only supported information from the current input. Leave any unsupported prompt label in place with no fabricated entry.)

SUBJECTIVE (S:):
- Subjective information is reported by the individual, DSP, staff, family, or another person.
- When reported information is used, include when available: report time, reporter name, reporter title/role, and what was reported.
- Preferred style: "At 08:37, John Jones, DSP, reported that the individual vomited in the living room."
- Do not fabricate report time, reporter name, reporter title, direct quotes, or reported symptoms.
- Use quotation marks only when the user clearly provides an exact quote; otherwise paraphrase accurately.

OBJECTIVE (O:):
- Preserve exactly on its own line: See Interactive View Assessment.
- Keep every required objective prompt label from the guideline visible even when blank.
- After each objective prompt label, write professional EPSSLC nursing narrative — not short fragments or key-value pairs everywhere.
- Prefer complete nursing sentences such as: "Abdomen soft and non-tender upon assessment. No pain reported during abdominal assessment. Respirations even and unlabored. No signs of aspiration or respiratory distress observed. Vital signs remain within normal limits."
- WRONG objective style: "Abdominal soft to touch. No pain."
- Add values only for findings supported by the narrative.
- Never automatically add normal findings such as vital signs WNL, neuro unchanged, skin intact, breathing unlabored, no acute distress, stable, alert and oriented, or ambulating well unless explicitly provided.

ASSESSMENT (A:):
- Use the assessment wording/label from the selected facility template when defined.
- Do not add a medical diagnosis unless explicitly provided.
- Do not infer pneumonia, aspiration pneumonia, infection, fracture, bowel obstruction, dehydration, medication adverse reaction, or neurological change.
- For Resolution assessment type, use "resolved" only when the user explicitly states the issue resolved.

PLAN (P:):
- Use the facility guideline template as the base.
- Preserve every standing facility instruction line exactly as written in the template.
- List each facility Plan prompt from the guideline in the same order, each on its own line.
- Fill colon-ended prompts only with supported user-provided information.
- Do not replace facility instructions with generic AI wording such as "Continue to monitor" when the template already provides specific standing instructions.
- Preserve facility instruction statements ending with "." even when the action was not confirmed.
- Do not state PCP was notified unless the user confirms notification occurred.`;

export const FACILITY_TEMPLATE_PLAN_RULES = buildFacilityTemplatePlanRules(true);
