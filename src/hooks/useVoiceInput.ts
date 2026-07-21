import { useRef, useState, useCallback, useEffect } from 'react';
import type { Language } from '../types';

// Minimal type augmentation for the Web Speech API (not in standard TS lib)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const SPEECH_RECOGNITION_ERRORS: Record<string, string> = {
  'no-speech': 'No speech was detected. Please try again and speak clearly into your microphone.',
  'audio-capture': 'No microphone was found or it is unavailable. Check your microphone connection and browser settings.',
  'not-allowed': 'Microphone access was denied. Please allow microphone access in your browser settings.',
  'service-not-allowed': 'Microphone access was denied. Please allow microphone access in your browser settings.',
  network: 'A network error interrupted voice input. Check your connection and try again.',
  aborted: 'Voice input was canceled. Tap the microphone to try again.',
};

export const UNSUPPORTED_SPEECH_RECOGNITION_MESSAGE =
  'Voice input is not supported in this browser. Please use a browser that supports speech recognition.';

export function getSpeechRecognitionErrorMessage(errorCode: string): string {
  return SPEECH_RECOGNITION_ERRORS[errorCode]
    ?? 'Voice input could not understand the request. Please try again.';
}

const LANG_MAP: Record<Language, string> = {
  english: 'en-US',
  korean: 'ko-KR',
  spanish: 'es-ES',
};

interface UseVoiceInputOptions {
  language: Language;
  onResult: (text: string) => void;
}

export function useVoiceInput({ language, onResult }: UseVoiceInputOptions) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  const languageRef = useRef(language);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const Ctor = (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      setListening(false);
      setError(UNSUPPORTED_SPEECH_RECOGNITION_MESSAGE);
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_MAP[languageRef.current];

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += transcript;
        }
      }
      if (finalText.trim()) {
        onResultRef.current(finalText.trim() + ' ');
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setListening(false);
      setError(getSpeechRecognitionErrorMessage(e.error));
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  // Update language when it changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = LANG_MAP[language];
    }
  }, [language]);

  const start = useCallback(() => {
    setError(null);
    const rec = recognitionRef.current;
    if (!rec) {
      setListening(false);
      setError(UNSUPPORTED_SPEECH_RECOGNITION_MESSAGE);
      return;
    }
    try {
      rec.lang = LANG_MAP[languageRef.current];
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      setError('Voice input could not start. Please wait a moment and try again.');
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } finally {
      setListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { listening, supported, error, start, stop, toggle, setError };
}
