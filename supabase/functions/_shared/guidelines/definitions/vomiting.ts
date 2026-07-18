import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const VOMITUS_KEYWORDS = [
  'vomit', 'vomitus', 'vomiting', 'emesis', 'threw up', 'throwing up', 'episode',
  'ml', 'cc', 'green', 'yellow', 'brown', 'clear', 'bloody', 'coffee ground',
  '구토', 'vómito', 'vómitos', 'description of vomit',
];

const ENTERAL_FEEDING_KEYWORDS = [
  'enteral', 'feeding rate', 'feed rate', 'g-tube', 'gtube', 'g tube', 'tube feed',
  'tube feeding', 'ml/hr', 'ml/hour', 'ml per hour', 'jevity', 'osmolite',
];

const INTAKE_OUTPUT_KEYWORDS = [
  'intake', 'output', 'i&o', 'i and o', 'i/o', 'fluid balance', 'urine output',
  'void', '입력', '출력', 'balance hídrico',
];

const NAUSEA_KEYWORDS = [
  'nausea', 'nauseous', 'no nausea', 'absence of nausea', 'without nausea',
  '구역', '메스꺼', 'náusea', 'sin náusea',
];

const POSITIONING_KEYWORDS = [
  'position', 'positioning', 'pnmp', 'elevated', 'fowler', 'semi-fowler',
  'side lying', 'lateral', 'upright', 'head of bed', 'hob',
];

const VOMITING_SOURCE_KEYWORDS = [
  'source', 'cause', 'identified', 'etiology', 'reason for vomiting', 'trigger',
];

const GASTRIC_BLEEDING_KEYWORDS = [
  'gastric bleeding', 'gi bleed', 'blood in vomit', 'hematemesis', 'coffee ground',
  'bloody emesis', 'suspected bleeding', 'no bleeding', 'without blood',
];

const OTHER_FINDINGS_KEYWORDS = [
  'assessment', 'finding', 'findings', 'abdomen', 'vital', 'bp', 'temperature',
  'pulse', 'hydration', 'dehydration', 'residual', 'bowel', 'pain', 'comfort',
];

const LAST_EPISODE_KEYWORDS = [
  'last episode', 'last vomit', 'last vomiting', 'most recent', 'since last',
  'hours ago', 'no further', 'no additional emesis', 'resolved', 'symptom free',
];

function vomitingField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

export const VOMITING_GUIDELINE: GuidelineDefinition = {
  id: 'vomiting',
  displayName: 'Vomiting',
  description:
    'Facility vomiting guideline for enteral/oral feeding residents. Document emesis episodes, intake/output, nausea, positioning, and interventions. Monitor for 24 hours after symptom-free.',

  assessment: {
    requiredFields: [
      vomitingField('Date/Time/Description of Vomitus', VOMITUS_KEYWORDS),
      vomitingField('Enteral Feeding Rate', ENTERAL_FEEDING_KEYWORDS),
      vomitingField('Analysis of Intake and Output', INTAKE_OUTPUT_KEYWORDS),
      vomitingField('Presence or Absence of Nausea', NAUSEA_KEYWORDS),
      vomitingField('Positioning per PNMP', POSITIONING_KEYWORDS),
      vomitingField('Source of vomiting if identified', VOMITING_SOURCE_KEYWORDS, false),
      vomitingField('Gastric bleeding if suspected', GASTRIC_BLEEDING_KEYWORDS, false),
      vomitingField('Other relevant assessment findings', OTHER_FINDINGS_KEYWORDS, false),
    ],
    optionalFields: [
      fieldFromLabel('Last vomiting episode', {
        matchKeywords: LAST_EPISODE_KEYWORDS,
        description: 'Used for follow-up assessments.',
      }),
    ],
  },

  missingInformationChecklist: [
    vomitingField('Date/Time/Description of Vomitus', VOMITUS_KEYWORDS),
    vomitingField('Enteral Feeding Rate', ENTERAL_FEEDING_KEYWORDS),
    vomitingField('Analysis of Intake and Output', INTAKE_OUTPUT_KEYWORDS),
    vomitingField('Presence or Absence of Nausea', NAUSEA_KEYWORDS),
    vomitingField('Positioning per PNMP', POSITIONING_KEYWORDS),
    vomitingField('Source of vomiting if identified', VOMITING_SOURCE_KEYWORDS, false),
    vomitingField('Gastric bleeding if suspected', GASTRIC_BLEEDING_KEYWORDS, false),
    vomitingField('Other relevant assessment findings', OTHER_FINDINGS_KEYWORDS, false),
  ],

  documentation: {
    initialAssessment: {
      applicable: true,
      instructions: `INITIAL ASSESSMENT — Vomiting Guideline

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE — reported complaints, staff observations, and resident-reported symptoms only.

OBJECTIVE — document all supported required assessment items:
- Date/time/description of vomitus (amount, color, frequency) when reported
- Enteral feeding rate when applicable
- Intake and output analysis when reported
- Presence or absence of nausea
- Positioning per PNMP when reported
- Source of vomiting if identified
- Gastric bleeding if suspected or ruled out
- Other relevant assessment findings supported by input

ASSESSMENT — state: Vomiting

PLAN — two categories:

Category A — completed (narrative only):
- Nursing interventions completed (only if reported)
- Antiemetic effectiveness and side effects (only if assessed and reported)
- Comfort measures (only if reported)
- PCP notification (only if notification occurred or is explicitly reported)
- Hold enteral/oral feeding (only if reported)
- Staff verbalized understanding (only if reported)

Category B — prospective (mandatory from this guideline):
- Assess every shift for 24 hours after resident is symptom free
- Prevent dehydration through continued intake/output monitoring
- Nurse reassessment per vomiting guideline
- DSP/staff instructed to monitor for new emesis, nausea, dehydration, and gastric bleeding and immediately report changes
- Notify oncoming nurse when follow-up is needed
- Staff instructed regarding vomiting guideline monitoring and reporting requirements

Do not invent Category A completed actions, notifications, antiemetic response, or resolution status.`,
    },

    followUpAssessment: {
      applicable: true,
      instructions: `FOLLOW-UP ASSESSMENT — Vomiting Guideline

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

OBJECTIVE — document all supported required follow-up assessment items:
- Last vomiting episode (time/status)
- Enteral feeding rate
- Intake/output
- Presence or absence of nausea
- Positioning per PNMP
- Gastric bleeding if suspected or ruled out
- Source of vomiting if identified

ASSESSMENT — document vomiting status based on supported facts only (active, improved, resolved, unchanged — only if reported).

PLAN — two categories:

Category A — completed (narrative only):
- Nursing interventions completed (only if reported)
- Antiemetic effectiveness (only if assessed and reported)
- Vomiting resolved status (only if reported)
- Staff verbalized understanding (only if reported)

Category B — prospective (mandatory from this guideline):
- Nurse reassessment per vomiting guideline
- Assess every shift for 24 hours after resident is symptom free
- Continue monitoring intake/output, nausea, and emesis recurrence
- DSP/staff instructed to monitor for new vomiting, dehydration, and gastric bleeding and immediately report changes
- Notify oncoming nurse when follow-up is needed
- Staff instructed regarding vomiting guideline monitoring and reporting requirements

Do not assume vomiting is resolved unless explicitly reported. Do not invent Category A completed actions.`,
    },

    resolutionAssessment: {
      applicable: true,
      instructions: `RESOLUTION ASSESSMENT — Vomiting Guideline

Document guideline closure only when the input supports resolution.
Include:
- Last vomiting episode or confirmation resident is symptom free (only if reported)
- Duration of monitoring completed
- Intake/output and hydration status if reported
- Plan to assess every shift for 24 hours after symptom free (monitoring requirement)

Do not close the guideline or state resolution unless supported by the input.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Vomiting Guideline

Use headings: SUBJECTIVE, OBJECTIVE, ASSESSMENT, PLAN.

Map facility vomiting assessment content into SOAP:
- SUBJECTIVE: nausea complaints, reported symptoms, staff observations
- OBJECTIVE: date/time/description of vomitus, enteral feeding rate, intake/output, positioning per PNMP, source of vomiting, gastric bleeding concern, other supported findings
- ASSESSMENT: Vomiting (plus brief supported nursing interpretation — no new diagnoses)
- PLAN: Category A completed interventions and notifications from narrative only; Category B mandatory prospective monitoring, reassessment, staff instructions, follow-up, and handoff per facility vomiting plan elements above

Follow facility vomiting plan elements. Category B prospective plans are required even when not stated in the nurse narrative.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Vomiting Guideline

Use headings: SITUATION, BACKGROUND, ASSESSMENT, RECOMMENDATION.

SITUATION — resident with vomiting per guideline.
BACKGROUND — supported history including enteral feeding, recent emesis, intake/output if reported.
ASSESSMENT — objective vomiting-related findings from supported assessment items only.
RECOMMENDATION — next steps supported by input (PCP notification, continued monitoring, feeding adjustment, reassessment). Do not recommend provider contact unless input or facility trigger supports it.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Vomiting Guideline

Write a brief, family-friendly email in plain language.
Include only supported facts:
- That the resident had vomiting or nausea if reported
- Comfort measures or monitoring staff are providing
- Whether enteral/oral feeding was adjusted if reported
- That staff will continue to monitor

Do not include medical jargon, vitals, or details beyond what the nurse provided.
Do not state improvement, resolution, or antiemetic effectiveness unless explicitly reported.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Vomiting Guideline

Write concise clinical notification for the PCP/provider.
Include only supported information:
- Reason: vomiting guideline / emesis episode
- Date/time/description of vomitus if reported
- Intake/output and hydration concerns if reported
- Nausea status, enteral feeding rate, positioning per PNMP if reported
- Gastric bleeding suspicion if reported
- Interventions completed (antiemetic, feeding hold, comfort measures) if reported
- Request or notification purpose only if supported (e.g., dehydration concern, abnormal findings)

Notify PCP for dehydration or abnormal findings only when input supports notification or clinical concern was reported.`,
    },
  },

  followUpRequirements: {
    frequency: 'Assess every shift for 24 hours after resident is symptom free.',
    monitoringPoints: [
      'Last vomiting episode',
      'Enteral feeding rate',
      'Intake and output',
      'Nausea presence or absence',
      'Antiemetic effectiveness and side effects',
      'Signs of dehydration',
    ],
    reassessmentCriteria: [
      'Any new vomiting episode',
      'Worsening intake/output balance',
      'Suspected gastric bleeding',
      'Ineffective antiemetic or side effects reported',
    ],
    instructions:
      'Complete follow-up assessment with required fields. Document vomiting status and whether resident is symptom free. Notify oncoming nurse when follow-up is needed.',
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Resident symptom free from vomiting',
      'Continue shift assessments for 24 hours after symptom free',
      'Intake/output stable or improving as reported',
      'No suspected gastric bleeding',
    ],
    instructions:
      'Close the vomiting guideline only when the input supports that vomiting has resolved and monitoring requirements are met. Document last episode and ongoing 24-hour shift monitoring plan.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP for dehydration, abnormal findings, suspected gastric bleeding, or other concerns supported by the assessment. Do not document notification unless it occurred or is explicitly requested.',
    larGuardianNotification:
      'Notify LAR/guardian when significant change in condition is reported or per facility policy. Use plain language. Do not auto-notify unless input supports it.',
    triggers: [
      'Dehydration or abnormal intake/output',
      'Suspected gastric bleeding',
      'Repeated or worsening emesis',
      'Ineffective antiemetic or adverse side effects',
      'Abnormal assessment findings',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless dehydration, abnormal findings, or explicit notification is reported.',
      'Do not document LAR notification unless supported by input or facility policy trigger.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident education or comfort measures related to vomiting only if reported.',
    staffInstructions:
      'Staff verbalizes understanding of vomiting guideline instructions — document only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian education in plain language only if reported.',
  },

  prohibitedAssumptions: [
    'Do not assume antiemetic effectiveness or side effects unless reported.',
    'Do not assume vomiting is resolved or resident is symptom free unless reported.',
    'Do not assume dehydration or hydration status without intake/output or clinical evidence in the input.',
    'Do not assume gastric bleeding unless suspected or assessed in the input.',
    'Do not invent enteral feeding rate changes unless reported.',
    'Do not document PCP or LAR notification unless supported by the input.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
