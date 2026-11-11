import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
const sql = dbs.owner.sql;
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };
let ipSeq = 0;
const uniqueIp = () => `203.0.113.${(ipSeq += 1) % 250}`;

const report = (
  app: App,
  player: { id: string },
  body: unknown,
  opts: { headers?: Record<string, string>; game?: string; query?: string; ip?: string } = {},
) =>
  app.request(`/api/games/${opts.game ?? 'devdle'}/today/report${opts.query ?? ''}`, {
    method: 'POST',
    headers: {
      ...MUTATION_HEADERS,
      Cookie: `nd_pid=${player.id}`,
      'x-forwarded-for': opts.ip ?? uniqueIp(),
      ...opts.headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const publish = (extra: Record<string, unknown> = {}, game: 'devdle' | 'timeline' = 'devdle') =>
  dbs.insertChallenge({
    gameId: game,
    date: '2026-12-01',
    number: 8,
    payload: PAYLOAD,
    status: 'published',
    ...extra,
  });
const rows = () => sql`SELECT * FROM challenge_reports ORDER BY created_at`;
const err = (code: string, message: string) => ({ error: { code, message } });
const OK = { challenge_number: 8, reason: 'other' };

describe('POST /api/games/{game_id}/today/report', () => {
  it('TS-1 reporte durante la partida con contexto del servidor', async () => {
    const challenge = await publish();
    const player = await dbs.insertPlayer({ locale: 'es' });
    const state = { guesses: [{ guess: 'REACT', marks: ['absent'] }] };
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state,
    });
    const { app } = await buildDbApp(dbs);
    const res = await report(
      app,
      player,
      { challenge_number: 8, reason: 'ambiguous', message: 'dos palabras posibles' },
      { headers: { 'User-Agent': 'Mozilla/5.0 (X11)' } },
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ report_id: expect.any(String) });
    const [row] = await rows();
    expect(row).toMatchObject({
      id: body.report_id,
      challenge_id: challenge.id,
      player_id: player.id,
      reason: 'ambiguous',
      message: 'dos palabras posibles',
      locale: 'es',
      status: 'open',
      context: {
        code_language: null,
        play_status: 'in_progress',
        play_state: state,
        user_agent: 'Mozilla/5.0 (X11)',
      },
    });
  });

  it('TS-2 reporte sin Play', async () => {
    await publish();
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    expect((await report(app, player, OK)).status).toBe(201);
    const [row] = await rows();
    expect(row!.message).toBeNull();
    expect(row!.context).toEqual({
      code_language: null,
      play_status: null,
      play_state: null,
      user_agent: null,
    });
  });

  it('TS-3 locale del reporte: ?lang manda; si no, el del jugador', async () => {
    await publish();
    const a = await dbs.insertPlayer({ locale: 'es' });
    const b = await dbs.insertPlayer({ locale: 'en' });
    const { app } = await buildDbApp(dbs);
    const body = { challenge_number: 8, reason: 'translation' };
    await report(app, a, body, { query: '?lang=en' });
    await report(app, b, body);
    expect((await rows()).map((r) => r.locale)).toEqual(['en', 'en']);
  });

  it('TS-4 trim del mensaje', async () => {
    await publish();
    const { app } = await buildDbApp(dbs);
    for (const message of ['  hola  ', '   ', undefined]) {
      const p = await dbs.insertPlayer();
      await report(app, p, { ...OK, message });
    }
    expect((await rows()).map((r) => r.message)).toEqual(['hola', null, null]);
  });

  it('TS-5 user agent truncado a 512', async () => {
    await publish();
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    await report(app, a, OK, { headers: { 'User-Agent': 'a'.repeat(600) } });
    await report(app, b, OK);
    const ctx = (await rows()).map((r) => (r.context as { user_agent: string | null }).user_agent);
    expect(ctx[0]).toHaveLength(512);
    expect(ctx[1]).toBeNull();
  });

  it('TS-6 code_language del body se ignora en juegos sin lenguaje', async () => {
    await publish();
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await report(app, p, {
      challenge_number: 8,
      reason: 'wrong_answer',
      code_language: 'go',
    });
    expect(res.status).toBe(201);
    expect((await rows())[0]!.context).toMatchObject({ code_language: null });
  });

  it('TS-7 segundo reporte del mismo jugador', async () => {
    await publish();
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    expect((await report(app, p, OK)).status).toBe(201);
    const res = await report(app, p, { challenge_number: 8, reason: 'wrong_answer' });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('already_reported', 'Ya reportaste este desafío.'));
    expect(await rows()).toHaveLength(1);
  });

  it('TS-8 doble envío concurrente', async () => {
    await publish();
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await Promise.all([report(app, p, OK), report(app, p, OK)]);
    expect(res.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await rows()).toHaveLength(1);
  });

  it('TS-9 reporte desde el resultado no toca la partida ni el umbral', async () => {
    const challenge = await publish({}, 'timeline');
    for (let i = 0; i < 5; i++) {
      const o = await dbs.insertPlayer();
      await dbs.insertReport({ challengeId: challenge.id, playerId: o.id });
    }
    const p = await dbs.insertPlayer();
    const finishedAt = new Date('2026-12-01T09:00:00Z');
    await dbs.insertPlay({
      playerId: p.id,
      challengeId: challenge.id,
      gameId: 'timeline',
      date: '2026-12-01',
      state: { s: 1 },
      status: 'lost',
      result: { r: 1 },
      score: 1,
      finishedAt,
    });
    await dbs.insertGameStats({
      playerId: p.id,
      gameId: 'timeline',
      currentStreak: 1,
      maxStreak: 1,
      played: 1,
      wins: 0,
      lastCompletedDate: '2026-12-01',
      extra: {},
    });
    await dbs.insertPlayerStats({
      playerId: p.id,
      globalStreak: 1,
      maxGlobalStreak: 1,
      lastActiveDate: '2026-12-01',
      totalCompleted: 1,
    });
    const snapshot = async () =>
      JSON.stringify([
        await sql`SELECT * FROM plays`,
        await sql`SELECT * FROM player_game_stats`,
        await sql`SELECT * FROM player_stats`,
      ]);
    const before = await snapshot();
    const { app } = await buildDbApp(dbs);
    const res = await report(
      app,
      p,
      { challenge_number: 8, reason: 'translation' },
      { game: 'timeline' },
    );
    expect(res.status).toBe(201);
    expect(await snapshot()).toBe(before);
    const mine = (await rows()).find((r) => r.player_id === p.id)!;
    expect(mine.reason).toBe('translation');
    expect((mine.context as { play_status: string }).play_status).toBe('lost');
    expect((await sql`SELECT alerted_at FROM challenges`)[0]!.alerted_at).toBeNull();
  });

  it('TS-17 rate limit 10/hora por IP', async () => {
    await publish();
    const { app } = await buildDbApp(dbs);
    const statuses: number[] = [];
    let last: Response | undefined;
    for (let i = 0; i < 11; i++) {
      const p = await dbs.insertPlayer();
      last = await report(app, p, OK, { ip: '203.0.113.7' });
      statuses.push(last.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 201)).toBe(true);
    expect(statuses[10]).toBe(429);
    expect(last!.headers.get('Retry-After')).toBe('3600');
    expect(await last!.json()).toEqual(err('rate_limited', 'Demasiadas solicitudes.'));
    expect(await rows()).toHaveLength(10);
  });

  it('TS-18 body inválido: invalid_report', async () => {
    await publish();
    const { app } = await buildDbApp(dbs);
    const bodies: unknown[] = [
      { ...OK, message: 'x'.repeat(1001) },
      { ...OK, reason: 'spam' },
      { challenge_number: 8 },
      { ...OK, challenge_number: 0 },
      { ...OK, challenge_number: '8' },
      { ...OK, code_language: 'rust' },
    ];
    for (const b of bodies) {
      const p = await dbs.insertPlayer();
      const res = await report(app, p, b);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(err('invalid_report', 'Reporte inválido.'));
    }
    expect(await rows()).toHaveLength(0);
  });

  it('TS-19 protecciones de la ruta', async () => {
    await publish();
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const noCookie = await app.request('/api/games/devdle/today/report', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, 'x-forwarded-for': uniqueIp() },
      body: JSON.stringify(OK),
    });
    expect(noCookie.status).toBe(401);
    expect((await noCookie.json()).error.code).toBe('no_session');
    const origin = await report(app, p, OK, { headers: { Origin: 'https://evil.example' } });
    expect(origin.status).toBe(403);
    expect((await origin.json()).error.code).toBe('forbidden_origin');
    const media = await report(app, p, 'x', { headers: { 'Content-Type': 'text/plain' } });
    expect(media.status).toBe(415);
    expect((await media.json()).error.code).toBe('unsupported_media_type');
    expect(await rows()).toHaveLength(0);
  });

  it('TS-20 desafío no reportable: 404 sin datos del desafío', async () => {
    await publish();
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-02',
      number: 9,
      payload: PAYLOAD,
      status: 'approved',
    });
    await dbs.insertChallenge({
      gameId: 'timeline',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'rejected',
    });
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const cases: Array<[string, number]> = [
      ['devdle', 9],
      ['devdle', 999],
      ['timeline', 8],
    ];
    for (const [game, n] of cases) {
      const res = await report(app, p, { challenge_number: n, reason: 'wrong_answer' }, { game });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual(err('not_found', 'Recurso no encontrado.'));
    }
    expect(await rows()).toHaveLength(0);
  });

  it('TS-21 desafío pasado reportable', async () => {
    const past = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-11-30',
      number: 7,
      payload: PAYLOAD,
      status: 'published',
    });
    await publish();
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await report(app, p, { challenge_number: 7, reason: 'wrong_explanation' });
    expect(res.status).toBe(201);
    expect((await rows())[0]!.challenge_id).toBe(past.id);
  });

  it('TS-23 juego no registrado', async () => {
    const p = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await report(app, p, OK, { game: 'chess' });
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('not_found');
  });

  it('TS-25 el evento no incluye el mensaje', async () => {
    const challenge = await publish();
    const p = await dbs.insertPlayer({ locale: 'es' });
    const { app, lines } = await buildDbApp(dbs);
    const res = await report(app, p, {
      challenge_number: 8,
      reason: 'ambiguous',
      message: 'SECRET-TEXT',
    });
    const { report_id } = await res.json();
    expect(lines().filter((l) => l.event === 'ChallengeReported')).toEqual([
      expect.objectContaining({
        event: 'ChallengeReported',
        report_id,
        challenge_id: challenge.id,
        reason: 'ambiguous',
        locale: 'es',
      }),
    ]);
    expect(JSON.stringify(lines())).not.toContain('SECRET-TEXT');
  });
});
