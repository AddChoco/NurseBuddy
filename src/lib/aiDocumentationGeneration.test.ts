import { describe, expect, it } from 'vitest';
import {
  buildAiGenerationContext,
  buildCompleteGuidelineTemplateBlock,
} from '../lib/aiDocumentationGeneration';
import {
  formatSoapDocument,
  formatSbarDocument,
  validateAiDocumentationOutput,
  buildPass1GenerationInstructions,
} from '../lib/structuredDocumentation';
import { lookupGuidelineByDisplayName } from '../guidelines/guidelineDefinitions';

const HEAD_INJURY_INPUT =
  'Initial assessment.\n\nAt 1545, DSP reported the individual struck the left side of the head on a door frame while ambulating. Individual reported mild headache. No loss of consciousness reported. Current use of Eliquis. Pupils equal and reactive. PIR completed. Nursing interventions completed.';

describe('AI-first documentation workflow', () => {
  it('includes the complete Head Injury initial template in generation context', () => {
    const context = buildAiGenerationContext(
      'Head Injury',
      HEAD_INJURY_INPUT,
      'None provided.',
      'individual',
      true,
    );

    expect(context.guidelineTemplate).toContain('HEAD INJURY — INITIAL ASSESSMENT');
    expect(context.guidelineTemplate).toContain('NEUROLOGICAL MONITORING SCHEDULE');
    expect(context.guidelineTemplate).toContain('Follow-up requirements');
    expect(context.guidelineTemplate).toContain('Notification rules');
    expect(context.guidelineTemplate).toContain('Education / instruction requirements');
    expect(context.guidelineTemplate).toContain('SBAR / PROVIDER NOTIFICATION GUIDANCE');
    expect(context.guidelineTemplate).toContain('EXACT FILLABLE FACILITY TEMPLATE');
  });

  it('includes facility template completion mode and fillable template by default', () => {
    const context = buildAiGenerationContext(
      'Head Injury',
      HEAD_INJURY_INPUT,
      'None provided.',
      'individual',
      true,
    );

    expect(context.outputMode).toBe('facility_template');
    expect(context.guidelineTemplate).toContain('EXACT FILLABLE FACILITY TEMPLATE');
    expect(context.fillableTemplateText).toContain('Observed cause of injury:');

    const pass1Instructions = buildPass1GenerationInstructions(
      context.def,
      context.terminology,
      context.assessmentType,
      context.guidelineTemplate,
      true,
      context.outputMode,
    );
    expect(pass1Instructions).toContain('FACILITY TEMPLATE COMPLETION MODE');
  });

  it('validates a clinically complete AI draft without rewriting it', () => {
    const def = lookupGuidelineByDisplayName('Head Injury');
    if (!def) throw new Error('Head Injury guideline missing');

    const parsed = {
      soap: {
        subjective:
          'At 1545, DSP reported that the individual struck the left side of the head on a door frame while ambulating. The individual reported a mild headache and no loss of consciousness.',
        objective:
          'Pupils were equal and reactive. The individual is currently receiving Eliquis. PIR and nursing interventions were completed.',
        assessment:
          'Head injury involving the left side of the head with a reported mild headache and no reported loss of consciousness. Current Eliquis therapy places the individual at increased risk for bleeding complications.',
        plan:
          'Continue neurological assessments according to the facility Head Injury Guideline. Maintain close observation for bleeding or neurological changes due to current Eliquis therapy. DSP instructed to monitor for and immediately report increased drowsiness, difficulty arousing, confusion, behavior change, worsening headache, nausea or vomiting, dizziness, vision changes, unequal or nonreactive pupils, weakness, seizure activity, bleeding, bruising, swelling, or any other change from baseline. Maintain safety precautions. PIR and nursing interventions completed. Continue provider and LAR notification according to the guideline; notification completion status was not provided in the source narrative.',
      },
      sbar: {
        situation:
          'At 1545, DSP reported that the individual struck the left side of the head on a door frame while ambulating with a mild headache and no reported loss of consciousness.',
        background: 'The individual is currently receiving Eliquis.',
        assessment:
          'Pupils equal and reactive. PIR and nursing interventions completed. Vital signs and complete neurological assessment were not provided in the source narrative.',
        recommendation:
          'Continue neurological assessments according to the facility Head Injury Guideline and maintain close observation for bleeding or neurological changes due to Eliquis therapy. DSP instructed to monitor and immediately report any neurological change. Provider and LAR notification completion status was not provided.',
      },
      qualityCheckCompleteness: {
        provided: [
          'Event time: 1545',
          'Reporter title: DSP',
          'Head impact and location',
          'Mechanism of injury',
          'Mild headache',
          'No reported loss of consciousness',
          'Eliquis use',
          'Pupils equal and reactive',
          'PIR completed',
          'Nursing interventions completed',
        ],
        missing: [
          'Reporter name',
          'Vital signs',
          'Full neurological assessment',
          'Visible injury or skin assessment',
          'Provider notification status',
          'LAR notification status',
          'Staff education completion',
        ],
      },
    };

    const validation = validateAiDocumentationOutput(parsed, HEAD_INJURY_INPUT, def, 'initial', 'narrative_soap');
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(formatSoapDocument(parsed.soap)).toMatch(/1545/);
    expect(formatSoapDocument(parsed.soap)).toMatch(/DSP instructed to monitor/i);
    expect(formatSbarDocument(parsed.sbar)).toMatch(/Eliquis/);
  });

  it('flags invented completed findings for pass 2 correction', () => {
    const def = lookupGuidelineByDisplayName('Head Injury');
    if (!def) throw new Error('Head Injury guideline missing');

    const parsed = {
      soap: {
        subjective: 'At 1545, DSP reported a head injury.',
        objective: 'Vital signs were stable. No visible injury was noted.',
        assessment: 'Head injury.',
        plan: 'Continue monitoring.',
      },
      qualityCheckCompleteness: { provided: [], missing: [] },
    };

    const validation = validateAiDocumentationOutput(parsed, HEAD_INJURY_INPUT, def, 'initial', 'narrative_soap');
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((error) => error.includes('Unsupported completed finding'))).toBe(true);
  });
});

describe('buildCompleteGuidelineTemplateBlock', () => {
  it('returns the full Head Injury initial template text', () => {
    const def = lookupGuidelineByDisplayName('Head Injury');
    if (!def) throw new Error('Head Injury guideline missing');

    const template = buildCompleteGuidelineTemplateBlock(def, 'initial');
    expect(template).toContain('Document the reported cause of the head injury.');
    expect(template).toContain('Post Injury Report (PIR) completed');
    expect(template).toContain('Mild Head Injury');
    expect(template).toContain('Reassess 1 hour after the initial assessment.');
  });
});
