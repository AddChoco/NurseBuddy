import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const ENTERAL_COMPLICATION_KEYWORDS = [
  'enteral feeding complication', 'feeding complication', 'noted complication',
  'intolerance', 'tube feed complication', 'g-tube complication', 'gtube complication',
  'high residual', 'blocked tube', 'feeding held', 'diarrhea', 'vomiting', 'aspiration',
  'respiratory distress', 'abdominal distention', 'abdominal pain', 'reflux',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'held feed', 'rate decreased', 'observed',
];

const PROVIDER_ORDERS_KEYWORDS = [
  'provider order', 'physician order', 'pcp order', 'doctor order', 'orders obtained',
  'order received', 'venting order', 'draining order', 'follow provider', 'as ordered',
  'no orders', 'pending orders',
];

const VENTING_DRAINING_KEYWORDS = [
  'venting', 'vent', 'draining', 'drain gastric', 'gastric tube contents', 'decompressed',
  'aspirated contents', 'not vented', 'not drained', 'no venting',
];

const FOLLOW_UP_PLAN_KEYWORDS = [
  'follow up', 'follow-up', 'next shift', 'follow up during next shift', 'reassess',
  'intervention effectiveness', 'monitor effectiveness', 'follow up plan',
];

const INTERVENTION_EFFECTIVENESS_KEYWORDS = [
  'intervention effectiveness', 'effectiveness of intervention', 'effective', 'ineffective',
  'improved', 'no improvement', 'unchanged', 'partial improvement', 'tolerating feeds',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'no improvement', 'abnormal findings', 'not notified', 'no notification',
];

const CURRENT_COMPLICATION_STATUS_KEYWORDS = [
  'current status', 'complication status', 'ongoing', 'resolved', 'improving',
  'worsening', 'unchanged', 'continued intolerance', 'tolerating', 'status of complication',
];

function enteralField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const CROSS_REFERENCE_INSTRUCTIONS = `When the documented enteral feeding complication includes findings related to vomiting, aspiration, respiratory distress, abdominal distention, or abdominal pain, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested. Use cross-referenced guidelines only as supporting documentation rules.`;

const INITIAL_ASSESSMENT_INSTRUCTIONS = `ENTERAL FEEDING: TOLERANCE / COMPLICATIONS — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms reported by the resident or staff related to enteral feeding intolerance or complications.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Noted enteral feeding complication

ASSESSMENT:
Enteral Feeding: Tolerance / Complications

Do NOT diagnose aspiration pneumonia, bowel obstruction, ileus, or feeding tube malfunction unless explicitly documented.

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Obtain provider orders when indicated, including venting or draining gastric tube contents (only if orders obtained or explicitly indicated).
- Nursing to follow up during the next shift to assess intervention effectiveness (monitoring requirement — do not invent completion).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Follow the appropriate facility guidelines for Vomiting, Respiratory Distress / Aspiration, and Abdominal Distention / Pain when related findings are documented — apply supporting rules only; do not generate separate notes unless requested.
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume tube feeds were held, gastric venting/drainage performed, or provider orders received unless documented. Never fabricate gastric residuals.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `ENTERAL FEEDING: TOLERANCE / COMPLICATIONS — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any new or continuing symptoms related to enteral feeding intolerance.
- If the resident cannot report symptoms, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Current status of the enteral feeding complication

ASSESSMENT:
Enteral Feeding: Tolerance / Complications

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Assess the effectiveness of interventions (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if additional follow-up is indicated (only if reported).
- Notify PCP if there is no improvement during the next shift or if abnormal findings are noted during assessment (only if notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume symptoms resolved unless documented. Apply cross-referenced guideline supporting rules when related vomiting, aspiration, respiratory, or abdominal findings are documented.`;

export const ENTERAL_FEEDING_TOLERANCE_GUIDELINE: GuidelineDefinition = {
  id: 'enteral_feeding_tolerance',
  displayName: 'Enteral Feeding: Tolerance / Complications',
  description:
    'Enteral Feeding Tolerance / Complications facility guideline. Document noted feeding complication, interventions, provider orders, venting/draining when applicable, and next-shift follow-up. Cross-reference Vomiting, Respiratory Distress / Aspiration, and Abdominal Distention / Pain when related findings are present.',

  assessment: {
    requiredFields: [
      enteralField('Noted enteral feeding complication', ENTERAL_COMPLICATION_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Current status of the enteral feeding complication', {
        matchKeywords: CURRENT_COMPLICATION_STATUS_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    enteralField('Enteral feeding complication', ENTERAL_COMPLICATION_KEYWORDS),
    enteralField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    enteralField('Provider orders (if indicated)', PROVIDER_ORDERS_KEYWORDS, false),
    enteralField('Venting/draining status (if applicable)', VENTING_DRAINING_KEYWORDS, false),
    enteralField('Follow-up plan', FOLLOW_UP_PLAN_KEYWORDS, false),
    enteralField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    enteralField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    enteralField('Current complication status', CURRENT_COMPLICATION_STATUS_KEYWORDS, false),
    enteralField('Intervention effectiveness', INTERVENTION_EFFECTIVENESS_KEYWORDS, false),
    enteralField('PCP notification when indicated', PCP_NOTIFICATION_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'vomiting',
        triggerKeywords: [
          'vomit', 'vomiting', 'emesis', 'threw up', 'throwing up', 'nausea with emesis',
        ],
      },
      {
        guidelineId: 'respiratory',
        triggerKeywords: [
          'aspiration', 'respiratory distress', 'shortness of breath', 'dyspnea', 'sob',
          'choking', 'cough during feed', 'desaturation', 'spo2', 'labored breathing',
        ],
      },
      {
        guidelineId: 'abdominal_distention_pain',
        triggerKeywords: [
          'abdominal distention', 'abdominal pain', 'distension', 'distention',
          'abdomen pain', 'bloated', 'girth increased', 'abdominal discomfort',
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
      instructions: `RESOLUTION ASSESSMENT — Enteral Feeding: Tolerance / Complications

Document guideline closure only when input supports that the enteral feeding complication has resolved and feeds are tolerated as documented.
Do not assume complication resolution or tube feed tolerance unless explicitly reported.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Enteral Feeding: Tolerance / Complications

SUBJECTIVE: enteral feeding intolerance/complication symptoms reported or observed; do not invent symptoms.
OBJECTIVE: Interactive View Assessment; noted enteral feeding complication — only if provided. Never fabricate gastric residuals.
ASSESSMENT: Enteral Feeding: Tolerance / Complications (not aspiration pneumonia, obstruction, ileus, or tube malfunction unless explicitly documented)
PLAN: interventions, provider orders, venting/draining, next-shift follow-up, cross-referenced guideline actions when related findings present, handoff, staff understanding — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Enteral Feeding: Tolerance / Complications

SITUATION: enteral feeding tolerance/complication event per facility guideline.
BACKGROUND: supported feeding method, complication history, related vomiting/respiratory/abdominal findings if reported.
ASSESSMENT: noted complication and objective findings provided only.
RECOMMENDATION: provider orders, venting/draining, next-shift follow-up, PCP notification, cross-referenced guideline recommendations when applicable — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Enteral Feeding: Tolerance / Complications

Plain-language summary of supported facts: resident had enteral feeding concern, monitoring and interventions taken, follow-up plan if reported.
Do not diagnose complications or include clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Enteral Feeding: Tolerance / Complications

Document provider orders obtained and PCP notification for no improvement or abnormal findings — only if reported or explicitly indicated.
Include supported complication description and interventions. Never diagnose aspiration pneumonia, obstruction, or tube malfunction unless nurse documented.`,
    },
  },

  followUpRequirements: {
    frequency: 'Nursing to follow up during the next shift to assess intervention effectiveness until complication resolves.',
    monitoringPoints: [
      'Current status of enteral feeding complication',
      'Intervention effectiveness',
      'Provider order compliance',
      'Venting/draining status when applicable',
      'Related vomiting, respiratory, or abdominal findings when present',
    ],
    reassessmentCriteria: [
      'No improvement during the next shift',
      'New or worsening feeding intolerance',
      'Abnormal assessment findings',
      'Related aspiration, respiratory, or abdominal symptoms',
    ],
    instructions:
      'Apply cross-referenced Vomiting, Respiratory Distress / Aspiration, and Abdominal Distention / Pain supporting rules when related findings are documented. Do not generate separate notes unless requested.',
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Enteral feeding complication resolved as documented',
      'Feeds tolerated per reported assessment',
      'Intervention effectiveness documented when applicable',
    ],
    instructions:
      'Do not mark guideline resolved unless complication resolution and feed tolerance are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Obtain provider orders when indicated. Notify PCP if no improvement during next shift or abnormal findings noted. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant feeding-related change is reported. Do not auto-notify unless supported.',
    triggers: [
      'No improvement during next shift',
      'Abnormal assessment findings',
      'Indicated need for venting/draining orders',
      'Related vomiting, aspiration, or abdominal complications',
    ],
    prohibitedAutoNotifications: [
      'Do not document provider orders or PCP notification unless explicitly reported or indicated.',
      'Do not diagnose aspiration pneumonia, obstruction, ileus, or tube malfunction unless documented.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident education about feeding tolerance or symptom reporting only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about enteral feeding monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never diagnose aspiration pneumonia, bowel obstruction, ileus, or feeding tube malfunction unless explicitly documented.',
    'Never assume tube feeds were held.',
    'Never assume gastric venting or drainage was performed.',
    'Never fabricate gastric residuals.',
    'Never assume provider orders were received.',
    'Never assume symptoms have resolved unless documented.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
