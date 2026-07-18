import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const COOPERATION_KEYWORDS = [
  'cooperation', 'cooperative', 'lack of cooperation', 'uncooperative', 'refused',
  'willing', 'unwilling', 'participated', 'non-participation', 'unable to participate',
  'observed findings only', 'cooperated', 'did not cooperate', 'refused assessment',
];

const EMAR_MEDICATION_KEYWORDS = [
  'emar', 'e-mar', 'medication administered', 'medications administered', 'see emar',
  'prn medication', 'chemical restraint', 'sedation medication', 'haloperidol', 'ativan',
  'lorazepam', 'benadryl', 'diphenhydramine', 'medication given', 'dose administered',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'vital signs', 'circulation',
  'skin integrity', 'restraint check',
];

const INITIAL_ASSESSMENT_TIMING_KEYWORDS = [
  'initial nursing assessment', 'immediately', 'within 30 minutes', 'within 30 min',
  'restraint initiation', 'initial assessment', '30 minutes of restraint',
];

const MONITORING_DURING_RESTRAINT_KEYWORDS = [
  'every 30 minutes while', 'while restraint', 'restraint in progress', 'restraint remains',
  'during restraint', 'every 30 minutes while the restraint', 'ongoing restraint',
];

const POST_RELEASE_MONITORING_KEYWORDS = [
  'after release', 'release from restraint', 'until stable', 'deemed stable',
  'determines the individual is stable', 'every 30 minutes after release',
  'post-release', 'restraint discontinued', 'restraint released',
];

const ONGOING_MONITORING_KEYWORDS = [
  'ongoing every 30', 'continue nursing assessment', 'every 30 minutes',
  'continue assessment every 30', 'ongoing monitoring', 'q30',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'abnormal findings', 'complications', 'not notified', 'will notify pcp',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
  'staff instructions',
];

const MONITORING_REQUIREMENT = `FACILITY MONITORING REQUIREMENT (preserve exactly):
- Perform the initial nursing assessment immediately or within 30 minutes of restraint initiation.
- Continue nursing assessment every 30 minutes while the restraint remains in progress.
- After release from the restraint, continue nursing assessment every 30 minutes until the nurse determines the individual is stable.
Do not assume restraint has been discontinued or that the individual is stable unless documented.`;

const CROSS_REFERENCE_INSTRUCTIONS = `When the assessment indicates chemical medication administration, respiratory distress, hypoxia, seizure activity, emergency transfer, or altered mental status, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function restraintField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `CRISIS PHYSICAL RESTRAINT — INITIAL ASSESSMENT

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
- See eMAR for medication(s) administered (always reference eMAR — never fabricate medications administered).

Required assessment (document only what is provided):
- Individual's cooperation or lack of cooperation during the assessment

ASSESSMENT:
Crisis Physical Restraint

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Perform the initial nursing assessment immediately or within 30 minutes of restraint initiation (monitoring requirement — preserve exactly).
- Continue nursing assessment every 30 minutes while the restraint remains in progress (monitoring requirement — preserve exactly).
- After release from the restraint, continue nursing assessment every 30 minutes until the nurse determines the individual is stable (monitoring requirement — preserve exactly).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify the PCP of abnormal findings or complications (only if criteria met and notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

${MONITORING_REQUIREMENT}

Never assume the individual was cooperative. Never fabricate abnormal findings or complications. Never invent PCP orders.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `CRISIS PHYSICAL RESTRAINT — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any new concerns reported by staff or the individual following restraint.
- If the individual cannot participate in the assessment, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.
- See eMAR for medication(s) administered (always reference eMAR — never fabricate medications administered).

Required assessment (document only what is provided):
- Individual's cooperation or lack of cooperation during the assessment

ASSESSMENT:
Crisis Physical Restraint

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Continue nursing assessment immediately or within 30 minutes of restraint initiation as applicable (only if reported — preserve timing exactly).
- Continue nursing assessment every 30 minutes while the restraint remains in progress (monitoring requirement — preserve exactly).
- After release from the restraint, continue nursing assessment every 30 minutes until the nurse determines the individual is stable (monitoring requirement — preserve exactly).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify the PCP of abnormal findings or complications (only if criteria met and notification occurred or is explicitly indicated).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume restraint has been discontinued unless documented. Never assume the individual is stable unless documented.`;

export const CRISIS_PHYSICAL_RESTRAINT_GUIDELINE: GuidelineDefinition = {
  id: 'crisis_physical_restraint',
  displayName: 'Crisis Physical Restraint',
  description:
    'Crisis Physical Restraint facility guideline. Document cooperation status, eMAR medications, nursing interventions, initial assessment timing, every-30-minute monitoring during restraint and after release until stable, PCP notification, handoff, and staff education. Cross-reference Medical/Dental Chemical Sedation, Respiratory Distress/Aspiration, Seizure Activity, and Transfer Out when complications develop.',

  assessment: {
    requiredFields: [
      restraintField(
        "Individual's cooperation or lack of cooperation during the assessment",
        COOPERATION_KEYWORDS,
      ),
    ],
    optionalFields: [
      fieldFromLabel('eMAR medication documentation', {
        matchKeywords: EMAR_MEDICATION_KEYWORDS,
        description: 'Reference eMAR for medications administered during crisis restraint.',
      }),
    ],
  },

  missingInformationChecklist: [
    restraintField('Individual cooperation status', COOPERATION_KEYWORDS),
    restraintField('eMAR medication documentation', EMAR_MEDICATION_KEYWORDS, false),
    restraintField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    restraintField('Initial assessment timing', INITIAL_ASSESSMENT_TIMING_KEYWORDS, false),
    restraintField('Every-30-minute monitoring during restraint', MONITORING_DURING_RESTRAINT_KEYWORDS, false),
    restraintField('Every-30-minute monitoring after release until stable', POST_RELEASE_MONITORING_KEYWORDS, false),
    restraintField('PCP notification (when indicated)', PCP_NOTIFICATION_KEYWORDS, false),
    restraintField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    restraintField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    restraintField('Ongoing every-30-minute monitoring', ONGOING_MONITORING_KEYWORDS, false),
    restraintField('Post-release monitoring until stable', POST_RELEASE_MONITORING_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'post_sedation',
        triggerKeywords: [
          'chemical medication', 'chemical sedation', 'medication administered', 'prn medication',
          'haloperidol', 'ativan', 'lorazepam', 'benadryl', 'sedation medication',
        ],
      },
      {
        guidelineId: 'respiratory',
        triggerKeywords: [
          'respiratory distress', 'respiratory depression', 'hypoxia', 'desaturation',
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
      instructions: `RESOLUTION ASSESSMENT — Crisis Physical Restraint

Use when restraint has been discontinued and the nurse has determined the individual is stable as documented.
Document guideline closure only when input supports completion of post-release monitoring and stability determination.
Do not assume the individual is stable or that restraint has been discontinued unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Crisis Physical Restraint

SUBJECTIVE: crisis event concerns or observations reported by staff; cooperation status if reported — do not assume cooperation.
OBJECTIVE: Interactive View Assessment; eMAR medication reference — only if provided. Never fabricate medications or abnormal findings.
ASSESSMENT: Crisis Physical Restraint
PLAN: initial/timed assessments, every-30-minute monitoring during restraint and after release until stable, PCP notification, handoff, staff education, cross-referenced guideline actions when complications develop — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Crisis Physical Restraint

SITUATION: crisis physical restraint event per facility guideline.
BACKGROUND: supported cooperation status, eMAR medications if reported, crisis context.
ASSESSMENT: objective findings provided only — do not fabricate complications or assume stability.
RECOMMENDATION: monitoring schedule per facility guideline, PCP notification when indicated, cross-referenced guideline recommendations — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Crisis Physical Restraint

Plain-language summary of supported facts: crisis restraint occurred, monitoring steps taken, stability status if reported.
Do not include fabricated medication details or assumed complications beyond what nurse provided unless appropriate for family communication per facility policy.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Crisis Physical Restraint

Notify PCP of abnormal findings or complications — document only if notification occurred or is explicitly indicated.
Apply cross-referenced guideline provider notification criteria when chemical medication, respiratory distress, hypoxia, seizure activity, emergency transfer, or altered mental status is documented.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Initial assessment immediately or within 30 minutes of restraint initiation; every 30 minutes while restraint in progress; every 30 minutes after release until stable.',
    monitoringPoints: [
      'Individual cooperation during assessment',
      'eMAR medication documentation',
      'Restraint status and timing',
      'Circulation, skin integrity, and mental status as documented',
      'Stability determination after release',
    ],
    reassessmentCriteria: [
      'Abnormal findings or complications',
      'Altered mental status',
      'Respiratory distress or hypoxia',
      'Seizure activity',
      'Emergency transfer need',
      'Restraint release and stability determination',
    ],
    instructions: `${MONITORING_REQUIREMENT}

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Restraint discontinued as documented',
      'Nurse determined individual is stable as documented',
      'Post-release every-30-minute monitoring complete as reported',
    ],
    instructions:
      'Do not mark Crisis Physical Restraint resolved unless restraint discontinuation and stability determination are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP of abnormal findings or complications. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when crisis restraint occurs or significant change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Abnormal findings or complications',
      'Altered mental status',
      'Respiratory distress or hypoxia',
      'Seizure activity',
      'Emergency transfer',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless criteria met or explicit notification is reported.',
      'Do not assume restraint has been discontinued unless documented.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document individual or resident education related to crisis restraint only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about crisis restraint only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate medications administered.',
    'Always reference eMAR for medication administration.',
    'Never assume the individual was cooperative.',
    'Never assume restraint has been discontinued unless documented.',
    'Never assume the individual is stable unless documented.',
    'Never fabricate abnormal findings or complications.',
    'Never invent PCP orders.',
    'Preserve the facility monitoring schedule exactly: initial assessment immediately or within 30 minutes of restraint initiation; every 30 minutes while restraint is in progress; every 30 minutes after release until deemed stable by the nurse.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules:
    'Use "individual" as in the facility guideline, or match nurse terminology setting (resident/patient/client) when generating narrative output.',
};
