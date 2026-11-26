// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Result } from './result';
import { makeT } from './test-utils';
import type { ResultProps } from './types';
import {
  cellsOf,
  GAVE_UP_5_FOUND,
  PUBLIC_VIEW_0,
  RESULT_GAVE_UP_0,
  RESULT_GAVE_UP_5,
  RESULT_WIN,
  resultGaveUp5En,
} from './test-fixtures';

const base = (over: Partial<ResultProps> = {}): ResultProps => ({
  number: 8,
  locale: 'es',
  t: makeT('es'),
  result: RESULT_WIN,
  gameStats: null,
  ...over,
});

describe('Result', () => {
  it('shows a win (TS-63)', () => {
    render(<Result {...base()} />);
    // Veredicto siempre visible: banner success con el h1 y un detalle corto.
    const h1 = screen.getByRole('heading', { level: 1, name: '8/8: las encontraste todas' });
    expect(h1).not.toHaveClass('sr-only');
    expect(h1.closest('[role="status"]')).toHaveClass('border-status-success-border');
    expect(screen.getByText('Repasá qué significa cada una.')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'palabras de hoy' }).parentElement,
    ).toHaveTextContent('8/8');
    const table = screen.getByRole('table', { name: 'Grilla final: 8 encontradas y 0 reveladas' });
    expect(within(table).getAllByRole('cell')).toHaveLength(144);
    expect(within(table).queryAllByRole('cell', { name: /, revelada$/ })).toHaveLength(0);
    expect(within(table).queryAllByRole('button')).toHaveLength(0);
  });

  it('shows found and revealed words after giving up (TS-64)', () => {
    render(<Result {...base({ result: RESULT_GAVE_UP_5 })} />);
    expect(screen.getByRole('heading', { level: 1 }).closest('[role="status"]')).toHaveClass(
      'border-status-error-border',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Te rendiste con 5/8' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Estas son las palabras que faltaban.')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Grilla final: 5 encontradas y 3 reveladas' });
    const revealed = within(table).getAllByRole('cell', { name: /, revelada$/ });
    expect(revealed.length).toBeGreaterThan(0);
    for (const c of revealed) {
      expect(c).toHaveClass('border-dashed');
      expect(c).not.toHaveClass('bg-game-grep-grid');
      expect(c.querySelector('[aria-hidden]')).toHaveTextContent('○');
    }
    // Palabra por palabra: cada celda de OAUTH, REDIS y KUBERNETES que no comparte letra con
    // una encontrada se muestra «revelada».
    const foundKeys = new Set(
      GAVE_UP_5_FOUND.flatMap((w) => cellsOf(w)).map((c) => `${c.row},${c.col}`),
    );
    for (const w of ['OAUTH', 'REDIS', 'KUBERNETES'] as const) {
      const own = cellsOf(w).filter((c) => !foundKeys.has(`${c.row},${c.col}`));
      expect(own.length).toBeGreaterThan(0);
      for (const { row, col } of own) {
        const cell = within(table).getByRole('cell', {
          name: new RegExp(`^[A-Z], fila ${row + 1}, columna ${col + 1}, revelada$`),
        });
        expect(cell).toHaveClass('border-dashed');
        expect(cell.querySelector('[aria-hidden]')).toHaveTextContent('○');
      }
    }
    const docker = within(table).getByRole('cell', { name: /^D, fila 4, columna 3, encontrada$/ });
    expect(docker.querySelector('[aria-hidden]')).toHaveTextContent('✓');
  });

  it('draws the real letters when the host passes publicView', () => {
    render(<Result {...base({ result: RESULT_GAVE_UP_5, publicView: PUBLIC_VIEW_0 })} />);
    expect(screen.getByRole('cell', { name: 'W, fila 2, columna 1, libre' })).toBeInTheDocument();
  });

  it('lists the 8 words with definitions (TS-65)', () => {
    render(<Result {...base({ result: RESULT_GAVE_UP_5 })} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(8);
    for (const li of items) expect(li.textContent).toMatch(/definición de/);
    expect(screen.getAllByText('✓ encontrada')).toHaveLength(5);
    const missing = screen.getAllByText('○ no la encontraste');
    expect(missing).toHaveLength(3);
    expect(screen.getByText('OAUTH')).not.toHaveClass('line-through');
  });

  it('handles 0/8 (TS-66)', () => {
    render(<Result {...base({ result: RESULT_GAVE_UP_0 })} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Te rendiste con 0/8' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('○ no la encontraste')).toHaveLength(8);
    expect(screen.queryAllByRole('cell', { name: /, encontrada$/ })).toHaveLength(0);
  });

  it('switches language (TS-67)', () => {
    const { rerender } = render(<Result {...base({ result: RESULT_GAVE_UP_5 })} />);
    const before = screen.getAllByRole('cell', { name: /, revelada$/ }).length;
    rerender(<Result {...base({ result: resultGaveUp5En, locale: 'en', t: makeT('en') })} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'You gave up with 5/8' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^definition of /)).toHaveLength(8);
    expect(screen.getAllByRole('cell', { name: /, revealed$/ })).toHaveLength(before);
    expect(screen.getAllByText('✓ found')).toHaveLength(5);
    expect(screen.getAllByText("○ you didn't find it")).toHaveLength(3);
  });

  it('renders slots and layout (TS-68)', () => {
    const { container } = render(
      <Result
        {...base({
          result: RESULT_GAVE_UP_5,
          notices: <p>nota</p>,
          aside: <p>rachas</p>,
          footer: <p>salidas</p>,
        })}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    const banner = screen.getByRole('heading', { level: 1 }).closest('[role="status"]')!;
    // Veredicto arriba a todo el ancho, después notices y después las dos columnas.
    const [first, second, layout] = Array.from(root.children) as HTMLElement[];
    expect(first).toBe(banner);
    expect(second).toHaveTextContent('nota');
    expect(layout).toHaveClass('lg:grid-cols-12');
    const [main, side] = Array.from(layout!.children) as HTMLElement[];
    expect(main).toHaveClass('min-w-0', 'lg:col-span-7');
    expect(side).toHaveClass('min-w-0', 'lg:col-span-5');
    // Principal: grilla y al final la card de cierre. Lateral: lista con definiciones y aside último.
    expect(main!.firstElementChild).toContainElement(screen.getByRole('table'));
    expect(main!.lastElementChild).toHaveTextContent('salidas');
    expect(side!.firstElementChild).toContainElement(screen.getByRole('list'));
    expect(side!.lastElementChild).toHaveTextContent('rachas');
    // Sin `order`: mobile sigue el orden del DOM.
    expect(container.innerHTML).not.toMatch(/(?:^|\s|")(?:lg:)?order-/);
  });

  it('throws on an invalid result (TS-69)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Result {...base({ result: { win: true } })} />)).toThrow(ZodError);
    spy.mockRestore();
  });

  it('has no axe violations (TS-70)', async () => {
    const { container, rerender } = render(<Result {...base()} />);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Result {...base({ result: RESULT_GAVE_UP_5 })} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
