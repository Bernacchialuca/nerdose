import type { ReactNode } from 'react';

import { cn } from '../cn';

export type BrandMarkProps = { label: ReactNode; className?: string };

export function BrandMark({ label, className }: BrandMarkProps) {
  return (
    <span className={cn('text-accent', className)}>
      <span aria-hidden="true">&gt; </span>
      {label}
    </span>
  );
}
