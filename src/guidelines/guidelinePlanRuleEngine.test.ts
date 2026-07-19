import { describe, expect, it } from 'vitest';
import { ELEVATED_TEMPERATURE_GUIDELINE } from './definitions/elevated_temperature';
import { FALL_GUIDELINE } from './definitions/fall';
import { PAIN_GUIDELINE } from './definitions/pain';
import { RESPIRATORY_GUIDELINE } from './definitions/respiratory';
import { VOMITING_GUIDELINE } from './definitions/vomiting';
import {
  createPlanDocumentationContext,
  evaluateGuidelinePlanRules,
  getGuidelinePlanRuleSet,
} from './guidelinePlanRuleEngine';
import { enrichFacilityPlanPrompts, planDocumentsNursingInterventions } from './planPromptEnrichment';
import { getFacilityFormTemplate } from './facilityFormTemplates';

describe('guidelinePlanRuleEngine', () => {
  it('defines reusable rule sets for every guideline', () => {
    const guidelineIds = [
      'vomiting',
      'elevated_temperature',
      'fall',
      'pain',
      'respiratory',
      'other',
    ] as const;

    for (const id of guidelineIds) {
      const def = id === 'vomiting'
        ? VOMITING_GUIDELINE
        : id === 'elevated_temperature'
          ? ELEVATED_TEMPERATURE_GUIDELINE
          : id === 'fall'
            ? FALL_GUIDELINE
            : id === 'pain'
              ? PAIN_GUIDELINE
              : id === 'respiratory'
                ? RESPIRATORY_GUIDELINE
                : { id: 'other', displayName: 'Other / General Nursing Assessment' } as typeof VOMITING_GUIDELINE;

      const ruleSet = getGuidelinePlanRuleSet(def, 'initial');
      expect(ruleSet.interventionRules.length).toBeGreaterThan(0);
      expect(ruleSet.staffUnderstandingText).toMatch(/^Staff verbalized understanding of/i);
    }
  });

  it('builds vomiting interventions from documented assessment actions', () => {
    const input =
      'Resident had one episode of emesis. Abdominal assessment completed. Vital signs obtained. Intake and output reviewed. Resident positioned per PNMP. Ongoing monitoring initiated. Nursing interventions completed.';
    const context = createPlanDocumentationContext(input, VOMITING_GUIDELINE);
    const evaluation = evaluateGuidelinePlanRules(
      VOMITING_GUIDELINE,
      'initial',
      context,
      false,
      null,
      true,
    );

    expect(evaluation.nursingInterventionsSummary).toContain('Nursing assessment completed.');
    expect(evaluation.nursingInterventionsSummary).toContain('Abdominal assessment completed.');
    expect(evaluation.nursingInterventionsSummary).toContain('Vital signs obtained.');
    expect(evaluation.nursingInterventionsSummary).toContain('Intake and output reviewed.');
    expect(evaluation.nursingInterventionsSummary).toContain('Resident maintained in PNMP-recommended positioning.');
    expect(evaluation.nursingInterventionsSummary).toContain('Ongoing monitoring continued according to the Vomiting Guideline.');
    expect(evaluation.staffUnderstandingText).toContain('vomiting monitoring');
  });

  it('builds elevated temperature interventions without fabricating unsupported actions', () => {
    const input =
      'Follow-up assessment. Temperature reassessed at 98.4. Vital signs obtained. Fluids encouraged as tolerated. PRN Tylenol administered at 1830.';
    const context = createPlanDocumentationContext(input, ELEVATED_TEMPERATURE_GUIDELINE);
    const evaluation = evaluateGuidelinePlanRules(
      ELEVATED_TEMPERATURE_GUIDELINE,
      'follow_up',
      context,
      true,
      null,
      true,
    );

    expect(evaluation.nursingInterventionsSummary).toContain('Temperature reassessed.');
    expect(evaluation.nursingInterventionsSummary).toContain('Vital signs obtained.');
    expect(evaluation.nursingInterventionsSummary).toContain('PRN Tylenol administered.');
    expect(evaluation.nursingInterventionsSummary).not.toContain('Neurological assessment completed.');
    expect(evaluation.staffUnderstandingText).toContain('temperature monitoring');
  });

  it('populates guideline-specific staff understanding in the Plan prompt', () => {
    const template = getFacilityFormTemplate(VOMITING_GUIDELINE, 'initial');
    const planSection = template.split('PLAN:')[1]?.trim() ?? '';
    const enrichment = enrichFacilityPlanPrompts(
      planSection,
      'Resident had emesis after dinner. Abdominal assessment completed. Vital signs obtained. Intake and output reviewed. Resident positioned per PNMP. Ongoing monitoring initiated. Nursing interventions completed.',
      VOMITING_GUIDELINE,
      'initial',
      { autoCompleteStaffEducation: true },
    );

    expect(planDocumentsNursingInterventions(enrichment.plan, VOMITING_GUIDELINE, 'initial')).toBe(true);
    expect(enrichment.plan).toMatch(/Staff verbalized or demonstrated understanding of instructions provided:\s*$/m);
  });

  it('populates pain guideline staff understanding only when explicitly documented', () => {
    const template = getFacilityFormTemplate(PAIN_GUIDELINE, 'follow_up');
    const planSection = template.split('PLAN:')[1]?.trim() ?? '';
    const enrichment = enrichFacilityPlanPrompts(
      planSection,
      `${PAIN_GUIDELINE.displayName} follow-up. Pain assessment completed. Medication effectiveness evaluated. Staff verbalized understanding of pain monitoring.`,
      PAIN_GUIDELINE,
      'follow_up',
      { autoCompleteStaffEducation: true },
    );

    expect(enrichment.plan).toMatch(
      /Staff verbalized or demonstrated understanding of instructions provided:\nStaff verbalized understanding of pain monitoring, reassessment, medication response, and reporting worsening pain\./,
    );
  });
});
