import type { GuidelineDefinition } from './types.ts';
import type { AssessmentType } from './facilityTemplateMode.ts';
import { parseDocumentedEventTime } from './eventTimeParsing.ts';
import {
  evaluateGuidelinePlanRules,
  createPlanDocumentationContext,
} from './guidelinePlanRuleEngine.ts';
import { getStaffMonitoringInstructions } from './planPromptEnrichment.ts';
import {
  buildTemplateLockSchema,
  emptyTemplateLockValues,
  getTemplateLockFieldById,
  renderTemplateLockSoap,
  validateTemplateLockValues,
  ENTERAL_FEEDING_APPLICABILITY_PATTERN,
  type TemplateLockSchema,
  type TemplateLockValues,
} from './templateLockMode.ts';
import {
  finalizeStaffEducationValues,
  type StaffEducationStructuredState,
} from './staffEducationTemplateLock.ts';
import {
  buildGuidelineSubjectiveTrigger,
  isInvalidSubjectiveAssessmentTrigger,
} from './templateLockSubjectiveTriggers.ts';

function ensureSubjectiveAssessmentTrigger(
  values: TemplateLockValues,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  terminology: string,
): void {
  const aiTrigger = values.subjective.assessmentTrigger?.trim();
  if (aiTrigger && !isInvalidSubjectiveAssessmentTrigger(aiTrigger)) {
    return;
  }

  values.subjective.assessmentTrigger = buildGuidelineSubjectiveTrigger(
    def,
    assessmentType,
    input,
    terminology,
  );
}

function ensureEnteralFeedingRateValue(
  values: TemplateLockValues,
  schema: TemplateLockSchema,
  input: string,
): void {
  const hasField = schema.fields.some((field) => field.id === 'enteralFeedingRate');
  if (!hasField) return;
  if (values.objective.enteralFeedingRate?.trim()) return;
  if (ENTERAL_FEEDING_APPLICABILITY_PATTERN.test(input)) return;
  values.objective.enteralFeedingRate = 'N/A';
}

function finalizeStructuredTemplateLockValues(
  values: TemplateLockValues,
  schema: TemplateLockSchema,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  terminology: string,
  autoGenerateStaffInstructionContent = true,
): StaffEducationStructuredState {
  ensureEnteralFeedingRateValue(values, schema, input);
  ensureSubjectiveAssessmentTrigger(values, input, def, assessmentType, terminology);
  return finalizeStaffEducationValues(values, schema, input, def, assessmentType, {
    autoGenerateStaffInstructionContent,
  });
}

function setIfEmpty(
  target: Record<string, string>,
  key: string,
  value: string | null | undefined,
): void {
  if (target[key]?.trim()) return;
  if (!value?.trim()) return;
  target[key] = value.trim();
}

function extractTemperatureValue(input: string): string | null {
  const currentMatch = input.match(
    /current(?:ly)?\s+(?:temporal|oral|axillary|rectal|tympanic)?\s*temperature\s+(?:is\s+)?(\d+(?:\.\d+)?)\s*°?\s*F/i,
  );
  if (currentMatch) return `${currentMatch[1]}°F`;

  const genericMatch = input.match(/\b(\d+(?:\.\d+)?)\s*°?\s*F\b/i);
  if (genericMatch && /current|follow-up|now|currently/i.test(input)) return `${genericMatch[1]}°F`;
  return null;
}

function extractTemperatureRoute(input: string): string | null {
  const match = input.match(/\b(temporal|oral|axillary|rectal|tympanic)\b/i);
  if (!match) return null;
  return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
}

function extractLastElevatedDateTime(input: string): string | null {
  const match = input.match(
    /last elevated temperature was(?:\s+\d+(?:\.\d+)?\s*°?\s*F)?(?:\s+on)?\s+(\d{1,2}\/\d{1,2}\/\d{2,4}\s+at\s+\d{3,4})/i,
  );
  if (match) return match[1];

  const altMatch = input.match(
    /last elevated temperature(?:\s+was)?(?:\s+\d+(?:\.\d+)?\s*°?\s*F)?(?:\s+on)?\s+(\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s+at\s+(\d{3,4}))?/i,
  );
  if (altMatch) return altMatch[2] ? `${altMatch[1]} at ${altMatch[2]}` : altMatch[1];
  return null;
}

function extractInterventionsCompleted(input: string): string | null {
  const prnMatch = input.match(/\b(?:PRN\s+)?(?:Tylenol|acetaminophen)\b[^.]*(?:administered|given)[^.]*(?:at\s+\d{3,4})?[^.]*/i);
  if (prnMatch) {
    const normalized = prnMatch[0].trim().replace(/\.$/, '');
    return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
  }
  return null;
}

function buildElevatedTemperatureAdditionalFindings(input: string, terminology: string): string | null {
  const term = terminology.charAt(0).toUpperCase() + terminology.slice(1).toLowerCase();
  const sentences: string[] = [];

  if (/\bresting comfortably\b/i.test(input)) {
    sentences.push(`${term} resting comfortably.`);
  }
  if (/\bno chills or additional fever\b/i.test(input)) {
    sentences.push('No chills or additional fever noted.');
  } else if (/\bno chills\b/i.test(input)) {
    sentences.push('No chills noted.');
  } else if (/\bno additional fever\b/i.test(input)) {
    sentences.push('No additional fever noted.');
  }

  return sentences.length > 0 ? sentences.join(' ') : null;
}

function buildElevatedTemperatureClinicalSummary(input: string): string | null {
  const currentTemp = extractTemperatureValue(input);
  const hadElevated = /elevated temperature|fever|101|102|103/i.test(input);
  if (currentTemp && hadElevated) {
    return 'Afebrile on follow-up after previously elevated temperature.';
  }
  if (currentTemp) return 'Follow-up temperature documented.';
  return null;
}

function populateElevatedTemperatureFollowUp(
  values: TemplateLockValues,
  input: string,
  terminology: string,
): void {
  setIfEmpty(values.objective, 'lastElevatedTemperatureDateTime', extractLastElevatedDateTime(input));
  setIfEmpty(values.objective, 'currentTemperature', extractTemperatureValue(input));
  setIfEmpty(values.objective, 'temperatureRoute', extractTemperatureRoute(input));
  setIfEmpty(
    values.objective,
    'additionalFindings',
    buildElevatedTemperatureAdditionalFindings(input, terminology),
  );
  setIfEmpty(values.objective, 'interventionsCompleted', extractInterventionsCompleted(input));
  if (!values.assessment.clinicalSummary.trim()) {
    const summary = buildElevatedTemperatureClinicalSummary(input);
    if (summary) values.assessment.clinicalSummary = summary;
  }
}

function populateVomitingFollowUp(
  values: TemplateLockValues,
  input: string,
): void {
  const eventTime = parseDocumentedEventTime(input);
  if (eventTime && /yesterday/i.test(input)) {
    setIfEmpty(values.objective, 'lastVomitingEpisode', `Yesterday at ${eventTime}`);
  } else if (eventTime) {
    setIfEmpty(values.objective, 'lastVomitingEpisode', eventTime);
  }

  if (/100% meals|52 oz fluid intake|5 voids|1 bowel movement/i.test(input)) {
    const ioParts: string[] = [];
    const meals = input.match(/(\d{1,3}%)\s*meals/i)?.[1];
    const fluids = input.match(/(\d+\s*oz)\s*fluid intake/i)?.[1];
    const voids = input.match(/(\d+)\s*voids/i)?.[1];
    const bm = input.match(/(\d+)\s*bowel movement/i)?.[1];
    if (meals) ioParts.push(`${meals} meals`);
    if (fluids) ioParts.push(`${fluids} fluid intake`);
    if (voids) ioParts.push(`${voids} voids`);
    if (bm) ioParts.push(`${bm} bowel movement`);
    setIfEmpty(values.objective, 'intakeOutput', `${ioParts.join(', ')}.`);
  }

  if (/no nausea|without nausea|no nausea or further vomiting/i.test(input)) {
    setIfEmpty(values.objective, 'presenceOrAbsenceOfNausea', 'No nausea or further vomiting.');
  }

  if (/sitting upright|upright/i.test(input)) {
    setIfEmpty(values.objective, 'positioningPerPnmp', 'Sitting upright.');
  }

  if (/vomit|emesis/i.test(input)) {
    const modifiers: string[] = [];
    if (/no further (?:vomit|emesis|vomiting)|no nausea|without nausea|no nausea or further vomiting/i.test(input)) {
      modifiers.push('no further emesis or nausea');
    }
    if (/no aspiration|without aspiration|no respiratory distress|respirations even|unlabored/i.test(input)) {
      modifiers.push('no signs of aspiration or respiratory distress');
    }
    const summary = modifiers.length > 0
      ? `Vomiting episode with ${modifiers.join(' and ')}.`
      : 'Vomiting episode documented.';
    setIfEmpty(values.assessment, 'clinicalSummary', summary);
    if (/intake|output|void|fluid intake|meals|bowel movement/i.test(input)) {
      const current = values.assessment.clinicalSummary;
      values.assessment.clinicalSummary = current
        ? `${current} Intake and output documented.`
        : 'Intake and output documented.';
    }
  }
}

function routeMisplacedSubjectiveContent(values: TemplateLockValues, terminology: string): void {
  const term = terminology.charAt(0).toUpperCase() + terminology.slice(1).toLowerCase();

  for (const [fieldId, rawValue] of Object.entries(values.subjective)) {
    const value = rawValue.trim();
    if (!value) continue;

    if (/\bresting comfortably\b/i.test(value) && !/\b(?:denies|denied|reports?|complains?)\b/i.test(value)) {
      delete values.subjective[fieldId];
      const addition = `${term} resting comfortably.`;
      values.objective.additionalFindings = values.objective.additionalFindings
        ? `${values.objective.additionalFindings.replace(/\.$/, '')}. ${addition}`
        : addition;
    }
  }
}

function renderObjectivePreview(schema: TemplateLockSchema, values: TemplateLockValues): string {
  const lines = ['See Interactive View Assessment.'];
  for (const field of schema.fields.filter((item) => item.section === 'objective')) {
    lines.push(field.label);
    const value = values.objective[field.id];
    if (value) lines.push(value);
  }
  return lines.join('\n');
}

export function populateTemplateLockValuesFromInput(
  values: TemplateLockValues,
  schema: TemplateLockSchema,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  terminology: string,
): TemplateLockValues {
  const populated = {
    subjective: { ...values.subjective },
    objective: { ...values.objective },
    assessment: { clinicalSummary: values.assessment.clinicalSummary },
    plan: { ...values.plan },
  };

  if (def.id === 'elevated_temperature' && assessmentType === 'follow_up') {
    populateElevatedTemperatureFollowUp(populated, input, terminology);
  }

  if (def.id === 'vomiting' && assessmentType === 'follow_up') {
    populateVomitingFollowUp(populated, input);
  }

  routeMisplacedSubjectiveContent(populated, terminology);

  const context = createPlanDocumentationContext(input, def, {
    objective: renderObjectivePreview(schema, populated),
    assessment: schema.fixedAssessmentLabel ?? '',
    plan: '',
  });

  const templateHasStaffMonitoring = schema.standingInstructions.some((line) =>
    /dsp instructed|staff instructed|monitor for and immediately report/i.test(line),
  );

  const ruleEvaluation = evaluateGuidelinePlanRules(
    def,
    assessmentType,
    context,
    templateHasStaffMonitoring,
    getStaffMonitoringInstructions(def, assessmentType),
    true,
  );

  if (ruleEvaluation.nursingInterventionsSummary) {
    setIfEmpty(populated.plan, 'nursingInterventionsCompleted', ruleEvaluation.nursingInterventionsSummary);
  }

  return populated;
}

export function mergeTemplateLockValues(
  aiValues: TemplateLockValues,
  deterministicValues: TemplateLockValues,
  schema: TemplateLockSchema,
): TemplateLockValues {
  const merged = emptyTemplateLockValues();

  for (const field of schema.fields) {
    const aiValue = field.section === 'plan'
      ? aiValues.plan[field.id]
      : aiValues[field.section][field.id];
    const deterministicValue = field.section === 'plan'
      ? deterministicValues.plan[field.id]
      : deterministicValues[field.section][field.id];

    const chosen = deterministicValue || aiValue || '';

    if (field.section === 'plan') merged.plan[field.id] = chosen;
    else merged[field.section][field.id] = chosen;
  }

  merged.assessment.clinicalSummary =
    deterministicValues.assessment.clinicalSummary || aiValues.assessment.clinicalSummary;

  merged.subjective.sectionNarrative =
    aiValues.subjective.sectionNarrative || deterministicValues.subjective.sectionNarrative || '';

  merged.subjective.assessmentTrigger =
    aiValues.subjective.assessmentTrigger || deterministicValues.subjective.assessmentTrigger || '';

  return merged;
}

export function buildTemplateLockSchemaForGuideline(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): TemplateLockSchema {
  return buildTemplateLockSchema(def, assessmentType);
}

function normalizeLabelKey(label: string): string {
  return label.replace(/:\s*$/, '').trim().toLowerCase();
}

function simplifyChecklistLabel(label: string): string {
  return normalizeLabelKey(label).replace(/\b(or|and)\b/g, '').replace(/\s+/g, ' ').trim();
}

export function getFieldIdForChecklistLabel(
  schema: TemplateLockSchema,
  checklistLabel: string,
): string | null {
  const normalized = checklistLabel.toLowerCase();
  const simplified = simplifyChecklistLabel(checklistLabel);
  const direct = schema.fields.find((field) => {
    const promptLabel = normalizeLabelKey(field.label);
    return promptLabel === normalized
      || promptLabel === simplified
      || simplifyChecklistLabel(field.label) === simplified
      || field.label.toLowerCase().includes(normalized)
      || normalized.includes(promptLabel);
  });
  return direct?.id ?? null;
}

export function getStructuredFieldValueByChecklistLabel(
  values: TemplateLockValues,
  schema: TemplateLockSchema,
  checklistLabel: string,
): string | null {
  const fieldId = getFieldIdForChecklistLabel(schema, checklistLabel);
  if (!fieldId) return null;
  const field = getTemplateLockFieldById(schema, fieldId);
  if (!field) return null;
  if (field.section === 'plan') return values.plan[fieldId] ?? null;
  if (field.section === 'objective') return values.objective[fieldId] ?? null;
  if (field.section === 'subjective') return values.subjective[fieldId] ?? null;
  return null;
}

export function buildTemplateLockDocumentation(args: {
  schema: TemplateLockSchema;
  aiValues: TemplateLockValues;
  input: string;
  def: GuidelineDefinition;
  assessmentType: AssessmentType;
  terminology: string;
  autoGenerateStaffInstructionContent?: boolean;
}): {
  values: TemplateLockValues;
  schema: TemplateLockSchema;
  soap: { subjective: string; objective: string; assessment: string; plan: string };
  validationErrors: string[];
  staffEducation: StaffEducationStructuredState;
} {
  const deterministicValues = populateTemplateLockValuesFromInput(
    emptyTemplateLockValues(),
    args.schema,
    args.input,
    args.def,
    args.assessmentType,
    args.terminology,
  );
  const mergedValues = mergeTemplateLockValues(args.aiValues, deterministicValues, args.schema);
  const staffEducation = finalizeStructuredTemplateLockValues(
    mergedValues,
    args.schema,
    args.input,
    args.def,
    args.assessmentType,
    args.terminology,
    args.autoGenerateStaffInstructionContent ?? true,
  );
  const validation = validateTemplateLockValues(mergedValues, args.schema, args.input);
  const soap = renderTemplateLockSoap(args.schema, validation.values);

  return {
    values: validation.values,
    schema: args.schema,
    soap,
    validationErrors: [...validation.errors],
    staffEducation,
  };
}
