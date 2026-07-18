import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const ASSESSMENT_TYPE_KEYWORDS = [
  'initial assessment', 'follow-up assessment', 'follow up assessment', 'resolution assessment',
  'initial constipation', 'follow-up constipation', 'follow up constipation', 'constipation resolved',
  'resolved', 'resolution', 'closing assessment', 'follow-up', 'follow up',
];

const ADDITIONAL_ASSESSMENT_FINDINGS_KEYWORDS = [
  'additional assessment', 'assessment findings', 'abdominal', 'abdomen', 'soft', 'distended',
  'bowel sounds', 'last bm', 'last bowel movement', 'no bm', 'hard stool', 'straining',
  'abdominal exam', 'guarding', 'tenderness', 'no tenderness', 'observed findings',
];

const SUPPOSITORY_MEDICATION_RESULTS_KEYWORDS = [
  'suppository', 'dulcolax', 'bisacodyl', 'enema', 'fleet', 'miralax', 'polyethylene glycol',
  'senna', 'colace', 'docusate', 'lactulose', 'constipation medication', 'laxative',
  'medication result', 'effective', 'no result', 'administered', 'not administered',
  'no suppository', 'medication given', 'response to medication', 'no bowel movement after',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'fluid', 'hydration', 'positioning',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const CROSS_REFERENCE_INSTRUCTIONS = `When the assessment indicates abdominal distention, vomiting, enteral feeding intolerance, or emergency transfer, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

function constipationField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const SHARED_ASSESSMENT_TEMPLATE = `CONSTIPATION — INITIAL / FOLLOW-UP / RESOLUTION ASSESSMENT

This facility guideline uses a single documentation template for Initial, Follow-up, and Resolution assessments. Maintain the same documentation structure regardless of assessment type selected.

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms or concerns reported by the resident or staff related to constipation.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Additional assessment findings
- Results of suppository and/or constipation medication, if administered (only if reported — do not assume a suppository or medication was administered or effective)

ASSESSMENT:
Constipation

PLAN (include only supported elements):
- Document nursing interventions completed (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never diagnose bowel obstruction, ileus, fecal impaction, or other gastrointestinal conditions. Never fabricate bowel movements or abdominal findings.`;

const INITIAL_TYPE_BEHAVIOR = `ASSESSMENT TYPE — INITIAL:
- Document the initial constipation assessment.
- Document interventions initiated (only if reported).`;

const FOLLOW_UP_TYPE_BEHAVIOR = `ASSESSMENT TYPE — FOLLOW-UP:
- Document current constipation status (only if reported).
- Document response to interventions and medication when available (only if reported — never assume medication was effective).`;

const RESOLUTION_TYPE_BEHAVIOR = `ASSESSMENT TYPE — RESOLUTION:
- Document that constipation has resolved ONLY if explicitly documented by the nurse.
- Never assume resolution.`;

const INITIAL_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${INITIAL_TYPE_BEHAVIOR}`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${FOLLOW_UP_TYPE_BEHAVIOR}`;

const RESOLUTION_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${RESOLUTION_TYPE_BEHAVIOR}`;

export const CONSTIPATION_GUIDELINE: GuidelineDefinition = {
  id: 'constipation',
  displayName: 'Constipation',
  description:
    'Constipation facility guideline using a single template for Initial, Follow-up, and Resolution assessments. Document additional assessment findings, suppository/constipation medication results when administered, nursing interventions, and staff education. Cross-reference Abdominal Distention/Pain, Vomiting, Enteral Feeding Tolerance, and Transfer Out when complications develop.',

  assessment: {
    requiredFields: [
      constipationField('Additional assessment findings', ADDITIONAL_ASSESSMENT_FINDINGS_KEYWORDS),
      constipationField(
        'Results of suppository and/or constipation medication, if administered',
        SUPPOSITORY_MEDICATION_RESULTS_KEYWORDS,
        false,
      ),
    ],
    optionalFields: [],
  },

  missingInformationChecklist: [
    constipationField('Assessment type', ASSESSMENT_TYPE_KEYWORDS, false),
    constipationField('Additional assessment findings', ADDITIONAL_ASSESSMENT_FINDINGS_KEYWORDS),
    constipationField(
      'Results of suppository or constipation medication (if administered)',
      SUPPOSITORY_MEDICATION_RESULTS_KEYWORDS,
      false,
    ),
    constipationField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    constipationField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'abdominal_distention_pain',
        triggerKeywords: [
          'abdominal distention', 'distended abdomen', 'abdominal distension', 'distension',
          'abdominal pain', 'severe abdominal', 'firm abdomen',
        ],
      },
      {
        guidelineId: 'vomiting',
        triggerKeywords: [
          'vomiting', 'emesis', 'vomited', 'nausea with vomiting', 'throwing up',
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
      instructions: `SOAP NOTE — Constipation

Output a completed facility form — not narrative SOAP prose.

Preserve this exact form structure and prompt order. Leave every colon-ended prompt visible even when blank:

SUBJECTIVE:

OBJECTIVE:
See Interactive View Assessment.
Additional assessment findings:
Results of suppository and/or constipation medication, if administered:

ASSESSMENT:
Constipation

PLAN:
Nursing interventions completed:
Staff verbalized or demonstrated understanding of instructions provided:

Apply Initial, Follow-up, or Resolution assessment type behavior from the facility form template when supported.
Never fabricate bowel movements or abdominal findings.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Constipation

SITUATION: constipation assessment per facility guideline (initial, follow-up, or resolution as selected).
BACKGROUND: supported additional assessment findings, medication/suppository results if reported.
ASSESSMENT: objective findings provided only — do not diagnose obstruction, impaction, or assume resolution.
RECOMMENDATION: interventions and monitoring per facility guideline; cross-referenced guideline recommendations when complications develop — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Constipation

Plain-language summary of supported facts: resident constipation status, interventions taken, follow-up plan if reported.
Do not diagnose gastrointestinal conditions or assume resolution beyond what nurse provided.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Constipation

Document provider notification only if abnormal findings, complications, or explicit notification is reported.
Apply cross-referenced guideline provider notification criteria when abdominal distention, vomiting, enteral feeding intolerance, or emergency transfer is documented.`,
    },
  },

  followUpRequirements: {
    frequency: 'Follow facility Constipation guideline for follow-up assessment and intervention monitoring as documented.',
    monitoringPoints: [
      'Additional assessment findings',
      'Results of suppository or constipation medication when administered',
      'Response to interventions',
      'Constipation status at follow-up',
    ],
    reassessmentCriteria: [
      'No improvement in constipation status',
      'Abdominal distention or pain',
      'Vomiting',
      'Enteral feeding intolerance',
      'Emergency transfer need',
    ],
    instructions: `Use the same documentation structure for Initial, Follow-up, and Resolution assessments. Document only findings actually provided by the nurse.

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Constipation resolved as explicitly documented by the nurse',
      'Bowel movement or constipation status improvement as reported',
      'No ongoing complications requiring continued constipation monitoring as documented',
    ],
    instructions:
      'Do not mark Constipation resolved unless resolution is explicitly documented by the nurse. Never assume constipation has resolved.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP or provider for abnormal findings or complications only when criteria are met and notification occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant constipation change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Abdominal distention or pain',
      'Vomiting',
      'Enteral feeding intolerance',
      'Emergency transfer',
      'Worsening constipation despite intervention',
    ],
    prohibitedAutoNotifications: [
      'Do not document provider notification unless criteria met or explicit notification is reported.',
      'Do not assume a suppository or medication was administered.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident constipation or bowel management education only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about constipation monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never diagnose bowel obstruction, ileus, fecal impaction, or other gastrointestinal conditions.',
    'Never fabricate bowel movements.',
    'Never assume a suppository or medication was administered.',
    'Never assume medication was effective.',
    'Never assume constipation has resolved.',
    'Never fabricate abdominal findings.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
