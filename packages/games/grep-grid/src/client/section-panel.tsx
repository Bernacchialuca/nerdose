import { useId, type ReactNode } from 'react';

type SectionPanelProps = {
  title: string;
  /** Dato a la derecha del título (p. ej. el contador `N/8`), en el color del juego. */
  datum?: ReactNode;
  id?: string;
  children: ReactNode;
};

/** Panel with a `//` header that is a real `h2` (ui `Panel` renders a `p`). */
export function SectionPanel({ title, datum, id, children }: SectionPanelProps) {
  const headingId = useId();
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="flex flex-col gap-3.5 rounded-panel border border-border bg-surface p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={headingId} className="font-mono text-label-comment text-text-dim">
          <span aria-hidden="true">// </span>
          {title}
        </h2>
        {datum ? (
          <span className="font-mono text-mono-body font-bold text-game-grep-grid">{datum}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
