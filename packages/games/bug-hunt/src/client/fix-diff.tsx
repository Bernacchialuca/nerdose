import { useId } from 'react';

import type { CodeLanguage } from '@nerdose/core';

import { LANGUAGE_LABEL } from '../shared/labels';

import type { Translate } from './types';

type FixDiffProps = {
  line: number;
  fix: { before: string; after: string };
  language: CodeLanguage;
  t: Translate;
  headingLevel: 2 | 3;
};

/** The `diff` code block: the buggy line (`- `) and the fixed one (`+ `) in the language of the active tab. */
export function FixDiff({ line, fix, language, t, headingLevel }: FixDiffProps) {
  const titleId = useId();
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <Heading id={titleId} className="font-mono text-label-comment text-text-dim">
        <span aria-hidden="true">// </span>
        {t('result.fixTitle', { line })}
      </Heading>
      {/* A horizontally scrollable region must be keyboard-reachable (WCAG 2.1.1 / axe scrollable-region-focusable). */}
      <div
        role="region"
        aria-label={t('result.fixLabel', { line, language: LANGUAGE_LABEL[language] })}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        style={{ tabSize: 4 }}
        className="overflow-x-auto rounded-inset border border-border bg-surface-sunken py-2.5 font-mono text-code-terminal focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-game-bug-hunt"
      >
        <div className="flex w-max min-w-full bg-status-error-bg px-3.5 text-status-error-soft">
          <span aria-hidden="true" className="whitespace-pre">
            -{' '}
          </span>
          <span className="whitespace-pre">{fix.before}</span>
        </div>
        <div className="flex w-max min-w-full bg-status-success-bg px-3.5 text-status-success-soft">
          <span aria-hidden="true" className="whitespace-pre">
            +{' '}
          </span>
          <span className="whitespace-pre">{fix.after}</span>
        </div>
      </div>
    </section>
  );
}
