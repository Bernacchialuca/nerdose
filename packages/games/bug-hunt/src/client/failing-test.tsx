import { useId } from 'react';

import { formatCall, formatValue } from '../shared/format';

import type { Translate } from './types';

type FailingTestProps = {
  name: string;
  failing: {
    input: readonly (number | readonly number[])[];
    expected: number | boolean;
    actual: number | boolean;
  };
  t: Translate;
  headingLevel: 2 | 3;
};

/** The `error` box: the failing call with its expected and obtained values (words, not just color). */
export function FailingTest({ name, failing, t, headingLevel }: FailingTestProps) {
  const titleId = useId();
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  // Embedded (h3, admin preview) it is not a landmark: the column around it is (see SectionPanel).
  const Root = headingLevel === 3 ? 'div' : 'section';
  return (
    <Root
      aria-labelledby={headingLevel === 3 ? undefined : titleId}
      className="flex flex-col gap-2"
    >
      <Heading id={titleId} className="font-mono text-label-comment text-text-dim">
        <span aria-hidden="true">// </span>
        {t('result.failingTitle')}
      </Heading>
      <div className="flex flex-col gap-1 rounded-inset border border-status-error-border bg-status-error-bg px-4 py-3.5 font-mono text-mono-body">
        <p className="min-w-0 break-words text-text">{formatCall(name, failing.input)}</p>
        <p className="text-text-body">
          {t('result.expected')}{' '}
          <b className="font-bold text-status-success">{formatValue(failing.expected)}</b>
          {' · '}
          {t('result.actual')}{' '}
          <b className="font-bold text-status-error">{formatValue(failing.actual)}</b>
        </p>
      </div>
    </Root>
  );
}
