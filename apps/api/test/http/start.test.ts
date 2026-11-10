import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const publish = (status: 'published' | 'voided' = 'published') =>
  dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
    status,
    ...(status === 'voided'
      ? { voidReason: 'wrong_answer', voidedAt: new Date('2026-12-01T09:00:00Z') }
      : {}),
  });
const post = (
  app: { request: (u: string, i?: RequestInit) => Response | Promise<Response> },
  body: unknown,
  headers: Record<string, string> = {},
  game = 'devdle',
) =>
  app.request(`/api/games/${game}/today/start`, {
    method: 'POST',
    headers: { ...MUTATION_HEADERS, ...headers },
    body: JSON.stringify(body),
  });
const plays = async () => Number((await dbs.owner.sql`SELECT count(*)::int AS n FROM plays`)[0]!.n);
const err = (code: string, message: string) => ({ error: { code, message } });

describe('POST /api/games/{game_id}/today/start', () => {
  it('TS-27 y TS-28 empieza la partida y es idempotente', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app, lines } = await buildDbApp(dbs);
    const h = { Cookie: `nd_pid=${player.id}` };
    const expected = {
      play: { status: 'in_progress', state: { guesses: [] }, score: null, code_language: null },
    };
    const first = await post(app, { challenge_number: 8 }, h);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual(expected);
    const second = await post(app, { challenge_number: 8 }, h);
    expect(await second.json()).toEqual(expected);
    expect(await plays()).toBe(1);
    const started = lines().filter((l) => l.event === 'PlayStarted');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ player_id: player.id });
  });

  it('TS-29 concurrente con la misma cookie', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const h = { Cookie: `nd_pid=${player.id}` };
    const [a, b] = await Promise.all([
      post(app, { challenge_number: 8 }, h),
      post(app, { challenge_number: 8 }, h),
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect((await a.json()).play.status).toBe('in_progress');
    expect(await plays()).toBe(1);
  });

  it('TS-30 con Play terminada devuelve la existente', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer();
    const state = { guesses: [{ guess: 'MERGE', marks: Array(5).fill('correct') }] };
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state,
      status: 'won',
      score: 1,
      result: { win: true },
      finishedAt: new Date('2026-12-01T09:30:00Z'),
    });
    const { app, lines } = await buildDbApp(dbs);
    const res = await post(app, { challenge_number: 8 }, { Cookie: `nd_pid=${player.id}` });
    expect(await res.json()).toEqual({
      play: { status: 'won', state, score: 1, code_language: null },
    });
    expect(await plays()).toBe(1);
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(0);
  });

  it('TS-31 sin sesión', async () => {
    await publish();
    const { app } = await buildDbApp(dbs);
    for (const headers of <Array<Record<string, string>>>[
      {},
      { Cookie: `nd_pid=${randomUUID()}` },
    ]) {
      const res = await post(app, { challenge_number: 8 }, headers);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual(err('no_session', 'No hay una sesión activa.'));
    }
    expect(await plays()).toBe(0);
  });

  it('TS-32 y TS-40 número viejo y antes del lanzamiento', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await post(app, { challenge_number: 7 }, { Cookie: `nd_pid=${player.id}` });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('challenge_expired', 'El desafío ya venció.'));
    expect(await plays()).toBe(0);

    vi.setSystemTime(new Date('2026-11-20T10:00:00Z'));
    const early = await post(app, { challenge_number: 1 }, { Cookie: `nd_pid=${player.id}` });
    expect(early.status).toBe(409);
    expect((await early.json()).error.code).toBe('challenge_expired');
  });

  it('TS-33 y TS-34 sin desafío: el número se valida primero', async () => {
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const h = { Cookie: `nd_pid=${player.id}` };
    const old = await post(app, { challenge_number: 7 }, h);
    expect(old.status).toBe(409);
    const res = await post(app, { challenge_number: 8 }, h);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(err('no_challenge_today', 'No hay desafío para hoy.'));
  });

  it('TS-35 desafío anulado', async () => {
    await publish('voided');
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await post(app, { challenge_number: 8 }, { Cookie: `nd_pid=${player.id}` });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('challenge_voided', 'El desafío fue anulado.'));
    expect(await plays()).toBe(0);
  });

  it('TS-36 juego sin paquete o inexistente', async () => {
    await dbs.insertChallenge({ gameId: 'timeline', date: '2026-12-01', status: 'published' });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    for (const game of ['timeline', 'foo']) {
      const res = await post(app, { challenge_number: 8 }, { Cookie: `nd_pid=${player.id}` }, game);
      expect(res.status).toBe(404);
      expect((await res.json()).error.code).toBe('not_found');
    }
    expect(await plays()).toBe(0);
  });

  it('TS-37 body inválido', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    for (const body of [
      {},
      { challenge_number: 0 },
      { challenge_number: '8' },
      { challenge_number: 8.5 },
    ]) {
      const res = await post(app, body, { Cookie: `nd_pid=${player.id}` });
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(err('validation_error', 'Datos inválidos.'));
    }
  });

  it('TS-38 y TS-39 rate limit 30/min por player_id', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const other = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const h = { Cookie: `nd_pid=${player.id}` };
    for (let i = 0; i < 30; i += 1) {
      expect((await post(app, { challenge_number: 8 }, h)).status).toBe(200);
    }
    const limited = await post(app, { challenge_number: 7 }, h);
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).toBe('60');
    expect(await limited.json()).toEqual(err('rate_limited', 'Demasiadas solicitudes.'));
    const fresh = await post(app, { challenge_number: 8 }, { Cookie: `nd_pid=${other.id}` });
    expect(fresh.status).toBe(200);
  });

  it('TS-41 origen y Content-Type', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const h = { Cookie: `nd_pid=${player.id}` };
    const badOrigin = await post(
      app,
      { challenge_number: 8 },
      { ...h, Origin: 'https://evil.example' },
    );
    expect(badOrigin.status).toBe(403);
    expect((await badOrigin.json()).error.code).toBe('forbidden_origin');
    const noType = await app.request('/api/games/devdle/today/start', {
      method: 'POST',
      headers: { Origin: 'http://localhost:5173', ...h },
      body: '{"challenge_number":8}',
    });
    expect(noType.status).toBe(415);
    expect((await noType.json()).error.code).toBe('unsupported_media_type');
  });
});
