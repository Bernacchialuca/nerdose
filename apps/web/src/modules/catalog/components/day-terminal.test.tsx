import { render, screen, within } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import i18n from '@/i18n';
import type { Today } from '../api/today';
import { todayFixture, todayNoChallengesFixture } from '@/test/fixtures/today';

import { deriveHomeView } from '../home-view';
import { DayTerminal } from './day-terminal';

function viewOf(today: Parameters<typeof deriveHomeView>[0]['today']) {
  const view = deriveHomeView({
    today,
    isPending: false,
    isError: false,
    sessionStatus: 'active',
  });
  if (view.kind !== 'ready') throw new Error('not ready');
  return view;
}

function renderTerminal(today: Today = todayFixture) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <DayTerminal view={viewOf(today)} syncedAt={Date.now()} />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('DayTerminal', () => {
  it('TS-11: filas, racha y cuenta regresiva', async () => {
    const { container } = renderTerminal();
    const term = within(screen.getByRole('region', { name: 'Progreso de hoy' }));
    expect(term.getByText('$ nerdose status')).toBeInTheDocument();
    expect(term.getAllByRole('listitem')).toHaveLength(5);
    expect(term.getByText('5 días · récord 12')).toHaveClass('text-streak');
    expect(term.getByText('11:23:20')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('TS-12: sin desafíos, racha en gris', () => {
    renderTerminal(todayNoChallengesFixture);
    const term = within(screen.getByRole('region', { name: 'Progreso de hoy' }));
    expect(term.getAllByText('sin desafío')).toHaveLength(5);
    expect(term.getByText('0 días · récord 0')).toHaveClass('text-text-dim');
  });
});
