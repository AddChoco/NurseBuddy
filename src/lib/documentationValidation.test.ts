import { describe, expect, it } from 'vitest';
import { validateGeneratedDocumentation } from './documentationValidation';
import { detectAssessmentType, shouldCheckMissingField, inferMissingInfoCategory } from '../guidelines/facilityTemplateMode';
import { fieldFromLabel } from '../guidelines/guidelineEngine';

describe('validateGeneratedDocumentation', () => {
  it('removes invented normal findings when vitals were not provided (TEST 1)', () => {
    const input = 'Individual fell yesterday. Fall was unwitnessed. No injury reported. Individual is walking with a walker.';
    const output = `S:
Individual fell yesterday.

O:
See Interactive View Assessment.
Vital signs are within normal limits.
Neurological status remains unchanged.
Skin intact.

A:
Fall Follow-up.

P:
Continue aspirin 81 mg daily.
Returned to baseline.`;

    const result = validateGeneratedDocumentation(input, output);
    expect(result.validatedDocumentation).toMatch(/See Interactive View Assessment\./i);
    expect(result.validatedDocumentation).not.toMatch(/within normal limits/i);
    expect(result.validatedDocumentation).not.toMatch(/Neurological status remains unchanged/i);
    expect(result.validatedDocumentation).not.toMatch(/Skin intact/i);
    expect(result.validatedDocumentation).not.toMatch(/Continue aspirin/i);
    expect(result.validatedDocumentation).not.toMatch(/Returned to baseline/i);
  });

  it('preserves Interactive View Assessment and temperature finding (TEST 3)', () => {
    const input = 'Temporal temperature was 102°F.';
    const output = `O:
See Interactive View Assessment.
Additional findings: Temporal temperature 102°F (38.9°C).
Vital signs are within normal limits.`;

    const result = validateGeneratedDocumentation(input, output);
    expect(result.validatedDocumentation).toMatch(/See Interactive View Assessment\./i);
    expect(result.validatedDocumentation).toMatch(/102°F/i);
    expect(result.validatedDocumentation).not.toMatch(/within normal limits/i);
  });

  it('does not allow resolution wording without confirmation (TEST 5)', () => {
    const input = 'Resolution assessment. No loose stool during this shift.';
    const output = `A:
Diarrhea resolved.`;

    const result = validateGeneratedDocumentation(input, output, {
      assessmentType: detectAssessmentType(input),
    });
    expect(result.validatedDocumentation).not.toMatch(/resolved/i);
    expect(result.qualityCheck.messages.some((message) => /resolution/i.test(message))).toBe(true);
  });

  it('preserves empty facility prompt labels during validation', () => {
    const input = 'Individual fell yesterday.';
    const output = `S:

O:
See Interactive View Assessment.
Additional findings:

A:
Fall Follow-up.

P:
Nursing interventions completed:
Staff verbalized or demonstrated understanding of instructions provided:`;

    const result = validateGeneratedDocumentation(input, output);
    expect(result.validatedDocumentation).toMatch(/Additional findings:/);
    expect(result.validatedDocumentation).toMatch(/Nursing interventions completed:/);
    expect(result.validatedDocumentation).toMatch(/Staff verbalized or demonstrated understanding of instructions provided:/);
  });
});

describe('missing information categories', () => {
  it('treats PCP notification as conditional', () => {
    const field = fieldFromLabel('PCP notification (when abnormal findings are present)', {
      category: 'conditional',
      conditionalWhen: 'PCP notified or abnormal findings present',
    });
    expect(inferMissingInfoCategory(field)).toBe('conditional');
    expect(shouldCheckMissingField(field, 'Individual fell. No injury reported.', 'initial')).toBe(false);
    expect(shouldCheckMissingField(field, 'Abnormal findings noted. Notify PCP.', 'initial')).toBe(true);
  });

  it('treats effectiveness as conditional only when medication was administered', () => {
    const field = fieldFromLabel('Effectiveness of anti-diarrheal medication (if administered)', {
      category: 'conditional',
      conditionalWhen: 'medication administered',
    });
    expect(shouldCheckMissingField(field, 'Loose stool reported.', 'follow_up')).toBe(false);
    expect(shouldCheckMissingField(field, 'Imodium given at 0800.', 'follow_up')).toBe(true);
  });
});

describe('detectAssessmentType', () => {
  it('detects resolution assessment from explicit label', () => {
    expect(detectAssessmentType('Resolution assessment for diarrhea')).toBe('resolution');
  });

  it('does not treat loose stool alone as resolution confirmation', () => {
    expect(detectAssessmentType('No loose stool during this shift.')).toBe('other');
  });

  it('infers vomiting follow-up from prior episode and resolved symptoms', () => {
    expect(
      detectAssessmentType(
        'One emesis episode yesterday at 1730 after dinner. No nausea or further vomiting. Sitting upright.',
      ),
    ).toBe('follow_up');
  });
});
