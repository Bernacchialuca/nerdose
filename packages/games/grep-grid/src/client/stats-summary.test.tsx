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
  words_found: { '0': 0, '1': 0, '2': 0, '3': 1, '4': 1, '5': 2, '6': 1, '7': 2, '8': 5 },
};
const EMPTY = {
  words_found: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 },
};

describe('Grep Grid StatsSummary', () => {
  it('shows the average and the 8/8 rate in Spanish (TS-7)', async () => {
    const { container } = renderSummary(EXTRA);
    expect(screen.getByRole('heading', { level: 4, name: 'palabras' })).toBeInTheDocument();
    expect(screen.getByText('promedio 6,4 de 8')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.textContent === `8/8 en el 42${NBSP}% de las partidas`),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the average and the 8/8 rate in English (TS-8)', () => {
    renderSummary(EXTRA, 'en');
    expect(screen.getByRole('heading', { level: 4, name: 'words' })).toBeInTheDocument();
    expect(screen.getByText('average 6.4 of 8')).toBeInTheDocument();
    expect(screen.getByText('8/8 in 42% of games')).toBeInTheDocument();
  });

  it('shows only the empty message without games (TS-9)', () => {
    renderSummary(EMPTY);
    expect(screen.getByText(NONE_ES)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
  });

  it('propagates an invalid extra (TS-27)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderSummary(null)).toThrow(ZodError);
    spy.mockRestore();
  });
});
