import type { ReactNode } from 'react';

import { cn } from '../cn';

export type TerminalRowState =
  | 'done'
  | 'pending'
  | 'in-progress'
  | 'no-challenge'
  | 'voided'
  | 'upcoming'
  | 'unavailable';

export type TerminalRow = {
  key: string;
  state: TerminalRowState;
  slug: ReactNode;
  metric?: ReactNode;
  status?: ReactNode;
};

export type TerminalWindowProps = {
  label: string;
  title: ReactNode;
  command: ReactNode;
  rows: readonly TerminalRow[];
  summary?: { label: ReactNode; value: ReactNode; tone: 'streak' | 'dim' };
  countdown?: { label: ReactNode; value: ReactNode };
  className?: string;
};

const ROW_STYLE: Record<
  TerminalRowState,
  { icon: string; iconColor: string; statusColor: string }
> = {
  done: { icon: '✓', iconColor: 'text-status-success', statusColor: 'text-status-success' },
  pending: { icon: '○', iconColor: 'text-text-dim', statusColor: 'text-status-pending' },
  'in-progress': {
    icon: '◐',
    iconColor: 'text-status-pending',
    statusColor: 'text-status-pending',
  },
  'no-challenge': { icon: '–', iconColor: 'text-text-dim', statusColor: 'text-text-dim' },
  voided: { icon: '⊘', iconColor: 'text-text-muted', statusColor: 'text-text-muted' },
  upcoming: { icon: '○', iconColor: 'text-text-dim', statusColor: 'text-text-dim' },
  unavailable: { icon: '○', iconColor: 'text-text-dim', statusColor: 'text-text-dim' },
};

export function TerminalWindow({
  label,
  title,
  command,
  rows,
  summary,
  countdown,
  className,
}: TerminalWindowProps) {
  return (
    <section
      aria-label={label}
      className={cn(
        'min-w-0 overflow-hidden rounded-panel border border-border bg-surface font-mono shadow-window',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex items-center gap-2 border-b border-border-subtle bg-titlebar px-4 py-3"
      >
        <span className="size-2.75 flex-none rounded-full bg-window-dot" />
        <span className="size-2.75 flex-none rounded-full bg-window-dot" />
        <span className="size-2.75 flex-none rounded-full bg-window-dot" />
        <span className="ml-2 truncate text-meta text-text-dim">{title}</span>
      </div>
      <div className="flex flex-col px-5.5 pt-5.5 pb-6 text-code-terminal">
        <p className="text-text-dim">{command}</p>
        <ul>
          {rows.map((row) => {
            const style = ROW_STYLE[row.state];
            return (
              <li key={row.key} className="flex flex-wrap items-center gap-x-3.5">
                <span aria-hidden="true" className={cn('w-5.5 flex-none', style.iconColor)}>
                  {style.icon}
                </span>
                <span className="min-w-0 flex-1 text-text">{row.slug}</span>
                {row.metric != null ? <span className="text-text-muted">{row.metric}</span> : null}
                {row.status != null ? (
                  <span className={style.statusColor}>{row.status}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
        {summary ? (
          <p className="mt-2.5 flex flex-wrap justify-between gap-2 border-t border-dashed border-border-strong pt-3">
            <span className="text-text-dim">{summary.label}</span>
            <span
              className={cn(
                'font-bold',
                summary.tone === 'streak' ? 'text-streak' : 'text-text-dim',
              )}
            >
              {summary.value}
            </span>
          </p>
        ) : null}
        {countdown ? (
          <p className="text-text-dim">
            {countdown.label} <span className="text-text">{countdown.value}</span>
            <span aria-hidden="true" className="text-accent motion-safe:animate-blink">
              ▌
            </span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
