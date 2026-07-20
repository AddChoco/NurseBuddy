import { describe, expect, it } from 'vitest';
import { ELEVATED_TEMPERATURE_GUIDELINE } from './definitions/elevated_temperature';
import { FALL_GUIDELINE } from './definitions/fall';
import { HEAD_INJURY_GUIDELINE } from './definitions/head_injury';
import { PAIN_GUIDELINE } from './definitions/pain';
import { RESPIRATORY_GUIDELINE } from './definitions/respiratory';
import { UTI_GUIDELINE } from './definitions/uti';
import { VOMITING_GUIDELINE } from './definitions/vomiting';
import { getFacilityFormTemplate } from './facilityFormTemplates';
import {
  detectNegativeFillerClaims,
  isNegativeFillerValue,
  sanitizeFacilityTemplateSections,
} from './facilityTemplateSanitization';
import { enrichFacilityPlanPrompts } from './planPromptEnrichment';
import {
  validateAiDocumentationOutput,
  type StructuredDocumentationResponse,
} from '../lib/structuredDocumentation';

const ELEVATED_TEMP_FOLLOW_UP_INPUT =
  'Follow-up assessment. Last elevated temperature was 07/17/26 at 1800. Current temporal temperature is 98.4°F. Resident resting comfortably. No chills or additional fever noted. PRN Tylenol administered at 1830. Nursing interventions completed.';

const NEGATIVE_FILLER_PHRASES = [
  'Staff education not provided',
  'Unknown',
  'Unable to determine',
  'Not provided',
  'Provider not notified',
  'Nursing interventions not completed',
];

describe('facilityTemplateSanitization', () => {
  it('detects negative filler values', () => {
    expect(isNegativeFillerValue('Staff education not provided')).toBe(true);
    expect(isNegativeFillerValue('Unknown')).toBe(true);
    expect(isNegativeFillerValue('Resident resting comfortably.')).toBe(false);
  });

  it('sanitizes negative filler prompt values from elevated temperature follow-up output', () => {
    const template = getFacilityFormTemplate(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const planSection = template.split('PLAN:')[1]?.trim() ?? '';
    const dirtyPlan = planSection
      .replace(
        'Staff verbalized or demonstrated understanding of instructions provided:',
        'Staff verbalized or demonstrated understanding of instructions provided:\nStaff education not provided.',
      )
      .replace('Assessment time:', 'Assessment time:\nUnknown')
      .replace(
        'Environmental factors that may have contributed to the elevated temperature:',
        'Environmental factors that may have contributed to the elevated temperature:\nNot provided',
      );

    const sanitized = sanitizeFacilityTemplateSections(
      {
        subjective: 'Reported symptoms:\nResident resting comfortably.',
        objective:
          'See Interactive View Assessment.\nDate and time of the last documented elevated temperature:\n07/17/26 at 1800\nCurrent temperature:\n98.4°F\nTemperature route:\nTemporal\nAssessment time:\nUnknown\nSigns and symptoms of infection:\nNot provided\nEnvironmental factors that may have contributed to the elevated temperature:\nNot provided\nAdditional findings:\nResident resting comfortably. No chills or additional fever noted.\nInterventions completed:\nPRN Tylenol administered at 1830.',
        assessment: 'Elevated Temperature Follow-up.',
        plan: dirtyPlan,
      },
      ELEVATED_TEMPERATURE_GUIDELINE,
      'follow_up',
      ELEVATED_TEMP_FOLLOW_UP_INPUT,
    );

    for (const phrase of NEGATIVE_FILLER_PHRASES) {
      expect(sanitized.plan).not.toContain(phrase);
      expect(sanitized.objective).not.toContain(phrase);
    }
    expect(sanitized.plan).toContain('DSP instructed to monitor for and immediately report');
    expect(sanitized.plan).toMatch(/Staff verbalized or demonstrated understanding of instructions provided:\s*$/m);
  });

  it('passes elevated temperature follow-up validation without unsupported staff education completion', () => {
    const template = getFacilityFormTemplate(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const planSection = template.split('PLAN:')[1]?.trim() ?? '';
    const enrichment = enrichFacilityPlanPrompts(
      planSection,
      ELEVATED_TEMP_FOLLOW_UP_INPUT,
      ELEVATED_TEMPERATURE_GUIDELINE,
      'follow_up',
      { autoCompleteStaffEducation: true },
    );

    const parsed: StructuredDocumentationResponse = {
      soap: {
        subjective: 'Reported symptoms:\nResident resting comfortably.',
        objective:
          'See Interactive View Assessment.\nDate and time of the last documented elevated temperature:\n07/17/26 at 1800\nCurrent temperature:\n98.4°F\nTemperature route:\nTemporal\nAssessment time:\nSigns and symptoms of infection:\nEnvironmental factors that may have contributed to the elevated temperature:\nAdditional findings:\nResident resting comfortably. No chills or additional fever noted.\nInterventions completed:\nPRN Tylenol administered at 1830.',
        assessment: 'Elevated Temperature Follow-up.',
        plan: enrichment.plan,
      },
      qualityCheckCompleteness: { provided: [], missing: [] },
    };

    const validation = validateAiDocumentationOutput(
      parsed,
      ELEVATED_TEMP_FOLLOW_UP_INPUT,
      ELEVATED_TEMPERATURE_GUIDELINE,
      'follow_up',
      'facility_template',
      { autoCompleteStaffEducation: true },
    );

    for (const phrase of NEGATIVE_FILLER_PHRASES) {
      expect(parsed.soap.plan).not.toContain(phrase);
      expect(formatSoap(parsed.soap)).not.toContain(phrase);
    }

    expect(validation.errors.some((error) => error.includes('Staff education not provided'))).toBe(false);
    expect(validation.errors.some((error) => error.includes('Unsupported completed finding'))).toBe(false);
    expect(validation.completeness?.provided).toContain('Nursing interventions documented');
    expect(validation.completeness?.provided).toContain('Staff instruction content generated');
    expect(validation.completeness?.missing).toContain('Staff understanding confirmation not documented');
    expect(parsed.soap.plan).toMatch(/Nursing interventions completed:\n.*PRN Tylenol administered/i);
    expect(parsed.soap.plan).not.toMatch(/Staff verbalized understanding of/i);
  });
});

describe('facilityTemplateSanitization regressions', () => {
  const cases = [
    { name: 'Vomiting', def: VOMITING_GUIDELINE, type: 'follow_up' as const },
    { name: 'Fall', def: FALL_GUIDELINE, type: 'follow_up' as const },
    { name: 'Head Injury', def: HEAD_INJURY_GUIDELINE, type: 'initial' as const },
    { name: 'Pain', def: PAIN_GUIDELINE, type: 'follow_up' as const },
    { name: 'UTI', def: UTI_GUIDELINE, type: 'initial' as const },
    { name: 'Respiratory', def: RESPIRATORY_GUIDELINE, type: 'initial' as const },
  ];

  for (const testCase of cases) {
    it(`preserves standing instructions and removes negative filler for ${testCase.name}`, () => {
      const template = getFacilityFormTemplate(testCase.def, testCase.type);
      const planSection = template.split('PLAN:')[1]?.trim() ?? '';
      const dirtyPlan = `${planSection}\nStaff education not provided.`;

      const sanitized = sanitizeFacilityTemplateSections(
        {
          subjective: '',
          objective: 'See Interactive View Assessment.',
          assessment: template.match(/ASSESSMENT:\s*\n([^\n]+)/)?.[1] ?? 'Assessment',
          plan: dirtyPlan,
        },
        testCase.def,
        testCase.type,
      );

      expect(sanitized.plan).not.toContain('Staff education not provided');
      expect(detectNegativeFillerClaims(sanitized.plan)).toHaveLength(0);
      expect(sanitized.plan.length).toBeGreaterThan(0);
    });
  }
});

function formatSoap(soap: StructuredDocumentationResponse['soap']): string {
  return [soap.subjective, soap.objective, soap.assessment, soap.plan].join('\n');
}
