// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Result } from './result';
import {
  PUBLIC_VIEW,
  PUBLIC_VIEW_BOOL,
  PUBLIC_VIEW_EN,
  RESULT_BOOL_ES,
  RESULT_LOST_GO_ES,
  RESULT_WON_JAVA_EN,
  RESULT_WON_JAVA_ES,
} from './test-fixtures';
import { makeT } from './test-utils';
import type { ResultProps } from './types';

vi.mock('./highlight', () => ({ loadTokenizer: vi.fn(() => new Promise(() => {})) }));

const base = (over: Partial<ResultProps> = {}): ResultProps => ({
  number: 8,
  locale: 'es',
  t: makeT('es'),
  result: RESULT_WON_JAVA_ES,
  publicView: PUBLIC_VIEW,
  gameStats: null,
  ...over,
});
const renderResult = (over: Partial<ResultProps> = {}) => render(<Result {...base(over)} />);
const line = (n: number) =>
  screen.getByRole('tabpanel').querySelector(`[data-line="${n}"]`) as HTMLElement;
const lineText = (n: number) => line(n).querySelector('.whitespace-pre')?.textContent;
const tagOf = (n: number) =>
  document.getElementById(line(n).getAttribute('aria-describedby') as string) as HTMLElement;
const panel = (name: string) => screen.getByRole('complementary', { name });

describe('Result won (TS-51)', () => {
  it('shows the found line, the failing test, the fix and the steps', () => {
    renderResult();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Bug encontrado en la línea 4' });
    expect(h1).toHaveClass('sr-only');
    expect(screen.queryByRole('status')).toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: '¿En qué línea está el bug?' }),
    ).toBeInTheDocument();
    expect(screen.getByText(PUBLIC_VIEW.spec)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Java' })).toHaveAttribute('aria-selected', 'true');
    expect(lineText(1)).toBe('static int maxIndex(int[] nums) {');
    expect(screen.getByText('MaxIndex.java')).toBeInTheDocument();
    expect(tagOf(4)).toHaveTextContent('✓ acá estaba el bug');
    expect(line(4)).toHaveClass('bg-status-success-bg');
    expect(screen.queryByRole('radio')).toBeNull();
    const why = within(panel('Por qué falla'));
    expect(why.getByRole('heading', { level: 2, name: /el test que falla/ })).toBeInTheDocument();
    expect(why.getByText('maxIndex([5, 1, 5])')).toBeInTheDocument();
    expect(why.getByText('0', { selector: 'b' })).toHaveClass('text-status-success');
    expect(why.getByText('2', { selector: 'b' })).toHaveClass('text-status-error');
    expect(why.getByText(/esperado/)).toBeInTheDocument();
    expect(why.getByText(/obtenido/)).toBeInTheDocument();
    expect(why.getByRole('heading', { level: 2, name: /el fix · línea 4/ })).toBeInTheDocument();
    const region = why.getByRole('region', { name: 'Fix de la línea 4 en Java' });
    expect(region.textContent).toContain('-         if (nums[i] >= nums[best]) {');
    expect(region.textContent).toContain('+         if (nums[i] > nums[best]) {');
    expect(why.getByRole('heading', { level: 2, name: 'Por qué falla' })).toBeInTheDocument();
    const items = why.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    RESULT_WON_JAVA_ES.explanation.steps.forEach((s, i) => {
      expect(items[i]).toHaveTextContent(s);
      expect(items[i]!.querySelector('span')).toHaveTextContent(String(i + 1));
    });
    expect(within(items[0]!).getByText('1')).toHaveClass('bg-game-bug-hunt-tint-strong');
    expect(why.getByText('tipo: comparación')).toHaveClass('text-game-bug-hunt');
  });
});

describe('Result lost (TS-52)', () => {
  it('shows the banner and marks both lines', () => {
    renderResult({ result: RESULT_LOST_GO_ES });
    expect(
      screen.getByRole('heading', { level: 1, name: 'El bug estaba en la línea 4, no en la 5' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Elegiste la línea 5 en Go. Desafío completado: tus rachas siguen en pie.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Go' })).toHaveAttribute('aria-selected', 'true');
    expect(tagOf(4)).toHaveTextContent('🐛 acá estaba el bug');
    expect(line(4)).toHaveClass('bg-game-bug-hunt-tint');
    expect(tagOf(5)).toHaveTextContent('✗ tu elección');
    expect(line(5)).toHaveClass('bg-status-error-bg');
    const region = screen.getByRole('region', { name: 'Fix de la línea 4 en Go' });
    expect(region.textContent).toContain('\t\tif nums[i] >= nums[best] {');
    expect(region.textContent).toContain('\t\tif nums[i] > nums[best] {');
  });
});

describe('Result tabs (TS-53)', () => {
  it('moves the fix and keeps the marks', async () => {
    const user = userEvent.setup();
    renderResult();
    await user.click(screen.getByRole('tab', { name: 'JavaScript' }));
    expect(lineText(1)).toBe('function maxIndex(nums) {');
    expect(tagOf(4)).toHaveTextContent('acá estaba el bug');
    const region = screen.getByRole('region', { name: 'Fix de la línea 4 en JavaScript' });
    expect(region.textContent).toContain('    if (nums[i] >= nums[best]) {');
    expect(region.textContent).toContain('    if (nums[i] > nums[best]) {');
  });
});

describe('Result variants', () => {
  it('works in English (TS-54)', () => {
    renderResult({
      result: RESULT_WON_JAVA_EN,
      publicView: PUBLIC_VIEW_EN,
      locale: 'en',
      t: makeT('en'),
    });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Bug found on line 4' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Which line has the bug?' }),
    ).toBeInTheDocument();
    expect(tagOf(4)).toHaveTextContent('the bug was here');
    const why = within(panel('Why it fails'));
    expect(why.getByRole('heading', { name: /the failing test/ })).toBeInTheDocument();
    expect(why.getByText(/expected/)).toBeInTheDocument();
    expect(why.getByText(/got/)).toBeInTheDocument();
    expect(why.getByRole('heading', { name: /the fix · line 4/ })).toBeInTheDocument();
    expect(why.getByText(RESULT_WON_JAVA_EN.explanation.steps[0]!)).toBeInTheDocument();
    expect(why.getByText('type: comparison')).toBeInTheDocument();
  });

  it('handles two arguments and booleans (TS-55)', () => {
    renderResult({ result: RESULT_BOOL_ES, publicView: PUBLIC_VIEW_BOOL });
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(tagOf(2)).toHaveTextContent('acá estaba el bug');
    const why = within(panel('Por qué falla'));
    expect(why.getByText('anyAbove([], 3)')).toBeInTheDocument();
    expect(why.getByText('false', { selector: 'b' })).toHaveClass('text-status-success');
    expect(why.getByText('true', { selector: 'b' })).toHaveClass('text-status-error');
    const region = why.getByRole('region', { name: /Fix de la línea 2/ });
    expect(region.textContent).toContain('  let found = true;');
    expect(region.textContent).toContain('  let found = false;');
    expect(why.getAllByRole('listitem')).toHaveLength(2);
    expect(why.getByText('tipo: valor inicial')).toBeInTheDocument();
  });

  it('works without a public view (TS-56)', () => {
    renderResult({ publicView: undefined });
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByText('¿En qué línea está el bug?')).toBeNull();
    expect(screen.queryByText(PUBLIC_VIEW.spec)).toBeNull();
    const why = within(panel('Por qué falla'));
    expect(why.getByRole('region', { name: 'Fix de la línea 4 en Java' })).toBeInTheDocument();
    expect(why.getAllByRole('listitem')).toHaveLength(3);
    expect(why.getByText('tipo: comparación')).toBeInTheDocument();
  });

  it('throws on an invalid result (TS-58)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderResult({ result: { win: true } })).toThrow(ZodError);
    spy.mockRestore();
  });
});

describe('Result layout (TS-57, TS-59)', () => {
  it('orders the DOM for mobile and places columns with lg classes', () => {
    const { container } = renderResult({
      notices: <p>aviso</p>,
      footer: <div>cierre</div>,
      aside: <a href="#r">Reportar</a>,
    });
    const seq = [
      screen.getByRole('heading', { level: 1 }),
      screen.getByText('aviso'),
      screen.getByRole('heading', { level: 2, name: '¿En qué línea está el bug?' }),
      screen.getByRole('tablist'),
      panel('Por qué falla'),
      screen.getByText('cierre'),
      screen.getByText('Reportar'),
    ];
    seq.slice(1).forEach((el, i) => {
      expect(
        seq[i]!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
        `step ${i}`,
      ).toBeTruthy();
    });
    expect(screen.getByRole('tablist').closest('.lg\\:col-span-7')).toBeInTheDocument();
    expect(panel('Por qué falla').parentElement).toHaveClass('lg:col-start-8', 'lg:row-span-2');
    expect(screen.getByText('cierre').parentElement).toHaveClass('lg:row-start-2');
    const scrollers = [...container.querySelectorAll('.overflow-x-auto')];
    expect(scrollers).toHaveLength(2);
  });

  it('has no axe violations', async () => {
    for (const over of [
      {},
      { result: RESULT_LOST_GO_ES },
      {
        result: RESULT_WON_JAVA_EN,
        publicView: PUBLIC_VIEW_EN,
        locale: 'en' as const,
        t: makeT('en'),
      },
      { result: RESULT_BOOL_ES, publicView: PUBLIC_VIEW_BOOL },
    ]) {
      const { container, unmount } = renderResult(over);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});
