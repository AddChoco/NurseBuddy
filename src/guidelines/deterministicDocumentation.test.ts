import { describe, expect, it } from 'vitest';
import { extractClinicalFacts } from '../guidelines/clinicalFactExtraction';
import { HEAD_INJURY_INITIAL_CONFIG } from '../guidelines/guidelineRequirementConfigs';
import {
  evaluateGuidelineRequirements,
  generateDeterministicDocumentation,
  validateDeterministicOutput,
} from '../guidelines/deterministicDocumentation';
import { detectAssessmentType } from '../guidelines/facilityTemplateMode';

const HEAD_INJURY_INPUT =
  'Initial assessment.\n\nAt 1545, DSP reported the individual struck the left side of the head on a door frame while ambulating. Individual reported mild headache. No loss of consciousness reported. Current use of Eliquis. Pupils equal and reactive. PIR completed. Nursing interventions completed.';

describe('Head Injury — Initial deterministic pipeline', () => {
  const assessmentType = detectAssessmentType(HEAD_INJURY_INPUT);

  it('extracts structured facts without inferring undocumented findings', () => {
    const facts = extractClinicalFacts(HEAD_INJURY_INPUT, 'head_injury');

    expect(facts).toMatchObject({
      eventTime: '1545',
      reporterName: null,
      reporterTitle: 'DSP',
      headImpact: true,
      headImpactLocation: 'left side of the head',
      mechanism: 'a door frame while ambulating',
      painPresent: true,
      painDescription: 'mild headache',
      lossOfConsciousness: false,
      anticoagulantUse: true,
      medications: ['Eliquis'],
      pupilAssessment: 'Pupils equal and reactive',
      vitalSigns: null,
      neurologicalAssessment: null,
      visibleInjury: null,
      pirCompleted: true,
      nursingInterventionsCompleted: true,
      providerNotification: null,
      larNotification: null,
      staffEducation: null,
    });
  });

  it('builds deterministic completeness without contradictory missing-information flags', () => {
    const facts = extractClinicalFacts(HEAD_INJURY_INPUT, 'head_injury');
    const completeness = evaluateGuidelineRequirements(facts, HEAD_INJURY_INITIAL_CONFIG);

    expect(completeness.provided).toEqual(
      expect.arrayContaining([
        'Event time provided: 1545',
        'Reporter title provided: DSP',
        'Head impact confirmed',
        'Head-impact location provided',
        'Mechanism provided',
        'Pain symptom provided: mild headache',
        'Loss-of-consciousness status provided: no loss of consciousness reported',
        'Anticoagulant use provided: Eliquis',
        'Pupil assessment provided: Pupils equal and reactive',
        'PIR status provided: completed',
        'Nursing intervention status provided: completed',
      ]),
    );

    expect(completeness.missing).toEqual(
      expect.arrayContaining([
        'Reporter name not provided',
        'Vital signs not provided',
        'Complete neurological assessment not provided',
        'Visible injury/skin assessment not provided',
        'Provider notification status not provided',
        'LAR notification status not provided',
        'Staff education completion not provided',
      ]),
    );

    expect(completeness.missing).not.toContain('Event time not provided');
    expect(completeness.missing).not.toContain('Head impact status not provided');
    expect(completeness.missing).not.toContain('Reporter title not provided');
    expect(completeness.missing).not.toContain('Report time not provided');
  });

  it('generates complete SOAP and SBAR output for the failed test case', () => {
    const result = generateDeterministicDocumentation(
      HEAD_INJURY_INPUT,
      'head_injury',
      assessmentType,
      'individual',
      true,
    );

    expect(result).not.toBeNull();
    expect(result!.validationErrors).toEqual([]);
    expect(result!.soapText).toMatch(/1545/);
    expect(result!.soapText).toMatch(/DSP reported/);
    expect(result!.soapText).toMatch(/left side of the head/);
    expect(result!.soapText).toMatch(/door frame while ambulating/);
    expect(result!.soapText).toMatch(/mild headache/);
    expect(result!.soapText).toMatch(/no loss of consciousness/i);
    expect(result!.soapText).toMatch(/Eliquis/);
    expect(result!.soapText).toMatch(/Pupils were equal and reactive/);
    expect(result!.soapText).toMatch(/PIR completed/);
    expect(result!.soapText).toMatch(/Nursing interventions completed/);
    expect(result!.soapText).toMatch(/facility Head Injury Guideline/);
    expect(result!.soapText).toMatch(/bleeding or neurological changes/);
    expect(result!.soapText).toMatch(/DSP instructed to monitor for and immediately report/);
    expect(result!.soapText).not.toMatch(/every four hours/i);

    expect(result!.sbarText).toMatch(/1545/);
    expect(result!.sbarText).toMatch(/Eliquis/);
  });

  it('validates output and rejects contradictions', () => {
    const result = generateDeterministicDocumentation(
      HEAD_INJURY_INPUT,
      'head_injury',
      assessmentType,
      'individual',
      true,
    )!;

    const errors = validateDeterministicOutput(
      result.facts,
      result.soap,
      HEAD_INJURY_INITIAL_CONFIG,
      result.completeness,
      result.sbar,
    );

    expect(errors).toEqual([]);
  });
});
