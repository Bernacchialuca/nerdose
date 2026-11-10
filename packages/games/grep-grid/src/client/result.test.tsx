// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Result } from './result';
import { makeT } from './test-utils';
import type { ResultProps } from './types';
import {
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
    const h1 = screen.getByRole('heading', { level: 1, name: '8/8: las encontraste todas' });
    expect(h1.closest('[role="status"]')).toHaveClass('border-status-success-border');
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
      <Result {...base({ notices: <p>nota</p>, aside: <p>rachas</p>, footer: <p>salidas</p> })} />,
    );
    const root = container.firstElementChild as HTMLElement;
    const [main, side, foot] = Array.from(root.children) as HTMLElement[];
    expect(main).toHaveClass('grow-7', 'basis-155');
    expect(side).toHaveClass('grow-5', 'basis-85');
    expect(foot).toHaveClass('basis-full');
    expect(foot).toHaveTextContent('salidas');
    expect(main).toContainElement(screen.getByText('nota'));
    expect(main).toContainElement(screen.getByRole('table'));
    expect(side!.firstElementChild).toContainElement(screen.getByRole('list'));
    expect(side!.lastElementChild).toHaveTextContent('rachas');
    const banner = screen.getByRole('heading', { level: 1 }).closest('[role="status"]')!;
    expect(
      banner.compareDocumentPosition(screen.getByText('nota')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
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
