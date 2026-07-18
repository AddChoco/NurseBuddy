import { AlertTriangle, SkipForward, Sparkles, CheckCircle2 } from 'lucide-react';
import type { MissingInfoItem, MissingInfoCategory } from '../types';

interface MissingInfoCardProps {
  items: MissingInfoItem[];
  onUpdate: (id: string, value: string) => void;
  onSkip: () => void;
  onGenerate: () => void;
}

const CATEGORY_META: Record<MissingInfoCategory, { title: string; description: string }> = {
  facility_required: {
    title: 'Facility-Required Information',
    description: 'Required by the selected facility guideline template.',
  },
  clinically_useful: {
    title: 'Clinically Useful Information',
    description: 'Helpful for complete documentation but not required to generate the note.',
  },
  conditional: {
    title: 'Conditional Information',
    description: 'Required only when the related event or finding is present in the input.',
  },
};

function groupItemsByCategory(items: MissingInfoItem[]): Record<MissingInfoCategory, MissingInfoItem[]> {
  return items.reduce<Record<MissingInfoCategory, MissingInfoItem[]>>(
    (groups, item) => {
      const category = item.category ?? 'facility_required';
      groups[category].push(item);
      return groups;
    },
    { facility_required: [], clinically_useful: [], conditional: [] },
  );
}

export function MissingInfoCard({ items, onUpdate, onSkip, onGenerate }: MissingInfoCardProps) {
  const filledCount = items.filter((i) => i.value.trim()).length;
  const grouped = groupItemsByCategory(items);

  return (
    <div className="animate-fade-in rounded-4xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-cream-50 p-6 shadow-soft dark:border-amber-700/40 dark:from-amber-900/10 dark:to-gray-800/50 sm:p-8">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-amber-800 dark:text-amber-300">
            Missing Information
          </h3>
          <p className="mt-0.5 text-sm text-amber-700/80 dark:text-amber-400/70">
            Review missing fields before generating. You may skip optional or conditional items and generate using only confirmed information.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {(Object.keys(CATEGORY_META) as MissingInfoCategory[]).map((category) => {
          const categoryItems = grouped[category];
          if (categoryItems.length === 0) return null;

          const meta = CATEGORY_META[category];
          return (
            <div key={category}>
              <div className="mb-3">
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">{meta.title}</h4>
                <p className="text-xs text-amber-700/70 dark:text-amber-400/60">{meta.description}</p>
              </div>
              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white/80 p-3.5 dark:bg-gray-800/60">
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {item.label}
                    </label>
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => onUpdate(item.id, e.target.value)}
                      placeholder={`Enter ${item.label.toLowerCase()} details...`}
                      className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-gray-800 transition-all placeholder:text-gray-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-400/15 dark:border-amber-800/40 dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder:text-gray-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-amber-700/70 dark:text-amber-400/60">
          {filledCount > 0
            ? `${filledCount} of ${items.length} fields completed`
            : 'No additional details added yet'}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-50 active:scale-95 dark:border-amber-700/40 dark:bg-gray-800 dark:text-amber-300 dark:hover:bg-amber-900/20"
          >
            <SkipForward className="h-4 w-4" />
            Generate Anyway
          </button>
          <button
            type="button"
            onClick={onGenerate}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:shadow-soft-lg active:scale-95"
          >
            {filledCount > 0 ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Generate with Details
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Documentation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
