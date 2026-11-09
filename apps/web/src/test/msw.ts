import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import type { Locale } from '@nerdose/core';

import { gameTodayNotStarted } from './fixtures/game-today';
import { sessionFixture } from './fixtures/session';
import { todayFixture } from './fixtures/today';

export const defaultHandlers = [
  http.post('/api/session', () => HttpResponse.json(sessionFixture)),
  http.get('/api/today', () => HttpResponse.json(todayFixture)),
  http.get('/api/games/devdle/today', () => HttpResponse.json(gameTodayNotStarted)),
  http.patch('/api/me/preferences', async ({ request }) =>
    HttpResponse.json({
      locale: ((await request.json()) as { locale: Locale }).locale,
      preferred_code_language: 'js',
    }),
  ),
];

/** Helpers para armar respuestas de la `api` de juego en los tests. */
export const gameHandlers = {
  today: (body: unknown, init?: ResponseInit) =>
    http.get('/api/games/devdle/today', () => HttpResponse.json(body as object, init)),
  start: (body: unknown, init?: ResponseInit) =>
    http.post('/api/games/devdle/today/start', () => HttpResponse.json(body as object, init)),
  move: (body: unknown, init?: ResponseInit) =>
    http.post('/api/games/devdle/today/move', () => HttpResponse.json(body as object, init)),
};

export const apiError = (code: string, message: string) => ({ error: { code, message } });

export const server = setupServer(...defaultHandlers);
