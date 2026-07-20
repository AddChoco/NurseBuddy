import { describe, expect, it } from 'vitest';
import { ELEVATED_TEMPERATURE_GUIDELINE } from './definitions/elevated_temperature';
import { VOMITING_GUIDELINE } from './definitions/vomiting';
import { getFacilityFormTemplate } from './facilityFormTemplates';
import { buildDocumentationQualityCheck } from './documentationQualityCheck';
import {
  buildTemplateLockSchema,
  emptyTemplateLockValues,
  parseTemplateLockResponse,
  renderTemplateLockSoap,
  validateTemplateLockValues,
} from './templateLockMode';
import { buildTemplateLockDocumentation } from './templateLockPopulation';
import { validateAiDocumentationOutput } from '../lib/structuredDocumentation';

const ELEVATED_TEMP_FOLLOW_UP_INPUT =
  'Follow-up assessment. Last elevated temperature was 101.8°F on 07/17/26 at 1800. Current temporal temperature is 98.4°F. Resident resting comfortably. No chills or additional fever noted. PRN Tylenol administered at 1830. Nursing interventions completed.';

const VOMITING_FOLLOW_UP_INPUT =
  'One emesis episode yesterday at 1730 after dinner. Emesis contained undigested food. DSP reported the individual ate too fast. Currently sleeping in bed. Respirations even and unlabored. No aspiration or respiratory distress. Abdomen soft and non-tender. No pain. Vital signs within normal limits. 100% meals. 52 oz fluid intake. 5 voids. 1 bowel movement. No nausea or further vomiting. Sitting upright.';

describe('templateLockMode', () => {
  it('rejects unknown JSON keys', () => {
    const schema = buildTemplateLockSchema(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const result = parseTemplateLockResponse(
      JSON.stringify({
        fieldValues: {
          subjective: { reportedSymptoms: 'test', extraField: 'bad' },
          objective: {},
          assessment: { clinicalSummary: '' },
          plan: {},
          rogueKey: 'bad',
        },
      }),
      schema,
    );

    expect(result.unknownKeys).toContain('subjective.extraField');
    expect(result.unknownKeys).not.toContain('subjective.reportedSymptoms');
    expect(result.unknownKeys).toContain('rogueKey');
    expect(result.errors.some((error) => /Unknown JSON keys rejected/i.test(error))).toBe(true);
  });

  it('renders elevated temperature follow-up with exact template labels and order', () => {
    const schema = buildTemplateLockSchema(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const template = getFacilityFormTemplate(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: ELEVATED_TEMP_FOLLOW_UP_INPUT,
      def: ELEVATED_TEMPERATURE_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'resident',
      autoConfirmStaffInstructionFromNursingInterventions: true,
    });

    expect(built.soap.subjective).toContain(
      'Resident is on Elevated Temperature Guideline following a temperature of 101.8°F on 07/17/26 at 1800.',
    );
    expect(built.soap.subjective).not.toContain('No new concerns reported');
    expect(built.soap.subjective).not.toContain('resting comfortably');
    expect(built.soap.objective).toContain('See Interactive View Assessment.');
    expect(built.soap.objective).toContain('Current temperature:\n98.4°F');
    expect(built.soap.objective).toContain('Temperature route:\nTemporal');
    expect(built.soap.objective).toContain(
      'Additional findings:\nResident resting comfortably. No chills or additional fever noted.',
    );
    expect(built.soap.objective).toContain('Interventions completed:\nPRN Tylenol administered at 1830.');
    expect(built.values.assessment.clinicalSummary).toBe(
      'Afebrile on follow-up after previously elevated temperature.',
    );
    expect(built.soap.assessment).toContain('Elevated Temperature Follow-up.');
    expect(built.soap.assessment).toContain('Afebrile on follow-up after previously elevated temperature.');
    expect(built.soap.plan).toContain('Continue temperature assessments according to the Elevated Temperature Guideline.');
    expect(built.soap.plan).toMatch(/Nursing interventions completed:\n.*Temperature reassessed/i);
    expect(built.soap.plan).toContain(
      'Staff verbalized or demonstrated understanding of instructions provided:',
    );
    expect(built.soap.plan).not.toMatch(
      /Staff verbalized or demonstrated understanding of instructions provided:\n(?:Staff verbalized|Unable to assess)/,
    );
    expect(built.staffEducation.staffInstructionContent).toMatch(/increased temperature, chills, fatigue/i);
    expect(built.staffEducation.staffInstructionProvided).toBe(true);
    expect(built.staffEducation.staffUnderstandingConfirmed).toBe(false);
  });

  it('marks blank infection and environmental fields missing in quality check', () => {
    const schema = buildTemplateLockSchema(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: ELEVATED_TEMP_FOLLOW_UP_INPUT,
      def: ELEVATED_TEMPERATURE_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'resident',
      autoConfirmStaffInstructionFromNursingInterventions: true,
    });

    const validation = validateAiDocumentationOutput(
      { soap: built.soap, qualityCheckCompleteness: { provided: [], missing: [] } },
      ELEVATED_TEMP_FOLLOW_UP_INPUT,
      ELEVATED_TEMPERATURE_GUIDELINE,
      'follow_up',
      'facility_template',
      { autoCompleteStaffEducation: true },
      'resident',
      {
        values: built.values,
        schema,
        skipSoapSectionEnrichment: true,
      },
    );

    expect(validation.completeness.provided).toContain('Current temperature documented');
    expect(validation.completeness.provided).not.toContain('Signs or symptoms of infection documented');
    expect(validation.completeness.missing).toContain('Staff instruction documented; understanding confirmation needed');
    expect(validation.errors.some((error) => /Unsupported completed finding/i.test(error))).toBe(false);
  });

  it('preserves vomiting follow-up structure and quality check behavior', () => {
    const schema = buildTemplateLockSchema(VOMITING_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: VOMITING_FOLLOW_UP_INPUT,
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'individual',
    });

    expect(built.soap.subjective).toMatch(
      /DSP reported one episode of vomiting yesterday at 1730 after dinner\./i,
    );
    expect(built.soap.subjective).not.toContain('resting comfortably');
    expect(built.soap.objective).toContain('Intake/output:\n100% meals, 52 oz fluid intake, 5 voids, 1 bowel movement.');
    expect(built.soap.objective).toContain('Positioning per PNMP:\nSitting upright.');
    expect(built.soap.assessment).toContain('Vomiting Follow-up.');
    expect(built.soap.plan).toContain('Assess every shift for 24 hours after resident is symptom free.');

    const validation = validateAiDocumentationOutput(
      { soap: built.soap, qualityCheckCompleteness: { provided: [], missing: [] } },
      VOMITING_FOLLOW_UP_INPUT,
      VOMITING_GUIDELINE,
      'follow_up',
      'facility_template',
      { autoCompleteStaffEducation: true },
      'individual',
      {
        values: built.values,
        schema,
        skipSoapSectionEnrichment: true,
      },
    );

    expect(validation.completeness?.provided).toContain('Event time documented');
    expect(validation.completeness?.provided).toContain('Positioning per PNMP documented');
    expect(validation.completeness?.provided).toContain('Nursing interventions documented');
  });

  it('rejects narrative content in scalar temperature fields', () => {
    const schema = buildTemplateLockSchema(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const values = emptyTemplateLockValues();
    values.objective.currentTemperature = 'Individual afebrile at follow-up with temperature 98.4°F (Temporal).';
    const validation = validateTemplateLockValues(values, schema, ELEVATED_TEMP_FOLLOW_UP_INPUT);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((error) => /Scalar field currentTemperature/i.test(error))).toBe(true);
  });

  it('accepts scalar last elevated temperature date/time formats', () => {
    const schema = buildTemplateLockSchema(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const values = emptyTemplateLockValues();
    values.objective.lastElevatedTemperatureDateTime = '07/17/26 at 1800';
    values.objective.currentTemperature = '98.4°F';
    values.objective.temperatureRoute = 'Temporal';
    const validation = validateTemplateLockValues(values, schema, ELEVATED_TEMP_FOLLOW_UP_INPUT);
    expect(validation.errors.some((error) => /lastElevatedTemperatureDateTime/i.test(error))).toBe(false);
  });

  it('auto-renders enteral feeding rate N/A when tube feeding is not documented', () => {
    const schema = buildTemplateLockSchema(VOMITING_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: VOMITING_FOLLOW_UP_INPUT,
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'individual',
    });

    expect(built.values.objective.enteralFeedingRate).toBe('N/A');
    expect(built.soap.objective).toContain('Enteral feeding rate:\nN/A');
  });

  it('renders staff understanding confirmation from explicit verbalization', () => {
    const schema = buildTemplateLockSchema(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const aiValues = emptyTemplateLockValues();
    aiValues.plan.staffUnderstandingConfirmed = 'true';
    const input = `${ELEVATED_TEMP_FOLLOW_UP_INPUT} Staff verbalized understanding of temperature monitoring.`;
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues,
      input,
      def: ELEVATED_TEMPERATURE_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'resident',
    });

    expect(built.values.plan.staffUnderstandingConfirmed).toBe('true');
    expect(built.soap.plan).toMatch(
      /Staff verbalized or demonstrated understanding of instructions provided:\nStaff verbalized understanding/i,
    );
  });

  it('keeps rendered template headings immutable', () => {
    const schema = buildTemplateLockSchema(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const template = getFacilityFormTemplate(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up');
    const rendered = renderTemplateLockSoap(schema, emptyTemplateLockValues());
    const full = [rendered.subjective, rendered.objective, rendered.assessment, rendered.plan].join('\n');

    for (const label of [
      'SUBJECTIVE:',
      'OBJECTIVE:',
      'ASSESSMENT:',
      'PLAN:',
      'See Interactive View Assessment.',
      'Current temperature:',
      'Staff verbalized or demonstrated understanding of instructions provided:',
    ]) {
      expect(full).toContain(label);
      expect(template).toContain(label);
    }
  });
});
