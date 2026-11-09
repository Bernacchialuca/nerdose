import type { ReactNode } from 'react';

import { cn } from '../cn';

import { StatusIcon, type StatusIconProps } from './status-icon';

type BannerVariant = 'warning' | 'success' | 'failure' | 'neutral';

export type BannerProps = {
  variant?: BannerVariant;
  title?: ReactNode;
  /** Elemento del título; `h1` para el veredicto del resultado. */
  titleAs?: 'p' | 'h1' | 'h2';
  children?: ReactNode;
  /** Slot de acción (botones/links), después de los textos. */
  action?: ReactNode;
  /** `role="status"`; por defecto `true` salvo en `neutral`. */
  announce?: boolean;
  className?: string;
};

const VARIANTS: Record<
  BannerVariant,
  { container: string; detail: string; icon: StatusIconProps['tone'] | null }
> = {
  warning: {
    container: 'border-status-warning-border bg-status-warning-bg',
    detail: 'font-sans text-body-sm-tight text-status-warning-soft',
    icon: 'warning',
  },
  success: {
    container: 'border-status-success-border bg-status-success-bg',
    detail: 'font-sans text-body-sm-tight text-status-success-soft',
    icon: 'success',
  },
  failure: {
    container: 'border-status-error-border bg-status-error-bg',
    detail: 'font-sans text-body-sm-tight text-status-error-soft',
    icon: 'error',
  },
  neutral: {
    container: 'border-border bg-surface',
    detail: 'font-mono text-mono-body text-text-muted',
    icon: null,
  },
};

export function Banner({
  variant = 'warning',
  title,
  titleAs = 'p',
  children,
  action,
  announce = variant !== 'neutral',
  className,
}: BannerProps) {
  const v = VARIANTS[variant];
  const Title = titleAs;
  return (
    <div
      role={announce ? 'status' : undefined}
      className={cn(
        'flex w-full flex-wrap items-center justify-between gap-4 rounded-panel border px-5.5 py-4.5',
        v.container,
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        {v.icon ? <StatusIcon tone={v.icon} /> : null}
        <div className="flex min-w-0 flex-col gap-0.5">
          {title ? <Title className="font-mono text-title-banner text-text">{title}</Title> : null}
          {children ? <p className={v.detail}>{children}</p> : null}
        </div>
      </div>
      {action ? <div className="flex flex-wrap gap-2.5">{action}</div> : null}
    </div>
  );
}
