import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const COOPERATION_LEVEL_KEYWORDS = [
  'cooperation level', 'cooperation', 'cooperative', 'lack of cooperation', 'uncooperative',
  'refused', 'willing', 'unwilling', 'participated', 'non-participation', 'unable to participate',
  'observed findings only', 'cooperated', 'did not cooperate', 'refused assessment',
];

const INJECTION_SITE_KEYWORDS = [
  'injection site', 'injection site assessment', 'im injection', 'intramuscular',
  'deltoid', 'gluteal', 'buttock', 'ventrogluteal', 'site assessed', 'no redness',
  'redness', 'swelling', 'induration', 'warmth', 'tenderness', 'intact site',
  'injection site clear', 'no swelling', 'no induration',
];

const EMAR_MEDICATION_KEYWORDS = [
  'emar', 'e-mar', 'medication administered', 'medications administered', 'see emar',
  'prn medication', 'chemical restraint', 'haloperidol', 'haldol', 'ativan', 'lorazepam',
  'benadryl', 'diphenhydramine', 'geodon', 'ziprasidone', 'medication given', 'dose administered',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'vital signs', 'mental status',
];

const GUIDELINE_FOLLOWED_KEYWORDS = [
  'crisis chemical restraint guideline', 'follow the facility crisis chemical restraint',
  'following crisis chemical restraint', 'facility crisis chemical restraint guideline',
  'guideline followed', 'follow the facility', 'crisis chemical restraint care guideline',
];

const ALTERED_MENTAL_STATUS_KEYWORDS = [
  'altered mental status', 'ams', 'confused', 'lethargic', 'somnolent', 'disoriented',
  'drowsy', 'decreased alertness', 'not at baseline', 'mental status', 'level of consciousness',
  'loc', 'alert', 'oriented', 'end of the monitoring period', 'monitoring complete',
  'monitoring period', 'obtunded', 'sedated',
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

const CROSS_REFERENCE_INSTRUCTIONS = `When the assessment indicates respiratory depression, respiratory distress, hypoxia, seizure activity, emergency transfer, altered mental status, or transition to physical restraint, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function chemicalRestraintField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `CRISIS CHEMICAL RESTRAINT — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any concerns or observations reported by staff regarding the crisis event.
- If the individual is unable or unwilling to participate in the assessment, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.
- Injection site assessment (only document findings provided — never fabricate injection site findings).
- See eMAR for medication(s) administered (always reference eMAR — never fabricate medications administered).

Required assessment (document only what is provided):
- Individual's cooperation level
- Injection site assessment

ASSESSMENT:
Crisis Chemical Restraint

PLAN (include only supported elements):
- Follow the facility Crisis Chemical Restraint Guideline (only if reported — do not invent monitoring steps beyond the facility guideline).
- If signs or symptoms of altered mental status are present at the end of the monitoring period, notify the PCP (only if criteria met and notification occurred or is explicitly indicated — never fabricate altered mental status findings).
- Nursing interventions completed (only if reported).
- Communicate through the 24-hour report (only if reported).
- Notify the PCP of abnormal findings or complications (only if criteria met and notification occurred or is explicitly indicated).
- Document staff instructions provided (only if reported).

Never assume the individual was cooperative. Never assume complications occurred or did not occur. Never invent PCP orders. Follow only the facility Crisis Chemical Restraint Guideline.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `CRISIS CHEMICAL RESTRAINT — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any new concerns reported by staff or the individual following chemical restraint.
- If the individual cannot participate in the assessment, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.
- See eMAR for medication(s) administered (always reference eMAR — never fabricate medications administered).
- Injection site assessment (only document findings provided — never fabricate injection site findings).

Required assessment (document only what is provided):
- Individual's cooperation level
- Injection site assessment

ASSESSMENT:
Crisis Chemical Restraint

PLAN (include only supported elements):
- Follow the facility Crisis Chemical Restraint Guideline (only if reported).
- If signs or symptoms of altered mental status are present at the end of the monitoring period, notify the PCP (only if criteria met and notification occurred or is explicitly indicated).
- Nursing interventions completed (only if reported).
- Communicate through the 24-hour report (only if reported).
- Notify the PCP of abnormal findings or complications (only if criteria met and notification occurred or is explicitly indicated).
- Document staff instructions provided (only if reported).

Never fabricate injection site findings or altered mental status findings.`;

export const CRISIS_CHEMICAL_RESTRAINT_GUIDELINE: GuidelineDefinition = {
  id: 'crisis_chemical_restraint',
  displayName: 'Crisis Chemical Restraint',
  description:
    'Crisis Chemical Restraint facility guideline. Document cooperation level, injection site assessment, eMAR medications, nursing interventions, guideline adherence, altered mental status at monitoring completion, PCP notification, 24-hour report, and staff instructions. Cross-reference Crisis Physical Restraint, Medical/Dental Chemical Sedation, Respiratory Distress/Aspiration, Seizure Activity, and Transfer Out when complications develop.',

  assessment: {
    requiredFields: [
      chemicalRestraintField("Individual's cooperation level", COOPERATION_LEVEL_KEYWORDS),
      chemicalRestraintField('Injection site assessment', INJECTION_SITE_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('eMAR medication documentation', {
        matchKeywords: EMAR_MEDICATION_KEYWORDS,
        description: 'Reference eMAR for medications administered during crisis chemical restraint.',
      }),
    ],
  },

  missingInformationChecklist: [
    chemicalRestraintField('Individual cooperation level', COOPERATION_LEVEL_KEYWORDS),
    chemicalRestraintField('Injection site assessment', INJECTION_SITE_KEYWORDS, false),
    chemicalRestraintField('eMAR medication documentation', EMAR_MEDICATION_KEYWORDS, false),
    chemicalRestraintField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    chemicalRestraintField(
      'Confirmation that the Crisis Chemical Restraint Guideline is being followed',
      GUIDELINE_FOLLOWED_KEYWORDS,
      false,
    ),
    chemicalRestraintField(
      'Altered mental status assessment (when monitoring is complete)',
      ALTERED_MENTAL_STATUS_KEYWORDS,
      false,
    ),
    chemicalRestraintField('PCP notification (when indicated)', PCP_NOTIFICATION_KEYWORDS, false),
    chemicalRestraintField('24-hour report communication', REPORT_24_HOUR_KEYWORDS, false),
    chemicalRestraintField('Staff instructions', STAFF_INSTRUCTIONS_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'crisis_physical_restraint',
        triggerKeywords: [
          'physical restraint', 'transition to physical restraint', 'placed in physical restraint',
          'crisis physical restraint', 'mechanical restraint', 'hold', 'restrained physically',
        ],
      },
      {
        guidelineId: 'post_sedation',
        triggerKeywords: [
          'chemical sedation', 'medical/dental sedation', 'sedation medication', 'every 30 minutes',
          'post medication monitoring',
        ],
      },
      {
        guidelineId: 'respiratory',
        triggerKeywords: [
          'respiratory depression', 'respiratory distress', 'hypoxia', 'desaturation',
          'low oxygen', 'spo2', 'shortness of breath', 'dyspnea', 'labored breathing',
          'decreased respirations', 'apnea', 'altered mental status',
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
      instructions: FOLLOW_UP_ASSESSMENT_INSTRUCTIONS,
    },

    resolutionAssessment: {
      applicable: true,
      instructions: `RESOLUTION ASSESSMENT — Crisis Chemical Restraint

Use when monitoring is complete and the individual's mental status has returned to baseline as documented.
Document guideline closure only when input supports completion of crisis chemical restraint monitoring without ongoing complications as documented.
Do not assume monitoring is complete or that altered mental status has resolved unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Crisis Chemical Restraint

SUBJECTIVE: crisis event concerns or observations reported by staff; cooperation level if reported — do not assume cooperation.
OBJECTIVE: Interactive View Assessment; injection site assessment and eMAR medication reference — only if provided. Never fabricate injection site findings or medications.
ASSESSMENT: Crisis Chemical Restraint
PLAN: follow facility Crisis Chemical Restraint Guideline, PCP notification when indicated, interventions, 24-hour report, staff instructions, cross-referenced guideline actions when complications develop — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Crisis Chemical Restraint

SITUATION: crisis chemical restraint event per facility guideline.
BACKGROUND: supported cooperation level, injection site findings, eMAR medications if reported, crisis context.
ASSESSMENT: objective findings provided only — do not fabricate altered mental status, injection site findings, or complications.
RECOMMENDATION: follow Crisis Chemical Restraint Guideline, PCP notification at end of monitoring period if altered mental status, cross-referenced guideline recommendations — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Crisis Chemical Restraint

Plain-language summary of supported facts: crisis chemical restraint occurred, monitoring steps taken, follow-up plan if reported.
Do not include fabricated medication or injection site details beyond what nurse provided unless appropriate for family communication per facility policy.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Crisis Chemical Restraint

Notify PCP if signs or symptoms of altered mental status are present at the end of the monitoring period, or for abnormal findings or complications — document only if notification occurred or is explicitly indicated.
Apply cross-referenced guideline provider notification criteria when respiratory depression/distress, hypoxia, seizure activity, emergency transfer, transition to physical restraint, or altered mental status is documented.`,
    },
  },

  followUpRequirements: {
    frequency: 'Follow the facility Crisis Chemical Restraint Guideline for monitoring through the monitoring period.',
    monitoringPoints: [
      'Individual cooperation level',
      'Injection site assessment',
      'eMAR medication documentation',
      'Altered mental status at end of monitoring period',
      'Mental status and respiratory status as documented',
    ],
    reassessmentCriteria: [
      'Altered mental status at end of monitoring period',
      'Abnormal findings or complications',
      'Injection site reaction',
      'Respiratory depression or distress',
      'Hypoxia',
      'Seizure activity',
      'Emergency transfer need',
      'Transition to physical restraint',
    ],
    instructions: `Follow only the facility Crisis Chemical Restraint Guideline. Document only assessment findings actually provided by the nurse.

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Monitoring period complete as documented',
      'No altered mental status at end of monitoring period as documented',
      'No ongoing complications requiring continued crisis chemical restraint monitoring as documented',
    ],
    instructions:
      'Do not mark Crisis Chemical Restraint resolved unless monitoring completion and mental status return to baseline are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if signs or symptoms of altered mental status are present at the end of the monitoring period, or for abnormal findings or complications. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when crisis chemical restraint occurs or significant change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Altered mental status at end of monitoring period',
      'Abnormal findings or complications',
      'Injection site reaction',
      'Respiratory depression or distress',
      'Hypoxia',
      'Seizure activity',
      'Emergency transfer',
      'Transition to physical restraint',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless criteria met or explicit notification is reported.',
      'Do not assume complications occurred or did not occur.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document individual or resident education related to crisis chemical restraint only if reported.',
    staffInstructions:
      'Document staff instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about crisis chemical restraint only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate medications administered.',
    'Always reference eMAR for medication administration.',
    'Never fabricate injection site findings.',
    'Never assume the individual was cooperative.',
    'Never fabricate altered mental status findings.',
    'Never assume complications occurred or did not occur.',
    'Never invent PCP orders.',
    'Follow only the facility Crisis Chemical Restraint Guideline.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules:
    'Use "individual" as in the facility guideline, or match nurse terminology setting (resident/patient/client) when generating narrative output.',
};
