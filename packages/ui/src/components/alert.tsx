import type { ReactNode } from 'react';

import { cn } from '../cn';

export type AlertProps = {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function Alert({ children, action, className }: AlertProps) {
  return (
    <div role="alert" className={cn('w-full border-l-4 border-error bg-surface p-4', className)}>
      <p className="text-base text-error">{children}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
