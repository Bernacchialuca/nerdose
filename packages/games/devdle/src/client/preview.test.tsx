// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Preview } from './preview';
import { PREVIEW_PAYLOAD } from './test-fixtures';

afterEach(() => vi.restoreAllMocks());

describe('Preview (devdle)', () => {
  it('shows the solved word and the word card in Spanish', () => {
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    expect(screen.getByRole('grid', { name: 'Solución: REACT' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(screen.getAllByRole('gridcell').map((c) => c.getAttribute('aria-label'))).toEqual([
      'R, correcta',
      'E, correcta',
      'A, correcta',
      'C, correcta',
      'T, correcta',
    ]);
    expect(screen.getByRole('heading', { level: 3, name: 'palabra del día' })).toBeInTheDocument();
    expect(screen.getByText('Categoría: lenguajes')).toBeInTheDocument();
    expect(
      screen.getByText('biblioteca de JavaScript para construir interfaces de usuario'),
    ).toBeInTheDocument();
    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(
      screen.getByText('React es una biblioteca de código abierto mantenida por Meta.'),
    ).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('lang', 'es');
  });

  it('shows English texts and no Spanish ones when language is en', () => {
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="en" />);
    expect(screen.getByRole('grid', { name: 'Solution: REACT' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell').map((c) => c.getAttribute('aria-label'))).toEqual([
      'R, correct',
      'E, correct',
      'A, correct',
      'C, correct',
      'T, correct',
    ]);
    expect(screen.getByRole('heading', { level: 3, name: 'word of the day' })).toBeInTheDocument();
    expect(screen.getByText('Category: programming languages')).toBeInTheDocument();
    expect(screen.getByText('JavaScript library for building user interfaces')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(
      screen.getByText(
        'React is a free and open-source front-end JavaScript library maintained by Meta.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('biblioteca de JavaScript para construir interfaces de usuario'),
    ).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('lang', 'en');
  });

  it('is read-only and causes no effects', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { rerender } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    rerender(<Preview payload={PREVIEW_PAYLOAD} language="en" />);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.queryAllByRole('textbox')).toEqual([]);
    expect(screen.queryByRole('group', { name: 'Teclado' })).toBeNull();
  });

  it('only renders level 3 headings so it can be embedded', () => {
    render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    expect(screen.queryAllByRole('heading', { level: 1 })).toEqual([]);
    expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([]);
    for (const h of screen.getAllByRole('heading')) expect(h.tagName).toBe('H3');
  });

  it.each(['es', 'en'] as const)('has no axe violations in %s', async (lng) => {
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language={lng} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('throws a ZodError on an invalid payload', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const bad: unknown[] = [
      { ...PREVIEW_PAYLOAD, word: 'react' },
      { ...PREVIEW_PAYLOAD, definition: { es: 'x' } },
      null,
    ];
    for (const payload of bad) {
      expect(() => render(<Preview payload={payload} language="es" />)).toThrow(ZodError);
    }
  });

  it('scales the board for a 12-letter word', () => {
    render(<Preview payload={{ ...PREVIEW_PAYLOAD, word: 'ORCHESTRATOR' }} language="es" />);
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(12);
    for (const c of cells) expect(c.getAttribute('aria-label')).toMatch(/, correcta$/);
    const grid = screen.getByRole('grid', { name: 'Solución: ORCHESTRATOR' });
    expect(grid.getAttribute('style')).toContain('--board-cols: repeat(12, minmax(0, 1fr))');
  });
});
