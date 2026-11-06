import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { sessionFixture } from '@/test/fixtures/session';
import { todayFixture, todayNoSessionFixture } from '@/test/fixtures/today';
import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

describe('GlobalStreakPill', () => {
  it('en la home es un link a /stats con aria-label plural y color de racha', async () => {
    renderWithProviders({ route: '/' });
    const pill = await screen.findByRole('link', { name: 'Racha global: 5 días' });
    expect(pill).toHaveAttribute('href', '/stats');
    expect(pill).toHaveTextContent('5 días');
    expect(pill).toHaveClass('text-streak', 'min-h-11');
  });

  it('usa el singular con 1 día', async () => {
    server.use(
      http.get('/api/today', () =>
        HttpResponse.json({ ...todayFixture, global_streak: { current: 1, max: 1 } }),
      ),
    );
    renderWithProviders({ route: '/' });
    expect(await screen.findByRole('link', { name: 'Racha global: 1 día' })).toBeInTheDocument();
  });

  it('con racha 0 es gris', async () => {
    server.use(
      http.get('/api/today', () =>
        HttpResponse.json({ ...todayFixture, global_streak: { current: 0, max: 3 } }),
      ),
    );
    renderWithProviders({ route: '/' });
    const pill = await screen.findByRole('link', { name: 'Racha global: 0 días' });
    expect(pill).toHaveClass('text-text-dim');
    expect(pill).not.toHaveClass('text-streak');
  });

  it('con cookies bloqueadas muestra — sin datos', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)));
    renderWithProviders({ route: '/' });
    const pill = await screen.findByRole('link', { name: 'Racha global: sin datos' });
    expect(pill).toHaveTextContent('—');
    expect(pill).toHaveClass('text-text-dim');
  });

  it('se oculta junto con el #número si GET /api/today falla', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json({}, { status: 500 })));
    renderWithProviders({ route: '/' });
    await screen.findByRole('button', { name: 'ES' });
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /Racha global/ })).toBeNull();
    });
    expect(screen.queryByText(/^#\d/)).toBeNull();
  });

  it('no aparece fuera de la home pero sí el #número', async () => {
    renderWithProviders({ route: '/about' });
    expect(await screen.findByText('#128')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Racha global/ })).toBeNull();
  });

  it('en inglés traduce el nombre accesible', async () => {
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
    );
    renderWithProviders({ route: '/' });
    expect(await screen.findByRole('link', { name: 'Global streak: 5 days' })).toBeInTheDocument();
  });
});
