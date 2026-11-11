import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import i18n from '@/i18n';
import {
  acknowledgeVoidOk,
  GAME_STATS,
  gameTodayNextDay,
  gameTodayNotStarted,
  gameTodayVoided,
  gameTodayVoidedFinished,
  gameTodayVoidedPlay,
} from '@/test/fixtures/game-today';
import { sessionFixture } from '@/test/fixtures/session';
import { countOf, errorResponse, h1, recordCalls } from '@/test/game-route-helpers';
import { gameHandlers, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const VOIDED = 'Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.';
const STREAK_NOTE =
  'Marcarlo suma el día a tu racha de este juego y a la global, sin contar como partida jugada.';
const ACK_PATH = '/api/games/devdle/today/acknowledge-void';

const view = (route = '/devdle') => renderWithProviders({ route });
const notice = () => screen.findByRole('alertdialog', { name: 'Desafío anulado' });
const markButton = () => screen.getByRole('button', { name: /Marcar como completado/ });
const textClose = (root: HTMLElement) =>
  within(root)
    .getAllByRole('button', { name: 'Cerrar' })
    .find((b) => b.textContent === 'Cerrar') as HTMLElement;

afterEach(() => {
  server.events.removeAllListeners();
});

describe('O-02', () => {
  it('TS-27: se abre solo al entrar sin Play y no deja empezar', async () => {
    server.use(gameHandlers.today(gameTodayVoided));
    view();
    const d = await notice();
    expect(within(d).getByText(VOIDED)).toBeInTheDocument();
    expect(within(d).getByText(STREAK_NOTE)).toBeInTheDocument();
    expect(d).toContainElement(document.activeElement as HTMLElement);
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
    expect(await h1('Devdle')).toBeInTheDocument();
  });

  it('TS-28: marcar como completado lleva al resultado anulado', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    server.use(
      gameHandlers.today(gameTodayVoided),
      gameHandlers.acknowledgeVoid(acknowledgeVoidOk),
    );
    view();
    await notice();
    server.use(
      gameHandlers.today({
        ...gameTodayVoidedPlay,
        game_stats: { ...GAME_STATS, current_streak: 4 },
      }),
    );
    await user.click(markButton());
    expect(await h1('Desafío anulado')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(calls.find((c) => c.path === ACK_PATH)?.body).toEqual({ challenge_number: 128 });
    expect(countOf(calls, 'GET', '/api/today?lang=es')).toBeGreaterThanOrEqual(1);
    expect(countOf(calls, 'GET', '/api/games/devdle/today?lang=es')).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Devdle: 4 días')).toBeInTheDocument();
    expect(screen.queryByRole('grid')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Compartir' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Reportar un problema' })).toBeInTheDocument();
  });

  it('TS-29: marcando… bloquea el doble clic y Escape', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      gameHandlers.today(gameTodayVoided),
      http.post(ACK_PATH, async () => {
        await gate;
        return HttpResponse.json(acknowledgeVoidOk);
      }),
    );
    view();
    await notice();
    await user.click(markButton());
    const busy = await screen.findByRole('button', { name: 'Marcando…' });
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    await user.click(busy);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(countOf(calls, 'POST', ACK_PATH)).toBe(1);
    server.use(gameHandlers.today(gameTodayVoidedPlay));
    await act(async () => release());
    expect(await h1('Desafío anulado')).toBeInTheDocument();
  });

  it('TS-30: challenge_expired recarga el desafío de hoy', async () => {
    const user = userEvent.setup();
    server.use(
      gameHandlers.today(gameTodayVoided),
      http.post(ACK_PATH, () => errorResponse('challenge_expired', 'El desafío ya venció.', 409)),
    );
    view();
    await notice();
    server.use(gameHandlers.today(gameTodayNextDay));
    await user.click(markButton());
    expect(
      await screen.findByText(
        'Empezó el desafío #129. La partida de ayer quedó sin terminar y no cuenta para tu racha.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByRole('button', { name: /Empezar/ })).toBeInTheDocument();
  });

  it('TS-31: not_voided cierra y refresca', async () => {
    const user = userEvent.setup();
    server.use(
      gameHandlers.today(gameTodayVoided),
      http.post(ACK_PATH, () => errorResponse('not_voided', 'El desafío no está anulado.', 409)),
    );
    view();
    await notice();
    server.use(gameHandlers.today(gameTodayNotStarted));
    await user.click(markButton());
    expect(await screen.findByRole('button', { name: /Empezar/ })).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('TS-32: red y 5xx muestran la alerta y dejan reintentar', async () => {
    const user = userEvent.setup();
    let n = 0;
    server.use(
      gameHandlers.today(gameTodayVoided),
      http.post(ACK_PATH, () => {
        n += 1;
        if (n === 1) return HttpResponse.error();
        if (n === 2) return errorResponse('internal_error', 'x', 500);
        return HttpResponse.json(acknowledgeVoidOk);
      }),
    );
    view();
    const d = await notice();
    await user.click(markButton());
    expect(await within(d).findByRole('alert')).toHaveTextContent(
      'No pudimos marcar el desafío como completado. Probá de nuevo.',
    );
    expect(markButton()).not.toHaveAttribute('aria-disabled');
    await user.click(markButton());
    await waitFor(() => expect(n).toBe(2));
    expect(await within(d).findByRole('alert')).toBeInTheDocument();
    server.use(gameHandlers.today(gameTodayVoidedPlay));
    await user.click(markButton());
    expect(await h1('Desafío anulado')).toBeInTheDocument();
  });

  it('TS-33: no_session se recupera una vez', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    let n = 0;
    server.use(
      gameHandlers.today(gameTodayVoided),
      http.post(ACK_PATH, () => {
        n += 1;
        return n === 1
          ? errorResponse('no_session', 'x', 401)
          : HttpResponse.json(acknowledgeVoidOk);
      }),
      http.post('/api/session', () => HttpResponse.json(sessionFixture)),
    );
    view();
    await notice();
    const before = calls.length;
    server.use(gameHandlers.today(gameTodayVoidedPlay));
    await user.click(markButton());
    expect(await h1('Desafío anulado')).toBeInTheDocument();
    const posts = calls
      .slice(before)
      .filter((c) => c.method === 'POST')
      .map((c) => c.path);
    expect(posts).toEqual([ACK_PATH, '/api/session', ACK_PATH]);
  });

  it('TS-34: cerrar deja el aviso con la acción enfocada y permite reabrir', async () => {
    const user = userEvent.setup();
    server.use(gameHandlers.today(gameTodayVoided));
    view();
    const d = await notice();
    await user.click(textClose(d));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    const reopen = screen.getByRole('button', { name: 'Ver aviso de anulación' });
    await waitFor(() => expect(reopen).toHaveFocus());
    expect(screen.getByText(VOIDED)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver a los juegos/ })).toBeInTheDocument();
    await user.click(reopen);
    expect(await notice()).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('TS-35: con Play previa va directo al resultado anulado, sin O-02', async () => {
    const calls = recordCalls();
    for (const fixture of [gameTodayVoidedPlay, gameTodayVoidedFinished]) {
      server.use(gameHandlers.today(fixture));
      const a = view();
      expect(await h1('Desafío anulado')).toBeInTheDocument();
      expect(screen.queryByRole('alertdialog')).toBeNull();
      a.unmount();
    }
    expect(countOf(calls, 'POST', ACK_PATH)).toBe(0);
  });

  it('TS-36: challenge_voided al empezar abre O-02', async () => {
    const user = userEvent.setup();
    server.use(
      gameHandlers.today(gameTodayNotStarted),
      http.post('/api/games/devdle/today/start', () =>
        errorResponse('challenge_voided', 'anulado', 409),
      ),
    );
    view();
    const start = await screen.findByRole('button', { name: /Empezar/ });
    server.use(gameHandlers.today(gameTodayVoided));
    await user.click(start);
    expect(await notice()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Empezar/ })).toBeNull();
  });
});

describe('O-02 · accesibilidad e inglés', () => {
  it('TS-37: axe sin violaciones, también con la alerta', async () => {
    const user = userEvent.setup();
    server.use(
      gameHandlers.today(gameTodayVoided),
      http.post(ACK_PATH, () => errorResponse('internal_error', 'x', 500)),
    );
    const { container } = view();
    const d = await notice();
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(d).toHaveAttribute('aria-labelledby');
    expect(await axe(container)).toHaveNoViolations();
    await user.click(markButton());
    await within(d).findByRole('alert');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('TS-43: textos en inglés', async () => {
    await i18n.changeLanguage('en');
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
      http.get('/api/games/devdle/today', () => HttpResponse.json(gameTodayVoided)),
    );
    view();
    const d = await screen.findByRole('alertdialog', { name: 'Challenge voided' });
    expect(within(d).getByRole('button', { name: /Mark as completed/ })).toBeInTheDocument();
  });
});

describe('O-02 · modal descrito por su texto (S-034/ui)', () => {
  it('TS-18: sigue modal, se describe por el texto y el fondo queda inerte', async () => {
    server.use(gameHandlers.today({ ...gameTodayVoided, reported: false }));
    view();
    const d = await notice();
    expect(d).toHaveClass('rounded-panel');
    expect(d).not.toHaveClass('rounded-t-panel');
    expect(d).toHaveAccessibleDescription(VOIDED);
    expect((await h1('Devdle')).closest('[inert]')).not.toBeNull();
  });

  it('TS-19: descripción en inglés', async () => {
    await i18n.changeLanguage('en');
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
      http.get('/api/games/devdle/today', () => HttpResponse.json(gameTodayVoided)),
    );
    view();
    const d = await screen.findByRole('alertdialog', { name: 'Challenge voided' });
    expect(d).toHaveAccessibleDescription(
      'This challenge had an error and was voided. Your streak is not affected.',
    );
  });
});
