import type { ReactNode } from 'react';

import { cn } from '../cn';

import { StatusIcon } from './status-icon';

export type AlertProps = {
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function Alert({ title, children, action, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex w-full flex-wrap items-center justify-between gap-4 rounded-panel border border-status-error-border bg-status-error-bg px-5.5 py-4.5',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <StatusIcon tone="error" />
        <div className="flex min-w-0 flex-col gap-0.5">
          {title ? <p className="font-mono text-title-banner text-text">{title}</p> : null}
          {children ? (
            <p className="font-sans text-body-sm-tight text-status-error-soft">{children}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex flex-wrap gap-2.5">{action}</div> : null}
    </div>
  );
}
