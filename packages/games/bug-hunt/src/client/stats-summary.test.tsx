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

const EXTRA = {
  by_language: { js: { played: 10, correct: 8 }, java: { played: 8, correct: 5 } },
  by_bug_type: {
    off_by_one: { played: 6, correct: 5 },
    comparison: { played: 4, correct: 2 },
    inverted_condition: { played: 8, correct: 6 },
  },
};
const itemWith = (label: string) =>
  screen
    .getAllByRole('listitem')
    .find((li) => li.firstElementChild?.firstElementChild?.textContent === label)?.textContent ??
  '';

describe('Bug Hunt StatsSummary', () => {
  it('shows hits by language and by bug type in Spanish (TS-22)', async () => {
    const { container } = renderSummary(EXTRA);
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 4, name: 'por lenguaje' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'por tipo de bug' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    expect(itemWith('JavaScript')).toContain('8 de 10');
    expect(itemWith('JavaScript')).toContain(`80${NBSP}%`);
    expect(itemWith('Go')).toContain('0 de 0');
    expect(itemWith('Go')).toContain('—');
    expect(itemWith('Java')).toContain('5 de 8');
    expect(itemWith('Java')).toContain(`63${NBSP}%`);
    expect(itemWith('uno de más o de menos')).toContain('5 de 6');
    expect(itemWith('uno de más o de menos')).toContain(`83${NBSP}%`);
    expect(itemWith('condición invertida')).toContain('6 de 8');
    expect(itemWith('condición invertida')).toContain(`75${NBSP}%`);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows English texts and bug type labels (TS-23)', () => {
    renderSummary(EXTRA, 'en');
    expect(screen.getByRole('heading', { level: 4, name: 'by language' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'by bug type' })).toBeInTheDocument();
    expect(itemWith('off by one')).toContain('5 of 6');
    expect(itemWith('off by one')).toContain('83%');
    expect(itemWith('early return')).toContain('0 of 0');
    expect(itemWith('early return')).toContain('—');
    expect(screen.queryByText('uno de más o de menos')).toBeNull();
  });

  it('shows only the empty message without games (TS-24)', () => {
    renderSummary({ by_language: {}, by_bug_type: {} });
    expect(screen.getByText(NONE_ES)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
  });

  it('propagates an invalid extra (TS-27)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderSummary(null)).toThrow(ZodError);
    spy.mockRestore();
  });
});
