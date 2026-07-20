import type { AssessmentType } from './guidelines/facilityTemplateMode.ts';
import { lookupGuidelineDefinition } from './guidelines/guidelineDefinitions.ts';
import { buildDocumentationQualityCheck } from './guidelines/documentationQualityCheck.ts';
import { buildTemplateLockSchema, type TemplateLockValues } from './guidelines/templateLockMode.ts';
import {
  rerenderTemplateLockSoapWithStaffEducation,
  type NurseStaffEducationConfirmations,
} from './guidelines/staffEducationTemplateLock.ts';
import type { StaffEducationStructuredState } from './guidelines/staffEducationLibrary.ts';
import { formatSoapDocument } from './structuredDocumentation.ts';
import type { GuidelineId } from './guidelines/types.ts';

export interface NurseStaffEducationConfirmationsPayload {
  instructionProvided?: boolean;
  understandingConfirmed?: boolean;
}

export interface StaffEducationStatePayload {
  staffInstructionContent: string;
  staffInstructionProvided: boolean;
  staffUnderstandingConfirmed: boolean;
  staffUnderstandingMethod: string;
  suggestedStaffInstruction: string | null;
  instructionHelperDisplay: string;
}

export interface TemplateLockClientContextPayload {
  guidelineId: GuidelineId;
  assessmentType: AssessmentType;
  combinedInput: string;
  terminology: string;
  values: Record<string, unknown>;
}

export interface TemplateLockClientBundle {
  templateLockContext: TemplateLockClientContextPayload;
  staffEducation: StaffEducationStatePayload;
}

export function toStaffEducationState(state: StaffEducationStructuredState): StaffEducationStatePayload {
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
