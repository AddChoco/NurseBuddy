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
  NotificationRules,
  ResolutionCriteria,
} from './types.ts';

export {
  DOCUMENTATION_TYPES,
  DOCUMENTATION_TYPE_BY_ID,
  LEGACY_OUTPUT_LABEL_TO_DOC_TYPE,
  resolveDocumentationTypeId,
  getDocumentationTypeLabel,
} from './documentationTypes.ts';

export {
  PLACEHOLDER_PREFIX,
  placeholderDescription,
  placeholderInstruction,
  placeholderListItem,
  isPlaceholderContent,
  filterPlaceholderItems,
  formatItemList,
} from './placeholders.ts';

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
} from './guidelineEngine.ts';

export {
  buildStage1ExtractionInstructions,
  buildStage1ExtractionUserPrompt,
  parseClinicalExtraction,
  buildSubjectiveText,
  EMPTY_CLINICAL_EXTRACTION,
} from './clinicalExtraction.ts';
export type { ClinicalExtraction, ReporterInfo } from './clinicalExtraction.ts';

export { getFacilityFormTemplate } from './facilityFormTemplates.ts';
export { formatFacilityForm } from './facilityFormFormatter.ts';

export {
  buildGuidelinePlanLibraryBlock,
  getGuidelinePlanLibraryEntry,
  validatePlanAgainstLibrary,
  listGuidelinePlanLibraryIds,
} from './guidelinePlanLibrary.ts';
export type { GuidelinePlanLibraryEntry } from './guidelinePlanLibrary.ts';

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
} from './guidelineDefinitions.ts';
