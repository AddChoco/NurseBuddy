import { Mic, MicOff, Square, AlertCircle } from 'lucide-react';
import { UNSUPPORTED_SPEECH_RECOGNITION_MESSAGE, useVoiceInput } from '../hooks/useVoiceInput';
import { useSettings } from '../context/SettingsContext';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
}

export function VoiceInputButton({ onResult }: VoiceInputButtonProps) {
  const { settings } = useSettings();
  const { listening, supported, error, toggle, setError } = useVoiceInput({
    language: settings.language,
    onResult,
  });

  if (!supported) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <MicOff className="h-5 w-5" />
          {error ?? UNSUPPORTED_SPEECH_RECOGNITION_MESSAGE}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        className={`group relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
          listening
            ? 'animate-mic-pulse bg-pink-500 text-white shadow-soft-lg'
            : 'bg-gradient-to-br from-pink-400 to-pink-500 text-white shadow-soft-lg hover:from-pink-500 hover:to-pink-600'
        }`}
        aria-label={listening ? 'Stop voice input' : 'Start voice input'}
      >
        {listening ? (
          <Square className="h-7 w-7 fill-white" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>
      <div className="text-center">
        <p className="text-sm font-semibold text-pink-700 dark:text-pink-200">
          {listening ? 'Listening... Tap to stop' : 'Tap to dictate'}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {settings.language === 'english' && 'English'}
          {settings.language === 'korean' && 'Korean (한국어)'}
          {settings.language === 'spanish' && 'Spanish (Español)'}
        </p>
      </div>
      {error && (
        <div role="alert" className="flex max-w-sm items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto shrink-0 font-semibold underline">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
