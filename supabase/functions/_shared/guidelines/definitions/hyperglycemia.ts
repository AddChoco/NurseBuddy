import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const BLOOD_GLUCOSE_KEYWORDS = [
  'blood glucose', 'glucose level', 'current blood glucose', 'bg level', 'bg:',
  'mg/dl', 'mg/dL', 'hyperglycemia', 'hyperglycemic', 'high blood sugar', 'high glucose',
  'fingerstick', 'glucometer', 'capillary glucose', 'blood sugar',
];

const FOLLOW_UP_BLOOD_GLUCOSE_KEYWORDS = [
  'follow-up blood glucose', 'follow up blood glucose', 'current blood glucose',
  'repeat blood glucose', 'recheck glucose', 'blood glucose', 'glucose level', 'mg/dl', 'mg/dL',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'comfort', 'safety',
];

const PCP_NOTIFICATION_TIME_KEYWORDS = [
  'pcp notified', 'provider notified', 'physician notified', 'time pcp notified',
  'notification time', 'notified at', 'pcp called', 'provider called', 'not notified',
];

const PCP_ORDERS_KEYWORDS = [
  'pcp order', 'provider order', 'physician order', 'doctor order', 'follow pcp',
  'as ordered', 'orders obtained', 'insulin order', 'no orders', 'pending orders',
];

const BG_AFTER_INTERVENTION_KEYWORDS = [
  'blood glucose after intervention', 'glucose after intervention', 'post intervention glucose',
  'glucose after insulin', 'repeat glucose', 'recheck glucose', 'bg after', 'after intervention',
];

const PCP_FOLLOWUP_PLAN_KEYWORDS = [
  'pcp-directed follow-up', 'follow up according to pcp', 'continue follow-up per pcp',
  'follow-up according to pcp', 'pcp follow-up plan', 'monitor per pcp', 'follow pcp orders',
  'intervention effectiveness', 'monitor for side effects',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const CROSS_REFERENCE_INSTRUCTIONS = `When the assessment indicates decreased level of consciousness, diabetic emergency, emergency transfer, or seizure activity, also apply supporting rules from the cross-referenced facility guidelines (Transfer Out / Transfer Back, Seizure Activity) for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function hyperglycemiaField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `HYPERGLYCEMIA — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms reported by the resident or staff related to hyperglycemia.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Current blood glucose level

ASSESSMENT:
Hyperglycemia

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document the time the PCP was notified (only if reported — do not invent notification time).
- Follow PCP orders to assess intervention effectiveness and monitor for side effects (only if PCP orders are documented — do not invent orders or monitoring schedule).
- Document the blood glucose level after intervention (only if reported — do not fabricate values).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never fabricate blood glucose values. Never assume insulin or other medications were administered. Follow only the monitoring plan ordered by the PCP.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `HYPERGLYCEMIA — FOLLOW-UP ASSESSMENT

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
- Current blood glucose level

ASSESSMENT:
Hyperglycemia

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Continue follow-up according to PCP orders to assess intervention effectiveness and monitor for side effects (only if PCP-directed plan is documented — do not invent monitoring schedule).
- Document the blood glucose level after intervention (only if reported — do not fabricate values).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if additional follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume hyperglycemia has resolved unless documented.`;

export const HYPERGLYCEMIA_GUIDELINE: GuidelineDefinition = {
  id: 'hyperglycemia',
  displayName: 'Hyperglycemia',
  description:
    'Hyperglycemia facility guideline. Document blood glucose levels, PCP notification time, PCP orders, post-intervention glucose, and PCP-directed follow-up. Cross-reference Transfer Out and Seizure Activity when diabetic emergency, LOC, seizure, or emergency transfer are documented.',

  assessment: {
    requiredFields: [
      hyperglycemiaField('Current blood glucose level', BLOOD_GLUCOSE_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Follow-up blood glucose level', {
        matchKeywords: FOLLOW_UP_BLOOD_GLUCOSE_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    hyperglycemiaField('Initial blood glucose level', BLOOD_GLUCOSE_KEYWORDS),
    hyperglycemiaField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    hyperglycemiaField('PCP notification time', PCP_NOTIFICATION_TIME_KEYWORDS, false),
    hyperglycemiaField('PCP orders', PCP_ORDERS_KEYWORDS, false),
    hyperglycemiaField('Blood glucose level after intervention', BG_AFTER_INTERVENTION_KEYWORDS, false),
    hyperglycemiaField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    hyperglycemiaField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    hyperglycemiaField('Follow-up blood glucose level', FOLLOW_UP_BLOOD_GLUCOSE_KEYWORDS, false),
    hyperglycemiaField('PCP-directed follow-up plan', PCP_FOLLOWUP_PLAN_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'seizure',
        triggerKeywords: [
          'seizure', 'convuls', 'postictal', 'jerking', 'seizure activity',
          'decreased level of consciousness', 'decreased loc', 'unresponsive', 'unresponsiveness',
          'altered mental status', 'obtunded', 'not arousable',
        ],
      },
      {
        guidelineId: 'transfer_out_back',
        triggerKeywords: [
          'emergency transfer', 'transfer to er', 'sent to er', 'sent to hospital',
          'ambulance', '911', 'ems', 'transport to hospital', 'emergency room',
          'diabetic emergency', 'dka', 'diabetic ketoacidosis', 'hhs',
          'hyperosmolar', 'unresponsive', 'decreased level of consciousness', 'decreased loc',
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
      instructions: `RESOLUTION ASSESSMENT — Hyperglycemia

Document guideline closure only when input supports stable blood glucose per PCP criteria and no continuing hyperglycemia symptoms as documented.
Do not assume hyperglycemia has resolved unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Hyperglycemia

SUBJECTIVE: hyperglycemia symptoms reported or observed; do not invent symptoms.
OBJECTIVE: Interactive View Assessment; current and post-intervention blood glucose — only if provided. Never fabricate glucose values.
ASSESSMENT: Hyperglycemia
PLAN: PCP notification time, PCP orders, intervention effectiveness/side effect monitoring per PCP, post-intervention glucose, handoff, cross-referenced guideline actions when diabetic emergency/LOC/seizure/transfer documented — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Hyperglycemia

SITUATION: hyperglycemia event per facility guideline.
BACKGROUND: supported glucose history, symptoms, PCP orders if reported, related LOC/seizure/transfer findings if reported.
ASSESSMENT: blood glucose level(s) provided only — do not fabricate values or assume resolution.
RECOMMENDATION: PCP notification, follow PCP orders and monitoring plan, post-intervention glucose, continued follow-up, cross-referenced guideline recommendations when applicable — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Hyperglycemia

Plain-language summary of supported facts: resident had elevated blood sugar, interventions and PCP follow-up per orders if reported.
Do not fabricate glucose values or include clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Hyperglycemia

Document the time the PCP was notified and follow PCP orders — only if reported. Do not invent notification time or orders.
Apply cross-referenced guideline provider notification criteria when diabetic emergency, LOC, seizure, or emergency transfer is documented.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Follow PCP orders to assess intervention effectiveness and monitor for side effects; continue follow-up according to PCP-directed plan.',
    monitoringPoints: [
      'Current and follow-up blood glucose levels',
      'Blood glucose level after intervention',
      'PCP notification time and orders',
      'PCP-directed follow-up and monitoring plan',
      'Intervention effectiveness and side effects',
    ],
    reassessmentCriteria: [
      'Continuing or new hyperglycemia symptoms',
      'Blood glucose not improved per documented findings',
      'Decreased LOC, diabetic emergency, seizure activity, or emergency transfer',
    ],
    instructions: `${CROSS_REFERENCE_INSTRUCTIONS}

Follow only the monitoring plan ordered by the PCP. Never create your own blood glucose thresholds or monitoring schedule.`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Blood glucose stable per documented PCP criteria',
      'Post-intervention glucose documented as reported',
      'No continuing hyperglycemia symptoms as reported',
    ],
    instructions:
      'Do not mark hyperglycemia guideline resolved unless stable glucose and symptom resolution are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Document the time the PCP was notified and follow PCP orders — only if reported. Do not invent notification time or PCP orders.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant hyperglycemia event is reported. Do not auto-notify unless supported.',
    triggers: [
      'Elevated blood glucose requiring PCP notification',
      'Diabetic emergency',
      'No improvement per documented findings',
      'Emergency transfer or unresponsiveness',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification time unless explicitly reported.',
      'Do not invent PCP orders or monitoring schedules.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident hyperglycemia education or safety instructions only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about hyperglycemia monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate blood glucose values.',
    'Never assume insulin or other medications were administered.',
    'Never invent PCP orders.',
    'Never invent the time the PCP was notified.',
    'Never assume hyperglycemia has resolved.',
    'Never create your own blood glucose thresholds.',
    'Never invent a monitoring schedule.',
    'Follow only the monitoring plan ordered by the PCP.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
