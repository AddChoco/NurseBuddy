import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const UTI_SYMPTOMS_KEYWORDS = [
  'uti', 'urinary tract', 'signs of uti', 'symptoms of uti', 'symptoms indicating uti',
  'dysuria', 'burning', 'frequency', 'urgency', 'incontinence', 'voiding', 'urination',
  'cloudy urine', 'foul odor', 'odor', 'hematuria', 'blood in urine', 'suprapubic',
  'pelvic pain', 'bladder', 'catheter', 'foley', 'urinary', 'urine', 'lethargy',
  'confusion', 'fever', 'chills', 'no symptoms', 'denies', 'observed', 'staff observation',
  '비뇨', 'infección urinaria',
];

const CARE_TRACKER_IO_KEYWORDS = [
  'care tracker', 'intake and output', 'intake/output', 'i&o', 'i/o', 'i and o',
  'fluid balance', 'urine output', 'void', 'output analysis', 'intake analysis',
  'ml', 'cc', '입력', '출력',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'administered', 'encouraged', 'observed',
];

const PCP_ORDERS_KEYWORDS = [
  'pcp order', 'provider order', 'physician order', 'doctor order', 'orders followed',
  'follow pcp', 'follow provider', 'antibiotic', 'macrobid', 'nitrofurantoin',
  'bactrim', 'ciprofloxacin', 'order received', 'as ordered',
];

const FLUID_ENCOURAGEMENT_KEYWORDS = [
  'fluid intake', 'encourage fluids', 'encouraged fluids', 'promote fluid',
  'oral fluids', 'water', 'juice', 'hydration', 'drinking', 'fluid encouragement',
  'increased fluids', 'fluid promotion',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'called',
  'contacted', 'ineffective', 'abnormal findings', 'not notified', 'no notification',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const DSP_UTI_SYMPTOMS_KEYWORDS = [
  'dsp', 'staff/dsp', 'dsp instruction', 'uti symptoms', 'symptom instruction',
  'report symptoms', 'watch for', 'signs to report', 'direct support',
];

const DSP_FLUID_PROMOTION_KEYWORDS = [
  'dsp', 'staff/dsp', 'dsp instruction', 'fluid promotion', 'promote fluid intake',
  'fluid instruction', 'encourage fluids', 'direct support',
];

const REASSESSMENT_UTI_KEYWORDS = [
  ...UTI_SYMPTOMS_KEYWORDS,
  'reassessment', 're-evaluation', 'reevaluation', 'evaluation of signs',
  'changes in symptoms', 'improved', 'worsening', 'unchanged', 'resolved',
];

const FLUID_EFFECTIVENESS_KEYWORDS = [
  'effectiveness of fluid', 'fluid effectiveness', 'increased fluid intake effective',
  'fluid intake effective', 'improved intake', 'adequate intake', 'ineffective fluids',
  'fluid encouragement effective', 'output improved',
];

const PAIN_MED_EFFECTIVENESS_KEYWORDS = [
  'pain medication', 'effectiveness of pain', 'analgesic', 'tylenol', 'acetaminophen',
  'ibuprofen', 'pain relief', 'pain effective', 'pain ineffective', 'pain score',
  'medication effective', 'medication ineffective',
];

function utiField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `UTI — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document resident-reported urinary symptoms whenever possible.
- If the resident is nonverbal or unable to report symptoms, document observed findings and staff observations only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Signs and symptoms indicating UTI
- Analysis of Care Tracker intake and output

ASSESSMENT:
Symptoms of UTI

Do NOT diagnose a UTI. Document symptoms and assessment findings only.

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Continue nursing follow-up and monitor every shift until symptoms have resolved (monitoring requirement — do not invent completion).
- Follow PCP orders (only if orders reported).
- Nursing interventions to encourage fluid intake (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify PCP if interventions are ineffective or abnormal findings are noted during assessment (only if notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).
- Document Staff/DSP instructions regarding UTI symptoms (only if reported).
- Document Staff/DSP instructions to promote fluid intake (only if reported).

Never diagnose a UTI. Never assume urine characteristics, fever, dysuria, or pain unless documented.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `UTI — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document resident-reported changes in urinary symptoms whenever possible.
- If the resident is unable to report symptoms, document observed findings and staff observations only.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Evaluation of signs and symptoms indicating UTI
- Analysis of Care Tracker intake and output
- Effectiveness of increased fluid intake (only if fluid encouragement was implemented and effectiveness reported)
- Effectiveness of pain medication (if applicable — only if pain medication given and effectiveness reported)

ASSESSMENT:
Symptoms of UTI

Do NOT diagnose a UTI. Document symptoms and assessment findings only.

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Continue nursing follow-up every shift until symptoms have resolved (monitoring requirement — do not invent completion).
- Follow PCP orders (only if orders reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify PCP if interventions remain ineffective or abnormal findings are noted (only if notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).
- Document Staff/DSP instructions regarding UTI symptoms (only if reported).
- Document Staff/DSP instructions to promote fluid intake (only if reported).

Never assume fluid intake was effective or pain medication was administered/effective unless documented.`;

export const UTI_GUIDELINE: GuidelineDefinition = {
  id: 'uti',
  displayName: 'UTI',
  description:
    'UTI facility guideline. Document urinary signs/symptoms, Care Tracker intake/output, fluid encouragement, PCP orders and notifications, and shift follow-up until symptoms resolve. Never diagnose UTI or assume undocumented findings.',

  assessment: {
    requiredFields: [
      utiField('Signs and symptoms indicating UTI', UTI_SYMPTOMS_KEYWORDS),
      utiField('Analysis of Care Tracker intake and output', CARE_TRACKER_IO_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Evaluation of signs and symptoms indicating UTI', {
        matchKeywords: REASSESSMENT_UTI_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
      fieldFromLabel('Effectiveness of increased fluid intake', {
        matchKeywords: FLUID_EFFECTIVENESS_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
      fieldFromLabel('Effectiveness of pain medication (if applicable)', {
        matchKeywords: PAIN_MED_EFFECTIVENESS_KEYWORDS,
        description: 'Follow-up assessment when pain medication given.',
      }),
    ],
  },

  missingInformationChecklist: [
    utiField('Signs or symptoms of UTI', UTI_SYMPTOMS_KEYWORDS),
    utiField('Care Tracker intake/output analysis', CARE_TRACKER_IO_KEYWORDS),
    utiField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    utiField('PCP orders (if applicable)', PCP_ORDERS_KEYWORDS, false),
    utiField('Fluid encouragement interventions', FLUID_ENCOURAGEMENT_KEYWORDS, false),
    utiField('PCP notification status', PCP_NOTIFICATION_KEYWORDS, false),
    utiField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    utiField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    utiField('DSP instruction regarding UTI symptoms', DSP_UTI_SYMPTOMS_KEYWORDS, false),
    utiField('DSP instruction regarding fluid promotion', DSP_FLUID_PROMOTION_KEYWORDS, false),
    utiField('Reassessment of UTI signs/symptoms', REASSESSMENT_UTI_KEYWORDS, false),
    utiField('Effectiveness of increased fluids', FLUID_EFFECTIVENESS_KEYWORDS, false),
    utiField('Effectiveness of pain medication (if applicable)', PAIN_MED_EFFECTIVENESS_KEYWORDS, false),
    utiField('PCP notification when indicated', PCP_NOTIFICATION_KEYWORDS, false),
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
      instructions: `RESOLUTION ASSESSMENT — UTI Guideline

Document guideline closure only when input supports that urinary symptoms have resolved per reported assessment.
Include last symptom status and intake/output trends only if reported.
Do not diagnose UTI resolution as confirmed infection clearance unless nurse provides that information.
Do not assume symptoms resolved unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — UTI Guideline

SUBJECTIVE: resident-reported urinary symptoms or observed/staff observations if unable to report. Do not invent symptoms.
OBJECTIVE: Interactive View Assessment; signs/symptoms indicating UTI, Care Tracker intake/output analysis — only if provided. Never diagnose UTI.
ASSESSMENT: Symptoms of UTI (not a diagnosis)
PLAN: nursing interventions, fluid encouragement, PCP orders, notifications, shift follow-up, staff/DSP instructions — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — UTI Guideline

SITUATION: resident with symptoms indicating possible UTI per facility guideline (do not state confirmed UTI diagnosis).
BACKGROUND: supported urinary symptom history, prior interventions, PCP orders if reported.
ASSESSMENT: signs/symptoms indicating UTI, intake/output analysis — only if provided.
RECOMMENDATION: continue shift monitoring, fluid encouragement, PCP notification if ineffective/abnormal — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — UTI Guideline

Plain-language summary of supported facts: resident has urinary symptoms being monitored, comfort and fluid measures taken, follow-up plan if reported.
Do not diagnose UTI or include clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — UTI Guideline

Document PCP notification when interventions are ineffective or abnormal findings noted — only if notification occurred or is explicitly indicated.
Include supported urinary signs/symptoms, intake/output analysis, and interventions. Never diagnose UTI.`,
    },
  },

  followUpRequirements: {
    frequency: 'Continue nursing follow-up and monitor every shift until symptoms have resolved.',
    monitoringPoints: [
      'Reassessment of signs and symptoms indicating UTI',
      'Care Tracker intake and output analysis',
      'Effectiveness of increased fluid intake',
      'Effectiveness of pain medication when applicable',
      'PCP order compliance',
    ],
    reassessmentCriteria: [
      'Interventions remain ineffective',
      'New or worsening urinary symptoms',
      'Abnormal assessment findings',
      'Inadequate fluid intake or output concerns',
    ],
    instructions:
      'Use follow-up template each shift until symptoms resolve. Document fluid and pain medication effectiveness only when supported.',
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Urinary symptoms resolved as documented',
      'Shift follow-up monitoring complete as reported',
      'No unresolved ineffective interventions or abnormal findings',
    ],
    instructions:
      'Do not mark UTI guideline resolved unless symptom resolution and monitoring completion are supported by provided information. Do not diagnose infection clearance.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if interventions are ineffective or abnormal findings are noted during assessment. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant urinary symptom change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Ineffective nursing interventions',
      'Abnormal assessment findings',
      'Worsening urinary symptoms',
      'Inadequate response to fluid encouragement or PCP orders',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless ineffective interventions, abnormal findings, or explicit notification is reported.',
      'Do not diagnose UTI or state confirmed infection unless nurse provides that information.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident education about urinary symptoms or fluid intake only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document Staff/DSP instructions regarding UTI symptoms and fluid promotion — only if reported.',
  },

  prohibitedAssumptions: [
    'Never diagnose a UTI.',
    'Document only symptoms and assessment findings provided by the nurse.',
    'Never assume urine characteristics, fever, dysuria, or pain unless documented.',
    'Never assume fluid intake was effective unless documented.',
    'Never assume pain medication was administered or effective unless documented.',
    'If the resident is nonverbal, document observed findings only.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise. Assessment label is "Symptoms of UTI" — not a diagnosis.',
};
