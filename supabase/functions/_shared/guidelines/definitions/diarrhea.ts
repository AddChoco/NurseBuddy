import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const ASSESSMENT_TYPE_KEYWORDS = [
  'initial assessment', 'follow-up assessment', 'follow up assessment', 'resolution assessment',
  'initial diarrhea', 'follow-up diarrhea', 'follow up diarrhea', 'diarrhea resolved',
  'resolved', 'resolution', 'closing assessment', 'follow-up', 'follow up',
];

const INTAKE_OUTPUT_24H_KEYWORDS = [
  'intake and output', 'i&o', 'i and o', 'past 24 hours', '24 hours', '24 hr',
  'fluid intake', 'oral intake', 'urine output', 'stool output', 'output for the past',
  'intake/output', 'daily i&o', 'recorded intake', 'recorded output',
];

const ANTI_DIARRHEAL_EFFECTIVENESS_KEYWORDS = [
  'anti-diarrheal', 'antidiarrheal', 'anti diarrheal', 'loperamide', 'imodium',
  'kaopectate', 'pepto', 'bismuth', 'diphenoxylate', 'lomotil', 'medication effective',
  'effectiveness of anti-diarrheal', 'effective', 'ineffective', 'no improvement',
  'administered', 'not administered', 'medication given', 'response to medication',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'stool monitoring', 'skin care',
];

const DEHYDRATION_PREVENTION_KEYWORDS = [
  'dehydration prevention', 'prevent dehydration', 'hydration', 'encourage fluids',
  'oral rehydration', 'fluid replacement', 'increased fluids', 'strategies implemented',
  'electrolyte', 'pedialyte', 'monitor for dehydration', 'fluid intake encouraged',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const CROSS_REFERENCE_INSTRUCTIONS = `When the assessment indicates vomiting, abdominal distention, enteral feeding intolerance, hypoglycemia related to poor intake, or emergency transfer, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function diarrheaField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const SHARED_ASSESSMENT_TEMPLATE = `DIARRHEA — INITIAL / FOLLOW-UP / RESOLUTION ASSESSMENT

This facility guideline uses a single documentation template for Initial, Follow-up, and Resolution assessments. Maintain the same documentation structure regardless of assessment type selected.

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms or concerns reported by the resident or staff related to diarrhea.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Assessment of intake and output for the past 24 hours (never fabricate intake or output values)
- Effectiveness of anti-diarrheal medication, if administered (only if reported — do not assume medication was administered or effective)

ASSESSMENT:
Diarrhea

PLAN (include only supported elements):
- Document nursing interventions completed (only if reported).
- Document strategies implemented to prevent dehydration (only if reported — never invent signs of dehydration).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never diagnose infectious diarrhea, gastroenteritis, C. difficile infection, or other gastrointestinal diseases. Never fabricate stool frequency, consistency, or characteristics.`;

const INITIAL_TYPE_BEHAVIOR = `ASSESSMENT TYPE — INITIAL:
- Document the initial diarrhea assessment.
- Document interventions initiated (only if reported).`;

const FOLLOW_UP_TYPE_BEHAVIOR = `ASSESSMENT TYPE — FOLLOW-UP:
- Document current diarrhea status (only if reported).
- Document response to interventions and anti-diarrheal medication when available (only if reported — never assume medication was effective).`;

const RESOLUTION_TYPE_BEHAVIOR = `ASSESSMENT TYPE — RESOLUTION:
- Document that diarrhea has resolved ONLY if explicitly documented by the nurse.
- Never assume resolution.`;

const INITIAL_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${INITIAL_TYPE_BEHAVIOR}`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${FOLLOW_UP_TYPE_BEHAVIOR}`;

const RESOLUTION_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${RESOLUTION_TYPE_BEHAVIOR}`;

export const DIARRHEA_GUIDELINE: GuidelineDefinition = {
  id: 'diarrhea',
  displayName: 'Diarrhea',
  description:
    'Diarrhea facility guideline using a single template for Initial, Follow-up, and Resolution assessments. Document 24-hour intake/output, anti-diarrheal medication effectiveness when administered, nursing interventions, dehydration prevention strategies, and staff education. Cross-reference Vomiting, Abdominal Distention/Pain, Enteral Feeding Tolerance, Hypoglycemia, and Transfer Out when complications develop.',

  assessment: {
    requiredFields: [
      diarrheaField(
        'Assessment of intake and output for the past 24 hours',
        INTAKE_OUTPUT_24H_KEYWORDS,
      ),
      diarrheaField(
        'Effectiveness of anti-diarrheal medication, if administered',
        ANTI_DIARRHEAL_EFFECTIVENESS_KEYWORDS,
        false,
      ),
    ],
    optionalFields: [],
  },

  missingInformationChecklist: [
    diarrheaField('Assessment type', ASSESSMENT_TYPE_KEYWORDS, false),
    diarrheaField(
      'Intake and output assessment for the past 24 hours',
      INTAKE_OUTPUT_24H_KEYWORDS,
    ),
    diarrheaField(
      'Effectiveness of anti-diarrheal medication (if administered)',
      ANTI_DIARRHEAL_EFFECTIVENESS_KEYWORDS,
      false,
    ),
    diarrheaField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    diarrheaField('Dehydration prevention strategies', DEHYDRATION_PREVENTION_KEYWORDS, false),
    diarrheaField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'vomiting',
        triggerKeywords: [
          'vomiting', 'emesis', 'vomited', 'nausea with vomiting', 'throwing up',
        ],
      },
      {
        guidelineId: 'abdominal_distention_pain',
        triggerKeywords: [
          'abdominal distention', 'distended abdomen', 'abdominal distension', 'distension',
          'abdominal pain', 'severe abdominal', 'firm abdomen',
        ],
      },
      {
        guidelineId: 'enteral_feeding_tolerance',
        triggerKeywords: [
          'enteral feeding intolerance', 'feeding intolerance', 'tube feed intolerance',
          'g-tube feeding', 'gtube feeding', 'tube feeding problem', 'residual',
        ],
      },
      {
        guidelineId: 'hypoglycemia',
        triggerKeywords: [
          'hypoglycemia', 'low blood sugar', 'poor intake', 'decreased intake',
          'blood glucose low', 'bg low', 'glucose low', 'related to poor intake',
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
      instructions: RESOLUTION_ASSESSMENT_INSTRUCTIONS,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Diarrhea

Output a completed facility form — not narrative SOAP prose.

Preserve this exact form structure and prompt order. Leave every colon-ended prompt visible even when blank:

SUBJECTIVE:

OBJECTIVE:
See Interactive View Assessment.
Assessment of intake and output for the past 24 hours:
Effectiveness of anti-diarrheal medication, if administered:

ASSESSMENT:
Diarrhea

PLAN:
Nursing interventions completed:
Strategies implemented to prevent dehydration:
Staff verbalized or demonstrated understanding of instructions provided:

Apply Initial, Follow-up, or Resolution assessment type behavior from the facility form template when supported.
Never fabricate stool characteristics, I&O values, or dehydration signs.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Diarrhea

SITUATION: diarrhea assessment per facility guideline (initial, follow-up, or resolution as selected).
BACKGROUND: supported 24-hour intake/output, anti-diarrheal medication effectiveness if reported.
ASSESSMENT: objective findings provided only — do not diagnose infectious diarrhea or assume resolution.
RECOMMENDATION: interventions and dehydration prevention per facility guideline; cross-referenced guideline recommendations when complications develop — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Diarrhea

Plain-language summary of supported facts: resident diarrhea status, interventions taken, dehydration prevention steps if reported.
Do not diagnose gastrointestinal diseases or assume resolution beyond what nurse provided.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Diarrhea

Document provider notification only if abnormal findings, complications, or explicit notification is reported.
Apply cross-referenced guideline provider notification criteria when vomiting, abdominal distention, enteral feeding intolerance, hypoglycemia related to poor intake, or emergency transfer is documented.`,
    },
  },

  followUpRequirements: {
    frequency: 'Follow facility Diarrhea guideline for follow-up assessment and intervention monitoring as documented.',
    monitoringPoints: [
      'Intake and output for the past 24 hours',
      'Effectiveness of anti-diarrheal medication when administered',
      'Response to interventions',
      'Dehydration prevention strategies',
      'Diarrhea status at follow-up',
    ],
    reassessmentCriteria: [
      'No improvement in diarrhea status',
      'Vomiting',
      'Abdominal distention or pain',
      'Enteral feeding intolerance',
      'Hypoglycemia related to poor intake',
      'Emergency transfer need',
    ],
    instructions: `Use the same documentation structure for Initial, Follow-up, and Resolution assessments. Document only findings actually provided by the nurse.

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Diarrhea resolved as explicitly documented by the nurse',
      'Stool pattern returned to baseline as reported',
      'No ongoing complications requiring continued diarrhea monitoring as documented',
    ],
    instructions:
      'Do not mark Diarrhea resolved unless resolution is explicitly documented by the nurse. Never assume diarrhea has resolved.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP or provider for abnormal findings or complications only when criteria are met and notification occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant diarrhea change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Vomiting',
      'Abdominal distention or pain',
      'Enteral feeding intolerance',
      'Hypoglycemia related to poor intake',
      'Emergency transfer',
      'Worsening diarrhea despite intervention',
    ],
    prohibitedAutoNotifications: [
      'Do not document provider notification unless criteria met or explicit notification is reported.',
      'Do not assume an anti-diarrheal medication was administered.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident diarrhea or hydration education only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about diarrhea monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never diagnose infectious diarrhea, gastroenteritis, C. difficile infection, or other gastrointestinal diseases.',
    'Never fabricate stool frequency, consistency, or characteristics.',
    'Never assume an anti-diarrheal medication was administered.',
    'Never assume medication was effective.',
    'Never assume diarrhea has resolved.',
    'Never fabricate intake or output values.',
    'Never invent signs of dehydration.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
