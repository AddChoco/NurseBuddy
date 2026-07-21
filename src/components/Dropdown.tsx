import { useState, useRef, useEffect, useId, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
}

interface DropdownProps {
  label: string;
  icon?: ReactNode;
  value: string;
  options: Option[];
  onChange: (id: string) => void;
  placeholder?: string;
}

export function Dropdown({ label, icon, value, options, onChange, placeholder }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const listboxId = useId();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selected = options.find((o) => o.id === value);

  return (
    <div className="w-full">
      <div id={labelId} className="mb-2 flex items-center gap-2 text-sm font-semibold text-pink-700 dark:text-pink-200">
        {icon}
        {label}
      </div>
      <div className="relative" ref={ref}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          className="flex w-full items-center justify-between rounded-2xl border-2 border-pink-100 bg-white px-4 py-3.5 text-left text-gray-800 shadow-soft transition-all hover:border-pink-300 hover:shadow-soft-lg focus:border-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-400/15 dark:border-pink-900/40 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-pink-700"
        >
          <span className="flex items-center gap-2.5 truncate">
            {selected ? (
              <>
                {selected.emoji && <span className="text-xl">{selected.emoji}</span>}
                <span className="font-semibold">{selected.label}</span>
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">{placeholder ?? 'Select...'}</span>
            )}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-pink-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            className="absolute z-50 mt-2 max-h-72 w-full animate-scale-in overflow-y-auto rounded-2xl border border-pink-100 bg-white py-2 shadow-soft-lg dark:border-pink-900/40 dark:bg-gray-800"
          >
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={opt.id === value}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-pink-50 dark:hover:bg-pink-900/20 ${
                  opt.id === value ? 'bg-pink-50 dark:bg-pink-900/20' : ''
                }`}
              >
                {opt.emoji && <span className="mt-0.5 text-xl">{opt.emoji}</span>}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{opt.label}</span>
                    {opt.id === value && <Check className="h-4 w-4 text-pink-500" />}
                  </div>
                  {opt.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
