import type { GuidelineDefinition } from './types';
import type { AssessmentType } from './facilityTemplateMode';
import type { TemplateLockSchema, TemplateLockValues } from './templateLockMode';
import { renderTemplateLockSoap } from './templateLockMode';
import {
  buildSuggestedStaffInstruction,
  buildStaffInstructionHelperDisplay,
  detectStaffInstructionProvided,
  detectStaffUnderstandingMethod,
  parseStructuredBoolean,
  renderStaffUnderstandingConfirmationLine,
  resolveStaffInstructionContent,
  type StaffEducationStructuredState,
} from './staffEducationLibrary';
import { detectStaffUnderstandingConfirmed } from './clinicalFactExtraction';

export interface NurseStaffEducationConfirmations {
  instructionProvided?: boolean;
  understandingConfirmed?: boolean;
}

export interface FinalizeStaffEducationOptions {
  autoGenerateStaffInstructionContent: boolean;
  autoConfirmStaffInstructionFromNursingInterventions: boolean;
  nurseConfirmations?: NurseStaffEducationConfirmations;
}

const DEFAULT_FINALIZE_OPTIONS: Required<Omit<FinalizeStaffEducationOptions, 'nurseConfirmations'>> = {
  autoGenerateStaffInstructionContent: true,
  autoConfirmStaffInstructionFromNursingInterventions: false,
};

function resolveStaffInstructionProvided(
  input: string,
  values: TemplateLockValues,
  options: FinalizeStaffEducationOptions,
): boolean {
  if (options.nurseConfirmations?.instructionProvided === true) return true;
  if (options.nurseConfirmations?.instructionProvided === false) return false;
  if (parseStructuredBoolean(values.plan.staffInstructionProvided)) return true;
  return detectStaffInstructionProvided(input, {
    autoConfirmFromNursingInterventions: options.autoConfirmStaffInstructionFromNursingInterventions,
  });
}

function resolveStaffUnderstandingConfirmed(
  input: string,
  values: TemplateLockValues,
  options: FinalizeStaffEducationOptions,
): boolean {
  if (options.nurseConfirmations?.understandingConfirmed === true) return true;
  if (options.nurseConfirmations?.understandingConfirmed === false) return false;
  if (parseStructuredBoolean(values.plan.staffUnderstandingConfirmed)) return true;
  return detectStaffUnderstandingConfirmed(input);
}

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

  let staffInstructionProvided = resolveStaffInstructionProvided(input, values, resolvedOptions);
  const staffUnderstandingConfirmed = resolveStaffUnderstandingConfirmed(input, values, resolvedOptions);

  if (staffUnderstandingConfirmed && resolvedOptions.nurseConfirmations?.instructionProvided !== false) {
    staffInstructionProvided = true;
  }

  const staffUnderstandingMethod = staffInstructionProvided && staffUnderstandingConfirmed
    ? values.plan.staffUnderstandingMethod?.trim() || detectStaffUnderstandingMethod(input) || 'verbalized'
    : '';

  values.plan.staffInstructionContent = instructionContent;
  values.plan.staffInstructionProvided = staffInstructionProvided ? 'true' : 'false';
  values.plan.staffUnderstandingConfirmed = staffUnderstandingConfirmed ? 'true' : 'false';
  values.plan.staffUnderstandingMethod = staffUnderstandingMethod;
  values.plan.staffEducationRuleId = resolved.rule.guidelineId;

  if (hasStaffPrompt) {
    values.plan.staffUnderstandingConfirmation =
      staffInstructionProvided && staffUnderstandingConfirmed
        ? renderStaffUnderstandingConfirmationLine(instructionContent, staffUnderstandingMethod)
        : '';
  }

  const suggestedStaffInstruction = buildSuggestedStaffInstruction(
    instructionContent,
    staffInstructionProvided,
    staffUnderstandingConfirmed,
  );

  return {
    staffInstructionContent: instructionContent,
    staffInstructionProvided,
    staffUnderstandingConfirmed,
    staffUnderstandingMethod,
    staffEducationRuleId: resolved.rule.guidelineId,
    suggestedStaffInstruction,
    instructionHelperDisplay: buildStaffInstructionHelperDisplay(instructionContent),
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
      staffUnderstandingConfirmed,
    ),
    instructionHelperDisplay: buildStaffInstructionHelperDisplay(staffInstructionContent),
    requiresManualReview: false,
  };
}

export function applyNurseStaffEducationConfirmations(
  values: TemplateLockValues,
  schema: TemplateLockSchema,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  nurseConfirmations: NurseStaffEducationConfirmations,
  options?: Omit<FinalizeStaffEducationOptions, 'nurseConfirmations'>,
): StaffEducationStructuredState {
  return finalizeStaffEducationValues(values, schema, input, def, assessmentType, {
    ...DEFAULT_FINALIZE_OPTIONS,
    ...options,
    nurseConfirmations,
  });
}

export function rerenderTemplateLockSoapWithStaffEducation(args: {
  values: TemplateLockValues;
  schema: TemplateLockSchema;
  input: string;
  def: GuidelineDefinition;
  assessmentType: AssessmentType;
  nurseConfirmations: NurseStaffEducationConfirmations;
  autoGenerateStaffInstructionContent?: boolean;
  autoConfirmStaffInstructionFromNursingInterventions?: boolean;
}): {
  values: TemplateLockValues;
  soap: ReturnType<typeof renderTemplateLockSoap>;
  staffEducation: StaffEducationStructuredState;
} {
  const workingValues = {
    subjective: { ...args.values.subjective },
    objective: { ...args.values.objective },
    assessment: { ...args.values.assessment },
    plan: { ...args.values.plan },
  };

  const staffEducation = finalizeStaffEducationValues(
    workingValues,
    args.schema,
    args.input,
    args.def,
    args.assessmentType,
    {
      autoGenerateStaffInstructionContent: args.autoGenerateStaffInstructionContent ?? true,
      autoConfirmStaffInstructionFromNursingInterventions:
        args.autoConfirmStaffInstructionFromNursingInterventions ?? false,
      nurseConfirmations: args.nurseConfirmations,
    },
  );

  return {
    values: workingValues,
    soap: renderTemplateLockSoap(args.schema, workingValues),
    staffEducation,
  };
}
