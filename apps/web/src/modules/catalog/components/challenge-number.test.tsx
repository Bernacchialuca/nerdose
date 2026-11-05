import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { todayBeforeLaunchFixture } from '@/test/fixtures/today';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

describe('ChallengeNumber', () => {
  it('muestra #número con texto accesible', async () => {
    renderWithProviders({ route: '/' });
    expect(await screen.findByText(`${'#'}128`)).toBeInTheDocument();
    expect(screen.getByText('Desafío del día')).toHaveClass('sr-only');
  });

  it('se oculta con number null', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayBeforeLaunchFixture)));
    renderWithProviders({ route: '/' });
    await screen.findByText('El primer desafío llega pronto');
    await waitFor(() => expect(screen.queryByText(/#\d/)).toBeNull());
  });
});
