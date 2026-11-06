import type { ReactNode } from 'react';

import { cn } from '../cn';

import { StatusIcon } from './status-icon';

export type BannerProps = {
  title: ReactNode;
  children?: ReactNode;
  variant?: 'warning';
  className?: string;
};

export function Banner({ title, children, className }: BannerProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex w-full flex-wrap items-center justify-between gap-4 rounded-panel border border-status-warning-border bg-status-warning-bg px-5.5 py-4.5',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <StatusIcon tone="warning" />
        <div className="flex min-w-0 flex-col gap-0.5">
          {title ? <p className="font-mono text-title-banner text-text">{title}</p> : null}
          {children ? (
            <p className="font-sans text-body-sm-tight text-status-warning-soft">{children}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
