import { useRef, type KeyboardEvent } from 'react';

import type { BigOOption } from '@nerdose/core';
import { cn } from '@nerdose/ui';

import { OPTION_LABEL } from '../shared/labels';

import { moveRadio } from './radio';
import type { Translate } from './types';

type OptionsGroupProps = {
  options: readonly BigOOption[];
  selected: BigOOption | null;
  onSelect: (option: BigOOption) => void;
  /** A move is in flight: the group ignores input. */
  disabled: boolean;
  t: Translate;
};

/** Single-choice group (radiogroup with roving tabindex): arrows move focus and selection. */
export function OptionsGroup({ options, selected, onSelect, disabled, t }: OptionsGroupProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = selected === null ? -1 : options.indexOf(selected);
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = moveRadio(index, event.key, options.length);
    if (next === null) return;
    event.preventDefault();
    if (disabled) return;
    const target = options[next];
    if (target === undefined) return;
    onSelect(target);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={t('game.optionsLabel')}
      className="grid grid-cols-2 gap-2.5 lg:grid-cols-4"
    >
      {options.map((option, index) => {
        const checked = option === selected;
        return (
          <button
            key={option}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-disabled={disabled || undefined}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => {
              if (!disabled) onSelect(option);
            }}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'min-h-14 rounded-control border-2 font-mono text-game-item focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              checked
                ? 'border-game-big-o bg-game-big-o-tint font-bold text-text'
                : 'border-border-subtle bg-surface font-normal text-text-muted',
            )}
          >
            {checked ? <span aria-hidden="true">● </span> : null}
            {OPTION_LABEL[option]}
          </button>
        );
      })}
    </div>
  );
}
