import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import i18n from '@/i18n';
import { todayFirstVisitFixture, todayFixture } from '@/test/fixtures/today';

import type { Today } from '../api/today';
import { deriveHomeView } from '../home-view';
import type { SessionStatus } from '@/modules/session';
import { ProgressPanel } from './progress-panel';

function renderPanel(today: Today = todayFixture, sessionStatus: SessionStatus = 'active') {
  const view = deriveHomeView({ today, isPending: false, isError: false, sessionStatus });
  if (view.kind !== 'ready') throw new Error('not ready');
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ProgressPanel view={view} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('ProgressPanel', () => {
  it('TS-32: racha, récord y link a estadísticas', async () => {
    const { container } = renderPanel();
    const panel = within(screen.getByRole('region', { name: 'Tu progreso' }));
    expect(panel.getByText('5')).toHaveClass('text-display-streak-compact', 'text-streak');
    expect(panel.getByText('12')).toBeInTheDocument();
    expect(panel.getByText('récord de racha')).toBeInTheDocument();
    expect(panel.getByRole('link', { name: /ver estadísticas/ })).toHaveAttribute('href', '/stats');
    expect(panel.queryByText(/Todavía no hay datos/)).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('TS-33: sin sesión muestra guiones y el aviso', () => {
    renderPanel(todayFirstVisitFixture, 'cookies_blocked');
    const panel = within(screen.getByRole('region', { name: 'Tu progreso' }));
    expect(panel.getAllByText('—')).toHaveLength(2);
    expect(panel.getByText('sin datos')).toBeInTheDocument();
    expect(panel.getByText(/Activá las cookies y recargá/)).toBeInTheDocument();
  });
});
