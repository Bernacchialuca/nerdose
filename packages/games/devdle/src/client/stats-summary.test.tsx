// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { StatsSummary } from './stats-summary';
import { makeT } from './test-utils';
import type { StatsSummaryProps } from './types';

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

const EXTRA = { guesses: { '1': 1, '2': 3, '3': 5, '4': 4, '5': 2, '6': 1 }, losses: 5 };
const EMPTY = { guesses: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 }, losses: 0 };

describe('Devdle StatsSummary', () => {
  it('shows the attempts distribution with the number on each bar (TS-2)', async () => {
    const { container } = renderSummary(EXTRA);
    expect(screen.getByRole('heading', { level: 4, name: 'intentos' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByText('1: 1 partidas')).toBeInTheDocument();
    expect(screen.getByText('3: 5 partidas')).toBeInTheDocument();
    expect(screen.getByText('X: 5 partidas')).toBeInTheDocument();
    expect(screen.queryByText(/hoy/)).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows English texts when the locale is en (TS-3)', () => {
    renderSummary(EXTRA, 'en');
    expect(screen.getByRole('heading', { level: 4, name: 'tries' })).toBeInTheDocument();
    expect(screen.getByText('X: 5 games')).toBeInTheDocument();
    expect(screen.queryByText(/partidas/)).toBeNull();
  });

  it('shows only the empty message without games (TS-4)', () => {
    renderSummary(EMPTY);
    expect(screen.getByText(NONE_ES)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
    expect(screen.queryAllByRole('listitem')).toEqual([]);
  });

  it('propagates an invalid extra (TS-27)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderSummary(null)).toThrow(ZodError);
    spy.mockRestore();
  });
});
