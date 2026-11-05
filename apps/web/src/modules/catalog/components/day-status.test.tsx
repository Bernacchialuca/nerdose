import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import i18n from '@/i18n';
import { todayFixture, todayNoChallengesFixture } from '@/test/fixtures/today';
import type { Today } from '@/modules/catalog/api/today';
import type { SessionStatus } from '@/modules/session';

import { deriveHomeView } from '../home-view';
import { DayStatus } from './day-status';

function renderDay(today: Today, sessionStatus: SessionStatus = 'active') {
  const view = deriveHomeView({ today, isPending: false, isError: false, sessionStatus });
  if (view.kind !== 'ready') throw new Error('not ready');
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <DayStatus view={view} syncedAt={Date.now()} />
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('DayStatus', () => {
  it('estado mixto: progreso, racha y cuenta regresiva', async () => {
    const { container } = renderDay(todayFixture);
    expect(screen.getByText('1 de 4 con desafío completados')).toBeInTheDocument();
    expect(screen.getByText('Racha global: 5 días')).toBeInTheDocument();
    expect(screen.getByText(/Próximo desafío en 11:23:/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('sin desafíos y plural', () => {
    renderDay({ ...todayNoChallengesFixture, global_streak: { current: 1, max: 1 } });
    expect(screen.getByText('Hoy no hay desafíos publicados')).toBeInTheDocument();
    expect(screen.getByText('Racha global: 1 día')).toBeInTheDocument();
  });

  it('sesión no disponible o cookies bloqueadas: racha desconocida', () => {
    renderDay(todayFixture, 'cookies_blocked');
    expect(screen.getByText('Sin sesión: no podemos mostrar tu progreso')).toBeInTheDocument();
    expect(screen.getByText('Racha global: —')).toBeInTheDocument();
  });

  it('la cuenta regresiva no es live region y la barra es decorativa', () => {
    const { container } = renderDay(todayFixture);
    const countdown = screen.getByText(/Próximo desafío en/);
    expect(countdown).not.toHaveAttribute('aria-live');
    expect(countdown).not.toHaveAttribute('role');
    const bar = container.querySelector('[aria-hidden="true"]');
    expect(bar).toHaveClass('w-full');
  });
});
