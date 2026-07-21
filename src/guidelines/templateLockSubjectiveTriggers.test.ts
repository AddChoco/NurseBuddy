import { describe, expect, it } from 'vitest';
import type { GuidelineDefinition } from './types';
import {
  buildGuidelineSubjectiveTrigger,
  isInvalidSubjectiveAssessmentTrigger,
} from './templateLockSubjectiveTriggers';

describe('template-lock subjective triggers', () => {
  it.each(['', 'unknown', 'Not provided.', 'Subjective:', 'Resident resting comfortably.'])(
    'rejects invalid subjective trigger %j',
    (value) => expect(isInvalidSubjectiveAssessmentTrigger(value)).toBe(true),
  );

  it.each([
    'DSP reported one episode of emesis after dinner.',
    'Vomiting follow-up assessment completed per facility guideline.',
  ])('keeps supported trigger context %j', (value) => {
    expect(isInvalidSubjectiveAssessmentTrigger(value)).toBe(false);
  });

  it('builds a deterministic assessment-type-specific fallback', () => {
    const def = { displayName: 'Vomiting' } as GuidelineDefinition;

    expect(buildGuidelineSubjectiveTrigger(def, 'follow_up', '', 'resident')).toBe(
      'Vomiting follow-up assessment completed per facility guideline.',
    );
  });
});
