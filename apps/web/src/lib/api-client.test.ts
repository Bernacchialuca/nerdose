import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { api, ApiError, configureApi } from './api-client';

type Health = { status: 'ok' | 'degraded'; db: 'ok' | 'error' };

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  configureApi({});
});
afterAll(() => server.close());

describe('api()', () => {
  it('devuelve el JSON intacto con Accept y sin Content-Type', async () => {
    let headers: Headers | undefined;
    server.use(
      http.get('/api/health', ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({ status: 'ok', db: 'ok' });
      }),
    );
    await expect(api<Health>('/api/health')).resolves.toEqual({ status: 'ok', db: 'ok' });
    expect(headers?.get('accept')).toBe('application/json');
    expect(headers?.has('content-type')).toBe(false);
  });

  it('envía body JSON con claves snake_case intactas', async () => {
    server.use(
      http.post('/api/echo', async ({ request }) =>
        HttpResponse.json({
          received: await request.json(),
          content_type: request.headers.get('content-type'),
        }),
      ),
    );
    await expect(
      api('/api/echo', { method: 'POST', json: { challenge_number: 12 } }),
    ).resolves.toEqual({
      received: { challenge_number: 12 },
      content_type: 'application/json',
    });
  });

  it('rechaza con ApiError tipado', async () => {
    server.use(
      http.get('/api/health', () =>
        HttpResponse.json(
          { error: { code: 'not_found', message: 'Recurso inexistente' } },
          { status: 404 },
        ),
      ),
    );
    const err = await api('/api/health').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 404,
      code: 'not_found',
      message: 'Recurso inexistente',
      retryAfter: undefined,
    });
  });

  it('maneja errores no JSON (proxy con la api caída)', async () => {
    server.use(
      http.get(
        '/api/health',
        () => new HttpResponse('Bad Gateway', { status: 502, statusText: 'Bad Gateway' }),
      ),
    );
    const err = await api('/api/health').catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 502, code: 'internal_error', message: 'Bad Gateway' });
  });

  it('lee Retry-After', async () => {
    server.use(
      http.get('/api/health', () =>
        HttpResponse.json(
          { error: { code: 'rate_limited', message: 'Demasiadas solicitudes' } },
          { status: 429, headers: { 'Retry-After': '30' } },
        ),
      ),
    );
    const err = await api('/api/health').catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 429, code: 'rate_limited', retryAfter: 30 });
  });

  it('configureApi aplica getHeaders y onError', async () => {
    let xTest: string | null = null;
    server.use(
      http.get('/api/health', ({ request }) => {
        xTest = request.headers.get('x-test');
        return HttpResponse.json(
          { error: { code: 'internal_error', message: 'Error interno' } },
          { status: 500 },
        );
      }),
    );
    const onError = vi.fn();
    configureApi({ getHeaders: () => ({ 'X-Test': '1' }), onError });
    const err = await api('/api/health').catch((e: unknown) => e);
    expect(xTest).toBe('1');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(err);
    expect(err).toMatchObject({ code: 'internal_error' });
  });
});
