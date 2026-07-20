import type { GuidelineDefinition } from './types.ts';
import type { AssessmentType } from './facilityTemplateMode.ts';
import type { TemplateLockSchema, TemplateLockValues } from './templateLockMode.ts';
import {
  buildSuggestedStaffInstruction,
  detectStaffInstructionProvided,
  detectStaffUnderstandingMethod,
  parseStructuredBoolean,
  renderStaffUnderstandingConfirmationLine,
  resolveStaffInstructionContent,
  type StaffEducationStructuredState,
} from './staffEducationLibrary.ts';
import { detectStaffUnderstandingConfirmed } from './clinicalFactExtraction.ts';

export interface FinalizeStaffEducationOptions {
  autoGenerateStaffInstructionContent: boolean;
}

const DEFAULT_FINALIZE_OPTIONS: Required<FinalizeStaffEducationOptions> = {
  autoGenerateStaffInstructionContent: true,
};

export function finalizeStaffEducationValues(
  values: TemplateLockValues,
  schema: TemplateLockSchema,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  options?: FinalizeStaffEducationOptions,
): StaffEducationStructuredState {
  const resolvedOptions = {
    ...DEFAULT_FINALIZE_OPTIONS,
    ...options,
  };

  const hasStaffPrompt = schema.fields.some((field) => field.id === 'staffUnderstandingConfirmation');
  const resolved = resolveStaffInstructionContent(def, assessmentType);

  const instructionContent = resolvedOptions.autoGenerateStaffInstructionContent
    ? resolved.instructionText
    : values.plan.staffInstructionContent?.trim() || resolved.instructionText;

  const inputIndicatesProvision = detectStaffInstructionProvided(input);
  const aiIndicatesProvision = parseStructuredBoolean(values.plan.staffInstructionProvided);
  const staffInstructionProvided = aiIndicatesProvision || inputIndicatesProvision;

  const inputConfirmsUnderstanding = detectStaffUnderstandingConfirmed(input);
  const aiConfirmsUnderstanding = parseStructuredBoolean(values.plan.staffUnderstandingConfirmed);
  const staffUnderstandingConfirmed = aiConfirmsUnderstanding || inputConfirmsUnderstanding;

  const staffUnderstandingMethod = staffUnderstandingConfirmed
    ? values.plan.staffUnderstandingMethod?.trim() || detectStaffUnderstandingMethod(input)
    : '';

  values.plan.staffInstructionContent = instructionContent;
  values.plan.staffInstructionProvided = staffInstructionProvided ? 'true' : 'false';
  values.plan.staffUnderstandingConfirmed = staffUnderstandingConfirmed ? 'true' : 'false';
  values.plan.staffUnderstandingMethod = staffUnderstandingMethod;
  values.plan.staffEducationRuleId = resolved.rule.guidelineId;

  if (hasStaffPrompt) {
    values.plan.staffUnderstandingConfirmation = staffUnderstandingConfirmed
      ? renderStaffUnderstandingConfirmationLine(instructionContent, staffUnderstandingMethod)
      : '';
  }

  const suggestedStaffInstruction = buildSuggestedStaffInstruction(
    instructionContent,
    staffInstructionProvided,
  );

  return {
    staffInstructionContent: instructionContent,
    staffInstructionProvided,
    staffUnderstandingConfirmed,
    staffUnderstandingMethod,
    staffEducationRuleId: resolved.rule.guidelineId,
    suggestedStaffInstruction,
    requiresManualReview: resolved.requiresManualReview,
  };
}

export function readStaffEducationStructuredState(
  values: TemplateLockValues,
): StaffEducationStructuredState {
  const staffInstructionContent = values.plan.staffInstructionContent?.trim() ?? '';
  const staffInstructionProvided = parseStructuredBoolean(values.plan.staffInstructionProvided);
  const staffUnderstandingConfirmed = parseStructuredBoolean(values.plan.staffUnderstandingConfirmed);
  const staffUnderstandingMethod = values.plan.staffUnderstandingMethod?.trim() ?? '';
  return {
    staffInstructionContent,
    staffInstructionProvided,
    staffUnderstandingConfirmed,
    staffUnderstandingMethod,
    staffEducationRuleId: values.plan.staffEducationRuleId?.trim() ?? '',
    suggestedStaffInstruction: buildSuggestedStaffInstruction(
      staffInstructionContent,
      staffInstructionProvided,
    ),
    requiresManualReview: false,
  };
}
