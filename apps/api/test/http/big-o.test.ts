import { BIG_O_OPTIONS } from '@nerdose/core';
import { bigO } from '@nerdose/game-big-o/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminAuth, ADMIN_HEADERS, buildDbApp } from '../helpers/app';
import {
  BO_PAYLOAD,
  BO_PUBLIC,
  LOST_GO,
  WON_JAVA,
  boGet,
  boMove,
  boPost,
  boResult,
  boStats,
  seedBigO,
  seedBigOPlay,
} from '../helpers/big-o';
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

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const sql = dbs.owner.sql;
const cookie = (id: string) => ({ Cookie: `nd_pid=${id}` });
const err = (code: string, message: string) => ({ error: { code, message } });
const PLAYS = () => sql`SELECT * FROM plays`;
const pref = async (id: string) =>
  (await sql`SELECT preferred_code_language AS p FROM players WHERE id = ${id}`)[0]!.p;

const INVALID_MOVES: unknown[] = [
  { language: 'go', option: 'o_n4' },
  { language: 'rust', option: 'o_n' },
  { language: 'GO', option: 'o_n' },
  { language: 'go', option: 'O_N' },
  { language: 'go' },
  { option: 'o_n' },
  {},
  { language: 'go', option: 'o_n', extra: 1 },
  { guess: 'REACT' },
  { language: 'go', option: 3 },
];

async function setup() {
  const challenge = await seedBigO(dbs);
  const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
  return { challenge, player };
}

async function setupPlay() {
  const { challenge, player } = await setup();
  await seedBigOPlay(dbs, challenge.id, player.id, {});
  return { challenge, player };
}

describe('Big O: abrir y empezar', () => {
  it('TS-9 abrir sin sesión', async () => {
    await seedBigO(dbs);
    const { app } = await buildDbApp(dbs);
    const res = await boGet(app, undefined, '?lang=es');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      game_id: 'big-o',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'published',
      public_view: BO_PUBLIC,
      play: null,
      result: null,
      game_stats: null,
      reported: false,
    });
  });

  it('TS-10 abrir con sesión sin Play (en): forma exacta de la vista pública', async () => {
    const { player } = await setup();
    const { app } = await buildDbApp(dbs);
    const res = await boGet(app, player, '?lang=en');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      game_id: 'big-o',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'published',
      public_view: BO_PUBLIC,
      play: null,
      result: null,
      game_stats: null,
      reported: false,
    });
    expect(Object.keys(json.public_view)).toEqual(['code', 'options']);
    expect(Object.keys(json.public_view.code)).toEqual(['js', 'go', 'java']);
    expect(json.public_view.options).toEqual([...BIG_O_OPTIONS]);
  });

  it('TS-11 empezar', async () => {
    const { challenge, player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const res = await boPost(app, 'start', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      play: { status: 'in_progress', state: {}, score: null, code_language: null },
    });
    const [row] = await PLAYS();
    expect(row).toMatchObject({
      game_id: 'big-o',
      challenge_id: challenge.id,
      state: {},
      status: 'in_progress',
      code_language: null,
      result: null,
      finished_at: null,
    });
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
  });

  it('TS-12 empezar dos veces es idempotente', async () => {
    const { player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const a = await (await boPost(app, 'start', { challenge_number: 8 }, player)).json();
    const res = await boPost(app, 'start', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(a);
    const rows = await PLAYS();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.state).toEqual({});
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
  });
});

describe('Big O: confirmar', () => {
  it('TS-13 acierto en Java (es)', async () => {
    const { player } = await setupPlay();
    const { app, lines } = await buildDbApp(dbs);
    const res = await boMove(app, WON_JAVA, player, '?lang=es');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      feedback: null,
      play: { status: 'won', state: WON_JAVA, score: 1, code_language: 'java' },
      result: boResult(WON_JAVA, 'es'),
      streaks: { game: { current: 1, max: 1 }, global: { current: 1, max: 1 } },
      game_stats: {
        game_id: 'big-o',
        current_streak: 1,
        max_streak: 1,
        played: 1,
        wins: 1,
        win_rate: 1,
        extra: boStats(true),
      },
    });
    const [p] = await PLAYS();
    expect(p).toMatchObject({ status: 'won', score: 1, code_language: 'java', state: WON_JAVA });
    expect(p!.result).not.toBeNull();
    expect(new Date(p!.finished_at as string).toISOString()).toBe('2026-12-01T10:00:00.000Z');
    expect(await pref(player.id)).toBe('java');
    const [gs] = await sql`SELECT * FROM player_game_stats WHERE game_id = 'big-o'`;
    expect(gs!.extra).toEqual(boStats(true));
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps).toMatchObject({ global_streak: 1, total_completed: 1 });
    expect(lines().find((l) => l.event === 'PlayFinished')).toMatchObject({
      game_id: 'big-o',
      status: 'won',
      score: 1,
    });
  });

  it('TS-14 error en Go', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const res = await boMove(app, LOST_GO, player, '?lang=es');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play).toEqual({ status: 'lost', state: LOST_GO, score: 0, code_language: 'go' });
    expect(json.result).toEqual(boResult(LOST_GO, 'es'));
    expect(json.result).toMatchObject({
      win: false,
      score: 0,
      chosen_option: 'o_n2',
      answer: 'o_n_log_n',
      trap_option: 'o_n2',
    });
    expect(json.game_stats).toMatchObject({
      played: 1,
      wins: 0,
      win_rate: 0,
      extra: boStats(false),
    });
    expect(json.streaks.game.current).toBe(1);
    const [p] = await PLAYS();
    expect(p).toMatchObject({ status: 'lost', code_language: 'go' });
    expect(await pref(player.id)).toBe('go');
  });

  it('TS-15 confirmar sin Play previa (en)', async () => {
    const { player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const res = await boMove(app, WON_JAVA, player, '?lang=en');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play.status).toBe('won');
    expect(json.result).toEqual(boResult(WON_JAVA, 'en'));
    expect(json.result.explanation.steps[0]).toBe('The outer loop runs n times.');
    expect(json.result.explanation.tip).toBe('An inner loop that doubles its variable is not n.');
    expect(json.result.explanation.line_notes[1].text).toBe('log n times');
    expect(await PLAYS()).toHaveLength(1);
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(1);
  });
});

describe('Big O: jugadas rechazadas', () => {
  it('TS-16 partida terminada: otra jugada', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    expect((await boMove(app, WON_JAVA, player)).status).toBe(200);
    const res = await boMove(app, LOST_GO, player);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('game_finished', 'La partida ya terminó.'));
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

  it('TS-17 jugadas inválidas', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    for (const move of INVALID_MOVES) {
      const res = await boMove(app, move, player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(err('invalid_move', 'Jugada inválida.'));
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
  });

  it('TS-18 jugada inválida sin Play previa no crea Play', async () => {
    const { player } = await setup();
    const { app } = await buildDbApp(dbs);
    const res = await boMove(app, { language: 'rust', option: 'o_n' }, player);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(err('invalid_move', 'Jugada inválida.'));
    expect(await PLAYS()).toHaveLength(0);
    expect(await pref(player.id)).toBe('js');
  });

  it('TS-19 inválidas y luego válida', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    for (const move of INVALID_MOVES.slice(0, 3)) {
      expect((await boMove(app, move, player)).status).toBe(422);
    }
    const res = await boMove(app, WON_JAVA, player);
    expect(res.status).toBe(200);
    expect((await res.json()).play).toEqual({
      status: 'won',
      state: WON_JAVA,
      score: 1,
      code_language: 'java',
    });
  });
});

describe('Big O: retomar y reabrir', () => {
  it('TS-20 retomar sin confirmar', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const res = await boGet(app, player, '?lang=es');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.public_view).toEqual(BO_PUBLIC);
    expect(json.play).toEqual({
      status: 'in_progress',
      state: {},
      score: null,
      code_language: null,
    });
    expect(json.result).toBeNull();
    expect(json.game_stats).toBeNull();
  });

  it('TS-21 reabrir la partida terminada en es y en', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const closed = await (await boMove(app, WON_JAVA, player, '?lang=es')).json();
    const es = await (await boGet(app, player, '?lang=es')).json();
    expect(es.play).toEqual({ status: 'won', state: WON_JAVA, score: 1, code_language: 'java' });
    expect(es.result).toEqual(boResult(WON_JAVA, 'es'));
    expect(es.public_view).toEqual(BO_PUBLIC);
    expect(es.game_stats).toEqual(closed.game_stats);
    const en = await (await boGet(app, player, '?lang=en')).json();
    expect(en.result).toEqual(boResult(WON_JAVA, 'en'));
  });
});

describe('Big O: rachas y /api/today', () => {
  const home = async (app: Awaited<ReturnType<typeof buildDbApp>>['app'], id: string) =>
    (await app.request('/api/today', { headers: cookie(id) })).json();

  it('TS-22 racha con día neutro y global ya contada hoy', async () => {
    await seedBigO(dbs, { date: '2026-11-29', number: 6 });
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-11-30', status: 'published' });
    const { challenge, player } = await setup();
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'big-o',
      currentStreak: 3,
      maxStreak: 3,
      played: 3,
      wins: 2,
      lastCompletedDate: '2026-11-29',
      extra: {
        by_category: {
          nested_loops: { played: 2, correct: 1 },
          recursion: { played: 1, correct: 1 },
        },
      },
    });
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 5,
      maxGlobalStreak: 5,
      lastActiveDate: '2026-12-01',
      totalCompleted: 12,
    });
    await seedBigOPlay(dbs, challenge.id, player.id, {});
    const { app } = await buildDbApp(dbs);
    const json = await (await boMove(app, WON_JAVA, player)).json();
    expect(json.streaks).toEqual({ game: { current: 4, max: 4 }, global: { current: 5, max: 5 } });
    expect(json.game_stats).toEqual({
      game_id: 'big-o',
      current_streak: 4,
      max_streak: 4,
      played: 4,
      wins: 3,
      win_rate: 0.75,
      extra: {
        by_category: {
          nested_loops: { played: 3, correct: 2 },
          recursion: { played: 1, correct: 1 },
        },
      },
    });
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps).toMatchObject({ global_streak: 5, max_global_streak: 5, total_completed: 13 });
    expect(String(ps!.last_active_date)).toContain('2026-12-01');
    const [gs] = await sql`SELECT * FROM player_game_stats`;
    expect(String(gs!.last_completed_date)).toContain('2026-12-01');
  });

  it('TS-23 la racha de Big O se corta si hubo un desafío sin jugar', async () => {
    await seedBigO(dbs, { date: '2026-11-29', number: 6 });
    await seedBigO(dbs, { date: '2026-11-30', number: 7 });
    const { challenge, player } = await setup();
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'big-o',
      currentStreak: 3,
      maxStreak: 3,
      lastCompletedDate: '2026-11-29',
      extra: bigO.initialStats(),
    });
    await seedBigOPlay(dbs, challenge.id, player.id, {});
    const { app } = await buildDbApp(dbs);
    const json = await (await boMove(app, LOST_GO, player)).json();
    expect(json.streaks.game).toEqual({ current: 1, max: 3 });
  });

  it('TS-24 ROLLBACK completo si falla el cierre', async () => {
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
    const res = await boMove(app, WON_JAVA, player);
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

  it('TS-25 /api/today con Big O: sin jugar, en curso, ganado y perdido', async () => {
    const challenge = await seedBigO(dbs);
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    const c = await dbs.insertPlayer();
    const d = await dbs.insertPlayer();
    await seedBigOPlay(dbs, challenge.id, b.id, {});
    await seedBigOPlay(dbs, challenge.id, c.id, WON_JAVA, {
      status: 'won',
      score: 1,
      codeLanguage: 'java',
      result: bigO.result(BO_PAYLOAD, WON_JAVA, 'es'),
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    await dbs.insertGameStats({
      playerId: c.id,
      gameId: 'big-o',
      currentStreak: 2,
      maxStreak: 2,
      played: 2,
      wins: 2,
      lastCompletedDate: '2026-12-01',
    });
    await seedBigOPlay(dbs, challenge.id, d.id, LOST_GO, {
      status: 'lost',
      score: 0,
      codeLanguage: 'go',
      result: bigO.result(BO_PAYLOAD, LOST_GO, 'es'),
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const { app } = await buildDbApp(dbs);
    const ha = await home(app, a.id);
    expect(ha.games[3]).toEqual({
      game_id: 'big-o',
      challenge_status: 'published',
      play_status: null,
      history_label: null,
      current_streak: 0,
    });
    const hb = await home(app, b.id);
    expect(hb.games[3]).toMatchObject({ play_status: 'in_progress', history_label: null });
    expect(hb.completed_today).toBe(0);
    const hc = await home(app, c.id);
    expect(hc.games[3]).toEqual({
      game_id: 'big-o',
      challenge_status: 'published',
      play_status: 'won',
      history_label: '✓ O(n log n)',
      current_streak: 2,
    });
    expect(hc.completed_today).toBe(1);
    const hd = await home(app, d.id);
    expect(hd.games[3]).toMatchObject({ play_status: 'lost', history_label: '✗' });
  });

  it('TS-26 publicación perezosa de Big O', async () => {
    vi.setSystemTime(new Date('2026-12-02T00:00:05Z'));
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-02',
      number: 9,
      status: 'approved',
    });
    const bo = await seedBigO(dbs, { date: '2026-12-02', number: 9, status: 'approved' });
    const { app, lines } = await buildDbApp(dbs);
    const res = await app.request('/api/today');
    expect(res.status).toBe(200);
    const rows = await sql`SELECT game_id, status FROM challenges WHERE date = '2026-12-02'`;
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.status === 'published')).toBe(true);
    const body = await res.json();
    expect(body.games[0].challenge_status).toBe('published');
    expect(body.games[3].challenge_status).toBe('published');
    expect(lines().filter((l) => l.event === 'ChallengePublished')).toContainEqual(
      expect.objectContaining({ challenge_id: bo.id, game_id: 'big-o' }),
    );
  });
});

describe('Big O: anulación', () => {
  const voidedOpts = {
    status: 'voided' as const,
    voidReason: 'wrong_answer',
    voidedAt: new Date('2026-12-01T09:00:00Z'),
  };

  it('TS-27 desafío anulado: abrir, empezar y jugar', async () => {
    await seedBigO(dbs, voidedOpts);
    const player = await dbs.insertPlayer({ preferredCodeLanguage: 'js' });
    const { app } = await buildDbApp(dbs);
    const get = await boGet(app, player);
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual({
      game_id: 'big-o',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'voided',
      public_view: null,
      play: null,
      result: null,
      game_stats: null,
      reported: false,
    });
    const start = await boPost(app, 'start', { challenge_number: 8 }, player);
    expect(start.status).toBe(409);
    expect(await start.json()).toEqual(err('challenge_voided', 'El desafío fue anulado.'));
    const move = await boMove(app, WON_JAVA, player);
    expect(move.status).toBe(409);
    expect(await move.json()).toEqual(err('challenge_voided', 'El desafío fue anulado.'));
    expect(await PLAYS()).toHaveLength(0);
    expect(await pref(player.id)).toBe('js');
  });

  it('TS-28 acknowledge-void cuenta para la racha sin tocar played/wins/extra', async () => {
    await seedBigO(dbs, { date: '2026-11-30', number: 7 });
    await seedBigO(dbs, voidedOpts);
    const player = await dbs.insertPlayer();
    const extra = { by_category: { nested_loops: { played: 7, correct: 5 } } };
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'big-o',
      currentStreak: 3,
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
    const res = await boPost(app, 'acknowledge-void', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      play: { status: 'voided' },
      streaks: { game: { current: 4, max: 9 }, global: { current: 6, max: 12 } },
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
    expect(gs).toMatchObject({ current_streak: 4, played: 7, wins: 5 });
    expect(gs!.extra).toEqual(extra);
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps!.total_completed).toBe(11);
  });

  it('TS-29 anulación del admin de un Big O jugado (culpable template)', async () => {
    const challenge = await seedBigO(dbs);
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    expect((await boMove(app, WON_JAVA, player)).status).toBe(200);
    const res = await app.request(`/api/admin/challenges/${challenge.id}/void`, {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, ...(await adminAuth()) },
      body: JSON.stringify({
        void_reason: 'La respuesta correcta era O(n), no O(n log n)',
        culprit: { kind: 'template' },
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ challenge_id: challenge.id, affected_plays: 1 });
    const [ch] = await sql`SELECT * FROM challenges WHERE id = ${challenge.id}`;
    expect(ch!.status).toBe('voided');
    const [p] = await PLAYS();
    expect(p).toMatchObject({ status: 'voided', code_language: 'java' });
    expect(p!.result).not.toBeNull();
    const [gs] = await sql`SELECT * FROM player_game_stats`;
    expect(gs).toMatchObject({ played: 0, wins: 0, current_streak: 1, extra: { by_category: {} } });
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps).toMatchObject({ global_streak: 1, total_completed: 1 });
    const today = await (await boGet(app, player)).json();
    expect(today).toMatchObject({
      challenge_status: 'voided',
      public_view: null,
      result: null,
      play: { status: 'voided' },
    });
  });

  it('TS-30 Big O no tiene culpables de banco', async () => {
    const challenge = await seedBigO(dbs);
    const { app } = await buildDbApp(dbs);
    const res = await app.request(`/api/admin/challenges/${challenge.id}/void`, {
      method: 'POST',
      headers: { ...ADMIN_HEADERS, ...(await adminAuth()) },
      body: JSON.stringify({
        void_reason: 'x',
        culprit: { kind: 'term', id: '00000000-0000-4000-8000-000000000001' },
      }),
    });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(
      err('invalid_culprit', 'El culpable no pertenece al desafío.'),
    );
    const [ch] = await sql`SELECT status FROM challenges WHERE id = ${challenge.id}`;
    expect(ch!.status).toBe('published');
  });
});

describe('Big O: admin', () => {
  it('TS-31 reportes: Big O lista culprits vacío; juego sin definición también', async () => {
    const bo = await seedBigO(dbs, { date: '2026-11-28', number: 5 });
    const bh = await dbs.insertChallenge({
      gameId: 'bug-hunt',
      date: '2026-11-27',
      number: 4,
      payload: {},
    });
    for (const c of [bo, bh]) {
      const p = await dbs.insertPlayer();
      await dbs.insertReport({ challengeId: c.id, playerId: p.id });
    }
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/admin/reports', { headers: await adminAuth() });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { groups: Json[] };
    for (const c of [bo, bh]) {
      expect(body.groups.find((g) => g.challenge.id === c.id)!.challenge.culprits).toEqual([]);
    }
  });

  it('TS-32 stock de contenido sin consumidor Big O', async () => {
    const { app } = await buildDbApp(dbs);
    const res = await app.request('/api/admin/content/stock', { headers: await adminAuth() });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { banks: { consumers: { game_id: string }[] }[] };
    expect(body.banks.flatMap((b) => b.consumers).every((c) => c.game_id !== 'big-o')).toBe(true);
  });
});
