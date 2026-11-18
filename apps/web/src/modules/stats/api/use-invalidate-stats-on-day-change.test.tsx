import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { myStatsPage1 } from '@/test/fixtures/my-stats';
import { todayNextDayFixture, todayNoChallengesFixture } from '@/test/fixtures/today';
import { settle } from '@/test/game-route-helpers';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const seed = (queryClient: ReturnType<typeof renderWithProviders>['queryClient']) =>
  queryClient.setQueryData(['me', 'stats', 'es'], { pages: [myStatsPage1], pageParams: [null] });
const isInvalidated = (queryClient: ReturnType<typeof renderWithProviders>['queryClient']) =>
  queryClient.getQueryState(['me', 'stats', 'es'])?.isInvalidated;

describe('useInvalidateStatsOnDayChange', () => {
  it('TS-8: invalida las stats cuando cambia la fecha de today', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayNoChallengesFixture)));
    const { queryClient } = renderWithProviders({ route: '/about' });
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => expect(queryClient.getQueryData(['today', 'es'])).toBeDefined());
    seed(queryClient);
    server.use(http.get('/api/today', () => HttpResponse.json(todayNextDayFixture)));
    await queryClient.invalidateQueries({ queryKey: ['today'] });
    await waitFor(() => expect(isInvalidated(queryClient)).toBe(true));
  });

  it('TS-9: el mismo día no invalida', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayNoChallengesFixture)));
    const { queryClient } = renderWithProviders({ route: '/about' });
    await screen.findByRole('heading', { level: 1 });
    await waitFor(() => expect(queryClient.getQueryData(['today', 'es'])).toBeDefined());
    seed(queryClient);
    await queryClient.invalidateQueries({ queryKey: ['today'] });
    await settle();
    expect(isInvalidated(queryClient)).toBe(false);
  });
});
