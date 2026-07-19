import type { GuidelineDefinition } from './types.ts';
import type { AssessmentType } from './facilityTemplateMode.ts';
import {
  extractPlanStandingInstructions,
  getFacilityFormTemplate,
} from './facilityFormTemplates.ts';
import { isNegativeFillerValue } from './facilityTemplateSanitization.ts';
import { detectStaffUnderstandingConfirmed } from './clinicalFactExtraction.ts';
import {
  mergeTemplateLockValues,
  populateTemplateLockValuesFromInput,
} from './templateLockPopulation.ts';

export type TemplateLockSection = 'subjective' | 'objective' | 'assessment' | 'plan';

export type TemplateLockFieldKind = 'scalar' | 'narrative' | 'completion';

export interface TemplateLockField {
  id: string;
  label: string;
  section: TemplateLockSection;
  kind: TemplateLockFieldKind;
}

export interface TemplateLockSchema {
  guidelineId: string;
  assessmentType: AssessmentType;
  template: string;
  fields: TemplateLockField[];
  fixedAssessmentLabel: string | null;
  standingInstructions: string[];
}

export interface TemplateLockValues {
  subjective: Record<string, string>;
  objective: Record<string, string>;
  assessment: {
    clinicalSummary: string;
  };
  plan: Record<string, string>;
}

export interface TemplateLockParseResult {
  values: TemplateLockValues;
  unknownKeys: string[];
  errors: string[];
}

export interface TemplateLockValidationResult {
  isValid: boolean;
  errors: string[];
  values: TemplateLockValues;
}

const SECTION_HEADER_PATTERN = /^(SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN|S|O|A|P):\s*$/i;

const FIELD_ID_OVERRIDES: Record<string, string> = {
  'reported symptoms': 'reportedSymptoms',
  'reported symptoms related to elevated temperature': 'reportedSymptoms',
  fatigue: 'fatigue',
  'new symptoms': 'newSymptoms',
  'date and time of the last documented elevated temperature': 'lastElevatedTemperatureDateTime',
  'current temperature': 'currentTemperature',
  'temperature route': 'temperatureRoute',
  'assessment time': 'assessmentTime',
  'signs and symptoms of infection': 'signsSymptomsInfection',
  'environmental factors that may have contributed to the elevated temperature':
    'environmentalFactors',
  'additional findings': 'additionalFindings',
  'interventions completed': 'interventionsCompleted',
  'nursing interventions completed': 'nursingInterventionsCompleted',
  'staff verbalized or demonstrated understanding of instructions provided':
    'staffUnderstandingConfirmation',
  'last vomiting episode': 'lastVomitingEpisode',
  'enteral feeding rate': 'enteralFeedingRate',
  'intake/output': 'intakeOutput',
  'presence or absence of nausea': 'presenceOrAbsenceOfNausea',
  'positioning per pnmp': 'positioningPerPnmp',
  'gastric bleeding if suspected': 'gastricBleedingIfSuspected',
  'source of vomiting if identified': 'sourceOfVomitingIfIdentified',
  'other relevant assessment findings': 'otherRelevantAssessmentFindings',
  'antiemetic effectiveness': 'antiemeticEffectiveness',
  'nurse reassessment': 'nurseReassessment',
  'vomiting resolved status': 'vomitingResolvedStatus',
};

const PLACEHOLDER_VALUES = /^(unknown|n\/a|not documented|not reported|not provided|unable to determine|none)$/i;

const OBJECTIVE_ONLY_PATTERNS: RegExp[] = [
  /\bresting comfortably\b/i,
  /\brespirations?\b.*\b(?:even|unlabored)\b/i,
  /\bvital signs\b/i,
  /\bafebrile\b/i,
  /\btemperature\s+\d/i,
  /\b(?:prn\s+)?(?:tylenol|acetaminophen)\b.*\badministered\b/i,
  /\babdomen soft\b/i,
  /\bno chills\b/i,
  /\bno additional fever\b/i,
  /\bpositioned\b|\bpositioning\b|\bsitting upright\b/i,
];

const SUBJECTIVE_SIGNAL_PATTERNS: RegExp[] = [
  /\b(?:denies|denied|reports?|complains?|states?|said)\b/i,
  /\b(?:dsp|staff|resident|family)\s+reported\b/i,
];

function normalizeLabelKey(label: string): string {
  return label.replace(/:\s*$/, '').trim().toLowerCase();
}

function labelToFieldId(label: string): string {
  const normalized = normalizeLabelKey(label);
  if (FIELD_ID_OVERRIDES[normalized]) return FIELD_ID_OVERRIDES[normalized];

  const words = normalized.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return words
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`,
    )
    .join('');
}

function inferFieldKind(label: string, section: TemplateLockSection): TemplateLockFieldKind {
  const lower = normalizeLabelKey(label);

  if (section === 'plan') return 'completion';

  if (
    /current temperature|temperature route|assessment time|enteral feeding rate|pain level|pain score|assessed at|date and time of|last vomiting episode|positioning per pnmp|pain medication effectiveness|response to intervention/i.test(
      lower,
    )
  ) {
    return 'scalar';
  }

  return 'narrative';
}

function isFieldPrompt(line: string): boolean {
  return line.endsWith(':') && !SECTION_HEADER_PATTERN.test(line);
}

function isFixedInstruction(line: string): boolean {
  return line.endsWith('.') && !line.endsWith(':');
}

export function emptyTemplateLockValues(): TemplateLockValues {
  return {
    subjective: {},
    objective: {},
    assessment: { clinicalSummary: '' },
    plan: {},
  };
}

export function buildTemplateLockSchema(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): TemplateLockSchema {
  const template = getFacilityFormTemplate(def, assessmentType);
  const lines = template.split('\n');
  const fields: TemplateLockField[] = [];
  let currentSection: TemplateLockSection | null = null;
  let fixedAssessmentLabel: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^SUBJECTIVE:\s*$/i.test(trimmed)) {
      currentSection = 'subjective';
      continue;
    }
    if (/^OBJECTIVE:\s*$/i.test(trimmed)) {
      currentSection = 'objective';
      continue;
    }
    if (/^ASSESSMENT:\s*$/i.test(trimmed)) {
      currentSection = 'assessment';
      continue;
    }
    if (/^PLAN:\s*$/i.test(trimmed)) {
      currentSection = 'plan';
      continue;
    }

    if (currentSection === 'assessment' && !isFieldPrompt(trimmed)) {
      if (!fixedAssessmentLabel) fixedAssessmentLabel = trimmed;
      continue;
    }

    if (!currentSection || currentSection === 'assessment') continue;
    if (!isFieldPrompt(trimmed)) continue;
    if (/^see interactive view assessment:$/i.test(trimmed)) continue;

    fields.push({
      id: labelToFieldId(trimmed),
      label: trimmed.endsWith(':') ? trimmed : `${trimmed}:`,
      section: currentSection,
      kind: inferFieldKind(trimmed, currentSection),
    });
  }

  return {
    guidelineId: def.id,
    assessmentType,
    template,
    fields,
    fixedAssessmentLabel,
    standingInstructions: [...extractPlanStandingInstructions(template)],
  };
}

function normalizeFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isPlaceholderValue(value: string): boolean {
  if (!value) return true;
  return PLACEHOLDER_VALUES.test(value) || isNegativeFillerValue(value);
}

function collectUnknownKeys(
  record: Record<string, unknown>,
  allowed: Set<string>,
  prefix: string,
  unknownKeys: string[],
): void {
  for (const key of Object.keys(record)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (!allowed.has(fullKey)) unknownKeys.push(fullKey);
  }
}

export function parseTemplateLockResponse(
  raw: string,
  schema: TemplateLockSchema,
): TemplateLockParseResult {
  const values = emptyTemplateLockValues();
  const errors: string[] = [];
  const unknownKeys: string[] = [];

  const jsonText = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    return { values, unknownKeys: ['<invalid json>'], errors: ['Invalid JSON returned by model'] };
  }

  const fieldValues = (parsed.fieldValues ?? parsed) as Record<string, unknown>;
  const allowedTop = new Set(['subjective', 'objective', 'assessment', 'plan', 'fieldValues', 'sbar', 'qualityCheck']);
  for (const key of Object.keys(parsed)) {
    if (!allowedTop.has(key)) unknownKeys.push(key);
  }

  const subjectiveIds = new Set(schema.fields.filter((f) => f.section === 'subjective').map((f) => f.id));
  const objectiveIds = new Set(schema.fields.filter((f) => f.section === 'objective').map((f) => f.id));
  const planIds = new Set(schema.fields.filter((f) => f.section === 'plan').map((f) => f.id));

  if (fieldValues.subjective && typeof fieldValues.subjective === 'object') {
    const subjective = fieldValues.subjective as Record<string, unknown>;
    collectUnknownKeys(subjective, subjectiveIds, 'subjective', unknownKeys);
    for (const field of schema.fields.filter((item) => item.section === 'subjective')) {
      values.subjective[field.id] = normalizeFieldValue(subjective[field.id]);
    }
  }

  if (fieldValues.objective && typeof fieldValues.objective === 'object') {
    const objective = fieldValues.objective as Record<string, unknown>;
    collectUnknownKeys(objective, objectiveIds, 'objective', unknownKeys);
    for (const field of schema.fields.filter((item) => item.section === 'objective')) {
      values.objective[field.id] = normalizeFieldValue(objective[field.id]);
    }
  }

  if (fieldValues.assessment && typeof fieldValues.assessment === 'object') {
    const assessment = fieldValues.assessment as Record<string, unknown>;
    for (const key of Object.keys(assessment)) {
      if (key !== 'clinicalSummary') unknownKeys.push(`assessment.${key}`);
    }
    values.assessment.clinicalSummary = normalizeFieldValue(assessment.clinicalSummary);
  } else if (typeof fieldValues.assessment === 'string') {
    values.assessment.clinicalSummary = normalizeFieldValue(fieldValues.assessment);
  }

  if (fieldValues.plan && typeof fieldValues.plan === 'object') {
    const plan = fieldValues.plan as Record<string, unknown>;
    collectUnknownKeys(plan, planIds, 'plan', unknownKeys);
    for (const field of schema.fields.filter((item) => item.section === 'plan')) {
      values.plan[field.id] = normalizeFieldValue(plan[field.id]);
    }
  }

  if (unknownKeys.length > 0) {
    errors.push(`Unknown JSON keys rejected: ${unknownKeys.join(', ')}`);
  }

  return { values, unknownKeys, errors };
}

function isScalarCompliant(value: string, field: TemplateLockField): boolean {
  if (!value) return true;
  const lower = field.label.toLowerCase();

  if (lower.includes('temperature') && !lower.includes('route')) {
    return /^\d+(?:\.\d+)?\s*°?\s*[fc]?\s*$/i.test(value)
      || /^\d+(?:\.\d+)?°F$/i.test(value);
  }

  if (lower.includes('temperature route')) {
    return /^(temporal|oral|axillary|rectal|tympanic)$/i.test(value.trim());
  }

  if (lower.includes('assessment time')) {
    return /^\d{3,4}(?:\s*(?:am|pm))?$/i.test(value.trim())
      || /^\d{1,2}\/\d{1,2}\/\d{2,4}\s+at\s+\d{3,4}$/i.test(value.trim());
  }

  if (lower.includes('positioning per pnmp')) {
    return value.split(/\s+/).length <= 6 && !/[;]/.test(value);
  }

  return value.split(/\s+/).length <= 8 && !/\b(?:administered|resting|respirations|vital signs)\b/i.test(value);
}

function containsObjectiveOnlyContent(value: string): boolean {
  return OBJECTIVE_ONLY_PATTERNS.some((pattern) => pattern.test(value));
}

function containsSubjectiveSignal(value: string): boolean {
  return SUBJECTIVE_SIGNAL_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitizeTemplateLockValues(values: TemplateLockValues): TemplateLockValues {
  const sanitized = emptyTemplateLockValues();
  sanitized.assessment.clinicalSummary = values.assessment.clinicalSummary;

  for (const section of ['subjective', 'objective', 'plan'] as const) {
    for (const [key, rawValue] of Object.entries(values[section])) {
      const value = rawValue.trim();
      if (!value || isPlaceholderValue(value)) continue;
      sanitized[section][key] = value;
    }
  }

  if (isPlaceholderValue(sanitized.assessment.clinicalSummary)) {
    sanitized.assessment.clinicalSummary = '';
  }

  return sanitized;
}

export function validateTemplateLockValues(
  values: TemplateLockValues,
  schema: TemplateLockSchema,
  input: string,
): TemplateLockValidationResult {
  const errors: string[] = [];
  const sanitized = sanitizeTemplateLockValues(values);

  for (const field of schema.fields) {
    const value = sanitized[field.section === 'plan' ? 'plan' : field.section][field.id] ?? '';
    if (!value) continue;

    if (isNegativeFillerValue(value)) {
      errors.push(`Negative filler in ${field.id}: ${value}`);
    }

    if (field.kind === 'scalar' && !isScalarCompliant(value, field)) {
      errors.push(`Scalar field ${field.id} contains narrative content: ${value}`);
    }

    if (field.section === 'subjective' && containsObjectiveOnlyContent(value) && !containsSubjectiveSignal(value)) {
      errors.push(`Objective finding placed in subjective field ${field.id}: ${value}`);
    }
  }

  if (
    sanitized.plan.staffUnderstandingConfirmation
    && !detectStaffUnderstandingConfirmed(input)
    && !detectStaffUnderstandingConfirmed(sanitized.plan.staffUnderstandingConfirmation)
  ) {
    errors.push('Staff understanding confirmation not supported by source narrative');
  }

  if (sanitized.assessment.clinicalSummary) {
    if (/\bvital signs\b.*\btemperature\b/i.test(sanitized.assessment.clinicalSummary)) {
      errors.push('Assessment repeats raw objective vital sign data');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    values: sanitized,
  };
}

export function getTemplateLockFieldValue(
  values: TemplateLockValues,
  field: TemplateLockField,
): string {
  if (field.section === 'assessment') return values.assessment.clinicalSummary;
  return values[field.section][field.id] ?? '';
}

export function renderTemplateLockSoap(
  schema: TemplateLockSchema,
  values: TemplateLockValues,
): { subjective: string; objective: string; assessment: string; plan: string } {
  const lines = schema.template.split('\n');
  const sections: Record<TemplateLockSection, string[]> = {
    subjective: [],
    objective: [],
    assessment: [],
    plan: [],
  };
  let currentSection: TemplateLockSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^SUBJECTIVE:\s*$/i.test(trimmed)) {
      currentSection = 'subjective';
      sections.subjective.push('SUBJECTIVE:');
      const subjectiveFields = schema.fields.filter((item) => item.section === 'subjective');
      if (subjectiveFields.length === 0) {
        const narrative = values.subjective.sectionNarrative
          ?? Object.values(values.subjective).filter(Boolean).join(' ');
        if (narrative) sections.subjective.push(narrative);
      }
      continue;
    }
    if (/^OBJECTIVE:\s*$/i.test(trimmed)) {
      currentSection = 'objective';
      sections.objective.push('OBJECTIVE:');
      continue;
    }
    if (/^ASSESSMENT:\s*$/i.test(trimmed)) {
      currentSection = 'assessment';
      sections.assessment.push('ASSESSMENT:');
      continue;
    }
    if (/^PLAN:\s*$/i.test(trimmed)) {
      currentSection = 'plan';
      sections.plan.push('PLAN:');
      continue;
    }

    if (!currentSection) continue;

    if (!trimmed) {
      sections[currentSection].push('');
      continue;
    }

    if (
      currentSection === 'assessment'
      && schema.fixedAssessmentLabel
      && trimmed.replace(/\.$/, '') === schema.fixedAssessmentLabel.replace(/\.$/, '')
    ) {
      sections.assessment.push(trimmed);
      if (values.assessment.clinicalSummary) sections.assessment.push(values.assessment.clinicalSummary);
      continue;
    }

    if (isFieldPrompt(trimmed) && currentSection !== 'assessment') {
      sections[currentSection].push(trimmed);
      const field = schema.fields.find((item) => item.label === trimmed && item.section === currentSection);
      if (field) {
        const value = getTemplateLockFieldValue(values, field);
        if (value) sections[currentSection].push(value);
      }
      continue;
    }

    sections[currentSection].push(trimmed);
  }

  return {
    subjective: sections.subjective.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd(),
    objective: sections.objective.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd(),
    assessment: sections.assessment.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd(),
    plan: sections.plan.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd(),
  };
}

function buildFieldSchemaBlock(schema: TemplateLockSchema): string {
  const sections: Record<TemplateLockSection, TemplateLockField[]> = {
    subjective: [],
    objective: [],
    assessment: [],
    plan: [],
  };

  for (const field of schema.fields) sections[field.section].push(field);

  const lines: string[] = ['{', '  "fieldValues": {'];

  for (const section of ['subjective', 'objective', 'assessment', 'plan'] as const) {
    lines.push(`    "${section}": {`);
    if (section === 'assessment') {
      lines.push('      "clinicalSummary": ""');
    } else {
      for (const field of sections[section]) {
        const hint =
          field.kind === 'scalar'
            ? 'scalar value only'
            : field.kind === 'completion'
              ? 'supported completion text only'
              : 'narrative when supported';
        lines.push(`      "${field.id}": "", // ${field.label.replace(/:$/, '')} — ${hint}`);
      }
    }
    lines.push('    },');
  }

  lines.push('  }');
  lines.push('}');
  return lines.join('\n');
}

export function buildTemplateLockPass1Instructions(
  def: GuidelineDefinition,
  terminology: string,
  assessmentType: AssessmentType,
  includeSbar: boolean,
): string {
  const schema = buildTemplateLockSchema(def, assessmentType);
  const term = terminology.trim().toLowerCase() || 'resident';

  return `TEMPLATE LOCK MODE — STRUCTURED FIELD EXTRACTION ONLY

You are an expert RN documentation assistant for a State Supported Living Center.

YOUR ONLY JOB: Return structured JSON field values for the selected facility guideline.
You must NOT return SOAP section headings, prompt labels, template layout, or standing facility instructions.
The application renders the exact facility template in code.

TERMINOLOGY: Use "${term}" when referring to the person receiving care.

SECTION OWNERSHIP:
SUBJECTIVE — reported symptoms, complaints, denials, statements from resident/DSP/staff/family only.
  Allowed: "${term} denies chills.", "DSP reported no new symptoms."
  NOT allowed in subjective: resting comfortably, respirations, temperature values, vital signs, administered medications.

OBJECTIVE — observed, measured, assessed, administered, or documented findings only.
  Examples: "98.4°F", "Temporal", "Resident resting comfortably.", "PRN Tylenol administered at 1830."

ASSESSMENT — concise nursing interpretation in clinicalSummary only. Do not repeat raw vitals or objective field lists.

PLAN completion fields — supported completed actions only. Leave blank when unsupported.

FIELD VALUE RULES:
- Scalar fields (temperature, route, time): value only — no narrative sentences.
- Leave blank ("") when unsupported. Never use unknown, not provided, unable to determine, or similar filler.
- Do not auto-confirm staff understanding unless explicitly documented.

GUIDELINE: ${def.displayName}
ASSESSMENT TYPE: ${assessmentType}

Return ONLY valid JSON using this exact schema (no extra keys):
${buildFieldSchemaBlock(schema)}
${includeSbar ? `,
  "sbar": {
    "situation": "",
    "background": "",
    "assessment": "",
    "recommendation": ""
  }` : ''}

No markdown fences. No prose outside JSON.`;
}

export function buildTemplateLockPass1UserPrompt(clinicalInfo: string, supplementText: string): string {
  return `Extract structured field values from the nurse narrative.

Return ONLY the JSON object defined in the system instructions.
Do NOT generate SOAP headings, prompt labels, or template layout text.

NURSE NARRATIVE:
${clinicalInfo}

NURSE-SUPPLEMENTED DETAILS:
${supplementText}`;
}

export function buildTemplateLockPass2Instructions(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string {
  const schema = buildTemplateLockSchema(def, assessmentType);
  return `TEMPLATE LOCK MODE — PASS 2 JSON CORRECTION ONLY

You receive Pass 1 field values and validation errors.
Correct ONLY the JSON field values within the same schema.
Do NOT add, remove, or rename keys.
Do NOT return SOAP text, headings, labels, or standing instructions.
Do NOT insert negative filler phrases.
Leave unsupported fields blank ("").

Allowed schema:
${buildFieldSchemaBlock(schema)}

Return ONLY the corrected JSON object.`;
}

export function buildTemplateLockPass2UserPrompt(args: {
  sourceNarrative: string;
  draftValues: TemplateLockValues;
  validationErrors: string[];
}): string {
  return `Correct the structured field values using the source narrative and validation errors.

SOURCE NARRATIVE:
${args.sourceNarrative}

VALIDATION ERRORS:
${args.validationErrors.map((error) => `- ${error}`).join('\n')}

PASS 1 FIELD VALUES:
${JSON.stringify({ fieldValues: args.draftValues }, null, 2)}

Return ONLY the corrected JSON with the same keys.`;
}

export function templateLockValuesToStructuredSoap(
  schema: TemplateLockSchema,
  values: TemplateLockValues,
): { subjective: string; objective: string; assessment: string; plan: string } {
  return renderTemplateLockSoap(schema, values);
}

export function getTemplateLockFieldById(
  schema: TemplateLockSchema,
  fieldId: string,
): TemplateLockField | undefined {
  return schema.fields.find((field) => field.id === fieldId);
}

export function isStructuredFieldDocumented(
  values: TemplateLockValues,
  fieldId: string,
  schema: TemplateLockSchema,
): boolean {
  const field = getTemplateLockFieldById(schema, fieldId);
  if (!field) return false;
  const value = getTemplateLockFieldValue(values, field);
  return Boolean(value && !isPlaceholderValue(value));
}

export function parseTemplateLockSbar(raw: string): {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
} | null {
  const jsonText = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const sbar = parsed.sbar;
    if (!sbar || typeof sbar !== 'object') return null;
    const record = sbar as Record<string, unknown>;
    return {
      situation: normalizeFieldValue(record.situation),
      background: normalizeFieldValue(record.background),
      assessment: normalizeFieldValue(record.assessment),
      recommendation: normalizeFieldValue(record.recommendation),
    };
  } catch {
    return null;
  }
}

export interface TemplateLockPipelineResult {
  values: TemplateLockValues;
  schema: TemplateLockSchema;
  soap: { subjective: string; objective: string; assessment: string; plan: string };
  sbar: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  } | null;
  validationErrors: string[];
  pass2Ran: boolean;
}

export function buildTemplateLockDocumentation(args: {
  schema: TemplateLockSchema;
  aiValues: TemplateLockValues;
  input: string;
  def: GuidelineDefinition;
  assessmentType: AssessmentType;
  terminology: string;
}): Omit<TemplateLockPipelineResult, 'pass2Ran' | 'sbar'> {
  const deterministicValues = populateTemplateLockValuesFromInput(
    emptyTemplateLockValues(),
    args.schema,
    args.input,
    args.def,
    args.assessmentType,
    args.terminology,
  );
  const mergedValues = mergeTemplateLockValues(args.aiValues, deterministicValues, args.schema);
  const validation = validateTemplateLockValues(mergedValues, args.schema, args.input);
  const soap = renderTemplateLockSoap(args.schema, validation.values);

  return {
    values: validation.values,
    schema: args.schema,
    soap,
    validationErrors: [...validation.errors],
  };
}
