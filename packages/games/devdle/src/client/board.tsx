import type { CSSProperties } from 'react';

import { cn } from '@nerdose/ui';

import {
  MAX_GUESSES,
  type DevdleGuess,
  type DevdleRevealedHint,
  type LetterMark,
} from '../definition/schemas';

import { MARK_GLYPH } from './marks';
import type { Translate } from './types';

type CellState = LetterMark | 'written' | 'hinted' | 'empty';

type BoardProps = {
  length: number;
  guesses: readonly DevdleGuess[];
  draft?: string;
  /** Revealed hint: shown as a guide in the empty cell of the active row. */
  hint?: DevdleRevealedHint;
  /** Hint picking: positions of the active row the player can tap to reveal. */
  pickable?: ReadonlySet<number>;
  onPick?: (position: number) => void;
  rows?: number;
  label: string;
  t: Translate;
};

const CELL_CLASS: Record<CellState, string> = {
  correct: 'border-2 border-game-devdle bg-game-devdle text-game-devdle-on',
  present: 'border-2 border-dashed border-status-present text-status-present',
  absent: 'border-2 border-status-absent-bg bg-status-absent-bg text-status-absent-text',
  written: 'border-2 border-border-emphasis bg-surface text-text',
  hinted: 'border-2 border-dashed border-game-devdle-border text-game-devdle-muted',
  empty: 'border-2 border-border',
};

type Cell = { letter: string; state: CellState };

function rowCells(
  length: number,
  guess: DevdleGuess | undefined,
  draft: string | undefined,
  hint: DevdleRevealedHint | undefined,
): Cell[] {
  return Array.from({ length }, (_, i): Cell => {
    if (guess) return { letter: guess.guess[i] ?? '', state: guess.marks[i] ?? 'absent' };
    const letter = draft?.[i];
    if (letter) return { letter, state: 'written' };
    if (hint?.position === i) return { letter: hint.letter, state: 'hinted' };
    return { letter: '', state: 'empty' };
  });
}

const boardGapPx = (length: number): number => (length <= 8 ? 8 : 4);

/** Max width of the board, so the row below it (hint and move message) can line up with it. */
export const boardMaxWidth = (length: number): string =>
  `calc(${length} * 64px + ${length - 1} * ${boardGapPx(length)}px)`;

export function Board({
  length,
  guesses,
  draft,
  hint,
  pickable,
  onPick,
  rows = MAX_GUESSES,
  label,
  t,
}: BoardProps) {
  const gapPx = boardGapPx(length);
  const gapClass = length <= 8 ? 'gap-2' : 'gap-1';
  const inner = `(100cqi - ${(length - 1) * gapPx}px) / ${length}`;
  const vars = {
    '--board-cols': `repeat(${length}, minmax(0, 1fr))`,
    '--board-max': boardMaxWidth(length),
    '--tile-font': `clamp(10px, calc(${inner} * 0.4375), 28px)`,
    '--tile-mark': `clamp(8px, calc(${inner} * 0.175), 12px)`,
  } as CSSProperties;

  return (
    <div
      role="grid"
      aria-label={label}
      className={cn('@container flex w-full max-w-(--board-max) flex-col', gapClass)}
      style={vars}
    >
      {Array.from({ length: rows }, (_, r) => {
        const guess = guesses[r];
        const active = r === guesses.length;
        const cells = rowCells(
          length,
          guess,
          active ? draft : undefined,
          active ? hint : undefined,
        );
        return (
          <div
            key={r}
            role="row"
            aria-label={t('board.row', { n: r + 1 })}
            className={cn('grid grid-cols-(--board-cols)', gapClass)}
          >
            {cells.map((cell, c) => (
              <div
                key={c}
                role="gridcell"
                aria-label={t('cell.label', {
                  letter: cell.letter || t('cell.blank'),
                  state: t(`cell.${cell.state}`),
                })}
                className={cn(
                  'relative flex aspect-square items-center justify-center rounded-tile font-mono font-extrabold text-(length:--tile-font)',
                  CELL_CLASS[cell.state],
                )}
              >
                {cell.letter}
                {active && pickable?.has(c) ? (
                  <button
                    type="button"
                    aria-label={t('letterHint.position', { n: c + 1 })}
                    onClick={() => onPick?.(c)}
                    className="absolute inset-0 rounded-tile border-2 border-dashed border-game-devdle hover:bg-game-devdle-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  />
                ) : null}
                {cell.state === 'correct' || cell.state === 'present' || cell.state === 'absent' ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-0.5 right-1 text-(length:--tile-mark) leading-none"
                  >
                    {MARK_GLYPH[cell.state]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
