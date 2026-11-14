import { Fragment, useId } from 'react';

import type { Locale } from '@nerdose/core';

import { formatCount } from './format';
import type { Translate } from './types';

type Example = { n: number; ops: number; trap_ops: number | null };

type ExplanationProps = {
  steps: readonly string[];
  tip: string | null;
  example: Example | null;
  /** Label of `trap_option` (e.g. `O(n²)`), or null when the recipe has no trap. */
  trapLabel: string | null;
  locale: Locale;
  t: Translate;
  /** 2 → `aside` of the result; 3 → `section` embedded in the admin preview. */
  headingLevel: 2 | 3;
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wraps the numeric values of an already translated line in `<b>`. */
function Emphasis({ text, values }: { text: string; values: string[] }) {
  const parts = text.split(new RegExp(`(${values.map(escape).join('|')})`));
  return (
    <>
      {parts.map((part, i) =>
        values.includes(part) ? (
          <b key={i} className="text-text">
            {part}
          </b>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Step-by-step panel: steps, «en números» box and tip. Text arrives resolved from the server (D9). */
export function Explanation({
  steps,
  tip,
  example,
  trapLabel,
  locale,
  t,
  headingLevel,
}: ExplanationProps) {
  const titleId = useId();
  const Root = headingLevel === 3 ? 'section' : 'aside';
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const ops = example ? formatCount(example.ops, locale) : '';
  const trapOps =
    example && example.trap_ops !== null ? formatCount(example.trap_ops, locale) : null;
  return (
    <Root
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-panel border border-border bg-surface p-6"
    >
      <div className="flex flex-col gap-1">
        <p className="font-mono text-label-comment text-text-dim">{`// ${t('result.whyComment')}`}</p>
        <Heading id={titleId} className="font-mono text-title-panel text-text">
          {t('result.stepsTitle')}
        </Heading>
      </div>
      <ol className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-7 flex-none items-center justify-center rounded-tile bg-game-big-o-border font-mono text-label-comment font-bold text-game-big-o-light">
              {i + 1}
            </span>
            <span className="font-sans text-body text-text-body">{step}</span>
          </li>
        ))}
      </ol>
      {example ? (
        <div className="flex flex-col gap-2 rounded-inset border border-game-big-o-border bg-game-big-o-tint p-4 font-mono text-label-comment">
          <p className="text-text-dim">
            {`// ${t('result.example.title', { n: String(example.n) })}`}
          </p>
          <p className="text-text-body">
            <Emphasis
              text={t('result.example.ops', { n: String(example.n), ops })}
              values={[ops]}
            />
          </p>
          {trapOps !== null && trapLabel !== null ? (
            <p className="text-text-body">
              <Emphasis
                text={t('result.example.trap', { trap: trapLabel, trapOps })}
                values={[trapOps]}
              />
            </p>
          ) : null}
        </div>
      ) : null}
      {tip ? <p className="font-sans text-body-sm text-text-muted">{tip}</p> : null}
    </Root>
  );
}
