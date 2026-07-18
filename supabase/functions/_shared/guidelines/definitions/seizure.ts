import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const SEIZURE_DATE_TIME_KEYWORDS = [
  'date and time of seizure', 'seizure at', 'occurred at', 'time of seizure',
  'date of seizure', 'am', 'pm', 'today', 'yesterday',
  'witnessed seizure', 'seizure episode',
];

const BREAKTHROUGH_MED_KEYWORDS = [
  'breakthrough', 'standing order', 'standing medication', 'prn medication', 'prn seizure',
  'anti-epileptic', 'antiepileptic', 'aed', 'dilantin', 'phenytoin', 'keppra', 'levetiracetam',
  'depakote', 'valproate', 'ativan', 'lorazepam', 'midazolam', 'diastat', 'administered',
  'not administered', 'no medication given', 'medication given',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'neuro check', 'safety',
];

const ANTIEPILEPTIC_FOLLOWUP_KEYWORDS = [
  'follow up next shift', 'next shift', 'anti-epileptic effectiveness', 'effectiveness of anti-epileptic',
  'monitor for side effects', 'side effects', 'aed follow-up', 'follow up during next shift',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'no prior seizure history', 'seizure-free', 'extended period', 'different seizure type',
  'baseline vital', 'significant deviation', 'not notified', 'will notify pcp',
];

const STATUS_EPILEPTICUS_KEYWORDS = [
  'status epilepticus', 'repetitive', 'continuous', 'rapid succession', '3-5 minutes',
  '3 to 5 minutes', 'longer than 3', 'longer than 5', 'prn seizure medication',
  'recurrent seizures', 'back to back', 'cluster',
];

const VS_MONITORING_SCHEDULE_KEYWORDS = [
  'every 30 minutes', '30 minutes x2', 'every 2 hours', '2 hours x2', 'every 4 hours',
  '24 hours', 'spo2', 'vital signs', 'breakthrough medication', 'monitoring schedule',
  'complete set of vital signs',
];

const HOME_MANAGER_KEYWORDS = [
  'home manager', 'hm notified', 'notified home manager', 'manager notified',
];

const RN_CASE_MANAGER_KEYWORDS = [
  'rn case manager', 'case manager', 'rcm notified', 'notified case manager',
];

const BHS_KEYWORDS = [
  'behavioral health specialist', 'bhs', 'bhs notified', 'notified bhs',
];

const QIDP_KEYWORDS = [
  'qidp', 'qidp notified', 'notified qidp', 'idt',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const SEIZURE_FREQUENCY_PATTERN_KEYWORDS = [
  'seizure frequency', 'seizure pattern', 'change in frequency', 'change in pattern',
  'increased seizures', 'new pattern', 'frequency change', 'pattern change',
];

const MEDICATION_EFFECTIVENESS_KEYWORDS = [
  'medication effectiveness', 'anti-epileptic effectiveness', 'effective', 'ineffective',
  'aed effective', 'seizure controlled', 'no further seizures',
];

const MEDICATION_SIDE_EFFECTS_KEYWORDS = [
  'medication side effects', 'side effects', 'adverse effect', 'sedated', 'ataxia',
  'drowsiness', 'monitor for side effects',
];

const ADDITIONAL_SEIZURE_KEYWORDS = [
  'additional seizure', 'recurrent seizure', 'another seizure', 'further seizure activity',
  'no additional seizure', 'no further seizures', 'continued monitoring',
];

const STATUS_EPILEPTICUS_REFERENCE = `STATUS EPILEPTICUS GUIDELINE REFERENCE (when applicable — do not generate a separate note unless requested):
Follow the Status Epilepticus nursing guideline if seizures are repetitive or continuous, occur in rapid succession, last longer than 3–5 minutes, or require PRN seizure medication.
Never diagnose status epilepticus unless explicitly documented. Apply Status Epilepticus monitoring and notification recommendations only when criteria are met and documented.`;

const BREAKTHROUGH_VS_MONITORING = `BREAKTHROUGH MEDICATION VITAL-SIGN MONITORING (preserve exactly when breakthrough seizure medication administered):
- Complete set of vital signs including SpO₂ every 30 minutes ×2,
- then every 2 hours ×2,
- then every 4 hours for a minimum of 24 hours.
Do not assume this monitoring occurred unless documented.`;

function seizureField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `SEIZURE ACTIVITY — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document information reported by the resident, staff, or witnesses regarding the seizure.
- If the resident is unable to provide information, document observed findings and witness reports only.
- Do not assume seizure characteristics that were not observed.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Date and time of seizure

ASSESSMENT:
Seizure Activity

Do NOT diagnose epilepsy or status epilepticus. Do NOT determine seizure type unless explicitly documented.

PLAN (include only supported elements):
- Document whether breakthrough, standing, or PRN medication was administered (only if reported).
- Nursing interventions completed (only if reported).
- Nursing to follow up during the next shift to assess effectiveness of anti-epileptic medication and monitor for side effects (monitoring requirement — do not invent completion).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Continue nursing follow-up if additional seizure activity or changes in condition occur (only if applicable/reported).
- Notify PCP if (only if criteria met and notification occurred or is explicitly indicated):
  • There is no prior seizure history.
  • The resident has been seizure-free for an extended period.
  • A different seizure type is observed.
- Notify PCP of significant deviations from baseline vital signs or other important seizure-related findings (only if supported and notification occurred or is explicitly indicated).
- ${STATUS_EPILEPTICUS_REFERENCE}
- ${BREAKTHROUGH_VS_MONITORING} (only if breakthrough medication administered and reported).
- Document seizure notification to Home Manager, RN Case Manager, Behavioral Health Specialist, and QIDP (only if each notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never fabricate seizure duration or characteristics. Never assume breakthrough medication was administered or vital signs were normal.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `SEIZURE ACTIVITY — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any additional seizure activity or changes reported by the resident or staff.
- If the resident cannot report symptoms, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Date and time of seizure requiring follow-up
- Significant changes in seizure frequency or seizure pattern

ASSESSMENT:
Seizure Activity

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Continue follow-up during the next shift to assess anti-epileptic medication effectiveness and side effects (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if additional follow-up is indicated (only if reported).
- Notify PCP if no seizure history exists, resident had previously been seizure-free for an extended period, or seizure type has changed (only if criteria met and notification occurred or is explicitly indicated).
- ${BREAKTHROUGH_VS_MONITORING} (only if breakthrough medication was administered and reported).
- Continue monitoring for additional seizure activity or changes in condition (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume seizure activity has resolved unless documented.`;

export const SEIZURE_GUIDELINE: GuidelineDefinition = {
  id: 'seizure',
  displayName: 'Seizure Activity',
  description:
    'Seizure Activity facility guideline. Document date/time of seizure, breakthrough/PRN medication, anti-epileptic follow-up, PCP notification criteria, Status Epilepticus reference when applicable, breakthrough VS+SpO₂ monitoring schedule, and required notifications. Never diagnose epilepsy or fabricate seizure characteristics.',

  assessment: {
    requiredFields: [
      seizureField('Date and time of seizure', SEIZURE_DATE_TIME_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Date and time of seizure requiring follow-up', {
        matchKeywords: SEIZURE_DATE_TIME_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
      fieldFromLabel('Significant changes in seizure frequency or seizure pattern', {
        matchKeywords: SEIZURE_FREQUENCY_PATTERN_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    seizureField('Date/time of seizure', SEIZURE_DATE_TIME_KEYWORDS),
    seizureField('Breakthrough/standing/PRN medication', BREAKTHROUGH_MED_KEYWORDS, false),
    seizureField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    seizureField('Anti-epileptic medication follow-up plan', ANTIEPILEPTIC_FOLLOWUP_KEYWORDS, false),
    seizureField('PCP notification (when indicated)', PCP_NOTIFICATION_KEYWORDS, false),
    seizureField('Status Epilepticus criteria (when applicable)', STATUS_EPILEPTICUS_KEYWORDS, false),
    seizureField('Vital-sign monitoring schedule (if PRN medication given)', VS_MONITORING_SCHEDULE_KEYWORDS, false),
    seizureField('Notification of Home Manager', HOME_MANAGER_KEYWORDS, false),
    seizureField('Notification of RN Case Manager', RN_CASE_MANAGER_KEYWORDS, false),
    seizureField('Notification of Behavioral Health Specialist', BHS_KEYWORDS, false),
    seizureField('Notification of QIDP', QIDP_KEYWORDS, false),
    seizureField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    seizureField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    seizureField('Change in seizure frequency or pattern', SEIZURE_FREQUENCY_PATTERN_KEYWORDS, false),
    seizureField('Medication effectiveness', MEDICATION_EFFECTIVENESS_KEYWORDS, false),
    seizureField('Medication side effects', MEDICATION_SIDE_EFFECTS_KEYWORDS, false),
    seizureField('Additional seizure activity', ADDITIONAL_SEIZURE_KEYWORDS, false),
    seizureField('Vital-sign monitoring schedule (if breakthrough medication administered)', VS_MONITORING_SCHEDULE_KEYWORDS, false),
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
      instructions: `RESOLUTION ASSESSMENT — Seizure Activity

Document guideline closure only when input supports no ongoing seizure activity, completed required monitoring after breakthrough medication if applicable, and stable anti-epileptic medication response.
Do not assume seizure activity has resolved unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Seizure Activity

SUBJECTIVE: resident/staff/witness report of seizure; observed findings if unable to report. Do not invent seizure characteristics.
OBJECTIVE: Interactive View Assessment; date/time of seizure — only if provided. Never fabricate duration or seizure type.
ASSESSMENT: Seizure Activity (not epilepsy or status epilepticus diagnosis unless explicitly documented)
PLAN: breakthrough/PRN medication, interventions, next-shift AED follow-up, PCP notifications per criteria, Status Epilepticus reference when applicable, VS+SpO₂ schedule if breakthrough med given, required notifications, handoff — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Seizure Activity

SITUATION: seizure activity event per facility guideline.
BACKGROUND: supported seizure history, prior seizure-free period, baseline if reported.
ASSESSMENT: date/time of seizure, frequency/pattern changes on follow-up — only if provided. Do not determine seizure type unless documented.
RECOMMENDATION: PCP notification per criteria, Status Epilepticus guideline when applicable, breakthrough VS monitoring, required notifications, continued follow-up — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Seizure Activity

Plain-language summary of supported facts: resident had a seizure, monitoring steps taken, follow-up plan if reported.
Do not include clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Seizure Activity

Notify PCP per facility criteria: no prior seizure history, extended seizure-free period, different seizure type, significant vital sign deviations, or other important seizure-related findings — document only if notification occurred or is explicitly indicated.
Reference Status Epilepticus guideline when criteria met. Never diagnose epilepsy or status epilepticus unless explicitly documented.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Follow up during the next shift to assess anti-epileptic medication effectiveness and side effects; continue if additional seizure activity or condition changes.',
    monitoringPoints: [
      'Date and time of seizure',
      'Breakthrough/standing/PRN medication administration',
      'Seizure frequency and pattern changes',
      'Anti-epileptic medication effectiveness and side effects',
      'Additional seizure activity',
      'VS + SpO₂ monitoring after breakthrough medication per facility schedule',
    ],
    reassessmentCriteria: [
      'Additional seizure activity or condition changes',
      'Change in seizure frequency or pattern',
      'Status Epilepticus criteria met',
      'Significant deviation from baseline vital signs',
      'PCP notification criteria met',
    ],
    instructions: `${STATUS_EPILEPTICUS_REFERENCE}

${BREAKTHROUGH_VS_MONITORING}

Preserve all provider notification criteria exactly as written in the facility guideline.`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'No additional seizure activity or unresolved condition changes as documented',
      'Required post-breakthrough VS+SpO₂ monitoring complete if applicable',
      'Anti-epileptic medication follow-up complete as reported',
    ],
    instructions:
      'Do not mark seizure guideline resolved unless absence of ongoing activity and monitoring completion are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if no prior seizure history, extended seizure-free period, different seizure type observed, or significant deviations from baseline vitals/other important findings. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant seizure-related change is reported. Do not auto-notify unless supported.',
    triggers: [
      'No prior seizure history',
      'Extended seizure-free period with new seizure',
      'Different seizure type observed',
      'Significant deviation from baseline vital signs',
      'Status Epilepticus criteria',
      'Breakthrough medication administration',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless criteria met or explicit notification is reported.',
      'Do not document Home Manager, RN Case Manager, BHS, or QIDP notification unless explicitly reported.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident seizure education or safety instructions only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about seizure monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never diagnose epilepsy or status epilepticus.',
    'Never determine seizure type unless explicitly documented.',
    'Never fabricate seizure duration or characteristics.',
    'Never assume breakthrough medication was administered.',
    'Never assume vital signs were normal.',
    'Never assume seizure activity has resolved unless documented.',
    'Preserve the facility monitoring schedule exactly: VS + SpO₂ every 30 minutes ×2, then every 2 hours ×2, then every 4 hours for a minimum of 24 hours after breakthrough medication.',
    'Preserve all provider notification criteria exactly as written.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
