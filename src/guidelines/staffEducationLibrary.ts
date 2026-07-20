import type { GuidelineId } from '../types';
import type { AssessmentType } from './facilityTemplateMode';
import type { GuidelineDefinition } from './types';
import { GUIDELINE_DEFINITIONS } from './guidelineDefinitions';
import {
  extractPlanStandingInstructions,
  getFacilityFormTemplate,
} from './facilityFormTemplates';
import {
  detectNursingInterventionsCompleted,
  detectStaffUnderstandingConfirmed,
} from './clinicalFactExtraction';
import { HEAD_INJURY_STAFF_MONITORING_INSTRUCTIONS } from './guidelineRequirementConfigs';
import { FALL_FOLLOW_UP_STAFF_MONITORING_INSTRUCTIONS } from './fallPlanConstants';

export type StaffEducationRule = {
  guidelineId: GuidelineId;
  assessmentTypes?: AssessmentType[];
  instructionTopics: string[];
  instructionText: string;
  urgentReportText?: string;
  conditionalInstructions?: {
    when: string;
    instructionText: string;
  }[];
  /** Flag when facility source does not provide enough standing monitoring language */
  requiresManualReview?: boolean;
  sourcePlanStatements?: string[];
};

export const STAFF_EDUCATION_RULES: Record<GuidelineId, StaffEducationRule> = {
  vomiting: {
    guidelineId: 'vomiting',
    instructionTopics: [
      'recurrent emesis',
      'nausea',
      'aspiration symptoms',
      'dehydration',
      'decreased intake/output',
      'abdominal changes',
      'gastric bleeding',
    ],
    instructionText:
      'Monitor for recurrent vomiting, nausea, aspiration symptoms, decreased intake/output, dehydration, abdominal changes, or gastric bleeding and report changes to the nurse immediately.',
    sourcePlanStatements: [
      'Assess every shift for 24 hours after resident is symptom free.',
      'Notify oncoming nurse if follow-up is needed.',
    ],
  },
  elevated_temperature: {
    guidelineId: 'elevated_temperature',
    instructionTopics: [
      'temperature',
      'chills',
      'fatigue',
      'behavior change',
      'respiratory symptoms',
      'decreased intake/output',
      'vomiting',
      'signs of infection',
    ],
    instructionText:
      'Monitor temperature as directed, encourage fluids as tolerated, observe for chills, fatigue, behavior change, respiratory symptoms, decreased intake/output, vomiting, signs of infection, or recurrence of elevated temperature and report changes immediately.',
    sourcePlanStatements: [
      'Continue temperature assessments according to the Elevated Temperature Guideline.',
      'Fluids encouraged as tolerated.',
    ],
  },
  fall: {
    guidelineId: 'fall',
    instructionTopics: [
      'pain',
      'swelling',
      'bruising',
      'bleeding',
      'neurological or mental status change',
      'nausea',
      'vomiting',
      'dizziness',
      'weakness',
      'mobility change',
    ],
    instructionText:
      'Reinforce fall precautions and monitor for pain, swelling, bruising, bleeding, altered behavior, change in mobility, delayed injury symptoms, or other changes from baseline and report concerns immediately.',
    sourcePlanStatements: [FALL_FOLLOW_UP_STAFF_MONITORING_INSTRUCTIONS],
  },
  head_injury: {
    guidelineId: 'head_injury',
    instructionTopics: [
      'level of consciousness',
      'drowsiness',
      'confusion',
      'headache',
      'nausea/vomiting',
      'dizziness',
      'vision changes',
      'pupils',
      'weakness',
      'seizure activity',
      'bleeding',
      'bruising',
      'swelling',
    ],
    instructionText:
      'Monitor for change in level of consciousness, unusual drowsiness, worsening headache, vomiting, dizziness, seizure activity, unequal pupils, abnormal behavior, weakness, or other neurological changes and notify the nurse immediately.',
    sourcePlanStatements: [HEAD_INJURY_STAFF_MONITORING_INSTRUCTIONS],
  },
  pain: {
    guidelineId: 'pain',
    instructionTopics: [
      'pain location',
      'pain severity',
      'comfort measures',
      'medication response',
      'worsening pain',
      'new symptoms',
      'functional change',
    ],
    instructionText:
      'Monitor location and severity of pain, comfort measures, medication response when applicable, worsening pain, new symptoms, or change in function and report concerns to the nurse.',
    sourcePlanStatements: [
      'Nursing follow-up to assess effectiveness of pain medication and monitor for side effects:',
    ],
  },
  respiratory: {
    guidelineId: 'respiratory',
    instructionTopics: [
      'work of breathing',
      'respiratory rate',
      'oxygen saturation',
      'wheezing',
      'coughing',
      'secretions',
      'cyanosis',
      'responsiveness',
    ],
    instructionText:
      'Monitor work of breathing, respiratory rate, oxygen saturation when ordered, wheezing, coughing, secretions, cyanosis, reduced responsiveness, or worsening respiratory distress and notify the nurse immediately.',
    requiresManualReview: true,
  },
  uti: {
    guidelineId: 'uti',
    instructionTopics: [
      'temperature',
      'urine characteristics',
      'urinary discomfort',
      'output',
      'flank or abdominal discomfort',
      'behavior change',
      'intake',
      'infection signs',
    ],
    instructionText:
      'Monitor temperature, urine characteristics when observable, urinary discomfort, decreased output, abdominal or flank discomfort, altered behavior, intake, and signs of worsening infection and report changes.',
    requiresManualReview: true,
  },
  suspected_fracture_dislocation: {
    guidelineId: 'suspected_fracture_dislocation',
    instructionTopics: [
      'pain',
      'swelling',
      'neurovascular status',
      'immobilization',
      'mobility change',
    ],
    instructionText:
      'Monitor pain, swelling, neurovascular status, immobilization integrity, and mobility changes and report worsening pain, numbness, tingling, or circulation changes to the nurse immediately.',
    requiresManualReview: true,
  },
  skin_impairment: {
    guidelineId: 'skin_impairment',
    instructionTopics: [
      'redness',
      'warmth',
      'swelling',
      'drainage',
      'pain',
      'skin breakdown',
      'fever',
      'spread of affected area',
    ],
    instructionText:
      'Monitor redness, warmth, swelling, drainage, pain, skin breakdown, fever, spread of affected area, and report changes immediately.',
    requiresManualReview: true,
  },
  adventitious_lung_sounds: {
    guidelineId: 'adventitious_lung_sounds',
    instructionTopics: [
      'lung sounds',
      'respiratory rate',
      'oxygen needs',
      'cough',
      'secretions',
      'respiratory distress',
    ],
    instructionText:
      'Monitor lung sounds, respiratory rate, oxygen needs, cough, secretions, and worsening respiratory distress and report changes to the nurse immediately.',
    requiresManualReview: true,
  },
  abdominal_distention_pain: {
    guidelineId: 'abdominal_distention_pain',
    instructionTopics: [
      'abdominal pain',
      'distention',
      'bowel status',
      'nausea',
      'vomiting',
      'appetite',
    ],
    instructionText:
      'Monitor abdominal pain, distention, bowel status, nausea, vomiting, appetite, and worsening abdominal symptoms and report changes to the nurse immediately.',
    requiresManualReview: true,
  },
  constipation: {
    guidelineId: 'constipation',
    instructionTopics: [
      'bowel movements',
      'abdominal discomfort',
      'distention',
      'appetite',
      'vomiting',
      'stool output',
    ],
    instructionText:
      'Monitor bowel movements, abdominal discomfort or distention, appetite, vomiting, stool output, response to ordered interventions, and report worsening symptoms.',
    requiresManualReview: true,
  },
  diarrhea: {
    guidelineId: 'diarrhea',
    instructionTopics: [
      'stool frequency',
      'stool character',
      'intake/output',
      'hydration',
      'abdominal symptoms',
      'fever',
      'blood in stool',
      'skin integrity',
    ],
    instructionText:
      'Monitor frequency and character of stools, intake/output, hydration, abdominal symptoms, fever, blood in stool, skin integrity, and worsening symptoms and report changes.',
    requiresManualReview: true,
  },
  enteral_feeding_tolerance: {
    guidelineId: 'enteral_feeding_tolerance',
    instructionTopics: [
      'feeding tolerance',
      'residuals',
      'vomiting',
      'distention',
      'aspiration signs',
    ],
    instructionText:
      'Monitor feeding tolerance, residuals, emesis, abdominal distention, aspiration signs, and feeding intolerance and report changes to the nurse immediately.',
    requiresManualReview: true,
  },
  enteral_tube_insertion: {
    guidelineId: 'enteral_tube_insertion',
    instructionTopics: [
      'insertion site redness',
      'swelling',
      'drainage',
      'leakage',
      'tube displacement',
      'feeding intolerance',
      'vomiting',
      'abdominal distention',
    ],
    instructionText:
      'Monitor the tube site for redness, swelling, drainage, leakage, displacement, feeding intolerance, vomiting, abdominal distention, or other complications and report changes.',
    requiresManualReview: true,
  },
  hypothermia: {
    guidelineId: 'hypothermia',
    instructionTopics: [
      'temperature',
      'shivering',
      'behavior change',
      'skin condition',
      'warming response',
    ],
    instructionText:
      'Monitor temperature, shivering, behavior change, skin condition, and response to warming measures and report continued hypothermia or worsening symptoms.',
    requiresManualReview: true,
  },
  hypoglycemia: {
    guidelineId: 'hypoglycemia',
    instructionTopics: [
      'blood glucose',
      'sweating',
      'shakiness',
      'confusion',
      'weakness',
      'altered mental status',
    ],
    instructionText:
      'Monitor blood glucose as directed, hypoglycemia signs such as sweating, shakiness, confusion, weakness, or altered mental status, and report recurrent low readings or behavioral changes.',
    requiresManualReview: true,
  },
  hyperglycemia: {
    guidelineId: 'hyperglycemia',
    instructionTopics: [
      'blood glucose',
      'polyuria',
      'polydipsia',
      'hydration',
      'ketosis signs',
    ],
    instructionText:
      'Monitor blood glucose as directed, hydration, intake/output, and signs of persistent hyperglycemia or ketosis and report changes to the nurse.',
    requiresManualReview: true,
  },
  medication_change: {
    guidelineId: 'medication_change',
    instructionTopics: [
      'medication response',
      'side effects',
      'adverse reactions',
      'missed doses',
      'behavior change',
    ],
    instructionText:
      'Monitor medication response, side effects, adverse reactions, missed doses, and behavior changes related to the medication change and report concerns to the nurse.',
    requiresManualReview: true,
  },
  pica: {
    guidelineId: 'pica',
    instructionTopics: [
      'ingestion events',
      'choking',
      'stool monitoring',
      'foreign bodies',
      'environmental safety',
    ],
    instructionText:
      'Monitor for ingestion or choking events, inspect stools for foreign bodies or blood when applicable, maintain environmental safety, and report any ingestion or behavioral change immediately.',
    requiresManualReview: true,
  },
  seizure: {
    guidelineId: 'seizure',
    instructionTopics: [
      'seizure duration',
      'seizure characteristics',
      'recovery',
      'injury',
      'breathing difficulty',
      'recurrent seizure activity',
    ],
    instructionText:
      'Follow seizure safety precautions; observe and report seizure duration, characteristics, recovery, injury, breathing difficulty, repeated seizure activity, or change from baseline.',
    requiresManualReview: true,
  },
  transfer_out_back: {
    guidelineId: 'transfer_out_back',
    instructionTopics: [
      'new orders',
      'post-transfer symptoms',
      'wound or device changes',
      'behavior change',
      'discharge instructions',
    ],
    instructionText:
      'Monitor for changes from hospital discharge instructions, new symptoms, medication or order changes, wound or device concerns, and behavior changes and report concerns to the nurse.',
    requiresManualReview: true,
  },
  post_sedation: {
    guidelineId: 'post_sedation',
    instructionTopics: [
      'level of consciousness',
      'airway status',
      'respiratory rate',
      'oxygen saturation',
      'delayed recovery',
    ],
    instructionText:
      'Monitor level of consciousness, airway status, respiratory rate, oxygen saturation when ordered, and delayed recovery from sedation and report respiratory depression or worsening sedation immediately.',
    requiresManualReview: true,
  },
  post_anesthesia: {
    guidelineId: 'post_anesthesia',
    instructionTopics: [
      'level of consciousness',
      'pain',
      'nausea',
      'vomiting',
      'respiratory changes',
      'surgical site',
    ],
    instructionText:
      'Monitor level of consciousness, pain, nausea, vomiting, respiratory changes, and surgical site concerns after anesthesia and report uncontrolled pain or respiratory compromise immediately.',
    requiresManualReview: true,
  },
  crisis_physical_restraint: {
    guidelineId: 'crisis_physical_restraint',
    instructionTopics: [
      'circulation',
      'skin integrity',
      'respiratory status',
      'behavior',
      'restraint intervals',
    ],
    instructionText:
      'Monitor restraint intervals, circulation, skin integrity, respiratory status, and behavioral changes per the crisis physical restraint guideline and report agitation, injury, or decompensation immediately.',
    requiresManualReview: true,
  },
  crisis_chemical_restraint: {
    guidelineId: 'crisis_chemical_restraint',
    instructionTopics: [
      'sedation level',
      'respiratory status',
      'behavior change',
      'oversedation',
    ],
    instructionText:
      'Monitor sedation level, respiratory status, and behavior changes after chemical restraint and report oversedation or respiratory compromise immediately.',
    requiresManualReview: true,
  },
  crisis_mechanical_restraint: {
    guidelineId: 'crisis_mechanical_restraint',
    instructionTopics: [
      'circulation',
      'skin integrity',
      'behavior',
      'release criteria',
      'injury',
    ],
    instructionText:
      'Monitor mechanical restraint fit, circulation, skin integrity, behavior, and release criteria per the crisis mechanical restraint guideline and report injury or behavioral escalation immediately.',
    requiresManualReview: true,
  },
  other: {
    guidelineId: 'other',
    instructionTopics: [
      'worsening symptoms',
      'fever',
      'respiratory changes',
      'intake/output',
      'behavior change',
      'pain',
      'baseline change',
    ],
    instructionText:
      'Monitor for worsening symptoms, fever, respiratory changes, decreased intake/output, altered behavior, pain, or change from baseline and report changes immediately.',
    requiresManualReview: true,
  },
};

const ASSESSMENT_TYPE_OVERRIDES: Partial<
  Record<GuidelineId, Partial<Record<AssessmentType, Partial<StaffEducationRule>>>>
> = {
  elevated_temperature: {
    follow_up: {
      instructionText:
        'Monitor for increased temperature, chills, fatigue, change in behavior, respiratory symptoms, decreased intake/output, vomiting, or any change from baseline and report changes to the nurse immediately.',
      sourcePlanStatements: [
        'DSP instructed to monitor for and immediately report increased temperature, chills, fatigue, change in behavior, respiratory symptoms, decreased intake/output, vomiting, or any change from baseline.',
      ],
    },
    resolution: {
      instructionText:
        'Monitor for increased temperature, chills, fatigue, change in behavior, respiratory symptoms, decreased intake/output, vomiting, or any change from baseline and report changes to the nurse immediately.',
    },
  },
  fall: {
    follow_up: {
      instructionText:
        'Monitor for pain, swelling, bruising, bleeding, change in neurological or mental status, nausea, vomiting, dizziness, weakness, difficulty with mobility, or any other change from baseline and report concerns immediately.',
      sourcePlanStatements: [FALL_FOLLOW_UP_STAFF_MONITORING_INSTRUCTIONS],
    },
    resolution: {
      instructionText:
        'Monitor for pain, swelling, bruising, bleeding, change in neurological or mental status, nausea, vomiting, dizziness, weakness, difficulty with mobility, or any other change from baseline and report concerns immediately.',
      sourcePlanStatements: [FALL_FOLLOW_UP_STAFF_MONITORING_INSTRUCTIONS],
    },
  },
  head_injury: {
    initial: {
      instructionText:
        'Monitor for change in level of consciousness, increased drowsiness, new confusion, worsening headache, nausea/vomiting, dizziness, vision changes, unequal or nonreactive pupils, weakness, seizure activity, bleeding, bruising, swelling, or any other change from baseline and notify the nurse immediately.',
      sourcePlanStatements: [HEAD_INJURY_STAFF_MONITORING_INSTRUCTIONS],
    },
    other: {
      instructionText:
        'Monitor for change in level of consciousness, increased drowsiness, new confusion, worsening headache, nausea/vomiting, dizziness, vision changes, unequal or nonreactive pupils, weakness, seizure activity, bleeding, bruising, swelling, or any other change from baseline and notify the nurse immediately.',
      sourcePlanStatements: [HEAD_INJURY_STAFF_MONITORING_INSTRUCTIONS],
    },
  },
};

export const STAFF_EDUCATION_PROVIDED_PATTERNS: RegExp[] = [
  /\bstaff instructed\b/i,
  /\bdsp instructed\b/i,
  /\beducation provided\b/i,
  /\bstaff education completed\b/i,
  /\bnursing interventions including staff education\b/i,
  /직원에게\s*교육(?:함|했)/i,
  /dsp(?:에게|한테)\s*.*(?:설명|교육)(?:함|했)/i,
  /모니터(?:하고|하)?\s*.*보고(?:하)?(?:도록)?\s*설명(?:함|했)/i,
];

/** When true, explicit "nursing interventions completed" supports staffInstructionProvided. */
export const NURSING_INTERVENTIONS_COMPLETED_INDICATES_STAFF_INSTRUCTION_PROVIDED = true;

export function getStaffEducationRule(
  guidelineId: GuidelineId,
  assessmentType: AssessmentType,
): StaffEducationRule {
  const base = STAFF_EDUCATION_RULES[guidelineId];
  const override = ASSESSMENT_TYPE_OVERRIDES[guidelineId]?.[assessmentType];
  if (!override) return base;
  return {
    ...base,
    ...override,
    instructionTopics: override.instructionTopics ?? base.instructionTopics,
    sourcePlanStatements: override.sourcePlanStatements ?? base.sourcePlanStatements,
  };
}

export function getGuidelineIdsWithoutStaffEducationRules(): GuidelineId[] {
  return GUIDELINE_DEFINITIONS.map((def) => def.id).filter((id) => !STAFF_EDUCATION_RULES[id]);
}

export function adaptStandingInstructionToStaffEducation(line: string): string {
  let text = line.trim().replace(/\.$/, '');
  text = text.replace(/^DSP\/staff instructed to monitor for and immediately report /i, 'Monitor for ');
  text = text.replace(/^DSP instructed to monitor for and immediately report /i, 'Monitor for ');
  text = text.replace(/^Staff instructed to monitor for and immediately report /i, 'Monitor for ');
  if (!/report changes/i.test(text)) {
    text += ' and report changes to the nurse immediately.';
  }
  return text.endsWith('.') ? text : `${text}.`;
}

export function resolveStaffInstructionContent(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
): {
  rule: StaffEducationRule;
  instructionText: string;
  sourcePlanStatements: string[];
  requiresManualReview: boolean;
} {
  const rule = getStaffEducationRule(def.id, assessmentType);
  const template = getFacilityFormTemplate(def, assessmentType);
  const standing = extractPlanStandingInstructions(template);
  const monitoringLines = standing.filter((line) =>
    /dsp|staff instructed|monitor for and immediately report/i.test(line),
  );

  if (monitoringLines.length > 0) {
    return {
      rule,
      instructionText: adaptStandingInstructionToStaffEducation(monitoringLines[0]),
      sourcePlanStatements: monitoringLines,
      requiresManualReview: Boolean(rule.requiresManualReview),
    };
  }

  return {
    rule,
    instructionText: rule.instructionText,
    sourcePlanStatements: rule.sourcePlanStatements ?? [],
    requiresManualReview: Boolean(rule.requiresManualReview),
  };
}

export function detectStaffInstructionProvided(input: string): boolean {
  if (STAFF_EDUCATION_PROVIDED_PATTERNS.some((pattern) => pattern.test(input))) return true;
  if (
    NURSING_INTERVENTIONS_COMPLETED_INDICATES_STAFF_INSTRUCTION_PROVIDED
    && detectNursingInterventionsCompleted(input)
  ) {
    return true;
  }
  return false;
}

export function detectStaffUnderstandingMethod(input: string): string {
  if (!detectStaffUnderstandingConfirmed(input)) return '';
  if (/\bdemonstrated\b/i.test(input) && /\bverbalized\b/i.test(input)) {
    return 'verbalized and demonstrated';
  }
  if (/\bdemonstrated\b/i.test(input)) return 'demonstrated';
  return 'verbalized';
}

export function parseStructuredBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes';
}

export function renderStaffUnderstandingConfirmationLine(
  instructionContent: string,
  method: string,
): string {
  const normalizedMethod = method.trim() || 'verbalized';
  const body = instructionContent
    .trim()
    .replace(/\.$/, '')
    .replace(/^Monitor for /i, 'monitor for ')
    .replace(/\band report changes to the nurse immediately\.?$/i, 'and to report changes immediately');
  return `Staff ${normalizedMethod} understanding of instructions to ${body}.`;
}

export interface StaffEducationStructuredState {
  staffInstructionContent: string;
  staffInstructionProvided: boolean;
  staffUnderstandingConfirmed: boolean;
  staffUnderstandingMethod: string;
  staffEducationRuleId: string;
  suggestedStaffInstruction: string | null;
  requiresManualReview: boolean;
}

export function buildSuggestedStaffInstruction(
  instructionContent: string,
  staffInstructionProvided: boolean,
): string | null {
  if (staffInstructionProvided || !instructionContent.trim()) return null;
  return instructionContent.trim();
}

export interface StaffEducationCoverageRow {
  guidelineId: GuidelineId;
  displayName: string;
  assessmentType: AssessmentType;
  ruleFound: boolean;
  ruleId: string;
  sourcePlanStatements: string[];
  requiresManualReview: boolean;
}

const COVERAGE_ASSESSMENT_TYPES: AssessmentType[] = ['initial', 'follow_up', 'resolution', 'other'];

export function buildStaffEducationCoverageTable(): StaffEducationCoverageRow[] {
  return GUIDELINE_DEFINITIONS.flatMap((def) =>
    COVERAGE_ASSESSMENT_TYPES.map((assessmentType) => {
      const resolved = resolveStaffInstructionContent(def, assessmentType);
      return {
        guidelineId: def.id,
        displayName: def.displayName,
        assessmentType,
        ruleFound: Boolean(STAFF_EDUCATION_RULES[def.id]),
        ruleId: resolved.rule.guidelineId,
        sourcePlanStatements: resolved.sourcePlanStatements,
        requiresManualReview: resolved.requiresManualReview,
      };
    }),
  );
}
