import { describe, expect, it } from 'vitest';
import { GUIDELINE_DEFINITIONS } from './guidelineDefinitions';
import {
  buildGuidelinePlanLibraryBlock,
  getGuidelinePlanLibraryEntry,
  listGuidelinePlanLibraryIds,
  validatePlanAgainstLibrary,
} from './guidelinePlanLibrary';
import { extractPlanSectionLines, getFacilityFormTemplate } from './facilityFormTemplates';

describe('guidelinePlanLibrary', () => {
  it('covers every registered nursing guideline', () => {
    const libraryIds = new Set(listGuidelinePlanLibraryIds());
    for (const def of GUIDELINE_DEFINITIONS) {
      expect(libraryIds.has(def.id)).toBe(true);
    }
    expect(libraryIds.size).toBe(GUIDELINE_DEFINITIONS.length);
  });

  it('derives predefined plan statements from the fillable facility template', () => {
    const vomiting = GUIDELINE_DEFINITIONS.find((def) => def.id === 'vomiting');
    if (!vomiting) throw new Error('Vomiting guideline missing');

    const templatePlan = extractPlanSectionLines(getFacilityFormTemplate(vomiting, 'follow_up'));
    const libraryPlan = getGuidelinePlanLibraryEntry('vomiting', 'follow_up').predefinedPlanStatements;

    expect(libraryPlan).toEqual(templatePlan);
    expect(libraryPlan).toContain('Assess every shift for 24 hours after resident is symptom free.');
    expect(libraryPlan).toContain('Nursing interventions completed:');
  });

  it('renders the plan library block in the AI template', () => {
    const vomiting = GUIDELINE_DEFINITIONS.find((def) => def.id === 'vomiting');
    if (!vomiting) throw new Error('Vomiting guideline missing');

    const block = buildGuidelinePlanLibraryBlock(vomiting, 'follow_up');
    expect(block).toContain('FACILITY GUIDELINE PLAN LIBRARY');
    expect(block).toContain('PREDEFINED PLAN STATEMENTS');
    expect(block).toContain('STANDING INSTRUCTIONS');
    expect(block).toContain('Assess every shift for 24 hours after resident is symptom free.');
  });

  it('provides predefined plan statements for every registered guideline', () => {
    for (const def of GUIDELINE_DEFINITIONS) {
      const templatePlan = extractPlanSectionLines(getFacilityFormTemplate(def, 'initial'));
      const plan = getGuidelinePlanLibraryEntry(def.id, 'initial');
      expect(plan.predefinedPlanStatements.length).toBeGreaterThan(0);
      expect(plan.predefinedPlanStatements).toEqual(templatePlan);
    }
  });

  it('flags incomplete plans missing predefined facility plan statements', () => {
    const errors = validatePlanAgainstLibrary('Continue to observe resident.', 'vomiting', 'follow_up');
    expect(errors.some((error) => /Required predefined Plan statement missing|Required facility Plan prompt missing|Continue to monitor/i.test(error))).toBe(true);
  });
});
