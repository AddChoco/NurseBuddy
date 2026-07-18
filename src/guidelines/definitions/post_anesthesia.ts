import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const STATUS_POST_ANESTHESIA_KEYWORDS = [
  'status post anesthesia', 's/p anesthesia', 'post anesthesia', 'post-anesthesia',
  'after anesthesia', 'returned from anesthesia', 'postoperative', 'post-op',
  'status post', 'following anesthesia', 'anesthesia recovery',
];

const ARRIVAL_HOME_TIME_KEYWORDS = [
  'time arrived home', 'arrived home', 'arrival home time', 'arrival time',
  'returned at', 'time of return', 'home time', 'returned home', 'back at facility',
];

const MEDICATIONS_RECEIVED_KEYWORDS = [
  'medication received', 'medications received', 'medication(s) received',
  'anesthesia medication', 'propofol', 'fentanyl', 'morphine', 'versed', 'midazolam',
  'rocuronium', 'sevoflurane', 'isoflurane', 'anesthesia drugs', 'received medication',
  'general anesthesia', 'regional anesthesia', 'sedation given',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'vital signs', 'spo2',
];

const GUIDELINE_FOLLOWED_KEYWORDS = [
  'post anesthesia guideline', 'follow the facility post anesthesia', 'following post anesthesia',
  'facility post anesthesia guideline', 'guideline followed', 'follow the facility',
  'post anesthesia care guideline', 'following guideline',
];

const REPORT_24_HOUR_KEYWORDS = [
  '24-hour report', '24 hour report', 'communicate through', 'shift report',
  'nurse-to-nurse', 'nurse to nurse', 'oncoming nurse',
];

const STAFF_INSTRUCTIONS_KEYWORDS = [
  'staff instructions', 'instructions provided', 'staff verbalized', 'staff demonstrated',
  'understanding', 'staff education', 'education provided', 'instructed staff',
];

const CROSS_REFERENCE_INSTRUCTIONS = `When the assessment indicates altered mental status, respiratory depression, respiratory distress, hypoxia, seizure activity, or emergency transfer, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function anesthesiaField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `POST ANESTHESIA CARE — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any symptoms or concerns reported by the resident or staff after returning from anesthesia.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Status post anesthesia
- Time arrived home
- Medication(s) received

ASSESSMENT:
Post Anesthesia

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Follow the facility Post Anesthesia Guideline (only if reported — do not invent monitoring steps beyond the facility guideline).
- Communicate through the 24-hour report (only if reported).
- Document staff instructions provided (only if reported).

Never fabricate medications received. Never assume the resident returned to baseline. Never fabricate assessment findings. Never assume complications occurred or did not occur. Never invent PCP orders. Follow only the facility Post Anesthesia Guideline.`;

export const POST_ANESTHESIA_GUIDELINE: GuidelineDefinition = {
  id: 'post_anesthesia',
  displayName: 'Post Anesthesia Care',
  description:
    'Post Anesthesia Care facility guideline. Document status post anesthesia, arrival home time, medications received, nursing interventions, 24-hour report communication, and staff instructions after return from anesthesia. Cross-reference Medical/Dental Chemical Sedation, Respiratory Distress/Aspiration, Seizure Activity, and Transfer Out when complications develop.',

  assessment: {
    requiredFields: [
      anesthesiaField('Status post anesthesia', STATUS_POST_ANESTHESIA_KEYWORDS),
      anesthesiaField('Time arrived home', ARRIVAL_HOME_TIME_KEYWORDS),
      anesthesiaField('Medication(s) received', MEDICATIONS_RECEIVED_KEYWORDS),
    ],
    optionalFields: [],
  },

  missingInformationChecklist: [
    anesthesiaField('Status post anesthesia', STATUS_POST_ANESTHESIA_KEYWORDS),
    anesthesiaField('Arrival home time', ARRIVAL_HOME_TIME_KEYWORDS, false),
    anesthesiaField('Medication(s) received', MEDICATIONS_RECEIVED_KEYWORDS, false),
    anesthesiaField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    anesthesiaField('Confirmation that the Post Anesthesia Guideline is being followed', GUIDELINE_FOLLOWED_KEYWORDS, false),
    anesthesiaField('24-hour report communication', REPORT_24_HOUR_KEYWORDS, false),
    anesthesiaField('Staff instructions', STAFF_INSTRUCTIONS_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'post_sedation',
        triggerKeywords: [
          'chemical sedation', 'medical/dental sedation', 'dental sedation', 'sedation medication',
          'every 30 minutes', 'post medication monitoring',
        ],
      },
      {
        guidelineId: 'respiratory',
        triggerKeywords: [
          'respiratory depression', 'respiratory distress', 'hypoxia', 'desaturation',
          'low oxygen', 'spo2', 'shortness of breath', 'dyspnea', 'labored breathing',
          'decreased respirations', 'apnea', 'aspiration', 'altered mental status',
        ],
      },
      {
        guidelineId: 'seizure',
        triggerKeywords: [
          'seizure activity', 'seizure', 'convulsion', 'witnessed seizure',
          'post-ictal', 'seizure episode',
        ],
      },
      {
        guidelineId: 'transfer_out_back',
        triggerKeywords: [
          'emergency transfer', 'transfer to er', 'transport to er', 'sent to er',
          'emergency room', 'ambulance', '911', 'ems', 'urgent transfer',
        ],
      },
    ],
  },

  documentation: {
    initialAssessment: {
      applicable: false,
      instructions:
        'Post Anesthesia Care does not include a separate Initial Assessment template. Use Follow-up Assessment when documenting care after the resident returns from anesthesia.',
    },

    followUpAssessment: {
      applicable: true,
      instructions: FOLLOW_UP_ASSESSMENT_INSTRUCTIONS,
    },

    resolutionAssessment: {
      applicable: true,
      instructions: `RESOLUTION ASSESSMENT — Post Anesthesia Care

Use when post-anesthesia monitoring is complete and the resident has returned to baseline as documented.
Document guideline closure only when input supports recovery from anesthesia without ongoing complications as documented.
Do not assume the resident returned to baseline unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Post Anesthesia Care

SUBJECTIVE: post-anesthesia symptoms or concerns reported or observed; do not assume symptoms unless reported.
OBJECTIVE: Interactive View Assessment; status post anesthesia, arrival home time, medications received — only if provided. Never fabricate medications or assessment findings.
ASSESSMENT: Post Anesthesia
PLAN: nursing interventions, follow facility Post Anesthesia Guideline, 24-hour report, staff instructions, cross-referenced guideline actions when complications develop — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Post Anesthesia Care

SITUATION: resident returned from anesthesia; post-anesthesia monitoring per facility guideline.
BACKGROUND: supported status post anesthesia, arrival home time, medications received if reported.
ASSESSMENT: objective findings provided only — do not fabricate findings or assume return to baseline.
RECOMMENDATION: follow Post Anesthesia Guideline, 24-hour report communication, complication management per cross-referenced guidelines — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Post Anesthesia Care

Plain-language summary of supported facts: resident returned from anesthesia, monitoring steps taken, follow-up plan if reported.
Do not include fabricated medication details or assumed complications beyond what nurse provided.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Post Anesthesia Care

Document PCP or provider notification only if abnormal findings, complications, or explicit notification is reported.
Apply cross-referenced guideline provider notification criteria when altered mental status, respiratory depression/distress, hypoxia, seizure activity, or emergency transfer is documented.`,
    },
  },

  followUpRequirements: {
    frequency: 'Follow the facility Post Anesthesia Guideline for ongoing monitoring after return from anesthesia.',
    monitoringPoints: [
      'Status post anesthesia',
      'Arrival home time',
      'Medications received',
      'Mental status and respiratory status as documented',
      'Nursing interventions and staff instructions',
    ],
    reassessmentCriteria: [
      'Altered mental status',
      'Respiratory depression or distress',
      'Hypoxia',
      'Seizure activity',
      'Emergency transfer need',
    ],
    instructions: `Follow only the facility Post Anesthesia Guideline. Document only assessment findings actually provided by the nurse.

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Resident returned to baseline as documented',
      'Post-anesthesia monitoring complete as reported',
      'No ongoing complications requiring continued post-anesthesia monitoring as documented',
    ],
    instructions:
      'Do not mark Post Anesthesia Care resolved unless return to baseline and monitoring completion are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP or provider for abnormal findings or complications only when criteria are met and notification occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant post-anesthesia change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Altered mental status',
      'Respiratory depression or distress',
      'Hypoxia',
      'Seizure activity',
      'Emergency transfer',
      'Abnormal findings or complications',
    ],
    prohibitedAutoNotifications: [
      'Do not document provider notification unless criteria met or explicit notification is reported.',
      'Do not assume complications occurred or did not occur.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident post-anesthesia education only if reported.',
    staffInstructions:
      'Document staff instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about post-anesthesia monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate medications received.',
    'Never assume the resident returned to baseline.',
    'Never fabricate assessment findings.',
    'Never assume complications occurred or did not occur.',
    'Never invent PCP orders.',
    'Follow only the facility Post Anesthesia Guideline.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
