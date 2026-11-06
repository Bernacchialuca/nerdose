import { cn } from '../cn';

export type ProgressBarProps = {
  variant?: 'segmented';
  value: number;
  total: number;
  label: string;
  className?: string;
};

export function ProgressBar({ value, total, label, className }: ProgressBarProps) {
  const done = Math.min(Math.max(value, 0), total);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className={cn('flex gap-1.5', className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn('h-1.5 w-9 rounded-full', i < done ? 'bg-accent' : 'bg-control-selected')}
        />
      ))}
    </div>
  );
}
