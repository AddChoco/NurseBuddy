import { describe, expect, it } from 'vitest';
import { VOMITING_GUIDELINE } from './definitions/vomiting';
import { buildDocumentationQualityCheck } from './documentationQualityCheck';
import { enrichFacilityPlanPrompts } from './planPromptEnrichment';
import { enrichAssessmentSection } from './soapSectionEnrichment';
import { evaluateGuidelinePlanRules, createPlanDocumentationContext } from './guidelinePlanRuleEngine';
import { getFacilityFormTemplate } from './facilityFormTemplates';
import { validateAiDocumentationOutput } from '../lib/structuredDocumentation';

const VOMITING_FOLLOW_UP_INPUT =
  'One emesis episode yesterday at 1730 after dinner. Emesis contained undigested food. DSP reported the individual ate too fast. Currently sleeping in bed. Respirations even and unlabored. No aspiration or respiratory distress. Abdomen soft and non-tender. No pain. Vital signs within normal limits. 100% meals. 52 oz fluid intake. 5 voids. 1 bowel movement. No nausea or further vomiting. Sitting upright.';

describe('documentationQualityCheck', () => {
  it('scores vomiting follow-up from applicable guideline fields', () => {
    const template = getFacilityFormTemplate(VOMITING_GUIDELINE, 'follow_up');
    const planSection = template.split('PLAN:')[1]?.trim() ?? '';
    const planEnrichment = enrichFacilityPlanPrompts(
      planSection,
      VOMITING_FOLLOW_UP_INPUT,
      VOMITING_GUIDELINE,
      'follow_up',
      { autoCompleteStaffEducation: true },
      {
        objective:
          'See Interactive View Assessment.\nLast vomiting episode: Yesterday at 1730 after dinner.\nIntake/output: 100% meals, 52 oz fluid intake, 5 voids, 1 bowel movement.\nPresence or absence of nausea: No nausea or further vomiting.\nPositioning per PNMP: Sitting upright.',
      },
    );

    const assessment = enrichAssessmentSection(
      'Vomiting Follow-up.',
      VOMITING_FOLLOW_UP_INPUT,
      VOMITING_GUIDELINE,
      'resident',
    );

    const qualityCheck = buildDocumentationQualityCheck({
      input: VOMITING_FOLLOW_UP_INPUT,
      soap: {
        subjective: 'DSP reported one emesis episode yesterday at 1730 after dinner.',
        objective:
          'See Interactive View Assessment.\nLast vomiting episode: Yesterday at 1730 after dinner.\nIntake/output: 100% meals, 52 oz fluid intake, 5 voids, 1 bowel movement.\nPresence or absence of nausea: No nausea or further vomiting.\nPositioning per PNMP: Sitting upright.',
        assessment,
        plan: planEnrichment.plan,
      },
      def: VOMITING_GUIDELINE,
      assessmentType: 'follow_up',
      enrichment: planEnrichment,
    });

    expect(qualityCheck.provided).toContain('Event time documented');
    expect(qualityCheck.provided).toContain('Positioning per PNMP documented');
    expect(qualityCheck.provided).toContain('Nursing interventions documented');
    expect(qualityCheck.missing).not.toContain('Event time');
    expect(qualityCheck.missing).not.toContain('Positioning per PNMP');
    expect(qualityCheck.provided).not.toContain('Gastric bleeding if suspected documented');
    expect(qualityCheck.scorePercent).toBeGreaterThan(0);
    expect(qualityCheck.scorePercent).toBeLessThan(100);
  });
});

describe('vomiting follow-up refinements', () => {
  it('builds clinically ordered nursing interventions and assessment interpretation', () => {
    const context = createPlanDocumentationContext(VOMITING_FOLLOW_UP_INPUT, VOMITING_GUIDELINE, {
      objective:
        'See Interactive View Assessment.\nIntake/output: 100% meals, 52 oz fluid intake, 5 voids, 1 bowel movement.\nPresence or absence of nausea: No nausea.\nPositioning per PNMP: Sitting upright.',
    });

    const evaluation = evaluateGuidelinePlanRules(
      VOMITING_GUIDELINE,
      'follow_up',
      context,
      true,
      null,
      true,
    );

    expect(evaluation.nursingInterventionsSummary).toBe(
      'Nursing assessment completed. Vital signs obtained. Respiratory and abdominal assessments completed. Resident positioned upright. Intake and output reviewed. Hydration encouraged. Ongoing monitoring continued according to the Vomiting Guideline.',
    );

    const assessment = enrichAssessmentSection(
      'Vomiting Follow-up.',
      VOMITING_FOLLOW_UP_INPUT,
      VOMITING_GUIDELINE,
      'resident',
    );

    expect(assessment).toBe(
      'Vomiting Follow-up.\nVomiting episode with no further emesis or nausea and no signs of aspiration or respiratory distress. Intake and output documented.',
    );
  });

  it('syncs quality check with enriched SOAP output', () => {
    const template = getFacilityFormTemplate(VOMITING_GUIDELINE, 'follow_up');
    const parsed = {
      soap: {
        subjective: 'DSP reported one emesis episode yesterday at 1730 after dinner.',
        objective:
          'See Interactive View Assessment.\nLast vomiting episode: Yesterday at 1730 after dinner.\nIntake/output: 100% meals, 52 oz fluid intake, 5 voids, 1 bowel movement.\nPresence or absence of nausea: No nausea or further vomiting.\nPositioning per PNMP: Sitting upright.',
        assessment: 'Vomiting Follow-up.',
        plan: template.split('PLAN:')[1]?.trim() ?? '',
      },
      qualityCheckCompleteness: { provided: [], missing: [] },
    };

    const validation = validateAiDocumentationOutput(
      parsed,
      VOMITING_FOLLOW_UP_INPUT,
      VOMITING_GUIDELINE,
      'follow_up',
    );

    expect(validation.completeness?.provided).toContain('Event time documented');
    expect(validation.completeness?.provided).toContain('Nursing interventions documented');
    expect(validation.completeness?.missing).not.toEqual(
      expect.arrayContaining(['Event time', 'Positioning per PNMP']),
    );
    expect(typeof validation.completeness?.scorePercent).toBe('number');
  });
});
