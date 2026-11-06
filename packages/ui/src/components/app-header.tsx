import type { ReactNode } from 'react';

import { cn } from '../cn';

export type AppHeaderProps = {
  brand: ReactNode;
  nav?: ReactNode;
  children?: ReactNode;
  variant?: 'default' | 'home';
  className?: string;
};

export function AppHeader({
  brand,
  nav,
  children,
  variant = 'default',
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle px-8 py-4.5',
        variant === 'home' && 'bg-header',
        className,
      )}
    >
      {brand}
      {nav}
      {children ? <div className="flex flex-wrap items-center gap-2.5">{children}</div> : null}
    </header>
  );
}
