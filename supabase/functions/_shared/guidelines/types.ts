/**
 * DEPLOY MIRROR — keep in sync with src/guidelines/
 * Supabase edge functions cannot import from src/ at deploy time.
 */

export type GuidelineId =
  | 'vomiting'
  | 'elevated_temperature'
  | 'uti'
  | 'fall'
  | 'head_injury'
  | 'suspected_fracture_dislocation'
  | 'pica'
  | 'skin_impairment'
  | 'respiratory'
  | 'adventitious_lung_sounds'
  | 'abdominal_distention_pain'
  | 'constipation'
  | 'diarrhea'
  | 'enteral_feeding_tolerance'
  | 'enteral_tube_insertion'
  | 'hypothermia'
  | 'hypoglycemia'
  | 'hyperglycemia'
  | 'medication_change'
  | 'seizure'
  | 'transfer_out_back'
  | 'post_sedation'
  | 'post_anesthesia'
  | 'crisis_physical_restraint'
  | 'crisis_chemical_restraint'
  | 'crisis_mechanical_restraint'
  | 'pain'
  | 'other';

/** Apply another facility guideline as supporting rules when trigger keywords match clinical text. */
export interface GuidelineCrossReferenceRule {
  guidelineId: GuidelineId;
  triggerKeywords: string[];
}

export interface GuidelineCrossReferenceRules {
  instructions: string;
  rules: GuidelineCrossReferenceRule[];
}

export type DocumentationTypeId =
  | 'initial_assessment'
  | 'follow_up_assessment'
  | 'resolution_assessment'
  | 'soap_note'
  | 'sbar'
  | 'lar_guardian_email'
  | 'provider_notification'
  | 'provider_notification_sbar';

export type MissingInfoCategory = 'facility_required' | 'clinically_useful' | 'conditional';

export interface AssessmentField {
  id: string;
  label: string;
  description?: string;
  critical?: boolean;
  category?: MissingInfoCategory;
  conditionalWhen?: string;
  matchKeywords?: string[];
}

export interface DocumentationTypeInstructions {
  applicable: boolean;
  instructions: string;
}

export interface FollowUpRequirements {
  frequency: string;
  monitoringPoints: string[];
  reassessmentCriteria: string[];
  instructions: string;
}

export interface ResolutionCriteria {
  applicable: boolean;
  criteria: string[];
  instructions: string;
}

export interface NotificationRules {
  providerNotification: string;
  larGuardianNotification: string;
  triggers: string[];
  prohibitedAutoNotifications: string[];
}

export interface EducationRequirements {
  residentInstructions: string;
  staffInstructions: string;
  larGuardianInstructions: string;
}

export interface GuidelineAssessmentDefinition {
  requiredFields: AssessmentField[];
  optionalFields: AssessmentField[];
}

export interface GuidelineDocumentationDefinition {
  initialAssessment: DocumentationTypeInstructions;
  followUpAssessment: DocumentationTypeInstructions;
  resolutionAssessment: DocumentationTypeInstructions;
  soapNote: DocumentationTypeInstructions;
  sbar: DocumentationTypeInstructions;
  larGuardianEmail: DocumentationTypeInstructions;
  providerNotification: DocumentationTypeInstructions;
}

export interface GuidelineDefinition {
  id: GuidelineId;
  displayName: string;
  description: string;
  assessment: GuidelineAssessmentDefinition;
  missingInformationChecklist: AssessmentField[];
  documentation: GuidelineDocumentationDefinition;
  followUpRequirements: FollowUpRequirements;
  resolutionCriteria: ResolutionCriteria;
  notificationRules: NotificationRules;
  educationRequirements: EducationRequirements;
  prohibitedAssumptions: string[];
  terminologyRules: string;
  crossReferenceRules?: GuidelineCrossReferenceRules;
}

export interface GuidelineUiMeta {
  emoji: string;
}

export interface DocumentationTypeMeta {
  id: DocumentationTypeId;
  label: string;
  legacyLabels: string[];
}
