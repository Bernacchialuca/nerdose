import { randomUUID } from 'node:crypto';

import { devdle, scoreGuess } from '@nerdose/game-devdle/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { IdentityService } from '@/domain/identity/identity.service';
import type { IdentityRepository } from '@/domain/identity/identity.repository';

import { buildDbApp, buildTestApp } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';

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
    ensureToday: async () => undefined,
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

describe('GET /api/today con estado real', () => {
  const G_REACT = { guess: 'REACT', marks: scoreGuess('MERGE', 'REACT') };
  const G_MERGE = { guess: 'MERGE', marks: scoreGuess('MERGE', 'MERGE') };
  const LOST6 = ['REACT', 'CACHE', 'LINUX', 'PROXY', 'QUERY', 'SHELL'].map((w) => ({
    guess: w,
    marks: scoreGuess('MERGE', w),
  }));
  const publish = () =>
    dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
  const cookie = (id: string) => ({ Cookie: `nd_pid=${id}` });
  const devdleGame = (overrides: object = {}) => ({
    game_id: 'devdle',
    challenge_status: 'published',
    play_status: null,
    history_label: null,
    current_streak: 0,
    ...overrides,
  });
  const fetchToday = async (headers: Record<string, string> = {}) => {
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/today', { headers });
    expect(res.status).toBe(200);
    return res.json();
  };
  const play = async (
    playerId: string,
    challengeId: string,
    status: 'in_progress' | 'won' | 'lost',
  ) => {
    const state = {
      guesses: status === 'won' ? [G_REACT, G_MERGE] : status === 'lost' ? LOST6 : [G_REACT],
    };
    await dbs.insertPlay({
      playerId,
      challengeId,
      gameId: 'devdle',
      date: '2026-12-01',
      state,
      status,
      ...(status === 'in_progress'
        ? {}
        : {
            score: status === 'won' ? 2 : 6,
            result: devdle.result(PAYLOAD as never, state as never, 'es'),
            finishedAt: new Date('2026-12-01T09:30:00Z'),
          }),
    });
  };
  const stats = (playerId: string, last: string) =>
    Promise.all([
      dbs.insertGameStats({
        playerId,
        gameId: 'devdle',
        currentStreak: 3,
        maxStreak: 5,
        played: 10,
        wins: 8,
        lastCompletedDate: last,
        extra: {},
      }),
      dbs.insertPlayerStats({
        playerId,
        globalStreak: 4,
        maxGlobalStreak: 9,
        lastActiveDate: last,
        totalCompleted: 20,
      }),
    ]);

  beforeEach(() => dbs.reset());

  it('TS-42 Devdle sin empezar; el resto en none', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const body = await fetchToday(cookie(player.id));
    expect(body).toMatchObject({
      has_session: true,
      global_streak: { current: 0, max: 0 },
      completed_today: 0,
    });
    expect(body.games[0]).toEqual(devdleGame());
    expect(body.games.slice(1)).toEqual(none.slice(1));
  });

  it('TS-43 Devdle en curso', async () => {
    const c = await publish();
    const player = await dbs.insertPlayer();
    await play(player.id, c.id, 'in_progress');
    const body = await fetchToday(cookie(player.id));
    expect(body.games[0]).toEqual(devdleGame({ play_status: 'in_progress' }));
    expect(body.completed_today).toBe(0);
  });

  it('TS-44 Devdle ganado con rachas vivas', async () => {
    const c = await publish();
    const player = await dbs.insertPlayer();
    await play(player.id, c.id, 'won');
    await stats(player.id, '2026-12-01');
    const body = await fetchToday(cookie(player.id));
    expect(body.games[0]).toEqual(
      devdleGame({ play_status: 'won', history_label: '✓ 2/6', current_streak: 3 }),
    );
    expect(body.global_streak).toEqual({ current: 4, max: 9 });
    expect(body.completed_today).toBe(1);
  });

  it('TS-45 Devdle perdido', async () => {
    const c = await publish();
    const player = await dbs.insertPlayer();
    await play(player.id, c.id, 'lost');
    const body = await fetchToday(cookie(player.id));
    expect(body.games[0]).toMatchObject({ play_status: 'lost', history_label: '✗ X/6' });
    expect(body.completed_today).toBe(1);
  });

  it('TS-46 racha no viva en 0 sin escribir', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    await stats(player.id, '2026-11-29');
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', status: 'published' });
    const body = await fetchToday(cookie(player.id));
    expect(body.games[0].current_streak).toBe(0);
    expect(body.global_streak).toEqual({ current: 0, max: 9 });
    const [row] = await dbs.owner
      .sql`SELECT current_streak FROM player_game_stats WHERE player_id = ${player.id}`;
    expect(row!.current_streak).toBe(3);
  });

  it('TS-47 un día neutro no corta la racha', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    await stats(player.id, '2026-11-29');
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-29', status: 'published' });
    const body = await fetchToday(cookie(player.id));
    expect(body.games[0].current_streak).toBe(3);
    expect(body.global_streak.current).toBe(4);
  });

  it('TS-48 la racha global usa el último día activo de cualquier juego', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    await stats(player.id, '2026-11-29');
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-29', status: 'published' });
    await dbs.insertChallenge({ gameId: 'big-o', date: '2026-11-30', status: 'published' });
    const body = await fetchToday(cookie(player.id));
    expect(body.games[0].current_streak).toBe(3);
    expect(body.global_streak.current).toBe(0);
  });

  it('TS-49 juego no registrado con desafío en la base aparece none', async () => {
    await publish();
    await dbs.insertChallenge({ gameId: 'bug-hunt', date: '2026-12-01', status: 'published' });
    const body = await fetchToday();
    expect(body.games[4]).toEqual(none[4]);
    expect(body.games[0].challenge_status).toBe('published');
  });

  it('TS-50 sin sesión no consulta datos del jugador', async () => {
    await publish();
    const calls: string[] = [];
    const boom = new Proxy(
      {},
      {
        get: (_t, name) => () => {
          calls.push(String(name));
          throw new Error('db');
        },
      },
    ) as never;
    const { app } = await buildDbApp(dbs, { gameplayRepo: boom, progressRepo: boom });
    for (const headers of [{} as Record<string, string>, { Cookie: 'nd_pid=xyz' }]) {
      const res = await app.request('/api/today', { headers });
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        has_session: false,
        global_streak: { current: 0, max: 0 },
        completed_today: 0,
        games: [devdleGame(), ...none.slice(1)],
      });
    }
    expect(calls).toEqual([]);
  });
});
