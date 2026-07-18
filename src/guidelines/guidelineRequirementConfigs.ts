import type { GuidelineId } from '../types';
import type { AssessmentType } from './facilityTemplateMode';

export type AssessmentFieldKey =
  | 'eventTime'
  | 'reporterName'
  | 'reporterTitle'
  | 'mechanism'
  | 'headImpact'
  | 'headImpactLocation'
  | 'painAssessment'
  | 'lossOfConsciousness'
  | 'vitalSigns'
  | 'neurologicalAssessment'
  | 'pupilAssessment'
  | 'visibleInjury'
  | 'anticoagulantOrAntiplateletUse'
  | 'providerNotification'
  | 'LARNotification'
  | 'pirStatus'
  | 'nursingInterventionStatus'
  | 'staffEducation';

export interface GuidelineRequirementConfig {
  guidelineId: GuidelineId;
  assessmentTypes: AssessmentType[];
  requiredAssessmentFields: AssessmentFieldKey[];
  requiredPlanElements: string[];
  staffMonitoringInstructions?: string;
  /** Used when severity-specific schedule is not established in input */
  monitoringScheduleFallback: string;
  anticoagulantPlanNote?: string;
  guidelineNameInPlan: string;
  assessmentLabel: string;
}

export const HEAD_INJURY_STAFF_MONITORING_INSTRUCTIONS =
  'DSP instructed to monitor for and immediately report any change in level of consciousness, increased drowsiness, new confusion, worsening headache, nausea/vomiting, dizziness, vision changes, unequal or nonreactive pupils, weakness, seizure activity, bleeding, bruising, swelling, or any other change from baseline.';

export const HEAD_INJURY_INITIAL_CONFIG: GuidelineRequirementConfig = {
  guidelineId: 'head_injury',
  assessmentTypes: ['initial', 'other'],
  requiredAssessmentFields: [
    'eventTime',
    'mechanism',
    'headImpactLocation',
    'painAssessment',
    'lossOfConsciousness',
    'vitalSigns',
    'neurologicalAssessment',
    'pupilAssessment',
    'visibleInjury',
    'anticoagulantOrAntiplateletUse',
    'providerNotification',
    'LARNotification',
  ],
  requiredPlanElements: [
    'PIR status',
    'nursing intervention status',
    'neurological monitoring schedule',
    'staff monitoring instructions',
    'immediate reporting instructions',
    'fall or safety precautions when applicable',
    'provider and LAR notification status',
  ],
  staffMonitoringInstructions: HEAD_INJURY_STAFF_MONITORING_INSTRUCTIONS,
  monitoringScheduleFallback: 'Continue neurological assessments according to the facility Head Injury Guideline.',
  anticoagulantPlanNote:
    'Due to current {medication} use, maintain close observation for bleeding or neurological changes.',
  guidelineNameInPlan: 'Head Injury Guideline',
  assessmentLabel: 'Head injury',
};

export const FALL_INITIAL_CONFIG: GuidelineRequirementConfig = {
  guidelineId: 'fall',
  assessmentTypes: ['initial', 'other'],
  requiredAssessmentFields: [
    'eventTime',
    'reporterTitle',
    'mechanism',
    'painAssessment',
    'visibleInjury',
    'vitalSigns',
    'neurologicalAssessment',
    'headImpact',
    'lossOfConsciousness',
    'anticoagulantOrAntiplateletUse',
    'providerNotification',
    'LARNotification',
  ],
  requiredPlanElements: [
    'PIR status',
    'nursing intervention status',
    'staff monitoring instructions',
    'provider and LAR notification status',
  ],
  monitoringScheduleFallback: 'Continue follow-up assessments according to the applicable fall guideline.',
  guidelineNameInPlan: 'fall guideline',
  assessmentLabel: 'Unwitnessed fall',
};

const CONFIGS: GuidelineRequirementConfig[] = [
  HEAD_INJURY_INITIAL_CONFIG,
  FALL_INITIAL_CONFIG,
];

export function getGuidelineRequirementConfig(
  guidelineId: GuidelineId,
  assessmentType: AssessmentType,
): GuidelineRequirementConfig | undefined {
  return CONFIGS.find(
    (config) =>
      config.guidelineId === guidelineId
      && config.assessmentTypes.includes(assessmentType),
  );
}

export function hasDeterministicDocumentationConfig(
  guidelineId: GuidelineId,
  assessmentType: AssessmentType,
): boolean {
  return Boolean(getGuidelineRequirementConfig(guidelineId, assessmentType));
}
