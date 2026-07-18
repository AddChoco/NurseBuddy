import { describe, expect, it } from 'vitest';
import { GUIDELINES } from '../constants';
import {
  clinicalSamples,
  formatSampleClinicalInformation,
  getGuidelinesWithoutSamples,
} from './sampleClinicalInputs';

describe('clinicalSamples', () => {
  it('includes at least one sample for every supported guideline', () => {
    expect(getGuidelinesWithoutSamples()).toEqual([]);
    expect(clinicalSamples.length).toBeGreaterThanOrEqual(GUIDELINES.length);
  });

  it('uses unique sample ids', () => {
    const ids = clinicalSamples.map((sample) => sample.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prefixes assessment type when formatting samples', () => {
    const formatted = formatSampleClinicalInformation({
      id: 'test',
      label: 'Test',
      guidelineId: 'fall',
      assessmentType: 'Follow-up',
      clinicalInformation: 'Individual denied pain.',
    });
    expect(formatted).toMatch(/^Follow-up assessment\./);
  });

  it('uses return assessment prefix for transfer-back samples', () => {
    const transferBack = clinicalSamples.find((sample) => sample.id === 'transfer-back-return');
    expect(transferBack).toBeDefined();
    const formatted = formatSampleClinicalInformation(transferBack!);
    expect(formatted).toMatch(/^Return assessment\./);
  });
});
