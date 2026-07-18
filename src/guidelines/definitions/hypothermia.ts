import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const CURRENT_TEMPERATURE_KEYWORDS = [
  'current temperature', 'temperature', 'temp', 'hypothermia', 'low temperature', 'cold',
  '95.', '96.', '97.', '94.', '35.', '36.', '°f', '°c', '/f', '/c', '체온', 'temperatura',
  'oral temp', 'tympanic', 'axillary', 'rectal temp',
];

const RECTAL_VERIFICATION_KEYWORDS = [
  'rectal verification', 'rectal temperature verified', 'rectal temp', 'rectal temperature',
  'contraindicated', 'not contraindicated', 'unable to obtain rectal', 'rectal probe',
  'verified rectally', 'no rectal',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'rewarming',
];

const WARMING_MEASURES_KEYWORDS = [
  'warming measures', 'warming measure', 'warming blanket', 'bair hugger', 'warm blankets',
  'heated blanket', 'rewarming', 'warm fluids', 'warming implemented', 'passive warming',
  'active warming',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'no improvement', 'abnormal findings', 'not notified', 'no notification',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const WARMING_DISCONTINUED_KEYWORDS = [
  'discontinued warming', 'warming discontinued', 'warming measures discontinued',
  'reached 97', '97°f', '97 f', '36.1°c', '36.1 c', 'discontinue warming',
];

const ONE_HOUR_REASSESSMENT_KEYWORDS = [
  'reassess in 1 hour', 'one hour reassessment', '1 hour reassessment', 'reassess one hour',
  'reassessment in one hour', '1-hour reassessment',
];

const Q4_24H_MONITORING_KEYWORDS = [
  'every 4 hours for 24 hours', 'every 4 hours for the next 24', 'q4 for 24',
  '4 hours for 24 hours', 'assess temperature every 4 hours', '24 hour monitoring',
];

const REINITIATION_KEYWORDS = [
  'reinitiate', 'reinitiated', 'drops below 96', 'below 96°f', 'below 35°c', '96°f',
  '35°c', 'temperature drops below', 'guideline reinitiated', 'falls below 96',
];

const MONITORING_SCHEDULE = `FACILITY MONITORING SCHEDULE (preserve exactly):
- Every 30 minutes until rectal temperature reaches 97°F (36.1°C).
- Reassess 1 hour after warming measures are discontinued.
- Then assess temperature every 4 hours for 24 hours.
- Reinitiate the hypothermia guideline if temperature falls below 96°F (35°C).
Never change these facility temperature thresholds.`;

function hypothermiaField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `HYPOTHERMIA — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms reported by the resident or staff related to hypothermia.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Current temperature
- Rectal verification of temperature (unless contraindicated)

ASSESSMENT:
Hypothermia

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Continue nursing follow-up and document every 30 minutes until a rectal temperature of 97°F (36.1°C) is achieved (monitoring requirement — do not invent completion).
- Document warming measures implemented (only if reported).
- Notify PCP if there is no improvement or if abnormal findings are noted during assessment (only if notification occurred or is explicitly indicated).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

${MONITORING_SCHEDULE}

Never fabricate a temperature. Never assume rectal temperature verification was performed unless documented.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `HYPOTHERMIA — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any new or continuing symptoms reported by the resident or staff.
- If the resident cannot report symptoms, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Current temperature
- Rectal verification of temperature (unless contraindicated)

ASSESSMENT:
Hypothermia

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- When the temperature reaches 97°F (36.1°C), discontinue warming measures and reassess in 1 hour to ensure resolution (only if supported by documented temperature and actions).
- Assess and document temperature every 4 hours for the next 24 hours (monitoring requirement — do not invent completion).
- Reinitiate the hypothermia guideline if the temperature drops below 96°F (35°C) (only if supported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify PCP if there is no improvement or abnormal findings are noted during assessment (only if notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

${MONITORING_SCHEDULE}

Never assume hypothermia has resolved unless documented.`;

export const HYPOTHERMIA_GUIDELINE: GuidelineDefinition = {
  id: 'hypothermia',
  displayName: 'Hypothermia',
  description:
    'Hypothermia facility guideline. Document current and rectally verified temperature, warming measures, and monitoring every 30 minutes until 97°F (36.1°C), then 1-hour reassessment and q4 x 24 hours. Reinitiate if below 96°F (35°C). Never fabricate temperatures.',

  assessment: {
    requiredFields: [
      hypothermiaField('Current temperature', CURRENT_TEMPERATURE_KEYWORDS),
      hypothermiaField('Rectal verification of temperature (unless contraindicated)', RECTAL_VERIFICATION_KEYWORDS, false),
    ],
    optionalFields: [],
  },

  missingInformationChecklist: [
    hypothermiaField('Current temperature', CURRENT_TEMPERATURE_KEYWORDS),
    hypothermiaField('Rectal temperature verification (unless contraindicated)', RECTAL_VERIFICATION_KEYWORDS, false),
    hypothermiaField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    hypothermiaField('Warming measures', WARMING_MEASURES_KEYWORDS, false),
    hypothermiaField('PCP notification when indicated', PCP_NOTIFICATION_KEYWORDS, false),
    hypothermiaField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    hypothermiaField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    hypothermiaField('Confirmation that warming measures were discontinued when 97°F (36.1°C) was reached', WARMING_DISCONTINUED_KEYWORDS, false),
    hypothermiaField('One-hour reassessment', ONE_HOUR_REASSESSMENT_KEYWORDS, false),
    hypothermiaField('Every-4-hour temperature monitoring plan for 24 hours', Q4_24H_MONITORING_KEYWORDS, false),
    hypothermiaField('Reinitiation criteria if temperature drops below 96°F (35°C)', REINITIATION_KEYWORDS, false),
  ],

  documentation: {
    initialAssessment: {
      applicable: true,
      instructions: INITIAL_ASSESSMENT_INSTRUCTIONS,
    },

    followUpAssessment: {
      applicable: true,
      instructions: FOLLOW_UP_ASSESSMENT_INSTRUCTIONS,
    },

    resolutionAssessment: {
      applicable: true,
      instructions: `RESOLUTION ASSESSMENT — Hypothermia

Document guideline closure only when input supports:
- Rectal temperature reached and maintained at 97°F (36.1°C) or above as documented
- Warming measures discontinued with 1-hour reassessment confirming resolution
- Required q4 temperature monitoring for 24 hours complete as reported
- No drop below 96°F (35°C) requiring reinitiation

Do not mark hypothermia guideline resolved unless supported by provided information.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Hypothermia

SUBJECTIVE: hypothermia-related symptoms reported or observed; do not invent symptoms.
OBJECTIVE: Interactive View Assessment; current temperature and rectal verification (unless contraindicated) — only if provided. Never fabricate temperatures.
ASSESSMENT: Hypothermia
PLAN: interventions, q30 monitoring until 97°F (36.1°C) rectal, warming measures, PCP notification, handoff, staff understanding — only if supported. Preserve facility thresholds and monitoring schedule.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Hypothermia

SITUATION: resident with hypothermia per facility guideline.
BACKGROUND: supported symptom history and prior temperature readings if reported.
ASSESSMENT: current temperature and rectal verification — only if provided.
RECOMMENDATION: warming measures, q30 monitoring until 97°F (36.1°C), PCP notification for no improvement/abnormal findings, handoff — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Hypothermia

Plain-language summary of supported facts: resident had low temperature being monitored, warming measures taken, follow-up plan if reported.
Do not include specific temperatures beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Hypothermia

Notify PCP if no improvement or abnormal findings noted during assessment — document only if notification occurred or is explicitly indicated.
Include supported current temperature, rectal verification status, warming measures, and monitoring progress. Never fabricate temperatures.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Document every 30 minutes until rectal temperature reaches 97°F (36.1°C); then reassess 1 hour after warming discontinued; then q4 for 24 hours.',
    monitoringPoints: [
      'Current temperature and rectal verification on each assessment',
      'Warming measures implemented and discontinued at 97°F (36.1°C)',
      'One-hour reassessment after warming discontinued',
      'Every-4-hour temperature for 24 hours',
      'Reinitiation if temperature drops below 96°F (35°C)',
    ],
    reassessmentCriteria: [
      'Failure to reach 97°F (36.1°C) with warming measures',
      'Temperature drop below 96°F (35°C) after initial improvement',
      'No improvement or abnormal findings',
      'Recurrence after apparent resolution',
    ],
    instructions: MONITORING_SCHEDULE,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Rectal temperature 97°F (36.1°C) achieved and maintained as documented',
      'One-hour reassessment after warming discontinued confirms resolution',
      'Required q4 monitoring for 24 hours complete without drop below 96°F (35°C)',
    ],
    instructions:
      'Do not mark hypothermia guideline resolved unless temperature thresholds and monitoring completion are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if there is no improvement or abnormal findings noted during assessment. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant hypothermia-related change is reported. Do not auto-notify unless supported.',
    triggers: [
      'No improvement with warming measures',
      'Abnormal assessment findings',
      'Failure to reach 97°F (36.1°C) within expected timeframe',
      'Temperature drop below 96°F (35°C) requiring reinitiation',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless no improvement, abnormal findings, or explicit notification is reported.',
      'Do not assume rectal verification or hypothermia resolution without documented assessment.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident education about warmth or symptom reporting only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about hypothermia monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate a temperature.',
    'Never assume rectal temperature verification was performed.',
    'Never assume hypothermia has resolved unless documented.',
    'Preserve the facility monitoring schedule exactly: every 30 minutes until 97°F (36.1°C); reassess 1 hour after warming discontinued; then q4 for 24 hours; reinitiate if below 96°F (35°C).',
    'Never change the facility temperature thresholds.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
