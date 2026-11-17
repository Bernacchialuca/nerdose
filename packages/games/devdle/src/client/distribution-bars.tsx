import type { CSSProperties } from 'react';

import { cn } from '@nerdose/ui';

import type { DistributionRow } from './stats';
import type { Translate } from './types';

const ROW_VARS = { '--dist-cols': '16px 1fr' } as CSSProperties;

export function DistributionBars({
  rows,
  highlight = null,
  t,
}: {
  rows: DistributionRow[];
  /** Label of the bar to emphasise ("today"); none when null. */
  highlight?: string | null;
  t: Translate;
}) {
  const max = Math.max(...rows.map((row) => row.count));
  const pct = (n: number) => (max === 0 ? 8 : Math.max(8, Math.round((n / max) * 100)));

  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map(({ label, count }) => {
        const isToday = label === highlight;
        return (
          <li
            key={label}
            className="grid grid-cols-(--dist-cols) items-center gap-2.5 font-mono text-meta"
            style={ROW_VARS}
          >
            <span className="text-text-muted" aria-hidden="true">
              {label}
            </span>
            <div
              className={cn(
                'w-(--w) min-w-5.5 rounded-cell-xs px-2 py-0.75 text-right',
                isToday
                  ? 'bg-game-devdle font-extrabold text-game-devdle-on'
                  : 'bg-control-selected text-text',
              )}
              style={{ '--w': `${pct(count)}%` } as CSSProperties}
            >
              <span aria-hidden="true">{count}</span>
              <span className="sr-only">
                {t('distribution.rowLabel', {
                  label: label === 'X' ? t('distribution.lossLabel') : label,
                  count,
                })}
                {isToday ? ` · ${t('distribution.today')}` : ''}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
