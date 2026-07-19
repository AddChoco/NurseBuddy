import { describe, expect, it } from 'vitest';
import { EMPTY_CLINICAL_EXTRACTION } from './clinicalExtraction';
import { formatFacilityForm } from './facilityFormFormatter';
import { getFacilityFormTemplate } from './facilityFormTemplates';
import { FALL_GUIDELINE } from './definitions/fall';
import { GENERIC_SOAP_NOTE_GUIDELINE } from './definitions/generic_soap_note';
import type { ClinicalExtraction } from './clinicalExtraction';

describe('formatFacilityForm', () => {
  it('preserves every colon prompt when extraction is empty', () => {
    const template = getFacilityFormTemplate(FALL_GUIDELINE, 'initial');
    const output = formatFacilityForm(template, EMPTY_CLINICAL_EXTRACTION);

    expect(output).toMatch(/SUBJECTIVE:/);
    expect(output).toMatch(/See Interactive View Assessment\./);
    expect(output).toMatch(/Nursing interventions completed:/);
    expect(output).toMatch(/Staff verbalized or demonstrated understanding of instructions provided:/);
    expect(output).not.toMatch(/^-\s/m);
  });

  it('inserts extracted values after prompts without rewriting the template', () => {
    const template = getFacilityFormTemplate(FALL_GUIDELINE, 'initial');
    const extraction: ClinicalExtraction = {
      ...EMPTY_CLINICAL_EXTRACTION,
      nursingInterventions: 'Individual assessed following reported fall.',
      staffInstructions: 'DSP instructed to report pain or swelling.',
      additionalFindings: 'No visible injury reported.',
      medication: 'Aspirin 81 mg daily.',
      reporter: {
        name: 'John Jones',
        title: 'DSP',
        time: '20:15',
        report: 'the individual was found on the floor beside the bed',
      },
    };

    const output = formatFacilityForm(template, extraction);
    expect(output).toMatch(/At 20:15, John Jones, DSP, reported that the individual was found on the floor beside the bed/);
    expect(output).toMatch(/Nursing interventions completed:\nIndividual assessed following reported fall\./);
    expect(output).toMatch(/Current use of blood thinners, including anticoagulants or antiplatelet medications:\nAspirin 81 mg daily\./);
    expect(output).toMatch(/Staff verbalized or demonstrated understanding of instructions provided:\nDSP instructed to report pain or swelling\./);
  });

  it('preserves generic facility template order and blank prompts', () => {
    const template = getFacilityFormTemplate(GENERIC_SOAP_NOTE_GUIDELINE, 'other');
    const output = formatFacilityForm(template, EMPTY_CLINICAL_EXTRACTION);

    const subjectiveIndex = output.indexOf('SUBJECTIVE:');
    const objectiveIndex = output.indexOf('OBJECTIVE:');
    const assessmentIndex = output.indexOf('ASSESSMENT:');
    const planIndex = output.indexOf('PLAN:');
    expect(subjectiveIndex).toBeLessThan(objectiveIndex);
    expect(objectiveIndex).toBeLessThan(assessmentIndex);
    expect(assessmentIndex).toBeLessThan(planIndex);
    expect(output).toMatch(/See Interactive View Assessment\./);
    expect(output).toMatch(/Additional findings:/);
    expect(output).toMatch(/Nursing interventions completed:/);
  });
});
