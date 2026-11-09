import type { ReactNode } from 'react';

import { cn } from '../cn';

export type BadgeProps = {
  variant?: 'badge' | 'chip';
  tone?: 'success' | 'pending' | 'neutral';
  strong?: boolean;
  /** Solo `chip`: padding 6 12 (`próximamente`) en lugar de 6 10. */
  loose?: boolean;
  children: ReactNode;
  className?: string;
};

export function Badge({
  variant = 'badge',
  tone = 'neutral',
  strong = false,
  loose = false,
  children,
  className,
}: BadgeProps) {
  if (variant === 'chip') {
    return (
      <span
        className={cn(
          'inline-flex flex-none items-center whitespace-nowrap rounded-full border border-border-strong py-1.5 font-mono text-meta text-text-muted',
          loose ? 'px-3' : 'px-2.5',
          className,
        )}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex flex-none items-center whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-meta',
        tone === 'success' && 'bg-status-success-badge text-status-success-badge-text',
        tone === 'pending' && 'bg-status-pending-badge text-status-pending',
        tone === 'neutral' && 'bg-surface-inset text-text-muted',
        strong && 'font-bold',
        className,
      )}
    >
      {children}
    </span>
  );
}
