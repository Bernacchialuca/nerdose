import type { ReactNode } from 'react';

import { dataTableClass } from '@nerdose/ui';

export function TableRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      // Región con scroll horizontal: debe ser alcanzable con teclado (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label={label}
      className={dataTableClass().region}
    >
      {children}
    </div>
  );
}
