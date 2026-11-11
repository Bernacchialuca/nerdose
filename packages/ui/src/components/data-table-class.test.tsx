import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { dataTableClass } from './data-table-class';

const classes = (s: string) => s.split(/\s+/);

describe('dataTableClass', () => {
  it('builds the DS data-table classes (S-033 TS-15)', () => {
    const c = dataTableClass();
    expect(Object.keys(c).sort()).toEqual(['region', 'table', 'td', 'th']);
    const expected = {
      region: [
        'overflow-x-auto',
        'rounded-panel',
        'border',
        'border-border',
        'bg-surface',
        'focus-visible:outline-accent',
      ],
      table: [
        'w-full',
        'min-w-160',
        'border-collapse',
        'font-mono',
        'text-mono-body',
        'text-text-body',
      ],
      th: [
        'border-b',
        'border-border-subtle',
        'px-5',
        'py-3.5',
        'text-left',
        'text-label-comment',
        'font-medium',
        'text-text-dim',
      ],
      td: ['border-b', 'border-border-row', 'px-5', 'py-3.5', 'align-middle'],
    } as const;
    for (const part of ['region', 'table', 'th', 'td'] as const)
      for (const k of expected[part]) expect(classes(c[part]), `${part} ${k}`).toContain(k);
  });

  it('renders an accessible table built by the consumer (S-033 TS-16)', async () => {
    const c = dataTableClass();
    const { container } = render(
      // Región con scroll horizontal: debe ser alcanzable con teclado (WCAG 2.1.1).
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      <div role="region" tabIndex={0} aria-label="Tabla de grupos de reportes" className={c.region}>
        <table className={c.table}>
          <caption className="sr-only">Grupos de reportes</caption>
          <thead>
            <tr>
              <th scope="col" className={c.th}>
                Desafío
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={c.td}>Devdle #8</td>
            </tr>
          </tbody>
        </table>
      </div>,
    );
    expect(screen.getByRole('table', { name: 'Grupos de reportes' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Desafío' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
