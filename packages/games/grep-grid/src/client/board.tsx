import { useState, type CSSProperties, type KeyboardEvent } from 'react';

import { cn } from '@nerdose/ui';

import { sameCell, type Cell } from '../shared/geometry';

import { CELL_GLYPH, type BoardCell, type CellState } from './cells';
import { moveFocus } from './focus';
import type { Translate } from './types';

type BoardProps =
  | {
      mode: 'play';
      cells: BoardCell[];
      label: string;
      t: Translate;
      disabled: boolean;
      onCellPress: (cell: Cell) => void;
      onCancel: () => void;
    }
  | { mode: 'result'; cells: BoardCell[]; label: string; t: Translate };

// 654 px = 12 x 48 + 11 x 4 + 2 x 16 + 2; below that the cells scale (aspect-ratio 1, no scroll).
const VARS = {
  '--board-pad': 'clamp(6px, 2.5cqi, 16px)',
  '--cell-font': 'clamp(9px, calc((100cqi - 2 * var(--board-pad) - 46px) / 12 * 0.375), 18px)',
  '--cell-mark': 'clamp(6px, calc((100cqi - 2 * var(--board-pad) - 46px) / 12 * 0.22), 11px)',
} as CSSProperties;

const CELL_CLASS: Record<CellState, string> = {
  free: 'border-2 border-surface-inset bg-surface-inset font-bold text-text-body',
  start:
    'border-2 border-game-grep-grid bg-game-grep-grid-selected-bg font-bold text-game-grep-grid-light',
  found: 'border-2 border-game-grep-grid bg-game-grep-grid font-extrabold text-game-grep-grid-on',
  revealed: 'border-2 border-dashed border-game-grep-grid font-bold text-game-grep-grid-light',
};

const CELL_BASE =
  'relative flex aspect-square items-center justify-center rounded-tile font-mono text-(length:--cell-font)';

function Glyph({ state }: { state: CellState }) {
  const glyph = CELL_GLYPH[state];
  if (!glyph) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute top-0.5 right-1 text-(length:--cell-mark) leading-none"
    >
      {glyph}
    </span>
  );
}

export function Board(props: BoardProps) {
  const { cells, label, t } = props;
  const [focusPos, setFocusPos] = useState<Cell>({ row: 0, col: 0 });
  const play = props.mode === 'play' ? props : null;

  const labelOf = (cell: BoardCell): string =>
    t('cell.label', {
      letter: cell.letter,
      row: cell.row + 1,
      col: cell.col + 1,
      state: t(`cell.${cell.state}`),
    });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!play) return;
    if (event.key === 'Escape') {
      play.onCancel();
      return;
    }
    const next = moveFocus(focusPos, event.key);
    if (!next) return;
    event.preventDefault();
    setFocusPos(next);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-row="${next.row}"][data-col="${next.col}"]`)
      ?.focus();
  };

  const rows = Array.from({ length: 12 }, (_, r) => cells.slice(r * 12, r * 12 + 12));
  const gridClass =
    'grid grid-cols-12 gap-1 rounded-feature border border-border bg-surface-sunken p-(--board-pad)';

  return (
    <div className="@container w-full max-w-163.5" style={VARS}>
      {play ? (
        // Roving tabindex lives on the cell buttons: the grid itself is not a tab stop.
        // eslint-disable-next-line jsx-a11y/interactive-supports-focus
        <div
          role="grid"
          aria-label={label}
          aria-disabled={play.disabled || undefined}
          className={gridClass}
          onKeyDown={onKeyDown}
        >
          {rows.map((row, r) => (
            <div key={r} role="row" className="contents">
              {row.map((cell) => (
                <div key={cell.col} role="gridcell" className="aspect-square">
                  <button
                    type="button"
                    tabIndex={sameCell(cell, focusPos) ? 0 : -1}
                    data-row={cell.row}
                    data-col={cell.col}
                    aria-label={labelOf(cell)}
                    onFocus={() => setFocusPos({ row: cell.row, col: cell.col })}
                    onClick={() => {
                      if (!play.disabled) play.onCellPress({ row: cell.row, col: cell.col });
                    }}
                    className={cn(
                      CELL_BASE,
                      'size-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-game-grep-grid',
                      CELL_CLASS[cell.state],
                      cell.state === 'free' && 'hover:border-game-grep-grid-featured',
                    )}
                  >
                    {cell.letter}
                    <Glyph state={cell.state} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div role="table" aria-label={label} className={gridClass}>
          {rows.map((row, r) => (
            <div key={r} role="row" className="contents">
              {row.map((cell) => (
                <div
                  key={cell.col}
                  role="cell"
                  aria-label={labelOf(cell)}
                  className={cn(CELL_BASE, CELL_CLASS[cell.state])}
                >
                  {cell.letter}
                  <Glyph state={cell.state} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
