import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const PICA_ITEM_KEYWORDS = [
  'pica item', 'item ingested', 'substance ingested', 'ingested', 'ate', 'swallowed',
  'consumed', 'non-food', 'foreign object', 'foreign body', 'object ingested', 'pica',
  'paper', 'cloth', 'metal', 'plastic', 'rock', 'dirt', 'hair', 'feces',
];

const STOOL_DESCRIPTION_KEYWORDS = [
  'stool description', 'stool', 'bowel movement', 'bm', 'blood in stool', 'foreign bod',
  'foreign object in stool', 'hematochezia', 'melena', 'no blood', 'no foreign',
  'identified in stool', 'stool examined', 'guaiac',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'gi assessment', 'respiratory assessment',
];

const PIR_KEYWORDS = [
  'pir', 'post injury report', 'injury report', 'incident report',
  'completed pir', 'pir completed', 'pir done', 'not applicable', 'n/a',
];

const Q4_72_FOLLOWUP_KEYWORDS = [
  'q4', 'q 4', 'every 4 hours', '4 hours', '72 hours', 'x 72', 'follow up q4',
  'gastrointestinal', 'gi findings', 'respiratory findings', 'assess gi', 'assess respiratory',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'abnormal findings', 'will notify pcp', 'not notified', 'no notification',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hr report', '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_INSTRUCTION_KEYWORDS = [
  'staff verbalized', 'staff verbalize', 'staff demonstrated', 'demonstrates understanding',
  'understanding', 'instructions provided', 'education provided', 'instructed staff',
];

const STAFF_STOOL_MONITORING_KEYWORDS = [
  'monitor stools', 'monitor stool', 'blood and foreign bodies', 'foreign bodies',
  'report to nurse', 'stool monitoring', 'instructed to monitor', 'staff instructed',
];

function picaField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `PICA — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document resident or staff report related to the pica event whenever possible.
- If the resident is unable to report, document observed findings and staff observations only.
- Do not assume details that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Pica item ingested

ASSESSMENT:
Pica

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Post Injury Report (PIR) completed if applicable (only if reported).
- Nursing to follow up q 4 hrs x 72 hours to assess gastrointestinal and respiratory findings (monitoring requirement — do not invent completion).
- Will notify PCP of any abnormal findings noted during assessment (only if notification occurred or is explicitly indicated).
- Nurse to notify oncoming nurse via 24 hr report/nurse to nurse if follow-up is indicated (only if reported).
- Staff verbalize/demonstrates understanding to instructions provided (only if reported).
- Staff instructed to monitor stools for blood and foreign bodies and to report to nurse (only if reported).

Do not invent the pica item ingested, PIR status, or GI/respiratory findings.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `PICA — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any new or continuing symptoms or concerns reported by the resident or staff.
- If the resident cannot report, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Stool description including whether or not blood or foreign bodies identified
- Pica item ingested

ASSESSMENT:
Pica

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Nursing to follow up q 4 hrs x 72 hours to assess gastrointestinal and respiratory findings (monitoring requirement — do not invent completion).
- Nurse to notify oncoming nurse via 24 hr report/nurse to nurse if follow-up is indicated (only if reported).
- Will notify PCP of any abnormal findings noted during assessment (only if notification occurred or is explicitly indicated).
- Staff verbalize/demonstrates understanding to instructions provided (only if reported).

Do not assume blood or foreign bodies in stool unless documented. Do not invent the pica item ingested.`;

export const PICA_GUIDELINE: GuidelineDefinition = {
  id: 'pica',
  displayName: 'Pica',
  description:
    'Pica facility guideline. Document pica item ingested, nursing interventions, PIR when applicable, q4 x 72 hour GI/respiratory follow-up, PCP notification for abnormal findings, handoff, and staff stool monitoring instructions. Never invent ingested items or stool findings.',

  assessment: {
    requiredFields: [
      picaField('Pica item ingested', PICA_ITEM_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Stool description including whether or not blood or foreign bodies identified', {
        matchKeywords: STOOL_DESCRIPTION_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    picaField('Pica item ingested', PICA_ITEM_KEYWORDS),
    picaField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    picaField('PIR completion (if applicable)', PIR_KEYWORDS, false),
    picaField('Q4 x 72 hour follow-up plan', Q4_72_FOLLOWUP_KEYWORDS, false),
    picaField('PCP notification when indicated', PCP_NOTIFICATION_KEYWORDS, false),
    picaField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    picaField('Staff instruction documentation', STAFF_INSTRUCTION_KEYWORDS, false),
    picaField('Staff stool monitoring instructions', STAFF_STOOL_MONITORING_KEYWORDS, false),
    picaField('Stool description (blood/foreign bodies)', STOOL_DESCRIPTION_KEYWORDS, false),
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
      instructions: `RESOLUTION ASSESSMENT — Pica

Document guideline closure only when input supports completion of the required q4 x 72 hour monitoring period and no unresolved GI/respiratory concerns or stool findings requiring follow-up.
Do not assume the event is resolved unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Pica

SUBJECTIVE: resident/staff report related to pica event; observed findings if unable to report.
OBJECTIVE: Interactive View Assessment; pica item ingested; follow-up stool description with blood/foreign bodies when applicable — only if provided.
ASSESSMENT: Pica
PLAN: interventions, PIR if applicable, q4 x 72 hr GI/respiratory follow-up, PCP notification, handoff, staff understanding and stool monitoring instructions — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Pica

SITUATION: pica ingestion event per facility guideline.
BACKGROUND: supported item ingested and circumstances if reported.
ASSESSMENT: pica item ingested, stool findings on follow-up, GI/respiratory assessment findings — only if provided.
RECOMMENDATION: q4 x 72 hr monitoring, PCP notification for abnormal findings, PIR if applicable, handoff — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Pica

Plain-language summary of supported facts: resident ingested a non-food item, monitoring steps staff are taking, follow-up plan if reported.
Do not include specific clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Pica

Notify PCP of abnormal findings noted during assessment — document only if notification occurred or is explicitly indicated.
Include supported pica item ingested, GI/respiratory findings, and stool description if reported. Do not invent ingested items or findings.`,
    },
  },

  followUpRequirements: {
    frequency: 'Nursing to follow up q 4 hrs x 72 hours to assess gastrointestinal and respiratory findings.',
    monitoringPoints: [
      'Pica item ingested',
      'Stool description including blood or foreign bodies on follow-up',
      'Gastrointestinal assessment findings',
      'Respiratory assessment findings',
      'Staff stool monitoring for blood and foreign bodies',
    ],
    reassessmentCriteria: [
      'Abnormal GI or respiratory findings',
      'Blood or foreign bodies identified in stool',
      'New or worsening symptoms',
      'Failure to complete required monitoring period when reported',
    ],
    instructions:
      'Continue q4 assessments for 72 hours. Document stool monitoring instructions to staff only when reported.',
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Required q4 x 72 hour monitoring period complete as documented',
      'No unresolved abnormal GI or respiratory findings',
      'No ongoing stool blood or foreign body concerns requiring follow-up',
    ],
    instructions:
      'Do not mark pica guideline resolved unless monitoring completion and absence of unresolved concerns are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP of any abnormal findings noted during assessment. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant pica-related change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Abnormal gastrointestinal findings',
      'Abnormal respiratory findings',
      'Blood or foreign bodies identified in stool',
      'Worsening symptoms during monitoring period',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless abnormal findings or explicit notification is reported.',
      'Do not document PIR completion unless explicitly reported.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident education related to pica prevention only if reported.',
    staffInstructions:
      'Document staff verbalize/demonstrates understanding to instructions provided and staff instructed to monitor stools for blood and foreign bodies — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about pica monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never invent the pica item ingested.',
    'Never assume blood or foreign bodies in stool unless documented.',
    'Never assume PIR was completed unless reported.',
    'Never fabricate gastrointestinal or respiratory findings.',
    'Never assume the event has resolved unless documented.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
