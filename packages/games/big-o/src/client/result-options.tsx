import { useId } from 'react';

import type { BigOOption } from '@nerdose/core';
import { cn } from '@nerdose/ui';

import type { Translate } from './types';

export type OptionMark = {
  option: BigOOption;
  label: string;
  correct: boolean;
  /** Result only: the option the player confirmed. */
  chosen?: boolean;
  /** Preview only: the option the player is most likely to confuse with the answer. */
  trap?: boolean;
};

type ResultOptionsProps = {
  marks: readonly OptionMark[];
  title: string;
  headingLevel: 2 | 3;
  t: Translate;
};

type Tag = { symbol: string | null; text: string };

function describe(mark: OptionMark, t: Translate): { tag: Tag | null; sr: string; box: string } {
  const { label } = mark;
  if (mark.correct) {
    const chosen = mark.chosen === true;
    return {
      tag: {
        symbol: '✓',
        text: chosen ? `${t('result.correct')} · ${t('result.yours')}` : t('result.correct'),
      },
      sr: t(chosen ? 'result.optionSr.correctChosen' : 'result.optionSr.correct', {
        option: label,
      }),
      box: 'border-status-success bg-status-success font-extrabold text-status-success-on',
    };
  }
  if (mark.chosen) {
    return {
      tag: { symbol: '✗', text: t('result.yours') },
      sr: t('result.optionSr.wrongChosen', { option: label }),
      box: 'border-status-error bg-surface text-text',
    };
  }
  if (mark.trap) {
    return {
      tag: { symbol: null, text: t('preview.trap') },
      sr: t('preview.optionSr.trap', { option: label }),
      box: 'border-dashed border-game-big-o-muted bg-surface text-text',
    };
  }
  return { tag: null, sr: label, box: 'border-border-subtle bg-surface text-text-muted' };
}

/** The 8 options, read-only, marked with icon and text (never color alone). Shared by result and preview. */
export function ResultOptions({ marks, title, headingLevel, t }: ResultOptionsProps) {
  const titleId = useId();
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <div className="flex flex-col gap-3">
      <Heading id={titleId} className="font-mono text-label-comment text-text-dim">
        <span aria-hidden="true">// </span>
        {title}
      </Heading>
      <ul aria-labelledby={titleId} className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {marks.map((mark) => {
          const { tag, sr, box } = describe(mark, t);
          return (
            <li
              key={mark.option}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center rounded-control border-2 px-2 py-2 font-mono text-game-item font-normal',
                box,
              )}
            >
              <span className="sr-only">{sr}</span>
              <span aria-hidden="true" className="flex flex-col items-center">
                <span>{mark.label}</span>
                {tag ? (
                  <span className="font-mono text-meta">
                    {tag.symbol ? `${tag.symbol} ` : ''}
                    {tag.text}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
