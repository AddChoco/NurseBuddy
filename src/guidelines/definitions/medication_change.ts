import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const ASSESSMENT_TYPE_KEYWORDS = [
  'initial assessment', 'follow-up assessment', 'follow up assessment', 'resolution assessment',
  'initial medication change', 'follow-up medication change', 'follow up medication change',
  'medication change resolved', 'resolved', 'resolution', 'closing assessment', 'follow-up', 'follow up',
];

const MEDICATION_CHANGE_DETAILS_KEYWORDS = [
  'medication change', 'med changed', 'new medication', 'discontinued', 'dose increased',
  'dose decreased', 'dose change', 'held medication', 'started medication', 'emar', 'e-mar', 'mar',
  'provider order', 'physician order', 'medication name', 'route', 'frequency', 'start date',
  'stop date', 'reason for change', 'increased to', 'decreased to', 'mg', 'tablet', 'capsule',
];

const ADDITIONAL_FINDINGS_KEYWORDS = [
  'additional findings', 'additional assessment', 'medication change related', 'baseline',
  'current findings', 'observed findings', 'related to the medication change', 'assessment findings',
  'vital signs', 'mental status', 'behavior', 'condition',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'medication monitoring',
];

const STAFF_INSTRUCTION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'staff instruction', 'instructions provided', 'education provided', 'instructed staff',
];

const CURRENT_RESPONSE_KEYWORDS = [
  'current response', 'response to medication', 'response to the medication change',
  'effective', 'ineffective', 'tolerated', 'not tolerated', 'improved', 'worsening',
  'no change', 'unchanged', 'benefit', 'no benefit',
];

const SIDE_EFFECTS_KEYWORDS = [
  'side effect', 'side effects', 'adverse effect', 'adverse reaction', 'adverse effects',
  'nausea', 'dizziness', 'rash', 'sedation', 'drowsiness', 'reported side', 'observed side',
];

const CHANGE_FROM_BASELINE_KEYWORDS = [
  'change from baseline', 'compared to baseline', 'baseline', 'prior to change',
  'before medication change', 'from baseline', 'returned to baseline', 'not at baseline',
];

const ONGOING_MONITORING_PLAN_KEYWORDS = [
  'ongoing monitoring', 'follow-up plan', 'continue to monitor', 'reassess', 'monitoring plan',
  'follow up plan', 'scheduled follow-up', 'continue monitoring',
];

const RESOLUTION_STATUS_KEYWORDS = [
  'resolution', 'resolved', 'monitoring complete', 'completion status', 'explicitly documented',
  'symptoms resolved', 'concerns resolved', 'medication change complete', 'completed monitoring',
];

const FINAL_RESPONSE_KEYWORDS = [
  'final response', 'final assessment', 'medication change complete', 'overall response',
  'final status', 'completion of monitoring',
];

const REMAINING_MONITORING_KEYWORDS = [
  'remaining monitoring', 'follow-up needs', 'ongoing needs', 'continued monitoring needed',
  'further follow-up', 'additional monitoring', 'monitoring still needed',
];

const CROSS_REFERENCE_INSTRUCTIONS = `When the medication change is associated with a specific condition or monitoring need documented in the clinical information, also apply supporting rules from the cross-referenced facility guidelines for missing-information detection and SOAP/SBAR/Provider Notification content. Do not automatically generate separate notes unless requested. Do not infer which related guideline applies unless the documented clinical information supports it.`;

function medChangeField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const SHARED_ASSESSMENT_TEMPLATE = `MEDICATION CHANGE — INITIAL / FOLLOW-UP / RESOLUTION

This facility guideline uses one shared documentation template for Initial, Follow-up, and Resolution assessments. Preserve the selected assessment type while using the same SOAP structure.

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document symptoms, concerns, or observations reported by the individual or staff related to the medication change.
- If the individual is unable to report symptoms, document observed findings only.
- Do not assume side effects, benefits, or concerns that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Additional findings related to the medication change

ASSESSMENT:
Medication Change

PLAN (include only supported elements):
- Document nursing interventions completed (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never fabricate the medication name, dose, route, frequency, start date, stop date, or reason for the medication change. Reference eMAR, MAR, or provider orders only when the nurse explicitly provides that information.`;

const INITIAL_TYPE_BEHAVIOR = `ASSESSMENT TYPE — INITIAL:
- Document the initial assessment following the medication change.
- Document available baseline or current findings (only if reported).
- Document nursing interventions completed (only if reported).`;

const FOLLOW_UP_TYPE_BEHAVIOR = `ASSESSMENT TYPE — FOLLOW-UP:
- Document current findings after the medication change (only if reported).
- Document any reported or observed response, adverse effects, or change in condition only when provided.
- Do not assume the medication was effective or tolerated.`;

const RESOLUTION_TYPE_BEHAVIOR = `ASSESSMENT TYPE — RESOLUTION:
- Document resolution or completion of monitoring only when explicitly stated by the nurse.
- Do not assume symptoms, side effects, or concerns have resolved.`;

const INITIAL_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${INITIAL_TYPE_BEHAVIOR}`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${FOLLOW_UP_TYPE_BEHAVIOR}`;

const RESOLUTION_ASSESSMENT_INSTRUCTIONS = `${SHARED_ASSESSMENT_TEMPLATE}

${RESOLUTION_TYPE_BEHAVIOR}`;

export const MEDICATION_CHANGE_GUIDELINE: GuidelineDefinition = {
  id: 'medication_change',
  displayName: 'Medication Change',
  description:
    'Medication Change facility guideline using one shared template for Initial, Follow-up, and Resolution assessments. Document medication change details when available, additional findings, nursing interventions, and staff instruction/education. Cross-reference condition-specific guidelines only when documented clinical information supports the association.',

  assessment: {
    requiredFields: [
      medChangeField(
        'Additional findings related to the medication change',
        ADDITIONAL_FINDINGS_KEYWORDS,
      ),
    ],
    optionalFields: [
      fieldFromLabel('Medication change details', {
        matchKeywords: MEDICATION_CHANGE_DETAILS_KEYWORDS,
        description: 'Document only when nurse provides medication change details.',
      }),
    ],
  },

  missingInformationChecklist: [
    medChangeField('Assessment type', ASSESSMENT_TYPE_KEYWORDS, false),
    medChangeField('Medication change details, when available', MEDICATION_CHANGE_DETAILS_KEYWORDS, false),
    medChangeField('Additional assessment findings', ADDITIONAL_FINDINGS_KEYWORDS),
    medChangeField('Nursing interventions completed', NURSING_INTERVENTIONS_KEYWORDS, false),
    medChangeField('Staff instruction or education documentation', STAFF_INSTRUCTION_KEYWORDS, false),
    medChangeField('Current response to the medication change', CURRENT_RESPONSE_KEYWORDS, false),
    medChangeField('Reported or observed side effects', SIDE_EFFECTS_KEYWORDS, false),
    medChangeField('Change from baseline', CHANGE_FROM_BASELINE_KEYWORDS, false),
    medChangeField('Ongoing monitoring or follow-up plan', ONGOING_MONITORING_PLAN_KEYWORDS, false),
    medChangeField('Explicit resolution or completion status', RESOLUTION_STATUS_KEYWORDS, false),
    medChangeField('Final response to the medication change', FINAL_RESPONSE_KEYWORDS, false),
    medChangeField('Any remaining monitoring or follow-up needs', REMAINING_MONITORING_KEYWORDS, false),
  ],

  crossReferenceRules: {
    instructions: CROSS_REFERENCE_INSTRUCTIONS,
    rules: [
      {
        guidelineId: 'seizure',
        triggerKeywords: [
          'anti-epileptic', 'antiepileptic', 'aed', 'keppra', 'levetiracetam', 'dilantin',
          'phenytoin', 'depakote', 'valproate', 'seizure medication', 'seizure activity',
        ],
      },
      {
        guidelineId: 'hypoglycemia',
        triggerKeywords: [
          'hypoglycemia', 'low blood sugar', 'insulin', 'metformin', 'diabetic medication',
          'blood glucose low', 'glucose low', 'sulfonylurea',
        ],
      },
      {
        guidelineId: 'hyperglycemia',
        triggerKeywords: [
          'hyperglycemia', 'high blood sugar', 'insulin', 'metformin', 'diabetic medication',
          'blood glucose high', 'glucose high', 'glycemic',
        ],
      },
      {
        guidelineId: 'pain',
        triggerKeywords: [
          'analgesic', 'pain medication', 'tylenol', 'acetaminophen', 'morphine', 'opioid',
          'hydrocodone', 'oxycodone', 'ibuprofen', 'pain score',
        ],
      },
      {
        guidelineId: 'constipation',
        triggerKeywords: [
          'constipation medication', 'laxative', 'suppository', 'dulcolax', 'senna', 'colace',
          'miralax', 'bowel regimen',
        ],
      },
      {
        guidelineId: 'diarrhea',
        triggerKeywords: [
          'anti-diarrheal', 'antidiarrheal', 'loperamide', 'imodium', 'kaopectate', 'diarrhea medication',
        ],
      },
      {
        guidelineId: 'crisis_chemical_restraint',
        triggerKeywords: [
          'crisis chemical restraint', 'chemical restraint', 'haloperidol', 'haldol', 'geodon',
        ],
      },
      {
        guidelineId: 'post_sedation',
        triggerKeywords: [
          'chemical sedation', 'medical/dental sedation', 'sedation medication', 'midazolam', 'versed',
        ],
      },
      {
        guidelineId: 'transfer_out_back',
        triggerKeywords: [
          'serious adverse reaction', 'declining condition', 'emergency transfer', 'transfer to er',
          'transport to er', 'sent to er', 'ambulance', '911',
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
      instructions: `SOAP NOTE — Medication Change

Use the shared Medication Change template structure. Preserve Initial, Follow-up, or Resolution assessment type based on nurse selection.
SUBJECTIVE: symptoms/concerns/observations related to medication change — only if reported; do not assume side effects or benefits.
OBJECTIVE: Interactive View Assessment; additional findings and medication change details — only if provided. Never fabricate medication details.
ASSESSMENT: Medication Change
PLAN: nursing interventions and staff instruction/education — only if supported. Cross-referenced guideline actions only when documented clinical information supports the association.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Medication Change

SITUATION: medication change assessment per facility guideline (initial, follow-up, or resolution as selected).
BACKGROUND: supported medication change details and additional findings if reported.
ASSESSMENT: objective findings provided only — do not assume effectiveness, tolerance, or resolution.
RECOMMENDATION: monitoring and interventions per facility guideline; cross-referenced guideline recommendations only when documented information supports the association.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Medication Change

Plain-language summary of supported facts: medication change occurred, monitoring steps taken, follow-up plan if reported.
Do not fabricate medication details or assume outcomes beyond what nurse provided.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Medication Change

Document provider notification only if abnormal findings, serious adverse reactions, declining condition, or explicit notification is reported.
Apply cross-referenced guideline provider notification criteria only when documented clinical information supports the association.`,
    },
  },

  followUpRequirements: {
    frequency: 'Follow facility Medication Change guideline for follow-up monitoring and reassessment as documented.',
    monitoringPoints: [
      'Medication change details when available',
      'Additional findings related to the medication change',
      'Current response and side effects at follow-up',
      'Change from baseline',
      'Ongoing monitoring or follow-up plan',
    ],
    reassessmentCriteria: [
      'Reported or observed adverse effects',
      'Declining condition',
      'No improvement or worsening response',
      'Serious adverse reaction',
      'Emergency transfer need',
    ],
    instructions: `Use the same documentation structure for Initial, Follow-up, and Resolution assessments. Document only findings actually provided by the nurse.

${CROSS_REFERENCE_INSTRUCTIONS}`,
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Resolution or completion of monitoring explicitly documented by the nurse',
      'Final response to medication change as reported',
      'No remaining monitoring needs as documented',
    ],
    instructions:
      'Do not mark Medication Change resolved unless resolution or completion is explicitly stated by the nurse. Never assume monitoring is complete or that symptoms have resolved.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP or provider for abnormal findings, serious adverse reactions, or declining condition only when criteria are met and notification occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant medication change concerns are reported. Do not auto-notify unless supported.',
    triggers: [
      'Serious adverse reaction',
      'Declining condition',
      'Reported or observed significant side effects',
      'Emergency transfer',
      'Worsening response to medication change',
    ],
    prohibitedAutoNotifications: [
      'Do not document provider notification unless criteria met or explicit notification is reported.',
      'Do not assume a medication was started, discontinued, or changed unless documented.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document individual or resident education related to the medication change only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about medication change monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate the medication name.',
    'Never fabricate the dose, route, frequency, start date, stop date, or reason for the medication change.',
    'Never assume a medication was started, discontinued, increased, decreased, or held unless documented.',
    'Never assume the medication was effective.',
    'Never assume the medication was tolerated.',
    'Never fabricate side effects or adverse reactions.',
    'Never assume the individual returned to baseline.',
    'Never assume monitoring is complete.',
    'Reference eMAR, MAR, or provider orders only when the nurse explicitly provides that information.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules:
    'Use "individual" as in the facility guideline, or match nurse terminology setting (resident/patient/client) when generating narrative output.',
};
