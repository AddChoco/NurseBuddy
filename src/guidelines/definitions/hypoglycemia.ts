import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const INITIAL_BLOOD_GLUCOSE_KEYWORDS = [
  'blood glucose', 'glucose level', 'current blood glucose', 'bg level', 'bg:',
  'mg/dl', 'mg/dL', 'hypoglycemia', 'hypoglycemic', 'low blood sugar', 'low glucose',
  'fingerstick', 'glucometer', 'capillary glucose', 'blood sugar',
];

const FOLLOW_UP_BLOOD_GLUCOSE_KEYWORDS = [
  'follow-up blood glucose', 'follow up blood glucose', 'repeat blood glucose',
  'recheck glucose', 'repeat glucose', '15 minutes after', 'post intervention glucose',
  'blood glucose', 'glucose level', 'mg/dl', 'mg/dL',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'comfort', 'safety',
];

const GLUCOSE_ADMINISTRATION_KEYWORDS = [
  '15-20 grams', '15 to 20 grams', '15–20 grams', '20 grams glucose', 'glucose administered',
  'glucose given', 'orange juice', 'glucose gel', 'glucocard', 'fast acting carbohydrate',
  'juice', 'not administered', 'no glucose given', 'declined glucose',
];

const TIME_GLUCOSE_ADMINISTERED_KEYWORDS = [
  'time given', 'time glucose', 'administered at', 'given at', 'glucose at',
  'time administered', 'at 14:', 'at 15:', 'at 16:',
];

const GLUCAGON_ADMINISTRATION_KEYWORDS = [
  'glucagon', '1 mg glucagon', 'glucagon administered', 'glucagon given',
  'not administered glucagon', 'no glucagon', 'glucagon injection',
];

const EMERGENCY_RESPONSE_KEYWORDS = [
  'emergency response initiated', 'emergency response', 'time emergency',
  '911 called', '911 initiated', 'not applicable', 'n/a', 'no emergency response',
];

const EMS_ARRIVAL_KEYWORDS = [
  'ems arrival', 'ambulance arrived', 'ems arrived', 'arrival time',
  'not applicable', 'n/a', 'no ems', 'ems on scene',
];

const FOLLOWUP_15_MINUTE_KEYWORDS = [
  'follow up in 15 minutes', '15 minute follow-up', '15-minute follow-up',
  'reassess 15 minutes', 'follow up 15 min', 'next shift', 'assess effectiveness',
  'side effects', '15 minutes to assess',
];

const REPEAT_BLOOD_GLUCOSE_PLAN_KEYWORDS = [
  'repeat blood glucose', 'recheck glucose', 'obtain repeat', '15 minutes after intervention',
  'repeat bg', 'glucose recheck', 'follow-up glucose level',
];

const PCP_THRESHOLD_KEYWORDS = [
  'provider-specified threshold', 'pcp threshold', 'provider threshold',
  'notification threshold', 'glucose threshold', 'below threshold', 'below 70',
  'as ordered by pcp', 'provider specified', 'not documented',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'no response', 'no improvement', 'glucagon order', 'abnormal findings',
  'below threshold', 'not notified', 'will notify pcp',
];

const PCP_GLUCOSE_MONITORING_PLAN_KEYWORDS = [
  'glucose monitoring plan', 'monitoring plan ordered', 'pcp ordered monitoring',
  'monitor blood glucose', 'q4 glucose', 'every 4 hours glucose', 'monitoring frequency',
  'monitoring parameters', 'provider ordered monitoring',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const MONITORING_SCHEDULE = `FACILITY MONITORING SCHEDULE (preserve exactly):
- Nursing to follow up in 15 minutes to assess intervention effectiveness and side effects.
- Obtain a repeat blood glucose level 15 minutes after intervention.
Do not assume hypoglycemia has resolved or that monitoring occurred unless documented.`;

const CROSS_REFERENCE_INSTRUCTIONS = `When the assessment indicates decreased level of consciousness, seizure activity, unresponsiveness, or emergency transfer, also apply supporting rules from the cross-referenced facility guidelines (Seizure Activity, Transfer Out / Transfer Back) for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function hypoglycemiaField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `HYPOGLYCEMIA — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms reported by the resident or staff related to hypoglycemia.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Current blood glucose level

ASSESSMENT:
Hypoglycemia

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document whether 15–20 grams of glucose was administered and the time given (only if reported — do not assume administration).
- Document whether 1 mg glucagon was administered (only if reported — do not assume administration).
- Document the time Emergency Response was initiated, if applicable (only if reported — do not invent activation).
- Document EMS arrival time, if applicable (only if reported — do not invent EMS involvement).
- Nursing to follow up in 15 minutes to assess intervention effectiveness and side effects (monitoring requirement — do not invent completion).
- Obtain a repeat blood glucose level 15 minutes after intervention (only if reported or planned as documented).
- Notify PCP if blood glucose is below the provider-specified threshold (only if threshold and notification are documented — never replace with a default threshold).
- Notify PCP if there is no response to the initial intervention or to obtain an order for glucagon when indicated (only if criteria met and notification occurred or is explicitly indicated).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

${MONITORING_SCHEDULE}

Never fabricate blood glucose values.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `HYPOGLYCEMIA — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any continuing or new symptoms reported by the resident or staff.
- If the resident cannot report symptoms, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Follow-up blood glucose level

ASSESSMENT:
Status of Hypoglycemia

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document the glucose monitoring plan ordered by the PCP (only if reported).
- Notify PCP if blood glucose is below the provider-specified threshold (only if threshold and notification are documented — never replace with a default threshold).
- Notify PCP if there is no improvement after intervention or if abnormal findings are noted during assessment (only if criteria met and notification occurred or is explicitly indicated).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume hypoglycemia has resolved unless documented.`;

export const HYPOGLYCEMIA_GUIDELINE: GuidelineDefinition = {
  id: 'hypoglycemia',
  displayName: 'Hypoglycemia',
  description:
    'Hypoglycemia facility guideline. Document blood glucose levels, 15–20 g glucose and glucagon administration, emergency response/EMS times, 15-minute reassessment and repeat glucose, PCP threshold notification, and glucose monitoring plan. Cross-reference Seizure Activity and Transfer Out when LOC, seizure, unresponsiveness, or emergency transfer are documented.',

  assessment: {
    requiredFields: [
      hypoglycemiaField('Current blood glucose level', INITIAL_BLOOD_GLUCOSE_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Follow-up blood glucose level', {
        matchKeywords: FOLLOW_UP_BLOOD_GLUCOSE_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    hypoglycemiaField('Initial blood glucose level', INITIAL_BLOOD_GLUCOSE_KEYWORDS),
    hypoglycemiaField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    hypoglycemiaField('15–20 g glucose administration (if performed)', GLUCOSE_ADMINISTRATION_KEYWORDS, false),
    hypoglycemiaField('Time glucose was administered', TIME_GLUCOSE_ADMINISTERED_KEYWORDS, false),
    hypoglycemiaField('Glucagon administration (if performed)', GLUCAGON_ADMINISTRATION_KEYWORDS, false),
    hypoglycemiaField('Emergency Response initiation time (if applicable)', EMERGENCY_RESPONSE_KEYWORDS, false),
    hypoglycemiaField('EMS arrival time (if applicable)', EMS_ARRIVAL_KEYWORDS, false),
    hypoglycemiaField('15-minute follow-up plan', FOLLOWUP_15_MINUTE_KEYWORDS, false),
    hypoglycemiaField('Repeat blood glucose plan', REPEAT_BLOOD_GLUCOSE_PLAN_KEYWORDS, false),
    hypoglycemiaField('PCP notification threshold', PCP_THRESHOLD_KEYWORDS, false),
    hypoglycemiaField('PCP notification (when indicated)', PCP_NOTIFICATION_KEYWORDS, false),
    hypoglycemiaField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    hypoglycemiaField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    hypoglycemiaField('Follow-up blood glucose level', FOLLOW_UP_BLOOD_GLUCOSE_KEYWORDS, false),
    hypoglycemiaField('PCP glucose monitoring plan', PCP_GLUCOSE_MONITORING_PLAN_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'seizure',
        triggerKeywords: [
          'seizure', 'convuls', 'postictal', 'jerking', 'seizure activity',
          'decreased level of consciousness', 'decreased loc', 'unresponsive', 'unresponsiveness',
          'altered mental status', 'obtunded', 'lethargic', 'not arousable',
        ],
      },
      {
        guidelineId: 'transfer_out_back',
        triggerKeywords: [
          'emergency transfer', 'transfer to er', 'sent to er', 'sent to hospital',
          'ambulance', '911', 'ems', 'transport to hospital', 'emergency room',
          'unresponsive', 'unresponsiveness', 'decreased level of consciousness', 'decreased loc',
        ],
      },
    ],
  },

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
      instructions: `RESOLUTION ASSESSMENT — Hypoglycemia

Document guideline closure only when input supports stable blood glucose per provider criteria, completed repeat glucose check, and no continuing hypoglycemia symptoms as documented.
Do not assume hypoglycemia has resolved unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Hypoglycemia

SUBJECTIVE: hypoglycemia symptoms reported or observed; do not invent symptoms.
OBJECTIVE: Interactive View Assessment; current or follow-up blood glucose — only if provided. Never fabricate glucose values.
ASSESSMENT: Hypoglycemia (initial) or Status of Hypoglycemia (follow-up)
PLAN: glucose/glucagon administration and times, emergency response/EMS if applicable, 15-minute follow-up and repeat glucose, PCP threshold notification, monitoring plan, cross-referenced guideline actions when LOC/seizure/transfer documented — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Hypoglycemia

SITUATION: hypoglycemia event per facility guideline.
BACKGROUND: supported glucose history, symptoms, related LOC/seizure/transfer findings if reported.
ASSESSMENT: blood glucose level(s) provided only — do not fabricate values or assume resolution.
RECOMMENDATION: interventions, 15-minute reassessment/repeat glucose, PCP notification per threshold, monitoring plan, cross-referenced guideline recommendations when applicable — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Hypoglycemia

Plain-language summary of supported facts: resident had low blood sugar, interventions taken, monitoring and follow-up plan if reported.
Do not fabricate glucose values or include clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Hypoglycemia

Notify PCP if blood glucose is below the provider-specified threshold, no response to initial intervention, glucagon order needed, or no improvement/abnormal findings on follow-up — document only if notification occurred or is explicitly indicated.
Never replace the PCP-specific blood glucose threshold with a default value. Apply cross-referenced guideline provider notification criteria when LOC, seizure, or emergency transfer is documented.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Follow up in 15 minutes after intervention to assess effectiveness and side effects; obtain repeat blood glucose 15 minutes after intervention.',
    monitoringPoints: [
      'Current and follow-up blood glucose levels',
      '15–20 g glucose and glucagon administration',
      'Emergency Response and EMS times if applicable',
      'PCP notification threshold and glucose monitoring plan',
      'Intervention effectiveness and side effects',
    ],
    reassessmentCriteria: [
      'Blood glucose below provider-specified threshold',
      'No response to initial intervention',
      'No improvement after intervention',
      'Decreased LOC, seizure activity, unresponsiveness, or emergency transfer',
    ],
    instructions: `${MONITORING_SCHEDULE}

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Blood glucose stable per documented provider criteria',
      'Repeat blood glucose obtained as documented',
      'No continuing hypoglycemia symptoms as reported',
    ],
    instructions:
      'Do not mark hypoglycemia guideline resolved unless stable glucose and symptom resolution are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if blood glucose below provider-specified threshold, no response to intervention, glucagon order indicated, or no improvement/abnormal findings. Document notification only if it occurred or is explicitly indicated. Never use a default threshold.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant hypoglycemia event is reported. Do not auto-notify unless supported.',
    triggers: [
      'Blood glucose below provider-specified threshold',
      'No response to initial intervention',
      'Glucagon order indicated',
      'No improvement or abnormal findings on follow-up',
      'Emergency transfer or unresponsiveness',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless criteria met or explicit notification is reported.',
      'Do not substitute a default blood glucose threshold for the provider-specified threshold.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident hypoglycemia education or safety instructions only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about hypoglycemia monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate blood glucose values.',
    'Never assume glucose or glucagon was administered.',
    'Never invent EMS involvement.',
    'Never invent Emergency Response activation.',
    'Never assume hypoglycemia has resolved.',
    'Never replace the PCP-specific blood glucose threshold with a default value.',
    'Preserve the facility monitoring schedule exactly: reassess 15 minutes after intervention; obtain repeat blood glucose 15 minutes after intervention.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
