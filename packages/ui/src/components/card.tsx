import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '../cn';

export type CardProps = ComponentPropsWithoutRef<'article'>;

export function Card({ className, ...props }: CardProps) {
  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4',
        className,
      )}
      {...props}
    />
  );
}
