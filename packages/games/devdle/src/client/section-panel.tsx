import { useId, type ReactNode } from 'react';

type SectionPanelProps = {
  title: string;
  datum?: string;
  id?: string;
  children: ReactNode;
  /** `h3` when embedded under another heading (admin preview). */
  headingLevel?: 2 | 3;
};

/** Panel with a `//` header that is a real `h2` (ui `Panel` renders a `p`). */
export function SectionPanel({ title, datum, id, children, headingLevel = 2 }: SectionPanelProps) {
  const headingId = useId();
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex flex-col gap-3.5 rounded-panel border border-border bg-surface p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <Heading id={headingId} className="font-mono text-label-comment text-text-dim">
          <span aria-hidden="true">// </span>
          {title}
        </Heading>
        {datum ? <span className="font-mono text-label-comment text-streak">{datum}</span> : null}
      </div>
      {children}
    </section>
  );
}
