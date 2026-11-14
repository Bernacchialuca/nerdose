// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { Preview } from './preview';
import { PREVIEW_PAYLOAD } from './test-fixtures';

afterEach(() => vi.restoreAllMocks());

const rows = () =>
  within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((li) =>
      [...li.querySelectorAll(':scope > div:last-child > span')].map((s) => s.textContent),
    );

describe('Preview (timeline)', () => {
  it('shows the prompt and the 5 facts in correct_order in Spanish', () => {
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    expect(
      screen.getByText('// consigna: Ordená estos hitos del más antiguo al más reciente'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'orden correcto' })).toBeInTheDocument();
    expect(rows()).toEqual([
      ['20 de febrero de 1991', 'Python', '// lenguajes de programación', 'nota de Python'],
      ['23 de mayo de 1995', 'Java', '// lenguajes de programación', 'nota de Java'],
      ['2009', 'Go', '// lenguajes de programación', 'nota de Go'],
      ['20 de marzo de 2013', 'Docker', '// software y herramientas', 'nota de Docker'],
      ['junio de 2014', 'Kubernetes', '// software y herramientas', 'nota de Kubernetes'],
    ]);
    expect(container.firstElementChild).toHaveAttribute('lang', 'es');
  });

  it('shows English texts and dates and no Spanish ones when language is en', () => {
    const { container } = render(<Preview payload={PREVIEW_PAYLOAD} language="en" />);
    expect(
      screen.getByText('// task: Order these milestones from oldest to newest'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'correct order' })).toBeInTheDocument();
    const r = rows();
    expect(r.map((x) => x[0])).toEqual([
      'February 20, 1991',
      'May 23, 1995',
      '2009',
      'March 20, 2013',
      'June 2014',
    ]);
    expect(r.map((x) => x[3])).toEqual([
      'note on Python',
      'note on Java',
      'note on Go',
      'note on Docker',
      'note on Kubernetes',
    ]);
    expect(r[0]?.[2]).toBe('// programming languages');
    expect(r[3]?.[2]).toBe('// software and tools');
    expect(screen.queryByText('nota de Python')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('lang', 'en');
  });

  it('orders by correct_order, not by items', () => {
    render(
      <Preview
        payload={{
          ...PREVIEW_PAYLOAD,
          correct_order: ['k1v3s8', 'd9r6t0', 'g2n5w3', 'j4x8q1', 'p7k2m9'],
        }}
        language="es"
      />,
    );
    expect(rows().map((x) => x[1])).toEqual(['Kubernetes', 'Docker', 'Go', 'Java', 'Python']);
  });

  it('throws when correct_order references an unknown id', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Preview
          payload={{
            ...PREVIEW_PAYLOAD,
            correct_order: ['zzzzzz', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8'],
          }}
          language="es"
        />,
      ),
    ).toThrow('correct_order references unknown opaque_id: zzzzzz');
  });

  it('is read-only and causes no effects', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { rerender } = render(<Preview payload={PREVIEW_PAYLOAD} language="es" />);
    rerender(<Preview payload={PREVIEW_PAYLOAD} language="en" />);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.queryByText('Confirmar orden')).toBeNull();
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
    const [first, ...rest] = PREVIEW_PAYLOAD.items;
    const noPrompt: Record<string, unknown> = { ...PREVIEW_PAYLOAD };
    delete noPrompt.prompt;
    const bad: unknown[] = [
      { ...PREVIEW_PAYLOAD, items: PREVIEW_PAYLOAD.items.slice(0, 4) },
      { ...PREVIEW_PAYLOAD, items: [{ ...first, note: { es: 'x' } }, ...rest] },
      noPrompt,
    ];
    for (const payload of bad) {
      expect(() => render(<Preview payload={payload} language="es" />)).toThrow(ZodError);
    }
  });
});
