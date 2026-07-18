import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const SKIN_IMPAIRMENT_DESCRIPTION_KEYWORDS = [
  'skin impairment', 'wound', 'pressure injury', 'ulcer', 'breakdown', 'redness',
  'description', 'location', 'sacrum', 'heel', 'hip', 'buttock', 'elbow', 'stage',
  'abrasion', 'laceration', 'skin tear', 'open area', 'impairment site',
];

const WOUND_MEASUREMENT_KEYWORDS = [
  'length', 'width', 'depth', 'l x w x d', 'lxwxd', 'cm', 'mm', 'measurement',
  'wound size', 'size of injury', 'dimensions', '0.5', '1.0', '2.0', '3.0',
  'measured', 'wound measured',
];

const UPDATED_WOUND_MEASUREMENT_KEYWORDS = [
  'current wound size', 'updated wound', 'wound size', 'length', 'width', 'depth',
  'l x w x d', 'lxwxd', 'cm', 'mm', 'measurement', 'dimensions', 'decreased',
  'increased', 'unchanged',
];

const ANTICOAGULANT_KEYWORDS = [
  'anticoagulant', 'antiplatelet', 'blood thinner', 'coumadin', 'warfarin', 'eliquis',
  'apixaban', 'xarelto', 'rivaroxaban', 'aspirin', 'plavix', 'clopidogrel', 'heparin',
  'lovenox', 'enoxaparin', 'no blood thinner', 'not on anticoag', 'current use',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'dressing', 'offload',
];

const PIR_KEYWORDS = [
  'pir', 'post injury report', 'injury report', 'incident report',
  'completed pir', 'pir completed', 'pir done', 'not applicable', 'n/a',
];

const FOLLOWUP_INTERVAL_KEYWORDS = [
  'follow up at', 'ordered interval', 'reassess', 'every shift', 'q shift',
  'every 4 hours', 'q4', 'every 8 hours', 'q8', 'daily', 'follow-up interval',
  'assess skin status', 'monitoring interval',
];

const PCP_ORDERS_KEYWORDS = [
  'pcp order', 'provider order', 'physician order', 'doctor order', 'follow pcp',
  'as ordered', 'orders obtained', 'wound care order', 'no orders', 'pending orders',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'declining skin', 'redness', 'signs of infection', 'infection', 'pain',
  'not notified', 'will notify pcp', 'worsening',
];

const INTERVENTION_EFFECTIVENESS_KEYWORDS = [
  'effectiveness', 'evaluate the effectiveness', 'nursing plan', 'intervention effectiveness',
  'effective', 'ineffective', 'improved', 'no improvement', 'plan effective',
];

const WOUND_CARE_INTERVENTIONS_KEYWORDS = [
  'wound care', 'dressing change', 'cleansed', 'applied dressing', 'hydrogel',
  'foam dressing', 'saline', 'betadine', 'wound care intervention', 'topical',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const MONITORING_REQUIREMENT = `FACILITY MONITORING REQUIREMENT (preserve exactly):
- Nursing to follow up at the ordered interval to assess skin status.
Do not assume the wound has improved or healed unless documented.`;

const CROSS_REFERENCE_INSTRUCTIONS = `When the assessment involves injury following a fall, suspected fracture or trauma, transfer to the Emergency Room, enteral tube site impairment, or worsening pain, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function skinField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `SKIN IMPAIRMENT ASSESSMENT — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms or concerns reported by the resident or staff regarding the skin impairment.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume pain or other symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Description/location of skin impairment
- Current use of anticoagulant or antiplatelet medications
- Size of injury (Length × Width × Depth)

ASSESSMENT:
Skin Impairment

Do NOT diagnose infection. Do NOT invent redness, drainage, odor, swelling, warmth, necrosis, tunneling, undermining, or other wound findings unless documented.

PLAN (include only supported elements):
- Complete a Post Injury Report (PIR) when applicable (only if reported — do not assume PIR completion).
- Nursing interventions completed (only if reported).
- Nursing to follow up at the ordered interval to assess skin status (monitoring requirement — preserve ordered interval exactly as documented).
- Follow PCP orders (only if reported — do not fabricate orders).
- Notify PCP if declining skin status is noted during assessment, including redness, signs/symptoms of infection, or pain (only if criteria met and notification occurred or is explicitly indicated).
- Evaluate the effectiveness of the nursing plan and interventions (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

${MONITORING_REQUIREMENT}

Never fabricate wound measurements.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `SKIN IMPAIRMENT ASSESSMENT — FOLLOW-UP / RESOLUTION ASSESSMENT

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
- Current use of anticoagulant or antiplatelet medications
- Current wound size (Length × Width × Depth)

ASSESSMENT:
Skin Impairment Follow-up

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Continue nursing follow-up at the ordered interval to assess skin status (only if reported — preserve ordered interval).
- Document wound care interventions performed (only if reported).
- Notify PCP if declining skin status is noted during assessment, including redness, signs/symptoms of infection, or pain (only if criteria met and notification occurred or is explicitly indicated).
- Evaluate the effectiveness of the nursing plan and interventions (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume the wound has improved or healed unless documented.`;

export const SKIN_IMPAIRMENT_GUIDELINE: GuidelineDefinition = {
  id: 'skin_impairment',
  displayName: 'Skin Impairment Assessment',
  description:
    'Skin Impairment Assessment facility guideline. Document impairment description/location, anticoagulant status, wound measurements, PIR when applicable, ordered-interval follow-up, PCP orders/notification, and intervention effectiveness. Cross-reference Fall, Suspected Fracture, Transfer Out, Enteral Tube Insertion, and Pain when applicable.',

  assessment: {
    requiredFields: [
      skinField('Description/location of skin impairment', SKIN_IMPAIRMENT_DESCRIPTION_KEYWORDS),
      skinField('Current use of anticoagulant or antiplatelet medications', ANTICOAGULANT_KEYWORDS),
      skinField('Size of injury (Length × Width × Depth)', WOUND_MEASUREMENT_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Current wound size (Length × Width × Depth)', {
        matchKeywords: UPDATED_WOUND_MEASUREMENT_KEYWORDS,
        description: 'Follow-up / resolution assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    skinField('Skin impairment description/location', SKIN_IMPAIRMENT_DESCRIPTION_KEYWORDS),
    skinField('Anticoagulant/antiplatelet status', ANTICOAGULANT_KEYWORDS, false),
    skinField('Wound measurements (Length × Width × Depth)', WOUND_MEASUREMENT_KEYWORDS, false),
    skinField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    skinField('PIR completion (when applicable)', PIR_KEYWORDS, false),
    skinField('Follow-up interval', FOLLOWUP_INTERVAL_KEYWORDS, false),
    skinField('PCP orders', PCP_ORDERS_KEYWORDS, false),
    skinField('PCP notification (when indicated)', PCP_NOTIFICATION_KEYWORDS, false),
    skinField('Evaluation of intervention effectiveness', INTERVENTION_EFFECTIVENESS_KEYWORDS, false),
    skinField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    skinField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    skinField('Updated wound measurements', UPDATED_WOUND_MEASUREMENT_KEYWORDS, false),
    skinField('Wound care interventions', WOUND_CARE_INTERVENTIONS_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'fall',
        triggerKeywords: [
          'fall', 'fell', 'found on floor', 'slipped', 'tripped', 'suspected fall',
          'injury following a fall', 'after fall',
        ],
      },
      {
        guidelineId: 'suspected_fracture_dislocation',
        triggerKeywords: [
          'fracture', 'dislocation', 'trauma', 'suspected fracture', 'suspected dislocation',
          'deformity', 'suspected injury',
        ],
      },
      {
        guidelineId: 'transfer_out_back',
        triggerKeywords: [
          'transfer to er', 'transport to er', 'sent to er', 'emergency room',
          'ambulance', '911', 'ems',
        ],
      },
      {
        guidelineId: 'enteral_tube_insertion',
        triggerKeywords: [
          'g-tube site', 'gtube site', 'enteral tube site', 'peg site', 'insertion site impairment',
          'tube site redness', 'g-tube insertion site',
        ],
      },
      {
        guidelineId: 'pain',
        triggerKeywords: [
          'worsening pain', 'increased pain', 'severe pain', 'uncontrolled pain',
          'pain score', 'moderate pain', '/10',
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
      instructions: `RESOLUTION ASSESSMENT — Skin Impairment Assessment

Use the Follow-up / Resolution Assessment template when documenting ongoing or closing skin impairment care.
Document guideline closure only when input supports wound improvement or healing as documented and ordered-interval follow-up complete.
Do not assume the wound has healed unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Skin Impairment Assessment

SUBJECTIVE: skin impairment symptoms/concerns reported or observed; do not assume pain unless reported.
OBJECTIVE: Interactive View Assessment; description/location, measurements, anticoagulant status — only if provided. Never fabricate wound findings or measurements.
ASSESSMENT: Skin Impairment (initial) or Skin Impairment Follow-up (follow-up)
PLAN: PIR if applicable, interventions, ordered-interval follow-up, PCP orders/notification, effectiveness evaluation, wound care, handoff, cross-referenced guideline actions when applicable — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Skin Impairment Assessment

SITUATION: skin impairment event per facility guideline.
BACKGROUND: supported impairment description/location, anticoagulant status, related fall/trauma/tube site if reported.
ASSESSMENT: wound measurements and objective findings provided only — do not diagnose infection or assume improvement.
RECOMMENDATION: ordered-interval monitoring, PCP notification when indicated, wound care, cross-referenced guideline recommendations — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Skin Impairment Assessment

Plain-language summary of supported facts: resident has skin impairment, monitoring and wound care steps taken, follow-up plan if reported.
Do not diagnose infection or include fabricated wound details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Skin Impairment Assessment

Notify PCP if declining skin status including redness, signs/symptoms of infection, or pain — document only if notification occurred or is explicitly indicated.
Never diagnose infection unless explicitly documented. Apply cross-referenced guideline provider notification criteria when fall, fracture, transfer, tube site, or worsening pain is documented.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Follow up at the ordered interval to assess skin status; continue wound care and monitoring per PCP orders.',
    monitoringPoints: [
      'Description/location and wound measurements',
      'Anticoagulant/antiplatelet status',
      'Skin status at ordered interval',
      'Wound care interventions and effectiveness',
      'PCP orders and notification when indicated',
    ],
    reassessmentCriteria: [
      'Declining skin status',
      'Redness, signs/symptoms of infection, or pain',
      'Change in wound measurements',
      'Related fall, trauma, or tube site impairment',
      'Worsening pain',
    ],
    instructions: `${MONITORING_REQUIREMENT}

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Wound improved or healed as documented',
      'Ordered-interval follow-up complete as reported',
      'No declining skin status as documented',
    ],
    instructions:
      'Do not mark skin impairment guideline resolved unless wound status improvement or healing is supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if declining skin status is noted, including redness, signs/symptoms of infection, or pain. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant skin impairment change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Declining skin status',
      'Redness or signs/symptoms of infection',
      'Wound-related pain',
      'Emergency Room transfer',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless criteria met or explicit notification is reported.',
      'Do not assume PIR completion unless documented.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident skin care or pressure relief education only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about skin monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate wound measurements.',
    'Never invent redness, drainage, odor, swelling, warmth, necrosis, tunneling, undermining, or other wound findings.',
    'Never diagnose infection.',
    'Never assume the wound has improved or healed.',
    'Never fabricate PCP orders.',
    'Never assume a PIR was completed unless documented.',
    'Preserve the facility requirement to reassess skin status at the ordered interval.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
