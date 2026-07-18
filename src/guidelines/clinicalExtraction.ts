import type { GuidelineDefinition } from './types';

export interface ReporterInfo {
  name: string | null;
  title: string | null;
  time: string | null;
  report: string | null;
}

/**
 * Structured clinical content extracted in Stage 1.
 * Stage 2 maps these values into facility template fields — never rewrites the template.
 */
export interface ClinicalExtraction {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  assessmentLabel: string | null;
  nursingInterventions: string | null;
  staffInstructions: string | null;
  providerNotification: string | null;
  additionalFindings: string | null;
  reporter: ReporterInfo | null;
  reportTime: string | null;
  medication: string | null;
  education: string | null;
  /** Exact facility prompt label (without trailing colon) -> extracted value */
  promptValues: Record<string, string>;
}

export const EMPTY_CLINICAL_EXTRACTION: ClinicalExtraction = {
  subjective: null,
  objective: null,
  assessment: null,
  assessmentLabel: null,
  nursingInterventions: null,
  staffInstructions: null,
  providerNotification: null,
  additionalFindings: null,
  reporter: null,
  reportTime: null,
  medication: null,
  education: null,
  promptValues: {},
};

const STAGE_1_CORE = `You are Stage 1 of a two-stage nursing documentation pipeline for a State Supported Living Center.

YOUR ONLY JOB: Extract structured clinical information from the nurse's input.

DO NOT:
- Generate a SOAP note or any formatted documentation
- Worry about facility template layout, headings, or prompt order
- Invent findings, diagnoses, interventions, notifications, or outcomes
- Use bullet lists in extracted values unless the source input used bullets

LANGUAGE:
- Read input in English, Korean, or Spanish
- Write all extracted values in professional English
- Do not translate sentence-by-sentence; extract facts only

Return ONLY valid JSON matching the schema below. Use null for missing values. Use an empty object {} for promptValues when none apply.`;

export function buildStage1ExtractionInstructions(
  def: GuidelineDefinition,
  terminology: string,
): string {
  const requiredPrompts = [
    ...def.assessment.requiredFields.map((field) => field.label),
    ...def.missingInformationChecklist.map((field) => field.label),
  ];

  return `${STAGE_1_CORE}

SELECTED GUIDELINE: ${def.displayName}
TERMINOLOGY: Use "${terminology}" when referring to the person receiving care.

JSON SCHEMA:
{
  "subjective": "string or null — reported symptoms, concerns, staff/resident report",
  "objective": "string or null — general objective findings not mapped to a specific prompt",
  "assessment": "string or null — nurse-provided clinical assessment statement (not a diagnosis unless provided)",
  "assessmentLabel": "string or null — facility assessment label if explicitly stated (e.g., Fall Follow-up)",
  "nursingInterventions": "string or null — interventions completed or nursing actions taken",
  "staffInstructions": "string or null — staff education/instructions and understanding if reported",
  "providerNotification": "string or null — PCP/provider notification details ONLY if notification occurred and was reported",
  "additionalFindings": "string or null — abnormal or additional assessment findings beyond Interactive View",
  "reporter": {
    "name": "string or null",
    "title": "string or null",
    "time": "string or null",
    "report": "string or null"
  },
  "reportTime": "string or null — time of report or assessment when provided",
  "medication": "string or null — medications administered, changed, or relevant to the event",
  "education": "string or null — education or instructions provided to staff/resident/LAR",
  "promptValues": {
    "<exact facility prompt label without colon>": "<extracted value for that prompt>"
  }
}

For promptValues, use exact facility prompt labels when the input supports a value. Relevant prompts for this guideline include:
${requiredPrompts.map((label) => `- ${label}`).join('\n')}

Return ONLY the JSON object. No markdown fences. No explanation.`;
}

export function buildStage1ExtractionUserPrompt(
  clinicalInfo: string,
  supplementText: string,
): string {
  return `Extract structured clinical information from this input.

CLINICAL INPUT:
${clinicalInfo}

NURSE-SUPPLEMENTED DETAILS:
${supplementText}

Return ONLY the JSON object. Do NOT generate a SOAP note.`;
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeReporter(value: unknown): ReporterInfo | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const reporter: ReporterInfo = {
    name: normalizeNullableString(record.name),
    title: normalizeNullableString(record.title),
    time: normalizeNullableString(record.time),
    report: normalizeNullableString(record.report),
  };
  return reporter.name || reporter.title || reporter.time || reporter.report ? reporter : null;
}

function normalizePromptValues(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const normalized = normalizeNullableString(raw);
    if (normalized) result[key.trim()] = normalized;
  }
  return result;
}

export function parseClinicalExtraction(raw: string): ClinicalExtraction {
  const trimmed = raw.trim();
  const jsonText = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ...EMPTY_CLINICAL_EXTRACTION };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ...EMPTY_CLINICAL_EXTRACTION };
  }

  const record = parsed as Record<string, unknown>;
  return {
    subjective: normalizeNullableString(record.subjective),
    objective: normalizeNullableString(record.objective),
    assessment: normalizeNullableString(record.assessment),
    assessmentLabel: normalizeNullableString(record.assessmentLabel),
    nursingInterventions: normalizeNullableString(record.nursingInterventions),
    staffInstructions: normalizeNullableString(record.staffInstructions),
    providerNotification: normalizeNullableString(record.providerNotification),
    additionalFindings: normalizeNullableString(record.additionalFindings),
    reporter: normalizeReporter(record.reporter),
    reportTime: normalizeNullableString(record.reportTime),
    medication: normalizeNullableString(record.medication),
    education: normalizeNullableString(record.education),
    promptValues: normalizePromptValues(record.promptValues),
  };
}

export function buildSubjectiveText(extraction: ClinicalExtraction): string | null {
  if (extraction.subjective) return extraction.subjective;

  const reporter = extraction.reporter;
  if (reporter?.report) {
    const time = reporter.time ?? extraction.reportTime;
    const name = reporter.name;
    const title = reporter.title;
    if (time && name && title) {
      return `At ${time}, ${name}, ${title}, reported that ${reporter.report}`;
    }
    if (time && name) {
      return `At ${time}, ${name} reported that ${reporter.report}`;
    }
    if (name && title) {
      return `${name}, ${title}, reported that ${reporter.report}`;
    }
    return reporter.report;
  }

  return null;
}
