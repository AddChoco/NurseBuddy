import { describe, expect, it } from 'vitest';
import {
  validateStructuredDocumentation,
  validateAiDocumentationOutput,
  formatSoapDocument,
  formatSbarDocument,
  stripMarkdown,
  resolveTerminology,
  buildStructuredGenerationInstructions,
} from './structuredDocumentation';
import { lookupGuidelineByDisplayName } from '../guidelines/guidelineDefinitions';
import { detectAssessmentType } from '../guidelines/facilityTemplateMode';

const FALL_INITIAL_INPUT =
  'At 2030, Chris Nguyen, DSP, reported that the individual was found sitting on the floor in the bedroom after an unwitnessed fall. Individual denied pain. No visible injury noted. Current use of aspirin 81 mg daily. PIR completed. Nursing interventions completed. Staff verbalized understanding of fall precautions.';

describe('validateStructuredDocumentation — Fall Initial sample', () => {
  const def = lookupGuidelineByDisplayName('Fall');
  if (!def) throw new Error('Fall guideline definition missing');

  const idealParsed = {
    soap: {
      subjective:
        'At 2030, Chris Nguyen, DSP, reported that the individual was found sitting on the floor in the bedroom following an unwitnessed fall. The individual denied pain.',
      objective:
        'The individual was observed after the reported fall. No visible injury was noted. The individual is currently receiving aspirin 81 mg daily.',
      assessment:
        'Unwitnessed fall without reported pain or visible injury at the time of assessment.',
      plan:
        'PIR completed. Nursing interventions completed per fall guideline. Fall precautions reviewed with staff, and staff verbalized understanding. Continue follow-up assessments according to the applicable fall guideline.',
    },
    sbar: {
      situation:
        'At 2030, Chris Nguyen, DSP, reported that the individual was found sitting on the bedroom floor following an unwitnessed fall.',
      background: 'The individual is currently receiving aspirin 81 mg daily.',
      assessment:
        'The individual denied pain, and no visible injury was noted. PIR and nursing interventions were completed.',
      recommendation:
        'Continue assessments and notifications according to the fall guideline. Maintain fall precautions. Staff verbalized understanding of fall precautions.',
    },
    qualityCheckCompleteness: {
      provided: [
        'Event time: 2030',
        'Reporter name: Chris Nguyen, DSP',
        'Unwitnessed fall',
        'Pain denied',
        'No visible injury noted',
        'Aspirin 81 mg daily',
        'PIR completed',
        'Nursing interventions completed',
      ],
      missing: [
        'Vital signs',
        'Neurological assessment',
        'Head impact status',
        'Provider notification status',
        'LAR notification status',
      ],
    },
  };

  it('preserves provided facts in SOAP and SBAR output', () => {
    const validated = validateStructuredDocumentation(
      idealParsed,
      FALL_INITIAL_INPUT,
      def,
      detectAssessmentType(FALL_INITIAL_INPUT),
    );

    expect(validated.soapText).toMatch(/2030/);
    expect(validated.soapText).toMatch(/Chris Nguyen, DSP/);
    expect(validated.soapText).toMatch(/unwitnessed fall/i);
    expect(validated.soapText).toMatch(/denied pain/i);
    expect(validated.soapText).toMatch(/No visible injury/i);
    expect(validated.soapText).toMatch(/aspirin 81 mg daily/i);
    expect(validated.soapText).toMatch(/PIR completed/i);
    expect(validated.soapText).toMatch(/Staff verbalized understanding/i);

    expect(validated.sbarText).toMatch(/2030/);
    expect(validated.sbarText).toMatch(/Chris Nguyen, DSP/);
    expect(validated.sbarText).not.toMatch(/\*\*/);
  });

  it('flags clinically relevant missing information without false positives', () => {
    const validated = validateStructuredDocumentation(
      idealParsed,
      FALL_INITIAL_INPUT,
      def,
      detectAssessmentType(FALL_INITIAL_INPUT),
    );

    const missing = validated.completeness?.missing ?? [];

    expect(missing.length).toBeGreaterThan(0);
    expect(missing).not.toContain('Report time not provided');
    expect(missing).not.toContain('Reporter name/title not provided');
    expect(missing).not.toContain('Pain assessment not provided');
  });

  it('detects invented clinical findings for pass 2 correction', () => {
    const invented = {
      soap: {
        subjective: idealParsed.soap.subjective,
        objective:
          'Vital signs stable. Neurological status unchanged. No head impact. No loss of consciousness. No visible injury noted.',
        assessment: idealParsed.soap.assessment,
        plan: idealParsed.soap.plan,
      },
      qualityCheckCompleteness: { provided: [], missing: [] },
    };

    const validation = validateAiDocumentationOutput(
      invented,
      FALL_INITIAL_INPUT,
      def,
      detectAssessmentType(FALL_INITIAL_INPUT),
    );

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((error) => error.includes('Unsupported completed finding'))).toBe(true);
    expect(invented.soap.objective).toMatch(/vital signs stable/i);
  });
});

describe('structured documentation helpers', () => {
  it('uses individual terminology when selected', () => {
    expect(resolveTerminology('individual')).toBe('individual');
    expect(resolveTerminology('resident')).toBe('resident');
  });

  it('strips markdown symbols', () => {
    expect(stripMarkdown('**Situation:** No head impact')).toBe('Situation: No head impact');
  });

  it('builds generation instructions with guideline template and JSON schema', () => {
    const def = lookupGuidelineByDisplayName('Fall');
    if (!def) throw new Error('Fall guideline definition missing');

    const instructions = buildStructuredGenerationInstructions(def, 'individual', 'initial', true);
    expect(instructions).toMatch(/Return ONLY valid JSON/);
    expect(instructions).toMatch(/Fall/);
    expect(instructions).toMatch(/"soap"/);
    expect(instructions).toMatch(/"sbar"/);
    expect(instructions).toMatch(/Use "individual"/);
  });

  it('formats structured sections with plain-text headings', () => {
    const soapText = formatSoapDocument({
      subjective: 'Example subjective',
      objective: 'Example objective',
      assessment: 'Example assessment',
      plan: 'Example plan',
    });

    expect(soapText).toMatch(/^SUBJECTIVE:\nExample subjective/m);
    expect(soapText).toMatch(/OBJECTIVE:\nExample objective/);
    expect(soapText).toMatch(/ASSESSMENT:\nExample assessment/);
    expect(soapText).toMatch(/PLAN:\nExample plan/);

    const sbarText = formatSbarDocument({
      situation: 'Example situation',
      background: 'Example background',
      assessment: 'Example assessment',
      recommendation: 'Example recommendation',
    });

    expect(sbarText).toMatch(/^SITUATION:\nExample situation/m);
    expect(sbarText).not.toMatch(/\*\*/);
  });
});
