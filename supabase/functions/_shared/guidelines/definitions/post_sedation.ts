import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const EMAR_MEDICATION_KEYWORDS = [
  'emar', 'e-mar', 'medication administered', 'medications administered', 'see emar',
  'versed', 'midazolam', 'fentanyl', 'nitrous', 'halcion', 'triazolam', 'lorazepam',
  'sedation medication', 'premedication', 'chemical sedation', 'sedative', 'anesthesia',
  'medication given', 'dose administered', 'mg administered',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'vital signs', 'spo2',
];

const THIRTY_MIN_MONITORING_KEYWORDS = [
  'every 30 minutes', 'every thirty minutes', 'q30', '30 minutes', '30 min',
  'assess every 30', 'until departure', 'until monitoring complete', 'monitoring period',
  'continue assessment every 30', 'post medication monitoring', 'return home post medication',
];

const ALTERED_MENTAL_STATUS_KEYWORDS = [
  'altered mental status', 'ams', 'confused', 'lethargic', 'somnolent', 'disoriented',
  'drowsy', 'decreased alertness', 'not at baseline', 'mental status', 'level of consciousness',
  'loc', 'alert', 'oriented', 'obtunded', 'unresponsive', 'sedated',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'abnormal findings', 'complications', 'end of the monitoring period', 'not notified',
  'will notify pcp', 'declining', 'worsening',
];

const REPORT_24_HOUR_KEYWORDS = [
  '24-hour report', '24 hour report', 'communicate through', 'shift report',
  'nurse-to-nurse', 'nurse to nurse', 'oncoming nurse',
];

const STAFF_INSTRUCTIONS_KEYWORDS = [
  'staff instructions', 'instructions provided', 'staff verbalized', 'staff demonstrated',
  'understanding', 'staff education', 'education provided', 'instructed staff',
];

const RETURN_LOCATION_KEYWORDS = [
  'return from', 'returned from', 'dental office', 'medical office', 'hospital', 'clinic',
  'facility', 'location', 'appointment location', 'returned to facility', 'came back from',
];

const RETURN_HOME_TIME_KEYWORDS = [
  'return home time', 'returned at', 'time of return', 'arrival time', 'back at facility',
  'return time', 'home time', 'returned home',
];

const APPOINTMENT_SUCCESS_KEYWORDS = [
  'appointment successful', 'procedure successful', 'appointment/procedure successful',
  'successful', 'unsuccessful', 'completed', 'not successful', 'yes', 'no',
  'procedure completed', 'dental procedure', 'medical procedure',
];

const MONITORING_REQUIREMENT = `FACILITY MONITORING REQUIREMENT (preserve exactly):
- After chemical medication administration, assess the resident every 30 minutes until departure (initial assessment).
- Continue assessment every 30 minutes according to the Medical/Dental Chemical Sedation guideline until monitoring is complete (return home assessment).
Do not assume monitoring occurred unless documented.`;

const CROSS_REFERENCE_INSTRUCTIONS = `When the resident develops respiratory depression, respiratory distress, hypoxia, seizure activity, emergency transfer, or altered mental status with related complications, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function sedationField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `MEDICAL/DENTAL CHEMICAL SEDATION — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any concerns or symptoms reported by the resident or staff prior to medication administration.
- If the resident is unable to report symptoms, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.
- See eMAR for medication(s) administered (always reference eMAR — never fabricate medications administered).

ASSESSMENT:
Pre Medical/Dental Chemical Sedation

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- After chemical medication administration, assess the resident every 30 minutes until departure (monitoring requirement — preserve exactly).
- Follow the Medical/Dental Chemical Sedation guideline throughout monitoring.
- If signs or symptoms of altered mental status are present at the end of the monitoring period, notify the PCP (only if criteria met and notification occurred or is explicitly indicated — never fabricate altered mental status findings).
- Document all nursing interventions completed (only if reported).
- Communicate through the 24-hour report (only if reported).
- Notify PCP of abnormal findings or complications (only if criteria met and notification occurred or is explicitly indicated).
- Document staff instructions provided (only if reported).

${MONITORING_REQUIREMENT}

Never assume the appointment or procedure was successful. Never invent PCP orders.`;

const RETURN_HOME_ASSESSMENT_INSTRUCTIONS = `MEDICAL/DENTAL CHEMICAL SEDATION — RETURN HOME POST ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any symptoms or concerns reported after returning from the appointment or procedure.
- If the resident cannot report symptoms, document observed findings only.

OBJECTIVE:
- Return Home Post Medication Monitoring.
- See Assessment in I-View.
- Appointment/Procedure Successful (Yes/No) — only if reported; do not assume success.
- See eMAR for medication(s) administered (always reference eMAR — never fabricate medications).

Required assessment (document only what is provided):
- Return from (facility/location)
- Return home time

ASSESSMENT:
Post Medical/Dental Chemical Sedation

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Continue assessment every 30 minutes according to the Medical/Dental Chemical Sedation guideline until monitoring is complete (monitoring requirement — preserve exactly).
- Follow the Medical/Dental Chemical Sedation guideline.
- Notify PCP if signs or symptoms of altered mental status are present at the end of the monitoring period (only if criteria met and notification occurred or is explicitly indicated).
- Document all nursing interventions completed (only if reported).
- Communicate through the 24-hour report (only if reported).
- Notify PCP of abnormal findings or complications (only if criteria met and notification occurred or is explicitly indicated).
- Document staff instructions provided (only if reported).

Never assume complications occurred or did not occur. Never fabricate altered mental status findings.`;

export const POST_SEDATION_GUIDELINE: GuidelineDefinition = {
  id: 'post_sedation',
  displayName: 'Medical/Dental Chemical Sedation',
  description:
    'Medical/Dental Chemical Sedation facility guideline. Document pre- and post-sedation assessment, eMAR medication reference, every-30-minute monitoring until departure or monitoring complete, altered mental status assessment, PCP notification when indicated, and 24-hour report communication. Cross-reference Respiratory Distress/Aspiration, Seizure Activity, and Transfer Out when complications develop.',

  assessment: {
    requiredFields: [
      sedationField('eMAR medication documentation', EMAR_MEDICATION_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Return from (facility/location)', {
        matchKeywords: RETURN_LOCATION_KEYWORDS,
        description: 'Return Home Post Assessment.',
      }),
      fieldFromLabel('Return home time', {
        matchKeywords: RETURN_HOME_TIME_KEYWORDS,
        description: 'Return Home Post Assessment.',
      }),
      fieldFromLabel('Appointment/Procedure Successful (Yes/No)', {
        matchKeywords: APPOINTMENT_SUCCESS_KEYWORDS,
        description: 'Return Home Post Assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    sedationField('eMAR medication documentation', EMAR_MEDICATION_KEYWORDS),
    sedationField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    sedationField('Every-30-minute monitoring plan', THIRTY_MIN_MONITORING_KEYWORDS, false),
    sedationField('Altered mental status assessment', ALTERED_MENTAL_STATUS_KEYWORDS, false),
    sedationField('PCP notification (when indicated)', PCP_NOTIFICATION_KEYWORDS, false),
    sedationField('24-hour report communication', REPORT_24_HOUR_KEYWORDS, false),
    sedationField('Staff instructions', STAFF_INSTRUCTIONS_KEYWORDS, false),
    sedationField('Return location', RETURN_LOCATION_KEYWORDS, false),
    sedationField('Return home time', RETURN_HOME_TIME_KEYWORDS, false),
    sedationField('Appointment/procedure success', APPOINTMENT_SUCCESS_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'respiratory',
        triggerKeywords: [
          'respiratory depression', 'respiratory distress', 'hypoxia', 'desaturation',
          'low oxygen', 'spo2', 'shortness of breath', 'dyspnea', 'labored breathing',
          'decreased respirations', 'apnea', 'aspiration',
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
      applicable: true,
      instructions: INITIAL_ASSESSMENT_INSTRUCTIONS,
    },

    followUpAssessment: {
      applicable: true,
      instructions: RETURN_HOME_ASSESSMENT_INSTRUCTIONS,
    },

    resolutionAssessment: {
      applicable: true,
      instructions: `RESOLUTION ASSESSMENT — Medical/Dental Chemical Sedation

Use when monitoring is complete and the resident has returned to baseline mental status as documented.
Document guideline closure only when input supports completion of every-30-minute monitoring and no ongoing altered mental status or complications as documented.
Do not assume monitoring is complete or that the resident has returned to baseline unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Medical/Dental Chemical Sedation

SUBJECTIVE: pre- or post-sedation concerns reported or observed; do not assume symptoms unless reported.
OBJECTIVE: Interactive View Assessment; eMAR medication reference; return location/time and appointment success for return home assessment — only if provided. Never fabricate medications or mental status findings.
ASSESSMENT: Pre Medical/Dental Chemical Sedation (initial) or Post Medical/Dental Chemical Sedation (return home)
PLAN: every-30-minute monitoring, PCP notification when indicated, interventions, 24-hour report, staff instructions, cross-referenced guideline actions when complications develop — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Medical/Dental Chemical Sedation

SITUATION: medical/dental chemical sedation monitoring per facility guideline.
BACKGROUND: supported eMAR medications, appointment/procedure context, return from location/time if reported.
ASSESSMENT: mental status and objective findings provided only — do not fabricate altered mental status or assume procedure success.
RECOMMENDATION: every-30-minute monitoring until complete, PCP notification at end of monitoring period if altered mental status, complication management per cross-referenced guidelines — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Medical/Dental Chemical Sedation

Plain-language summary of supported facts: resident received sedation for medical/dental appointment, monitoring steps taken, return home status if reported.
Do not include fabricated medication details or assumed complications beyond what nurse provided.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Medical/Dental Chemical Sedation

Notify PCP if signs or symptoms of altered mental status are present at the end of the monitoring period, or for abnormal findings or complications — document only if notification occurred or is explicitly indicated.
Apply cross-referenced guideline provider notification criteria when respiratory depression/distress, hypoxia, seizure activity, or emergency transfer is documented.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Assess every 30 minutes after chemical medication administration until departure (initial) or until monitoring is complete (return home).',
    monitoringPoints: [
      'eMAR medication documentation',
      'Altered mental status at each assessment',
      'Vital signs and respiratory status as documented',
      'Return location and time (return home assessment)',
      'Appointment/procedure success (return home assessment)',
    ],
    reassessmentCriteria: [
      'Altered mental status at end of monitoring period',
      'Abnormal findings or complications',
      'Respiratory depression or distress',
      'Hypoxia',
      'Seizure activity',
      'Emergency transfer need',
    ],
    instructions: `${MONITORING_REQUIREMENT}

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Every-30-minute monitoring complete as documented',
      'No altered mental status at end of monitoring period as documented',
      'No ongoing complications requiring continued sedation monitoring as documented',
    ],
    instructions:
      'Do not mark sedation guideline resolved unless monitoring completion and mental status return to baseline are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if signs or symptoms of altered mental status are present at the end of the monitoring period, or for abnormal findings or complications. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant sedation-related change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Altered mental status at end of monitoring period',
      'Abnormal findings or complications',
      'Respiratory depression or distress',
      'Hypoxia',
      'Seizure activity',
      'Emergency transfer',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless criteria met or explicit notification is reported.',
      'Do not assume complications occurred or did not occur.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident sedation or post-procedure education only if reported.',
    staffInstructions:
      'Document staff instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about sedation monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate medications administered.',
    'Always reference eMAR for medication administration.',
    'Never assume the appointment or procedure was successful.',
    'Never fabricate altered mental status findings.',
    'Never assume complications occurred or did not occur.',
    'Never invent PCP orders.',
    'Preserve the facility monitoring schedule exactly: assess every 30 minutes after chemical medication administration until monitoring is complete.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
