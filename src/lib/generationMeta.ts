export const EDGE_FUNCTION_VERSION = '2026-07-19-template-lock-v19';
export const TEMPLATE_MODE_LABEL = 'facility-template-v2';
export const FACILITY_TEMPLATE_MODE_MARKER = 'FACILITY TEMPLATE COMPLETION MODE';

export interface GenerationMeta {
  templateMode: typeof TEMPLATE_MODE_LABEL;
  edgeFunctionVersion: typeof EDGE_FUNCTION_VERSION;
  guideline: string;
  assessmentType: string;
  facilityInstructionsIncluded: boolean;
  pass2Ran?: boolean;
  fillableTemplateIncluded?: boolean;
}

export function buildGenerationMeta(args: {
  guideline: string;
  assessmentType: string;
  facilityInstructionsIncluded: boolean;
  pass2Ran?: boolean;
  fillableTemplateIncluded?: boolean;
}): GenerationMeta {
  return {
    templateMode: TEMPLATE_MODE_LABEL,
    edgeFunctionVersion: EDGE_FUNCTION_VERSION,
    guideline: args.guideline,
    assessmentType: args.assessmentType,
    facilityInstructionsIncluded: args.facilityInstructionsIncluded,
    pass2Ran: args.pass2Ran,
    fillableTemplateIncluded: args.fillableTemplateIncluded,
  };
}

export function assertFacilityTemplateInstructionsPresent(instructions: string): void {
  if (!instructions.includes(FACILITY_TEMPLATE_MODE_MARKER)) {
    throw new Error('Facility template instructions are missing from the live OpenAI request.');
  }
}
