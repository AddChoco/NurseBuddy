import { describe, expect, it } from 'vitest';
import { GUIDELINE_DEFINITIONS } from './guidelineDefinitions';
import {
  buildGuidelinePlanLibraryBlock,
  getGuidelinePlanLibraryEntry,
  listGuidelinePlanLibraryIds,
  validatePlanAgainstLibrary,
} from './guidelinePlanLibrary';

describe('guidelinePlanLibrary', () => {
  it('covers every registered nursing guideline', () => {
    const libraryIds = new Set(listGuidelinePlanLibraryIds());
    for (const def of GUIDELINE_DEFINITIONS) {
      expect(libraryIds.has(def.id)).toBe(true);
    }
    expect(libraryIds.size).toBe(GUIDELINE_DEFINITIONS.length);
  });

  it('includes mandatory prospective elements for vomiting follow-up', () => {
    const plan = getGuidelinePlanLibraryEntry('vomiting', 'follow_up');
    expect(plan.prospectivePlanElements).toContain('Assess every shift for 24 hours after resident is symptom free');
    expect(plan.dspMonitoringInstructions).toMatch(/emesis/i);
    expect(plan.providerNotificationRequirements.some((item) => /PCP/i.test(item))).toBe(true);
  });

  it('renders the plan library block in the AI template', () => {
    const vomiting = GUIDELINE_DEFINITIONS.find((def) => def.id === 'vomiting');
    if (!vomiting) throw new Error('Vomiting guideline missing');

    const block = buildGuidelinePlanLibraryBlock(vomiting, 'follow_up');
    expect(block).toContain('FACILITY GUIDELINE PLAN LIBRARY');
    expect(block).toContain('CATEGORY B — PROSPECTIVE PLAN ELEMENTS');
    expect(block).toContain('ROUTINE DSP MONITORING INSTRUCTIONS');
    expect(block).toContain('PROVIDER NOTIFICATION REQUIREMENTS');
    expect(block).toContain('FOLLOW-UP ACTIONS');
    expect(block).toContain('EDUCATION POINTS');
  });

  it('flags incomplete plans missing library monitoring language', () => {
    const errors = validatePlanAgainstLibrary('Continue to observe resident.', 'vomiting', 'follow_up');
    expect(errors.some((error) => /monitor/i.test(error))).toBe(true);
  });
});
