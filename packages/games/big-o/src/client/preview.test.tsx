// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { loadTokenizer } from './highlight';
import { Preview } from './preview';
import { PREVIEW_PAYLOAD, PREVIEW_PAYLOAD_PLAIN } from './test-fixtures';

vi.mock('./highlight', () => ({ loadTokenizer: vi.fn(() => new Promise(() => {})) }));

const lineOf = (n: number) => screen.getByRole('tabpanel').querySelector(`[data-line="${n}"]`);
const optionItem = (label: string) =>
  screen
    .getAllByRole('listitem')
    .find(
      (li) => li.parentElement?.tagName === 'UL' && li.textContent?.includes(label),
    ) as HTMLElement;

describe('Preview in Spanish (TS-57)', () => {
  it('shows the solution overlaid on the board', () => {
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('lang', 'es');
    expect(root).not.toHaveAttribute('role');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'respuesta' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Paso a paso' })).toBeInTheDocument();
    expect(root).toHaveTextContent('¿Cuál es la complejidad temporal (peor caso) de f(n)?');
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(lineOf(3)?.querySelector('.whitespace-pre')?.textContent).toBe(
      '  for (let i = 0; i < n; i++) {',
    );
    expect(lineOf(3)).toHaveTextContent('n veces');
    expect(lineOf(4)).toHaveTextContent('log n veces');
    const colored = [...screen.getByRole('tabpanel').querySelectorAll<HTMLElement>('span')].filter(
      (s) => s.style.color,
    );
    expect(colored).toHaveLength(0);
    expect(loadTokenizer).not.toHaveBeenCalled();
    const correct = optionItem('O(n log n)');
    expect(correct.querySelector('.sr-only')).toHaveTextContent('O(n log n), correcta');
    expect(correct).toHaveClass('bg-status-success');
    const trap = optionItem('O(n²)');
    expect(trap.querySelector('.sr-only')).toHaveTextContent('O(n²), trampa');
    expect(trap).toHaveTextContent('trampa');
    expect(trap).toHaveClass('border-dashed', 'border-game-big-o-muted');
    expect(trap).not.toHaveClass('bg-status-success');
    const section = screen.getByRole('region', { name: 'Paso a paso' });
    expect(within(within(section).getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('// en números, con n = 1024')).toBeInTheDocument();
    expect(section).toHaveTextContent('f(1024) cuenta 10.240 operaciones');
    expect(section).toHaveTextContent('con O(n²) serían 1.048.576');
    expect(
      screen.getByText('Un loop interno que duplica su variable no es n.'),
    ).toBeInTheDocument();
  });
});

describe('Preview in English (TS-58)', () => {
  it('shares the code and translates the explanation', () => {
    const es = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    const esCode = screen.getByRole('tabpanel').textContent?.replace(/n veces|log n veces/g, '');
    es.unmount();
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="en" />);
    expect(container.firstElementChild).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('heading', { level: 3, name: 'answer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Step by step' })).toBeInTheDocument();
    expect(lineOf(3)).toHaveTextContent('n times');
    expect(lineOf(4)).toHaveTextContent('log n times');
    expect(optionItem('O(n²)').querySelector('.sr-only')).toHaveTextContent('O(n²), trap');
    expect(screen.getByText('The outer loop runs n times.')).toBeInTheDocument();
    expect(container).toHaveTextContent('with O(n²) it would be 1,048,576');
    expect(screen.getByRole('tabpanel').textContent?.replace(/n times|log n times/g, '')).toBe(
      esCode,
    );
  });
});

describe('Preview without trap, tip or example (TS-59)', () => {
  it('marks only the answer', () => {
    render(<Preview payload={PREVIEW_PAYLOAD_PLAIN} language="es" />);
    expect(screen.queryByText('trampa')).not.toBeInTheDocument();
    expect(optionItem('O(2ⁿ)')).toHaveTextContent('correcta');
    expect(screen.queryByText(/en números/)).not.toBeInTheDocument();
    const section = screen.getByRole('region', { name: 'Paso a paso' });
    expect(within(within(section).getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
    expect(lineOf(5)).toHaveTextContent('dos llamadas por nivel');
  });
});

describe('Preview invalid payload (TS-60)', () => {
  it('throws a ZodError', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Preview payload={{}} language="es" />)).toThrow(ZodError);
    expect(() =>
      render(<Preview payload={{ ...PREVIEW_PAYLOAD, trap_option: 'o_n_log_n' }} language="es" />),
    ).toThrow(ZodError);
    error.mockRestore();
  });
});

describe('Preview read-only (TS-61)', () => {
  it('has no controls beyond the tabs, no effects and no violations', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons.every((b) => b.getAttribute('role') === 'tab')).toBe(true);
    expect(buttons).toHaveLength(3);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-live]')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
    vi.restoreAllMocks();
  });
});
