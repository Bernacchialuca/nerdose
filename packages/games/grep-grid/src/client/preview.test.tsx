// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Preview } from './preview';
import { PREVIEW_PAYLOAD } from './test-fixtures';

afterEach(() => vi.restoreAllMocks());

const label = (el: HTMLElement) => el.getAttribute('aria-label') ?? '';

describe('Preview (grep-grid)', () => {
  it('shows the highlighted grid and the word list in Spanish', () => {
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    expect(
      screen.getByRole('table', { name: 'Grilla con las 8 palabras resaltadas' }),
    ).toBeInTheDocument();
    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(144);
    expect(cells.filter((c) => label(c).endsWith(', parte de la solución'))).toHaveLength(47);
    expect(cells.filter((c) => label(c).endsWith(', libre'))).toHaveLength(97);
    expect(cells.map(label)).toContain('M, fila 1, columna 1, parte de la solución');
    expect(cells.map(label)).toContain('W, fila 2, columna 1, libre');
    expect(cells.map(label)).toContain('E, fila 4, columna 7, parte de la solución');
    expect(
      screen.getByRole('heading', { level: 3, name: 'palabras del desafío' }),
    ).toBeInTheDocument();
    expect(screen.getByText('8 palabras')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(8);
    expect(items.map((i) => i.firstElementChild?.firstElementChild?.textContent)).toEqual([
      'CACHE',
      'DOCKER',
      'KERNEL',
      'KUBERNETES',
      'MERGE',
      'OAUTH',
      'PYTHON',
      'REDIS',
    ]);
    expect(within(items[0] as HTMLElement).getByText('5 letras')).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText('definición de CACHE')).toBeInTheDocument();
    expect(within(items[3] as HTMLElement).getByText('10 letras')).toBeInTheDocument();
    for (const i of items) {
      expect(i.firstElementChild?.firstElementChild?.className).not.toContain('line-through');
    }
    expect(container.firstElementChild).toHaveAttribute('lang', 'es');
  });

  it('shows English texts and no Spanish ones when language is en', () => {
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="en" />);
    expect(
      screen.getByRole('table', { name: 'Grid with the 8 words highlighted' }),
    ).toBeInTheDocument();
    const labels = screen.getAllByRole('cell').map(label);
    expect(labels).toContain('M, row 1, column 1, part of the solution');
    expect(labels).toContain('W, row 2, column 1, free');
    expect(screen.getByRole('heading', { level: 3, name: 'challenge words' })).toBeInTheDocument();
    expect(screen.getByText('8 words')).toBeInTheDocument();
    expect(screen.getByText('definition of CACHE')).toBeInTheDocument();
    expect(screen.getAllByText('5 letters').length).toBeGreaterThan(0);
    expect(screen.queryByText('definición de CACHE')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('lang', 'en');
  });

  it('is read-only and causes no effects', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { container, rerender } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    rerender(<Preview payload={PREVIEW_PAYLOAD} language="en" />);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.queryByRole('grid')).toBeNull();
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(0);
  });

  it('marks the solution with a glyph besides color', () => {
    render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    const cells = screen.getAllByRole('cell');
    const solution = cells.find((c) => label(c).startsWith('M, fila 1, columna 1')) as HTMLElement;
    const free = cells.find((c) => label(c).startsWith('W, fila 2, columna 1')) as HTMLElement;
    expect(solution.querySelector('span[aria-hidden="true"]')?.textContent).toBe('✓');
    for (const cls of ['bg-game-grep-grid', 'text-game-grep-grid-on', 'font-extrabold']) {
      expect(solution.className).toContain(cls);
    }
    expect(free.querySelector('span')).toBeNull();
  });

  it.each(['es', 'en'] as const)(
    'has only level 3 headings and no axe violations in %s',
    async (lng) => {
      const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language={lng} />);
      expect(screen.queryAllByRole('heading', { level: 1 })).toEqual([]);
      expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([]);
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it('throws a ZodError on an invalid payload', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const [first, ...rest] = PREVIEW_PAYLOAD.words;
    const bad: unknown[] = [
      { ...PREVIEW_PAYLOAD, placements: PREVIEW_PAYLOAD.placements.slice(0, 7) },
      { ...PREVIEW_PAYLOAD, grid: PREVIEW_PAYLOAD.grid.slice(0, 11) },
      { ...PREVIEW_PAYLOAD, words: [{ ...first, definition: { es: 'x' } }, ...rest] },
    ];
    for (const payload of bad) {
      expect(() => render(<Preview payload={payload} language="es" />)).toThrow(ZodError);
    }
  });
});
