import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const INJURY_LOCATION_KEYWORDS = [
  'location of suspected', 'fracture location', 'dislocation location', 'injury location',
  'left arm', 'right arm', 'left leg', 'right leg', 'wrist', 'ankle', 'hip', 'shoulder',
  'elbow', 'knee', 'finger', 'hand', 'foot', 'clavicle', 'rib', 'femur', 'tibia',
  'suspected fracture', 'suspected dislocation',
];

const CURRENT_INJURY_LOCATION_KEYWORDS = [
  'current injury location', 'injury location', 'location of suspected', 'fracture location',
  'dislocation location', 'left arm', 'right arm', 'wrist', 'ankle', 'hip', 'shoulder',
];

const SIGNS_SYMPTOMS_KEYWORDS = [
  'signs and symptoms', 'signs or symptoms', 'pain', 'swelling', 'deformity', 'bruising',
  'crepitus', 'shortening', 'tenderness', 'unable to move', 'limited range', 'ecchymosis',
  'neurovascular', 'circulation', 'pulse', 'capillary refill', 'numbness', 'tingling',
  'suspected fracture', 'suspected dislocation', 'observed',
];

const CURRENT_SIGNS_SYMPTOMS_KEYWORDS = [
  'current signs', 'continuing symptoms', 'signs and symptoms', 'pain', 'swelling',
  'deformity', 'bruising', 'tenderness', 'neurovascular', 'circulation', 'observed',
];

const ANTICOAGULANT_KEYWORDS = [
  'anticoagulant', 'antiplatelet', 'blood thinner', 'coumadin', 'warfarin', 'eliquis',
  'apixaban', 'xarelto', 'rivaroxaban', 'aspirin', 'plavix', 'clopidogrel', 'heparin',
  'lovenox', 'enoxaparin', 'no blood thinner', 'not on anticoag', 'current use',
];

const OSTEOPOROSIS_KEYWORDS = [
  'osteoporosis', 'osteopenia', 'bone density', 'low bone density', 'no osteoporosis',
  'no osteopenia', 'history of osteoporosis', 'history of osteopenia', 'not diagnosed',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'immobilized', 'splint', 'ice pack',
];

const PIR_KEYWORDS = [
  'pir', 'post injury report', 'injury report', 'incident report',
  'completed pir', 'pir completed', 'pir done',
];

const EVERY_SHIFT_REASSESSMENT_KEYWORDS = [
  'every shift', 'each shift', 'assess the injury every shift', 'shift assessment',
  'until evaluated by pcp', 'until pcp evaluation', 'ongoing shift assessment',
];

const PAIN_EFFECTIVENESS_REASSESSMENT_KEYWORDS = [
  'pain medication effectiveness', 'effectiveness reassessment', 'reassessment interval',
  'monitor for side effects', 'pain effectiveness', 'ordered reassessment',
  'assess pain medication', 'side effects',
];

const PAIN_MANAGEMENT_KEYWORDS = [
  'pain management', 'pain intervention', 'analgesic', 'tylenol', 'acetaminophen',
  'morphine', 'ibuprofen', 'pain medication', 'ice', 'elevation', 'comfort measure',
];

const ONGOING_PAIN_MANAGEMENT_KEYWORDS = [
  'ongoing pain management', 'pain management intervention', 'continued analgesic',
  'pain medication', 'pain intervention', 'comfort measure',
];

const RESPONSE_TO_INTERVENTIONS_KEYWORDS = [
  'response to intervention', 'response to interventions', 'responded to',
  'pain relief', 'improved', 'no improvement', 'unchanged', 'effective', 'ineffective',
  'resident response', 'tolerated',
];

const ER_TRANSPORT_STATUS_KEYWORDS = [
  'transport to er', 'transport to emergency room', 'sent to er', 'emergency room transport',
  'ambulance', 'ems transport', 'not transported', 'declined transport', 'no transport',
  'pending transport',
];

const ER_TRANSPORT_TIME_KEYWORDS = [
  'time of emergency room transfer', 'er transfer time', 'transported at', 'left for er at',
  'ambulance departed', 'time transported', 'not applicable', 'n/a', 'no er transfer',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'suspected fracture', 'declining health', 'decline in health', 'not notified',
  'will notify pcp', 'all suspected fractures',
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
- Assess the injury every shift until the resident is evaluated by the PCP.
- All suspected fractures must be reported to the PCP.
Do not assume the PCP evaluated the resident unless documented.`;

const CROSS_REFERENCE_INSTRUCTIONS = `When the suspected fracture/dislocation is associated with a fall, head injury, transfer to the Emergency Room, severe pain, or impaired circulation or neurological changes, also apply supporting rules from the cross-referenced facility guidelines (Fall / Suspected Fall, Head Injury, Transfer Out / Transfer Back, Pain) for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function fractureField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `SUSPECTED FRACTURE / DISLOCATION — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms or concerns reported by the resident or staff regarding the suspected injury.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume pain, deformity, or fracture characteristics.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Location of suspected fracture/dislocation
- Signs and symptoms indicating suspected fracture/dislocation
- Current use of anticoagulant or antiplatelet medications
- Diagnosis of osteoporosis or osteopenia

ASSESSMENT:
Suspected Fracture / Dislocation

Do NOT diagnose a fracture or dislocation. Do NOT state that imaging confirmed a fracture unless explicitly documented.

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Complete a Post Injury Report (PIR) (only if reported completed).
- Assess the injury every shift until the resident is evaluated by the PCP (monitoring requirement — do not invent PCP evaluation).
- Assess pain medication effectiveness and monitor for side effects according to the ordered reassessment interval (only if reported).
- Document pain management interventions implemented (only if reported — do not assume pain medication was administered).
- Document the resident's response to interventions (only if reported — do not assume pain improved).
- Document transport to the Emergency Room when applicable (only if reported — do not assume transport occurred).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify the PCP of all suspected fractures and any decline in health status noted during assessment (only if notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

${MONITORING_SCHEDULE}

Never fabricate deformity, swelling, bruising, crepitus, shortening, or neurovascular findings.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `SUSPECTED FRACTURE / DISLOCATION — FOLLOW-UP ASSESSMENT

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
- Location of suspected fracture/dislocation
- Current signs and symptoms indicating suspected fracture/dislocation

ASSESSMENT:
Suspected Fracture / Dislocation

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Continue assessing the injury at least every shift until evaluated by the PCP (only if reported).
- Document ongoing pain management interventions (only if reported).
- Document the resident's response to interventions (only if reported — do not assume pain improved).
- Document the time of Emergency Room transfer if applicable (only if reported).
- Notify PCP if declining health status is noted during assessment (only if criteria met and notification occurred or is explicitly indicated).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Do not diagnose fracture or dislocation. Do not assume the PCP evaluated the resident unless documented.`;

export const SUSPECTED_FRACTURE_DISLOCATION_GUIDELINE: GuidelineDefinition = {
  id: 'suspected_fracture_dislocation',
  displayName: 'Suspected Fracture / Dislocation',
  description:
    'Suspected Fracture / Dislocation facility guideline. Document injury location, signs/symptoms, anticoagulant and osteoporosis status, PIR, every-shift assessment until PCP evaluation, pain management, ER transport, and PCP notification for all suspected fractures. Cross-reference Fall, Head Injury, Transfer Out, and Pain when applicable.',

  assessment: {
    requiredFields: [
      fractureField('Location of suspected fracture/dislocation', INJURY_LOCATION_KEYWORDS),
      fractureField('Signs and symptoms indicating suspected fracture/dislocation', SIGNS_SYMPTOMS_KEYWORDS),
      fractureField('Current use of anticoagulant or antiplatelet medications', ANTICOAGULANT_KEYWORDS),
      fractureField('Diagnosis of osteoporosis or osteopenia', OSTEOPOROSIS_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Current signs and symptoms indicating suspected fracture/dislocation', {
        matchKeywords: CURRENT_SIGNS_SYMPTOMS_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    fractureField('Location of suspected fracture/dislocation', INJURY_LOCATION_KEYWORDS),
    fractureField('Signs and symptoms', SIGNS_SYMPTOMS_KEYWORDS, false),
    fractureField('Anticoagulant/antiplatelet status', ANTICOAGULANT_KEYWORDS, false),
    fractureField('Osteoporosis/osteopenia history', OSTEOPOROSIS_KEYWORDS, false),
    fractureField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    fractureField('PIR completion', PIR_KEYWORDS, false),
    fractureField('Every-shift reassessment plan', EVERY_SHIFT_REASSESSMENT_KEYWORDS, false),
    fractureField('Pain medication effectiveness reassessment plan', PAIN_EFFECTIVENESS_REASSESSMENT_KEYWORDS, false),
    fractureField('Pain management interventions', PAIN_MANAGEMENT_KEYWORDS, false),
    fractureField('Response to interventions', RESPONSE_TO_INTERVENTIONS_KEYWORDS, false),
    fractureField('ER transport status', ER_TRANSPORT_STATUS_KEYWORDS, false),
    fractureField('PCP notification', PCP_NOTIFICATION_KEYWORDS, false),
    fractureField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    fractureField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    fractureField('Current injury location', CURRENT_INJURY_LOCATION_KEYWORDS, false),
    fractureField('Current signs and symptoms', CURRENT_SIGNS_SYMPTOMS_KEYWORDS, false),
    fractureField('Ongoing pain management', ONGOING_PAIN_MANAGEMENT_KEYWORDS, false),
    fractureField('ER transport time (if applicable)', ER_TRANSPORT_TIME_KEYWORDS, false),
    fractureField('PCP notification when indicated', PCP_NOTIFICATION_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'fall',
        triggerKeywords: [
          'fall', 'fell', 'found on floor', 'slipped', 'tripped', 'suspected fall',
          'witnessed fall', 'unwitnessed fall',
        ],
      },
      {
        guidelineId: 'head_injury',
        triggerKeywords: [
          'head injury', 'hit head', 'struck head', 'head impact', 'head strike',
          'scalp injury', 'concussion',
        ],
      },
      {
        guidelineId: 'transfer_out_back',
        triggerKeywords: [
          'transport to er', 'transport to emergency room', 'sent to er', 'emergency room',
          'ambulance', 'ems', 'transfer out', '911',
        ],
      },
      {
        guidelineId: 'pain',
        triggerKeywords: [
          'severe pain', 'uncontrolled pain', 'pain score', 'moderate pain', 'pain level',
          'pain medication', 'analgesic', '/10',
          'neurovascular', 'impaired circulation', 'numbness', 'tingling', 'capillary refill',
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
      instructions: `RESOLUTION ASSESSMENT — Suspected Fracture / Dislocation

Document guideline closure only when input supports PCP evaluation completed, injury stable or resolved as documented, and every-shift monitoring no longer indicated.
Do not assume fracture resolution or PCP evaluation unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Suspected Fracture / Dislocation

SUBJECTIVE: injury symptoms/concerns reported or observed; do not assume pain or deformity.
OBJECTIVE: Interactive View Assessment; location, signs/symptoms, anticoagulant and osteoporosis status — only if provided. Never fabricate neurovascular or imaging findings.
ASSESSMENT: Suspected Fracture / Dislocation (not confirmed fracture/dislocation unless explicitly documented)
PLAN: PIR, every-shift assessment, pain management/effectiveness, response to interventions, ER transport, PCP notification, handoff, cross-referenced guideline actions when fall/head injury/transfer/pain documented — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Suspected Fracture / Dislocation

SITUATION: suspected fracture/dislocation event per facility guideline.
BACKGROUND: supported injury location, anticoagulant/osteoporosis history, related fall/head injury if reported.
ASSESSMENT: signs/symptoms and objective findings provided only — do not diagnose or confirm fracture on imaging unless documented.
RECOMMENDATION: PCP notification for all suspected fractures, every-shift monitoring, pain management, ER transport if applicable, cross-referenced guideline recommendations — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Suspected Fracture / Dislocation

Plain-language summary of supported facts: resident had suspected injury, monitoring and interventions taken, PCP/ER follow-up if reported.
Do not confirm fracture/dislocation or include clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Suspected Fracture / Dislocation

Notify PCP of all suspected fractures and any decline in health status — document only if notification occurred or is explicitly indicated.
Never diagnose fracture/dislocation or state imaging confirmation unless explicitly documented. Apply cross-referenced guideline provider notification criteria when fall, head injury, transfer, or severe pain is documented.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Assess the injury every shift until the resident is evaluated by the PCP; continue pain medication effectiveness and side effect monitoring per ordered interval.',
    monitoringPoints: [
      'Location and current signs/symptoms of suspected injury',
      'Every-shift injury reassessment until PCP evaluation',
      'Pain management interventions and response',
      'Pain medication effectiveness and side effects',
      'ER transport status and time if applicable',
      'PCP notification for all suspected fractures',
    ],
    reassessmentCriteria: [
      'New or continuing injury symptoms',
      'Declining health status',
      'Ineffective pain management',
      'Impaired circulation or neurological changes',
      'Pending PCP evaluation',
    ],
    instructions: `${MONITORING_SCHEDULE}

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'PCP evaluation completed as documented',
      'Injury stable or resolved as reported',
      'Every-shift monitoring no longer indicated per documented plan',
    ],
    instructions:
      'Do not mark guideline resolved unless PCP evaluation and injury status are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP of all suspected fractures and any decline in health status noted during assessment. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant injury or ER transport is reported. Do not auto-notify unless supported.',
    triggers: [
      'All suspected fractures',
      'Decline in health status during assessment',
      'Emergency Room transport',
      'Impaired circulation or neurological changes',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless notification occurred or is explicitly indicated.',
      'Do not assume ER transport occurred unless reported.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident injury safety or mobility instructions only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about injury monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never diagnose a fracture or dislocation.',
    'Never state that imaging confirmed a fracture unless explicitly documented.',
    'Never fabricate deformity, swelling, bruising, crepitus, shortening, or neurovascular findings.',
    'Never assume Emergency Room transport occurred.',
    'Never assume pain medication was administered.',
    'Never assume pain improved after intervention.',
    'Never assume the PCP evaluated the resident.',
    'Preserve the facility monitoring schedule exactly: assess the injury every shift until evaluated by the PCP.',
    'Preserve the facility requirement that all suspected fractures be reported to the PCP.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
