// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { StatsSummary } from './stats-summary';
import { makeT } from './test-utils';
import type { StatsSummaryProps } from './types';

const NBSP = '\u00a0';
const NONE_ES = 'Todavía no jugaste a este juego.';

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
  by_category: {
    programming_languages: { played: 5, correct: 4 },
    companies: { played: 5, correct: 2 },
    hardware: { played: 5, correct: 4 },
  },
};

describe('Timeline StatsSummary', () => {
  it('shows accuracy per category and the best one in Spanish (TS-14)', async () => {
    const { container } = renderSummary(EXTRA);
    expect(
      screen.getByRole('heading', { level: 4, name: 'acierto por categoría' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(ITEM_TEXT(0)).toContain('lenguajes de programación');
    expect(ITEM_TEXT(0)).toContain(`80${NBSP}%`);
    expect(ITEM_TEXT(1)).toContain('frameworks');
    expect(ITEM_TEXT(1)).toContain('—');
    expect(screen.getByText('mejor categoría: lenguajes de programación')).toBeInTheDocument();
    const bars = container.querySelectorAll('li > [aria-hidden="true"]');
    expect(bars).toHaveLength(8);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows English texts (TS-15)', () => {
    renderSummary(EXTRA, 'en');
    expect(
      screen.getByRole('heading', { level: 4, name: 'accuracy by category' }),
    ).toBeInTheDocument();
    expect(ITEM_TEXT(0)).toContain('programming languages');
    expect(ITEM_TEXT(0)).toContain('80%');
    expect(screen.getByText('best category: programming languages')).toBeInTheDocument();
  });

  it('shows only the empty message without milestones (TS-16)', () => {
    renderSummary({ by_category: {} });
    expect(screen.getByText(NONE_ES)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
    expect(screen.queryByText(/mejor categoría/)).toBeNull();
  });

  it('propagates an invalid extra (TS-27)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderSummary(null)).toThrow(ZodError);
    spy.mockRestore();
  });
});
