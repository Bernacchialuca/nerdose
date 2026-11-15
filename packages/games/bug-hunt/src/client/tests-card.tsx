import { formatArgs, formatCall, formatValue } from '../shared/format';

import { SectionPanel } from './section-panel';
import type { Translate } from './types';

type VisibleTest = {
  input: readonly (number | readonly number[])[];
  expected: number | boolean;
};

type TestsCardProps = {
  name: string;
  tests: readonly VisibleTest[];
  t: Translate;
  headingLevel: 2 | 3;
  /** The hidden-test row and the foot note belong to the game; the admin preview omits them. */
  showHidden: boolean;
  className?: string;
};

/** `bug-hunt.test`: visible tests as calls (name, args, arrow, value) and the hidden failing test row. */
export function TestsCard({ name, tests, t, headingLevel, showHidden, className }: TestsCardProps) {
  return (
    <SectionPanel
      title={t('tests.title')}
      datum={t('tests.datum')}
      headingLevel={headingLevel}
      className={className}
    >
      <ul className="flex flex-col gap-2">
        {tests.map((test, i) => (
          <li
            key={i}
            className="flex gap-2.5 rounded-control bg-surface-inset px-3 py-2.5 font-mono text-mono-body text-text"
          >
            <span aria-hidden="true" className="w-5.5 flex-none text-status-success">
              ✓
            </span>
            <span aria-hidden="true" className="min-w-0 break-words">
              {`${formatCall(name, test.input)} → ${formatValue(test.expected)}`}
            </span>
            <span className="sr-only">
              {t('tests.passSr', {
                name,
                args: formatArgs(test.input),
                expected: formatValue(test.expected),
              })}
            </span>
          </li>
        ))}
        {showHidden ? (
          <li className="flex gap-2.5 rounded-control border border-dashed border-status-error-border px-3 py-2.5 font-mono text-mono-body text-status-error-soft">
            <span aria-hidden="true" className="w-5.5 flex-none text-status-error">
              ✗
            </span>
            <span>{t('tests.hidden')}</span>
          </li>
        ) : null}
      </ul>
      {showHidden ? (
        <p className="font-sans text-caption text-text-muted">{t('tests.note')}</p>
      ) : null}
    </SectionPanel>
  );
}
