import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const REMOVED_TUBE_TYPE_KEYWORDS = [
  'removed tube', 'tube removed', 'foley removed', 'g-tube removed', 'gtube removed',
  'mickey removed', 'mic-key removed', 'previous tube', 'old tube', 'foley', 'g-tube',
  'gtube', 'mickey', 'mic-key',
];

const REMOVED_TUBE_FRENCH_KEYWORDS = [
  'removed french', 'removed size', 'french removed', 'fr removed', '14 fr', '16 fr',
  '18 fr', '20 fr', '22 fr', '24 fr', 'french size', 'size french',
];

const TUBE_TIP_INTACT_KEYWORDS = [
  'tube tip intact', 'tip intact', 'removed tube tip', 'intact tip', 'tip was intact',
  'balloon intact', 'not intact', 'tip missing', 'fragment',
];

const INSERTED_TUBE_TYPE_KEYWORDS = [
  'inserted tube', 'tube inserted', 'new tube', 'foley inserted', 'g-tube inserted',
  'gtube inserted', 'mickey inserted', 'mic-key inserted', 'foley', 'g-tube', 'gtube',
  'mickey', 'mic-key',
];

const INSERTED_TUBE_FRENCH_KEYWORDS = [
  'inserted french', 'inserted size', 'french inserted', 'fr inserted', '14 fr', '16 fr',
  '18 fr', '20 fr', '22 fr', '24 fr', 'french size', 'size french', 'new french',
];

const BALLOON_INFLATION_KEYWORDS = [
  'balloon inflation', 'sterile water', 'ml sterile', 'ml water', 'inflated balloon',
  'balloon volume', '5 ml', '10 ml', '15 ml', '20 ml', 'ml to inflate',
];

const PLACEMENT_VERIFICATION_KEYWORDS = [
  'placement verification', 'tube placement', 'auscultation', '10 ml air bolus',
  '10ml air bolus', 'air bolus', 'gastric contents', 'visualization of gastric',
  'visualized gastric', 'verified placement', 'x-ray', 'not verified',
];

const PROCEDURE_TOLERANCE_KEYWORDS = [
  'tolerated the procedure', 'tolerated well', 'tolerated procedure', 'did not tolerate',
  'poor tolerance', 'procedure tolerance', 'well tolerated', 'without complication',
];

const DSP_EDUCATION_KEYWORDS = [
  'dsp informed', 'dsp instructed', 'direct support professional', 'report redness',
  'report swelling', 'report drainage', 'insertion site', 'g-tube was changed',
  'instructed dsp', 'staff/dsp', 'redness swelling drainage',
];

const ANTICOAGULANT_KEYWORDS = [
  'anticoagulant', 'antiplatelet', 'blood thinner', 'coumadin', 'warfarin', 'eliquis',
  'apixaban', 'xarelto', 'rivaroxaban', 'aspirin', 'plavix', 'clopidogrel', 'heparin',
  'lovenox', 'enoxaparin', 'no blood thinner', 'not on anticoag', 'current use',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const CROSS_REFERENCE_INSTRUCTIONS = `When the assessment includes feeding intolerance, vomiting, abdominal distention, respiratory distress after tube replacement, or transfer to the Emergency Room, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function gtubeField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `ENTERAL TUBE INSERTION (G-TUBE CHANGE) — PROCEDURE NOTE

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any symptoms or concerns reported by the resident or staff before the tube change.
- If the resident is unable to report symptoms, document observed findings only.

OBJECTIVE:
See I-VIEW.

ASSESSMENT:
G-Tube Change

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document the type and size (French) of the Foley, G-tube, or Mickey tube that was removed (only if reported — never fabricate tube type or French size).
- Document that the removed tube tip was intact (only if reported — do not assume tip was intact).
- Document the type and size (French) of the Foley, G-tube, or Mickey tube inserted (only if reported).
- Document the amount (mL) of sterile water used to inflate the balloon (only if reported — never fabricate volume).
- Document whether the resident tolerated the procedure well (only if reported — do not assume tolerance).
- Document that the DSP was informed the G-tube was changed and instructed to report redness, swelling, or drainage from the insertion site (only if reported).
- Document tube placement verification by auscultation of a 10 mL air bolus and/or visualization of gastric contents (only if reported — do not assume verification occurred or fabricate method).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never invent redness, swelling, drainage, bleeding, or other site findings unless documented.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `ENTERAL TUBE INSERTION (G-TUBE CHANGE) — FOLLOW-UP NOTE

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any concerns reported after the tube change.
- If the resident cannot report symptoms, document observed findings only.

OBJECTIVE:
See I-VIEW.

Required assessment (document only what is provided):
- Current use of anticoagulant or antiplatelet medications

ASSESSMENT:
G-Tube Change

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document whether the resident tolerated the procedure well (only if reported).
- Document that the DSP was informed the G-tube was changed and instructed to report redness, swelling, or drainage from the insertion site (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if additional follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Do not invent insertion site findings unless documented.`;

export const ENTERAL_TUBE_INSERTION_GUIDELINE: GuidelineDefinition = {
  id: 'enteral_tube_insertion',
  displayName: 'Enteral Tube Insertion (G-Tube Change)',
  description:
    'Enteral Tube Insertion (G-Tube Change) facility guideline. Document removed and inserted tube type/French size, intact tip, balloon inflation volume, placement verification, procedure tolerance, and DSP education. Cross-reference Enteral Feeding, Vomiting, Respiratory, Abdominal Distention/Pain, and Transfer Out when complications occur.',

  assessment: {
    requiredFields: [],
    optionalFields: [
      fieldFromLabel('Current use of anticoagulant or antiplatelet medications', {
        matchKeywords: ANTICOAGULANT_KEYWORDS,
        description: 'Follow-up note.',
      }),
    ],
  },

  missingInformationChecklist: [
    gtubeField('Removed tube type', REMOVED_TUBE_TYPE_KEYWORDS),
    gtubeField('Removed tube French size', REMOVED_TUBE_FRENCH_KEYWORDS, false),
    gtubeField('Confirmation that the tube tip was intact', TUBE_TIP_INTACT_KEYWORDS, false),
    gtubeField('Inserted tube type', INSERTED_TUBE_TYPE_KEYWORDS, false),
    gtubeField('Inserted tube French size', INSERTED_TUBE_FRENCH_KEYWORDS, false),
    gtubeField('Balloon inflation volume (mL)', BALLOON_INFLATION_KEYWORDS, false),
    gtubeField('Tube placement verification method', PLACEMENT_VERIFICATION_KEYWORDS, false),
    gtubeField('Procedure tolerance', PROCEDURE_TOLERANCE_KEYWORDS, false),
    gtubeField('DSP education', DSP_EDUCATION_KEYWORDS, false),
    gtubeField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    gtubeField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    gtubeField('Anticoagulant/antiplatelet status', ANTICOAGULANT_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'enteral_feeding_tolerance',
        triggerKeywords: [
          'feeding intolerance', 'feeding complication', 'tube feed intolerance',
          'unable to tolerate feeds', 'held feeds', 'residual',
        ],
      },
      {
        guidelineId: 'vomiting',
        triggerKeywords: [
          'vomit', 'vomiting', 'emesis', 'threw up', 'nausea with emesis',
        ],
      },
      {
        guidelineId: 'abdominal_distention_pain',
        triggerKeywords: [
          'abdominal distention', 'abdominal pain', 'distension', 'distention',
          'abdomen pain', 'bloated', 'girth increased',
        ],
      },
      {
        guidelineId: 'respiratory',
        triggerKeywords: [
          'respiratory distress', 'aspiration', 'shortness of breath', 'dyspnea',
          'after tube replacement', 'labored breathing', 'desaturation', 'spo2',
        ],
      },
      {
        guidelineId: 'transfer_out_back',
        triggerKeywords: [
          'transfer to er', 'transport to er', 'sent to er', 'emergency room',
          'ambulance', '911', 'ems',
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
      instructions: `RESOLUTION ASSESSMENT — Enteral Tube Insertion (G-Tube Change)

Document guideline closure only when input supports stable tube function, no ongoing insertion-site concerns, and follow-up monitoring complete as documented.
Do not assume resolution unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Enteral Tube Insertion (G-Tube Change)

SUBJECTIVE: pre/post procedure concerns reported or observed; do not invent symptoms or site findings.
OBJECTIVE: I-VIEW; removed/inserted tube type and French size, tip intact, balloon mL, placement verification — only if provided.
ASSESSMENT: G-Tube Change
PLAN: procedure tolerance, DSP education, handoff, cross-referenced guideline actions when complications documented — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Enteral Tube Insertion (G-Tube Change)

SITUATION: G-tube change procedure per facility guideline.
BACKGROUND: supported tube change details, anticoagulant status on follow-up if reported, complication findings if present.
ASSESSMENT: procedure documentation elements provided only — do not fabricate tube specs or placement verification.
RECOMMENDATION: DSP monitoring instructions, follow-up, cross-referenced guideline recommendations when applicable — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Enteral Tube Insertion (G-Tube Change)

Plain-language summary of supported facts: resident had G-tube changed, tolerated procedure if reported, staff monitoring instructions if reported.
Do not include fabricated tube details or site findings beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Enteral Tube Insertion (G-Tube Change)

Document provider notification only if reported. Apply cross-referenced guideline provider notification criteria when feeding intolerance, vomiting, abdominal distention, respiratory distress, or ER transfer is documented.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Follow up per facility protocol after G-tube change; monitor insertion site and feeding tolerance as documented.',
    monitoringPoints: [
      'Insertion site for redness, swelling, or drainage',
      'Tube placement and feeding tolerance',
      'Procedure tolerance',
      'Anticoagulant/antiplatelet status on follow-up',
      'DSP reporting instructions',
    ],
    reassessmentCriteria: [
      'Redness, swelling, or drainage at insertion site',
      'Feeding intolerance or vomiting',
      'Abdominal distention or pain',
      'Respiratory distress after tube replacement',
      'Emergency Room transfer',
    ],
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Stable tube function and insertion site as documented',
      'No ongoing complications as reported',
      'Follow-up monitoring complete as documented',
    ],
    instructions:
      'Do not mark guideline resolved unless stable tube and site status are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP per facility policy when complications or abnormal findings are reported. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant tube change complications are reported. Do not auto-notify unless supported.',
    triggers: [
      'Feeding intolerance after tube change',
      'Vomiting or abdominal distention',
      'Respiratory distress',
      'Emergency Room transfer',
      'Abnormal insertion site findings',
    ],
    prohibitedAutoNotifications: [
      'Do not document provider notification unless explicitly reported.',
      'Do not invent insertion site findings.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident G-tube care education only if reported.',
    staffInstructions:
      'Document DSP/staff instruction to report redness, swelling, or drainage — only if reported. Document whether staff verbalized or demonstrated understanding — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about G-tube monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate the tube type (Foley, G-tube, or Mickey).',
    'Never fabricate the French size.',
    'Never fabricate the balloon inflation volume.',
    'Never assume the removed tube tip was intact unless documented.',
    'Never assume placement verification was completed.',
    'Never fabricate the placement verification method.',
    'Never assume the resident tolerated the procedure well unless documented.',
    'Never invent redness, swelling, drainage, bleeding, or other site findings.',
    'Document only procedure details actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
