import type { GuidelineDefinition } from '../types.ts';
import { fieldFromLabel } from '../guidelineEngine.ts';

const ABDOMINAL_SYMPTOMS_KEYWORDS = [
  'abdominal pain', 'abdomen pain', 'belly pain', 'discomfort', 'nausea', 'appetite',
  'distention', 'distension', 'bloating', 'cramping', 'tender', '복부', 'abdominal',
  'observed', 'staff report', 'no symptoms', 'denies',
];

const ABDOMINAL_CIRCUMFERENCE_KEYWORDS = [
  'abdominal circumference', 'girth', 'abdominal girth', 'cm', 'inches', 'measurement',
  'compared to last', 'last documented', 'increased circumference', 'decreased circumference',
  'baseline measurement', 'current girth', 'circumference comparison',
];

const BOWEL_PATTERN_KEYWORDS = [
  'bowel pattern', 'bowel movement', 'bm', 'stool', 'constipation', 'diarrhea',
  'frequency', 'last bm', 'no bm', 'irregular', 'changed pattern', 'loose stool',
  'hard stool', 'no change in bowel',
];

const MEAL_REFUSALS_KEYWORDS = [
  'meal refusal', 'refused meals', 'poor intake', 'declined food', 'not eating',
  '48 hours', 'previous 48', 'appetite decreased', 'eating poorly', 'intake',
  'no meal refusals', 'eating well',
];

const RECTAL_EXAM_KEYWORDS = [
  'rectal examination', 'rectal exam', 'digital rectal', 'dre', 'impaction',
  'stool in rectum', 'rectal assessment', 'not performed', 'no rectal exam',
  'results of rectal',
];

const NURSING_INTERVENTIONS_KEYWORDS = [
  'nursing intervention', 'interventions completed', 'intervention', 'monitor',
  'assessed', 'completed', 'provided', 'observed', 'abdominal assessment',
];

const REASSESSMENT_PLAN_KEYWORDS = [
  'next nursing reassessment', 'reassessment plan', 'next reassessment', 'plan to reassess',
  'scheduled reassessment', 'follow-up assessment', 'reassess at',
];

const MEDICATION_EFFECTIVENESS_KEYWORDS = [
  'medication effectiveness', 'effectiveness of prescribed', 'effective', 'ineffective',
  'relief', 'no relief', 'improved', 'partial relief', 'prescribed medication',
  'no improvement within 24',
];

const MEDICATION_SIDE_EFFECTS_KEYWORDS = [
  'side effects', 'adverse effect', 'adverse reaction', 'monitor for side effects',
  'tolerated', 'no side effects', 'nausea from medication', 'diarrhea from medication',
];

const PCP_NOTIFICATION_KEYWORDS = [
  'pcp', 'provider', 'physician', 'doctor', 'notified', 'notification', 'notify pcp',
  'bowel sounds absent', 'no relief within 24', 'abnormal findings', 'not notified',
  'diminished bowel', 'increased abdominal circumference',
];

const DIGITAL_RECTAL_CONSIDERATION_KEYWORDS = [
  'digital rectal assessment', 'pcp order for rectal', 'consider obtaining', 'rectal assessment when indicated',
  'consider rectal', 'order for digital rectal', 'not indicated',
];

const HANDOFF_KEYWORDS = [
  'handoff', 'oncoming nurse', 'nurse to nurse', 'nurse-to-nurse', '24-hour report',
  '24 hour report', 'shift report', 'follow-up indicated',
];

const STAFF_EDUCATION_KEYWORDS = [
  'staff verbalized', 'staff demonstrated', 'understanding', 'staff education',
  'instructions provided', 'education provided', 'instructed staff',
];

const CURRENT_ABDOMINAL_FINDINGS_KEYWORDS = [
  'abdominal assessment', 'current abdominal', 'distention', 'distension', 'tenderness',
  'soft abdomen', 'firm abdomen', 'guarding', 'abdominal exam', 'interactive view',
];

const BOWEL_SOUND_STATUS_KEYWORDS = [
  'bowel sounds', 'absent bowel', 'diminished bowel', 'hypoactive', 'hyperactive',
  'normoactive', 'no bowel sounds', 'decreased bowel sounds', 'active bowel sounds',
];

function abdominalField(
  label: string,
  matchKeywords: string[],
  critical = true,
): ReturnType<typeof fieldFromLabel> {
  return fieldFromLabel(label, { critical, matchKeywords });
}

const INITIAL_ASSESSMENT_INSTRUCTIONS = `ABDOMINAL DISTENTION / PAIN — INITIAL ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document abdominal pain, discomfort, nausea, appetite changes, or other symptoms reported by the resident or staff.
- If the resident is unable to report symptoms, document observed findings only.
- Do not assume symptoms that were not reported.

OBJECTIVE:
See Interactive View Assessment.

Required assessment (document only what is provided):
- Comparison of abdominal circumference to the last documented measurement
- Changes in bowel pattern
- Meal refusals during the previous 48 hours
- Results of rectal examination (if performed)

ASSESSMENT:
Abdominal Distention / Pain

Do NOT diagnose bowel obstruction, ileus, constipation, fecal impaction, appendicitis, or any other abdominal condition.

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document the next nursing reassessment (only if reported).
- Assess the effectiveness of prescribed medication and monitor for side effects (only if medication given and assessment reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify PCP if bowel sounds are absent (only if absent bowel sounds documented and notification occurred or is explicitly indicated).
- Notify PCP if there is no relief within 24 hours or if abnormal findings are noted during assessment (only if supported and notification occurred or is explicitly indicated).
- Consider obtaining a PCP order for a digital rectal assessment when indicated (only if consideration documented).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never fabricate abdominal circumference measurements. Never assume bowel sounds normal/absent/diminished unless documented. Never assume rectal exam performed or medication effective unless documented.`;

const FOLLOW_UP_ASSESSMENT_INSTRUCTIONS = `ABDOMINAL DISTENTION / PAIN — FOLLOW-UP ASSESSMENT

Use these headings exactly:
SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

SUBJECTIVE:
- Document any new or continuing abdominal symptoms reported by the resident or staff.
- If the resident cannot report symptoms, document observed findings only.

OBJECTIVE:
See Interactive View Assessment.

ASSESSMENT:
Abdominal Distention / Pain

PLAN (include only supported elements):
- Nursing interventions completed (only if reported).
- Document the next nursing reassessment (only if reported).
- Assess the effectiveness of prescribed medication and monitor for side effects (only if medication given and assessment reported).
- Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated (only if reported).
- Notify PCP if bowel sounds are absent, diminished, or if there is a significant increase in abdominal circumference (only if findings documented and notification occurred or is explicitly indicated).
- Notify PCP if there is no relief within 24 hours or if abnormal findings are noted during assessment (only if supported and notification occurred or is explicitly indicated).
- Consider obtaining a PCP order for a digital rectal assessment when indicated (only if consideration documented).
- Document whether staff verbalized or demonstrated understanding of instructions provided (only if reported).

Never assume symptoms resolved unless documented. Never diagnose abdominal conditions. Document only findings actually provided.`;

export const ABDOMINAL_DISTENTION_PAIN_GUIDELINE: GuidelineDefinition = {
  id: 'abdominal_distention_pain',
  displayName: 'Abdominal Distention / Pain',
  description:
    'Abdominal Distention / Pain facility guideline. Document circumference comparison, bowel pattern, meal refusals, rectal exam results when performed, medication effectiveness/side effects, and PCP notification triggers. Never diagnose abdominal conditions or fabricate measurements.',

  assessment: {
    requiredFields: [
      abdominalField(
        'Comparison of abdominal circumference to the last documented measurement',
        ABDOMINAL_CIRCUMFERENCE_KEYWORDS,
        false,
      ),
      abdominalField('Changes in bowel pattern', BOWEL_PATTERN_KEYWORDS, false),
      abdominalField('Meal refusals during the previous 48 hours', MEAL_REFUSALS_KEYWORDS, false),
      abdominalField('Results of rectal examination (if performed)', RECTAL_EXAM_KEYWORDS, false),
    ],
    optionalFields: [
      fieldFromLabel('Current abdominal assessment findings', {
        matchKeywords: CURRENT_ABDOMINAL_FINDINGS_KEYWORDS,
        description: 'Follow-up assessment.',
      }),
      fieldFromLabel('Bowel sound status', {
        matchKeywords: BOWEL_SOUND_STATUS_KEYWORDS,
        description: 'Follow-up assessment when assessed.',
      }),
    ],
  },

  missingInformationChecklist: [
    abdominalField('Abdominal circumference comparison', ABDOMINAL_CIRCUMFERENCE_KEYWORDS, false),
    abdominalField('Bowel pattern changes', BOWEL_PATTERN_KEYWORDS, false),
    abdominalField('Meal refusals within the previous 48 hours', MEAL_REFUSALS_KEYWORDS, false),
    abdominalField('Rectal examination results (if performed)', RECTAL_EXAM_KEYWORDS, false),
    abdominalField('Nursing interventions', NURSING_INTERVENTIONS_KEYWORDS, false),
    abdominalField('Reassessment plan', REASSESSMENT_PLAN_KEYWORDS, false),
    abdominalField('Medication effectiveness', MEDICATION_EFFECTIVENESS_KEYWORDS, false),
    abdominalField('Medication side effects', MEDICATION_SIDE_EFFECTS_KEYWORDS, false),
    abdominalField('PCP notification when indicated', PCP_NOTIFICATION_KEYWORDS, false),
    abdominalField('Digital rectal assessment consideration (when applicable)', DIGITAL_RECTAL_CONSIDERATION_KEYWORDS, false),
    abdominalField('Nurse-to-nurse handoff', HANDOFF_KEYWORDS, false),
    abdominalField('Staff education documentation', STAFF_EDUCATION_KEYWORDS, false),
    abdominalField('Current abdominal assessment findings', CURRENT_ABDOMINAL_FINDINGS_KEYWORDS, false),
    abdominalField('Abdominal circumference changes', ABDOMINAL_CIRCUMFERENCE_KEYWORDS, false),
    abdominalField('Bowel sound status', BOWEL_SOUND_STATUS_KEYWORDS, false),
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
      instructions: `RESOLUTION ASSESSMENT — Abdominal Distention / Pain

Document guideline closure only when input supports symptom resolution and abdominal findings returned to baseline as documented.
Do not assume symptoms resolved or bowel function normalized unless explicitly reported.
Do not diagnose resolution of underlying abdominal conditions.`,
    },

    soapNote: {
      applicable: true,
      instructions: `SOAP NOTE — Abdominal Distention / Pain

SUBJECTIVE: abdominal pain, discomfort, nausea, appetite changes reported or observed; do not invent symptoms.
OBJECTIVE: Interactive View Assessment; circumference comparison, bowel pattern, meal refusals, rectal exam results — only if provided. Never fabricate measurements or bowel sounds.
ASSESSMENT: Abdominal Distention / Pain (not obstruction, ileus, impaction, appendicitis, or other diagnosis)
PLAN: interventions, reassessment plan, medication effectiveness/side effects, PCP notification, digital rectal consideration, handoff, staff understanding — only if supported.`,
    },

    sbar: {
      applicable: true,
      instructions: `SBAR — Abdominal Distention / Pain

SITUATION: resident with abdominal distention/pain concern per facility guideline.
BACKGROUND: supported symptom history, prior bowel pattern, meal intake if reported.
ASSESSMENT: circumference comparison, bowel pattern, meal refusals, rectal exam, bowel sounds — only if provided.
RECOMMENDATION: PCP notification for absent/diminished bowel sounds, no relief in 24 hours, increased circumference, abnormal findings; digital rectal consideration — only if supported.`,
    },

    larGuardianEmail: {
      applicable: true,
      instructions: `LAR/GUARDIAN EMAIL — Abdominal Distention / Pain

Plain-language summary of supported facts: resident had abdominal discomfort being monitored, interventions taken, follow-up plan if reported.
Do not diagnose abdominal conditions or include clinical details beyond what nurse provided unless appropriate for family communication.`,
    },

    providerNotification: {
      applicable: true,
      instructions: `PROVIDER NOTIFICATION — Abdominal Distention / Pain

Notify PCP for absent/diminished bowel sounds, no relief within 24 hours, significant increase in abdominal circumference, or abnormal findings — document only if notification occurred or is explicitly indicated.
Include supported assessment findings. Never diagnose bowel obstruction or other abdominal conditions.`,
    },
  },

  followUpRequirements: {
    frequency: 'Continue nursing reassessment per documented plan until symptoms resolve.',
    monitoringPoints: [
      'Current abdominal assessment findings',
      'Abdominal circumference changes',
      'Bowel pattern and bowel sound status',
      'Medication effectiveness and side effects',
      'Meal intake and refusals',
    ],
    reassessmentCriteria: [
      'No relief within 24 hours',
      'Absent or diminished bowel sounds',
      'Significant increase in abdominal circumference',
      'New or worsening abdominal symptoms',
      'Abnormal assessment findings',
    ],
    instructions:
      'Document next nursing reassessment on each note. Document medication effectiveness and side effects only when medication given and assessed.',
  },

  resolutionCriteria: {
    applicable: true,
    criteria: [
      'Abdominal symptoms resolved as documented',
      'Bowel pattern and circumference stable or improved as reported',
      'No unresolved abnormal findings requiring continued monitoring',
    ],
    instructions:
      'Do not mark guideline resolved unless symptom resolution and assessment findings are supported by provided information.',
  },

  notificationRules: {
    providerNotification:
      'Notify PCP if bowel sounds absent (initial) or absent/diminished/significant circumference increase (follow-up), no relief within 24 hours, or abnormal findings. Document notification only if it occurred or is explicitly indicated.',
    larGuardianNotification:
      'Notify LAR/guardian per facility policy when significant abdominal change is reported. Do not auto-notify unless supported.',
    triggers: [
      'Absent bowel sounds',
      'Diminished bowel sounds or significant abdominal circumference increase',
      'No relief within 24 hours',
      'Abnormal assessment findings',
    ],
    prohibitedAutoNotifications: [
      'Do not document PCP notification unless triggering findings or explicit notification is reported.',
      'Do not diagnose abdominal conditions or assume bowel sound status.',
    ],
  },

  educationRequirements: {
    residentInstructions:
      'Document resident education about reporting abdominal symptoms or dietary changes only if reported.',
    staffInstructions:
      'Document whether staff verbalized or demonstrated understanding of instructions provided — only if reported.',
    larGuardianInstructions:
      'Document LAR/guardian communication about abdominal monitoring only if reported.',
  },

  prohibitedAssumptions: [
    'Never diagnose bowel obstruction, ileus, constipation, fecal impaction, appendicitis, or any other abdominal condition.',
    'Never assume bowel sounds are normal, absent, or diminished unless documented.',
    'Never fabricate abdominal circumference measurements.',
    'Never assume a rectal examination was performed.',
    'Never assume medication was effective.',
    'Never assume symptoms have resolved unless documented.',
    'Document only assessment findings actually provided by the nurse.',
    'Do not treat missing checklist items as confirmed abnormal findings.',
  ],

  terminologyRules: 'Use "resident" unless nurse terminology setting specifies otherwise.',
};
