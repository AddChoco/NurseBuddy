import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Settings, ThemeMode, Terminology, Language } from '../types';

const STORAGE_KEY = 'nurse-buddy-settings';

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  terminology: 'resident',
  language: 'english',
  autoCompleteStaffEducation: true,
  autoConfirmStaffInstructionFromNursingInterventions: false,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === 'dark' || (mode === 'system' && systemDark);
  root.classList.toggle('dark', isDark);
  root.classList.add('theme-transition');
}

interface SettingsContextValue {
  settings: Settings;
  setTheme: (t: ThemeMode) => void;
  setTerminology: (t: Terminology) => void;
  setLanguage: (l: Language) => void;
  setAutoCompleteStaffEducation: (enabled: boolean) => void;
  setAutoConfirmStaffInstructionFromNursingInterventions: (enabled: boolean) => void;
  /** resolved dark mode (system => actual) */
  isDark: boolean;
  toggleQuickTheme: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    applyTheme(settings.theme);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(settings.theme === 'dark' || (settings.theme === 'system' && systemDark));
  }, [settings.theme]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      applyTheme('system');
      setIsDark(mq.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((s) => ({ ...s, theme }));
  }, []);

  const setTerminology = useCallback((terminology: Terminology) => {
    setSettings((s) => ({ ...s, terminology }));
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setSettings((s) => ({ ...s, language }));
  }, []);

  const setAutoCompleteStaffEducation = useCallback((autoCompleteStaffEducation: boolean) => {
    setSettings((s) => ({ ...s, autoCompleteStaffEducation }));
  }, []);

  const setAutoConfirmStaffInstructionFromNursingInterventions = useCallback(
    (autoConfirmStaffInstructionFromNursingInterventions: boolean) => {
      setSettings((s) => ({ ...s, autoConfirmStaffInstructionFromNursingInterventions }));
    },
    [],
  );

  const toggleQuickTheme = useCallback(() => {
    setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      setTheme,
      setTerminology,
      setLanguage,
      setAutoCompleteStaffEducation,
      setAutoConfirmStaffInstructionFromNursingInterventions,
      isDark,
      toggleQuickTheme,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
