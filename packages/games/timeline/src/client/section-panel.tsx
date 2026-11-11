import { useId, type ReactNode } from 'react';

import { cn } from '@nerdose/ui';

type SectionPanelProps = {
  title: string;
  datum?: string;
  id?: string;
  className?: string;
  children: ReactNode;
};

/** Panel with a `//` header that is a real `h2` (ui `Panel` renders a `p`). */
export function SectionPanel({ title, datum, id, className, children }: SectionPanelProps) {
  const headingId = useId();
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'flex flex-col gap-3.5 rounded-panel border border-border bg-surface p-5',
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="font-mono text-label-comment text-text-dim">
          <span aria-hidden="true">// </span>
          {title}
        </h2>
        {datum ? <span className="font-mono text-label-comment text-streak">{datum}</span> : null}
      </div>
      {children}
    </section>
  );
}
