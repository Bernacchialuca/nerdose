/* eslint-disable @typescript-eslint/no-explicit-any */
import { bugHunt } from '@nerdose/game-bug-hunt/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminAuth, ADMIN_HEADERS, buildDbApp } from '../helpers/app';
import {
  BH_PAYLOAD,
  BH_PAYLOAD_BOOL,
  BH_PUBLIC_EN,
  BH_PUBLIC_ES,
  INVALID_SCHEMA,
  LOST_GO,
  MOVE,
  NON_PICKABLE,
  WON_JAVA,
  bhGet,
  bhMove,
  bhPost,
  bhResult,
  bhStats,
  seedBugHunt,
  seedBugHuntPlay,
} from '../helpers/bug-hunt';
import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

type Json = Record<string, any>;

const sql = dbs.owner.sql;
const cookie = (id: string) => ({ Cookie: `nd_pid=${id}` });
const err = (code: string, message: string) => ({ error: { code, message } });
const PLAYS = () => sql`SELECT * FROM plays`;
const pref = async (id: string) =>
  (await sql`SELECT preferred_code_language AS p FROM players WHERE id = ${id}`)[0]!.p;

async function setup() {
  const challenge = await seedBugHunt(dbs);
  const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
  return { challenge, player };
}

async function setupPlay() {
  const { challenge, player } = await setup();
  await seedBugHuntPlay(dbs, challenge.id, player.id, {});
  return { challenge, player };
}

describe('Bug Hunt: abrir y empezar', () => {
  it('TS-10 abrir sin sesión (S-048 TS-10)', async () => {
    await seedBugHunt(dbs);
    const { app } = await buildDbApp(dbs);
    const res = await bhGet(app, undefined, '?lang=es');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      game_id: 'bug-hunt',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'published',
      public_view: BH_PUBLIC_ES,
      play: null,
      result: null,
      game_stats: null,
      reported: false,
    });
  });

  it('TS-11 abrir con sesión sin Play (en): forma exacta de la vista pública (S-048 TS-11)', async () => {
    const { player } = await setup();
    const { app } = await buildDbApp(dbs);
    const res = await bhGet(app, player, '?lang=en');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.public_view).toEqual(BH_PUBLIC_EN);
    expect(Object.keys(json.public_view).sort()).toEqual([
      'code',
      'function_name',
      'pickable_lines',
      'spec',
      'visible_tests',
    ]);
    expect(Object.keys(json.public_view.code)).toEqual(['js', 'go', 'java']);
    expect(json.public_view.pickable_lines).toEqual([2, 3, 4, 5, 8]);
    expect(json.public_view.visible_tests).toHaveLength(3);
    expect(json.public_view.visible_tests.map((t: Json) => t.input)).not.toContainEqual([
      [5, 1, 5],
    ]);
    expect(json.public_view.visible_tests.every((t: Json) => !('actual' in t))).toBe(true);
  });

  it('TS-12 empezar (S-048 TS-12)', async () => {
    const { challenge, player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const res = await bhPost(app, 'start', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      play: { status: 'in_progress', state: {}, score: null, code_language: null },
    });
    const [row] = await PLAYS();
    expect(row).toMatchObject({
      game_id: 'bug-hunt',
      challenge_id: challenge.id,
      state: {},
      status: 'in_progress',
      code_language: null,
      result: null,
      finished_at: null,
    });
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
  });

  it('TS-13 empezar dos veces es idempotente (S-048 TS-13)', async () => {
    const { player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const a = await (await bhPost(app, 'start', { challenge_number: 8 }, player)).json();
    const res = await bhPost(app, 'start', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(a);
    const rows = await PLAYS();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.state).toEqual({});
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
  });
});

describe('Bug Hunt: confirmar', () => {
  it('TS-14 ganar en Java (es) (S-048 TS-14)', async () => {
    const { player } = await setupPlay();
    const { app, lines } = await buildDbApp(dbs);
    const res = await bhMove(app, WON_JAVA, player, '?lang=es');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      feedback: null,
      play: { status: 'won', state: WON_JAVA, score: 1, code_language: 'java' },
      result: bhResult(WON_JAVA, 'es'),
      streaks: { game: { current: 1, max: 1 }, global: { current: 1, max: 1 } },
      game_stats: {
        game_id: 'bug-hunt',
        current_streak: 1,
        max_streak: 1,
        played: 1,
        wins: 1,
        win_rate: 1,
        extra: bhStats('java', true),
      },
    });
    expect(json.result.failing_test).toEqual({ input: [[5, 1, 5]], expected: 0, actual: 2 });
    expect(json.result.fix.java).toEqual({
      before: '        if (nums[i] >= nums[best]) {',
      after: '        if (nums[i] > nums[best]) {',
    });
    const [p] = await PLAYS();
    expect(p).toMatchObject({ status: 'won', score: 1, code_language: 'java', state: WON_JAVA });
    expect(p!.result).not.toBeNull();
    expect(new Date(p!.finished_at as string).toISOString()).toBe('2026-12-01T10:00:00.000Z');
    expect(await pref(player.id)).toBe('java');
    const [gs] = await sql`SELECT * FROM player_game_stats WHERE game_id = 'bug-hunt'`;
    expect(gs!.extra).toEqual(bhStats('java', true));
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps).toMatchObject({ global_streak: 1, total_completed: 1 });
    expect(lines().find((l) => l.event === 'PlayFinished')).toMatchObject({
      game_id: 'bug-hunt',
      status: 'won',
      score: 1,
    });
  });

  it('TS-15 perder con otra línea elegible en Go (S-048 TS-15)', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const res = await bhMove(app, LOST_GO, player, '?lang=es');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play).toEqual({ status: 'lost', state: LOST_GO, score: 0, code_language: 'go' });
    expect(json.result).toEqual(bhResult(LOST_GO, 'es'));
    expect(json.result).toMatchObject({
      win: false,
      score: 0,
      chosen_line: 5,
      bug_line: 4,
      code_language: 'go',
    });
    expect(json.game_stats).toMatchObject({
      played: 1,
      wins: 0,
      win_rate: 0,
      extra: bhStats('go', false),
    });
    expect(json.streaks.game.current).toBe(1);
    const [p] = await PLAYS();
    expect(p).toMatchObject({ status: 'lost', code_language: 'go' });
    expect(await pref(player.id)).toBe('go');
  });

  it('TS-16 confirmar sin Play previa (en) (S-048 TS-16)', async () => {
    const { player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const res = await bhMove(app, WON_JAVA, player, '?lang=en');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play.status).toBe('won');
    expect(json.result).toEqual(bhResult(WON_JAVA, 'en'));
    expect(json.result.explanation.steps[0]).toBe(
      'The condition that decides whether best changes uses >= instead of >: on a tie it moves too.',
    );
    expect(await PLAYS()).toHaveLength(1);
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(1);
  });

  it('TS-17 payload con resultados booleanos (S-048 TS-17)', async () => {
    const challenge = await seedBugHunt(dbs, { payload: BH_PAYLOAD_BOOL });
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'go' });
    await seedBugHuntPlay(dbs, challenge.id, player.id, {});
    const { app } = await buildDbApp(dbs);
    const res = await bhMove(app, { language: 'js', line: 2 }, player);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play).toEqual({
      status: 'won',
      state: { language: 'js', line: 2 },
      score: 1,
      code_language: 'js',
    });
    expect(json.result).toMatchObject({
      win: true,
      chosen_line: 2,
      bug_line: 2,
      bug_type: 'bad_initialization',
      function_name: 'anyAbove',
      failing_test: { input: [[], 3], expected: false, actual: true },
      fix: { js: { before: '  let found = true;', after: '  let found = false;' } },
    });
    expect(json.game_stats.extra).toEqual({
      by_language: { js: { played: 1, correct: 1 } },
      by_bug_type: { bad_initialization: { played: 1, correct: 1 } },
    });
    expect(await pref(player.id)).toBe('js');
  });
});

describe('Bug Hunt: jugadas rechazadas', () => {
  const INVALID = err('invalid_move', 'Jugada inválida.');

  it('TS-18 línea no elegible con Play abierta (S-048 TS-18)', async () => {
    const { player } = await setupPlay();
    const { app, lines } = await buildDbApp(dbs);
    for (const line of NON_PICKABLE) {
      const res = await bhMove(app, { language: 'java', line }, player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(INVALID);
    }
    const [p] = await PLAYS();
    expect(p).toMatchObject({
      status: 'in_progress',
      state: {},
      score: null,
      result: null,
      code_language: null,
      finished_at: null,
    });
    expect(await pref(player.id)).toBe('js');
    expect(await sql`SELECT 1 FROM player_game_stats`).toHaveLength(0);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(0);
  });

  it('TS-19 línea no elegible sin Play previa no deja Play creada (S-048 TS-19)', async () => {
    const { player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const res = await bhMove(app, MOVE('java', 1).move, player);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(INVALID);
    expect(await PLAYS()).toHaveLength(0);
    expect(await pref(player.id)).toBe('js');
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(0);
  });

  it('TS-20 jugadas que no pasan moveSchema (S-048 TS-20)', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    expect(INVALID_SCHEMA).toHaveLength(13);
    for (const move of INVALID_SCHEMA) {
      const res = await bhMove(app, move, player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(INVALID);
    }
    const [p] = await PLAYS();
    expect(p).toMatchObject({ status: 'in_progress', state: {} });
    expect(await pref(player.id)).toBe('js');
  });

  it('TS-21 inválidas y luego válida (S-048 TS-21)', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    for (const move of [
      { language: 'java', line: 1 },
      { language: 'rust', line: 4 },
      { language: 'java', line: 99 },
    ]) {
      expect((await bhMove(app, move, player)).status).toBe(422);
    }
    const res = await bhMove(app, WON_JAVA, player);
    expect(res.status).toBe(200);
    expect((await res.json()).play).toEqual({
      status: 'won',
      state: WON_JAVA,
      score: 1,
      code_language: 'java',
    });
  });

  it('TS-22 partida terminada: otra jugada (S-048 TS-22)', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    expect((await bhMove(app, WON_JAVA, player)).status).toBe(200);
    for (const move of [LOST_GO, { language: 'go', line: 1 }]) {
      const res = await bhMove(app, move, player);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual(err('game_finished', 'La partida ya terminó.'));
    }
    const [p] = await PLAYS();
    expect(p).toMatchObject({
      status: 'won',
      code_language: 'java',
      state: WON_JAVA,
      score: 1,
    });
    expect(await pref(player.id)).toBe('java');
    const [gs] = await sql`SELECT * FROM player_game_stats`;
    expect(gs).toMatchObject({ played: 1, wins: 1 });
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps!.total_completed).toBe(1);
  });
});

describe('Bug Hunt: retomar y reabrir', () => {
  it('TS-23 retomar sin confirmar (S-048 TS-23)', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const res = await bhGet(app, player, '?lang=es');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.public_view).toEqual(BH_PUBLIC_ES);
    expect(json.play).toEqual({
      status: 'in_progress',
      state: {},
      score: null,
      code_language: null,
    });
    expect(json.result).toBeNull();
    expect(json.game_stats).toBeNull();
  });

  it('TS-24 reabrir la partida terminada en es y en (S-048 TS-24)', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const closed = await (await bhMove(app, WON_JAVA, player, '?lang=es')).json();
    const es = await (await bhGet(app, player, '?lang=es')).json();
    expect(es.play).toEqual({ status: 'won', state: WON_JAVA, score: 1, code_language: 'java' });
    expect(es.result).toEqual(bhResult(WON_JAVA, 'es'));
    expect(es.public_view).toEqual(BH_PUBLIC_ES);
    expect(es.game_stats).toEqual(closed.game_stats);
    const en = await (await bhGet(app, player, '?lang=en')).json();
    expect(en.result).toEqual(bhResult(WON_JAVA, 'en'));
    expect(en.public_view).toEqual(BH_PUBLIC_EN);
  });
});

describe('Bug Hunt: rachas y /api/today', () => {
  const home = async (app: Awaited<ReturnType<typeof buildDbApp>>['app'], id: string) =>
    (await app.request('/api/today', { headers: cookie(id) })).json();

  it('TS-25 racha de 5 con día neutro y global que sigue (S-048 TS-25)', async () => {
    await seedBugHunt(dbs, { date: '2026-11-29', number: 6 });
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', status: 'published' });
    const { challenge, player } = await setup();
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'bug-hunt',
      currentStreak: 5,
      maxStreak: 5,
      played: 7,
      wins: 5,
      lastCompletedDate: '2026-11-29',
      extra: {
        by_language: { js: { played: 4, correct: 3 }, go: { played: 3, correct: 2 } },
        by_bug_type: {
          off_by_one: { played: 4, correct: 3 },
          comparison: { played: 3, correct: 2 },
        },
      },
    });
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 7,
      maxGlobalStreak: 7,
      lastActiveDate: '2026-11-30',
      totalCompleted: 20,
    });
    await seedBugHuntPlay(dbs, challenge.id, player.id, {});
    const { app } = await buildDbApp(dbs);
    const json = await (await bhMove(app, WON_JAVA, player)).json();
    expect(json.streaks).toEqual({ game: { current: 6, max: 6 }, global: { current: 8, max: 8 } });
    expect(json.game_stats).toEqual({
      game_id: 'bug-hunt',
      current_streak: 6,
      max_streak: 6,
      played: 8,
      wins: 6,
      win_rate: 0.75,
      extra: {
        by_language: {
          js: { played: 4, correct: 3 },
          go: { played: 3, correct: 2 },
          java: { played: 1, correct: 1 },
        },
        by_bug_type: {
          off_by_one: { played: 4, correct: 3 },
          comparison: { played: 4, correct: 3 },
        },
      },
    });
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps).toMatchObject({ global_streak: 8, max_global_streak: 8, total_completed: 21 });
    expect(String(ps!.last_active_date)).toContain('2026-12-01');
    const [gs] = await sql`SELECT * FROM player_game_stats`;
    expect(String(gs!.last_completed_date)).toContain('2026-12-01');
  });

  it('TS-26 la racha de Bug Hunt se corta si hubo un desafío sin jugar (S-048 TS-26)', async () => {
    await seedBugHunt(dbs, { date: '2026-11-29', number: 6 });
    await seedBugHunt(dbs, { date: '2026-11-30', number: 7 });
    const { challenge, player } = await setup();
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'bug-hunt',
      currentStreak: 5,
      maxStreak: 5,
      lastCompletedDate: '2026-11-29',
      extra: bugHunt.initialStats(),
    });
    await seedBugHuntPlay(dbs, challenge.id, player.id, {});
    const { app } = await buildDbApp(dbs);
    const json = await (await bhMove(app, LOST_GO, player)).json();
    expect(json.streaks.game).toEqual({ current: 1, max: 5 });
  });

  it('TS-27 ROLLBACK completo si falla el cierre (S-048 TS-27)', async () => {
    const { player } = await setupPlay();
    const { app, lines } = await buildDbApp(dbs, {
      wrapTxRepos: (r) => ({
        ...r,
        identity: {
          updatePreferences: async () => {
            throw new Error('boom');
          },
        },
      }),
    });
    const res = await bhMove(app, WON_JAVA, player);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual(err('internal_error', 'Error interno del servidor.'));
    const [p] = await PLAYS();
    expect(p).toMatchObject({
      status: 'in_progress',
      state: {},
      code_language: null,
      result: null,
    });
    expect(await pref(player.id)).toBe('js');
    expect(await sql`SELECT 1 FROM player_game_stats`).toHaveLength(0);
    expect(await sql`SELECT 1 FROM player_stats`).toHaveLength(0);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(0);
  });

  it('TS-28 /api/today con Bug Hunt: sin jugar, en curso, ganado y perdido (S-048 TS-28)', async () => {
    const challenge = await seedBugHunt(dbs);
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    const c = await dbs.insertPlayer();
    const d = await dbs.insertPlayer();
    await seedBugHuntPlay(dbs, challenge.id, b.id, {});
    await seedBugHuntPlay(dbs, challenge.id, c.id, WON_JAVA, {
      status: 'won',
      score: 1,
      codeLanguage: 'java',
      result: bugHunt.result(BH_PAYLOAD, WON_JAVA, 'es'),
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    await dbs.insertGameStats({
      playerId: c.id,
      gameId: 'bug-hunt',
      currentStreak: 2,
      maxStreak: 2,
      played: 2,
      wins: 2,
      lastCompletedDate: '2026-12-01',
    });
    await seedBugHuntPlay(dbs, challenge.id, d.id, LOST_GO, {
      status: 'lost',
      score: 0,
      codeLanguage: 'go',
      result: bugHunt.result(BH_PAYLOAD, LOST_GO, 'es'),
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const { app } = await buildDbApp(dbs);
    const ha = await home(app, a.id);
    expect(ha.games[4]).toEqual({
      game_id: 'bug-hunt',
      challenge_status: 'published',
      play_status: null,
      history_label: null,
      current_streak: 0,
    });
    const hb = await home(app, b.id);
    expect(hb.games[4]).toMatchObject({ play_status: 'in_progress', history_label: null });
    expect(hb.completed_today).toBe(0);
    const hc = await home(app, c.id);
    expect(hc.games[4]).toEqual({
      game_id: 'bug-hunt',
      challenge_status: 'published',
      play_status: 'won',
      history_label: '✓ L4',
      current_streak: 2,
    });
    expect(hc.completed_today).toBe(1);
    const hd = await home(app, d.id);
    expect(hd.games[4]).toMatchObject({ play_status: 'lost', history_label: '✗ L4' });
  });

  it('TS-29 día neutro en la home: sin desafío de Bug Hunt hoy (S-048 TS-29)', async () => {
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-01', status: 'published' });
    await seedBugHunt(dbs, { date: '2026-11-30', number: 7 });
    const player = await dbs.insertPlayer();
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'bug-hunt',
      currentStreak: 5,
      maxStreak: 5,
      played: 5,
      wins: 4,
      lastCompletedDate: '2026-11-30',
    });
    const { app } = await buildDbApp(dbs);
    const h = await home(app, player.id);
    expect(h.games[4]).toEqual({
      game_id: 'bug-hunt',
      challenge_status: 'none',
      play_status: null,
      history_label: null,
      current_streak: 5,
    });
    const res = await bhGet(app, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      game_id: 'bug-hunt',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'none',
      public_view: null,
      play: null,
      result: null,
      game_stats: null,
      reported: false,
    });
    const [gs] = await sql`SELECT current_streak FROM player_game_stats`;
    expect(gs!.current_streak).toBe(5);
  });

  it('TS-30 publicación perezosa de Bug Hunt (S-048 TS-30)', async () => {
    vi.setSystemTime(new Date('2026-12-02T00:00:05Z'));
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-02',
      number: 9,
      status: 'approved',
    });
    const bh = await seedBugHunt(dbs, { date: '2026-12-02', number: 9, status: 'approved' });
    const { app, lines } = await buildDbApp(dbs);
    const res = await app.request('/api/today');
    expect(res.status).toBe(200);
    const rows = await sql`SELECT game_id, status FROM challenges WHERE date = '2026-12-02'`;
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.status === 'published')).toBe(true);
    const body = await res.json();
    expect(body.games[0].challenge_status).toBe('published');
    expect(body.games[4].challenge_status).toBe('published');
    expect(lines().filter((l) => l.event === 'ChallengePublished')).toContainEqual(
      expect.objectContaining({ challenge_id: bh.id, game_id: 'bug-hunt' }),
    );
  });
});

describe('Bug Hunt: anulación', () => {
  const voidedOpts = {
    status: 'voided' as const,
    voidReason: 'wrong_answer',
    voidedAt: new Date('2026-12-01T09:00:00Z'),
  };
  const adminVoid = async (
    app: Awaited<ReturnType<typeof buildDbApp>>['app'],
    id: string,
    body: unknown,
  ) =>
    app.request(`/api/admin/challenges/${id}/void`, {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, ...(await adminAuth()) },
      body: JSON.stringify(body),
    });

  it('TS-31 desafío anulado: abrir, empezar y jugar (S-048 TS-31)', async () => {
    await seedBugHunt(dbs, voidedOpts);
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
    const { app } = await buildDbApp(dbs);
    const get = await bhGet(app, player);
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual({
      game_id: 'bug-hunt',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'voided',
      public_view: null,
      play: null,
      result: null,
      game_stats: null,
      reported: false,
    });
    const start = await bhPost(app, 'start', { challenge_number: 8 }, player);
    expect(start.status).toBe(409);
    expect(await start.json()).toEqual(err('challenge_voided', 'El desafío fue anulado.'));
    const move = await bhMove(app, WON_JAVA, player);
    expect(move.status).toBe(409);
    expect(await move.json()).toEqual(err('challenge_voided', 'El desafío fue anulado.'));
    expect(await PLAYS()).toHaveLength(0);
    expect(await pref(player.id)).toBe('js');
  });

  it('TS-32 acknowledge-void cuenta para la racha sin tocar played/wins/extra (S-048 TS-32)', async () => {
    await seedBugHunt(dbs, { date: '2026-11-30', number: 7 });
    await seedBugHunt(dbs, voidedOpts);
    const player = await dbs.insertPlayer();
    const extra = {
      by_language: { js: { played: 7, correct: 5 } },
      by_bug_type: { comparison: { played: 7, correct: 5 } },
    };
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'bug-hunt',
      currentStreak: 5,
      maxStreak: 9,
      played: 7,
      wins: 5,
      lastCompletedDate: '2026-11-30',
      extra,
    });
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 5,
      maxGlobalStreak: 12,
      lastActiveDate: '2026-11-30',
      totalCompleted: 10,
    });
    const { app } = await buildDbApp(dbs);
    const res = await bhPost(app, 'acknowledge-void', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      play: { status: 'voided' },
      streaks: { game: { current: 6, max: 9 }, global: { current: 6, max: 12 } },
    });
    const [p] = await PLAYS();
    expect(p).toMatchObject({
      status: 'voided',
      state: {},
      result: null,
      score: null,
      code_language: null,
    });
    const [gs] = await sql`SELECT * FROM player_game_stats`;
    expect(gs).toMatchObject({ current_streak: 6, played: 7, wins: 5 });
    expect(gs!.extra).toEqual(extra);
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps!.total_completed).toBe(11);
  });

  it('TS-33 anulación del admin con culpable template: Play abierta y Play cerrada (S-048 TS-33)', async () => {
    const challenge = await seedBugHunt(dbs);
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    await seedBugHuntPlay(dbs, challenge.id, a.id, {});
    const { app, lines } = await buildDbApp(dbs);
    expect((await bhMove(app, WON_JAVA, b)).status).toBe(200);
    const res = await adminVoid(app, challenge.id, {
      void_reason: 'El test oculto no falla en Go',
      culprit: { kind: 'template' },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ challenge_id: challenge.id, affected_plays: 2 });
    const [ch] = await sql`SELECT * FROM challenges WHERE id = ${challenge.id}`;
    expect(ch!.status).toBe('voided');
    const [pa] = await sql`SELECT * FROM plays WHERE player_id = ${a.id}`;
    expect(pa).toMatchObject({ status: 'voided', state: {}, result: null, code_language: null });
    expect(pa!.finished_at).not.toBeNull();
    const [pb] = await sql`SELECT * FROM plays WHERE player_id = ${b.id}`;
    expect(pb).toMatchObject({ status: 'voided', code_language: 'java' });
    expect(pb!.result).not.toBeNull();
    const [gsb] = await sql`SELECT * FROM player_game_stats WHERE player_id = ${b.id}`;
    expect(gsb).toMatchObject({
      played: 0,
      wins: 0,
      current_streak: 1,
      extra: { by_language: {}, by_bug_type: {} },
    });
    const [psb] = await sql`SELECT * FROM player_stats WHERE player_id = ${b.id}`;
    expect(psb).toMatchObject({ global_streak: 1, total_completed: 1 });
    const [gsa] = await sql`SELECT * FROM player_game_stats WHERE player_id = ${a.id}`;
    expect(gsa).toMatchObject({ current_streak: 1, played: 0 });
    for (const player of [a, b]) {
      expect(await (await bhGet(app, player, '?lang=es')).json()).toMatchObject({
        challenge_status: 'voided',
        public_view: null,
        result: null,
        play: { status: 'voided' },
      });
    }
    expect(lines().find((l) => l.event === 'ChallengeVoided')).toMatchObject({
      culprit_kind: 'template',
      affected_plays: 2,
    });
  });

  it('TS-34 Bug Hunt no tiene culpables de banco (S-048 TS-34)', async () => {
    const challenge = await seedBugHunt(dbs);
    const { app } = await buildDbApp(dbs);
    const res = await adminVoid(app, challenge.id, {
      void_reason: 'x',
      culprit: { kind: 'term', id: '00000000-0000-4000-8000-000000000001' },
    });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(
      err('invalid_culprit', 'El culpable no pertenece al desafío.'),
    );
    const [ch] = await sql`SELECT status FROM challenges WHERE id = ${challenge.id}`;
    expect(ch!.status).toBe('published');
  });
});

describe('Bug Hunt: admin', () => {
  it('TS-35 reportes: Bug Hunt lista culprits vacío (S-048 TS-35)', async () => {
    const c = await seedBugHunt(dbs, { date: '2026-11-28', number: 5 });
    const p = await dbs.insertPlayer();
    await dbs.insertReport({ challengeId: c.id, playerId: p.id });
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/admin/reports', { headers: await adminAuth() });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { groups: Json[] };
    const group = body.groups.find((g) => g.challenge.id === c.id)!;
    expect(group.challenge.culprits).toEqual([]);
    expect(group.challenge.payload).toEqual(BH_PAYLOAD);
    expect(group.challenge.payload.bug_line).toBe(4);
  });

  it('TS-36 stock de contenido sin consumidor Bug Hunt (S-048 TS-36)', async () => {
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/admin/content/stock', { headers: await adminAuth() });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { banks: { consumers: { game_id: string }[] }[] };
    expect(body.banks.flatMap((b) => b.consumers).every((c) => c.game_id !== 'bug-hunt')).toBe(
      true,
    );
  });
});
