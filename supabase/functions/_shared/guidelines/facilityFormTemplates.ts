import type { GuidelineDefinition } from './types.ts';
import type { AssessmentType } from './facilityTemplateMode.ts';

const STANDARD_PLAN_FIELDS = [
  'Nursing interventions completed:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
];

const STANDARD_FOLLOW_UP_PLAN = [
  'Nursing interventions completed:',
  'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
  'Staff verbalized or demonstrated understanding of instructions provided:',
];

function lines(...parts: string[]): string {
  return parts.join('\n');
}

function facilityTemplate(
  assessmentLabel: string,
  objectiveFields: string[],
  planLines: string[],
): string {
  return lines(
    'SUBJECTIVE:',
    '',
    'OBJECTIVE:',
    'See Interactive View Assessment.',
    ...objectiveFields,
    '',
    'ASSESSMENT:',
    assessmentLabel,
    '',
    'PLAN:',
    ...planLines,
  );
}

const PLAN_SECTION_HEADER = /^PLAN:\s*$/i;
const OTHER_SECTION_HEADER = /^(SUBJECTIVE|OBJECTIVE|ASSESSMENT|S|O|A|P):\s*$/i;

/** Extract every non-empty line from the PLAN section of a fillable facility template. */
export function extractPlanSectionLines(template: string): string[] {
  const rows = template.split('\n');
  const planIndex = rows.findIndex((line) => PLAN_SECTION_HEADER.test(line.trim()));
  if (planIndex === -1) return [];

  const planLines: string[] = [];
  for (let i = planIndex + 1; i < rows.length; i += 1) {
    const trimmed = rows[i].trim();
    if (!trimmed) continue;
    if (OTHER_SECTION_HEADER.test(trimmed)) break;
    planLines.push(trimmed);
  }
  return planLines;
}

export function extractPlanCompletionPrompts(template: string): string[] {
  return extractPlanSectionLines(template).filter((line) => line.endsWith(':'));
}

export function extractPlanStandingInstructions(template: string): string[] {
  return extractPlanSectionLines(template).filter(
    (line) => line.endsWith('.') && !/^See Interactive View Assessment\.?$/i.test(line),
  );
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

const GENERIC_TEMPLATE = facilityTemplate(
  'Other / General Nursing Assessment',
  ['Additional findings:'],
  STANDARD_FOLLOW_UP_PLAN,
);

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

const PAIN_INITIAL_TEMPLATE = facilityTemplate(
  'Pain',
  ['Pain level / pain scale:', 'Location or suspected location of pain, if known:', 'Response to intervention:'],
  [
    'Pain management interventions provided:',
    'Nursing follow-up to assess effectiveness of pain medication and monitor for side effects:',
    'Notify PCP for signs or symptoms of moderate to severe pain (pain score >4) or unresolved pain:',
    'Notify PCP if there is no improvement within 1 hour or abnormal findings are noted during assessment:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
  ],
);

const PAIN_FOLLOW_UP_TEMPLATE = facilityTemplate(
  'Pain',
  ['Pain medication effectiveness as evidenced by pain score change:', 'Response to intervention:'],
  [
    'Pain management results:',
    'Notify PCP if pain recurs or abnormal findings are noted during assessment:',
    'Notify PCP for moderate to severe pain (pain score >4) or unresolved pain:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
  ],
);

const UTI_INITIAL_TEMPLATE = facilityTemplate(
  'Symptoms of UTI',
  ['Signs and symptoms indicating UTI:', 'Analysis of Care Tracker intake and output:'],
  [
    'Nursing interventions completed:',
    'Continue nursing follow-up and monitor every shift until symptoms have resolved.',
    'Follow PCP orders:',
    'Nursing interventions to encourage fluid intake:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
    'Notify PCP if interventions are ineffective or abnormal findings are noted during assessment:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
    'Staff/DSP instructions regarding UTI symptoms:',
    'Staff/DSP instructions to promote fluid intake:',
  ],
);

const UTI_FOLLOW_UP_TEMPLATE = facilityTemplate(
  'Symptoms of UTI',
  [
    'Evaluation of signs and symptoms indicating UTI:',
    'Analysis of Care Tracker intake and output:',
    'Effectiveness of increased fluid intake:',
    'Effectiveness of pain medication (if applicable):',
  ],
  [
    'Nursing interventions completed:',
    'Continue nursing follow-up every shift until symptoms have resolved.',
    'Follow PCP orders:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
    'Notify PCP if interventions remain ineffective or abnormal findings are noted:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
    'Staff/DSP instructions regarding UTI symptoms:',
    'Staff/DSP instructions to promote fluid intake:',
  ],
);

const SKIN_IMPAIRMENT_INITIAL_TEMPLATE = facilityTemplate(
  'Skin Impairment',
  [
    'Description/location of skin impairment:',
    'Current use of anticoagulant or antiplatelet medications:',
    'Size of injury (Length × Width × Depth):',
  ],
  [
    'Post Injury Report (PIR) completed:',
    'Nursing interventions completed:',
    'Nursing to follow up at the ordered interval to assess skin status.',
    'Follow PCP orders:',
    'Notify PCP if declining skin status is noted during assessment, including redness, signs/symptoms of infection, or pain:',
    'Evaluate the effectiveness of the nursing plan and interventions:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
  ],
);

const SKIN_IMPAIRMENT_FOLLOW_UP_TEMPLATE = facilityTemplate(
  'Skin Impairment Follow-up',
  [
    'Current use of anticoagulant or antiplatelet medications:',
    'Current wound size (Length × Width × Depth):',
  ],
  [
    'Nursing interventions completed:',
    'Continue nursing follow-up at the ordered interval to assess skin status.',
    'Wound care interventions performed:',
    'Notify PCP if declining skin status is noted during assessment, including redness, signs/symptoms of infection, or pain:',
    'Evaluate the effectiveness of the nursing plan and interventions:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
  ],
);

const PICA_INITIAL_TEMPLATE = facilityTemplate(
  'Pica',
  ['Pica item ingested:'],
  [
    'Nursing interventions completed:',
    'Post Injury Report (PIR) completed:',
    'Nursing to follow up q 4 hrs x 72 hours to assess gastrointestinal and respiratory findings.',
    'Notify PCP of any abnormal findings noted during assessment:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
    'Staff instructed to monitor stools for blood and foreign bodies and to report to nurse.',
  ],
);

const PICA_FOLLOW_UP_TEMPLATE = facilityTemplate(
  'Pica',
  [
    'Stool description including whether or not blood or foreign bodies identified:',
    'Pica item ingested:',
  ],
  [
    'Nursing interventions completed:',
    'Nursing to follow up q 4 hrs x 72 hours to assess gastrointestinal and respiratory findings.',
    'Notify PCP of any abnormal findings noted during assessment:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
  ],
);

const GTUBE_INITIAL_TEMPLATE = facilityTemplate(
  'G-Tube Change',
  [],
  [
    'Nursing interventions completed:',
    'Type and size (French) of tube removed:',
    'Removed tube tip intact:',
    'Type and size (French) of tube inserted:',
    'Amount (mL) of sterile water used to inflate the balloon:',
    'Resident tolerated the procedure well:',
    'DSP informed the G-tube was changed and instructed to report redness, swelling, or drainage from the insertion site:',
    'Tube placement verification by auscultation of a 10 mL air bolus and/or visualization of gastric contents:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
  ],
);

const GTUBE_FOLLOW_UP_TEMPLATE = facilityTemplate(
  'G-Tube Change',
  ['Current use of anticoagulant or antiplatelet medications:'],
  [
    'Nursing interventions completed:',
    'Resident tolerated the procedure well:',
    'DSP informed the G-tube was changed and instructed to report redness, swelling, or drainage from the insertion site:',
    'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if additional follow-up is indicated:',
    'Staff verbalized or demonstrated understanding of instructions provided:',
  ],
);

function standardTemplate(assessmentLabel: string, objectiveFields: string[], planLines?: string[]) {
  return facilityTemplate(
    assessmentLabel,
    objectiveFields,
    planLines ?? STANDARD_FOLLOW_UP_PLAN,
  );
}

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
    initial: PAIN_INITIAL_TEMPLATE,
    follow_up: PAIN_FOLLOW_UP_TEMPLATE,
    resolution: PAIN_FOLLOW_UP_TEMPLATE,
    other: PAIN_INITIAL_TEMPLATE,
  },
  elevated_temperature: {
    initial: ELEVATED_TEMPERATURE_INITIAL_TEMPLATE,
    follow_up: ELEVATED_TEMPERATURE_FOLLOW_UP_TEMPLATE,
    resolution: ELEVATED_TEMPERATURE_FOLLOW_UP_TEMPLATE,
    other: ELEVATED_TEMPERATURE_INITIAL_TEMPLATE,
  },
  uti: {
    initial: UTI_INITIAL_TEMPLATE,
    follow_up: UTI_FOLLOW_UP_TEMPLATE,
    resolution: UTI_FOLLOW_UP_TEMPLATE,
    other: UTI_INITIAL_TEMPLATE,
  },
  skin_impairment: {
    initial: SKIN_IMPAIRMENT_INITIAL_TEMPLATE,
    follow_up: SKIN_IMPAIRMENT_FOLLOW_UP_TEMPLATE,
    resolution: SKIN_IMPAIRMENT_FOLLOW_UP_TEMPLATE,
    other: SKIN_IMPAIRMENT_INITIAL_TEMPLATE,
  },
  pica: {
    initial: PICA_INITIAL_TEMPLATE,
    follow_up: PICA_FOLLOW_UP_TEMPLATE,
    resolution: PICA_FOLLOW_UP_TEMPLATE,
    other: PICA_INITIAL_TEMPLATE,
  },
  enteral_tube_insertion: {
    initial: GTUBE_INITIAL_TEMPLATE,
    follow_up: GTUBE_FOLLOW_UP_TEMPLATE,
    resolution: GTUBE_FOLLOW_UP_TEMPLATE,
    other: GTUBE_INITIAL_TEMPLATE,
  },
  suspected_fracture_dislocation: {
    initial: standardTemplate('Suspected Fracture or Dislocation', ['Signs and symptoms:', 'Other assessment findings:'], [
      'Nursing interventions completed:',
      'Immobilization or splinting completed:',
      'Notify PCP for suspected fracture or dislocation:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Suspected Fracture or Dislocation Follow-up', ['Other assessment findings:']),
    resolution: standardTemplate('Suspected Fracture or Dislocation', ['Other assessment findings:']),
    other: standardTemplate('Suspected Fracture or Dislocation', ['Signs and symptoms:']),
  },
  adventitious_lung_sounds: {
    initial: standardTemplate('Adventitious Lung Sounds', ['Lung sounds:', 'Other assessment findings:'], [
      'Nursing interventions completed:',
      'Notify PCP of abnormal lung sounds or respiratory findings:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Adventitious Lung Sounds Follow-up', ['Lung sounds:']),
    resolution: standardTemplate('Adventitious Lung Sounds', ['Lung sounds:']),
    other: standardTemplate('Adventitious Lung Sounds', ['Lung sounds:']),
  },
  abdominal_distention_pain: {
    initial: standardTemplate('Abdominal Distention / Pain', ['Abdominal assessment findings:', 'Bowel status:'], [
      'Nursing interventions completed:',
      'Notify PCP of worsening abdominal distention, pain, or complications:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Abdominal Distention / Pain Follow-up', ['Abdominal assessment findings:']),
    resolution: standardTemplate('Abdominal Distention / Pain', ['Abdominal assessment findings:']),
    other: standardTemplate('Abdominal Distention / Pain', ['Abdominal assessment findings:']),
  },
  enteral_feeding_tolerance: {
    initial: standardTemplate('Enteral Feeding Tolerance', ['Enteral feeding rate:', 'Residuals:', 'Tolerance findings:'], [
      'Nursing interventions completed:',
      'Notify PCP of feeding intolerance or aspiration concerns:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Enteral Feeding Tolerance Follow-up', ['Enteral feeding rate:', 'Tolerance findings:']),
    resolution: standardTemplate('Enteral Feeding Tolerance', ['Tolerance findings:']),
    other: standardTemplate('Enteral Feeding Tolerance', ['Enteral feeding rate:']),
  },
  hypothermia: {
    initial: standardTemplate('Hypothermia', ['Current temperature:', 'Other assessment findings:'], [
      'Nursing interventions completed:',
      'Warming measures implemented:',
      'Notify PCP of persistent hypothermia or abnormal findings:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Hypothermia Follow-up', ['Current temperature:']),
    resolution: standardTemplate('Hypothermia', ['Current temperature:']),
    other: standardTemplate('Hypothermia', ['Current temperature:']),
  },
  hypoglycemia: {
    initial: standardTemplate('Hypoglycemia', ['Blood glucose:', 'Other assessment findings:'], [
      'Nursing interventions completed:',
      'Oral glucose or treatment administered:',
      'Blood glucose recheck result:',
      'Notify PCP of recurrent hypoglycemia or ineffective treatment:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Hypoglycemia Follow-up', ['Blood glucose:']),
    resolution: standardTemplate('Hypoglycemia', ['Blood glucose:']),
    other: standardTemplate('Hypoglycemia', ['Blood glucose:']),
  },
  hyperglycemia: {
    initial: standardTemplate('Hyperglycemia', ['Blood glucose:', 'Other assessment findings:'], [
      'Nursing interventions completed:',
      'Blood glucose treatment or insulin administered per orders:',
      'Notify PCP of persistent hyperglycemia or abnormal findings:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Hyperglycemia Follow-up', ['Blood glucose:']),
    resolution: standardTemplate('Hyperglycemia', ['Blood glucose:']),
    other: standardTemplate('Hyperglycemia', ['Blood glucose:']),
  },
  seizure: {
    initial: standardTemplate('Seizure', ['Seizure description:', 'Duration:', 'Post-ictal status:'], [
      'Breakthrough, standing, or PRN anti-epileptic medication administered:',
      'Nursing interventions completed:',
      'Notify PCP if indicated per seizure guideline:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Seizure Follow-up', ['Additional seizure activity:', 'Neurological status:']),
    resolution: standardTemplate('Seizure', ['Seizure activity:']),
    other: standardTemplate('Seizure', ['Seizure description:']),
  },
  transfer_out_back: {
    initial: standardTemplate('Transfer Out / Transfer Back', ['Transfer-back diagnosis:', 'Weight upon return:'], [
      'Nursing interventions completed:',
      'Monitor resident status compared with baseline after transfer back.',
      'Notify PCP of abnormal findings or failure to return to baseline:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Transfer Out / Transfer Back Follow-up', ['Current status compared with baseline:']),
    resolution: standardTemplate('Transfer Out / Transfer Back', ['Current status compared with baseline:']),
    other: standardTemplate('Transfer Out / Transfer Back', ['Transfer-back diagnosis:']),
  },
  post_sedation: {
    initial: standardTemplate('Post Sedation', ['Mental status:', 'Respiratory status:'], [
      'Nursing interventions completed:',
      'Medications received during sedation:',
      'Notify PCP of altered mental status, respiratory depression, or hypoxia:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Post Sedation Follow-up', ['Mental status:', 'Respiratory status:']),
    resolution: standardTemplate('Post Sedation', ['Mental status:']),
    other: standardTemplate('Post Sedation', ['Mental status:']),
  },
  post_anesthesia: {
    initial: standardTemplate('Post Anesthesia', ['Mental status:', 'Respiratory status:'], [
      'Nursing interventions completed:',
      'Medications received:',
      'Follow facility Post Anesthesia Guideline for ongoing monitoring after return.',
      'Notify PCP of altered mental status, respiratory depression, hypoxia, or complications:',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Post Anesthesia Follow-up', ['Mental status:', 'Respiratory status:']),
    resolution: standardTemplate('Post Anesthesia', ['Mental status:']),
    other: standardTemplate('Post Anesthesia', ['Mental status:']),
  },
  crisis_physical_restraint: {
    initial: standardTemplate('Crisis Physical Restraint', ['Behavior:', 'Restraint application time:'], [
      'Physical restraint application and removal times documented:',
      'Nursing interventions completed:',
      'Provider notification completed:',
      'Monitor resident continuously while restraint is in use per facility crisis restraint guideline.',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Crisis Physical Restraint Follow-up', ['Behavior:', 'Restraint status:']),
    resolution: standardTemplate('Crisis Physical Restraint', ['Behavior:']),
    other: standardTemplate('Crisis Physical Restraint', ['Behavior:']),
  },
  crisis_chemical_restraint: {
    initial: standardTemplate('Crisis Chemical Restraint', ['Behavior:', 'Medication administered:'], [
      'PRN or chemical restraint medication administered:',
      'Nursing interventions completed:',
      'Provider notification completed:',
      'Monitor medication effectiveness and adverse effects per crisis chemical restraint guideline.',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Crisis Chemical Restraint Follow-up', ['Behavior:', 'Sedation level:']),
    resolution: standardTemplate('Crisis Chemical Restraint', ['Behavior:']),
    other: standardTemplate('Crisis Chemical Restraint', ['Behavior:']),
  },
  crisis_mechanical_restraint: {
    initial: standardTemplate('Crisis Mechanical Restraint', ['Behavior:', 'Restraint application time:'], [
      'Mechanical restraint application and removal times documented:',
      'Nursing interventions completed:',
      'Provider notification completed:',
      'Monitor resident continuously while mechanical restraint is in use per facility guideline.',
      'Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if follow-up is indicated:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]),
    follow_up: standardTemplate('Crisis Mechanical Restraint Follow-up', ['Behavior:', 'Restraint status:']),
    resolution: standardTemplate('Crisis Mechanical Restraint', ['Behavior:']),
    other: standardTemplate('Crisis Mechanical Restraint', ['Behavior:']),
  },
};

function buildDynamicTemplate(def: GuidelineDefinition): string {
  const objectiveFields = def.assessment.requiredFields.map((field) => `${field.label}:`);
  if (!objectiveFields.some((field) => /additional findings/i.test(field))) {
    objectiveFields.push('Additional findings:');
  }

  return facilityTemplate(def.displayName, objectiveFields, STANDARD_FOLLOW_UP_PLAN);
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
