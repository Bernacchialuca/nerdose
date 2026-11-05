import type { ReactNode } from 'react';

import { cn } from '../cn';

export type BannerProps = {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function Banner({ title, children, className }: BannerProps) {
  return (
    <div
      role="status"
      className={cn('w-full border-l-4 border-warning bg-surface px-4 py-3 lg:px-12', className)}
    >
      <p className="text-base font-bold text-warning">{title}</p>
      {children ? <p className="mt-1 text-xs text-text-muted">{children}</p> : null}
    </div>
  );
}
