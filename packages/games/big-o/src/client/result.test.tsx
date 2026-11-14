// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Result } from './result';
import {
  PUBLIC_VIEW,
  PUBLIC_VIEW_OTHER,
  RESULT_LOST_GO_ES,
  RESULT_NO_TRAP_EXAMPLE_ES,
  RESULT_PLAIN_ES,
  RESULT_WON_JAVA_EN,
  RESULT_WON_JAVA_ES,
} from './test-fixtures';
import { makeT } from './test-utils';
import type { ResultProps } from './types';

vi.mock('./highlight', () => ({ loadTokenizer: vi.fn(() => new Promise(() => {})) }));

const props = (over: Partial<ResultProps> = {}): ResultProps => ({
  number: 8,
  locale: 'es',
  t: makeT('es'),
  result: RESULT_WON_JAVA_ES,
  publicView: PUBLIC_VIEW,
  gameStats: null,
  ...over,
});
const renderResult = (over: Partial<ResultProps> = {}) => render(<Result {...props(over)} />);

const QUESTION_ES = '¿Cuál es la complejidad temporal (peor caso) de f(n)?';
const lineOf = (n: number) => screen.getByRole('tabpanel').querySelector(`[data-line="${n}"]`);
const optionItem = (label: string) =>
  screen
    .getAllByRole('listitem')
    .find(
      (li) => li.parentElement?.tagName === 'UL' && li.textContent?.includes(label),
    ) as HTMLElement;
const optionItems = (list: HTMLElement) => within(list).getAllByRole('listitem');

describe('Result won (TS-48)', () => {
  it('shows the verdict, code with notes, marked options and the explanation', () => {
    renderResult();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Correcto: O(n log n)' });
    expect(h1).toHaveClass('sr-only');
    expect(screen.queryByText(/Incorrecto/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: QUESTION_ES })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Java' })).toHaveAttribute('aria-selected', 'true');
    expect(lineOf(1)?.querySelector('.whitespace-pre')?.textContent).toBe('static int f(int n) {');
    expect(lineOf(3)).toHaveTextContent('n veces');
    expect(lineOf(4)).toHaveTextContent('log n veces');
    expect(
      screen.getByRole('heading', { level: 2, name: 'tu respuesta · confirmada en Java' }),
    ).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'tu respuesta · confirmada en Java' });
    const items = optionItems(list);
    expect(items).toHaveLength(8);
    const fourth = items[3] as HTMLElement;
    expect(fourth.querySelector('.sr-only')).toHaveTextContent(
      'O(n log n), correcta, tu respuesta',
    );
    expect(fourth.querySelector('[aria-hidden="true"]')).toHaveTextContent('✓');
    expect(fourth).toHaveTextContent('correcta · tu respuesta');
    expect(fourth).toHaveClass('bg-status-success');
    const labels = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)', 'O(n!)'];
    items.forEach((li, i) => {
      if (i !== 3) expect(li.querySelector('.sr-only')?.textContent).toBe(labels[i]);
    });
    const panel = screen.getByRole('complementary', { name: 'Paso a paso' });
    expect(within(panel).getByText('// por qué')).toBeInTheDocument();
    expect(
      within(panel).getByRole('heading', { level: 2, name: 'Paso a paso' }),
    ).toBeInTheDocument();
    const steps = within(within(panel).getByRole('list')).getAllByRole('listitem');
    expect(steps.map((s) => s.textContent)).toEqual([
      '1El loop externo corre n veces.',
      '2El interno duplica j: log₂ n vueltas.',
      '3Anidados se multiplican: n × log n. Simplificado: O(n log n).',
    ]);
    expect(screen.getByText('// en números, con n = 1024')).toBeInTheDocument();
    expect(panel).toHaveTextContent('f(1024) cuenta 10.240 operaciones');
    expect(panel).toHaveTextContent('con O(n²) serían 1.048.576');
    expect(
      screen.getByText('Un loop interno que duplica su variable no es n.'),
    ).toBeInTheDocument();
  });
});

describe('Result lost (TS-49)', () => {
  it('shows the failure banner and marks both options', () => {
    renderResult({ result: RESULT_LOST_GO_ES });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Incorrecto: era O(n log n)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Elegiste O(n²) en Go. Abajo, paso a paso por qué.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Go' })).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('heading', { level: 2, name: 'tu respuesta · confirmada en Go' }),
    ).toBeInTheDocument();
    const correct = optionItem('O(n log n)');
    expect(correct.querySelector('.sr-only')).toHaveTextContent('O(n log n), correcta');
    expect(correct.querySelector('.sr-only')).not.toHaveTextContent('tu respuesta');
    expect(correct).toHaveClass('bg-status-success');
    const wrong = optionItem('O(n²)');
    expect(wrong.querySelector('.sr-only')).toHaveTextContent('O(n²), tu respuesta, incorrecta');
    expect(wrong.querySelector('[aria-hidden="true"]')).toHaveTextContent('✗');
    expect(wrong).toHaveTextContent('tu respuesta');
    expect(wrong).toHaveClass('border-status-error');
    expect(wrong).not.toHaveClass('bg-status-error');
  });
});

describe('Result tabs (TS-50)', () => {
  it('keeps the notes when switching language', async () => {
    const user = userEvent.setup();
    renderResult();
    const before = screen.getAllByRole('listitem').map((li) => li.textContent);
    await user.click(screen.getByRole('tab', { name: 'JavaScript' }));
    expect(lineOf(1)?.querySelector('.whitespace-pre')?.textContent).toBe('function f(n) {');
    expect(lineOf(3)).toHaveTextContent('n veces');
    expect(lineOf(4)).toHaveTextContent('log n veces');
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(before);
  });
});

describe('Result without example or tip (TS-51)', () => {
  it('hides the box and the tip when absent', () => {
    renderResult({ result: RESULT_PLAIN_ES, publicView: PUBLIC_VIEW_OTHER });
    expect(screen.queryByText(/en números/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Un loop interno/)).not.toBeInTheDocument();
    const panel = screen.getByRole('complementary', { name: 'Paso a paso' });
    expect(within(within(panel).getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
    expect(lineOf(5)).toHaveTextContent('dos llamadas por nivel');
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('shows only the first line when the example has no trap', () => {
    renderResult({ result: RESULT_NO_TRAP_EXAMPLE_ES });
    expect(screen.getByText('// en números, con n = 1024')).toBeInTheDocument();
    const panel = screen.getByRole('complementary', { name: 'Paso a paso' });
    expect(panel).toHaveTextContent('f(1024) cuenta 10.240 operaciones');
    expect(panel).not.toHaveTextContent('serían');
    expect(screen.queryByText(/Un loop interno/)).not.toBeInTheDocument();
  });
});

describe('Result in English (TS-52)', () => {
  it('translates every text', () => {
    renderResult({ result: RESULT_WON_JAVA_EN, locale: 'en', t: makeT('en') });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Correct: O(n log n)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'your answer · confirmed in Java' }),
    ).toBeInTheDocument();
    expect(
      optionItems(screen.getByRole('list', { name: /your answer/ }))[3]?.querySelector('.sr-only'),
    ).toHaveTextContent('O(n log n), correct, your answer');
    expect(screen.getByText('// why')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Step by step' })).toBeInTheDocument();
    expect(screen.getByText('// in numbers, with n = 1024')).toBeInTheDocument();
    const panel = screen.getByRole('complementary', { name: 'Step by step' });
    expect(panel).toHaveTextContent('f(1024) counts 10,240 operations');
    expect(panel).toHaveTextContent('with O(n²) it would be 1,048,576');
    expect(lineOf(3)).toHaveTextContent('n times');
    expect(lineOf(4)).toHaveTextContent('log n times');
    expect(
      screen.getByText('An inner loop that doubles its variable is not n.'),
    ).toBeInTheDocument();
  });
});

describe('Result without publicView (TS-53)', () => {
  it.each([undefined, null])('omits the code block for %s', (publicView) => {
    renderResult({ publicView });
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.queryByText(QUESTION_ES)).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: /tu respuesta/ })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Paso a paso' })).toBeInTheDocument();
  });
});

describe('Result layout (TS-54)', () => {
  it('keeps the mobile DOM order and uses lg placement', () => {
    const { container } = renderResult({
      notices: <p>aviso</p>,
      footer: <div>cierre</div>,
      aside: <a href="#r">Reportar</a>,
    });
    const order = [
      screen.getByRole('heading', { level: 1 }),
      screen.getByText('aviso'),
      screen.getByRole('heading', { level: 2, name: QUESTION_ES }),
      screen.getByRole('tablist'),
      screen.getByRole('list', { name: /tu respuesta/ }),
      screen.getByRole('complementary', { name: 'Paso a paso' }),
      screen.getByText('cierre'),
      screen.getByText('Reportar'),
    ];
    order.slice(1).forEach((el, i) => {
      const prev = order[i] as HTMLElement;
      expect(prev.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    expect(screen.getByRole('tablist').closest('.lg\\:col-span-7')).toBeInTheDocument();
    const panelCol = screen.getByRole('complementary').parentElement;
    expect(panelCol).toHaveClass('lg:col-start-8', 'lg:row-span-2');
    expect(screen.getByText('cierre').parentElement).toHaveClass('lg:row-start-2');
    expect(screen.getByRole('list', { name: /tu respuesta/ })).toHaveClass(
      'grid-cols-2',
      'lg:grid-cols-4',
    );
    expect(container.querySelector('.lg\\:grid-cols-12')).toBeInTheDocument();
  });
});

describe('Result invalid (TS-55)', () => {
  it('throws on an invalid result', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderResult({ result: { win: true } })).toThrow(ZodError);
    error.mockRestore();
  });
});

describe('Result accessibility (TS-56)', () => {
  it.each([
    ['won es', {}],
    ['lost es', { result: RESULT_LOST_GO_ES }],
    ['won en', { result: RESULT_WON_JAVA_EN, locale: 'en' as const, t: makeT('en') }],
  ])('has no axe violations (%s)', async (_name, over) => {
    const { container } = renderResult(over);
    expect(await axe(container)).toHaveNoViolations();
  });
});
