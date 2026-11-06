import type { ReactNode } from 'react';

import { cn } from '../cn';

export type BrandMarkProps = {
  label: ReactNode;
  cursor?: 'static' | 'blink';
  className?: string;
};

export function BrandMark({ label, cursor = 'static', className }: BrandMarkProps) {
  return (
    <span
      className={cn('inline-flex items-baseline font-mono text-brand-logo text-text', className)}
    >
      <span aria-hidden="true" className="text-accent">
        &gt;&nbsp;
      </span>
      {label}
      <span
        aria-hidden="true"
        className={cn('text-accent', cursor === 'blink' && 'motion-safe:animate-blink')}
      >
        _
      </span>
    </span>
  );
}
