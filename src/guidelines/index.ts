export type {
  AssessmentField,
  DocumentationTypeId,
  DocumentationTypeMeta,
  EducationRequirements,
  FollowUpRequirements,
  GuidelineAssessmentDefinition,
  GuidelineDefinition,
  GuidelineDocumentationDefinition,
  GuidelineUiMeta,
  GuidelineCrossReferenceRule,
  GuidelineCrossReferenceRules,
  MissingInfoCategory,
  NotificationRules,
  ResolutionCriteria,
} from './types';

export {
  DOCUMENTATION_TYPES,
  DOCUMENTATION_TYPE_BY_ID,
  LEGACY_OUTPUT_LABEL_TO_DOC_TYPE,
  resolveDocumentationTypeId,
  getDocumentationTypeLabel,
} from './documentationTypes';

export {
  PLACEHOLDER_PREFIX,
  placeholderDescription,
  placeholderInstruction,
  placeholderListItem,
  isPlaceholderContent,
  filterPlaceholderItems,
  formatItemList,
} from './placeholders';

export {
  fieldFromLabel,
  fieldsFromLabels,
  getRequiredAssessmentAreaLabels,
  getOptionalAssessmentAreaLabels,
  getMissingInformationChecklistLabels,
  getCriticalMissingFieldLabels,
  getDocumentationTypeInstructions,
  getDocumentationInstructionsByOutputLabel,
  isDocumentationTypeApplicable,
  buildGuidelineContextBlock,
  buildGuidelineDocumentationInstructionBlock,
  getFieldMatchKeywords,
  getActiveCrossReferenceRules,
  getReviewAreaLabels,
  findGuidelineDefForArea,
} from './guidelineEngine';

export {
  detectAssessmentType,
  inferMissingInfoCategory,
  shouldCheckMissingField,
  getFieldByLabel,
  FACILITY_TEMPLATE_MODE_INSTRUCTIONS,
} from './facilityTemplateMode';

export {
  buildStage1ExtractionInstructions,
  buildStage1ExtractionUserPrompt,
  parseClinicalExtraction,
  buildSubjectiveText,
  EMPTY_CLINICAL_EXTRACTION,
} from './clinicalExtraction';
export type { ClinicalExtraction, ReporterInfo } from './clinicalExtraction';

export { buildFillableTemplateBlock, extractColonPromptsFromTemplate } from './facilityFormTemplates';
export {
  DEFAULT_DOCUMENTATION_OUTPUT_MODE,
  resolveDocumentationOutputMode,
  isFacilityTemplateMode,
  FACILITY_TEMPLATE_COMPLETION_DIRECTIVE,
  FACILITY_TEMPLATE_PLAN_RULES,
} from './facilityTemplateMode';
export { formatFacilityForm } from './facilityFormFormatter';

export {
  buildGuidelinePlanLibraryBlock,
  getGuidelinePlanLibraryEntry,
  validatePlanAgainstLibrary,
  listGuidelinePlanLibraryIds,
} from './guidelinePlanLibrary';
export type { GuidelinePlanLibraryEntry } from './guidelinePlanLibrary';

export {
  GUIDELINE_DEFINITIONS,
  GUIDELINE_BY_ID,
  GUIDELINE_UI_META,
  lookupGuidelineDefinition,
  lookupGuidelineByDisplayName,
  getGuidelineDefinition,
  getGuidelineByDisplayName,
  getOutputInstructionField,
  getLegacyRequiredAssessmentAreas,
} from './guidelineDefinitions';
