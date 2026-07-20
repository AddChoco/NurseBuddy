import type { AssessmentType } from '../guidelines/facilityTemplateMode';
import { lookupGuidelineDefinition } from '../guidelines/guidelineDefinitions';
import { buildDocumentationQualityCheck } from '../guidelines/documentationQualityCheck';
import { buildTemplateLockSchema, type TemplateLockValues } from '../guidelines/templateLockMode';
import {
  rerenderTemplateLockSoapWithStaffEducation,
  type NurseStaffEducationConfirmations,
} from '../guidelines/staffEducationTemplateLock';
import type { StaffEducationStructuredState } from '../guidelines/staffEducationLibrary';
import { formatSoapDocument } from './structuredDocumentation';
import type {
  DocumentationQualityCheck,
  GuidelineId,
  NurseStaffEducationConfirmations as UiNurseStaffEducationConfirmations,
  StaffEducationState,
  TemplateLockClientContext,
} from '../types';

export interface TemplateLockClientBundle {
  templateLockContext: TemplateLockClientContext;
  staffEducation: StaffEducationState;
}

export function toStaffEducationState(state: StaffEducationStructuredState): StaffEducationState {
  return {
    staffInstructionContent: state.staffInstructionContent,
    staffInstructionProvided: state.staffInstructionProvided,
    staffUnderstandingConfirmed: state.staffUnderstandingConfirmed,
    staffUnderstandingMethod: state.staffUnderstandingMethod,
    suggestedStaffInstruction: state.suggestedStaffInstruction,
    instructionHelperDisplay: state.instructionHelperDisplay,
  };
}

export function buildTemplateLockClientBundle(args: {
  guidelineId: GuidelineId;
  assessmentType: AssessmentType;
  combinedInput: string;
  terminology: string;
  values: TemplateLockValues;
  staffEducation: StaffEducationStructuredState;
}): TemplateLockClientBundle {
  return {
    templateLockContext: {
      guidelineId: args.guidelineId,
      assessmentType: args.assessmentType,
      combinedInput: args.combinedInput,
      terminology: args.terminology,
      values: args.values as unknown as Record<string, unknown>,
    },
    staffEducation: toStaffEducationState(args.staffEducation),
  };
}

export function hydrateTemplateLockValues(context: TemplateLockClientContext): TemplateLockValues {
  return context.values as unknown as TemplateLockValues;
}

export function rerenderSoapWithNurseStaffEducation(args: {
  context: TemplateLockClientContext;
  nurseConfirmations: UiNurseStaffEducationConfirmations;
  autoGenerateStaffInstructionContent: boolean;
  autoConfirmStaffInstructionFromNursingInterventions: boolean;
  existingSoap?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}): {
  soapText: string;
  soap: ReturnType<typeof rerenderTemplateLockSoapWithStaffEducation>['soap'];
  staffEducation: StaffEducationState;
  qualityCheck: DocumentationQualityCheck;
  templateLockContext: TemplateLockClientContext;
} {
  const def = lookupGuidelineDefinition(args.context.guidelineId);
  const assessmentType = args.context.assessmentType as AssessmentType;
  const schema = buildTemplateLockSchema(def, assessmentType);
  const values = hydrateTemplateLockValues(args.context);
  const nurseConfirmations: NurseStaffEducationConfirmations = {
    instructionProvided: args.nurseConfirmations.instructionProvided,
    understandingConfirmed: args.nurseConfirmations.understandingConfirmed,
  };

  const rerendered = rerenderTemplateLockSoapWithStaffEducation({
    values,
    schema,
    input: args.context.combinedInput,
    def,
    assessmentType,
    nurseConfirmations,
    autoGenerateStaffInstructionContent: args.autoGenerateStaffInstructionContent,
    autoConfirmStaffInstructionFromNursingInterventions:
      args.autoConfirmStaffInstructionFromNursingInterventions,
  });

  const soap = {
    ...rerendered.soap,
    subjective: rerendered.soap.subjective,
    objective: rerendered.soap.objective,
    assessment: rerendered.soap.assessment,
    plan: rerendered.soap.plan,
  };

  const completeness = buildDocumentationQualityCheck({
    input: args.context.combinedInput,
    soap,
    def,
    assessmentType,
    templateLockValues: rerendered.values,
    templateLockSchema: schema,
  });

  return {
    soapText: formatSoapDocument(soap),
    soap,
    staffEducation: toStaffEducationState(rerendered.staffEducation),
    qualityCheck: {
      templateFollowed: true,
      unsupportedStatementsRemoved: [],
      messages: [],
      completeness,
    },
    templateLockContext: {
      ...args.context,
      values: rerendered.values as unknown as Record<string, unknown>,
    },
  };
}
