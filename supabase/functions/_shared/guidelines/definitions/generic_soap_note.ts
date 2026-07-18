import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const ASSESSMENT_TYPE_KEYWORDS = [
  'initial assessment', 'follow-up assessment', 'follow up assessment', 'resolution assessment',
  'initial evaluation', 'follow-up', 'follow up', 'resolved', 'resolution', 'closing assessment',
];

const ASSESSMENT_TIME_KEYWORDS = [
  'assessed at', 'assessment time', 'time assessed', 'assessment at', 'evaluated at',
  'am', 'pm', 'hours', '0700', '0800', '0900', '1000', '1100', '1200', '1300', '1400',
];

const ADDITIONAL_FINDINGS_KEYWORDS = [
  'additional assessment', 'additional findings', 'assessment findings', 'vital signs',
  'blood pressure', 'heart rate', 'respiratory rate', 'temperature', 'spo2', 'observed findings',
  'physical assessment', 'objective findings',
];

const ASSESSMENT_STATEMENT_KEYWORDS = [
  'assessment statement', 'clinical assessment', 'nursing assessment', 'nursing diagnosis',
  'nurse assessment', 'assessment:', 'impression', 'evaluation findings',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed',
];

const GUIDELINE_FOLLOWED_KEYWORDS = [
  'facility guideline', 'appropriate guideline', 'following guideline', 'guideline followed',
  'pain guideline', 'fall guideline', 'vomiting guideline', 'per facility guideline',
  'follow the facility', 'followed protocol',
];

const STAFF_INSTRUCTION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'staff instruction', 'instructions provided', 'education provided', 'instructed staff',
];

const CROSS_REFERENCE_INSTRUCTIONS = `When sufficient clinical information is available, recommend using the corresponding facility guideline. Related guidelines should only improve missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate additional notes. Do not assume a related guideline applies unless the documented assessment supports it.`;

function genericSoapField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const SHARED_ASSESSMENT_TEMPLATE = `GENERIC SOAP NOTE — INITIAL / FOLLOW-UP / RESOLUTION

Complete this facility form exactly. Do NOT convert to paragraph form or bullet lists.
Preserve every colon-ended prompt below in the output, in this order, even when information is missing.

S:

O:
See Interactive View Assessment.
Assessed at:
Additional findings:

A:

P:
Nursing interventions completed:
Appropriate guideline followed (when applicable):
Staff verbalized or demonstrated understanding of instructions provided:

FORM RULES:
- Leave any unsupported prompt label in place; do not delete or omit it.
- Fill colon-ended prompts only with supported user-provided information.
- Do not collapse prompts into one paragraph.
- Never fabricate subjective complaints, objective findings, diagnoses, interventions, provider orders, or medications.`;

const INITIAL_TYPE_BEHAVIOR = `ASSESSMENT TYPE — INITIAL:
- Document the initial evaluation.
- Document baseline findings when available (only if reported).`;

const FOLLOW_UP_TYPE_BEHAVIOR = `ASSESSMENT TYPE — FOLLOW-UP:
- Document changes since the previous assessment (only if reported).
- Document response to nursing interventions when available (only if reported).
- Do not assume improvement or deterioration.`;

const RESOLUTION_TYPE_BEHAVIOR = `ASSESSMENT TYPE — RESOLUTION:
- Document resolution only when explicitly documented by the nurse.
- Never assume the issue has resolved.`;

const INITIAL_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${INITIAL_TYPE_BEHAVIOR}`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${FOLLOW_UP_TYPE_BEHAVIOR}`;

const RESOLUTION_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${RESOLUTION_TYPE_BEHAVIOR}`;

export const GENERIC_SOAP_NOTE_GUIDELINE: GuidelineDefinition = {
  id: 'other',
  displayName: 'Generic SOAP Note',
  description:
    'Generic SOAP Note facility guideline using one shared template for Initial, Follow-up, and Resolution assessments. Document assessment time, additional findings, clinical assessment statement, nursing interventions, appropriate facility guidelines when applicable, and staff instruction/education. Cross-reference condition-specific guidelines only when documented assessment supports the association.',

  assessment: {
    requiredFields: [
      genericSoapField('Assessment time ("Assessed at")', ASSESSMENT_TIME_KEYWORDS),
      genericSoapField('Additional assessment findings', ADDITIONAL_FINDINGS_KEYWORDS),
    ],
    optionalFields: [],
  },

  missingInformationChecklist: [
    genericSoapField('Assessment type', ASSESSMENT_TYPE_KEYWORDS, false),
    genericSoapField('Assessment time', ASSESSMENT_TIME_KEYWORDS, false),
    genericSoapField('Additional assessment findings', ADDITIONAL_FINDINGS_KEYWORDS),
    genericSoapField('Assessment statement', ASSESSMENT_STATEMENT_KEYWORDS, false),
    genericSoapField('Nursing interventions completed', NURSING_INTERVENTIONS_KEYWORDS, false),
    genericSoapField('Appropriate guideline followed (when applicable)', GUIDELINE_FOLLOWED_KEYWORDS, false),
    genericSoapField('Staff instruction/education documentation', STAFF_INSTRUCTION_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      { guidelineId: 'pain', triggerKeywords: ['pain', 'analgesic', 'pain score', 'tylenol', 'morphine', '/10'] },
      { guidelineId: 'vomiting', triggerKeywords: ['vomiting', 'emesis', 'vomited', 'nausea with vomiting'] },
      { guidelineId: 'diarrhea', triggerKeywords: ['diarrhea', 'loose stool', 'watery stool', 'frequent stool'] },
      { guidelineId: 'constipation', triggerKeywords: ['constipation', 'no bowel movement', 'no bm', 'hard stool'] },
      { guidelineId: 'uti', triggerKeywords: ['uti', 'urinary tract', 'dysuria', 'burning urination', 'cloudy urine'] },
      { guidelineId: 'elevated_temperature', triggerKeywords: ['fever', 'elevated temperature', 'febrile', 'temp elevated', 'hyperthermia'] },
      { guidelineId: 'head_injury', triggerKeywords: ['head injury', 'head trauma', 'struck head', 'scalp injury'] },
      { guidelineId: 'fall', triggerKeywords: ['fall', 'fell', 'found on floor', 'suspected fall'] },
      { guidelineId: 'respiratory', triggerKeywords: ['respiratory distress', 'shortness of breath', 'dyspnea', 'aspiration', 'hypoxia'] },
      { guidelineId: 'seizure', triggerKeywords: ['seizure', 'seizure activity', 'convulsion', 'witnessed seizure'] },
      { guidelineId: 'skin_impairment', triggerKeywords: ['skin impairment', 'wound', 'pressure injury', 'ulcer', 'skin breakdown'] },
      { guidelineId: 'medication_change', triggerKeywords: ['medication change', 'new medication', 'discontinued medication', 'dose change'] },
      {
        guidelineId: 'transfer_out_back',
        triggerKeywords: ['transfer out', 'transfer back', 'transfer to er', 'emergency transfer', 'returned from er'],
      },
      {
        guidelineId: 'crisis_physical_restraint',
        triggerKeywords: ['crisis physical restraint', 'physical restraint', 'manual hold', 'staff hold'],
      },
      {
        guidelineId: 'crisis_mechanical_restraint',
        triggerKeywords: ['crisis mechanical restraint', 'mechanical restraint', 'crisis intervention restraint'],
      },
      {
        guidelineId: 'crisis_chemical_restraint',
        triggerKeywords: ['crisis chemical restraint', 'chemical restraint', 'prn restraint medication'],
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
      instructions: `SOAP NOTE — Generic SOAP Note

Output a completed facility form — not narrative SOAP prose.

Preserve this exact form structure and prompt order. Leave every colon-ended prompt visible even when blank:

S:

O:
See Interactive View Assessment.
Assessed at:
Additional findings:

A:

P:
Nursing interventions completed:
Appropriate guideline followed (when applicable):
Staff verbalized or demonstrated understanding of instructions provided:

Preserve Initial, Follow-up, or Resolution assessment type in section A using the facility assessment label when supported.
Fill prompts only with information from the current input. Never remove prompts because information is missing.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Generic SOAP Note

SITUATION: clinical assessment per generic SOAP template (initial, follow-up, or resolution as selected).
BACKGROUND: supported assessment time, additional findings, and subjective report if provided.
ASSESSMENT: nurse-provided clinical assessment only — do not diagnose or assume change in condition.
RECOMMENDATION: interventions and appropriate facility guidelines when applicable — only if supported; cross-reference condition-specific guidelines only when documented assessment supports them.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Generic SOAP Note

Plain-language summary of supported facts from the assessment. Do not invent diagnoses, medications, or outcomes beyond what nurse provided.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Generic SOAP Note

Document provider notification only if explicitly reported or required by a cross-referenced facility guideline supported by documented assessment. Do not assume notification occurred.`,
    },
  },

  followUpRequirements: {
    frequency: 'Follow appropriate facility guideline(s) for follow-up when applicable; otherwise document follow-up per nurse report.',
    monitoringPoints: [
      'Assessment time and additional findings',
      'Clinical assessment statement',
      'Response to interventions at follow-up',
      'Appropriate facility guideline adherence',
    ],
    reassessmentCriteria: [
      'Change in condition since prior assessment',
      'Worsening symptoms or findings',
      'Need for condition-specific facility guideline',
      'Emergency transfer need',
    ],
    instructions: `Use the same SOAP documentation structure for Initial, Follow-up, and Resolution assessments. Document only information actually provided by the nurse.

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Resolution explicitly documented by the nurse',
      'Issue resolved or monitoring complete as reported',
      'No ongoing concerns requiring continued assessment as documented',
    ],
    instructions:
      'Do not mark the assessment resolved unless resolution is explicitly documented by the nurse. Never assume the issue has resolved.',
  },

  notificationRules: {
    providerNotification:
      'Document provider notification only when explicitly reported or when a supported cross-referenced facility guideline indicates notification occurred or is indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Declining condition',
      'Emergency transfer',
      'Significant change in assessment findings',
      'Criteria met per cross-referenced facility guideline',
    ],
    prohibitedAutoNotifications: [
      'Do not document provider notification unless explicitly reported or supported by applicable facility guideline criteria.',
      'Do not assume a related guideline applies without documented assessment support.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document individual or resident education only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate subjective complaints.',
    'Never fabricate objective findings.',
    'Never invent diagnoses.',
    'Never assume improvement.',
    'Never assume deterioration.',
    'Never assume resolution.',
    'Never fabricate nursing interventions.',
    'Never invent provider orders.',
    'Never invent medications.',
    'Never infer laboratory or diagnostic results.',
    'Document only information actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules:
    'Use "individual" as in the facility guideline, or match nurse terminology setting (resident/patient/client) when generating narrative output.',
};
