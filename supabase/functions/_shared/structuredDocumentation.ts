import type { GuidelineDefinition } from './guidelines/types.ts';
import { detectAssessmentType, type AssessmentType } from './guidelines/facilityTemplateMode.ts';
import type { DocumentationOutputMode } from './guidelines/facilityTemplateMode.ts';
import {
  DEFAULT_DOCUMENTATION_OUTPUT_MODE,
  FACILITY_TEMPLATE_COMPLETION_DIRECTIVE,
  FACILITY_TEMPLATE_MODE_INSTRUCTIONS,
  buildFacilityTemplatePlanRules,
  buildFacilityPlanComplianceRules,
  isFacilityTemplateMode,
  resolveFacilityTemplateOptions,
  type FacilityTemplateOptions,
} from './guidelines/facilityTemplateMode.ts';
import {
  buildGuidelineContextBlock,
  getAssessmentInstructionsForType,
  getDocumentationTypeInstructions,
} from './guidelines/guidelineEngine.ts';
import { lookupGuidelineByDisplayName } from './guidelines/guidelineDefinitions.ts';
import { extractClinicalFacts } from './guidelines/clinicalFactExtraction.ts';
import { inputDocumentsEventTime, outputIncludesDocumentedEventTime } from './guidelines/eventTimeParsing.ts';
import { validatePlanAgainstLibrary } from './guidelines/guidelinePlanLibrary.ts';
import {
  enrichFacilityPlanPrompts,
  planDocumentsNursingInterventions,
  planDocumentsPirCompleted,
  type PlanEnrichmentResult,
} from './guidelines/planPromptEnrichment.ts';
import {
  enrichFacilitySoapSections,
  extractSubjectivePromptsFromTemplate,
  subjectivePromptHasValue,
} from './guidelines/soapSectionEnrichment.ts';
import {
  extractColonPromptsFromTemplate,
  getFacilityFormTemplate,
} from './guidelines/facilityFormTemplates.ts';
import { buildDocumentationQualityCheck } from './guidelines/documentationQualityCheck.ts';

export interface StructuredSoap {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface StructuredSbar {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

export interface QualityCheckItem {
  type: "missing_information" | "validation" | "unsupported_removed";
  message: string;
}

export interface StructuredQualityCheckCompleteness {
  provided: string[];
  missing: string[];
  scorePercent?: number;
  categorizedMissing?: Array<{
    label: string;
    category: 'facility_required' | 'clinically_useful' | 'conditional';
    reason?: string;
  }>;
}

export interface StructuredDocumentationResponse {
  soap: StructuredSoap;
  sbar?: StructuredSbar | null;
  qualityCheck?: QualityCheckItem[];
  qualityCheckCompleteness?: StructuredQualityCheckCompleteness;
}

export interface ValidatedStructuredDocumentation {
  soap: StructuredSoap;
  soapText: string;
  sbar?: StructuredSbar;
  sbarText?: string;
  qualityCheck: QualityCheckItem[];
  completeness?: StructuredQualityCheckCompleteness;
}

export interface AiValidationResult {
  isValid: boolean;
  errors: string[];
  completeness: StructuredQualityCheckCompleteness;
  qualityCheckItems: QualityCheckItem[];
}

const INVENTED_FINDING_PATTERNS: { pattern: RegExp; requiresInput: RegExp; message: string }[] = [
  { pattern: /no loss of consciousness/i, requiresInput: /loss of consciousness|loc|unconscious|no loc|denies loc/i, message: "Loss of consciousness status not provided" },
  { pattern: /no head (?:impact|strike|injury)/i, requiresInput: /head impact|head strike|struck head|hit head|no head impact|denies head/i, message: "Head impact status not provided" },
  { pattern: /neurological status (?:remains )?unchanged/i, requiresInput: /neuro|neurologic|mental status|oriented|pupil|gcs|baseline/i, message: "Neurological assessment not provided" },
  { pattern: /mental status (?:remains )?unchanged/i, requiresInput: /mental status|neuro|oriented|alert|baseline/i, message: "Mental status assessment not provided" },
  { pattern: /vital signs (?:are )?(?:stable|within normal limits|wnl)/i, requiresInput: /vital signs|vitals|bp|blood pressure|heart rate|respiratory rate|temp|temperature|spo2|within normal limits|vitals stable/i, message: "Vital signs not provided" },
  { pattern: /vitals (?:are )?(?:stable|wnl|within normal limits)/i, requiresInput: /vital signs|vitals|within normal limits|vitals stable|vss/i, message: "Vital signs not provided" },
  { pattern: /range of motion intact/i, requiresInput: /range of motion|rom|movement|mobility|gait|transfer/i, message: "Range-of-motion or mobility assessment not provided" },
  { pattern: /no pain with movement/i, requiresInput: /pain with movement|movement.*pain|rom.*pain|pain.*rom/i, message: "Pain with movement not assessed" },
  { pattern: /skin intact/i, requiresInput: /skin assessment|skin finding|wound|bruise|abrasion|erythema|pressure injury|visible injury|no visible injury|injury noted/i, message: "Skin assessment not provided" },
  { pattern: /breathing unlabored/i, requiresInput: /breath|respiratory|dyspnea|labored|lung|spo2|oxygen|respirations/i, message: "Respiratory assessment not provided" },
  { pattern: /no acute distress/i, requiresInput: /distress|respiratory|dyspnea|pain|discomfort/i, message: "Distress assessment not provided" },
  { pattern: /returned to baseline/i, requiresInput: /baseline|returned to baseline|back to baseline|at baseline/i, message: "Baseline return not confirmed" },
  { pattern: /alert and oriented(?: x\d)?/i, requiresInput: /alert|oriented|mental status|neuro/i, message: "Mental status not provided" },
  { pattern: /pcp was notified/i, requiresInput: /pcp.*notified|provider.*notified|called pcp|notified pcp|physician notified/i, message: "PCP notification not confirmed" },
  { pattern: /provider was notified/i, requiresInput: /provider.*notified|pcp.*notified/i, message: "Provider notification not confirmed" },
  { pattern: /lar was notified/i, requiresInput: /lar.*notified|guardian.*notified|family notified/i, message: "LAR notification not confirmed" },
  { pattern: /staff verbalized understanding/i, requiresInput: /staff verbalized|staff demonstrated|understanding|instructions provided|education provided/i, message: "Staff education not provided" },
  { pattern: /no visible injury(?: was noted)?/i, requiresInput: /visible injury|no visible injury|injury noted|bruise|laceration|abrasion|swelling/i, message: "Visible injury assessment not provided" },
];

const INPUT_REPORTER_PATTERN = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*(?:DSP|RN|LPN|CNA|QIDP|staff)\b/i;

export function resolveTerminology(terminology?: string): string {
  const term = (terminology ?? "resident").trim().toLowerCase();
  if (term === "patient" || term === "client" || term === "individual" || term === "resident") {
    return term;
  }
  return "resident";
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#+\s*/gm, "")
    .trim();
}

function normalizeNullable(value: unknown): string {
  if (value === null || value === undefined) return "";
  return stripMarkdown(String(value).trim());
}

export function parseStructuredDocumentation(raw: string): StructuredDocumentationResponse | null {
  const jsonText = raw.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const soapRaw = parsed.soap as Record<string, unknown> | undefined;
    if (!soapRaw) return null;

    const result: StructuredDocumentationResponse = {
      soap: {
        subjective: normalizeNullable(soapRaw.subjective),
        objective: normalizeNullable(soapRaw.objective),
        assessment: normalizeNullable(soapRaw.assessment),
        plan: normalizeNullable(soapRaw.plan),
      },
    };

    if (parsed.sbar && typeof parsed.sbar === "object") {
      const sbarRaw = parsed.sbar as Record<string, unknown>;
      result.sbar = {
        situation: normalizeNullable(sbarRaw.situation),
        background: normalizeNullable(sbarRaw.background),
        assessment: normalizeNullable(sbarRaw.assessment),
        recommendation: normalizeNullable(sbarRaw.recommendation),
      };
    }

    if (Array.isArray(parsed.qualityCheck)) {
      result.qualityCheck = parsed.qualityCheck
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          type: (item.type === "missing_information" || item.type === "validation" || item.type === "unsupported_removed"
            ? item.type
            : "validation") as QualityCheckItem["type"],
          message: normalizeNullable(item.message),
        }))
        .filter((item) => item.message.length > 0);
    } else if (parsed.qualityCheck && typeof parsed.qualityCheck === "object") {
      const qc = parsed.qualityCheck as Record<string, unknown>;
      result.qualityCheckCompleteness = {
        provided: Array.isArray(qc.provided)
          ? qc.provided.map((item) => normalizeNullable(item)).filter(Boolean)
          : [],
        missing: Array.isArray(qc.missing)
          ? qc.missing.map((item) => normalizeNullable(item)).filter(Boolean)
          : [],
      };
    }

    return result;
  } catch {
    return null;
  }
}

export function formatSoapDocument(soap: StructuredSoap): string {
  return [
    "SUBJECTIVE:",
    soap.subjective.trim(),
    "",
    "OBJECTIVE:",
    soap.objective.trim(),
    "",
    "ASSESSMENT:",
    soap.assessment.trim(),
    "",
    "PLAN:",
    soap.plan.trim(),
  ].join("\n").trim();
}

export function formatSbarDocument(sbar: StructuredSbar): string {
  return [
    "SITUATION:",
    sbar.situation.trim(),
    "",
    "BACKGROUND:",
    sbar.background.trim(),
    "",
    "ASSESSMENT:",
    sbar.assessment.trim(),
    "",
    "RECOMMENDATION:",
    sbar.recommendation.trim(),
  ].join("\n").trim();
}

function removeInventedPhrases(text: string, input: string): { text: string; removed: string[]; missingMessages: string[] } {
  const removed: string[] = [];
  const missingMessages: string[] = [];
  let cleaned = text;

  for (const rule of INVENTED_FINDING_PATTERNS) {
    if (!rule.pattern.test(cleaned)) continue;
    if (rule.requiresInput.test(input)) continue;
    cleaned = cleaned.replace(rule.pattern, "").replace(/\s{2,}/g, " ").trim();
    removed.push(rule.pattern.source);
    if (!missingMessages.includes(rule.message)) missingMessages.push(rule.message);
  }

  return { text: cleaned, removed, missingMessages };
}

function sanitizeSection(text: string, input: string): { text: string; removed: string[]; missingMessages: string[] } {
  return removeInventedPhrases(stripMarkdown(text), input);
}

function inputHasReportTime(input: string): boolean {
  return inputDocumentsEventTime(input);
}

function inputHasReporter(input: string): boolean {
  return INPUT_REPORTER_PATTERN.test(input) || /\b(DSP|RN|LPN|CNA),\s*reported\b/i.test(input);
}

function outputPreservesReportTime(input: string, output: string): boolean {
  return outputIncludesDocumentedEventTime(input, output);
}

function outputPreservesReporter(input: string, output: string): boolean {
  if (!inputHasReporter(input)) return true;
  const reporterMatch = input.match(INPUT_REPORTER_PATTERN);
  if (!reporterMatch) return /\b(DSP|RN|LPN|CNA|staff)\b/i.test(output);
  return output.includes(reporterMatch[1]);
}

function buildGuidelineMissingInformation(input: string, def: GuidelineDefinition): QualityCheckItem[] {
  const items: QualityCheckItem[] = [];
  const lowerInput = input.toLowerCase();

  const checks: { label: string; patterns: RegExp[] }[] = [
    { label: "Vital signs not provided", patterns: [/vital signs|vitals|bp|blood pressure|heart rate|respiratory rate|temp|temperature|spo2/i] },
    { label: "Neurological assessment not provided", patterns: [/neuro|neurologic|mental status|oriented|pupil|gcs/i] },
    { label: "Head impact status not provided", patterns: [/head impact|head strike|struck head|hit head|possible head/i] },
    { label: "Loss of consciousness status not provided", patterns: [/loss of consciousness|\bloc\b|unconscious|no loc|denies loc/i] },
    { label: "Range-of-motion or mobility assessment not provided", patterns: [/range of motion|\brom\b|mobility|gait|transfer status|ambulat|walker|wheelchair/i] },
    { label: "Provider/LAR notification status not provided", patterns: [/pcp.*notified|provider.*notified|lar.*notified|guardian.*notified|family notified|notify pcp/i] },
    { label: "Pain assessment not provided", patterns: [/pain|\b\d\/10\b|denied pain|denies pain|complained of pain|no pain/i] },
    { label: "Anticoagulant or antiplatelet use not provided", patterns: [/aspirin|anticoagulant|antiplatelet|blood thinner|eliquis|warfarin|coumadin|plavix/i] },
  ];

  for (const check of checks) {
    if (!check.patterns.some((pattern) => pattern.test(lowerInput))) {
      items.push({ type: "missing_information", message: check.label });
    }
  }

  if (inputHasReportTime(input) === false) {
    items.push({ type: "missing_information", message: "Report time not provided" });
  }

  if (inputHasReporter(input) === false && /\b(reported|staff|dsp)\b/i.test(lowerInput)) {
    items.push({ type: "missing_information", message: "Reporter name/title not provided" });
  }

  for (const field of def.missingInformationChecklist.filter((entry) => entry.critical !== false)) {
    const keywords = field.matchKeywords ?? [field.label];
    const provided = keywords.some((keyword) => lowerInput.includes(keyword.toLowerCase()) || new RegExp(keyword, "i").test(input));
    if (!provided) {
      const message = `${field.label} not provided`;
      if (!items.some((item) => item.message === message)) {
        items.push({ type: "missing_information", message });
      }
    }
  }

  return items;
}

function ensureNonEmptySections(soap: StructuredSoap, sbar?: StructuredSbar | null): QualityCheckItem[] {
  const items: QualityCheckItem[] = [];
  if (!soap.subjective.trim()) items.push({ type: "validation", message: "SOAP Subjective section is empty" });
  if (!soap.objective.trim()) items.push({ type: "validation", message: "SOAP Objective section is empty" });
  if (!soap.assessment.trim()) items.push({ type: "validation", message: "SOAP Assessment section is empty" });
  if (!soap.plan.trim()) items.push({ type: "validation", message: "SOAP Plan section is empty" });

  if (sbar) {
    if (!sbar.situation.trim()) items.push({ type: "validation", message: "SBAR Situation section is empty" });
    if (!sbar.background.trim()) items.push({ type: "validation", message: "SBAR Background section is empty" });
    if (!sbar.assessment.trim()) items.push({ type: "validation", message: "SBAR Assessment section is empty" });
    if (!sbar.recommendation.trim()) items.push({ type: "validation", message: "SBAR Recommendation section is empty" });
  }

  return items;
}

export function buildPlanSectionRulesBlock(): string {
  return `PLAN SECTION RULES (mandatory — applies to SOAP Plan and SBAR Recommendation):

The Plan has two distinct categories. Never treat Category B as invented findings.

CATEGORY A — COMPLETED OBSERVATIONS AND INTERVENTIONS (narrative-only):
Include ONLY when explicitly supported by the nurse narrative or supplements:
- Assessment results and observed findings
- Completed nursing interventions and actions taken
- Completed provider/LAR notifications
- Completed staff education or documented verbalized understanding
- Reported resident responses and clinical status statements

If a Category A item was not reported, do NOT document it as completed. List absent clinically relevant items in qualityCheck.missing.

CATEGORY B — PROSPECTIVE NURSING PLANS (guideline-mandatory):
Include ALL routine nursing plans, monitoring instructions, staff education, reassessment schedules, safety precautions, follow-up requirements, and handoff guidance required by the selected facility guideline — even when the nurse did not write them in the narrative.

Category B items are forward-looking orders and instructions. Phrase them prospectively, for example:
- "DSP/staff instructed to monitor [relevant symptoms] and immediately report [worsening signs]..."
- "Continue [assessments/monitoring] according to the facility [guideline name]..."
- "Reassess per guideline..." / "Nurse reassessment per guideline..."
- "Assess every shift for 24 hours after resident is symptom free..."
- "Maintain [safety precautions] per guideline..."
- "Notify oncoming nurse when follow-up is needed..."
- "Staff instructed regarding [guideline] monitoring and reporting requirements..."

Category B is required clinical completeness, NOT fabrication. Do not omit guideline-required prospective plans because they were absent from the narrative.

If the guideline template lists plan items with wording such as "only if reported" or "include only supported plan elements," that restriction applies ONLY to Category A (completed actions). Category B items listed in the guideline must still appear in the Plan using prospective language.

Do NOT document Category B items as already completed (for example, do not write "PCP was notified" or "staff verbalized understanding" unless the narrative confirms it occurred).`;
}

export function buildPass1GenerationInstructions(
  def: GuidelineDefinition,
  terminology: string,
  assessmentType: AssessmentType,
  guidelineTemplate: string,
  includeSbar: boolean,
  outputMode: DocumentationOutputMode = DEFAULT_DOCUMENTATION_OUTPUT_MODE,
  templateOptions?: FacilityTemplateOptions,
): string {
  const term = resolveTerminology(terminology);
  const facilityTemplateMode = isFacilityTemplateMode(outputMode);
  const resolvedTemplateOptions = resolveFacilityTemplateOptions(templateOptions);

  const roleLine = facilityTemplateMode
    ? `You are an expert registered nurse documentation assistant completing the selected EPSSLC facility SOAP form template${includeSbar ? " and provider SBAR" : ""}.`
    : `You are an expert registered nurse documentation assistant. Generate a clinically complete SOAP note${includeSbar ? " and provider SBAR" : ""} using the selected facility guideline and the nurse's narrative.`;

  const frameworkBlock = facilityTemplateMode
    ? `${FACILITY_TEMPLATE_MODE_INSTRUCTIONS}

${FACILITY_TEMPLATE_COMPLETION_DIRECTIVE}

${buildFacilityTemplatePlanRules(resolvedTemplateOptions.autoCompleteStaffEducation)}

${buildFacilityPlanComplianceRules()}

AUTHORITATIVE FRAMEWORK:
The EXACT FILLABLE FACILITY TEMPLATE below is the authoritative structure for the SOAP JSON fields.
The FACILITY GUIDELINE PLAN LIBRARY defines every predefined Plan statement for the selected guideline.
Template fidelity and facility Plan compliance are the highest priorities.`
    : `AUTHORITATIVE FRAMEWORK:
The selected guideline template below is the authoritative framework for the note. Apply its required assessments, notification requirements, and follow-up requirements.`;

  const prohibitedCompletedFindings = facilityTemplateMode
    ? `- Vital signs were stable / within normal limits
- No visible injury was noted
- Neurological or mental status unchanged
- Range of motion intact
- Provider or LAR was notified
- Staff verbalized understanding`
    : `- Vital signs were stable / within normal limits
- No visible injury was noted
- Neurological or mental status unchanged
- Range of motion intact
- Provider or LAR was notified
- Staff verbalized understanding`;

  const accuracyBlock = facilityTemplateMode
    ? `ACCURACY AND FACT PRESERVATION:
You MUST NOT invent medications, treatments, provider orders, or notifications that conflict with documented information.

ALLOWED auto-completion when standard for the selected guideline:
- Routine nursing assessments clearly implied by the documented event (respiratory assessment, abdominal assessment, resident assessed following reported event, intake/output review, monitoring for recurrence)
- Guideline-specific DSP/staff monitoring instructions when automatic staff education is enabled

PROHIBITED invented completed findings (unless explicitly in the narrative):
${prohibitedCompletedFindings}

PRESERVATION:
Preserve every clinically relevant fact from the nurse narrative and supplements, including times, reporter identity or title, symptoms, assessment findings, completed interventions, and notification status.

Rewrite Subjective into professional nursing language — do not copy raw dictation.

When required assessment information is not supplied anywhere in the input:
- do not fabricate a result
- keep the facility prompt visible and leave the value blank
- list the specific missing item in qualityCheck.missing`
    : `ACCURACY — COMPLETED FINDINGS ONLY:
You MUST NOT invent completed assessments, observed findings, patient responses, notifications, or interventions that are not supported by the narrative.

PROHIBITED invented completed findings (unless explicitly in the narrative):
${prohibitedCompletedFindings}

PRESERVATION:
Preserve every clinically relevant fact supplied by the nurse, including times, reporter identity or title, symptoms, medications, assessment findings actually provided, completed interventions, and notification status.

When required assessment information is not supplied:
- do not fabricate a result
- omit the unsupported finding from the medical note
- list the specific missing item in qualityCheck.missing`;

  const styleBlock = facilityTemplateMode
    ? `\nWrite like an experienced Texas SSLC RN. Use professional EPSSLC nursing narrative inside prompt values — especially in Objective and Subjective — while preserving every facility prompt label on its own line. Do not merge prompts. Do not remove prompt labels. Avoid generic AI phrasing.\n`
    : `\nWrite natural, professional nursing documentation rather than mechanically restating the input. The note should read like documentation written by a skilled nurse, with comparable clinical completeness to the guideline template.\n`;

  const supplementalRules = facilityTemplateMode ? '' : `\n${buildPlanSectionRulesBlock()}\n`;

  const soapSchema = facilityTemplateMode
    ? {
      subjective: 'SUBJECTIVE section of the fillable facility template; preserve every prompt label on its own line; use professional nursing language in values',
      objective: 'OBJECTIVE section of the fillable facility template; preserve every prompt label and "See Interactive View Assessment."; write professional nursing narrative after each prompt label; never merge prompts; leave unsupported prompts blank',
      assessment: 'ASSESSMENT section label/content from the fillable facility template only',
      plan: 'PLAN section assembled ONLY from the FACILITY GUIDELINE PLAN LIBRARY and EXACT FILLABLE FACILITY TEMPLATE; preserve every predefined plan statement in order; fill colon prompts only with supported information; never substitute generic AI plan wording',
    }
    : {
      subjective: 'Complete subjective section using provided facts and guideline expectations',
      objective: 'Complete objective section with only supported findings; include See Interactive View Assessment when required by the guideline',
      assessment: 'Nursing assessment using supported facts and appropriate guideline-based clinical interpretation',
      plan: 'Assemble from FACILITY GUIDELINE PLAN LIBRARY. Category A: completed actions from the narrative only. Category B: include every mandatory prospective library element using forward-looking language, even when absent from the narrative.',
    };

  return `${roleLine}

Return ONLY valid JSON. No markdown fences. No prose outside JSON.

TERMINOLOGY:
Use "${term}" when referring to the person receiving care. Do not substitute a different term.

${frameworkBlock}

${accuracyBlock}${styleBlock}

SELECTED GUIDELINE: ${def.displayName}
ASSESSMENT TYPE: ${assessmentType}
OUTPUT MODE: ${outputMode}

${guidelineTemplate}
${supplementalRules}
JSON SCHEMA:
{
  "soap": {
    "subjective": "${soapSchema.subjective}",
    "objective": "${soapSchema.objective}",
    "assessment": "${soapSchema.assessment}",
    "plan": "${soapSchema.plan}"
  }${includeSbar ? `,
  "sbar": {
    "situation": "${facilityTemplateMode ? 'Expanded supported event summary with time, event details, and key descriptors — write like an RN notifying a provider' : 'Concise supported summary of the event'}",
    "background": "Relevant supported background including medications and context when provided",
    "assessment": "${facilityTemplateMode ? 'Expanded supported objective findings, assessment results, and completed nursing actions — not a one-line summary' : 'Supported findings and completed interventions only'}",
    "recommendation": "${facilityTemplateMode ? 'Guideline-based specific recommendations using prospective language; avoid vague Continue to monitor wording; do not claim unsupported completed notifications' : 'Category B prospective guideline recommendations, monitoring instructions, and follow-up actions; do not claim unsupported completed notifications'}"
  }` : ""},
  "qualityCheck": {
    "provided": ["List each fact explicitly supported by the narrative"],
    "missing": ["List each clinically relevant item not provided in the narrative"]
  }
}

Use plain text only inside JSON string values. No markdown symbols.`;
}

export function buildPass1GenerationUserPrompt(
  clinicalInfo: string,
  supplementText: string,
  includeSbar: boolean,
  outputMode: DocumentationOutputMode = DEFAULT_DOCUMENTATION_OUTPUT_MODE,
): string {
  const facilityTemplateMode = isFacilityTemplateMode(outputMode);
  const frameworkLine = facilityTemplateMode
    ? `Complete the EXACT FILLABLE FACILITY TEMPLATE from the system instructions.
Preserve every facility prompt label, standalone instruction, and prompt order in the SOAP JSON fields.
Never merge separate facility prompts into one line.
Rewrite Subjective into professional nursing documentation — do not copy raw dictated text.
Write professional nursing narrative after each prompt label — especially in Objective — while keeping every prompt visible.
Synthesize supported objective findings from the full input; never write "unknown" when the information exists elsewhere.
Fill supported values after each prompt. Leave unsupported colon prompts visible with blank values.`
    : `Use the full facility guideline template and FACILITY GUIDELINE PLAN LIBRARY from the system instructions as the authoritative framework.
Write Subjective, Objective, and Assessment naturally from the nurse narrative.
Assemble the Plan from the plan library: Category A from narrative facts; Category B from mandatory library elements.`;

  return `Generate the complete structured documentation JSON.

${frameworkLine}
Use the nurse narrative below as the sole source of documented facts. Rewrite into professional nursing documentation — do not copy or translate the raw text verbatim.

NURSE NARRATIVE (preserve all clinically relevant facts):
${clinicalInfo}

NURSE-SUPPLEMENTED DETAILS (append only if present):
${supplementText}

Return ONLY JSON.${includeSbar ? " Include the sbar object." : " Omit the sbar object."}`;
}

export function buildPass2ReviewInstructions(
  terminology: string,
  includeSbar: boolean,
  outputMode: DocumentationOutputMode = DEFAULT_DOCUMENTATION_OUTPUT_MODE,
): string {
  const term = resolveTerminology(terminology);
  const facilityTemplateMode = isFacilityTemplateMode(outputMode);

  const templatePreservation = facilityTemplateMode
    ? `FACILITY TEMPLATE CORRECTION RULES (mandatory):
- Template fidelity is the highest priority
- Preserve every facility label and colon-ended prompt from the EXACT FILLABLE FACILITY TEMPLATE
- Preserve prompt order exactly
- Never merge separate facility prompts into one line
- Do not delete blank required prompts
- Leave unsupported colon prompts visible with blank values
- Preserve every standing facility Plan instruction exactly as written in the template
- Rewrite Subjective into professional nursing language — do not leave raw dictation
- Use professional nursing narrative inside prompt values, especially in Objective; synthesize supported findings from the full input; never write "unknown" when information exists elsewhere
- Infer only routine nursing assessments under Nursing interventions completed when clearly implied
- Auto-complete routine DSP staff education when enabled
- Expand SBAR Situation and Assessment with supported detail — avoid one-line summaries
- Do not convert the SOAP sections into unstructured narrative paragraphs without prompt labels
- Only correct omissions, contradictions, merged prompts, invented medications/treatments, invented completed notifications, or unsupported content`
    : `Fix omissions, contradictions, invented completed findings, and incomplete Plan/SBAR content.
Keep natural professional nursing language.
Do not shorten the note unnecessarily.

PLAN correction rules:
- Category A (completed): include only narrative-supported completed actions and findings.
- Category B (prospective): restore any missing mandatory guideline plans, monitoring instructions, staff education, reassessment, safety precautions, and follow-up guidance.
- Do not remove Category B items because they were not in the source narrative.
- Do not document Category B items as already completed.`;

  return `You are an expert registered nurse documentation reviewer performing pass 2 correction.

Return ONLY valid JSON in the same schema as pass 1.

Review the draft against:
- the source narrative
- the selected facility guideline template
- unsupported completed-finding rules
- required clinical completeness

Use "${term}" consistently.

${templatePreservation}

Return the corrected final JSON only.`;
}

export function buildPass2ReviewUserPrompt(args: {
  sourceNarrative: string;
  guidelineTemplate: string;
  draftJson: string;
  validationErrors: string[];
  includeSbar: boolean;
  outputMode?: DocumentationOutputMode;
}): string {
  const facilityTemplateMode = isFacilityTemplateMode(args.outputMode);
  const templateReminder = facilityTemplateMode
    ? `\nTEMPLATE PRESERVATION REMINDER:
Preserve every facility label and prompt from the EXACT FILLABLE FACILITY TEMPLATE.
Never merge separate prompts into one line.
Use professional nursing narrative inside prompt values while keeping every prompt label visible.
Do not delete blank required prompts.\n`
    : '';

  return `PASS 2 REVIEW

SOURCE NARRATIVE:
${args.sourceNarrative}

FULL GUIDELINE TEMPLATE:
${args.guidelineTemplate}
${templateReminder}
DRAFT JSON:
${args.draftJson}

VALIDATION ERRORS TO FIX:
${args.validationErrors.map((error) => `- ${error}`).join("\n")}

Return corrected JSON only.${args.includeSbar ? " Include sbar." : " Omit sbar."}`;
}

function planDocumentsCompletedAction(
  plan: string,
  action: 'pir' | 'nursing interventions',
  def?: GuidelineDefinition,
  assessmentType?: AssessmentType,
): boolean {
  if (action === 'pir') {
    if (planDocumentsPirCompleted(plan, def, assessmentType)) return true;
    const lower = plan.toLowerCase();
    return /\bpir\b/.test(lower) && /completed/.test(lower);
  }
  if (planDocumentsNursingInterventions(plan, def, assessmentType)) return true;
  const lower = plan.toLowerCase();
  return /nursing interventions/.test(lower) && /completed/.test(lower);
}

export function applyFacilityPlanEnrichment(
  parsed: StructuredDocumentationResponse,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  templateOptions?: FacilityTemplateOptions,
  terminology = 'resident',
): PlanEnrichmentResult | null {
  const resolvedTemplateOptions = resolveFacilityTemplateOptions(templateOptions);
  const template = getFacilityFormTemplate(def, assessmentType);

  parsed.soap = enrichFacilitySoapSections(
    parsed.soap,
    input,
    def,
    assessmentType,
    template,
    terminology,
  );

  const enrichment = enrichFacilityPlanPrompts(
    parsed.soap.plan,
    input,
    def,
    assessmentType,
    { autoCompleteStaffEducation: resolvedTemplateOptions.autoCompleteStaffEducation },
    {
      subjective: parsed.soap.subjective,
      objective: parsed.soap.objective,
      assessment: parsed.soap.assessment,
    },
  );

  parsed.soap.plan = enrichment.plan;
  return enrichment;
}

function detectInventedFindings(text: string, input: string): string[] {
  const errors: string[] = [];
  for (const rule of INVENTED_FINDING_PATTERNS) {
    if (!rule.pattern.test(text)) continue;
    if (rule.requiresInput.test(input)) continue;
    errors.push(`Unsupported completed finding or action added: ${rule.message}`);
  }
  return errors;
}

function reconcileQualityCheckCompleteness(
  parsed: StructuredDocumentationResponse,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  enrichment?: PlanEnrichmentResult | null,
): StructuredQualityCheckCompleteness {
  const deterministic = buildDocumentationQualityCheck({
    input,
    soap: parsed.soap,
    def,
    assessmentType,
    enrichment,
  });

  return {
    provided: deterministic.provided,
    missing: deterministic.missing,
    scorePercent: deterministic.scorePercent,
    categorizedMissing: deterministic.categorizedMissing,
  };
}

function validateIndependentFacilityPromptLines(combined: string, prompts: string[]): string[] {
  const errors: string[] = [];
  const lines = combined.split('\n').map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const labelsOnLine = prompts.filter((prompt) => line.includes(prompt));
    if (labelsOnLine.length > 1) {
      errors.push(`Multiple facility prompts merged on one line: ${line}`);
    }

    if (!line.includes(':')) continue;
    const labelPart = line.slice(0, line.indexOf(':') + 1).trim();
    if (!labelPart.includes('/') || prompts.includes(labelPart)) continue;

    const slashParts = labelPart.replace(':', '').split('/').map((part) => part.trim()).filter(Boolean);
    const matchedPrompts = prompts.filter((prompt) => {
      const promptLabel = prompt.replace(':', '').trim();
      return slashParts.some((part) => promptLabel.startsWith(part) || part.startsWith(promptLabel));
    });
    if (matchedPrompts.length >= 2) {
      errors.push(`Merged facility prompts detected: ${labelPart}`);
    }
  }

  for (const prompt of prompts) {
    const onOwnLine = lines.some((line) => {
      if (line === prompt) return true;
      if (!line.startsWith(prompt)) return false;
      const afterPrompt = line.slice(prompt.length).trim();
      return afterPrompt.length === 0 || !afterPrompt.includes(':');
    });
    if (!onOwnLine) {
      errors.push(`Facility prompt must appear on its own line: ${prompt}`);
    }
  }

  return errors;
}

export function validateFacilityTemplatePreservation(
  soap: StructuredSoap,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string[] {
  const template = getFacilityFormTemplate(def, assessmentType);
  const combined = [soap.subjective, soap.objective, soap.assessment, soap.plan].join('\n');
  const errors: string[] = [];
  const prompts = extractColonPromptsFromTemplate(template);
  const subjectivePrompts = new Set(extractSubjectivePromptsFromTemplate(template));
  const requiredPrompts = prompts.filter((prompt) => {
    if (subjectivePrompts.has(prompt) && !subjectivePromptHasValue(soap.subjective, prompt)) {
      return false;
    }
    return true;
  });

  if (template.includes('See Interactive View Assessment.') && !/See Interactive View Assessment\.?/i.test(soap.objective)) {
    errors.push('OBJECTIVE must preserve "See Interactive View Assessment." on its own line');
  }

  for (const prompt of requiredPrompts) {
    if (!combined.includes(prompt)) {
      errors.push(`Required facility prompt missing from SOAP output: ${prompt}`);
    }
  }

  errors.push(...validateIndependentFacilityPromptLines(combined, requiredPrompts));

  let lastIndex = -1;
  for (const prompt of requiredPrompts) {
    const index = combined.indexOf(prompt);
    if (index >= 0 && index < lastIndex) {
      errors.push(`Facility prompt order changed: ${prompt} appears out of template order`);
    }
    if (index >= 0) lastIndex = index;
  }

  if (prompts.length > 0 && !soap.objective.includes(':') && !/See Interactive View Assessment\.?/i.test(soap.objective)) {
    errors.push('OBJECTIVE appears to be narrative SOAP rather than a completed facility form');
  }

  const sectionHeaderOnly = /^(S|O|A|P|SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN):\s*$/i;
  const objectivePromptCount = soap.objective
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.endsWith(':') && !sectionHeaderOnly.test(line)).length;
  if (prompts.some((prompt) => template.includes(prompt)) && objectivePromptCount === 0 && !/See Interactive View Assessment\.?/i.test(soap.objective)) {
    errors.push('OBJECTIVE is missing required facility prompt labels');
  }

  const genericPlanPattern = /\bcontinue to monitor\b/i;
  const hasGuidelineSpecificPlan = /according to the .* guideline|DSP instructed to monitor|Nurse to notify PCP|Notify the oncoming nurse|Staff verbalized or demonstrated understanding of instructions provided:/i.test(soap.plan);
  if (genericPlanPattern.test(soap.plan) && !hasGuidelineSpecificPlan) {
    errors.push('PLAN contains generic monitoring language without required facility-template plan prompts');
  }

  if (prompts.some((prompt) => template.includes(prompt)) && soap.plan.split('\n').filter((line) => line.trim().endsWith(':')).length === 0) {
    errors.push('PLAN appears to be narrative SOAP rather than a completed facility form');
  }

  return errors;
}

export function validateAiDocumentationOutput(
  parsed: StructuredDocumentationResponse,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  outputMode: DocumentationOutputMode = DEFAULT_DOCUMENTATION_OUTPUT_MODE,
  templateOptions?: FacilityTemplateOptions,
  terminology = 'resident',
): AiValidationResult {
  let enrichment: PlanEnrichmentResult | null = null;
  if (isFacilityTemplateMode(outputMode)) {
    enrichment = applyFacilityPlanEnrichment(
      parsed,
      input,
      def,
      assessmentType,
      templateOptions,
      terminology,
    );
  }

  const errors: string[] = [];
  const combinedOutput = [
    parsed.soap.subjective,
    parsed.soap.objective,
    parsed.soap.assessment,
    parsed.soap.plan,
    parsed.sbar?.situation,
    parsed.sbar?.background,
    parsed.sbar?.assessment,
    parsed.sbar?.recommendation,
  ].filter(Boolean).join("\n");

  for (const item of ensureNonEmptySections(parsed.soap, parsed.sbar)) {
    errors.push(item.message);
  }

  if (!outputPreservesReportTime(input, combinedOutput)) {
    errors.push("Supplied event time is missing from the generated note");
  }

  const facts = extractClinicalFacts(input, def.id);
  for (const medication of facts.medications) {
    if (!combinedOutput.toLowerCase().includes(medication.toLowerCase())) {
      errors.push(`Supplied medication is missing from the generated note: ${medication}`);
    }
  }

  if (facts.pirCompleted && !planDocumentsCompletedAction(parsed.soap.plan, 'pir', def, assessmentType)) {
    errors.push('Supplied PIR completed status is missing from the Plan');
  }

  if (facts.nursingInterventionsCompleted && !planDocumentsCompletedAction(parsed.soap.plan, 'nursing interventions', def, assessmentType)) {
    errors.push('Supplied nursing interventions completed status is missing from the Plan');
  }

  errors.push(...detectInventedFindings(combinedOutput, input));

  if (isFacilityTemplateMode(outputMode)) {
    errors.push(...validatePlanAgainstLibrary(parsed.soap.plan, def.id, assessmentType));
    errors.push(...validateFacilityTemplatePreservation(parsed.soap, def, assessmentType));
  }

  const completeness = reconcileQualityCheckCompleteness(parsed, input, def, assessmentType, enrichment);

  for (const missingItem of completeness.missing) {
    if (facts.eventTime && /report time|event time/i.test(missingItem)) {
      errors.push(`Quality check incorrectly marks supplied event time as missing: ${missingItem}`);
    }
    if (facts.reporterTitle && /reporter title|reporter name\/title/i.test(missingItem)) {
      errors.push(`Quality check incorrectly marks supplied reporter title as missing: ${missingItem}`);
    }
    if (facts.headImpact && /head impact status/i.test(missingItem)) {
      errors.push(`Quality check incorrectly marks supplied head impact as missing: ${missingItem}`);
    }
  }

  const qualityCheckItems: QualityCheckItem[] = [
    ...completeness.provided.map((message) => ({ type: "validation" as const, message: `Provided: ${message}` })),
    ...completeness.missing.map((message) => ({ type: "missing_information" as const, message })),
    ...errors.map((message) => ({ type: "validation" as const, message })),
  ];

  return {
    isValid: errors.length === 0,
    errors,
    completeness,
    qualityCheckItems,
  };
}

/** @deprecated Legacy alias */
export function buildStructuredGenerationInstructions(
  def: GuidelineDefinition,
  terminology: string,
  assessmentType: AssessmentType,
  includeSbar: boolean,
): string {
  const assessmentInstructions = getAssessmentInstructionsForType(def, assessmentType);
  return buildPass1GenerationInstructions(
    def,
    terminology,
    assessmentType,
    assessmentInstructions.instructions,
    includeSbar,
  );
}

/** @deprecated Legacy alias */
export function buildStructuredGenerationUserPrompt(
  clinicalInfo: string,
  supplementText: string,
  includeSbar: boolean,
): string {
  return buildPass1GenerationUserPrompt(clinicalInfo, supplementText, includeSbar);
}

/** @deprecated Legacy validation that rewrites note text — prefer validateAiDocumentationOutput */
export function validateStructuredDocumentation(
  parsed: StructuredDocumentationResponse,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  outputMode: DocumentationOutputMode = 'narrative_soap',
): ValidatedStructuredDocumentation {
  const validation = validateAiDocumentationOutput(parsed, input, def, assessmentType, outputMode);
  return {
    soap: parsed.soap,
    soapText: formatSoapDocument(parsed.soap),
    sbar: parsed.sbar ?? undefined,
    sbarText: parsed.sbar ? formatSbarDocument(parsed.sbar) : undefined,
    qualityCheck: validation.qualityCheckItems,
    completeness: validation.completeness,
  };
}

export function toDocumentationQualityCheck(
  validated: ValidatedStructuredDocumentation,
  validation?: AiValidationResult,
): {
  templateFollowed: boolean;
  unsupportedStatementsRemoved: string[];
  messages: string[];
  items: QualityCheckItem[];
  completeness?: StructuredQualityCheckCompleteness;
} {
  const unsupportedStatementsRemoved = (validation?.errors ?? []).filter((error) =>
    error.includes("Unsupported completed finding")
  );

  return {
    templateFollowed: validation?.isValid ?? Boolean(
      validated.soap.subjective.trim()
      && validated.soap.objective.trim()
      && validated.soap.assessment.trim()
      && validated.soap.plan.trim(),
    ),
    unsupportedStatementsRemoved,
    messages: [
      ...(validated.completeness?.provided ?? []).map((item) => `Provided: ${item}`),
      ...(validated.completeness?.missing ?? []),
    ],
    items: validated.qualityCheck,
    completeness: validated.completeness,
  };
}

export function generateStructuredDocumentationFromGuidelineName(
  guidelineDisplayName: string,
  clinicalInfo: string,
  supplementText: string,
  terminology: string | undefined,
  includeSbar: boolean,
): { instructions: string; userPrompt: string; def: GuidelineDefinition; assessmentType: AssessmentType } {
  const def = lookupGuidelineByDisplayName(guidelineDisplayName);
  if (!def) {
    throw new Error(`No facility guideline definition found for "${guidelineDisplayName}".`);
  }

  const combinedInput = [clinicalInfo, supplementText !== "None provided." ? supplementText : ""]
    .filter(Boolean)
    .join("\n");
  const assessmentType = detectAssessmentType(combinedInput);

  return {
    def,
    assessmentType,
    instructions: buildStructuredGenerationInstructions(def, terminology ?? "resident", assessmentType, includeSbar),
    userPrompt: buildStructuredGenerationUserPrompt(clinicalInfo, supplementText, includeSbar),
  };
}
