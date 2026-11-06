import type { ReactNode } from 'react';

import { cn } from '../cn';

import { FOCUS_RING } from './focus';

export type SegmentedOption<T extends string> = { value: T; label: ReactNode; lang?: string };

export type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex gap-0.5 rounded-control border border-border-strong bg-control p-0.75 font-mono',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            lang={option.lang}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative h-9 min-w-11 rounded-segment px-2 text-meta-strong before:absolute before:inset-x-0 before:-inset-y-1',
              FOCUS_RING,
              'disabled:cursor-not-allowed disabled:text-text-disabled',
              active
                ? 'bg-control-selected text-text after:absolute after:inset-x-2 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-accent'
                : 'text-text-muted enabled:hover:text-text-body',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
