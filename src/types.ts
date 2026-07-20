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

/** Optional additional documents generated alongside the SOAP note. */
export type OptionalOutputId = 'provider_notification_sbar' | 'lar_email';

/** Legacy output IDs retained for local rule-engine compatibility. */
export type OutputId =
  | 'soap_note'
  | OptionalOutputId
  | 'sbar'
  | 'nursing_progress_note'
  | 'provider_notification'
  | 'followup_guideline_note'
  | 'closing_guideline_note';

export interface GeneratedDocument {
  label: string;
  content: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type Terminology = 'resident' | 'patient' | 'client' | 'individual';
export type Language = 'english' | 'korean' | 'spanish';

export interface Settings {
  theme: ThemeMode;
  terminology: Terminology;
  language: Language;
  /** Auto-generate guideline-specific staff instruction content from the library. */
  autoCompleteStaffEducation: boolean;
  /** When enabled, "nursing interventions completed" may confirm staff instruction was provided. */
  autoConfirmStaffInstructionFromNursingInterventions: boolean;
}

export type MissingInfoCategory = 'facility_required' | 'clinically_useful' | 'conditional';

export interface MissingInfoItem {
  id: string;
  label: string;
  value: string;
  category?: MissingInfoCategory;
  critical?: boolean;
}

export interface QualityCheckItem {
  type: 'missing_information' | 'validation' | 'unsupported_removed';
  message: string;
}

export interface DocumentationCompletenessCheck {
  provided: string[];
  missing: string[];
  scorePercent?: number;
  categorizedMissing?: Array<{
    label: string;
    category: 'facility_required' | 'clinically_useful' | 'conditional';
    reason?: string;
  }>;
}

export interface DocumentationGenerationMeta {
  templateMode: string;
  edgeFunctionVersion: string;
  guideline: string;
  assessmentType: string;
  facilityInstructionsIncluded: boolean;
  pass2Ran?: boolean;
  fillableTemplateIncluded?: boolean;
}

export interface DocumentationQualityCheck {
  templateFollowed: boolean;
  unsupportedStatementsRemoved: string[];
  messages: string[];
  items?: QualityCheckItem[];
  completeness?: DocumentationCompletenessCheck;
}

export interface GenerationResult {
  /** Primary SOAP note (backward compatible). */
  documentation: string;
  documents: GeneratedDocument[];
  missingInfo: MissingInfoItem[];
}

export interface GenerationOptions {
  includeProviderNotification: boolean;
  includeLarEmail: boolean;
  autoCompleteStaffEducation?: boolean;
  autoConfirmStaffInstructionFromNursingInterventions?: boolean;
  nurseStaffEducationConfirmations?: NurseStaffEducationConfirmations;
}

export interface NurseStaffEducationConfirmations {
  instructionProvided: boolean;
  understandingConfirmed: boolean;
}

export interface StaffEducationState {
  staffInstructionContent: string;
  staffInstructionProvided: boolean;
  staffUnderstandingConfirmed: boolean;
  staffUnderstandingMethod: string;
  suggestedStaffInstruction: string | null;
  instructionHelperDisplay: string;
}

export interface TemplateLockClientContext {
  guidelineId: GuidelineId;
  assessmentType: string;
  combinedInput: string;
  terminology: string;
  values: Record<string, unknown>;
}
