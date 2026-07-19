import type { GuidelineDefinition } from './guidelines/types.ts';
import {
  detectAssessmentType,
  type AssessmentType,
  type DocumentationOutputMode,
  DEFAULT_DOCUMENTATION_OUTPUT_MODE,
  FACILITY_TEMPLATE_MODE_INSTRUCTIONS,
  isFacilityTemplateMode,
  resolveDocumentationOutputMode,
  resolveFacilityTemplateOptions,
  type FacilityTemplateOptions,
} from './guidelines/facilityTemplateMode.ts';
import {
  buildGuidelineContextBlock,
  getAssessmentInstructionsForType,
  getDocumentationTypeInstructions,
} from './guidelines/guidelineEngine.ts';
import { lookupGuidelineByDisplayName } from './guidelines/guidelineDefinitions.ts';
import { buildGuidelinePlanLibraryBlock } from './guidelines/guidelinePlanLibrary.ts';
import { buildFillableTemplateBlock, getFacilityFormTemplate } from './guidelines/facilityFormTemplates.ts';
import { extractClinicalFacts } from './guidelines/clinicalFactExtraction.ts';
import {
  assertFacilityTemplateInstructionsPresent,
  buildGenerationMeta,
  EDGE_FUNCTION_VERSION,
  FACILITY_TEMPLATE_MODE_MARKER,
  type GenerationMeta,
} from './generationMeta.ts';
import {
  parseStructuredDocumentation,
  formatSoapDocument,
  formatSbarDocument,
  resolveTerminology,
  type StructuredDocumentationResponse,
  type ValidatedStructuredDocumentation,
  validateAiDocumentationOutput,
  buildPass1GenerationInstructions,
  buildPass1GenerationUserPrompt,
  buildPass2ReviewInstructions,
  buildPass2ReviewUserPrompt,
  toDocumentationQualityCheck,
} from './structuredDocumentation.ts';
import {
  buildTemplateLockDocumentation,
  buildTemplateLockPass1Instructions,
  buildTemplateLockPass1UserPrompt,
  buildTemplateLockPass2Instructions,
  buildTemplateLockPass2UserPrompt,
  buildTemplateLockSchema,
  emptyTemplateLockValues,
  parseTemplateLockResponse,
  parseTemplateLockSbar,
  type TemplateLockValues,
} from './guidelines/templateLockMode.ts';

export interface PromptDebugInfo {
  facilityTemplateMode: boolean;
  facilityTemplateModeInstructionsIncluded: boolean;
  selectedGuideline: string;
  assessmentType: AssessmentType;
  fillableTemplateText: string;
  finalInstructionLength: number;
  finalInstructions: string;
  pass1Input: string;
}

export function shouldLogPromptDebug(): boolean {
  if (typeof Deno !== 'undefined') {
    return Deno.env.get('DOCUMENTATION_PROMPT_DEBUG') === '1';
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) return true;
  return false;
}

export function logPromptDebug(info: PromptDebugInfo): void {
  if (!shouldLogPromptDebug()) return;
  console.info('[documentation-prompt-debug]', JSON.stringify({
    facilityTemplateMode: info.facilityTemplateMode,
    facilityTemplateModeInstructionsIncluded: info.facilityTemplateModeInstructionsIncluded,
    selectedGuideline: info.selectedGuideline,
    assessmentType: info.assessmentType,
    fillableTemplateText: info.fillableTemplateText,
    finalInstructionLength: info.finalInstructionLength,
    finalInstructions: info.finalInstructions,
    pass1Input: info.pass1Input,
  }, null, 2));
}

export function buildCompleteGuidelineTemplateBlock(
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  outputMode: DocumentationOutputMode = DEFAULT_DOCUMENTATION_OUTPUT_MODE,
): string {
  const assessmentInstructions = getAssessmentInstructionsForType(def, assessmentType);
  const soapNote = getDocumentationTypeInstructions(def, "soap_note");
  const sbar = getDocumentationTypeInstructions(def, "sbar");
  const providerNotification = getDocumentationTypeInstructions(def, "provider_notification");
  const facilityTemplateMode = isFacilityTemplateMode(outputMode);

  const fillableTemplateBlock = facilityTemplateMode
    ? `\n${buildFillableTemplateBlock(def, assessmentType)}\n`
    : '';
  const planLibraryBlock = `\n${buildGuidelinePlanLibraryBlock(def, assessmentType)}`;

  return `COMPLETE SELECTED FACILITY GUIDELINE TEMPLATE
Guideline: ${def.displayName}
Assessment type: ${assessmentType}
Output mode: ${outputMode}
${fillableTemplateBlock}
=== PRIMARY ASSESSMENT TEMPLATE (reference guidance) ===
${assessmentInstructions.instructions}

=== SOAP NOTE GUIDANCE ===
${soapNote.instructions}

=== SBAR / PROVIDER NOTIFICATION GUIDANCE ===
${sbar.instructions}

=== PROVIDER NOTIFICATION RULES ===
${providerNotification.instructions}

=== FULL GUIDELINE CONTEXT (follow-up, notifications, education, prohibited assumptions) ===
${buildGuidelineContextBlock(def)}${planLibraryBlock}`;
}

export interface AiGenerationContext {
  def: GuidelineDefinition;
  assessmentType: AssessmentType;
  combinedInput: string;
  clinicalInfo: string;
  supplementText: string;
  terminology: string;
  includeSbar: boolean;
  outputMode: DocumentationOutputMode;
  guidelineTemplate: string;
  fillableTemplateText: string;
  templateOptions: ReturnType<typeof resolveFacilityTemplateOptions>;
}

export function buildAiGenerationContext(
  guidelineDisplayName: string,
  clinicalInfo: string,
  supplementText: string,
  terminology: string | undefined,
  includeSbar: boolean,
  outputMode?: DocumentationOutputMode,
  templateOptions?: FacilityTemplateOptions,
): AiGenerationContext {
  const def = lookupGuidelineByDisplayName(guidelineDisplayName);
  if (!def) {
    throw new Error(`No facility guideline definition found for "${guidelineDisplayName}".`);
  }

  const combinedInput = [clinicalInfo, supplementText !== "None provided." ? supplementText : ""]
    .filter(Boolean)
    .join("\n");
  const assessmentType = detectAssessmentType(combinedInput);
  const resolvedOutputMode = resolveDocumentationOutputMode(outputMode);

  return {
    def,
    assessmentType,
    combinedInput,
    clinicalInfo,
    supplementText,
    terminology: resolveTerminology(terminology),
    includeSbar,
    outputMode: resolvedOutputMode,
    fillableTemplateText: getFacilityFormTemplate(def, assessmentType),
    guidelineTemplate: buildCompleteGuidelineTemplateBlock(def, assessmentType, resolvedOutputMode),
    templateOptions: resolveFacilityTemplateOptions(templateOptions),
  };
}

export function buildPromptDebugInfo(
  context: AiGenerationContext,
  pass1Instructions: string,
  pass1Input: string,
): PromptDebugInfo {
  return {
    facilityTemplateMode: isFacilityTemplateMode(context.outputMode),
    facilityTemplateModeInstructionsIncluded: pass1Instructions.includes('FACILITY TEMPLATE COMPLETION MODE'),
    selectedGuideline: context.def.displayName,
    assessmentType: context.assessmentType,
    fillableTemplateText: context.fillableTemplateText,
    finalInstructionLength: pass1Instructions.length,
    finalInstructions: pass1Instructions,
    pass1Input,
  };
}

function finalizeValidatedResult(
  parsed: StructuredDocumentationResponse,
  input: string,
  def: GuidelineDefinition,
  assessmentType: AssessmentType,
  validation: ReturnType<typeof validateAiDocumentationOutput>,
): ValidatedStructuredDocumentation {
  return {
    soap: parsed.soap,
    soapText: formatSoapDocument(parsed.soap),
    sbar: parsed.sbar ?? undefined,
    sbarText: parsed.sbar ? formatSbarDocument(parsed.sbar) : undefined,
    qualityCheck: validation.qualityCheckItems,
    completeness: validation.completeness,
  };
}

async function runTemplateLockGeneration(
  callOpenAI: (instructions: string, input: string, temperature?: number) => Promise<string>,
  context: AiGenerationContext,
  includeSbar: boolean,
): Promise<{
  parsed: StructuredDocumentationResponse;
  pass2Ran: boolean;
  templateLockValues: TemplateLockValues;
  templateLockSchema: ReturnType<typeof buildTemplateLockSchema>;
}> {
  const schema = buildTemplateLockSchema(context.def, context.assessmentType);
  const pass1Instructions = buildTemplateLockPass1Instructions(
    context.def,
    context.terminology,
    context.assessmentType,
    includeSbar,
  );
  const pass1Input = buildTemplateLockPass1UserPrompt(context.clinicalInfo, context.supplementText);
  const pass1Raw = await callOpenAI(pass1Instructions, pass1Input, 0.35);

  let pass2Ran = false;
  let workingRaw = pass1Raw;
  let parseResult = parseTemplateLockResponse(workingRaw, schema);
  let built = buildTemplateLockDocumentation({
    schema,
    aiValues: parseResult.values,
    input: context.combinedInput,
    def: context.def,
    assessmentType: context.assessmentType,
    terminology: context.terminology,
  });

  const needsPass2 =
    parseResult.errors.length > 0
    || parseResult.unknownKeys.length > 0
    || built.validationErrors.length > 0;

  if (needsPass2) {
    pass2Ran = true;
    const pass2Instructions = buildTemplateLockPass2Instructions(context.def, context.assessmentType);
    const pass2Input = buildTemplateLockPass2UserPrompt({
      sourceNarrative: context.combinedInput,
      draftValues: built.values,
      validationErrors: [
        ...parseResult.errors,
        ...parseResult.unknownKeys.map((key) => `Unknown key: ${key}`),
        ...built.validationErrors,
      ],
    });
    workingRaw = await callOpenAI(pass2Instructions, pass2Input, 0.2);
    parseResult = parseTemplateLockResponse(workingRaw, schema);
    built = buildTemplateLockDocumentation({
      schema,
      aiValues: parseResult.values,
      input: context.combinedInput,
      def: context.def,
      assessmentType: context.assessmentType,
      terminology: context.terminology,
    });

    if (
      parseResult.errors.length > 0
      || parseResult.unknownKeys.length > 0
      || built.validationErrors.length > 0
    ) {
      throw new Error(
        `Template lock validation failed after pass 2: ${[
          ...parseResult.errors,
          ...parseResult.unknownKeys.map((key) => `Unknown key: ${key}`),
          ...built.validationErrors,
        ].join(' | ')}`,
      );
    }
  }

  const sbar = includeSbar ? parseTemplateLockSbar(workingRaw) : null;
  const parsed: StructuredDocumentationResponse = {
    soap: built.soap,
    sbar,
    qualityCheckCompleteness: { provided: [], missing: [] },
  };

  return {
    parsed,
    pass2Ran,
    templateLockValues: built.values,
    templateLockSchema: schema,
  };
}

export async function generateAiDocumentationBundle(
  callOpenAI: (instructions: string, input: string, temperature?: number) => Promise<string>,
  guidelineDisplayName: string,
  clinicalInfo: string,
  supplementText: string,
  terminology: string | undefined,
  includeSbar: boolean,
  outputMode?: DocumentationOutputMode,
  templateOptions?: FacilityTemplateOptions,
): Promise<{
  validated: ValidatedStructuredDocumentation;
  qualityCheck: ReturnType<typeof toDocumentationQualityCheck>;
  generationMeta: GenerationMeta;
  pass2Ran: boolean;
}> {
  const context = buildAiGenerationContext(
    guidelineDisplayName,
    clinicalInfo,
    supplementText,
    terminology,
    includeSbar,
    outputMode,
    templateOptions,
  );

  if (isFacilityTemplateMode(context.outputMode)) {
    const templateLockPass1Instructions = buildTemplateLockPass1Instructions(
      context.def,
      context.terminology,
      context.assessmentType,
      includeSbar,
    );
    const templateLockPass1Input = buildTemplateLockPass1UserPrompt(
      context.clinicalInfo,
      context.supplementText,
    );

    logPromptDebug(buildPromptDebugInfo(context, templateLockPass1Instructions, templateLockPass1Input));
    console.log({
      edgeFunctionVersion: EDGE_FUNCTION_VERSION,
      facilityTemplateMode: true,
      templateLockMode: true,
      facilityInstructionsIncluded: templateLockPass1Instructions.includes('TEMPLATE LOCK MODE'),
      guideline: context.def.displayName,
      assessmentType: context.assessmentType,
      promptLength: templateLockPass1Instructions.length,
    });

    const templateLockResult = await runTemplateLockGeneration(
      callOpenAI,
      context,
      includeSbar,
    );
    const finalValidation = validateAiDocumentationOutput(
      templateLockResult.parsed,
      context.combinedInput,
      context.def,
      context.assessmentType,
      context.outputMode,
      context.templateOptions,
      context.terminology,
      {
        values: templateLockResult.templateLockValues,
        schema: templateLockResult.templateLockSchema,
        skipSoapSectionEnrichment: true,
      },
    );

    if (!finalValidation.isValid) {
      throw new Error(
        `Facility template validation failed after template lock render: ${finalValidation.errors.join(' | ')}`,
      );
    }

    const validated = finalizeValidatedResult(
      templateLockResult.parsed,
      context.combinedInput,
      context.def,
      context.assessmentType,
      finalValidation,
    );
    const generationMeta = buildGenerationMeta({
      guideline: context.def.displayName,
      assessmentType: context.assessmentType,
      facilityInstructionsIncluded: true,
      pass2Ran: templateLockResult.pass2Ran,
      fillableTemplateIncluded: true,
    });

    return {
      validated,
      qualityCheck: toDocumentationQualityCheck(validated, finalValidation),
      generationMeta,
      pass2Ran: templateLockResult.pass2Ran,
    };
  }

  const pass1Instructions = buildPass1GenerationInstructions(
    context.def,
    context.terminology,
    context.assessmentType,
    context.guidelineTemplate,
    includeSbar,
    context.outputMode,
    context.templateOptions,
  );
  const pass1Input = buildPass1GenerationUserPrompt(
    context.clinicalInfo,
    context.supplementText,
    includeSbar,
    context.outputMode,
  );

  logPromptDebug(buildPromptDebugInfo(context, pass1Instructions, pass1Input));
  console.log({
    edgeFunctionVersion: EDGE_FUNCTION_VERSION,
    facilityTemplateMode: isFacilityTemplateMode(context.outputMode),
    templateLockMode: false,
    facilityInstructionsIncluded: pass1Instructions.includes(FACILITY_TEMPLATE_MODE_MARKER),
    guideline: context.def.displayName,
    assessmentType: context.assessmentType,
    promptLength: pass1Instructions.length,
  });

  const pass1Raw = await callOpenAI(pass1Instructions, pass1Input, 0.35);
  const pass1Parsed = parseStructuredDocumentation(pass1Raw);
  if (!pass1Parsed) {
    throw new Error('AI returned invalid structured documentation JSON on pass 1.');
  }

  let finalParsed = pass1Parsed;
  let pass2Ran = false;
  let finalValidation = validateAiDocumentationOutput(
    pass1Parsed,
    context.combinedInput,
    context.def,
    context.assessmentType,
    context.outputMode,
    context.templateOptions,
    context.terminology,
  );

  if (!finalValidation.isValid) {
    pass2Ran = true;
    const pass2Instructions = buildPass2ReviewInstructions(
      context.terminology,
      includeSbar,
      context.outputMode,
    );
    const pass2Input = buildPass2ReviewUserPrompt({
      sourceNarrative: context.combinedInput,
      guidelineTemplate: context.guidelineTemplate,
      draftJson: JSON.stringify(pass1Parsed, null, 2),
      validationErrors: finalValidation.errors,
      includeSbar,
      outputMode: context.outputMode,
    });

    const pass2Raw = await callOpenAI(pass2Instructions, pass2Input, 0.2);
    const pass2Parsed = parseStructuredDocumentation(pass2Raw);
    if (!pass2Parsed) {
      throw new Error('AI returned invalid structured documentation JSON on pass 2.');
    }

    finalParsed = pass2Parsed;
    finalValidation = validateAiDocumentationOutput(
      pass2Parsed,
      context.combinedInput,
      context.def,
      context.assessmentType,
      context.outputMode,
      context.templateOptions,
      context.terminology,
    );

    if (!finalValidation.isValid && isFacilityTemplateMode(context.outputMode)) {
      throw new Error(
        `Facility template validation failed after pass 2: ${finalValidation.errors.join(' | ')}`,
      );
    }

    if (!finalValidation.isValid) {
      console.warn('AI documentation still has validation issues after pass 2:', finalValidation.errors);
    }
  }

  const validated = finalizeValidatedResult(
    finalParsed,
    context.combinedInput,
    context.def,
    context.assessmentType,
    finalValidation,
  );

  const generationMeta = buildGenerationMeta({
    guideline: context.def.displayName,
    assessmentType: context.assessmentType,
    facilityInstructionsIncluded: pass1Instructions.includes(FACILITY_TEMPLATE_MODE_MARKER),
    pass2Ran,
    fillableTemplateIncluded: context.guidelineTemplate.includes('EXACT FILLABLE FACILITY TEMPLATE'),
  });

  return {
    validated,
    qualityCheck: toDocumentationQualityCheck(validated, finalValidation),
    generationMeta,
    pass2Ran,
  };
}

export function extractFactsForInspection(input: string, guidelineId: string) {
  return extractClinicalFacts(input, guidelineId as never);
}

export { FACILITY_TEMPLATE_MODE_INSTRUCTIONS };
