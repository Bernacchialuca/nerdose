import { randomUUID } from 'node:crypto';

import { devdle, scoreGuess } from '@nerdose/game-devdle/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminAuth, ADMIN_HEADERS, buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';
import { found, GG_PAYLOAD, SEVEN, seedGrepGrid } from '../helpers/grep-grid';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { TL_ID, TL_PAYLOAD, seedTimeline } from '../helpers/timeline';

const dbs = useDatabases();
const sql = dbs.owner.sql;
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type App = { request: (u: string, i?: RequestInit) => Response | Promise<Response> };

const G_MERGE = { guess: 'MERGE', marks: scoreGuess('MERGE', 'MERGE') };
const G_REACT = { guess: 'REACT', marks: scoreGuess('MERGE', 'REACT') };
const LOST6 = ['REACT', 'CACHE', 'LINUX', 'PROXY', 'QUERY', 'SHELL'].map((w) => ({
  guess: w,
  marks: scoreGuess('MERGE', w),
}));
const WON_STATE = { guesses: [G_REACT, G_MERGE] };
const LOST_STATE = { guesses: LOST6 };
const finished = (state: { guesses: unknown[] }) => ({
  status: (state === WON_STATE ? 'won' : 'lost') as 'won' | 'lost',
  score: state === WON_STATE ? 2 : 6,
  result: devdle.result(PAYLOAD as never, state as never, 'es'),
  finishedAt: new Date('2026-12-01T09:30:00Z'),
});

const voidCall = async (
  app: App,
  id: string,
  body: unknown,
  headers: Record<string, string> = {},
) =>
  app.request(`/api/admin/challenges/${id}/void`, {
    method: 'POST',
    headers: { ...ADMIN_HEADERS, ...(await adminAuth()), ...headers },
    body: JSON.stringify(body),
  });
const NONE = { void_reason: 'x', culprit: { kind: 'none' } };

/** Devdle #8 de hoy con 12 Play terminadas y 3 en curso de 15 jugadores. */
async function seedTs22() {
  const term = await dbs.insertTerm({ term: 'REDIS' });
  const payload = { ...PAYLOAD, term_id: term.id, word: 'REDIS' };
  const prev = await dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-11-30',
    number: 7,
    payload: PAYLOAD,
  });
  const c = await dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-12-01',
    number: 8,
    payload,
  });
  const players = [];
  for (let i = 0; i < 15; i++) {
    const p = await dbs.insertPlayer();
    players.push(p);
    const done = i < 12;
    const state = i % 2 === 0 ? WON_STATE : LOST_STATE;
    await dbs.insertPlay({
      playerId: p.id,
      challengeId: prev.id,
      gameId: 'devdle',
      date: '2026-11-30',
      state: WON_STATE,
      ...finished(WON_STATE),
    });
    await dbs.insertPlay({
      playerId: p.id,
      challengeId: c.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: done ? state : { guesses: [G_REACT] },
      ...(done ? finished(state) : {}),
    });
    const wins = (i % 2 === 0 ? 1 : 0) + 1;
    await dbs.insertGameStats({
      playerId: p.id,
      gameId: 'devdle',
      currentStreak: done ? 2 : 1,
      maxStreak: done ? 2 : 1,
      played: done ? 2 : 1,
      wins: done ? wins : 1,
      lastCompletedDate: done ? '2026-12-01' : '2026-11-30',
      extra: devdle.initialStats(),
    });
    await dbs.insertPlayerStats({
      playerId: p.id,
      globalStreak: done ? 2 : 1,
      maxGlobalStreak: done ? 2 : 1,
      lastActiveDate: done ? '2026-12-01' : '2026-11-30',
      totalCompleted: done ? 2 : 1,
    });
  }
  const reporters = players.slice(0, 3);
  await dbs.insertReport({ challengeId: c.id, playerId: reporters[0]!.id });
  await dbs.insertReport({ challengeId: c.id, playerId: reporters[1]!.id });
  await dbs.insertReport({ challengeId: c.id, playerId: reporters[2]!.id, status: 'dismissed' });
  return { term, c, players };
}

const snapshot = async () =>
  JSON.stringify([
    await sql`SELECT id, status, void_reason, voided_at FROM challenges ORDER BY id`,
    await sql`SELECT id, status, result, score, finished_at FROM plays ORDER BY id`,
    await sql`SELECT id, status FROM challenge_reports ORDER BY id`,
    await sql`SELECT id, status, rejection_reason FROM terms ORDER BY id`,
    await sql`SELECT * FROM player_game_stats ORDER BY player_id, game_id`,
    await sql`SELECT * FROM player_stats ORDER BY player_id`,
  ]);

describe('POST /api/admin/challenges/{challenge_id}/void', () => {
  it('TS-22/23/24/38 anulación completa de Devdle #8: atómica, visible y con rachas conservadas', async () => {
    const { term, c, players } = await seedTs22();
    const { app, lines } = await buildDbApp(dbs);
    await app.request('/api/games/devdle/today'); // carga la cache con `published`
    const res = await voidCall(app, c.id, {
      void_reason: 'definición incorrecta',
      culprit: { kind: 'term', id: term.id },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ challenge_id: c.id, affected_plays: 15 });

    const [ch] = await sql`SELECT * FROM challenges WHERE id = ${c.id}`;
    expect(ch).toMatchObject({ status: 'voided', void_reason: 'definición incorrecta' });
    expect(ch!.voided_at).not.toBeNull();
    const todays = await sql`SELECT * FROM plays WHERE challenge_id = ${c.id}`;
    expect(todays).toHaveLength(15);
    expect(todays.every((p) => p.status === 'voided' && p.finished_at !== null)).toBe(true);
    expect(todays.filter((p) => p.result !== null)).toHaveLength(12);
    expect(todays.filter((p) => p.score !== null)).toHaveLength(12);
    const reports = await sql`SELECT status FROM challenge_reports ORDER BY status DESC`;
    expect(reports.map((r) => r.status as string).sort()).toEqual([
      'dismissed',
      'resolved',
      'resolved',
    ]);
    const [t] = await sql`SELECT status, rejection_reason FROM terms WHERE id = ${term.id}`;
    expect(t).toEqual({ status: 'rejected', rejection_reason: 'definición incorrecta' });

    // TS-24: rachas conservadas; los 3 en curso suman el día.
    const gs = await sql`SELECT * FROM player_game_stats WHERE game_id = 'devdle'`;
    const stats = (i: number) => gs.find((r) => r.player_id === players[i]!.id)!;
    for (let i = 0; i < 12; i++) {
      expect(stats(i)).toMatchObject({ current_streak: 2, last_completed_date: '2026-12-01' });
      expect(stats(i)!.played).toBe(1);
    }
    for (let i = 12; i < 15; i++) {
      expect(stats(i)).toMatchObject({
        current_streak: 2,
        max_streak: 2,
        last_completed_date: '2026-12-01',
        played: 1,
      });
    }
    const ps = await sql`SELECT * FROM player_stats`;
    expect(ps.every((r) => r.total_completed === 2 && r.global_streak === 2)).toBe(true);

    // TS-23: la cache se recargó sin reiniciar y el move da 409.
    const today = (await (await app.request('/api/games/devdle/today')).json()) as Json;
    expect(today.challenge_status).toBe('voided');
    const all = (await (await app.request('/api/today')).json()) as Json;
    expect(all.games.find((g: Json) => g.game_id === 'devdle').challenge_status).toBe('voided');
    const move = await app.request('/api/games/devdle/today/move', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${players[0]!.id}` },
      body: JSON.stringify({ challenge_number: 8, move: { guess: 'CACHE' } }),
    });
    expect(move.status).toBe(409);
    expect(((await move.json()) as Json).error.code).toBe('challenge_voided');

    // TS-38: eventos post-COMMIT en orden y sin secretos.
    const events = lines().filter((l) =>
      ['ChallengeVoided', 'ContentItemRejected', 'ReportResolved', 'StreaksUpdated'].includes(
        l.event as string,
      ),
    );
    expect(events.map((l) => l.event)).toEqual([
      'ChallengeVoided',
      'ContentItemRejected',
      'ReportResolved',
      'StreaksUpdated',
    ]);
    expect(events[0]).toMatchObject({
      challenge_id: c.id,
      game_id: 'devdle',
      culprit_kind: 'term',
      affected_plays: 15,
    });
    expect(events[1]).toMatchObject({ kind: 'term', id: term.id });
    expect(events[2]).toMatchObject({ challenge_id: c.id, count: 2 });
    expect(events[3]).toMatchObject({ challenge_id: c.id, players: 15 });
    expect(JSON.stringify(lines())).not.toContain('Bearer');
  });

  it('TS-25 timeline_fact: rechaza el hecho y no recarga la cache si no es de hoy', async () => {
    const fact = await dbs.insertTimelineFact({ id: TL_ID.PYTHON });
    const c = await seedTimeline(dbs, { date: '2026-11-30', number: 7, payload: TL_PAYLOAD });
    const { app, lines, cache } = await buildDbApp(dbs);
    const reload = vi.spyOn(cache, 'reload');
    const res = await voidCall(app, c.id, {
      void_reason: 'fecha mal',
      culprit: { kind: 'timeline_fact', id: fact.id },
    });
    expect(res.status).toBe(200);
    const [row] = await sql`SELECT status, rejection_reason FROM timeline_facts`;
    expect(row).toEqual({ status: 'rejected', rejection_reason: 'fecha mal' });
    expect(reload).not.toHaveBeenCalled();
    expect(lines().some((l) => l.event === 'ContentItemRejected')).toBe(true);
  });

  it('TS-26 recálculo de Grep Grid: played/wins bajan y la racha se conserva; el resto intacto', async () => {
    const p = await dbs.insertPlayer();
    const q = await dbs.insertPlayer();
    const dayOf = (i: number) => `2026-11-${String(22 + i).padStart(2, '0')}`;
    const days = Array.from({ length: 10 }, (_, i) => (i < 9 ? dayOf(i) : '2026-12-01'));
    // 22..29 nov y 1 dic (consecutivos como días activos con challenge publicado)
    const ids: string[] = [];
    for (const [i, date] of days.entries()) {
      const c = await seedGrepGrid(dbs, { date, number: i + 1 });
      ids.push(c.id);
    }
    const wonState = found(...SEVEN, 'PYTHON');
    const lostState = found('PYTHON');
    const wins = new Set([0, 2, 4, 6, 8, 3]);
    for (const [i, date] of days.entries()) {
      const state = wins.has(i) ? wonState : lostState;
      await dbs.insertPlay({
        playerId: p.id,
        challengeId: ids[i]!,
        gameId: 'grep-grid',
        date,
        state,
        status: wins.has(i) ? 'won' : 'lost',
        score: 1,
        finishedAt: new Date(`${date}T10:00:00Z`),
        result: grepGrid.result(GG_PAYLOAD, state, 'es'),
      });
    }
    // Devdle de P y stats ajenos de Q
    const dv = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
    });
    await dbs.insertPlay({
      playerId: p.id,
      challengeId: dv.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: WON_STATE,
      ...finished(WON_STATE),
    });
    await dbs.insertGameStats({
      playerId: p.id,
      gameId: 'devdle',
      currentStreak: 1,
      maxStreak: 1,
      played: 1,
      wins: 1,
      lastCompletedDate: '2026-12-01',
      extra: devdle.initialStats(),
    });
    await dbs.insertGameStats({
      playerId: q.id,
      gameId: 'grep-grid',
      currentStreak: 4,
      maxStreak: 5,
      played: 7,
      wins: 3,
      lastCompletedDate: '2026-12-01',
      extra: grepGrid.initialStats(),
    });
    await dbs.insertGameStats({
      playerId: p.id,
      gameId: 'grep-grid',
      currentStreak: 10,
      maxStreak: 10,
      played: 10,
      wins: 6,
      lastCompletedDate: '2026-12-01',
      extra: grepGrid.initialStats(),
    });
    await dbs.insertPlayerStats({
      playerId: p.id,
      globalStreak: 10,
      maxGlobalStreak: 10,
      lastActiveDate: '2026-12-01',
      totalCompleted: 11,
    });
    const devdleBefore = JSON.stringify(
      await sql`SELECT * FROM player_game_stats WHERE player_id = ${p.id} AND game_id = 'devdle'`,
    );
    const qBefore = JSON.stringify(
      await sql`SELECT * FROM player_game_stats WHERE player_id = ${q.id}`,
    );

    const { app } = await buildDbApp(dbs);
    const res = await voidCall(app, ids[3]!, NONE);
    expect(res.status).toBe(200);
    expect(((await res.json()) as Json).affected_plays).toBe(1);

    const [gs] =
      await sql`SELECT * FROM player_game_stats WHERE player_id = ${p.id} AND game_id = 'grep-grid'`;
    expect(gs).toMatchObject({
      played: 9,
      wins: 5,
      last_completed_date: '2026-12-01',
    });
    // Días 22..29 nov consecutivos + 1 dic: 30 nov sin challenge es neutro, así que la racha no se corta.
    expect(gs!.current_streak).toBe(10);
    expect(gs!.max_streak).toBe(10);
    expect(
      JSON.stringify(
        await sql`SELECT * FROM player_game_stats WHERE player_id = ${p.id} AND game_id = 'devdle'`,
      ),
    ).toBe(devdleBefore);
    expect(
      JSON.stringify(await sql`SELECT * FROM player_game_stats WHERE player_id = ${q.id}`),
    ).toBe(qBefore);
    const [ps] = await sql`SELECT * FROM player_stats WHERE player_id = ${p.id}`;
    expect(ps!.total_completed).toBe(11);
  });

  it('TS-28 template y none no tocan terms ni timeline_facts', async () => {
    for (const w of ['ALPHA', 'BRAVO']) await dbs.insertTerm({ term: w });
    await dbs.insertTimelineFact({ id: randomUUID() });
    const gg = await seedGrepGrid(dbs, { date: '2026-12-01', number: 8 });
    const dv = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-11-30',
      number: 7,
      payload: PAYLOAD,
    });
    const { app } = await buildDbApp(dbs);
    const before = JSON.stringify([
      await sql`SELECT id, status, rejection_reason, updated_at FROM terms ORDER BY id`,
      await sql`SELECT id, status, rejection_reason, updated_at FROM timeline_facts`,
    ]);
    expect(
      (await voidCall(app, gg.id, { void_reason: 'plantilla', culprit: { kind: 'template' } }))
        .status,
    ).toBe(200);
    expect((await voidCall(app, dv.id, NONE)).status).toBe(200);
    expect(
      JSON.stringify([
        await sql`SELECT id, status, rejection_reason, updated_at FROM terms ORDER BY id`,
        await sql`SELECT id, status, rejection_reason, updated_at FROM timeline_facts`,
      ]),
    ).toBe(before);
  });

  it('TS-29/30 body inválido: 422 sin efectos', async () => {
    const { c } = await seedTs22();
    const { app } = await buildDbApp(dbs);
    const before = await snapshot();
    const uuid = randomUUID();
    const bodies = [
      { culprit: { kind: 'none' } },
      { void_reason: '   ', culprit: { kind: 'none' } },
      { void_reason: 'x'.repeat(501), culprit: { kind: 'none' } },
      { void_reason: 'x', culprit: { kind: 'term' } },
      { void_reason: 'x', culprit: { kind: 'none', id: uuid } },
      { void_reason: 'x', culprit: { kind: 'term', id: 'abc' } },
      { void_reason: 'x', culprit: { kind: 'otro' } },
      { void_reason: 'x' },
    ];
    for (const body of bodies) {
      const res = await voidCall(app, c.id, body);
      expect(res.status).toBe(422);
      expect(((await res.json()) as Json).error.code).toBe('validation_error');
    }
    expect(await snapshot()).toBe(before);
  });

  it('TS-31 culpable no referenciado: 422 invalid_culprit sin efectos', async () => {
    const { c, term } = await seedTs22();
    const other = await dbs.insertTerm({ term: 'OTRO' });
    const { app } = await buildDbApp(dbs);
    const before = await snapshot();
    for (const culprit of [
      { kind: 'term', id: other.id },
      { kind: 'timeline_fact', id: term.id },
    ]) {
      const res = await voidCall(app, c.id, { void_reason: 'x', culprit });
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({
        error: { code: 'invalid_culprit', message: 'El culpable no pertenece al desafío.' },
      });
    }
    expect(await snapshot()).toBe(before);
  });

  it('TS-32 no anulable: approved y ya voided', async () => {
    const approved = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-02',
      number: 9,
      payload: PAYLOAD,
      status: 'approved',
    });
    const voided = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-11-20',
      number: 1,
      payload: PAYLOAD,
      status: 'voided',
      voidReason: 'x',
      voidedAt: new Date('2026-11-21T00:00:00Z'),
    });
    const { app } = await buildDbApp(dbs);
    for (const id of [approved.id, voided.id]) {
      const res = await voidCall(app, id, NONE);
      expect(res.status).toBe(409);
      expect(((await res.json()) as Json).error.code).toBe('not_voidable');
    }
  });

  it('TS-33 inexistente e id inválido', async () => {
    const { app } = await buildDbApp(dbs);
    const missing = await voidCall(app, '6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', NONE);
    expect(missing.status).toBe(404);
    expect(((await missing.json()) as Json).error.code).toBe('not_found');
    expect((await voidCall(app, 'xyz', NONE)).status).toBe(422);
  });

  it('TS-34 falla a mitad del recálculo: ROLLBACK total', async () => {
    const { term, c } = await seedTs22();
    let calls = 0;
    const { app, lines, cache } = await buildDbApp(dbs, {
      wrapVoidRepos: (r) => ({
        ...r,
        progress: Object.assign(Object.create(r.progress) as typeof r.progress, {
          saveGameStats: async (...args: Parameters<typeof r.progress.saveGameStats>) => {
            calls += 1;
            if (calls === 8) throw new Error('boom');
            return r.progress.saveGameStats(...args);
          },
        }),
      }),
    });
    await app.request('/api/games/devdle/today');
    const before = await snapshot();
    const res = await voidCall(app, c.id, {
      void_reason: 'x',
      culprit: { kind: 'term', id: term.id },
    });
    expect(res.status).toBe(500);
    expect(((await res.json()) as Json).error.code).toBe('internal_error');
    expect(await snapshot()).toBe(before);
    expect(cache.get('devdle').status).toBe('published');
    expect(lines().some((l) => l.event === 'ChallengeVoided')).toBe(false);
  });

  it('falla de recarga de la cache: la anulación sigue en 200 y se loguea error', async () => {
    const { c } = await seedTs22();
    const { app, lines, cache } = await buildDbApp(dbs);
    vi.spyOn(cache, 'reload').mockRejectedValueOnce(new Error('db caída'));
    const res = await voidCall(app, c.id, NONE);
    expect(res.status).toBe(200);
    expect(lines().some((l) => l.level === 'error' && l.msg === 'Today cache reload failed')).toBe(
      true,
    );
    const [row] = await sql`SELECT status FROM challenges WHERE id = ${c.id}`;
    expect(row!.status).toBe('voided');
  });
});
