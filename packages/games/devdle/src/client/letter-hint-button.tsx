import { buttonClass } from '@nerdose/ui';

import type { DevdleRevealedHint } from '../definition/schemas';

import type { Translate } from './types';

/**
 * Hint trigger in the aside, right above «Rendirse» and as wide: «💡 Pista» → «Cancelar» while picking a cell → «💡 Letra N: X»
 * (disabled) once used. One hint per game.
 */
export function LetterHintButton({
  hint,
  picking,
  disabled,
  onToggle,
  t,
}: {
  hint: DevdleRevealedHint | undefined;
  picking: boolean;
  disabled: boolean;
  onToggle: () => void;
  t: Translate;
}) {
  if (hint) {
    return (
      <button
        type="button"
        aria-disabled="true"
        aria-label={t('letterHint.usedLabel', { n: hint.position + 1, letter: hint.letter })}
        className={buttonClass({ variant: 'secondary', fullWidth: true, disabled: true })}
      >
        <span aria-hidden="true">💡</span>
        {t('letterHint.used', { n: hint.position + 1, letter: hint.letter })}
      </button>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={picking}
      aria-disabled={disabled || undefined}
      aria-label={picking ? t('letterHint.cancel') : t('letterHint.buttonLabel')}
      onClick={() => {
        if (!disabled) onToggle();
      }}
      className={buttonClass({ variant: 'secondary', fullWidth: true, disabled })}
    >
      {picking ? null : <span aria-hidden="true">💡</span>}
      {picking ? t('letterHint.cancel') : t('letterHint.button')}
    </button>
  );
}
