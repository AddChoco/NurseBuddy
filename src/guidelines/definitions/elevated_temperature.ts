import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const CURRENT_TEMPERATURE_KEYWORDS = [
  'current temperature', 'temperature', 'temp', 'febrile', 'fever', 'elevated temperature',
  'afebrile', '°f', '°c', '/f', '/c', '100.', '101.', '102.', '103.', '38.', '39.', '40.',
  '체온', 'temperatura', 'oral temp', 'tympanic', 'axillary', 'rectal temp',
];

const INFECTION_SYMPTOMS_KEYWORDS = [
  'signs of infection', 'infection', 'symptom', 'symptoms', 'chills', 'malaise', 'fatigue',
  'cough', 'sore throat', 'congestion', 'runny nose', 'dysuria', 'urinary', 'burning',
  'wound', 'redness', 'drainage', 'purulent', 'swelling', 'pain', 'nausea', 'headache',
  'lethargy', 'confusion', 'no symptoms', 'denies symptoms', 'observed',
];

const ENVIRONMENTAL_FACTORS_KEYWORDS = [
  'environmental', 'environment', 'contributing factor', 'room temperature', 'overheated',
  'heat', 'hot room', 'blankets', 'clothing', 'layers', 'outdoor', 'sun', 'physical activity',
  'exercise', 'ambulating', 'warm environment', 'dehydration', 'recent bath',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'intervention', 'interventions completed', 'tylenol', 'acetaminophen',
  'ibuprofen', 'antipyretic', 'medication given', 'administered', 'monitor', 'observed',
  'completed', 'provided', 'cooling', 'sponge bath',
];

const HYDRATION_STRATEGIES_KEYWORDS = [
  'hydration', 'dehydration', 'prevent dehydration', 'encouraged fluids', 'fluid intake',
  'oral fluids', 'water', 'juice', 'popsicle', 'iv fluid', 'hydrating', 'drinking',
];

const COMFORT_MEASURES_KEYWORDS = [
  'comfort measure', 'comfort measures', 'cool cloth', 'fan', 'lukewarm', 'rest',
  'reposition', 'light clothing', 'remove blankets', 'ice pack', 'cooling measures',
];

const FOLLOW_UP_MONITORING_KEYWORDS = [
  'every 4 hours', 'q4', 'q4h', 'monitor temperature', '48 hours', '48 consecutive',
  'fever-free', 'symptoms resolved', 'follow-up monitoring', 'reassess temp', 'temp checks',
  'ongoing monitoring', 'until fever',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_INSTRUCTION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'instructions provided',
  'education provided', 'instructed staff',
];

const LAST_ELEVATED_TEMP_KEYWORDS = [
  'last elevated', 'last fever', 'last documented temperature', 'last febrile',
  'date and time of last', 'previous temperature', 'last temp', 'most recent fever',
];

const FEVER_FREE_KEYWORDS = [
  'fever-free', 'fever free', 'afebrile', 'without fever', 'no fever', 'remained afebrile',
  'has remained fever-free', 'not febrile', 'resolved fever', 'temperature normal',
];

function tempField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `TEMPERATURE ELEVATION — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any symptoms reported by the resident or staff related to the elevated temperature.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Current temperature
- Signs and symptoms of infection
- Environmental factors that may have contributed to the elevated temperature

ASSESSMENT:
Temperature Elevation

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document temperature at least every 4 hours until BOTH:
  • 48 hours after symptoms have resolved, AND/OR
  • 48 consecutive hours without fever,
  according to the facility guideline (monitoring requirement — do not invent completion).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Implement strategies to prevent dehydration (only if reported).
- Implement comfort measures (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never fabricate a temperature. Never assume the resident is fever-free unless documented. Never assume an infection is present without assessment findings.`;

const FOLLOW_UP_RESOLUTION_INSTRUCTIONS = `TEMPERATURE ELEVATION — FOLLOW-UP / RESOLUTION

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any new or continuing symptoms reported by the resident or staff.
- If the resident is unable to report symptoms, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Date and time of the last documented elevated temperature
- Current temperature

ASSESSMENT:
Elevated Temperature (Resolving)

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document whether the individual has remained fever-free (only if supported by assessment).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if additional follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never fabricate a temperature. Never assume fever-free status unless documented.`;

export const ELEVATED_TEMPERATURE_GUIDELINE: GuidelineDefinition = {
  id: 'elevated_temperature',
  displayName: 'Elevated Temperature',
  description:
    'Temperature Elevation facility guideline. Document current temperature, infection signs/symptoms, environmental factors, interventions, hydration and comfort measures, and q4 monitoring until 48 hours fever-free or symptoms resolved. Never fabricate temperatures or assume fever-free status.',

  assessment: {
    requiredFields: [
      tempField('Current temperature', CURRENT_TEMPERATURE_KEYWORDS),
      tempField('Signs and symptoms of infection', INFECTION_SYMPTOMS_KEYWORDS, false),
      tempField('Environmental factors that may have contributed to the elevated temperature', ENVIRONMENTAL_FACTORS_KEYWORDS, false),
    ],
    optionalFields: [
      fieldFromLabel('Date and time of the last documented elevated temperature', {
        matchKeywords: LAST_ELEVATED_TEMP_KEYWORDS,
        description: 'Follow-up / resolution assessment.',
      }),
      fieldFromLabel('Fever-free status', {
        matchKeywords: FEVER_FREE_KEYWORDS,
        description: 'Follow-up / resolution assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    tempField('Current temperature', CURRENT_TEMPERATURE_KEYWORDS),
    tempField('Signs or symptoms of infection', INFECTION_SYMPTOMS_KEYWORDS, false),
    tempField('Environmental contributing factors', ENVIRONMENTAL_FACTORS_KEYWORDS, false),
    tempField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    tempField('Hydration strategies', HYDRATION_STRATEGIES_KEYWORDS, false),
    tempField('Comfort measures', COMFORT_MEASURES_KEYWORDS, false),
    tempField('Follow-up monitoring plan', FOLLOW_UP_MONITORING_KEYWORDS, false),
    tempField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    tempField('Staff instruction documentation', STAFF_INSTRUCTION_KEYWORDS, false),
    tempField('Date/time of last elevated temperature', LAST_ELEVATED_TEMP_KEYWORDS, false),
    tempField('Fever-free status', FEVER_FREE_KEYWORDS, false),
  ],

  documentation: {
    initialAssessment: {
      applicable: true,
      instructions: INITIAL_ASSESSMENT_INSTRUCTIONS,
    },

    followUpAssessment: {
      applicable: true,
      instructions: FOLLOW_UP_RESOLUTION_INSTRUCTIONS,
    },

    resolutionAssessment: {
      applicable: true,
      instructions: `RESOLUTION ASSESSMENT — Temperature Elevation

Document guideline closure only when input supports:
- 48 consecutive hours without fever and/or 48 hours after symptoms resolved per facility guideline
- Fever-free status documented
- Required temperature monitoring period complete as reported

Do not mark temperature guideline resolved unless fever-free status and monitoring completion are supported.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Temperature Elevation

SUBJECTIVE: symptoms reported by resident or staff related to elevated temperature; observed findings only if resident unable to report. Do not invent symptoms.
OBJECTIVE: Interactive View Assessment; current temperature, infection signs/symptoms, environmental contributing factors — only if provided. Never fabricate temperature.
ASSESSMENT: Temperature Elevation (initial) or Elevated Temperature (Resolving) on follow-up — as supported.
PLAN: nursing interventions, q4 temp monitoring until 48-hour criteria met, hydration, comfort measures, handoff, staff understanding — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Temperature Elevation

SITUATION: resident with elevated temperature per guideline.
BACKGROUND: supported symptom history and prior temperature readings if reported.
ASSESSMENT: current temperature, infection signs/symptoms, environmental factors — only if provided.
RECOMMENDATION: continued q4 monitoring, hydration and comfort measures, handoff if follow-up indicated — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Temperature Elevation

Plain-language summary of supported facts: resident had elevated temperature, comfort measures and monitoring steps staff took, follow-up plan if reported.
Do not include specific temperatures or clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Temperature Elevation

Document provider notification only if it occurred or is explicitly indicated per facility policy.
Include supported current temperature, infection signs/symptoms, interventions, and fever trend if reported.
Never fabricate temperature or assume infection without assessment findings.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Document temperature at least every 4 hours until 48 hours after symptoms resolved and/or 48 consecutive hours without fever.',
    monitoringPoints: [
      'Current temperature on each assessment',
      'Date and time of last documented elevated temperature',
      'Signs and symptoms of infection',
      'Fever-free status when applicable',
      'Hydration and comfort measure effectiveness',
    ],
    reassessmentCriteria: [
      'Persistent or rising temperature',
      'New or worsening infection signs or symptoms',
      'Failure to meet 48-hour fever-free or symptom-resolution criteria',
    ],
    instructions:
      'Use follow-up/resolution template when monitoring ongoing fever or documenting resolution. Document fever-free status only when supported by assessment.',
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      '48 consecutive hours without fever documented',
      'And/or 48 hours after symptoms resolved per facility guideline',
      'Required q4 temperature monitoring period complete as documented',
    ],
    instructions:
      'Do not mark temperature guideline resolved unless fever-free status and monitoring completion are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify provider per facility policy for significant or persistent fever, infection concerns, or abnormal findings. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant temperature-related change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Persistent elevated temperature',
      'Signs or symptoms suggesting infection',
      'Failure to become fever-free within expected timeframe',
      'Abnormal assessment findings',
    ],
    prohibitedAutoNotifications: [
      'Do not document provider notification unless explicitly reported or indicated.',
      'Do not assume infection or fever resolution without documented assessment findings.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident education about hydration, comfort measures, or symptom reporting only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about temperature monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate a temperature.',
    'Never assume the resident is fever-free unless documented.',
    'Never assume an infection is present without assessment findings.',
    'Never invent symptoms.',
    'Document only assessment findings that are provided.',
    'If the resident is nonverbal or unable to report symptoms, document observed findings only.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
