import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const RESPIRATORY_SYMPTOMS_KEYWORDS = [
  'respiratory symptom', 'shortness of breath', 'dyspnea', 'sob', 'cough', 'coughing',
  'labored breathing', 'wheezing', 'breathing difficulty', 'observed', 'staff report',
  'no symptoms', 'denies', '호흡',
];

const LUNG_ASSESSMENT_KEYWORDS = [
  'lung assessment', 'lung sounds', 'breath sounds', 'auscultation', 'adventitious',
  'interactive view', 'diminished', 'wheez', 'crackle', 'rhonchi', 'stridor', 'rales',
  'clear bilaterally', 'upper lobe', 'lower lobe', 'coarse', 'fine crackles',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'auscultated',
];

const MEDICATIONS_FEEDINGS_HELD_KEYWORDS = [
  'medications held', 'meds held', 'feedings held', 'feeding held', 'held medications',
  'held feedings', 'tube feed held', 'npo', 'nothing by mouth', 'not held', 'not applicable',
];

const RN_NOTIFICATION_KEYWORDS = [
  'rn notified', 'nurse notified', 'charge nurse', 'notification time', 'notified at',
  'rn notification', 'supervisor notified', 'notified rn', 'time documented',
];

const REASSESSMENT_PLAN_KEYWORDS = [
  'reassessment planned', 'nurse reassessment', 'plan to reassess', 'reassess',
  'follow-up assessment planned', 'scheduled reassessment',
];

const ROUTINE_CARE_RESUMED_KEYWORDS = [
  'routine care resumed', 'care resumed', 'feeds resumed', 'medications resumed',
  'resumed per rn', 'time documented', 'routine resumed', 'not resumed', 'not applicable',
];

const LUNG_REASSESSMENT_FREQUENCY_KEYWORDS = [
  'reassessment frequency', 'frequency of lung', 'lung sound reassessment',
  'continued lung sound', 'every shift', 'q4', 'hourly', 'frequency documented',
  'assessment frequency',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'decline in health',
  'health status', 'notify pcp', 'not notified', 'no notification',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const RESOLUTION_STATUS_KEYWORDS = [
  'resolution status', 'resolved', 'unresolved', 'ongoing', 'monitoring complete',
  'condition resolved', 'not resolved', 'continued monitoring',
];

const BASELINE_COMPARISON_KEYWORDS = [
  'baseline', 'expected for this individual', 'compared with baseline',
  'return to baseline', 'at baseline', 'usual for resident', 'typical for',
  'expected lung sounds', 'chronic findings',
];

function lungSoundsField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `ADVENTITIOUS LUNG SOUNDS — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any respiratory symptoms reported by the resident or staff.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume respiratory symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Lung assessment findings documented in the Interactive View Assessment

ASSESSMENT:
Adventitious Lung Sounds

Do NOT diagnose pneumonia, aspiration pneumonia, pulmonary edema, COPD exacerbation, asthma exacerbation, or respiratory failure.
Do NOT identify wheezing, crackles, rhonchi, stridor, or diminished breath sounds unless explicitly documented by the nurse.

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Medications and/or feedings held (if applicable — only if reported).
- RN notified and notification time documented (only if reported).
- Nurse reassessment planned (only if reported).
- Routine care resumed per RN and time documented (if applicable — only if reported).
- Frequency of lung sound reassessment documented (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify PCP if a decline in health status is noted during assessment (only if notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never fabricate lung assessment findings. Never assume medications/feedings held or RN notification unless documented.`;

const FOLLOW_UP_RESOLUTION_INSTRUCTIONS = `ADVENTITIOUS LUNG SOUNDS — FOLLOW-UP / RESOLUTION

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any new or continuing respiratory symptoms reported by the resident or staff.
- If the resident cannot report symptoms, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Current lung assessment findings

ASSESSMENT:
Adventitious Lung Sounds

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Frequency of continued lung sound assessment (only if reported).
- Document whether current lung sounds are expected for this individual (only if reported).
- Document resolution status (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if additional follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume lung sounds have returned to baseline or condition has resolved unless documented. Never fabricate lung findings.`;

export const ADVENTITIOUS_LUNG_SOUNDS_GUIDELINE: GuidelineDefinition = {
  id: 'adventitious_lung_sounds',
  displayName: 'Adventitious Lung Sounds',
  description:
    'Adventitious Lung Sounds facility guideline. Document Interactive View lung assessment findings, RN notification, reassessment frequency, held meds/feedings, and resolution only when reported. Never diagnose pneumonia or invent specific adventitious sounds unless nurse documented them.',

  assessment: {
    requiredFields: [
      lungSoundsField(
        'Lung assessment findings documented in the Interactive View Assessment',
        LUNG_ASSESSMENT_KEYWORDS,
      ),
    ],
    optionalFields: [
      fieldFromLabel('Current lung assessment findings', {
        matchKeywords: LUNG_ASSESSMENT_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
      fieldFromLabel('Respiratory symptoms reported or observed', {
        matchKeywords: RESPIRATORY_SYMPTOMS_KEYWORDS,
        description: 'Subjective section when available.',
      }),
    ],
  },

  missingInformationChecklist: [
    lungSoundsField('Lung assessment findings', LUNG_ASSESSMENT_KEYWORDS),
    lungSoundsField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    lungSoundsField('Medications/feedings held (if applicable)', MEDICATIONS_FEEDINGS_HELD_KEYWORDS, false),
    lungSoundsField('RN notification time', RN_NOTIFICATION_KEYWORDS, false),
    lungSoundsField('Reassessment plan', REASSESSMENT_PLAN_KEYWORDS, false),
    lungSoundsField('Routine care resumed (if applicable)', ROUTINE_CARE_RESUMED_KEYWORDS, false),
    lungSoundsField('Lung reassessment frequency', LUNG_REASSESSMENT_FREQUENCY_KEYWORDS, false),
    lungSoundsField('PCP notification when indicated', PCP_NOTIFICATION_KEYWORDS, false),
    lungSoundsField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    lungSoundsField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    lungSoundsField('Current lung assessment findings', LUNG_ASSESSMENT_KEYWORDS, false),
    lungSoundsField('Resolution status', RESOLUTION_STATUS_KEYWORDS, false),
    lungSoundsField('Current lung sounds compared with baseline', BASELINE_COMPARISON_KEYWORDS, false),
  ],

  documentation: {
    initialAssessment: {
      applicable: true,
      instructions: INITIAL_ASSESSMENT_INSTRUCTIONS,
    },

    followUpAssessment: {
      applicable: true,
      instructions: FOLLOW_UP_RESOLUTION_INSTRUCTIONS,
    },

    resolutionAssessment: {
      applicable: true,
      instructions: `RESOLUTION ASSESSMENT — Adventitious Lung Sounds

Document guideline closure only when input supports resolution status and lung sounds returned to expected baseline for the individual as documented.
Do not assume resolution or baseline return unless explicitly reported.
Do not diagnose underlying pulmonary conditions.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Adventitious Lung Sounds

SUBJECTIVE: respiratory symptoms reported or observed; do not invent symptoms.
OBJECTIVE: Interactive View lung assessment findings only as documented by nurse — do not identify wheezing/crackles/rhonchi/stridor/diminished sounds unless explicitly provided.
ASSESSMENT: Adventitious Lung Sounds (not pneumonia, pulmonary edema, COPD/asthma exacerbation, or respiratory failure)
PLAN: interventions, held meds/feedings, RN notification, reassessment frequency, routine care resumed, PCP notification, handoff, staff understanding — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Adventitious Lung Sounds

SITUATION: adventitious lung sounds noted per facility guideline.
BACKGROUND: supported respiratory symptom history if reported.
ASSESSMENT: lung assessment findings from Interactive View only as documented; do not fabricate specific adventitious sounds.
RECOMMENDATION: RN notification, reassessment frequency, PCP notification for health decline, handoff — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Adventitious Lung Sounds

Plain-language summary of supported facts: staff noted lung sound changes, monitoring steps taken, follow-up plan if reported.
Do not diagnose pneumonia or include specific lung findings beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Adventitious Lung Sounds

Notify PCP if decline in health status noted during assessment — document only if notification occurred or is explicitly indicated.
Include supported lung assessment findings and interventions. Never diagnose pneumonia or pulmonary conditions.`,
    },
  },

  followUpRequirements: {
    frequency: 'Continue lung sound assessment per documented reassessment frequency until resolution or return to expected baseline.',
    monitoringPoints: [
      'Current lung assessment findings on each reassessment',
      'Frequency of continued lung sound assessment',
      'Comparison with expected baseline for the individual',
      'Resolution status',
      'Held medications/feedings and routine care resumption when applicable',
    ],
    reassessmentCriteria: [
      'New or worsening adventitious lung sounds',
      'Decline in health status',
      'Failure to return to expected baseline when reported',
      'Unresolved findings after initial intervention',
    ],
    instructions:
      'Document whether current lung sounds are expected for this individual only when nurse provides that comparison. Document resolution status only when supported.',
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Resolution status documented as resolved or at expected baseline',
      'Required lung sound reassessment period complete as reported',
      'Routine care resumed when applicable',
    ],
    instructions:
      'Do not mark guideline resolved unless resolution status and expected baseline comparison are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if decline in health status noted during assessment. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant respiratory change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Decline in health status during assessment',
      'Persistent or worsening adventitious lung sounds',
      'Failure to return to expected baseline',
      'Abnormal reassessment findings',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless health decline or explicit notification is reported.',
      'Do not document RN notification unless explicitly reported with time if applicable.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident education about reporting respiratory symptoms only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about lung sound monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never diagnose pneumonia, aspiration pneumonia, pulmonary edema, COPD exacerbation, asthma exacerbation, or respiratory failure.',
    'Never identify wheezing, crackles, rhonchi, stridor, or diminished breath sounds unless explicitly documented by the nurse.',
    'Never fabricate lung assessment findings.',
    'Never assume medications or feedings were held.',
    'Never assume the RN was notified.',
    'Never assume lung sounds have returned to baseline unless documented.',
    'Never assume the condition has resolved unless documented.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
