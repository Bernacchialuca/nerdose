import type { ReactNode } from 'react';

import { cn } from '../cn';

export type AppHeaderProps = {
  brand: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function AppHeader({ brand, children, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 lg:px-12',
        className,
      )}
    >
      {brand}
      {children ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{children}</div>
      ) : null}
    </header>
  );
}
