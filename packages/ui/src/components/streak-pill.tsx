import type { ReactElement, ReactNode } from 'react';

import { cn } from '../cn';

import { FOCUS_RING } from './focus';

export type StreakPillProps = {
  value: number | null;
  children: ReactNode;
  className?: string;
  render?: (props: { className: string; children: ReactNode }) => ReactElement;
};

export function StreakPill({ value, children, className, render }: StreakPillProps) {
  const active = value !== null && value > 0;
  const classes = cn(
    'inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 font-mono text-mono-strong',
    active
      ? 'border-streak-border bg-streak-bg text-streak'
      : 'border-border-strong bg-control text-text-dim',
    render && [
      'min-h-11',
      FOCUS_RING,
      active ? 'hover:border-streak-border-hover hover:text-streak-hover' : 'hover:text-text-muted',
    ],
    className,
  );
  const content = (
    <>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
      <span>{children}</span>
    </>
  );
  if (render) return render({ className: classes, children: content });
  return <span className={classes}>{content}</span>;
}
