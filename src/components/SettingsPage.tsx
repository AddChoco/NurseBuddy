import { X, Sun, Moon, Monitor, User, Globe } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import type { ThemeMode, Terminology, Language } from '../types';

interface SettingsPageProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

const TERMINOLOGY_OPTIONS: { id: Terminology; label: string }[] = [
  { id: 'individual', label: 'Individual' },
  { id: 'resident', label: 'Resident' },
  { id: 'patient', label: 'Patient' },
  { id: 'client', label: 'Client' },
];

const LANGUAGE_OPTIONS: { id: Language; label: string; native: string }[] = [
  { id: 'english', label: 'English', native: 'English' },
  { id: 'korean', label: 'Korean', native: '한국어' },
  { id: 'spanish', label: 'Spanish', native: 'Español' },
];

export function SettingsPage({ open, onClose }: SettingsPageProps) {
  const { settings, setTheme, setTerminology, setLanguage, setAutoCompleteStaffEducation } = useSettings();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-t-4xl bg-white p-6 shadow-soft-lg dark:bg-gray-800 sm:rounded-4xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-gray-800 dark:text-gray-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-gray-400 transition-all hover:bg-pink-50 hover:text-pink-600 active:scale-95 dark:hover:bg-pink-900/20"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Theme */}
        <section className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-pink-700 dark:text-pink-200">
            <Sun className="h-4 w-4" />
            Theme
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = settings.theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 transition-all active:scale-95 ${
                    active
                      ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-500 dark:bg-pink-900/20 dark:text-pink-300'
                      : 'border-gray-100 bg-white text-gray-500 hover:border-pink-200 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Terminology */}
        <section className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-pink-700 dark:text-pink-200">
            <User className="h-4 w-4" />
            Preferred Terminology
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {TERMINOLOGY_OPTIONS.map((opt) => {
              const active = settings.terminology === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTerminology(opt.id)}
                  className={`rounded-2xl border-2 px-3 py-3.5 text-sm font-semibold transition-all active:scale-95 ${
                    active
                      ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-500 dark:bg-pink-900/20 dark:text-pink-300'
                      : 'border-gray-100 bg-white text-gray-500 hover:border-pink-200 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Documentation */}
        <section className="mb-6">
          <h3 className="mb-3 text-sm font-bold text-pink-700 dark:text-pink-200">
            Documentation
          </h3>
          <label className="flex items-start gap-3 rounded-2xl border-2 border-gray-100 bg-white px-4 py-3.5 dark:border-gray-700 dark:bg-gray-900/50">
            <input
              type="checkbox"
              checked={settings.autoCompleteStaffEducation}
              onChange={(event) => setAutoCompleteStaffEducation(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-400"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-800 dark:text-gray-100">
                Auto-complete staff education documentation
              </span>
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                When nursing instructions are generated, complete standard staff education prompts such as &quot;Staff verbalized or demonstrated understanding of instructions provided.&quot;
              </span>
            </span>
          </label>
        </section>

        {/* Language */}
        <section className="mb-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-pink-700 dark:text-pink-200">
            <Globe className="h-4 w-4" />
            Input Language
          </h3>
          <div className="space-y-2">
            {LANGUAGE_OPTIONS.map((opt) => {
              const active = settings.language === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setLanguage(opt.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3.5 transition-all active:scale-[0.98] ${
                    active
                      ? 'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-500 dark:bg-pink-900/20 dark:text-pink-300'
                      : 'border-gray-100 bg-white text-gray-500 hover:border-pink-200 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400'
                  }`}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className="text-sm opacity-70">{opt.native}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Documentation is generated in professional English by default.
          </p>
        </section>
      </div>
    </div>
  );
}
