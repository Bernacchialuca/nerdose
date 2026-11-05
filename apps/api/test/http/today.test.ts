import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { IdentityService } from '@/domain/identity/identity.service';
import type { IdentityRepository } from '@/domain/identity/identity.repository';

import { buildTestApp } from '../helpers/app';
import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
afterAll(() => dbs.close());
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const none = ['devdle', 'grep-grid', 'timeline', 'big-o', 'bug-hunt'].map((game_id) => ({
  game_id,
  challenge_status: 'none',
  play_status: null,
  history_label: null,
  current_streak: 0,
}));
const base = {
  date: '2026-12-01',
  number: 8,
  next_reset_at: '2026-12-02T00:00:00Z',
  seconds_to_reset: 50400,
  has_session: false,
  global_streak: { current: 0, max: 0 },
  completed_today: 0,
  games: none,
};

describe('GET /api/today', () => {
  it('TS-1 sin sesión devuelve el contrato completo', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    const res = await app.request('/api/today');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(base);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect([...res.headers.keys()].filter((h) => h.startsWith('access-control-'))).toEqual([]);
  });

  it('TS-2 sin cookie válida no consulta la base', async () => {
    const calls: string[] = [];
    const repo = new Proxy({} as IdentityRepository, {
      get: (_t, name) => () => {
        calls.push(String(name));
        throw new Error('db');
      },
    });
    const { app } = buildTestApp({ identity: new IdentityService(repo) });
    for (const headers of [{} as Record<string, string>, { Cookie: 'nd_pid=xyz' }]) {
      const res = await app.request('/api/today', { headers });
      expect(res.status).toBe(200);
      expect((await res.json()).has_session).toBe(false);
    }
    expect(calls).toEqual([]);
  });

  it('TS-3 con cookie válida', async () => {
    const player = await dbs.insertPlayer({ locale: 'en' });
    const { app } = buildTestApp({ identity: dbs.identity() });
    const res = await app.request('/api/today', { headers: { Cookie: `nd_pid=${player.id}` } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...base, has_session: true });
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('TS-4 Player inexistente se trata como ausente', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    const res = await app.request('/api/today', { headers: { Cookie: `nd_pid=${randomUUID()}` } });
    expect(res.status).toBe(200);
    expect((await res.json()).has_session).toBe(false);
  });

  it('TS-5 ignora la fecha del cliente', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    const res = await app.request('/api/today?date=2020-01-01&number=1&day=2020-01-01', {
      headers: { Date: 'Wed, 01 Jan 2020 00:00:00 GMT' },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect([body.date, body.number, body.seconds_to_reset]).toEqual(['2026-12-01', 8, 50400]);
  });

  it('TS-6 antes del lanzamiento', async () => {
    vi.setSystemTime(new Date('2026-11-23T12:00:00Z'));
    const { app } = buildTestApp({ identity: dbs.identity() });
    expect(await (await app.request('/api/today')).json()).toEqual({
      ...base,
      date: '2026-11-23',
      number: null,
      next_reset_at: '2026-11-24T00:00:00Z',
      seconds_to_reset: 43200,
    });
  });

  it('TS-7 día del lanzamiento', async () => {
    vi.setSystemTime(new Date('2026-11-24T00:00:00Z'));
    const { app } = buildTestApp({ identity: dbs.identity() });
    expect(await (await app.request('/api/today')).json()).toMatchObject({
      date: '2026-11-24',
      number: 1,
      next_reset_at: '2026-11-25T00:00:00Z',
      seconds_to_reset: 86400,
    });
  });

  it('TS-8 último segundo del día', async () => {
    vi.setSystemTime(new Date('2026-12-01T23:59:58Z'));
    const { app } = buildTestApp({ identity: dbs.identity() });
    expect(await (await app.request('/api/today')).json()).toMatchObject({
      date: '2026-12-01',
      number: 8,
      seconds_to_reset: 2,
    });
  });

  it('TS-9 cambio de día sin reiniciar', async () => {
    vi.setSystemTime(new Date('2026-12-01T23:59:59Z'));
    const { app } = buildTestApp({ identity: dbs.identity() });
    expect(await (await app.request('/api/today')).json()).toMatchObject({
      date: '2026-12-01',
      number: 8,
      seconds_to_reset: 1,
    });
    vi.setSystemTime(new Date('2026-12-02T00:00:01Z'));
    expect(await (await app.request('/api/today')).json()).toEqual({
      ...base,
      date: '2026-12-02',
      number: 9,
      next_reset_at: '2026-12-03T00:00:00Z',
      seconds_to_reset: 86399,
    });
  });

  it('TS-19 ?lang válido no altera el cuerpo', async () => {
    const { app } = buildTestApp({ identity: dbs.identity() });
    const res = await app.request('/api/today?lang=en');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(base);
  });
});

describe('GET /api/today: idioma de los errores', () => {
  const boom = {
    getToday: () => {
      throw new Error('boom');
    },
  };
  const ES = 'Error interno del servidor.';
  const EN = 'Internal server error.';

  it('TS-16 el locale del Player gana sobre Accept-Language', async () => {
    const player = await dbs.insertPlayer({ locale: 'en' });
    const { app, lines } = buildTestApp({ identity: dbs.identity(), publishing: boom });
    const res = await app.request('/api/today', {
      headers: { Cookie: `nd_pid=${player.id}`, 'Accept-Language': 'es' },
    });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: { code: 'internal_error', message: EN } });
    expect(lines().some((l) => l.level === 'error' && l.msg === 'Unexpected error')).toBe(true);
  });

  it('TS-17 ?lang gana sobre el locale del Player', async () => {
    const player = await dbs.insertPlayer({ locale: 'en' });
    const { app } = buildTestApp({ identity: dbs.identity(), publishing: boom });
    const res = await app.request('/api/today?lang=es', {
      headers: { Cookie: `nd_pid=${player.id}` },
    });
    expect((await res.json()).error.message).toBe(ES);
  });

  it('TS-18 sin sesión: Accept-Language y default es', async () => {
    const { app } = buildTestApp({ identity: dbs.identity(), publishing: boom });
    const msg = async (url: string, headers: Record<string, string> = {}) =>
      (await (await app.request(url, { headers })).json()).error.message;
    expect(await msg('/api/today', { 'Accept-Language': 'en' })).toBe(EN);
    expect(await msg('/api/today')).toBe(ES);
    expect(await msg('/api/today?lang=fr', { 'Accept-Language': 'fr-FR' })).toBe(ES);
  });
});
