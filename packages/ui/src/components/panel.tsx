import { createElement, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from '../cn';

export type PanelProps = Omit<ComponentPropsWithoutRef<'section'>, 'title'> & {
  variant?: 'default' | 'feature';
  label?: ReactNode;
  datum?: ReactNode;
  title?: ReactNode;
  titleLevel?: 2 | 3;
  note?: ReactNode;
};

export function Panel({
  variant = 'default',
  label,
  datum,
  title,
  titleLevel = 2,
  note,
  className,
  children,
  ...rest
}: PanelProps) {
  const titleId = useId();
  const feature = variant === 'feature';
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        'flex flex-col border border-border bg-surface',
        feature ? 'gap-4 rounded-feature p-7' : 'gap-3 rounded-panel p-5',
        className,
      )}
      {...rest}
    >
      {label || datum ? (
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-label-comment text-text-dim">
            <span aria-hidden="true">// </span>
            {label}
          </p>
          {datum ? <span className="font-mono text-label-comment text-streak">{datum}</span> : null}
        </div>
      ) : null}
      {title
        ? createElement(
            `h${titleLevel}`,
            {
              id: titleId,
              className: cn(
                'font-mono text-text',
                feature ? 'text-title-section' : 'text-title-panel',
              ),
            },
            title,
          )
        : null}
      {children ? <div className="flex min-w-0 flex-col gap-3">{children}</div> : null}
      {note ? <p className="font-sans text-caption text-text-muted">{note}</p> : null}
    </section>
  );
}
