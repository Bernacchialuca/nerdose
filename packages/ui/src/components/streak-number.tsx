import type { ReactNode } from 'react';

import { cn } from '../cn';

export type StreakNumberProps = {
  variant?: 'compact';
  value: number | null;
  unit: ReactNode;
  className?: string;
};

export function StreakNumber({ value, unit, className }: StreakNumberProps) {
  const active = value !== null && value > 0;
  return (
    <p className={cn('flex items-baseline-last gap-2.5 font-mono', className)}>
      <span className={cn('text-display-streak-compact', active ? 'text-streak' : 'text-text-dim')}>
        {value ?? '—'}
      </span>
      <span className="text-mono-unit-compact text-text-lede">{unit}</span>
    </p>
  );
}
