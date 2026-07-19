import { describe, expect, it } from 'vitest';
import { ELEVATED_TEMPERATURE_GUIDELINE } from './definitions/elevated_temperature';
import { getFacilityFormTemplate } from './facilityFormTemplates';
import { enrichObjectiveSection, enrichSubjectiveSection } from './soapSectionEnrichment';

const ELEVATED_TEMP_FOLLOW_UP_INPUT =
  'Elevated temperature follow-up. Resident denies chills and new symptoms. No additional fever reported. Resident resting comfortably. Current temperature 98.4 temporal. Assessment time 1830. PRN Tylenol administered at 1830.';

describe('soapSectionEnrichment', () => {
  it('builds narrative subjective text and omits empty subjective labels', () => {
    const template = getFacilityFormTemplate(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const subjectiveTemplate = template.split('OBJECTIVE:')[0]?.replace('SUBJECTIVE:', '').trim() ?? '';

    const enriched = enrichSubjectiveSection(
      subjectiveTemplate,
      ELEVATED_TEMP_FOLLOW_UP_INPUT,
      template,
      'resident',
    );

    expect(enriched).toContain('Resident denies chills');
    expect(enriched).not.toMatch(/Fatigue:\s*$/m);
    expect(enriched).not.toMatch(/New symptoms:\s*$/m);
    expect(enriched).not.toContain('New symptoms:');
  });

  it('converts objective label values into nursing narrative prose', () => {
    const template = getFacilityFormTemplate(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const objectiveTemplate = template.split('ASSESSMENT:')[0]?.split('OBJECTIVE:')[1]?.trim() ?? '';
    const objective = objectiveTemplate
      .replace(
        'Current temperature:',
        'Current temperature:\n98.4',
      )
      .replace(
        'Temperature route:',
        'Temperature route:\nTemporal',
      )
      .replace(
        'Assessment time:',
        'Assessment time:\n1830',
      );

    const enriched = enrichObjectiveSection(
      objective,
      ELEVATED_TEMP_FOLLOW_UP_INPUT,
      template,
      'resident',
    );

    expect(enriched).toMatch(/Resident afebrile at follow-up with temperature 98\.4°F/i);
    expect(enriched).toMatch(/PRN Tylenol administered at 1830/i);
    expect(enriched).toContain('See Interactive View Assessment.');
  });
});
