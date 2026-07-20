import { describe, expect, it } from 'vitest';
import { GUIDELINE_DEFINITIONS } from './guidelineDefinitions';
import { ELEVATED_TEMPERATURE_GUIDELINE } from './definitions/elevated_temperature';
import { FALL_GUIDELINE } from './definitions/fall';
import { HEAD_INJURY_GUIDELINE } from './definitions/head_injury';
import { VOMITING_GUIDELINE } from './definitions/vomiting';
import type { AssessmentType } from './facilityTemplateMode';
import { buildDocumentationQualityCheck } from './documentationQualityCheck';
import { buildTemplateLockSchema, emptyTemplateLockValues } from './templateLockMode';
import { buildTemplateLockDocumentation } from './templateLockPopulation';
import {
  buildStaffEducationCoverageTable,
  detectStaffInstructionProvided,
  getGuidelineIdsWithoutStaffEducationRules,
  getStaffEducationRule,
  resolveStaffInstructionContent,
  STAFF_EDUCATION_RULES,
} from './staffEducationLibrary';
import { rerenderTemplateLockSoapWithStaffEducation } from './staffEducationTemplateLock';
import { validateAiDocumentationOutput } from '../lib/structuredDocumentation';
import { rerenderSoapWithNurseStaffEducation } from '../lib/templateLockClient';

const ASSESSMENT_TYPES: AssessmentType[] = ['initial', 'follow_up', 'resolution', 'other'];

const VOMITING_FOLLOW_UP_INPUT =
  'One emesis episode yesterday at 1730 after dinner. Emesis contained undigested food. DSP reported the individual ate too fast. Currently sleeping in bed. Respirations even and unlabored. No aspiration or respiratory distress. Abdomen soft and non-tender. No pain. Vital signs within normal limits. 100% meals. 52 oz fluid intake. 5 voids. 1 bowel movement. No nausea or further vomiting. Sitting upright.';

const VOMITING_WITH_NURSING_INPUT = `${VOMITING_FOLLOW_UP_INPUT} Nursing interventions completed.`;

const ELEVATED_TEMP_FOLLOW_UP_INPUT =
  'Follow-up assessment. Last elevated temperature was 101.8°F on 07/17/26 at 1800. Current temporal temperature is 98.4°F. Resident resting comfortably. No chills or additional fever noted. PRN Tylenol administered at 1830. Nursing interventions completed.';

const FALL_FOLLOW_UP_INPUT =
  'Fall follow-up. Individual ambulating with walker. No new pain or swelling. Neurological status unchanged. Nursing interventions completed.';

const HEAD_INJURY_INPUT =
  'At 1545, DSP reported head injury. Individual denies worsening headache. Nursing interventions completed. Staff verbalized understanding of neurological monitoring.';

const VOMITING_INSTRUCTION =
  'Monitor for recurrent vomiting, nausea, coughing or respiratory symptoms associated with aspiration, abdominal pain or distention, decreased intake or output, dehydration, or signs of gastric bleeding, and report changes to the nurse immediately.';

describe('staffEducationLibrary', () => {
  it('covers every registered guideline with a non-empty rule', () => {
    expect(getGuidelineIdsWithoutStaffEducationRules()).toEqual([]);
    for (const def of GUIDELINE_DEFINITIONS) {
      const rule = STAFF_EDUCATION_RULES[def.id];
      expect(rule, def.id).toBeDefined();
      expect(rule.instructionText.trim().length, def.id).toBeGreaterThan(0);
      expect(rule.instructionTopics.length, def.id).toBeGreaterThan(0);
    }
  });

  it.each(
    GUIDELINE_DEFINITIONS.flatMap((def) =>
      ASSESSMENT_TYPES.map((assessmentType) => [def.id, assessmentType] as const),
    ),
  )('provides relevant staff education for %s (%s)', (guidelineId, assessmentType) => {
    const def = GUIDELINE_DEFINITIONS.find((item) => item.id === guidelineId)!;
    const resolved = resolveStaffInstructionContent(def, assessmentType);
    expect(resolved.instructionText).toMatch(/monitor|observe|follow|report|notify/i);
    expect(resolved.instructionText).not.toMatch(/\b(?:prescribe|diagnose|order new medication)\b/i);
  });

  it('documents coverage rows for every guideline and assessment variant', () => {
    const rows = buildStaffEducationCoverageTable();
    expect(rows).toHaveLength(GUIDELINE_DEFINITIONS.length * ASSESSMENT_TYPES.length);
    expect(rows.every((row) => row.ruleFound)).toBe(true);
  });

  it('does not auto-confirm instruction provision from nursing interventions by default', () => {
    expect(detectStaffInstructionProvided('Nursing interventions completed.')).toBe(false);
    expect(
      detectStaffInstructionProvided('Nursing interventions completed.', {
        autoConfirmFromNursingInterventions: true,
      }),
    ).toBe(true);
    expect(detectStaffInstructionProvided('Resident resting comfortably.')).toBe(false);
  });

  it('generates vomiting education and leaves confirmation blank before nurse confirmation', () => {
    const schema = buildTemplateLockSchema(VOMITING_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: VOMITING_WITH_NURSING_INPUT,
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'individual',
    });

    expect(built.staffEducation.staffInstructionContent).toBe(VOMITING_INSTRUCTION);
    expect(built.staffEducation.staffInstructionProvided).toBe(false);
    expect(built.staffEducation.staffUnderstandingConfirmed).toBe(false);
    expect(built.soap.plan).toContain(
      'Staff verbalized or demonstrated understanding of instructions provided:',
    );
    expect(built.soap.plan).not.toMatch(
      /Staff verbalized or demonstrated understanding of instructions provided:\n(?:Staff verbalized|Unable to assess)/,
    );
    expect(built.staffEducation.suggestedStaffInstruction).toContain('recurrent vomiting');
  });

  it('auto-confirms instruction provision from nursing interventions when setting enabled', () => {
    const schema = buildTemplateLockSchema(VOMITING_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: VOMITING_WITH_NURSING_INPUT,
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'individual',
      autoConfirmStaffInstructionFromNursingInterventions: true,
    });

    expect(built.staffEducation.staffInstructionProvided).toBe(true);
    expect(built.staffEducation.staffUnderstandingConfirmed).toBe(false);
    expect(built.soap.plan).not.toMatch(
      /Staff verbalized or demonstrated understanding of instructions provided:\nStaff verbalized/i,
    );
  });

  it('populates understanding confirmation only when explicitly supported or nurse-confirmed', () => {
    const schema = buildTemplateLockSchema(HEAD_INJURY_GUIDELINE, 'initial');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: HEAD_INJURY_INPUT,
      def: HEAD_INJURY_GUIDELINE,
      assessmentType: 'initial',
      terminology: 'individual',
    });

    expect(built.staffEducation.staffUnderstandingConfirmed).toBe(true);
    expect(built.soap.plan).toMatch(
      /Staff verbalized or demonstrated understanding of instructions provided:\nStaff verbalized understanding/i,
    );
  });

  it('one-click nurse confirmation rerenders guideline-specific understanding without full regeneration', () => {
    const schema = buildTemplateLockSchema(VOMITING_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: VOMITING_FOLLOW_UP_INPUT,
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'individual',
    });

    const rerendered = rerenderSoapWithNurseStaffEducation({
      context: {
        guidelineId: 'vomiting',
        assessmentType: 'follow_up',
        combinedInput: VOMITING_FOLLOW_UP_INPUT,
        terminology: 'individual',
        values: built.values as unknown as Record<string, unknown>,
      },
      nurseConfirmations: {
        instructionProvided: true,
        understandingConfirmed: true,
      },
      autoGenerateStaffInstructionContent: true,
      autoConfirmStaffInstructionFromNursingInterventions: false,
    });

    expect(rerendered.soapText).toMatch(
      /Staff verbalized understanding of instructions to monitor for recurrent vomiting/i,
    );
    expect(rerendered.soapText).not.toContain('Unable to assess staff understanding');
    expect(rerendered.qualityCheck.completeness?.provided).toContain('Staff instruction provided');
    expect(rerendered.qualityCheck.completeness?.provided).toContain('Staff understanding confirmed');
  });

  it('renders elevated temperature follow-up staff education from facility standing instruction', () => {
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

    expect(built.staffEducation.staffInstructionContent).toMatch(
      /Monitor for increased temperature, chills, fatigue/i,
    );
    expect(built.staffEducation.staffInstructionProvided).toBe(true);
    expect(built.staffEducation.staffUnderstandingConfirmed).toBe(false);
    expect(built.soap.plan).not.toContain('Unable to assess staff understanding');
  });

  it('renders distinct education content for vomiting, elevated temperature, fall, and head injury', () => {
    const vomiting = resolveStaffInstructionContent(VOMITING_GUIDELINE, 'follow_up').instructionText;
    const elevated = resolveStaffInstructionContent(ELEVATED_TEMPERATURE_GUIDELINE, 'follow_up').instructionText;
    const fall = resolveStaffInstructionContent(FALL_GUIDELINE, 'follow_up').instructionText;
    const headInjury = resolveStaffInstructionContent(HEAD_INJURY_GUIDELINE, 'initial').instructionText;

    expect(vomiting).toMatch(/recurrent vomiting|vomiting/i);
    expect(elevated).toMatch(/temperature|chills|fatigue/i);
    expect(fall).toMatch(/pain, swelling, bruising/i);
    expect(headInjury).toMatch(/level of consciousness|headache|neurological/i);
    expect(new Set([vomiting, elevated, fall, headInjury]).size).toBe(4);
  });

  it('renders fall follow-up monitoring content from configured rule', () => {
    const rule = getStaffEducationRule('fall', 'follow_up');
    const resolved = resolveStaffInstructionContent(FALL_GUIDELINE, 'follow_up');
    expect(rule.instructionText).toMatch(/pain, swelling, bruising/i);
    expect(resolved.instructionText).toMatch(/pain, swelling, bruising/i);

    const schema = buildTemplateLockSchema(FALL_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: FALL_FOLLOW_UP_INPUT,
      def: FALL_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'individual',
      autoConfirmStaffInstructionFromNursingInterventions: true,
    });
    expect(built.staffEducation.staffInstructionContent).toMatch(/pain, swelling, bruising/i);
  });

  it('uses consolidated quality check warnings without duplicate staff education items', () => {
    const schema = buildTemplateLockSchema(VOMITING_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: VOMITING_FOLLOW_UP_INPUT,
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'individual',
    });

    const completeness = buildDocumentationQualityCheck({
      input: VOMITING_FOLLOW_UP_INPUT,
      soap: built.soap,
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      templateLockValues: built.values,
      templateLockSchema: schema,
    });

    expect(completeness.provided).toContain('Guideline-specific staff instruction generated');
    expect(completeness.provided).not.toContain('Staff instruction provided');
    expect(completeness.missing).toContain('Confirm whether instruction was provided and understood');
    expect(completeness.missing).not.toContain('Staff instruction provision not documented');
    expect(completeness.missing).not.toContain('Staff understanding confirmation not documented');
    expect(
      completeness.categorizedMissing?.filter((item) =>
        item.label === 'Confirm whether instruction was provided and understood'
        || item.label === 'Staff instruction documented; understanding confirmation needed',
      ),
    ).toHaveLength(1);
  });

  it('validates vomiting regression through structured documentation pipeline', () => {
    const schema = buildTemplateLockSchema(VOMITING_GUIDELINE, 'follow_up');
    const built = buildTemplateLockDocumentation({
      schema,
      aiValues: emptyTemplateLockValues(),
      input: VOMITING_WITH_NURSING_INPUT,
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      terminology: 'individual',
    });

    const validation = validateAiDocumentationOutput(
      { soap: built.soap, qualityCheckCompleteness: { provided: [], missing: [] } },
      VOMITING_WITH_NURSING_INPUT,
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

    expect(built.values.plan.staffInstructionContent).toContain('recurrent vomiting');
    expect(built.values.plan.staffInstructionProvided).toBe('false');
    expect(built.values.plan.staffUnderstandingConfirmed).toBe('false');
    expect(validation.completeness?.missing).toContain('Confirm whether instruction was provided and understood');
    expect(built.soap.plan).not.toContain('Unable to assess staff understanding');
  });

  it('rerenders template lock SOAP in place via structured staff education values', () => {
    const schema = buildTemplateLockSchema(VOMITING_GUIDELINE, 'follow_up');
    const values = emptyTemplateLockValues();
    const rerendered = rerenderTemplateLockSoapWithStaffEducation({
      values,
      schema,
      input: VOMITING_FOLLOW_UP_INPUT,
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      nurseConfirmations: {
        instructionProvided: true,
        understandingConfirmed: true,
      },
    });

    expect(rerendered.soap.plan).toMatch(
      /Staff verbalized understanding of instructions to monitor for recurrent vomiting/i,
    );
    expect(rerendered.soap.plan).toContain('Nursing interventions completed:');
  });
});
