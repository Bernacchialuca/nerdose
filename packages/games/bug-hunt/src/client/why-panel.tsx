import { useId, type ReactNode } from 'react';

import type { CodeLanguage } from '@nerdose/core';

import { FailingTest } from './failing-test';
import { FixDiff } from './fix-diff';
import type { Translate } from './types';

type WhyPanelProps = {
  name: string;
  failing: {
    input: readonly (number | readonly number[])[];
    expected: number | boolean;
    actual: number | boolean;
  };
  fixLine: number;
  fix: { before: string; after: string };
  language: CodeLanguage;
  steps: readonly string[];
  chips?: ReactNode;
  t: Translate;
  /** 2 → `aside` of the result; 3 → plain `div` embedded in the admin preview (not a landmark). */
  headingLevel: 2 | 3;
};

/** `chip.accent`: «tipo: comparación». */
export function TypeChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-game-bug-hunt-featured px-2.5 py-1.5 font-mono text-meta text-game-bug-hunt">
      {children}
    </span>
  );
}

/** Explanation panel: failing test, fix, numbered steps and chips. Step text arrives resolved. */
export function WhyPanel({
  name,
  failing,
  fixLine,
  fix,
  language,
  steps,
  chips,
  t,
  headingLevel,
}: WhyPanelProps) {
  const titleId = useId();
  // Embedded (h3, admin preview) it is not a landmark: the column around it is (see SectionPanel).
  const Root = headingLevel === 3 ? 'div' : 'aside';
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <Root
      aria-labelledby={headingLevel === 3 ? undefined : titleId}
      className="flex flex-col gap-5 rounded-panel border border-border bg-surface p-6"
    >
      <FailingTest name={name} failing={failing} t={t} headingLevel={headingLevel} />
      <FixDiff line={fixLine} fix={fix} language={language} t={t} headingLevel={headingLevel} />
      <Heading id={titleId} className="font-mono text-title-panel text-text">
        {t('result.whyTitle')}
      </Heading>
      <ol className="flex flex-col gap-3.5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-7 flex-none items-center justify-center rounded-tile bg-game-bug-hunt-tint-strong font-mono text-label-comment font-bold text-game-bug-hunt">
              {i + 1}
            </span>
            <span className="font-sans text-body text-text-body">{step}</span>
          </li>
        ))}
      </ol>
      {chips ? <div className="flex flex-wrap gap-2">{chips}</div> : null}
    </Root>
  );
}
