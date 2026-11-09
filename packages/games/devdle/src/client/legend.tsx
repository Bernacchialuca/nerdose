import { cn } from '@nerdose/ui';

import { HELP_TARGET_ID } from './help-target';
import { MARK_GLYPH } from './marks';
import { SectionPanel } from './section-panel';
import type { Translate } from './types';

const SAMPLE_CLASS = {
  correct: 'border-2 border-game-devdle bg-game-devdle text-game-devdle-on',
  present: 'border-2 border-dashed border-status-present text-status-present',
  absent: 'border-2 border-status-absent-bg bg-status-absent-bg text-status-absent-text',
} as const;

const SAMPLES = [
  { mark: 'correct', letter: 'O' },
  { mark: 'present', letter: 'C' },
  { mark: 'absent', letter: 'B' },
] as const;

/** `devdle.legend`; also the target of web's "how to play" button. */
export function Legend({ t }: { t: Translate }) {
  return (
    <SectionPanel id={HELP_TARGET_ID} title={t('legend.title')}>
      <ul className="flex flex-col gap-3">
        {SAMPLES.map(({ mark, letter }) => (
          <li key={mark} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                'flex size-9 flex-none items-center justify-center rounded-cell-md font-mono text-game-tile-sm',
                SAMPLE_CLASS[mark],
              )}
            >
              {letter}
            </span>
            <span className="font-sans text-body-sm-legend text-text-body">
              <span aria-hidden="true">{MARK_GLYPH[mark]} </span>
              {t(`legend.${mark}`)}
            </span>
          </li>
        ))}
      </ul>
    </SectionPanel>
  );
}
