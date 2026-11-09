import type { CSSProperties } from 'react';

import { cn } from '@nerdose/ui';

import type { KeyState } from './marks';
import type { Translate } from './types';

type KeyboardProps = {
  states: Partial<Record<string, KeyState>>;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  t: Translate;
};

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'] as const;

const KEY_BASE =
  'flex h-13.5 min-w-0 shrink basis-0 items-center justify-center rounded-tile border-2 font-mono text-game-key focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const KEY_CLASS = {
  unused:
    'border-control-selected bg-control-selected text-text hover:border-border-hover hover:bg-border-hover',
  correct: 'border-game-devdle bg-game-devdle text-game-devdle-on',
  present: 'border-dashed border-status-present bg-control-selected text-status-present',
  absent: 'border-control bg-control text-text-dim line-through',
} as const;

const GROW_VARS = { '--key-grow': 1.6 } as CSSProperties;

export function Keyboard({ states, onLetter, onBackspace, onSubmit, submitDisabled, t }: KeyboardProps) {
  const enter = (
    <button
      key="enter"
      type="button"
      aria-label={t('keyboard.enter')}
      aria-disabled={submitDisabled || undefined}
      onClick={() => {
        if (!submitDisabled) onSubmit();
      }}
      style={GROW_VARS}
      className={cn(
        KEY_BASE,
        'max-w-21 grow-(--key-grow) text-game-key-small',
        submitDisabled
          ? 'cursor-not-allowed border-control bg-control text-text-disabled'
          : 'border-game-devdle bg-game-devdle text-game-devdle-on hover:border-game-devdle-light hover:bg-game-devdle-light',
      )}
    >
      {t('keyboard.enterGlyph')}
    </button>
  );
  const backspace = (
    <button
      key="backspace"
      type="button"
      aria-label={t('keyboard.backspace')}
      onClick={onBackspace}
      style={GROW_VARS}
      className={cn(KEY_BASE, 'max-w-21 grow-(--key-grow)', KEY_CLASS.unused)}
    >
      <span aria-hidden="true">⌫</span>
    </button>
  );

  return (
    <div role="group" aria-label={t('keyboard.label')} className="flex w-full max-w-keyboard flex-col gap-2">
      {ROWS.map((row, i) => (
        <div key={row} className="flex justify-center gap-1.5">
          {i === 2 ? enter : null}
          {[...row].map((letter) => {
            const state = states[letter];
            return (
              <button
                key={letter}
                type="button"
                aria-label={
                  state
                    ? t('key.label', { letter, state: t(`key.${state}`) })
                    : letter
                }
                onClick={() => {
                  onLetter(letter);
                }}
                className={cn(KEY_BASE, 'max-w-13 grow', KEY_CLASS[state ?? 'unused'])}
              >
                {letter}
              </button>
            );
          })}
          {i === 2 ? backspace : null}
        </div>
      ))}
    </div>
  );
}
