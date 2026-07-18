import { ShieldAlert } from 'lucide-react';
import { PRIVACY_WARNING } from '../constants';

export function PrivacyWarning() {
  return (
    <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-900/10">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300/90">
        {PRIVACY_WARNING}
      </p>
    </div>
  );
}
