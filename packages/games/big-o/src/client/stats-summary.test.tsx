// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { StatsSummary } from './stats-summary';
import { makeT } from './test-utils';
import type { StatsSummaryProps } from './types';

const NBSP = '\u00a0';

const renderSummary = (extra: unknown, locale: 'es' | 'en' = 'es') => {
  const props: StatsSummaryProps = { extra, locale, t: makeT(locale) };
  return render(
    <article>
      <h3>Juego</h3>
      <StatsSummary {...props} />
    </article>,
  );
};

const ITEM_TEXT = (i: number) => (screen.getAllByRole('listitem')[i] as HTMLElement).textContent;

const EXTRA = {
  by_category: { simple_loops: { played: 10, correct: 9 }, recursion: { played: 4, correct: 1 } },
};

describe('Big O StatsSummary', () => {
  it('shows hits per recipe category in Spanish (TS-18)', async () => {
    const { container } = renderSummary(EXTRA);
    expect(
      screen.getByRole('heading', { level: 4, name: 'aciertos por categoría de receta' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(ITEM_TEXT(0)).toContain('bucles simples');
    expect(ITEM_TEXT(0)).toContain('9 de 10');
    expect(ITEM_TEXT(0)).toContain(`90${NBSP}%`);
    expect(ITEM_TEXT(1)).toContain('bucles anidados');
    expect(ITEM_TEXT(1)).toContain('0 de 0');
    expect(ITEM_TEXT(1)).toContain('—');
    expect(ITEM_TEXT(2)).toContain('recursión');
    expect(ITEM_TEXT(2)).toContain('1 de 4');
    expect(ITEM_TEXT(2)).toContain(`25${NBSP}%`);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows English texts (TS-19)', () => {
    renderSummary(EXTRA, 'en');
    expect(
      screen.getByRole('heading', { level: 4, name: 'correct by recipe category' }),
    ).toBeInTheDocument();
    expect(ITEM_TEXT(0)).toContain('simple loops');
    expect(ITEM_TEXT(0)).toContain('9 of 10');
    expect(ITEM_TEXT(0)).toContain('90%');
    expect(ITEM_TEXT(3)).toContain('divide and conquer');
  });

  it('shows only the empty message without games (TS-20)', () => {
    renderSummary({ by_category: {} }, 'en');
    expect(screen.getByText("You haven't played this game yet.")).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
  });

  it('propagates an invalid extra (TS-27)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderSummary(null)).toThrow(ZodError);
    spy.mockRestore();
  });
});
