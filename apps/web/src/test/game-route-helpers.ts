import { screen } from '@testing-library/react';
import { HttpResponse } from 'msw';

import { apiError, server } from './msw';

export type Call = { method: string; path: string; body?: unknown };

/** Registra cada request de la `api` (con body JSON) en el orden en que salen. */
export function recordCalls(): Call[] {
  const calls: Call[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    const call: Call = { method: request.method, path: url.pathname + url.search };
    calls.push(call);
    if (request.method === 'POST' || request.method === 'PATCH') {
      void request
        .clone()
        .json()
        .then((body: unknown) => {
          call.body = body;
        })
        .catch(() => undefined);
    }
  });
  return calls;
}

export const countOf = (calls: Call[], method: string, path: string) =>
  calls.filter((c) => c.method === method && c.path === path).length;

export const errorResponse = (
  code: string,
  message: string,
  status: number,
  headers?: HeadersInit,
) => HttpResponse.json(apiError(code, message), { status, headers });

export const settle = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

export const h1 = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });

export function setShare(value: unknown) {
  Object.defineProperty(navigator, 'share', { value, configurable: true, writable: true });
}
