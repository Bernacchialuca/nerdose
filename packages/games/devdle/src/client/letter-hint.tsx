import { useState } from 'react';

import { buttonClass, cn } from '@nerdose/ui';

import type { DevdleRevealedHint } from '../definition/schemas';

import { SectionPanel } from './section-panel';
import type { Translate } from './types';

type LetterHintProps = {
  length: number;
  /** The hint already revealed (`state.hint`), if any. */
  hint: DevdleRevealedHint | undefined;
  /** Positions the player already solved (green in some guess): revealing them is pointless. */
  known: ReadonlyMap<number, string>;
  /** Move in flight, game finished or voided. */
  disabled: boolean;
  onReveal: (position: number) => void;
  t: Translate;
};

const TILE =
  'flex h-11 min-w-6 items-center justify-center rounded-tile border-2 font-mono text-game-key font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/**
 * One hint per game: pick a position and confirm with «Revelar letra». Two steps on purpose,
 * so a stray tap does not spend the only hint.
 */
export function LetterHint({ length, hint, known, disabled, onReveal, t }: LetterHintProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const positions = Array.from({ length }, (_, i) => i);
  const cols = { gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` };

  if (hint) {
    return (
      <SectionPanel title={t('letterHint.title')} datum={t('letterHint.used')}>
        <ul className="grid gap-1" style={cols} aria-hidden="true">
          {positions.map((i) => (
            <li
              key={i}
              className={cn(
                TILE,
                i === hint.position
                  ? 'border-game-devdle bg-game-devdle text-game-devdle-on'
                  : 'border-border text-text-dim',
              )}
            >
              {i === hint.position ? hint.letter : ''}
            </li>
          ))}
        </ul>
        <p role="status" className="font-sans text-body-sm text-text-body">
          {t('letterHint.revealed', { n: hint.position + 1, letter: hint.letter })}
        </p>
      </SectionPanel>
    );
  }

  const canReveal = !disabled && selected !== null && !known.has(selected);
  return (
    <SectionPanel title={t('letterHint.title')} datum={t('letterHint.available')}>
      <p className="font-sans text-caption text-text-muted">{t('letterHint.note')}</p>
      <div role="group" aria-label={t('letterHint.positions')} className="grid gap-1" style={cols}>
        {positions.map((i) => {
          const knownLetter = known.get(i);
          const isSelected = selected === i;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled || knownLetter !== undefined}
              aria-pressed={isSelected}
              aria-label={
                knownLetter !== undefined
                  ? t('letterHint.knownPosition', { n: i + 1, letter: knownLetter })
                  : t('letterHint.position', { n: i + 1 })
              }
              onClick={() => {
                setSelected(isSelected ? null : i);
              }}
              className={cn(
                TILE,
                knownLetter !== undefined
                  ? 'cursor-not-allowed border-game-devdle-border text-game-devdle-muted'
                  : isSelected
                    ? 'border-game-devdle bg-game-devdle-tint text-text'
                    : 'border-border text-text-dim hover:border-border-hover',
                disabled && knownLetter === undefined && 'cursor-not-allowed opacity-60',
              )}
            >
              {knownLetter ?? i + 1}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-disabled={!canReveal}
        onClick={() => {
          if (canReveal) onReveal(selected);
        }}
        className={buttonClass({ variant: 'secondary', fullWidth: true, disabled: !canReveal })}
      >
        {selected === null || known.has(selected)
          ? t('letterHint.pick')
          : t('letterHint.reveal', { n: selected + 1 })}
      </button>
    </SectionPanel>
  );
}
