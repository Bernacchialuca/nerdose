import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { createErrorHandler } from '@/http/middleware/error-handler';
import { clientIp, limit } from '@/http/middleware/rate-limit';
import type { AppEnv } from '@/http/types';

import { captureLogger } from '../helpers/logger';

describe('clientIp', () => {
  const ctx = (headers: Record<string, string>) =>
    ({ req: { header: (n: string) => headers[n] } }) as never;

  it('toma la primera IP del header configurado', () => {
    expect(clientIp('x-forwarded-for')(ctx({ 'x-forwarded-for': '1.1.1.1' }))).toBe('1.1.1.1');
    expect(clientIp('x-forwarded-for')(ctx({ 'x-forwarded-for': 'a, b' }))).toBe('a');
  });

  it('devuelve unknown sin header configurado o ausente', () => {
    expect(clientIp()(ctx({ 'x-forwarded-for': '1.1.1.1' }))).toBe('unknown');
    expect(clientIp('x-forwarded-for')(ctx({}))).toBe('unknown');
    expect(clientIp('x-forwarded-for')(ctx({ 'x-forwarded-for': '' }))).toBe('unknown');
  });
});

describe('limit', () => {
  it('responde 429 rate_limited con Retry-After', async () => {
    const app = new Hono<AppEnv>();
    app.onError(createErrorHandler(captureLogger().logger));
    app.get('/x', limit({ windowMs: 120_000, limit: 2, key: () => 'k' }), (c) => c.text('ok'));
    expect((await app.request('/x')).status).toBe(200);
    expect((await app.request('/x')).status).toBe(200);
    const res = await app.request('/x');
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('120');
    expect(await res.json()).toEqual({
      error: { code: 'rate_limited', message: 'Demasiadas solicitudes.' },
    });
  });
});
