import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OPEN_GROUPS, SESSION } from '@/test/fixtures/reports';
import { STOCK_OK } from '@/test/fixtures/content-stock';
import { renderWithProviders } from '@/test/render';
import { adminHandlers, apiError, server } from '@/test/msw';

describe('P-04: teclado (TS-30)', () => {
  it('el foco recorre las regiones de tabla en el orden de la UX', async () => {
    server.use(adminHandlers.contentStock(STOCK_OK), adminHandlers.reports('open', OPEN_GROUPS));
    const { user } = renderWithProviders({ route: '/content', session: SESSION });
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Stock de contenido' });
    await screen.findByRole('heading', { level: 2, name: 'Banco de hechos' });
    await waitFor(() => {
      expect(h1).toHaveFocus();
    });
    // El nav del encabezado queda antes del h1 en el DOM: desde el h1 solo hay regiones.
    for (const name of [
      'Tabla de términos por juego',
      'Tabla de hechos por juego',
      'Tabla de ítems rechazados',
      'Tabla de palabras rechazadas',
    ]) {
      await user.tab();
      expect(screen.getByRole('region', { name })).toHaveFocus();
    }
  });

  it('con error el foco va a «Reintentar» y Enter recarga', async () => {
    server.use(
      adminHandlers.contentStock(apiError('internal_error', 'x'), { status: 500 }),
      adminHandlers.reports('open', OPEN_GROUPS),
    );
    const { user } = renderWithProviders({ route: '/content', session: SESSION });
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Stock de contenido' });
    await screen.findByRole('alert');
    await waitFor(() => {
      expect(h1).toHaveFocus();
    });
    await user.tab();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveFocus();
    server.use(adminHandlers.contentStock(STOCK_OK));
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5);
    });
  });
});
