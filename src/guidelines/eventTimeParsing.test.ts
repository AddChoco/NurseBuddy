import { describe, expect, it } from 'vitest';
import { extractClinicalFacts } from './clinicalFactExtraction';
import { outputIncludesDocumentedEventTime, parseDocumentedEventTime } from './eventTimeParsing';

describe('eventTimeParsing', () => {
  it('does not treat temperature values as event times', () => {
    expect(parseDocumentedEventTime('Temperature 101.2°F temporal at follow-up.')).toBeNull();
    expect(extractClinicalFacts('Temperature 101.2°F temporal at follow-up.', 'elevated_temperature').eventTime).toBeNull();
  });

  it('extracts documented assessment and event times exactly as entered', () => {
    expect(parseDocumentedEventTime('Assessment time 1830. Resident afebrile.')).toBe('1830');
    expect(parseDocumentedEventTime('At 1800 DSP reported chills.')).toBe('1800');
    expect(parseDocumentedEventTime('Event time: 0315')).toBe('0315');
    expect(parseDocumentedEventTime('PRN Tylenol administered at 1830.')).toBe('1830');
  });

  it('validates output preserves the documented event time token', () => {
    const input = 'Assessment time 1830. Temperature 101.2°F.';
    expect(outputIncludesDocumentedEventTime(input, 'Resident afebrile at follow-up. Assessment completed at 1830.')).toBe(true);
    expect(outputIncludesDocumentedEventTime(input, 'Event time:\n101')).toBe(false);
  });
});
