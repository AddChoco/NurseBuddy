import { Sun, Moon, Settings as SettingsIcon, Stethoscope } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { isDark, toggleQuickTheme } = useSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-pink-100/60 bg-white/80 backdrop-blur-lg dark:border-pink-900/30 dark:bg-gray-900/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <button
          onClick={onOpenSettings}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 transition-all hover:bg-pink-50 hover:text-pink-600 active:scale-95 dark:text-gray-400 dark:hover:bg-pink-900/20 dark:hover:text-pink-300"
          aria-label="Settings"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center">
          <h1 className="flex items-center gap-2 font-display text-xl font-bold text-pink-600 dark:text-pink-300 sm:text-2xl">
            <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7" />
            Nurse Buddy
          </h1>
          <p className="hidden text-xs text-gray-500 dark:text-gray-400 sm:block">
            Your AI Nursing Documentation Assistant
          </p>
        </div>

        <button
          onClick={toggleQuickTheme}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-gray-500 transition-all hover:bg-pink-50 hover:text-pink-600 active:scale-95 dark:text-gray-400 dark:hover:bg-pink-900/20 dark:hover:text-pink-300"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}
