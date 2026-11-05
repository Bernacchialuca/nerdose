import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import type { Locale } from '@nerdose/core';

import { sessionFixture } from './fixtures/session';
import { todayFixture } from './fixtures/today';

export const defaultHandlers = [
  http.post('/api/session', () => HttpResponse.json(sessionFixture)),
  http.get('/api/today', () => HttpResponse.json(todayFixture)),
  http.patch('/api/me/preferences', async ({ request }) =>
    HttpResponse.json({
      locale: ((await request.json()) as { locale: Locale }).locale,
      preferred_code_language: 'js',
    }),
  ),
];

export const server = setupServer(...defaultHandlers);
