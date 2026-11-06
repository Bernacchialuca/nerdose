import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';
import { sessionFixture } from '@/test/fixtures/session';

const view = () => renderWithProviders({ route: '/' });

describe('LanguageSelector', () => {
  it('TS-8 está deshabilitado mientras carga la sesión', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    server.use(
      http.post('/api/session', async () => {
        await gate;
        return HttpResponse.json(sessionFixture);
      }),
    );
    view();
    const group = await screen.findByRole('group', { name: 'Idioma' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ES' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'EN' })).toBeDisabled();
    release();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'EN' })).toBeEnabled();
    });
  });

  it('TS-6/TS-43 cambia a EN con teclado, persiste y no recarga', async () => {
    const patches: unknown[] = [];
    server.use(
      http.patch('/api/me/preferences', async ({ request }) => {
        const body = (await request.json()) as { locale: string };
        patches.push({ body, ct: request.headers.get('content-type') });
        return HttpResponse.json({ locale: body.locale, preferred_code_language: 'js' });
      }),
    );
    view();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'EN' })).toBeEnabled();
    });
    const en = screen.getByRole('button', { name: 'EN' });
    expect(en).toHaveAttribute('type', 'button');
    for (let i = 0; i < 20 && document.activeElement !== en; i += 1) await userEvent.tab();
    expect(en).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    });
    expect(patches).toEqual([{ body: { locale: 'en' }, ct: 'application/json' }]);
    expect(document.documentElement.lang).toBe('en');
    expect(await screen.findByText(/one platform, many challenges/)).toBeInTheDocument();
  });

  it('TS-9 click en el idioma activo no hace nada', async () => {
    let patches = 0;
    server.use(
      http.patch('/api/me/preferences', () => {
        patches += 1;
        return HttpResponse.json({ locale: 'es', preferred_code_language: 'js' });
      }),
    );
    view();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'ES' })).toBeEnabled();
    });
    await userEvent.click(screen.getByRole('button', { name: 'ES' }));
    expect(patches).toBe(0);
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'true');
  });
});
