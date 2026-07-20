import type { AssessmentField, MissingInfoCategory } from './types';
import { FALL_FOLLOW_UP_STAFF_MONITORING_INSTRUCTIONS } from './fallPlanConstants.ts';

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

function inferFollowUpAssessmentType(clinicalText: string): AssessmentType | null {
  if (/\bone emesis episode yesterday\b/i.test(clinicalText)) return 'follow_up';
  if (/\blast elevated temperature\b/i.test(clinicalText) && /\bcurrent(?:ly)?\b/i.test(clinicalText)) {
    return 'follow_up';
  }
  if (
    /\bno nausea or further vomiting\b/i.test(clinicalText)
    && /\b(?:emesis|vomit)/i.test(clinicalText)
  ) {
    return 'follow_up';
  }
  return null;
}

export function detectAssessmentType(clinicalText: string): AssessmentType {
  const text = clinicalText.toLowerCase();
  for (const entry of ASSESSMENT_TYPE_PATTERNS) {
    if (entry.patterns.some((pattern) => pattern.test(text))) {
      return entry.type;
    }
  }
  return inferFollowUpAssessmentType(clinicalText) ?? 'other';
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
  /** When true (default), auto-generate guideline-specific staff instruction content. Does not confirm understanding. */
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
    return `STAFF INSTRUCTION CONTENT:
- Do not document "${STAFF_EDUCATION_PROMPT}" unless the narrative explicitly confirms staff verbalized or demonstrated understanding.
- Do not invent staff education completion or understanding confirmation.`;
  }

  return `AUTO-GENERATE STAFF INSTRUCTION CONTENT (enabled by default):
Generate guideline-specific staff instruction content from the selected guideline library.
This setting does NOT authorize documenting staff verbalized or demonstrated understanding unless explicitly supported by the narrative.

1. Use the guideline-specific monitoring instruction derived from the facility template and staff education library.
2. Do NOT automatically complete "${STAFF_EDUCATION_PROMPT}" unless the narrative explicitly confirms staff verbalized or demonstrated understanding.
3. Leave the staff-understanding confirmation blank when not explicitly documented, and flag it for nurse review.

Example monitoring instruction for Fall follow-up:
${FALL_FOLLOW_UP_STAFF_MONITORING_INSTRUCTIONS}

Use guideline-specific symptoms and monitoring parameters from the selected guideline — not generic wording.`;
}

export function buildRoutineNursingInterventionsBlock(): string {
  return `ROUTINE NURSING INTERVENTIONS (under "Nursing interventions completed:"):

If the nurse did not explicitly list interventions, you MAY document only routine nursing actions that clearly occurred based on the assessment context.

Allowed examples when an assessment clearly occurred:
- Resident assessed following reported emesis.
- Respiratory assessment completed.
- Abdominal assessment completed.
- Intake and output reviewed.
- Resident monitored for recurrent vomiting.

Rules:
- Infer only routine nursing assessments and monitoring actions implied by the documented event and guideline.
- Do NOT invent medications, treatments, PRN administrations, provider orders, or specific clinical procedures not supported by the narrative.
- Do NOT document PCP/LAR notification as completed unless the narrative confirms it.`;
}

export function buildSubjectiveCompletionRules(): string {
  return `SUBJECTIVE COMPLETION RULES:

Do NOT copy, translate sentence-by-sentence, or paste the nurse's raw dictated text into Subjective.

Rewrite all reported information into professional EPSSLC nursing documentation while preserving only documented facts:
- report time, reporter name/title, and what was reported when available
- symptoms, events, and resident statements exactly as supported — never expanded beyond the input

WRONG (raw dictation copied or translated literally):
"이 사람이 아까 토했어..."

CORRECT (professional nursing rewrite, same facts):
"DSP reported that the resident experienced one episode of emesis after dinner at approximately 1630. DSP reported the resident ate rapidly prior to the episode. Emesis contained undigested food."

Convert conversational, informal, or non-English input into the documentation style of an experienced Texas SSLC RN.`;
}

export function buildObjectiveCompletionRules(): string {
  return `OBJECTIVE COMPLETION RULES:

Keep every required template label on its own line. Preserve "See Interactive View Assessment." exactly.

For narrative assessment fields — especially "Other relevant assessment findings:" and similar open-ended prompts:
- Write professional nursing documentation, not key-value fragments or the word "unknown".
- Synthesize ALL supported objective findings from the entire clinical input and supplements into complete nursing sentences.
- Cross-reference the full narrative before leaving any field blank — if the information appears anywhere in the input, include it here.

Example style:
Respirations even and unlabored.
No coughing observed.
No signs of aspiration.
Abdomen soft and non-tender.
No additional change in condition.

Never write "unknown" when the information exists elsewhere in the clinical input.
Do not invent findings not supported by the narrative.`;
}

export function buildSbarCompletionRules(): string {
  return `SBAR COMPLETION RULES (when SBAR is requested):

Write like an experienced RN communicating with a provider — not a one-line summary.

S — Situation:
- Expand with supported event details: what happened, when, where, and key descriptors.
- WRONG: "Resident experienced vomiting."
- CORRECT: "Resident experienced one episode of emesis at approximately 1630 after dinner. Emesis contained undigested food."

B — Background:
- Include relevant supported history, medications, baseline context, and preceding events from the narrative.

A — Assessment:
- Expand with supported objective findings, assessment results, and completed nursing actions.
- Include specific supported details — not generic summaries.

R — Recommendation:
- Use guideline-based, specific language.
- Avoid vague phrases such as "Continue to monitor" without guideline-specific detail.
- Do not claim provider notification occurred unless supported.`;
}

export function buildDocumentationStyleRules(): string {
  return `DOCUMENTATION STYLE (Texas SSLC / EPSSLC):

Write like an experienced RN in a Texas State Supported Living Center — not like generic AI output.

Avoid:
- Repetitive wording
- Generic sentences such as "Continue to monitor" without specific guideline detail
- AI-sounding phrasing, speculation, or unsupported conclusions
- Phrases such as "It seems..." or "may have been related to..."

Prefer specific, guideline-based nursing language drawn from the selected guideline and documented facts.`;
}

export function buildFacilityTemplateQualityRules(
  autoCompleteStaffEducation: boolean,
): string {
  return `${buildDocumentationStyleRules()}

${buildSubjectiveCompletionRules()}

${buildObjectiveCompletionRules()}

${buildRoutineNursingInterventionsBlock()}

${buildStaffEducationAutoCompleteBlock(autoCompleteStaffEducation)}

${buildSbarCompletionRules()}`;
}

export function buildFacilityPlanComplianceRules(): string {
  return `FACILITY PLAN COMPLIANCE (mandatory):

The Plan section must be assembled ONLY from:
1. The PLAN section of the EXACT FILLABLE FACILITY TEMPLATE
2. The FACILITY GUIDELINE PLAN LIBRARY predefined plan statements

Rules:
- Include every predefined plan statement in the same order shown in the template and plan library.
- Preserve every standing instruction line ending with "." exactly as written — even when the action did not occur.
- Fill colon-ended prompts only with information supported by the nurse narrative.
- Do NOT generate generic plan text such as "Continue to monitor."
- Do NOT invent medications, treatments, provider orders, or notifications.
- Do NOT substitute AI-generated plan wording for predefined facility plan statements.
- Select the correct predefined Plan for the selected guideline. Facility compliance takes priority over AI creativity.`;
}

export function buildFacilityTemplatePlanRules(_autoCompleteStaffEducation: boolean): string {
  return `PLAN PROMPT RULES IN FACILITY TEMPLATE MODE:

The Plan must use the FACILITY GUIDELINE PLAN LIBRARY and EXACT FILLABLE FACILITY TEMPLATE as the only sources.

1. Include every predefined plan statement from the plan library in order.
2. Preserve every standing facility instruction line exactly as written in the template.
3. Fill colon-ended prompts only with supported user-provided information.
4. Do not replace facility plan statements with generic AI wording.
5. Standing instructions ending with "." are facility requirements — preserve them even when the action was not confirmed.
6. Do not state PCP or LAR was notified unless the user confirms notification occurred.`;
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
- Do NOT copy or translate the raw dictated text. Rewrite into professional nursing documentation.
- Subjective information is reported by the individual, DSP, staff, family, or another person.
- When reported information is used, include when available: report time, reporter name, reporter title/role, and what was reported.
- Preferred style: "At 08:37, John Jones, DSP, reported that the individual vomited in the living room."
- Do not fabricate report time, reporter name, reporter title, direct quotes, or reported symptoms.
- Use quotation marks only when the user clearly provides an exact quote; otherwise paraphrase accurately in professional nursing language.

OBJECTIVE (O:):
- Preserve exactly on its own line: See Interactive View Assessment.
- Keep every required objective prompt label from the guideline visible even when blank.
- After each objective prompt label, write professional EPSSLC nursing narrative — not short fragments, "unknown", or key-value pairs everywhere.
- For "Other relevant assessment findings:" and similar narrative fields, synthesize all supported objective findings from the full clinical input.
- Prefer complete nursing sentences such as: "Abdomen soft and non-tender upon assessment. No pain reported during abdominal assessment. Respirations even and unlabored. No signs of aspiration or respiratory distress observed."
- WRONG objective style: "Abdominal soft to touch. No pain." or "unknown"
- Add values only for findings supported by the narrative anywhere in the input.
- Do not invent normal findings not supported by the narrative; do synthesize supported findings that appear elsewhere in the input.

ASSESSMENT (A:):
- Use the assessment wording/label from the selected facility template when defined.
- Do not add a medical diagnosis unless explicitly provided.
- Do not infer pneumonia, aspiration pneumonia, infection, fracture, bowel obstruction, dehydration, medication adverse reaction, or neurological change.
- For Resolution assessment type, use "resolved" only when the user explicitly states the issue resolved.

PLAN (P:):
- Use ONLY the FACILITY GUIDELINE PLAN LIBRARY and EXACT FILLABLE FACILITY TEMPLATE Plan section.
- Include every predefined plan statement in the same order.
- Preserve every standing facility instruction line exactly as written in the template.
- Fill colon-ended prompts only with supported user-provided information.
- Do not replace facility plan statements with generic AI wording such as "Continue to monitor."
- Preserve facility instruction statements ending with "." even when the action was not confirmed.
- Do not state PCP was notified unless the user confirms notification occurred.
- Do NOT invent medications or treatments.`;

export const FACILITY_TEMPLATE_PLAN_RULES = buildFacilityTemplatePlanRules(true);
