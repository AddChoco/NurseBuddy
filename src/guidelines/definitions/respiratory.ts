import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const POSITIONING_KEYWORDS = [
  'positioning', 'position', 'positioned', 'upright', 'fowler', 'semi-fowler', 'side lying',
  'supine', 'prone', 'head of bed', 'hob', 'elevated', 'pnmp', 'repositioned',
];

const RESPIRATORY_SYMPTOMS_KEYWORDS = [
  'respiratory distress', 'shortness of breath', 'dyspnea', 'sob', 'labored breathing',
  'tachypnea', 'wheezing', 'crackles', 'rales', 'rhonchi', 'diminished breath sounds',
  'lung sounds', 'respiratory rate', 'breaths per minute', 'cough', 'coughing',
  'sputum', 'oxygen saturation', 'spo2', 'o2 sat', 'desaturation', 'hypoxia',
  'nasal cannula', 'room air', '호흡', 'respiratorio', 'dificultad respiratoria',
];

const ASPIRATION_SYMPTOMS_KEYWORDS = [
  'aspiration', 'choking', 'choked', 'during meal', 'during meals', 'while eating',
  'enteral feeding', 'tube feed', 'g-tube', 'gtube', 'medication administration',
  'vomiting', 'emesis', 'gagging', 'food in airway', 'swallow', 'dysphagia',
  'coughing during', 'wet voice', 'post-prandial',
];

const GASTRIC_RESIDUAL_KEYWORDS = [
  'gastric residual', 'residual', 'grv', 'gastric residual volume', 'tube feed residual',
  'ml residual', 'cc residual', 'aspirated residual', 'residual check',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'repositioned',
];

const TEMP_MONITORING_PLAN_KEYWORDS = [
  'temperature every 4 hours', 'q4 temp', 'q4h temp', 'every 4 hours for 48 hours',
  '48 hours without fever', 'temp monitoring', 'monitor temperature', 'afebrile',
  'fever monitoring', 'document temperature',
];

const SUCTIONING_KEYWORDS = [
  'suctioning', 'suction', 'suctioned', 'oral suction', 'tracheal suction',
  'yankauer', 'no suction', 'not suctioned', 'suction performed',
];

const OXYGEN_THERAPY_KEYWORDS = [
  'oxygen therapy', 'oxygen provided', 'o2 therapy', 'nasal cannula', 'nc ',
  'face mask', 'non-rebreather', 'high flow', 'liters', 'l/min', 'room air',
  'no oxygen', 'without oxygen', 'spo2',
];

const BREATHING_TREATMENT_KEYWORDS = [
  'breathing treatment', 'nebulizer', 'nebulized', 'albuterol', 'duoneb',
  'ipratropium', 'inhalation treatment', 'respiratory treatment', 'no breathing treatment',
  'not administered',
];

const RT_NOTIFICATION_KEYWORDS = [
  'respiratory therapy', 'rt notified', 'rt called', 'rt consult', 'respiratory therapist',
  'rt notification', 'notified rt', 'no rt', 'rt not notified',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'called',
  'abnormal findings', 'notify pcp', 'not notified', 'no notification',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const REASSESSMENT_RESPIRATORY_KEYWORDS = [
  ...RESPIRATORY_SYMPTOMS_KEYWORDS,
  'reassessment', 're-evaluation', 'continuing symptoms', 'new symptoms',
  'improved', 'worsening', 'unchanged', 'resolved',
];

const NEXT_NURSING_ASSESSMENT_KEYWORDS = [
  'next scheduled', 'next assessment', 'next nursing assessment', 'follow-up assessment',
  'reassess at', 'scheduled for', 'due at', 'next check',
];

function respiratoryField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `RESPIRATORY DISTRESS / ASPIRATION — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms reported by the resident or staff related to respiratory distress or aspiration.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Individual's positioning
- Relevant symptoms (including coughing during meals, enteral feedings, medication administration, vomiting, choking, respiratory distress, etc.)
- Analysis of gastric residuals (when applicable)

ASSESSMENT:
Respiratory Distress / Aspiration

Do NOT diagnose aspiration pneumonia or respiratory failure.

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Notify PCP of abnormal findings noted during assessment (only if notification occurred or is explicitly indicated).
- Assess and document temperature every 4 hours for 48 hours without fever, according to facility guideline (monitoring requirement — do not invent completion).
- Suctioning performed (if applicable — only if reported).
- Oxygen therapy provided (if applicable — only if reported).
- Breathing treatment administered (if applicable — only if reported).
- Respiratory Therapy (RT) notified (if applicable — only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume oxygen, suctioning, breathing treatments, or RT notification unless documented. Never fabricate oxygen saturation, respiratory rate, lung sounds, or other assessment findings.`;

const CROSS_REFERENCE_INSTRUCTIONS = `If applicable, also reference Vomiting, Enteral Feeding: Tolerance / Complications, Seizure Activity, and Transfer Out. Use related guidelines only to improve missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested.`;

const SHARED_FOLLOW_UP_RESOLUTION_TEMPLATE = `RESPIRATORY DISTRESS / ASPIRATION — FOLLOW-UP / RESOLUTION

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any respiratory symptoms or concerns reported by the individual or staff.
- If the individual is unable to participate, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Individual's positioning
- Relevant respiratory symptoms

ASSESSMENT:
Respiratory Distress / Aspiration Follow-up

PLAN (include only supported elements):
- Document nursing interventions completed (only if reported).
- Notify the PCP of abnormal findings noted during the assessment (only if abnormal findings are present and notification occurred or is explicitly indicated).
- Document the next nursing assessment due (only if reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse handoff if additional follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never diagnose aspiration pneumonia. Never fabricate respiratory symptoms, oxygen therapy, suctioning, respiratory treatments, or PCP notification. Document only findings actually provided by the nurse.`;

const FOLLOW_UP_TYPE_BEHAVIOR = `ASSESSMENT TYPE — FOLLOW-UP:
- Document current respiratory status (only if reported).
- Document response to previous interventions when provided (only if reported).
- Document ongoing monitoring (only if reported).
- Do not assume improvement or deterioration.`;

const RESOLUTION_TYPE_BEHAVIOR = `ASSESSMENT TYPE — RESOLUTION:
- Document resolution ONLY when explicitly documented by the nurse.
- Do not assume respiratory distress or aspiration has resolved.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `${SHARED_FOLLOW_UP_RESOLUTION_TEMPLATE}

${FOLLOW_UP_TYPE_BEHAVIOR}`;

const RESOLUTION_ASSESSMENT_INSTRUCTIONS = `${SHARED_FOLLOW_UP_RESOLUTION_TEMPLATE}

${RESOLUTION_TYPE_BEHAVIOR}`;

export const RESPIRATORY_GUIDELINE: GuidelineDefinition = {
  id: 'respiratory',
  displayName: 'Respiratory Distress / Aspiration',
  description:
    'Respiratory Distress / Aspiration facility guideline. Initial assessment documents positioning, respiratory/aspiration symptoms, gastric residuals when applicable, interventions, q4 temperature monitoring for 48 hours without fever, and optional suctioning/oxygen/treatments/RT only when reported. Follow-up and resolution assessments document positioning, respiratory symptoms, interventions, PCP notification when abnormal findings are present, next assessment due, handoff, and staff education. Cross-reference Vomiting, Enteral Feeding Tolerance, Seizure Activity, and Transfer Out when applicable.',

  assessment: {
    requiredFields: [
      respiratoryField("Individual's positioning", POSITIONING_KEYWORDS),
      respiratoryField(
        'Relevant symptoms (respiratory distress, aspiration-related, coughing during meals/feedings/meds, vomiting, choking, etc.)',
        [...RESPIRATORY_SYMPTOMS_KEYWORDS, ...ASPIRATION_SYMPTOMS_KEYWORDS],
      ),
      respiratoryField('Analysis of gastric residuals (when applicable)', GASTRIC_RESIDUAL_KEYWORDS, false),
    ],
    optionalFields: [
      fieldFromLabel('Relevant respiratory symptoms', {
        matchKeywords: REASSESSMENT_RESPIRATORY_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
    ],
  },

  missingInformationChecklist: [
    respiratoryField("Individual's positioning", POSITIONING_KEYWORDS),
    respiratoryField('Relevant respiratory symptoms', RESPIRATORY_SYMPTOMS_KEYWORDS),
    respiratoryField('Nursing interventions completed', NURSING_INTERVENTIONS_KEYWORDS, false),
    respiratoryField('PCP notification (when abnormal findings are present)', PCP_NOTIFICATION_KEYWORDS, false),
    respiratoryField('Next nursing assessment due', NEXT_NURSING_ASSESSMENT_KEYWORDS, false),
    respiratoryField(
      'Nurse-to-nurse / 24-hour report communication (when follow-up is indicated)',
      HANDOFF_KEYWORDS,
      false,
    ),
    respiratoryField('Staff instruction or education documentation', STAFF_EDUCATION_KEYWORDS, false),
    respiratoryField('Aspiration-related symptoms (if applicable)', ASPIRATION_SYMPTOMS_KEYWORDS, false),
    respiratoryField('Gastric residual assessment (if applicable)', GASTRIC_RESIDUAL_KEYWORDS, false),
    respiratoryField('Temperature monitoring plan', TEMP_MONITORING_PLAN_KEYWORDS, false),
    respiratoryField('Suctioning status', SUCTIONING_KEYWORDS, false),
    respiratoryField('Oxygen therapy status', OXYGEN_THERAPY_KEYWORDS, false),
    respiratoryField('Breathing treatment status', BREATHING_TREATMENT_KEYWORDS, false),
    respiratoryField('Respiratory Therapy notification', RT_NOTIFICATION_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'vomiting',
        triggerKeywords: ['vomiting', 'emesis', 'vomited', 'nausea with vomiting', 'throwing up'],
      },
      {
        guidelineId: 'enteral_feeding_tolerance',
        triggerKeywords: [
          'enteral feeding intolerance', 'feeding intolerance', 'tube feed intolerance',
          'enteral feeding complication', 'g-tube feeding', 'gtube feeding', 'tube feeding problem',
        ],
      },
      {
        guidelineId: 'seizure',
        triggerKeywords: ['seizure', 'seizure activity', 'convulsion', 'witnessed seizure'],
      },
      {
        guidelineId: 'transfer_out_back',
        triggerKeywords: [
          'transfer out', 'emergency transfer', 'transfer to er', 'transport to er',
          'sent to er', 'emergency room', 'ambulance', '911', 'ems',
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
      instructions: `SOAP NOTE — Respiratory Distress / Aspiration

Output a completed facility form — not narrative SOAP prose.

Use the FACILITY FORM TEMPLATE FOR THIS ASSESSMENT TYPE. Preserve SUBJECTIVE:/OBJECTIVE:/ASSESSMENT:/PLAN: headings and every colon-ended prompt on its own line. Leave prompts visible when blank.

Initial form prompts include:
SUBJECTIVE:

OBJECTIVE:
See Interactive View Assessment.
Individual's positioning:
Relevant symptoms:
Analysis of gastric residuals (when applicable):

ASSESSMENT:
Respiratory Distress / Aspiration

PLAN:
Nursing interventions completed:
Notify PCP of abnormal findings noted during assessment:
Assess and document temperature every 4 hours for 48 hours without fever, according to facility guideline.
Suctioning performed (if applicable):
Oxygen therapy provided (if applicable):
Breathing treatment administered (if applicable):
Respiratory Therapy (RT) notified (if applicable):
Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:
Staff verbalized or demonstrated understanding of instructions provided:

Follow-up/resolution uses the follow-up form template. Never diagnose aspiration pneumonia or fabricate O2 sat, RR, or lung sounds.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Respiratory Distress / Aspiration

SITUATION: individual with respiratory distress or aspiration concern per facility guideline.
BACKGROUND: supported symptom history, positioning, enteral feeding/meal context if reported.
ASSESSMENT: positioning, respiratory symptoms, response to interventions at follow-up — only if provided. Do not assume improvement or resolution.
RECOMMENDATION: PCP notification when abnormal findings present, next assessment due, handoff when follow-up indicated — only if supported. Cross-reference related guidelines only when documented assessment supports them.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Respiratory Distress / Aspiration

Plain-language summary of supported facts: resident had respiratory or swallowing/aspiration concern, monitoring and comfort measures taken, follow-up plan if reported.
Do not diagnose aspiration pneumonia or include clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Respiratory Distress / Aspiration

Notify PCP of abnormal findings noted during assessment — document only if notification occurred or is explicitly indicated.
Include supported positioning, symptoms, gastric residuals, and interventions. Never diagnose aspiration pneumonia or respiratory failure.`,
    },
  },

  followUpRequirements: {
    frequency:
      'Continue follow-up assessments per facility guideline until resolution is explicitly documented by the nurse.',
    monitoringPoints: [
      "Individual's positioning",
      'Relevant respiratory symptoms',
      'Response to previous interventions',
      'Ongoing monitoring',
      'Next nursing assessment due',
    ],
    reassessmentCriteria: [
      'New or worsening respiratory distress',
      'Continued aspiration-related symptoms',
      'Abnormal assessment findings',
      'Additional follow-up indicated',
    ],
    instructions: `Document current respiratory status, response to previous interventions, and ongoing monitoring only when reported. Do not assume improvement or deterioration.

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Resolution explicitly documented by the nurse',
      'Respiratory distress or aspiration concern resolved as reported',
      'No ongoing follow-up indicated as documented',
    ],
    instructions:
      'Document resolution ONLY when explicitly documented by the nurse. Do not assume respiratory distress or aspiration has resolved.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP of abnormal findings noted during assessment. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant respiratory/aspiration event is reported. Do not auto-notify unless supported.',
    triggers: [
      'Abnormal assessment findings',
      'Respiratory distress or aspiration event',
      'Fever during q4 temperature monitoring period',
      'Ineffective interventions',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless abnormal findings or explicit notification is reported.',
      'Do not document RT notification unless explicitly reported.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident education about positioning, swallowing safety, or symptom reporting only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about respiratory monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never diagnose aspiration pneumonia.',
    'Never diagnose respiratory failure.',
    'Never fabricate respiratory symptoms.',
    'Never assume respiratory distress has improved.',
    'Never assume respiratory distress has resolved.',
    'Never fabricate oxygen therapy, suctioning, or respiratory treatments.',
    'Never fabricate PCP notification.',
    'Never assume oxygen was required.',
    'Never assume suctioning was performed.',
    'Never assume breathing treatments were administered.',
    'Never assume Respiratory Therapy was notified.',
    'Never fabricate oxygen saturation, respiratory rate, lung sounds, or other assessment findings.',
    'Document only findings actually provided by the nurse.',
    'Preserve the facility requirement to document temperature every 4 hours for 48 hours without fever on initial assessment.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
