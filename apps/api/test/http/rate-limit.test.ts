import { Hono } from 'hono';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createErrorHandler } from '@/http/middleware/error-handler';
import { clientIp, limit } from '@/http/middleware/rate-limit';
import type { AppEnv } from '@/http/types';

import { MUTATION_HEADERS, buildTestApp } from '../helpers/app';
import { useDatabases } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

describe('clientIp', () => {
  const ctx = (headers: Record<string, string>, remoteAddress?: string) =>
    ({
      req: { header: (n: string) => headers[n] },
      env: remoteAddress ? { incoming: { socket: { remoteAddress } } } : undefined,
    }) as never;
  const XFF = { TRUST_PROXY_HEADER: 'x-forwarded-for' };

  it('con X-Forwarded-For toma la entrada que agregó el proxy, desde la derecha', () => {
    expect(clientIp(XFF)(ctx({ 'x-forwarded-for': '1.1.1.1' }))).toBe('1.1.1.1');
    expect(clientIp(XFF)(ctx({ 'x-forwarded-for': 'a, b' }))).toBe('b');
    expect(clientIp({ ...XFF, TRUST_PROXY_HOPS: 2 })(ctx({ 'x-forwarded-for': 'a, b, c' }))).toBe(
      'b',
    );
  });

  it('una IP inventada por el cliente a la izquierda no cambia la clave', () => {
    const key = clientIp(XFF);
    const real = '203.0.113.7';
    const keys = ['1.2.3.4', '5.6.7.8', 'lo-que-sea'].map((fake) =>
      key(ctx({ 'x-forwarded-for': `${fake}, ${real}` })),
    );
    expect(new Set(keys)).toEqual(new Set([real]));
  });

  it('con más hops que entradas usa la primera', () => {
    expect(clientIp({ ...XFF, TRUST_PROXY_HOPS: 3 })(ctx({ 'x-forwarded-for': 'a' }))).toBe('a');
  });

  it('otro header de confianza se toma entero', () => {
    const key = clientIp({ TRUST_PROXY_HEADER: 'x-real-ip' });
    expect(key(ctx({ 'x-real-ip': ' 198.51.100.4 ' }))).toBe('198.51.100.4');
  });

  it('sin header configurado o ausente usa la IP de la conexión', () => {
    expect(clientIp({})(ctx({ 'x-forwarded-for': '1.1.1.1' }, '10.0.0.9'))).toBe('10.0.0.9');
    expect(clientIp(XFF)(ctx({}, '10.0.0.9'))).toBe('10.0.0.9');
    expect(clientIp(XFF)(ctx({ 'x-forwarded-for': '' }, '10.0.0.9'))).toBe('10.0.0.9');
  });

  it('sin socket (app.request) cae a unknown', () => {
    expect(clientIp({})(ctx({}))).toBe('unknown');
    expect(clientIp(XFF)(ctx({}))).toBe('unknown');
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

describe('limiter global de GET /api/*', () => {
  const dbs = useDatabases();
  beforeAll(() => dbs.reset());
  afterAll(() => dbs.close());
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  const exhaust = async (app: ReturnType<typeof buildTestApp>['app'], ip: string) => {
    for (let i = 0; i < 600; i++) {
      const res = await app.request('/api/today', { headers: { 'x-forwarded-for': ip } });
      if (res.status !== 200) throw new Error(`request ${i} -> ${res.status}`);
    }
  };
  const msg = (res: Response) => res.json().then((b) => b.error.message);

  it('TS-10 y TS-11 limita a 600 por IP y es por IP', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    await exhaust(app, '203.0.113.30');
    const res = await app.request('/api/today', { headers: { 'x-forwarded-for': '203.0.113.30' } });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('60');
    expect(await res.json()).toEqual({
      error: { code: 'rate_limited', message: 'Demasiadas solicitudes.' },
    });
    const other = await app.request('/api/today', {
      headers: { 'x-forwarded-for': '203.0.113.31' },
    });
    expect(other.status).toBe(200);
  });

  it('TS-12 el balde se comparte con otros GET /api/*', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    await exhaust(app, '203.0.113.40');
    const res = await app.request('/api/health', {
      headers: { 'x-forwarded-for': '203.0.113.40' },
    });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('60');
  });

  it('TS-13 /api/admin no consume el balde de GET', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    await exhaust(app, '203.0.113.50');
    const res = await app.request('/api/admin/health', {
      headers: { 'x-forwarded-for': '203.0.113.50' },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('TS-14 429 en inglés por Accept-Language', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    await exhaust(app, '203.0.113.60');
    const res = await app.request('/api/today', {
      headers: { 'x-forwarded-for': '203.0.113.60', 'Accept-Language': 'en-US,en;q=0.9' },
    });
    expect(res.status).toBe(429);
    expect(await msg(res)).toBe('Too many requests.');
  });

  it('TS-15 429 en inglés por ?lang', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    await exhaust(app, '203.0.113.61');
    const res = await app.request('/api/today?lang=en', {
      headers: { 'x-forwarded-for': '203.0.113.61', 'Accept-Language': 'es' },
    });
    expect(res.status).toBe(429);
    expect(await msg(res)).toBe('Too many requests.');
  });

  it('TS-26 los POST no usan el limiter de GET', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    await exhaust(app, '203.0.113.70');
    const res = await app.request('/api/session', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, 'x-forwarded-for': '203.0.113.70' },
      body: '{}',
    });
    expect(res.status).toBe(200);
  });
});
