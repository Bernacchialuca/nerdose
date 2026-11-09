import type { CSSProperties } from 'react';

import { cn } from '@nerdose/ui';

import type { DevdleResult } from '../definition/schemas';

import { parseStats } from './parse';
import { SectionPanel } from './section-panel';
import type { GameStatsView, Translate } from './types';

const ROW_VARS = { '--dist-cols': '16px 1fr' } as CSSProperties;

export function Distribution({
  result,
  stats,
  t,
}: {
  /** Sin resultado (partida en curso) no se resalta la barra de hoy. */
  result?: DevdleResult;
  stats: GameStatsView;
  t: Translate;
}) {
  const s = parseStats(stats.extra);
  const rows: [string, number][] = [
    ['1', s.guesses['1']],
    ['2', s.guesses['2']],
    ['3', s.guesses['3']],
    ['4', s.guesses['4']],
    ['5', s.guesses['5']],
    ['6', s.guesses['6']],
    ['X', s.losses],
  ];
  const max = Math.max(...rows.map(([, n]) => n));
  const pct = (n: number) => (max === 0 ? 8 : Math.max(8, Math.round((n / max) * 100)));
  const today = result ? (result.win ? String(result.score) : 'X') : null;

  return (
    <SectionPanel
      title={t('distribution.title')}
      datum={t('distribution.streak', { count: stats.current_streak })}
    >
      <ul className="flex flex-col gap-1.5">
        {rows.map(([label, n]) => {
          const isToday = label === today;
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
                style={{ '--w': `${pct(n)}%` } as CSSProperties}
              >
                <span aria-hidden="true">{n}</span>
                <span className="sr-only">
                  {t('distribution.rowLabel', {
                    label: label === 'X' ? t('distribution.lossLabel') : label,
                    count: n,
                  })}
                  {isToday ? ` · ${t('distribution.today')}` : ''}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="flex gap-5 font-mono text-meta text-text-muted">
        <span>
          <b className="text-text">{stats.played}</b> {t('distribution.played')}
        </span>
        <span>
          <b className="text-text">
            {stats.win_rate === null
              ? '—'
              : t('distribution.winRate', { value: Math.round(stats.win_rate * 100) })}
          </b>{' '}
          {t('distribution.wins')}
        </span>
      </p>
    </SectionPanel>
  );
}
