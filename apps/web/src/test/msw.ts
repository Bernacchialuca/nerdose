import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import type { Locale } from '@nerdose/core';

import type { GameId } from '@nerdose/core';

import { bigONotStarted } from './fixtures/big-o-today';
import { bugHuntNotStarted } from './fixtures/bug-hunt-today';
import { gameTodayNotStarted } from './fixtures/game-today';
import { grepGridNotStarted } from './fixtures/grep-grid-today';
import { sessionFixture } from './fixtures/session';
import { timelineNotStarted } from './fixtures/timeline-today';
import { todayFixture } from './fixtures/today';

export const defaultHandlers = [
  http.post('/api/session', () => HttpResponse.json(sessionFixture)),
  http.get('/api/today', () => HttpResponse.json(todayFixture)),
  http.get('/api/games/big-o/today', () => HttpResponse.json(bigONotStarted)),
  http.get('/api/games/bug-hunt/today', () => HttpResponse.json(bugHuntNotStarted)),
  http.get('/api/games/devdle/today', () => HttpResponse.json(gameTodayNotStarted)),
  http.get('/api/games/grep-grid/today', () => HttpResponse.json(grepGridNotStarted)),
  http.get('/api/games/timeline/today', () => HttpResponse.json(timelineNotStarted)),
  http.patch('/api/me/preferences', async ({ request }) =>
    HttpResponse.json({
      locale: ((await request.json()) as { locale: Locale }).locale,
      preferred_code_language: 'js',
    }),
  ),
];

/** Helpers para armar respuestas de la `api` de juego en los tests. */
export const gameHandlersFor = (gameId: GameId) => ({
  today: (body: unknown, init?: ResponseInit) =>
    http.get(`/api/games/${gameId}/today`, () => HttpResponse.json(body as object, init)),
  start: (body: unknown, init?: ResponseInit) =>
    http.post(`/api/games/${gameId}/today/start`, () => HttpResponse.json(body as object, init)),
  move: (body: unknown, init?: ResponseInit) =>
    http.post(`/api/games/${gameId}/today/move`, () => HttpResponse.json(body as object, init)),
  report: (body: unknown, init?: ResponseInit) =>
    http.post(`/api/games/${gameId}/today/report`, () => HttpResponse.json(body as object, init)),
  acknowledgeVoid: (body: unknown, init?: ResponseInit) =>
    http.post(`/api/games/${gameId}/today/acknowledge-void`, () =>
      HttpResponse.json(body as object, init),
    ),
});

export const gameHandlers = gameHandlersFor('devdle');
export const grepGridHandlers = gameHandlersFor('grep-grid');
export const timelineHandlers = gameHandlersFor('timeline');
export const bigOHandlers = gameHandlersFor('big-o');
export const bugHuntHandlers = gameHandlersFor('bug-hunt');

export const apiError = (code: string, message: string) => ({ error: { code, message } });

// Última instancia: ningún request de un test sale a la red. jsdom usa la URL del dev server
// (localhost:5173); sin esto, un request sin handler (o con un handler que devuelve undefined)
// llega al `pnpm dev` real si está corriendo y su respuesta (p. ej. un 401) cambia el resultado
// del test. Se responde como si no hubiera servidor: error de red, igual que sin `pnpm dev`.
const noNetwork = http.all('/api/*', () => HttpResponse.error());

export const server = setupServer(...defaultHandlers, noNetwork);
