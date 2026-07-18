import type { GuidelineId } from '../types';

/** Apply another facility guideline as supporting rules when trigger keywords match clinical text. */
export interface GuidelineCrossReferenceRule {
  guidelineId: GuidelineId;
  triggerKeywords: string[];
}

export interface GuidelineCrossReferenceRules {
  instructions: string;
  rules: GuidelineCrossReferenceRule[];
}

/** Canonical documentation types supported by the guideline engine. */
export type DocumentationTypeId =
  | 'initial_assessment'
  | 'follow_up_assessment'
  | 'resolution_assessment'
  | 'soap_note'
  | 'sbar'
  | 'lar_guardian_email'
  | 'provider_notification'
  | 'provider_notification_sbar';

/** Missing-information priority category for UI and detection behavior. */
export type MissingInfoCategory = 'facility_required' | 'clinically_useful' | 'conditional';

export interface AssessmentField {
  id: string;
  label: string;
  description?: string;
  /** When true, prioritized on the missing-information checklist. */
  critical?: boolean;
  /** Missing-information category used for detection and UI grouping. */
  category?: MissingInfoCategory;
  /** Human-readable condition for conditional fields (e.g. "PCP notified or abnormal findings present"). */
  conditionalWhen?: string;
  /** Keywords used by the missing-information checker (English, Korean, Spanish). */
  matchKeywords?: string[];
}

export interface DocumentationTypeInstructions {
  /** Whether this documentation type applies to the guideline (e.g. resolution). */
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

/**
 * Structured facility guideline template.
 * Add a new guideline by appending one entry to GUIDELINE_DEFINITIONS.
 */
export interface GuidelineDefinition {
  id: GuidelineId;
  displayName: string;
  description: string;
  assessment: GuidelineAssessmentDefinition;
  /** Fields to review when input appears incomplete. */
  missingInformationChecklist: AssessmentField[];
  documentation: GuidelineDocumentationDefinition;
  followUpRequirements: FollowUpRequirements;
  resolutionCriteria: ResolutionCriteria;
  notificationRules: NotificationRules;
  educationRequirements: EducationRequirements;
  prohibitedAssumptions: string[];
  terminologyRules: string;
  /** Supporting facility guidelines applied when complication-related trigger keywords are present. */
  crossReferenceRules?: GuidelineCrossReferenceRules;
}

export interface GuidelineUiMeta {
  emoji: string;
}

export interface DocumentationTypeMeta {
  id: DocumentationTypeId;
  label: string;
  /** Current UI output labels mapped to this documentation type. */
  legacyLabels: string[];
}
