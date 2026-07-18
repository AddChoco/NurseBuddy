import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const FALL_DATE_TIME_KEYWORDS = [
  'fall', 'fell', 'suspected fall', 'found on floor', 'slipped', 'tripped',
  'date', 'time', 'am', 'pm', 'at ', '낙상', '넘어', 'caída', 'yesterday', 'today',
];

const WITNESSED_KEYWORDS = [
  'witnessed', 'unwitnessed', 'not witnessed', 'staff saw', 'nobody saw',
  'found on floor', 'observer', 'witness',
];

const LOCATION_CIRCUMSTANCES_KEYWORDS = [
  'location', 'room', 'hallway', 'bathroom', 'bedroom', 'dining', 'outside',
  'circumstance', 'how it happened', 'mechanism', 'transferring', 'walking',
  'wheelchair', 'bed', 'toilet', 'ambulating',
];

const HEAD_IMPACT_KEYWORDS = [
  'head impact', 'head strike', 'hit head', 'struck head', 'bumped head',
  'head injury', 'scalp', 'no head strike', 'without head', 'denies head',
];

const LOC_KEYWORDS = [
  'loss of consciousness', 'loc', 'passed out', 'unconscious', 'syncope',
  'no loc', 'without loc', 'did not lose consciousness', 'remained conscious',
  'alert', 'awake',
];

const PAIN_KEYWORDS = [
  'pain', 'discomfort', 'ache', 'sore', 'hurt', 'tender', '통증', 'dolor',
  'no pain', 'without pain', 'denies pain',
];

const INJURY_SKIN_KEYWORDS = [
  'injury', 'skin', 'bruise', 'bruising', 'contusion', 'swelling', 'redness',
  'bleeding', 'abrasion', 'laceration', 'cut', 'intact', 'no injury',
  'wound', 'hematoma',
];

const NEURO_MENTAL_KEYWORDS = [
  'neuro', 'neurologic', 'mental status', 'alert', 'oriented', 'confused',
  'lethargic', 'baseline', 'pupil', 'speech', 'weakness', 'dizziness',
  'headache', 'gcs',
];

const VITAL_SIGNS_KEYWORDS = [
  'vital', 'bp', 'blood pressure', 'temp', 'temperature', 'pulse', 'heart rate',
  'respiration', 'rr', 'spo2', 'o2 sat', 'mmhg', 'bpm',
];

const ANTICOAGULANT_KEYWORDS = [
  'blood thinner', 'anticoagulant', 'antiplatelet', 'coumadin', 'warfarin',
  'eliquis', 'apixaban', 'xarelto', 'rivaroxaban', 'aspirin', 'plavix',
  'clopidogrel', 'heparin', 'lovenox', 'enoxaparin', 'no blood thinner',
  'not on anticoag',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'intervention', 'ice pack', 'comfort', 'monitor', 'observed', 'placed',
  'assisted', 'transfer', 'wheelchair', 'bed alarm', 'neuro check',
  'completed', 'given', 'administered',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification',
  'called', 'contacted', 'reported to', 'no notification', 'not notified',
];

const PIR_KEYWORDS = [
  'pir', 'post injury report', 'injury report', 'incident report',
  'completed pir', 'pir completed', 'pir done',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', '24-hour report', '24 hour report',
  'shift report', 'follow-up', 'follow up handoff', 'report given',
];

const STAFF_INSTRUCTION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'instructions',
  'education provided', 'instructed staff', 'reinforced',
];

function fallField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

/** Verified facility Initial Assessment template. */
const INITIAL_ASSESSMENT_INSTRUCTIONS = `FALL OR SUSPECTED FALL — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document resident report, witness report, or staff report regarding the fall or suspected fall.
- If the resident is nonverbal or unable to provide information, document that clearly.
- Do not invent a mechanism of injury.

OBJECTIVE:
- See Interactive View Assessment.
- Current use of blood thinners, including anticoagulants or antiplatelet medications.
- Include only assessment findings actually provided by the nurse.
- Do not automatically state that there was no injury, no pain, no head strike, or no loss of consciousness unless reported.

ASSESSMENT:
- Fall or Suspected Fall

PLAN:
- Nursing interventions completed (only if reported).
- Post Injury Report (PIR) completed (only if reported).
- Notify PCP if abnormal findings are noted during assessment (only if notification occurred or is explicitly indicated).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Nurse to assess each shift for 24 hours (monitoring requirement — do not invent completion).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Do not invent mechanism of injury, negative findings, notifications, or PIR status.`;

/** PROVISIONAL — awaiting verification from original facility document. */
const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `FALL OR SUSPECTED FALL — FOLLOW-UP ASSESSMENT
PROVISIONAL — AWAITING FACILITY VERIFICATION

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Resident report of pain, discomfort, dizziness, headache, nausea, weakness, or other new symptoms.
- Staff report of any change in behavior, mobility, alertness, activity level, sleep, or baseline status.
- If the resident is nonverbal or unable to report symptoms, document observed indicators and that subjective reporting is limited.

OBJECTIVE:
- See Interactive View Assessment.
- Date and time of follow-up assessment.
- Current neurological and mental status compared with baseline.
- Pain assessment and location, if present.
- Skin assessment for bruising, swelling, redness, bleeding, tenderness, or other injury.
- Range of motion and movement of affected areas, when appropriate and safe.
- Mobility, transfer status, or gait compared with baseline, when applicable.
- Vital signs, if obtained.
- Any delayed signs or symptoms after the fall.
- Current use of anticoagulant or antiplatelet medication.
- Status of previously identified injuries or abnormal findings.
- Results of interventions or comfort measures.
- Do not invent negative findings that were not assessed or reported.

ASSESSMENT:
- Fall or Suspected Fall follow-up status.
- State whether the resident remains at baseline, is improving, is unchanged, or has new or worsening findings only when supported by the provided information.

PLAN:
- Nursing interventions completed (only if reported).
- Continue assessment each shift for the required 24-hour period.
- Notify PCP of new, worsening, or abnormal findings (only if supported).
- Follow any provider orders received (only if reported).
- Update the Post Injury Report or related documentation if required (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if further follow-up is indicated (only if reported).
- Document staff education or instructions provided and whether staff verbalized or demonstrated understanding (only if reported).
- Document whether follow-up monitoring remains open or is complete (only if supported).
- Do not mark the fall guideline resolved unless the provided information supports completion of the required monitoring period and absence of unresolved concerns.`;

export const FALL_GUIDELINE: GuidelineDefinition = {
  id: 'fall',
  displayName: 'Fall',
  description:
    'Fall or Suspected Fall facility guideline. Document fall circumstances, injury assessment, anticoagulant use, PIR, notifications, and 24-hour shift monitoring. Do not invent negative findings or mechanism of injury.',

  assessment: {
    requiredFields: [
      fallField('Date and time of fall or suspected fall', FALL_DATE_TIME_KEYWORDS),
      fallField('Witnessed or unwitnessed status, if known', WITNESSED_KEYWORDS, false),
      fallField('Location and circumstances, if known', LOCATION_CIRCUMSTANCES_KEYWORDS, false),
      fallField('Possible head impact', HEAD_IMPACT_KEYWORDS, false),
      fallField('Loss of consciousness, if known', LOC_KEYWORDS, false),
      fallField('Pain assessment', PAIN_KEYWORDS),
      fallField('Injury or skin findings', INJURY_SKIN_KEYWORDS),
      fallField('Neurological or mental-status findings', NEURO_MENTAL_KEYWORDS),
      fallField('Vital signs, if required or obtained', VITAL_SIGNS_KEYWORDS, false),
      fallField('Anticoagulant or antiplatelet use', ANTICOAGULANT_KEYWORDS),
      fallField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
      fallField('PCP notification status', PCP_NOTIFICATION_KEYWORDS, false),
      fallField('PIR completion', PIR_KEYWORDS, false),
      fallField('Follow-up handoff status', HANDOFF_KEYWORDS, false),
      fallField('Staff instruction status', STAFF_INSTRUCTION_KEYWORDS, false),
    ],
    optionalFields: [],
  },

  missingInformationChecklist: [
    fallField('Date and time of fall or suspected fall', FALL_DATE_TIME_KEYWORDS),
    fallField('Witnessed or unwitnessed status, if known', WITNESSED_KEYWORDS, false),
    fallField('Location and circumstances, if known', LOCATION_CIRCUMSTANCES_KEYWORDS, false),
    fallField('Possible head impact', HEAD_IMPACT_KEYWORDS, false),
    fallField('Loss of consciousness, if known', LOC_KEYWORDS, false),
    fallField('Pain assessment', PAIN_KEYWORDS),
    fallField('Injury or skin findings', INJURY_SKIN_KEYWORDS),
    fallField('Neurological or mental-status findings', NEURO_MENTAL_KEYWORDS),
    fallField('Vital signs, if required or obtained', VITAL_SIGNS_KEYWORDS, false),
    fallField('Anticoagulant or antiplatelet use', ANTICOAGULANT_KEYWORDS),
    fallField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    fallField('PCP notification status', PCP_NOTIFICATION_KEYWORDS, false),
    fallField('PIR completion', PIR_KEYWORDS, false),
    fallField('Follow-up handoff status', HANDOFF_KEYWORDS, false),
    fallField('Staff instruction status', STAFF_INSTRUCTION_KEYWORDS, false),
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
      instructions: `RESOLUTION ASSESSMENT — Fall or Suspected Fall

Document guideline closure only when input supports:
- Completion of required 24-hour shift assessment period
- Absence of unresolved injury, neuro, or functional concerns
- Follow-up monitoring complete as reported

Do not mark fall guideline resolved unless supported by provided information.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Fall or Suspected Fall

Output a completed facility form — not narrative SOAP prose.

Use the FACILITY FORM TEMPLATE FOR THIS ASSESSMENT TYPE. Preserve SUBJECTIVE:/OBJECTIVE:/ASSESSMENT:/PLAN: headings and every colon-ended prompt on its own line. Leave prompts visible when blank.

Initial form prompts include:
SUBJECTIVE:

OBJECTIVE:
See Interactive View Assessment.
Current use of blood thinners, including anticoagulants or antiplatelet medications:

ASSESSMENT:
Fall or Suspected Fall

PLAN:
Nursing interventions completed:
Post Injury Report (PIR) completed:
Notify PCP if abnormal findings are noted during assessment:
Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:
Nurse to assess each shift for 24 hours.
Staff verbalized or demonstrated understanding of instructions provided:

Do not invent mechanism of injury, negative findings, notifications, or PIR status.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Fall or Suspected Fall

SITUATION: fall or suspected fall event.
BACKGROUND: supported circumstances, anticoagulant use, baseline mobility if reported.
ASSESSMENT: objective injury, pain, neuro, and vital findings provided only.
RECOMMENDATION: PCP notification, continued monitoring, PIR, handoff — only if supported by input.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Fall or Suspected Fall

Plain-language email with supported facts only: that a fall or suspected fall occurred, general monitoring steps staff took, and follow-up plan if reported.
Do not include clinical details beyond what nurse provided. Do not state no injury or full recovery unless reported.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Fall or Suspected Fall

Notify PCP for abnormal findings during assessment — document only if notification occurred or is explicitly indicated.
Include supported fall date/time, circumstances, anticoagulant use, injury/skin findings, pain, neuro status, LOC/head impact if reported, and interventions/PIR status if reported.
Do not invent urgency or negative findings.`,
    },
  },

  followUpRequirements: {
    frequency: 'Nurse to assess each shift for 24 hours after fall or suspected fall.',
    monitoringPoints: [
      'Neurological and mental status compared with baseline',
      'Pain and new symptoms',
      'Skin and injury findings including delayed signs',
      'Mobility, transfer, and gait compared with baseline',
      'Vital signs when obtained',
      'Anticoagulant or antiplatelet use',
      'Status of previously identified abnormal findings',
    ],
    reassessmentCriteria: [
      'New or worsening pain, neuro changes, or delayed symptoms',
      'New skin or injury findings',
      'Change from baseline mobility or mental status',
      'Abnormal vital signs if obtained',
    ],
    instructions:
      'Complete follow-up assessment using PROVISIONAL follow-up template until facility verification. Continue 24-hour shift monitoring until complete and unresolved concerns are absent.',
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Required 24-hour shift assessment period completed',
      'No unresolved injury, neuro, or functional concerns reported',
      'Follow-up monitoring complete as documented',
    ],
    instructions:
      'Do not mark fall guideline resolved unless input supports completion of monitoring period and absence of unresolved concerns.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if abnormal findings are noted during assessment, or for new/worsening findings on follow-up. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant fall-related change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Abnormal assessment findings on initial or follow-up exam',
      'Head impact with anticoagulant use',
      'New or worsening pain, neuro changes, or injury',
      'Delayed post-fall symptoms',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless abnormal findings, explicit notification, or follow-up trigger is reported.',
      'Do not document LAR notification unless supported by input or policy.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident education related to fall prevention only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions: 'Document LAR/guardian education in plain language only if reported.',
  },

  prohibitedAssumptions: [
    'Do not invent mechanism of injury.',
    'Do not state no injury, no pain, no head strike, or no loss of consciousness unless reported.',
    'Do not invent negative findings that were not assessed.',
    'Do not assume PIR completion unless reported.',
    'Do not assume PCP or handoff notification unless reported.',
    'Do not assume anticoagulant status unless reported.',
    'Do not mark fall guideline resolved unless monitoring period complete and concerns resolved per input.',
    'Do not treat missing checklist items as confirmed abnormal findings — they are missing information only.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
