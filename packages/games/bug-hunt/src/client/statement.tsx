import { useId } from 'react';

import { cn } from '@nerdose/ui';

import type { Translate } from './types';

type StatementProps = {
  spec: string;
  t: Translate;
  /** `null`: the `//` label is a paragraph (the result screen does not list it as a heading). */
  headingLevel: 2 | 3 | null;
  className?: string;
};

/** `bug-hunt.statement`: the amber `context` panel with the spec already resolved in the active language. */
export function Statement({ spec, t, headingLevel, className }: StatementProps) {
  const titleId = useId();
  const labelClass = 'font-mono text-label-comment text-streak-label';
  const label = (
    <>
      <span aria-hidden="true">// </span>
      {t('spec.title')}
    </>
  );
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  // Embedded (h3, admin preview) it is not a landmark: the column around it is (see SectionPanel).
  const Root = headingLevel === 3 ? 'div' : 'section';
  return (
    <Root
      aria-labelledby={headingLevel === 2 ? titleId : undefined}
      className={cn(
        'flex flex-col gap-2 rounded-panel border border-streak-border bg-streak-surface p-5',
        className,
      )}
    >
      {headingLevel === null ? (
        <p className={labelClass}>{label}</p>
      ) : (
        <Heading id={titleId} className={labelClass}>
          {label}
        </Heading>
      )}
      <p className="font-sans text-body text-text">{spec}</p>
    </Root>
  );
}
