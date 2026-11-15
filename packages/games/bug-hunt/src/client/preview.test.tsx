// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { loadTokenizer } from './highlight';
import { Preview } from './preview';
import { PAYLOAD, PREVIEW_PAYLOAD, PREVIEW_PAYLOAD_BOOL, SPEC_MAX_INDEX } from './test-fixtures';

vi.mock('./highlight', () => ({ loadTokenizer: vi.fn(() => new Promise(() => {})) }));

const line = (n: number) =>
  screen.getByRole('tabpanel').querySelector(`[data-line="${n}"]`) as HTMLElement;

describe('Preview (TS-60)', () => {
  it('shows the full solution in Spanish as plain text', () => {
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveAttribute('lang', 'es');
    expect(root).not.toHaveAttribute('role');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    for (const name of [
      /qué debería hacer/,
      /tests/,
      /el test que falla/,
      /el fix · línea 4/,
      /Por qué falla/,
    ]) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    }
    expect(screen.getByText(SPEC_MAX_INDEX.es)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    for (const n of [1, 6, 7, 9]) expect(line(n)).toHaveClass('text-text-dim');
    expect(line(4)).toHaveTextContent('🐛 línea del bug');
    expect(line(4)).toHaveClass('bg-game-bug-hunt-tint');
    expect([...root.querySelectorAll<HTMLElement>('span')].some((s) => s.style.color)).toBe(false);
    expect(loadTokenizer).not.toHaveBeenCalled();
    expect(screen.getByText('tipo: comparación')).toBeInTheDocument();
    expect(screen.getByText('mutación: > → >=')).toBeInTheDocument();
    expect(screen.getByText('maxIndex([3, 7, 2]) → 1')).toBeInTheDocument();
    expect(screen.queryByText('1 test oculto falla')).toBeNull();
    expect(screen.getByText('maxIndex([5, 1, 5])')).toBeInTheDocument();
    expect(screen.getByText('maxIndex([5, 1, 5])').parentElement).toHaveTextContent(
      'esperado 0 · obtenido 2',
    );
    const fix = screen.getByRole('region', { name: 'Fix de la línea 4 en JavaScript' });
    expect(fix.textContent).toContain('    if (nums[i] > nums[best]) {');
    expect(
      within(
        screen.getByRole('heading', { name: /Por qué falla/ }).closest('section') as HTMLElement,
      ).getAllByRole('listitem'),
    ).toHaveLength(3);
  });
});

describe('Preview in English (TS-61)', () => {
  it('translates the texts and keeps the code identical', async () => {
    const user = userEvent.setup();
    const es = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    const esCode = screen.getByRole('tabpanel').textContent?.replace('línea del bug', '');
    es.unmount();
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="en" />);
    expect(container.firstElementChild).toHaveAttribute('lang', 'en');
    for (const name of [
      /what it should do/,
      /the failing test/,
      /the fix · line 4/,
      /Why it fails/,
    ]) {
      expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
    }
    expect(screen.getByText(SPEC_MAX_INDEX.en)).toBeInTheDocument();
    expect(screen.getByText('type: comparison')).toBeInTheDocument();
    expect(screen.getByText('mutation: > → >=')).toBeInTheDocument();
    expect(line(4)).toHaveTextContent('bug line');
    expect(screen.getByText(PAYLOAD.explanation.steps[0]!.en)).toBeInTheDocument();
    expect(screen.getByRole('tabpanel').textContent?.replace('bug line', '')).toBe(esCode);
    await user.click(screen.getByRole('tab', { name: 'Go' }));
    expect(screen.getByRole('region', { name: 'Fix for line 4 in Go' }).textContent).toContain(
      '\t\tif nums[i] > nums[best] {',
    );
  });
});

describe('Preview variants and guards', () => {
  it('handles the boolean two-argument payload (TS-62)', () => {
    render(<Preview payload={PREVIEW_PAYLOAD_BOOL} language="es" />);
    expect(line(2)).toHaveTextContent('línea del bug');
    expect(screen.getByText('tipo: valor inicial')).toBeInTheDocument();
    expect(screen.getByText('mutación: false → true')).toBeInTheDocument();
    expect(screen.getByText('anyAbove([5], 3) → true')).toBeInTheDocument();
    expect(screen.getByText('anyAbove([], 3)')).toBeInTheDocument();
    expect(screen.getByText('anyAbove([], 3)').parentElement).toHaveTextContent(
      'esperado false · obtenido true',
    );
    expect(
      within(
        screen.getByRole('heading', { name: /Por qué falla/ }).closest('section') as HTMLElement,
      ).getAllByRole('listitem'),
    ).toHaveLength(2);
  });

  it('throws on an invalid payload (TS-63)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Preview payload={{}} language="es" />)).toThrow(ZodError);
    expect(() =>
      render(<Preview payload={{ ...PREVIEW_PAYLOAD, bug_type: 'typo' }} language="es" />),
    ).toThrow(ZodError);
    spy.mockRestore();
  });

  it('is read-only (TS-64)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const getItem = vi.spyOn(Storage.prototype, 'getItem');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(container.querySelector('[aria-live]')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
    vi.restoreAllMocks();
  });
});
