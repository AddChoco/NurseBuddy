import { describe, expect, it } from 'vitest';
import { getSpeechRecognitionErrorMessage } from './useVoiceInput';

describe('getSpeechRecognitionErrorMessage', () => {
  it.each([
    ['no-speech', 'No speech was detected.'],
    ['audio-capture', 'No microphone was found or it is unavailable.'],
    ['not-allowed', 'Microphone access was denied.'],
    ['service-not-allowed', 'Microphone access was denied.'],
    ['network', 'A network error interrupted voice input.'],
    ['aborted', 'Voice input was canceled.'],
  ])('returns a helpful message for %s', (errorCode, expectedText) => {
    expect(getSpeechRecognitionErrorMessage(errorCode)).toContain(expectedText);
  });

  it('does not expose an unknown browser error code to the user', () => {
    expect(getSpeechRecognitionErrorMessage('unknown-browser-code')).toBe(
      'Voice input could not understand the request. Please try again.',
    );
  });
});
