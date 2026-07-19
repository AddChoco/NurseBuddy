import { describe, expect, it } from 'vitest';
import { HEAD_INJURY_GUIDELINE } from './definitions/head_injury';
import { VOMITING_GUIDELINE } from './definitions/vomiting';
import {
  buildFillableTemplateBlock,
  extractColonPromptsFromTemplate,
  getFacilityFormTemplate,
} from './facilityFormTemplates';
import { formatFacilityForm } from './facilityFormFormatter';
import { EMPTY_CLINICAL_EXTRACTION } from './clinicalExtraction';
import {
  buildPass1GenerationInstructions,
  buildPass2ReviewInstructions,
  buildPass2ReviewUserPrompt,
  validateFacilityTemplatePreservation,
} from '../lib/structuredDocumentation';
import {
  buildAiGenerationContext,
  buildCompleteGuidelineTemplateBlock,
} from '../lib/aiDocumentationGeneration';
import { FACILITY_TEMPLATE_MODE_INSTRUCTIONS } from './facilityTemplateMode';

const HEAD_INJURY_INITIAL_INPUT =
  'Initial assessment.\n\nAt 1545, DSP reported the individual struck the left side of the head on a door frame while ambulating. Individual reported mild headache. No loss of consciousness reported. Current use of Eliquis. Pupils equal and reactive. PIR completed. Nursing interventions completed.';

describe('facility template prompt assembly', () => {
  it('includes FACILITY TEMPLATE COMPLETION MODE in Pass 1 instructions by default', () => {
    const context = buildAiGenerationContext(
      'Head Injury',
      HEAD_INJURY_INITIAL_INPUT,
      'None provided.',
      'resident',
      false,
    );
    const instructions = buildPass1GenerationInstructions(
      context.def,
      context.terminology,
      context.assessmentType,
      context.guidelineTemplate,
      false,
      context.outputMode,
    );

    expect(instructions).toContain('FACILITY TEMPLATE COMPLETION MODE');
    expect(instructions).toContain(FACILITY_TEMPLATE_MODE_INSTRUCTIONS.slice(0, 40));
    expect(instructions).toContain('Complete the exact facility template');
    expect(instructions).toContain('NEVER MERGE TEMPLATE PROMPTS');
    expect(instructions).toContain('FACILITY PLAN COMPLIANCE');
    expect(instructions).toContain('FACILITY GUIDELINE PLAN LIBRARY');
    expect(instructions).not.toContain('Write natural, professional nursing documentation rather than mechanically restating the input.');
  });

  it('includes separate Date/Time and Description of Vomitus prompts in the vomiting template', () => {
    const template = getFacilityFormTemplate(VOMITING_GUIDELINE, 'initial');
    expect(template).toContain('Date/Time:');
    expect(template).toContain('Description of Vomitus:');
    expect(template).not.toContain('Date/Time/Description of Vomitus:');
  });

  it('includes the exact fillable Head Injury initial template with prompt labels in order', () => {
    const template = getFacilityFormTemplate(HEAD_INJURY_GUIDELINE, 'initial');
    const expectedPrompts = [
      'Observed cause of injury:',
      'Current use of anticoagulant or antiplatelet medication:',
      'Loss of consciousness and duration (if applicable):',
      'Other assessment findings:',
      'Nursing interventions completed:',
      'Notify PCP of the head injury:',
      'Post Injury Report (PIR) completed:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ];

    for (const prompt of expectedPrompts) {
      expect(template).toContain(prompt);
    }

    const promptIndexes = expectedPrompts.map((prompt) => template.indexOf(prompt));
    for (let i = 1; i < promptIndexes.length; i += 1) {
      expect(promptIndexes[i]).toBeGreaterThan(promptIndexes[i - 1]);
    }

    const block = buildFillableTemplateBlock(HEAD_INJURY_GUIDELINE, 'initial');
    expect(block).toContain('EXACT FILLABLE FACILITY TEMPLATE');
    expect(block).toContain(template);
  });

  it('preserves unsupported prompts as blank lines in deterministic formatter output', () => {
    const template = getFacilityFormTemplate(HEAD_INJURY_GUIDELINE, 'initial');
    const output = formatFacilityForm(template, EMPTY_CLINICAL_EXTRACTION);

    for (const prompt of extractColonPromptsFromTemplate(template)) {
      expect(output).toContain(prompt);
    }
  });

  it('requires Pass 2 to preserve facility template labels and blank prompts', () => {
    const pass2Instructions = buildPass2ReviewInstructions('resident', false, 'facility_template');
    expect(pass2Instructions).toContain('Preserve every facility label and colon-ended prompt');
    expect(pass2Instructions).toContain('Never merge separate facility prompts');
    expect(pass2Instructions).toContain('Do not delete blank required prompts');

    const pass2Input = buildPass2ReviewUserPrompt({
      sourceNarrative: HEAD_INJURY_INITIAL_INPUT,
      guidelineTemplate: buildCompleteGuidelineTemplateBlock(HEAD_INJURY_GUIDELINE, 'initial'),
      draftJson: '{}',
      validationErrors: ['Required facility prompt missing from SOAP output: Observed cause of injury:'],
      includeSbar: false,
      outputMode: 'facility_template',
    });

    expect(pass2Input).toContain('Preserve every facility label and prompt');
  });

  it('flags missing facility prompts during validation', () => {
    const errors = validateFacilityTemplatePreservation(
      {
        subjective: 'At 1545, DSP reported head injury.',
        objective: 'See Interactive View Assessment.',
        assessment: 'Head Injury',
        plan: 'Nursing interventions completed:\nPIR completed.',
      },
      HEAD_INJURY_GUIDELINE,
      'initial',
    );

    expect(errors.some((error) => error.includes('Observed cause of injury:'))).toBe(true);
  });

  it('flags merged facility prompts during validation', () => {
    const errors = validateFacilityTemplatePreservation(
      {
        subjective: '',
        objective: 'See Interactive View Assessment.\nDate/Time/Description of Vomitus: 1730, undigested food',
        assessment: 'Vomiting',
        plan: 'Nursing interventions completed:',
      },
      VOMITING_GUIDELINE,
      'initial',
    );

    expect(errors.some((error) => error.includes('Merged facility prompts detected'))).toBe(true);
  });
});
