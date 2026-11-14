import type { MutableRefObject } from 'react';

import type { GameId } from '@nerdose/core';
import { Badge, buttonClass, cn } from '@nerdose/ui';

import { GAME_LABELS } from '@/modules/reports';

import type { UpcomingDay, UpcomingGame, UpcomingResponse } from '../api/types';
import { cellBadges, cellState, rowLabel } from '../cell-state';

const TH =
  'border-b border-border-subtle px-5 py-3.5 text-left font-mono text-label-comment font-medium text-text-dim';
const TD = 'border-b border-border-row px-5 py-3.5 align-top';

export type CellRef = { date: string; game_id: GameId };

export const cellKey = (ref: CellRef): string => `${ref.date}:${ref.game_id}`;

type UpcomingGridProps = {
  data: UpcomingResponse;
  openRefs: MutableRefObject<Map<string, HTMLButtonElement>>;
  onOpen: (cell: CellRef) => void;
  onRegenerate: (day: UpcomingDay, game: UpcomingGame, trigger: HTMLElement) => void;
};

function Cell({
  day,
  game,
  openRefs,
  onOpen,
  onRegenerate,
}: Omit<UpcomingGridProps, 'data'> & { day: UpcomingDay; game: UpcomingGame }) {
  const state = cellState(game);
  const label = `${GAME_LABELS[game.game_id]} #${day.number}`;
  const key = cellKey({ date: day.date, game_id: game.game_id });
  const failure = state.kind === 'failure';
  const lines = cellBadges(game).map((badge) => (
    <Badge
      key={badge.text}
      tone={badge.tone}
      strong={badge.strong}
      className="whitespace-normal text-left"
    >
      <span aria-hidden="true">{badge.glyph}&nbsp;</span>
      {badge.text}
      {state.kind === 'pending' ? (
        <>
          {' '}
          <span className="sr-only">(regeneración pendiente)</span>
        </>
      ) : null}
    </Badge>
  ));
  return (
    <td className={cn(TD, failure && 'border border-status-warning-border bg-status-warning-bg')}>
      <div className="flex flex-col items-start gap-2">
        {state.canOpen ? (
          <button
            type="button"
            ref={(el) => {
              if (el) openRefs.current.set(key, el);
              else openRefs.current.delete(key);
            }}
            onClick={() => {
              onOpen({ date: day.date, game_id: game.game_id });
            }}
            className="flex flex-col items-start gap-1 text-left font-mono text-mono-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="sr-only">
              {label}, {day.date}:{' '}
            </span>
            {lines}
          </button>
        ) : (
          <div className="flex flex-col items-start gap-1">{lines}</div>
        )}
        {state.canRegenerate ? (
          <button
            type="button"
            onClick={(event) => {
              onRegenerate(day, game, event.currentTarget);
            }}
            className={buttonClass({ variant: 'secondary', size: 'md' })}
          >
            Regenerar <span className="sr-only">{label}</span>
          </button>
        ) : null}
      </div>
    </td>
  );
}

export function UpcomingGrid({ data, openRefs, onOpen, onRegenerate }: UpcomingGridProps) {
  const columns = data.days.at(0)?.games ?? [];
  return (
    <div
      role="region"
      // Región con scroll horizontal: debe ser alcanzable con teclado (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label="Grilla de próximos desafíos"
      className="overflow-x-auto rounded-panel border border-border bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <table className="w-full border-collapse">
        <caption className="sr-only">Próximos desafíos por día y juego</caption>
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Día
            </th>
            {columns.map((column) => (
              <th key={column.game_id} scope="col" className={TH}>
                {GAME_LABELS[column.game_id]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.days.map((day) => (
            <tr key={day.date}>
              <th scope="row" className={cn(TD, 'text-left font-mono text-mono-body text-text')}>
                {rowLabel(day)}
              </th>
              {columns.map((column) => {
                const game = day.games.find((g) => g.game_id === column.game_id);
                return game ? (
                  <Cell
                    key={column.game_id}
                    day={day}
                    game={game}
                    openRefs={openRefs}
                    onOpen={onOpen}
                    onRegenerate={onRegenerate}
                  />
                ) : (
                  <td key={column.game_id} className={TD}>
                    —
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
