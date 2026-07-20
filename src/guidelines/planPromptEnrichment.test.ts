import { describe, expect, it } from 'vitest';
import { FALL_GUIDELINE } from './definitions/fall';
import { getFacilityFormTemplate } from './facilityFormTemplates';
import {
  buildNursingInterventionsSummary,
  enrichFacilityPlanPrompts,
  planDocumentsNursingInterventions,
} from './planPromptEnrichment';
import {
  applyFacilityPlanEnrichment,
  validateAiDocumentationOutput,
  type StructuredDocumentationResponse,
} from '../lib/structuredDocumentation';
import { detectNursingInterventionsCompleted } from './clinicalFactExtraction';

const FALL_FOLLOW_UP_NARRATIVE =
  'This resident fell yesterday outside. DSP said the fall was unwitnessed. Resident landed face down on the ground. No visible injury. Resident denies pain. No bruising noted. Vital signs are within normal limits. Neurological and mental status remain unchanged from baseline. Resident is currently taking aspirin 81 mg daily. Resident is ambulating with a walker without difficulty. Nursing interventions completed.';

describe('planPromptEnrichment', () => {
  it('detects nursing interventions completed in English and Korean phrasing', () => {
    expect(detectNursingInterventionsCompleted('Nursing interventions completed.')).toBe(true);
    expect(detectNursingInterventionsCompleted('간호 중재 완료')).toBe(true);
    expect(detectNursingInterventionsCompleted('Resident assessed for pain only.')).toBe(false);
  });

  it('builds the Fall follow-up nursing interventions summary from supported facts only', () => {
    const summary = buildNursingInterventionsSummary(
      FALL_FOLLOW_UP_NARRATIVE,
      FALL_GUIDELINE,
      'follow_up',
    );

    expect(summary).toBe(
      'Follow-up nursing assessment completed. Vital signs, neurological and mental status, pain, skin condition, and mobility were assessed. Current aspirin use was reviewed.',
    );
  });

  it('populates Fall follow-up Plan prompts without changing template order', () => {
    const template = getFacilityFormTemplate(FALL_GUIDELINE, 'follow_up');
    const planSection = template.split('PLAN:')[1]?.trim() ?? '';
    const enrichment = enrichFacilityPlanPrompts(
      planSection,
      FALL_FOLLOW_UP_NARRATIVE,
      FALL_GUIDELINE,
      'follow_up',
      { autoCompleteStaffEducation: true },
    );

    expect(planDocumentsNursingInterventions(enrichment.plan, FALL_GUIDELINE, 'follow_up')).toBe(true);
    expect(enrichment.plan).toMatch(
      /Nursing interventions completed:\nFollow-up nursing assessment completed\. Vital signs, neurological and mental status, pain, skin condition, and mobility were assessed\. Current aspirin use was reviewed\./,
    );
    expect(enrichment.plan).toContain(
      'DSP/staff instructed to monitor for and immediately report pain, swelling, bruising, bleeding, change in neurological or mental status, nausea, vomiting, dizziness, weakness, difficulty with mobility, or any other change from baseline.',
    );
    expect(enrichment.plan).toMatch(
      /Notify the oncoming nurse through the 24-hour report or nurse-to-nurse report if further follow-up is indicated:\nDSP\/staff instructed to monitor/,
    );
    expect(enrichment.plan).toMatch(
      /DSP\/staff instructed to monitor[\s\S]*\nStaff verbalized or demonstrated understanding of instructions provided:/,
    );
    expect(enrichment.staffUnderstandingValue).toBeNull();
    expect(enrichment.plan).not.toMatch(
      /Staff verbalized or demonstrated understanding of instructions provided:\nStaff verbalized understanding of/i,
    );
  });

  it('uses guideline fallback when only completion is documented', () => {
    const summary = buildNursingInterventionsSummary(
      'Nursing interventions completed.',
      FALL_GUIDELINE,
      'follow_up',
    );

    expect(summary).toBe('Nursing interventions completed according to the Fall or Suspected Fall Guideline.');
  });

  it('keeps SOAP Plan and quality check synchronized for Fall follow-up', () => {
    const parsed: StructuredDocumentationResponse = {
      soap: {
        subjective: '',
        objective: 'See Interactive View Assessment.\nCurrent neurological and mental status compared with baseline:\nUnchanged from baseline.\nCurrent use of anticoagulant or antiplatelet medication:\nAspirin 81 mg daily.',
        assessment: 'Fall or Suspected Fall follow-up status.',
        plan: getFacilityFormTemplate(FALL_GUIDELINE, 'follow_up').split('PLAN:')[1]?.trim() ?? '',
      },
      qualityCheckCompleteness: {
        provided: ['Neurological and mental status unchanged from baseline', 'Aspirin use'],
        missing: ['Nursing interventions completed'],
      },
    };

    const validation = validateAiDocumentationOutput(
      parsed,
      FALL_FOLLOW_UP_NARRATIVE,
      FALL_GUIDELINE,
      'follow_up',
      'facility_template',
      { autoCompleteStaffEducation: true },
    );

    expect(planDocumentsNursingInterventions(parsed.soap.plan, FALL_GUIDELINE, 'follow_up')).toBe(true);
    expect(validation.completeness.provided).toContain('Nursing interventions documented');
    expect(validation.completeness.provided).toContain('Guideline-specific staff instruction generated');
    expect(validation.completeness.missing).toContain('Staff instruction documented; understanding confirmation needed');
    expect(parsed.soap.plan).not.toContain('Staff verbalized understanding of neurological monitoring');
    expect(validation.errors.some((error) => /Unsupported completed finding/i.test(error))).toBe(false);
    expect(validation.errors.some((error) => /missing from the Plan/i.test(error))).toBe(false);
  });

  it('fills staff understanding only when explicitly documented', () => {
    const template = getFacilityFormTemplate(FALL_GUIDELINE, 'follow_up');
    const planSection = template.split('PLAN:')[1]?.trim() ?? '';
    const enrichment = enrichFacilityPlanPrompts(
      planSection,
      `${FALL_FOLLOW_UP_NARRATIVE} Staff verbalized understanding of the instructions provided.`,
      FALL_GUIDELINE,
      'follow_up',
      { autoCompleteStaffEducation: true },
    );

    expect(enrichment.staffUnderstandingValue).toBe(
      'Staff verbalized understanding of neurological monitoring, fall precautions, delayed symptom reporting, and provider notification requirements.',
    );
    expect(enrichment.plan).toMatch(
      /Staff verbalized or demonstrated understanding of instructions provided:\nStaff verbalized understanding of neurological monitoring, fall precautions, delayed symptom reporting, and provider notification requirements\./,
    );
  });

  it('applyFacilityPlanEnrichment mutates parsed SOAP plan in place', () => {
    const parsed: StructuredDocumentationResponse = {
      soap: {
        subjective: '',
        objective: '',
        assessment: '',
        plan: 'Nursing interventions completed:\nContinue assessment each shift for the required 24-hour period.',
      },
    };

    applyFacilityPlanEnrichment(
      parsed,
      FALL_FOLLOW_UP_NARRATIVE,
      FALL_GUIDELINE,
      'follow_up',
      { autoCompleteStaffEducation: true },
    );

    expect(planDocumentsNursingInterventions(parsed.soap.plan, FALL_GUIDELINE, 'follow_up')).toBe(true);
  });
});
