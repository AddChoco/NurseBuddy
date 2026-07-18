import type { GuidelineDefinition } from '../types';
import { fieldFromLabel } from '../guidelineEngine';

const PAIN_SCORE_KEYWORDS = [
  'pain score', 'pain level', 'rates pain', 'pain rated', '0/10', '1/10', '2/10', '3/10',
  '4/10', '5/10', '6/10', '7/10', '8/10', '9/10', '10/10', 'out of 10', '/10',
  'numeric pain', 'pain scale score', '통증', 'dolor',
];

const PAIN_SCALE_KEYWORDS = [
  'pain scale', 'numeric scale', '0-10', '0 to 10', 'wong-baker', 'faces scale',
  'flacc', 'pacslac', 'abbey', 'cpot', 'bps', 'behavioral pain',
];

const PAIN_LOCATION_KEYWORDS = [
  'pain location', 'location of pain', 'left', 'right', 'knee', 'back', 'abdomen',
  'head', 'hip', 'shoulder', 'leg', 'arm', 'chest', 'site of pain', 'localized',
  'generalized', 'suspected location',
];

const RESPONSE_INTERVENTION_KEYWORDS = [
  'response to intervention', 'responded to', 'response to medication', 'after medication',
  'after tylenol', 'after analgesic', 'relief', 'improved after', 'partial relief',
  'no relief', 'unchanged after', 'effective', 'ineffective',
];

const PAIN_INTERVENTION_KEYWORDS = [
  'pain management', 'tylenol', 'acetaminophen', 'morphine', 'ibuprofen', 'analgesic',
  'prn pain', 'ice pack', 'reposition', 'comfort measure', 'medication given',
  'intervention provided',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'called',
  'pain score >4', 'pain score greater', 'moderate pain', 'severe pain', 'unresolved pain',
  'no improvement', 'within 1 hour', 'not notified', 'no notification',
];

const FOLLOW_UP_PLAN_KEYWORDS = [
  'follow up', 'follow-up', 'reassess', 'recheck', 'monitor pain', 'nursing follow-up',
  'effectiveness', 'side effects',
];

const STAFF_INSTRUCTION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'instructions provided',
  'education provided', 'instructed staff',
];

const PAIN_SCORE_BEFORE_KEYWORDS = [
  'before medication', 'prior to medication', 'pre-medication', 'initial pain score',
  'pain score before', 'score prior', 'before tylenol', 'before analgesic',
];

const PAIN_SCORE_AFTER_KEYWORDS = [
  'after medication', 'post medication', 'following medication', 'pain score after',
  'decreased to', 'reduced to', 'improved to', 'score after', 'after tylenol',
];

const MEDICATION_EFFECTIVENESS_KEYWORDS = [
  'medication effectiveness', 'effectiveness', 'effective', 'ineffective',
  'score change', 'pain score change', 'decreased from', 'improved from', 'to ___',
  'from ___ to',
];

const PAIN_RESULTS_KEYWORDS = [
  'pain management results', 'management results', 'results of intervention',
  'outcome', 'pain relief achieved', 'pain persists', 'pain resolved',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report',
];

function painField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `PAIN — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document the resident's report of pain whenever possible.
- If the resident is nonverbal or unable to report pain, document observed pain indicators and that subjective reporting is limited.
- Do not assume pain characteristics that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Pain level / pain scale
- Location or suspected location of pain, if known
- Response to intervention

ASSESSMENT:
Pain

PLAN (include only supported elements):
- Pain management interventions provided (only if reported).
- Nursing follow-up to assess effectiveness of pain medication and monitor for side effects (only if applicable/reported).
- Notify PCP for signs or symptoms of moderate to severe pain (pain score >4) or unresolved pain (only if notification occurred or is explicitly indicated).
- Notify PCP if there is no improvement within 1 hour or abnormal findings are noted during assessment (only if supported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never fabricate a pain score. Never assume pain has resolved unless documented.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `PAIN — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document resident report of pain after intervention when available.
- If the resident is unable to report pain, document observed pain behaviors and that subjective reporting is limited.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Pain medication effectiveness as evidenced by pain score change (___ to ___) — only if both scores or change reported
- Response to intervention

ASSESSMENT:
Pain

PLAN (include only supported elements):
- Pain management results (only if reported).
- Notify PCP if pain recurs or abnormal findings are noted during assessment (only if supported).
- Notify PCP for moderate to severe pain (pain score >4) or unresolved pain (only if notification occurred or is explicitly indicated).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume medication was effective unless supported by assessment. Never fabricate pain scores.`;

export const PAIN_GUIDELINE: GuidelineDefinition = {
  id: 'pain',
  displayName: 'Pain',
  description:
    'Facility pain guideline. Document pain score, location, interventions, response, PCP notification triggers (score >4, unresolved pain, no improvement within 1 hour), and follow-up handoff. Never fabricate pain scores or assume resolution.',

  assessment: {
    requiredFields: [
      painField('Pain level / pain scale', [...PAIN_SCORE_KEYWORDS, ...PAIN_SCALE_KEYWORDS]),
      painField('Location or suspected location of pain, if known', PAIN_LOCATION_KEYWORDS, false),
      painField('Response to intervention', RESPONSE_INTERVENTION_KEYWORDS),
    ],
    optionalFields: [
      fieldFromLabel('Pain score before medication', { matchKeywords: PAIN_SCORE_BEFORE_KEYWORDS, description: 'Follow-up assessment.' }),
      fieldFromLabel('Pain score after medication', { matchKeywords: PAIN_SCORE_AFTER_KEYWORDS, description: 'Follow-up assessment.' }),
    ],
  },

  missingInformationChecklist: [
    painField('Pain score', PAIN_SCORE_KEYWORDS),
    painField('Pain scale used', PAIN_SCALE_KEYWORDS, false),
    painField('Pain location (if known)', PAIN_LOCATION_KEYWORDS, false),
    painField('Response to intervention', RESPONSE_INTERVENTION_KEYWORDS),
    painField('Pain management intervention', PAIN_INTERVENTION_KEYWORDS, false),
    painField('PCP notification when indicated', PCP_NOTIFICATION_KEYWORDS, false),
    painField('Follow-up plan', FOLLOW_UP_PLAN_KEYWORDS, false),
    painField('Staff instruction documentation', STAFF_INSTRUCTION_KEYWORDS, false),
    painField('Pain score before medication', PAIN_SCORE_BEFORE_KEYWORDS, false),
    painField('Pain score after medication', PAIN_SCORE_AFTER_KEYWORDS, false),
    painField('Medication effectiveness', MEDICATION_EFFECTIVENESS_KEYWORDS, false),
    painField('Pain management results', PAIN_RESULTS_KEYWORDS, false),
    painField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
  ],

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
      instructions: `RESOLUTION ASSESSMENT — Pain

Document pain guideline closure only when input supports that pain has resolved or is managed at acceptable level per reported assessment.
Include last pain score and response to interventions only if reported.
Do not assume pain has resolved unless documented.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Pain

SUBJECTIVE: resident pain report or observed pain indicators; note if nonverbal/unable to report.
OBJECTIVE: Interactive View Assessment; pain level/scale, location if known, response to intervention — only if provided. Never fabricate scores.
ASSESSMENT: Pain
PLAN: pain management interventions, follow-up for medication effectiveness/side effects, PCP notification, handoff, staff understanding — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Pain

SITUATION: resident with pain per guideline.
BACKGROUND: supported pain history, prior interventions if reported.
ASSESSMENT: pain score/scale, location, response to intervention — only if provided.
RECOMMENDATION: PCP notification for score >4, unresolved pain, or no improvement within 1 hour — only if supported; follow-up and handoff if indicated.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Pain

Plain-language summary of supported facts: resident experienced pain, comfort measures or medications provided, monitoring plan if reported.
Do not include specific pain scores or clinical details beyond what nurse provided unless appropriate for family communication as reported.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Pain

Document PCP notification for moderate/severe pain (score >4), unresolved pain, no improvement within 1 hour, or abnormal findings — only if notification occurred or is explicitly indicated.
Include supported pain score, scale, location, interventions, and response. Never fabricate scores or effectiveness.`,
    },
  },

  followUpRequirements: {
    frequency: 'Reassess pain after intervention; notify PCP if pain recurs, score >4, or unresolved.',
    monitoringPoints: [
      'Pain score before and after medication when applicable',
      'Medication effectiveness evidenced by score change',
      'Response to intervention',
      'Side effects of pain medication',
      'Observed pain behaviors if resident nonverbal',
    ],
    reassessmentCriteria: [
      'Pain score >4 or moderate to severe pain',
      'No improvement within 1 hour after intervention',
      'Pain recurs after initial relief',
      'Abnormal findings during assessment',
    ],
    instructions:
      'Complete follow-up assessment with before/after pain scores when medication given. Document effectiveness only when supported by score change or clinical report.',
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Pain resolved or managed at acceptable level as documented',
      'No unresolved moderate to severe pain',
      'Response to intervention documented when applicable',
    ],
    instructions:
      'Do not mark pain guideline resolved unless input supports pain resolution or acceptable management.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP for moderate to severe pain (pain score >4), unresolved pain, no improvement within 1 hour, pain recurrence, or abnormal findings. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant pain-related change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Pain score greater than 4',
      'Unresolved pain after intervention',
      'No improvement within 1 hour',
      'Pain recurrence on follow-up',
      'Abnormal assessment findings',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless score >4, unresolved pain, no improvement, recurrence, or explicit notification is reported.',
    ],
  },

  educationRequirements: {
    residentInstructions: 'Document resident pain education or comfort measures only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions: 'Document LAR/guardian communication about pain management only if reported.',
  },

  prohibitedAssumptions: [
    'Never fabricate a pain score.',
    'Never assume pain has resolved unless documented.',
    'Never assume medication was effective unless supported by assessment or score change.',
    'Do not invent pain location or pain characteristics.',
    'If the resident is nonverbal, describe observed indicators only when provided.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
