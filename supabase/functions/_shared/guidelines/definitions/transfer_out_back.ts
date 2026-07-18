import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const TRANSFER_REASON_KEYWORDS = [
  'transfer reason', 'reason for transfer', 'sent to er', 'sent to hospital',
  'emergency room', 'acute care', 'psychiatric transfer', 'behavioral health transfer',
  'medical emergency', 'declining status', 'abnormal findings', 'pcp ordered transfer',
  '911', 'ambulance', 'transport to hospital',
];

const PRE_TRANSFER_ASSESSMENT_KEYWORDS = [
  'pre-transfer', 'prior to transfer', 'assessment prior', 'findings prior',
  'additional assessment', 'vital signs', 'neuro', 'respiratory', 'skin', 'pain',
  'baseline', 'assessment finding', 'observed', 'documented prior',
];

const ANTICOAGULANT_KEYWORDS = [
  'anticoagulant', 'antiplatelet', 'blood thinner', 'coumadin', 'warfarin', 'eliquis',
  'apixaban', 'xarelto', 'rivaroxaban', 'aspirin', 'plavix', 'clopidogrel', 'heparin',
  'lovenox', 'enoxaparin', 'no blood thinner', 'not on anticoag', 'current use',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'comfort', 'safety',
];

const EMERGENCY_RESPONSE_KEYWORDS = [
  'emergency response', 'ems notified', '911 called', 'ambulance notified',
  'time ems', 'time emergency', 'notified emergency', 'ems arrival', 'dispatch',
];

const MONITORING_FREQUENCY_KEYWORDS = [
  'monitor at', 'ordered frequency', 'monitoring frequency', 'until transport',
  'every 15 minutes', 'every 30 minutes', 'q15', 'q30', 'q1h', 'continuous monitoring',
];

const PCP_ORDERS_KEYWORDS = [
  'pcp order', 'provider order', 'physician order', 'doctor order', 'follow pcp',
  'as ordered', 'orders obtained', 'no orders', 'pending orders',
];

const NURSE_REPORT_RECIPIENT_KEYWORDS = [
  'nurse report given', 'report given to', 'receiving er nurse', 'er nurse',
  'report to', 'handoff to transport', 'report provided to', 'nursing report given',
];

const BRADEN_SCORE_KEYWORDS = [
  'braden score', 'braden', 'pressure injury risk score', 'reported braden',
];

const FAMILY_NOTIFICATION_KEYWORDS = [
  'family notified', 'family notification', 'lar notified', 'guardian notified',
  'next of kin', 'family called', 'notified family', 'not notified family',
];

const CAMPUS_COORDINATOR_KEYWORDS = [
  'campus coordinator', 'coordinator notified', 'notified campus coordinator',
  'cc notified', 'not notified coordinator',
];

const MEDICAL_TRANSFER_SCREEN_KEYWORDS = [
  'medical transfer screen', 'transfer screen', 'mts completed', 'transfer screen completed',
  'completed medical transfer', 'screen completed',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const TRANSFER_BACK_DIAGNOSIS_KEYWORDS = [
  'transfer back diagnosis', 'transfer-back diagnosis', 'diagnosis from hospital',
  'er diagnosis', 'discharge diagnosis', 'return diagnosis', 'hospital diagnosis',
  'diagnosis upon return',
];

const WEIGHT_KEYWORDS = [
  'weight upon return', 'weight on return', 'returned weighing', 'weight:', 'lbs', 'kg',
  'pounds', 'kilograms', 'current weight',
];

const SKIN_ASSESSMENT_KEYWORDS = [
  'skin assessment', 'skin intact', 'pressure injury', 'redness', 'breakdown',
  'wound', 'skin finding', 'no skin breakdown', 'intact skin', 'bruise', 'abrasion',
];

const MONITORING_PLAN_KEYWORDS = [
  'monitoring parameter', 'monitoring frequency', 'monitor q', 'vital signs q',
  'monitoring plan', 'parameters and frequency', 'q4', 'q2', 'every 4 hours',
];

const SOURCE_NURSING_REPORT_KEYWORDS = [
  'report received from', 'nursing report received', 'report from er', 'report from hospital',
  'received report from', 'transferring facility', 'source of report',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'declining health', 'abnormal findings', 'not notified', 'will notify pcp',
];

function transferField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const CROSS_REFERENCE_INSTRUCTIONS = `When the transfer is related to another facility guideline (for example Head Injury, Seizure Activity, Respiratory Distress, Hypothermia, PICA, Vomiting, or other documented clinical event), also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate duplicate notes unless requested. Use cross-referenced guidelines only as supporting documentation rules.`;

const INITIAL_ASSESSMENT_INSTRUCTIONS = `TRANSFER OUT — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document the reason for transfer as reported by the resident, staff, PCP, or emergency responders.
- If the resident cannot provide information, document available reports only.
- Do not assume symptoms or reasons for transfer.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Transfer reason
- Additional assessment findings prior to transfer
- Current use of anticoagulant or antiplatelet medication

ASSESSMENT:
Transfer Out

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document the time Emergency Response was notified (only if reported).
- Monitor the resident at the ordered frequency until transport arrives (only if reported).
- Follow PCP orders (only if reported).
- Document to whom the nurse report was given (only if reported).
- Document the Braden Score reported to the receiving ER nurse (only if reported — never fabricate values).
- Document family notification (only if reported — do not assume family was notified).
- Document Campus Coordinator notification (only if reported — do not assume notification occurred).
- Complete the Medical Transfer Screen (only if reported completed — do not assume completion).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify PCP if declining health status or abnormal findings are noted during assessment (only if criteria met and notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never fabricate the reason for transfer or invent assessment findings.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `TRANSFER BACK — ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document information received from the transferring facility when available.
- Document any new concerns reported after return.
- Do not assume the resident has returned to baseline.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Transfer-back diagnosis
- Weight upon return
- Skin assessment findings

ASSESSMENT:
Transfer Back

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document monitoring parameter(s) and monitoring frequency (only if reported).
- Document from whom nursing report was received (only if reported).
- Follow PCP orders (only if reported).
- Notify PCP if declining health status or abnormal findings are noted during assessment (only if criteria met and notification occurred or is explicitly indicated).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume the resident returned to baseline unless documented.`;

export const TRANSFER_OUT_BACK_GUIDELINE: GuidelineDefinition = {
  id: 'transfer_out_back',
  displayName: 'Transfer Out / Transfer Back',
  description:
    'Transfer Out / Transfer Back facility guideline. Document transfer reason, pre-transfer assessment, anticoagulant status, emergency response notification, monitoring until transport, Braden Score, family and Campus Coordinator notification, Medical Transfer Screen, and transfer-back diagnosis, weight, and skin assessment. Cross-reference related clinical guidelines when applicable.',

  assessment: {
    requiredFields: [
      transferField('Transfer reason', TRANSFER_REASON_KEYWORDS),
      transferField('Additional assessment findings prior to transfer', PRE_TRANSFER_ASSESSMENT_KEYWORDS),
      transferField('Current use of anticoagulant or antiplatelet medication', ANTICOAGULANT_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Transfer-back diagnosis', {
        matchKeywords: TRANSFER_BACK_DIAGNOSIS_KEYWORDS,
        description: 'Transfer Back assessment.',
      }),
      fieldFromLabel('Weight upon return', {
        matchKeywords: WEIGHT_KEYWORDS,
        description: 'Transfer Back assessment.',
      }),
      fieldFromLabel('Skin assessment findings', {
        matchKeywords: SKIN_ASSESSMENT_KEYWORDS,
        description: 'Transfer Back assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    transferField('Transfer reason', TRANSFER_REASON_KEYWORDS),
    transferField('Pre-transfer assessment findings', PRE_TRANSFER_ASSESSMENT_KEYWORDS, false),
    transferField('Anticoagulant/antiplatelet status', ANTICOAGULANT_KEYWORDS, false),
    transferField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    transferField('Emergency Response notification time', EMERGENCY_RESPONSE_KEYWORDS, false),
    transferField('Monitoring frequency before transport', MONITORING_FREQUENCY_KEYWORDS, false),
    transferField('PCP orders', PCP_ORDERS_KEYWORDS, false),
    transferField('Nurse report recipient', NURSE_REPORT_RECIPIENT_KEYWORDS, false),
    transferField('Braden Score', BRADEN_SCORE_KEYWORDS, false),
    transferField('Family notification', FAMILY_NOTIFICATION_KEYWORDS, false),
    transferField('Campus Coordinator notification', CAMPUS_COORDINATOR_KEYWORDS, false),
    transferField('Medical Transfer Screen completion', MEDICAL_TRANSFER_SCREEN_KEYWORDS, false),
    transferField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    transferField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    transferField('Transfer-back diagnosis', TRANSFER_BACK_DIAGNOSIS_KEYWORDS, false),
    transferField('Weight upon return', WEIGHT_KEYWORDS, false),
    transferField('Skin assessment', SKIN_ASSESSMENT_KEYWORDS, false),
    transferField('Monitoring plan', MONITORING_PLAN_KEYWORDS, false),
    transferField('Source of nursing report', SOURCE_NURSING_REPORT_KEYWORDS, false),
    transferField('PCP notification when indicated', PCP_NOTIFICATION_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'head_injury',
        triggerKeywords: [
          'head injury', 'hit head', 'struck head', 'head impact', 'head strike',
          'scalp', 'concussion', 'hematoma',
        ],
      },
      {
        guidelineId: 'seizure',
        triggerKeywords: [
          'seizure', 'convuls', 'postictal', 'jerking', 'status epilepticus', 'anti-epileptic',
        ],
      },
      {
        guidelineId: 'respiratory',
        triggerKeywords: [
          'respiratory distress', 'aspiration', 'shortness of breath', 'dyspnea', 'sob',
          'labored breathing', 'desaturation', 'spo2', 'choking', 'hypoxia',
        ],
      },
      {
        guidelineId: 'hypothermia',
        triggerKeywords: [
          'hypothermia', 'low temperature', 'cold to touch', 'below 96', 'below 97',
          'rewarming', 'hypothermic',
        ],
      },
      {
        guidelineId: 'pica',
        triggerKeywords: [
          'pica', 'ingested', 'swallowed', 'non-food', 'foreign object', 'foreign body',
        ],
      },
      {
        guidelineId: 'vomiting',
        triggerKeywords: [
          'vomit', 'vomiting', 'emesis', 'threw up', 'nausea with emesis',
        ],
      },
      {
        guidelineId: 'fall',
        triggerKeywords: [
          'fall', 'fell', 'found on floor', 'slipped', 'tripped', 'suspected fall',
        ],
      },
      {
        guidelineId: 'pain',
        triggerKeywords: [
          'pain score', 'moderate pain', 'severe pain', 'uncontrolled pain', 'pain level',
        ],
      },
      {
        guidelineId: 'elevated_temperature',
        triggerKeywords: [
          'elevated temperature', 'fever', 'febrile', 'hyperthermia', 'temp elevated',
        ],
      },
      {
        guidelineId: 'uti',
        triggerKeywords: [
          'uti', 'urinary tract infection', 'dysuria', 'cloudy urine', 'urinary symptoms',
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
      instructions: `RESOLUTION ASSESSMENT — Transfer Out / Transfer Back

Document guideline closure only when input supports completed transfer-back assessment, monitoring plan in place, and no unresolved transfer-related concerns as documented.
Do not assume the resident has returned to baseline unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Transfer Out / Transfer Back

For Transfer Out: document reason, pre-transfer findings, anticoagulant status, interventions, emergency response time, monitoring until transport, PCP orders, report recipient, Braden Score, family/Campus Coordinator notification, Medical Transfer Screen — only if supported.
For Transfer Back: document diagnosis, weight, skin assessment, monitoring plan, report source, interventions, PCP notification — only if supported.
Apply cross-referenced guideline supporting rules when related clinical events are documented. Do not invent findings or assume notifications occurred.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Transfer Out / Transfer Back

SITUATION: transfer out or transfer back event per facility guideline.
BACKGROUND: supported transfer reason, pre-transfer or return findings, anticoagulant status, related clinical events if reported.
ASSESSMENT: required assessment elements provided only — do not fabricate Braden Score or assume baseline return.
RECOMMENDATION: monitoring, PCP orders/notification, handoff, cross-referenced guideline recommendations when applicable — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Transfer Out / Transfer Back

Plain-language summary of supported facts: reason for transfer or return from hospital, family notification if reported, monitoring and follow-up plan.
Do not assume family was notified or include clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Transfer Out / Transfer Back

Notify PCP if declining health status or abnormal findings are noted during assessment — document only if notification occurred or is explicitly indicated.
Apply cross-referenced guideline provider notification criteria when related clinical events are documented. Never fabricate transfer reason or assessment findings.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Monitor at ordered frequency until transport arrives (Transfer Out); continue documented monitoring parameters after return (Transfer Back).',
    monitoringPoints: [
      'Transfer reason and pre-transfer assessment findings',
      'Emergency Response notification and monitoring until transport',
      'Transfer-back diagnosis, weight, and skin assessment',
      'Monitoring parameters and frequency after return',
      'PCP orders and notification when indicated',
    ],
    reassessmentCriteria: [
      'Declining health status or abnormal findings',
      'New concerns after return',
      'Incomplete transfer documentation elements',
      'Related clinical event requiring cross-referenced guideline follow-up',
    ],
    instructions: `${CROSS_REFERENCE_INSTRUCTIONS}

Never assume family or Campus Coordinator notification, Medical Transfer Screen completion, or baseline return unless documented.`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Transfer-back assessment complete as documented',
      'Monitoring plan documented after return',
      'No unresolved transfer-related concerns as reported',
    ],
    instructions:
      'Do not mark transfer guideline resolved unless transfer-back elements and monitoring completion are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if declining health status or abnormal findings are noted during assessment. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Document family notification for Transfer Out only if reported. Do not assume family was notified.',
    triggers: [
      'Declining health status during assessment',
      'Abnormal findings during assessment',
      'Emergency transfer',
      'Return from hospital with new concerns',
    ],
    prohibitedAutoNotifications: [
      'Do not document family notification unless explicitly reported.',
      'Do not document Campus Coordinator notification unless explicitly reported.',
      'Do not document PCP notification unless criteria met or explicit notification is reported.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident transfer education or return instructions only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about transfer or return only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate the reason for transfer.',
    'Never invent assessment findings.',
    'Never assume the resident returned to baseline.',
    'Never assume family was notified.',
    'Never assume the Campus Coordinator was notified.',
    'Never assume the Medical Transfer Screen was completed.',
    'Never fabricate Braden Score values.',
    'Document only findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
