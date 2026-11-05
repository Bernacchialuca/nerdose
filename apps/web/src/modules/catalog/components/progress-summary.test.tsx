import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import i18n from '@/i18n';

import { ProgressSummary } from './progress-summary';

const renderSummary = (summary: Parameters<typeof ProgressSummary>[0]['summary']) =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <ProgressSummary summary={summary} streaks={{ current: 5, max: 12 }} />
      </MemoryRouter>
    </I18nextProvider>,
  );

describe('ProgressSummary', () => {
  it('rachas', async () => {
    const { container } = renderSummary('streaks');
    expect(screen.getByRole('heading', { level: 2, name: 'Tu progreso' })).toBeInTheDocument();
    expect(screen.getByText('Racha global 5 · Récord 12')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ver estadísticas' })).toHaveAttribute(
      'href',
      '/stats',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ['empty', 'Todavía no hay datos. Completá un desafío y acá vas a ver tu racha y tu heatmap.'],
    ['noSession', 'Sin sesión no hay progreso para mostrar. Activá las cookies y recargá.'],
    ['unavailable', 'Sin sesión no hay progreso para mostrar. Recargá en unos minutos.'],
  ] as const)('%s', (key, text) => {
    renderSummary(key);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
