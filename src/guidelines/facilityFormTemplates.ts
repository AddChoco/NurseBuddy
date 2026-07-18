import type { GuidelineDefinition } from './types';
import type { AssessmentType } from './facilityTemplateMode';

const STANDARD_PLAN_FIELDS = [
  'Nursing interventions completed:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
];

function lines(...parts: string[]): string {
  return parts.join('\n');
}

function buildSubjectiveObjectiveAssessmentPlanTemplate(options: {
  assessmentLabel: string;
  objectiveFields: string[];
  planFields?: string[];
  fixedPlanLines?: string[];
}): string {
  const planFields = options.planFields ?? STANDARD_PLAN_FIELDS;
  const fixedPlan = options.fixedPlanLines ?? [];

  return lines(
    'SUBJECTIVE:',
    '',
    'OBJECTIVE:',
    'See Interactive View Assessment.',
    ...options.objectiveFields,
    '',
    'ASSESSMENT:',
    options.assessmentLabel,
    '',
    'PLAN:',
    ...planFields,
    ...fixedPlan,
  );
}

function buildShortSoapTemplate(options: {
  assessmentLabel?: string;
  objectiveFields: string[];
  planFields?: string[];
}): string {
  const planFields = options.planFields ?? [
    'Nursing interventions completed:',
    'Appropriate guideline followed (when applicable):',
    'Staff verbalized or demonstrated understanding of instructions provided:',
  ];

  return lines(
    'S:',
    '',
    'O:',
    'See Interactive View Assessment.',
    'Assessed at:',
    ...options.objectiveFields,
    '',
    'A:',
    options.assessmentLabel ?? '',
    '',
    'P:',
    ...planFields,
  );
}

const FALL_INITIAL_TEMPLATE = lines(
  'SUBJECTIVE:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  'Current use of blood thinners, including anticoagulants or antiplatelet medications:',
  '',
  'ASSESSMENT:',
  'Fall or Suspected Fall',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Post Injury Report (PIR) completed:',
  'Notify PCP if abnormal findings are noted during assessment:',
  'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
  'Nurse to assess each shift for 24 hours.',
  'Staff verbalized or demonstrated understanding of instructions provided:',
);

const FALL_FOLLOW_UP_TEMPLATE = lines(
  'SUBJECTIVE:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  'Date and time of follow-up assessment:',
  'Current neurological and mental status compared with baseline:',
  'Pain assessment and location, if present:',
  'Skin assessment for bruising, swelling, redness, bleeding, tenderness, or other injury:',
  'Range of motion and movement of affected areas, when appropriate and safe:',
  'Mobility, transfer status, or gait compared with baseline, when applicable:',
  'Vital signs, if obtained:',
  'Any delayed signs or symptoms after the fall:',
  'Current use of anticoagulant or antiplatelet medication:',
  'Status of previously identified injuries or abnormal findings:',
  'Results of interventions or comfort measures:',
  '',
  'ASSESSMENT:',
  'Fall or Suspected Fall follow-up status.',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Continue assessment each shift for the required 24-hour period.',
  'Notify PCP of new, worsening, or abnormal findings:',
  'Follow any provider orders received:',
  'Update the Post Injury Report or related documentation if required:',
  'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if further follow-up is indicated:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
  'Document whether follow-up monitoring remains open or is complete:',
);

const RESPIRATORY_INITIAL_TEMPLATE = lines(
  'SUBJECTIVE:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  "Individual's positioning:",
  'Relevant symptoms:',
  'Analysis of gastric residuals (when applicable):',
  '',
  'ASSESSMENT:',
  'Respiratory Distress / Aspiration',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Notify PCP of abnormal findings noted during assessment:',
  'Assess and document temperature every 4 hours for 48 hours without fever, according to facility guideline.',
  'Suctioning performed (if applicable):',
  'Oxygen therapy provided (if applicable):',
  'Breathing treatment administered (if applicable):',
  'Respiratory Therapy (RT) notified (if applicable):',
  'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
);

const RESPIRATORY_FOLLOW_UP_TEMPLATE = lines(
  'SUBJECTIVE:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  "Individual's positioning:",
  'Relevant respiratory symptoms:',
  '',
  'ASSESSMENT:',
  'Respiratory Distress / Aspiration Follow-up',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Notify the PCP of abnormal findings noted during the assessment:',
  'Document the next nursing assessment due:',
  'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse handoff if additional follow-up is indicated:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
);

const DIARRHEA_TEMPLATE = buildSubjectiveObjectiveAssessmentPlanTemplate({
  assessmentLabel: 'Diarrhea',
  objectiveFields: [
    'Assessment of intake and output for the past 24 hours:',
    'Effectiveness of anti-diarrheal medication, if administered:',
  ],
  planFields: [
    'Nursing interventions completed:',
    'Strategies implemented to prevent dehydration:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
  ],
});

const CONSTIPATION_TEMPLATE = buildSubjectiveObjectiveAssessmentPlanTemplate({
  assessmentLabel: 'Constipation',
  objectiveFields: [
    'Additional assessment findings:',
    'Results of suppository and/or constipation medication, if administered:',
  ],
});

const MEDICATION_CHANGE_TEMPLATE = buildSubjectiveObjectiveAssessmentPlanTemplate({
  assessmentLabel: 'Medication Change',
  objectiveFields: ['Additional findings related to the medication change:'],
});

const GENERIC_TEMPLATE = buildShortSoapTemplate({
  objectiveFields: ['Additional findings:'],
});

const VOMITING_TEMPLATE = lines(
  'SUBJECTIVE:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  'Date/Time:',
  'Description of Vomitus:',
  'Enteral Feeding Rate:',
  'Analysis of Intake and Output:',
  'Presence or Absence of Nausea:',
  'Positioning per PNMP:',
  'Source of vomiting if identified:',
  'Gastric bleeding if suspected:',
  'Other relevant assessment findings:',
  '',
  'ASSESSMENT:',
  'Vomiting',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
);

const HEAD_INJURY_INITIAL_TEMPLATE = lines(
  'SUBJECTIVE:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  'Observed cause of injury:',
  'Current use of anticoagulant or antiplatelet medication:',
  'Loss of consciousness and duration (if applicable):',
  'Other assessment findings:',
  '',
  'ASSESSMENT:',
  'Head Injury',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Notify PCP of the head injury:',
  'PCP will determine injury severity based on assessment findings.',
  'Follow neurological assessment schedule according to the established severity:',
  'Post Injury Report (PIR) completed:',
  'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
);

const HEAD_INJURY_FOLLOW_UP_TEMPLATE = lines(
  'SUBJECTIVE:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  'Current neurological status:',
  'Other assessment findings:',
  '',
  'ASSESSMENT:',
  'Head Injury',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Nurse reassessment:',
  'Notify PCP immediately if neurological status deteriorates:',
  'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
  'Follow neurological assessment schedule according to the established severity:',
);

const VOMITING_FOLLOW_UP_TEMPLATE = lines(
  'SUBJECTIVE:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  'Last vomiting episode:',
  'Enteral feeding rate:',
  'Intake/output:',
  'Presence or absence of nausea:',
  'Positioning per PNMP:',
  'Gastric bleeding if suspected:',
  'Source of vomiting if identified:',
  '',
  'ASSESSMENT:',
  'Vomiting Follow-up.',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Antiemetic effectiveness:',
  'Nurse reassessment:',
  'Vomiting resolved status:',
  'Assess every shift for 24 hours after resident is symptom free.',
  'Notify oncoming nurse if follow-up is needed.',
  'Staff verbalized or demonstrated understanding of instructions provided:',
);

const ELEVATED_TEMPERATURE_INITIAL_TEMPLATE = lines(
  'SUBJECTIVE:',
  'Reported symptoms related to elevated temperature:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  'Current temperature:',
  'Signs and symptoms of infection:',
  'Environmental factors that may have contributed to the elevated temperature:',
  'Additional findings:',
  '',
  'ASSESSMENT:',
  'Elevated Temperature',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Document temperature at least every 4 hours until BOTH 48 hours after symptoms have resolved AND/OR 48 consecutive hours without fever, according to the facility guideline.',
  'Implement strategies to prevent dehydration:',
  'Implement comfort measures:',
  'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
);

const ELEVATED_TEMPERATURE_FOLLOW_UP_TEMPLATE = lines(
  'SUBJECTIVE:',
  'Reported symptoms:',
  'Fatigue:',
  'New symptoms:',
  '',
  'OBJECTIVE:',
  'See Interactive View Assessment.',
  'Date and time of the last documented elevated temperature:',
  'Current temperature:',
  'Temperature route:',
  'Assessment time:',
  'Signs and symptoms of infection:',
  'Environmental factors that may have contributed to the elevated temperature:',
  'Additional findings:',
  'Interventions completed:',
  '',
  'ASSESSMENT:',
  'Elevated Temperature Follow-up.',
  '',
  'PLAN:',
  'Nursing interventions completed:',
  'Continue temperature assessments according to the Elevated Temperature Guideline.',
  'Fluids encouraged as tolerated.',
  'DSP instructed to monitor for and immediately report increased temperature, chills, fatigue, change in behavior, respiratory symptoms, decreased intake/output, vomiting, or any change from baseline.',
  'Nurse to notify PCP of abnormal findings and complications.',
  'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report when continued follow-up is required.',
  'Staff verbalized or demonstrated understanding of instructions provided:',
);

const TEMPLATE_BY_GUIDELINE: Partial<Record<string, Partial<Record<AssessmentType, string>>>> = {
  other: {
    initial: GENERIC_TEMPLATE,
    follow_up: GENERIC_TEMPLATE,
    resolution: GENERIC_TEMPLATE,
    other: GENERIC_TEMPLATE,
  },
  fall: {
    initial: FALL_INITIAL_TEMPLATE,
    follow_up: FALL_FOLLOW_UP_TEMPLATE,
    resolution: FALL_FOLLOW_UP_TEMPLATE,
    other: FALL_INITIAL_TEMPLATE,
  },
  respiratory: {
    initial: RESPIRATORY_INITIAL_TEMPLATE,
    follow_up: RESPIRATORY_FOLLOW_UP_TEMPLATE,
    resolution: RESPIRATORY_FOLLOW_UP_TEMPLATE,
    other: RESPIRATORY_INITIAL_TEMPLATE,
  },
  diarrhea: {
    initial: DIARRHEA_TEMPLATE,
    follow_up: DIARRHEA_TEMPLATE,
    resolution: DIARRHEA_TEMPLATE,
    other: DIARRHEA_TEMPLATE,
  },
  constipation: {
    initial: CONSTIPATION_TEMPLATE,
    follow_up: CONSTIPATION_TEMPLATE,
    resolution: CONSTIPATION_TEMPLATE,
    other: CONSTIPATION_TEMPLATE,
  },
  medication_change: {
    initial: MEDICATION_CHANGE_TEMPLATE,
    follow_up: MEDICATION_CHANGE_TEMPLATE,
    resolution: MEDICATION_CHANGE_TEMPLATE,
    other: MEDICATION_CHANGE_TEMPLATE,
  },
  vomiting: {
    initial: VOMITING_TEMPLATE,
    follow_up: VOMITING_FOLLOW_UP_TEMPLATE,
    resolution: VOMITING_FOLLOW_UP_TEMPLATE,
    other: VOMITING_TEMPLATE,
  },
  head_injury: {
    initial: HEAD_INJURY_INITIAL_TEMPLATE,
    follow_up: HEAD_INJURY_FOLLOW_UP_TEMPLATE,
    resolution: HEAD_INJURY_FOLLOW_UP_TEMPLATE,
    other: HEAD_INJURY_INITIAL_TEMPLATE,
  },
  pain: {
    initial: buildSubjectiveObjectiveAssessmentPlanTemplate({
      assessmentLabel: 'Pain',
      objectiveFields: ['Additional assessment findings:'],
    }),
    follow_up: buildSubjectiveObjectiveAssessmentPlanTemplate({
      assessmentLabel: 'Pain Follow-up',
      objectiveFields: ['Additional assessment findings:'],
    }),
    resolution: buildSubjectiveObjectiveAssessmentPlanTemplate({
      assessmentLabel: 'Pain',
      objectiveFields: ['Additional assessment findings:'],
    }),
  },
  elevated_temperature: {
    initial: ELEVATED_TEMPERATURE_INITIAL_TEMPLATE,
    follow_up: ELEVATED_TEMPERATURE_FOLLOW_UP_TEMPLATE,
    resolution: ELEVATED_TEMPERATURE_FOLLOW_UP_TEMPLATE,
    other: ELEVATED_TEMPERATURE_INITIAL_TEMPLATE,
  },
  uti: {
    initial: buildSubjectiveObjectiveAssessmentPlanTemplate({
      assessmentLabel: 'Urinary Tract Infection (UTI)',
      objectiveFields: ['Additional assessment findings:'],
    }),
    follow_up: buildSubjectiveObjectiveAssessmentPlanTemplate({
      assessmentLabel: 'Urinary Tract Infection (UTI) Follow-up',
      objectiveFields: ['Additional assessment findings:'],
    }),
    resolution: buildSubjectiveObjectiveAssessmentPlanTemplate({
      assessmentLabel: 'Urinary Tract Infection (UTI)',
      objectiveFields: ['Additional assessment findings:'],
    }),
  },
};

function buildDynamicTemplate(def: GuidelineDefinition): string {
  const objectiveFields = def.assessment.requiredFields.map((field) => `${field.label}:`);
  if (!objectiveFields.some((field) => /additional findings/i.test(field))) {
    objectiveFields.push('Additional findings:');
  }

  return buildSubjectiveObjectiveAssessmentPlanTemplate({
    assessmentLabel: def.displayName,
    objectiveFields,
  });
}

export function getFacilityFormTemplate(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string {
  const byGuideline = TEMPLATE_BY_GUIDELINE[def.id];
  const template =
    byGuideline?.[assessmentType]
    ?? byGuideline?.initial
    ?? byGuideline?.other;

  if (template) return template;
  return buildDynamicTemplate(def);
}

const SECTION_HEADER_PATTERN = /^(S|O|A|P|SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN):\s*$/i;

export function extractColonPromptsFromTemplate(template: string): string[] {
  return template
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.endsWith(':') && !SECTION_HEADER_PATTERN.test(line));
}

export function buildFillableTemplateBlock(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): string {
  const template = getFacilityFormTemplate(def, assessmentType);
  return `=== EXACT FILLABLE FACILITY TEMPLATE (preserve every line below) ===
${template}

Fill this template exactly in the SOAP JSON fields:
- soap.subjective = SUBJECTIVE section content only
- soap.objective = OBJECTIVE section content only (must include "See Interactive View Assessment." when present)
- soap.assessment = ASSESSMENT section content only
- soap.plan = PLAN section content only

If a colon-ended prompt has no supported value, keep the prompt visible and leave the value blank on the next line or after the colon.`;
}
