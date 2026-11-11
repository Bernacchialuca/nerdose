import { devdle } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { timeline } from '@nerdose/game-timeline/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';
import { GG_PAYLOAD, SEVEN, found, seedGrepGrid, seedGrepGridPlay } from '../helpers/grep-grid';
import {
  CORRECT,
  REVERSED,
  ROTATED,
  SWAP,
  TL_OID,
  TL_PAYLOAD,
  TL_PUBLIC_EN,
  TL_PUBLIC_ES,
  seedTimeline,
  seedTimelinePlay,
  tlChrono,
  tlGet,
  tlMove,
  tlPost,
  tlResult,
  tlStats,
} from '../helpers/timeline';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const sql = dbs.owner.sql;
const cookie = (id: string) => ({ Cookie: `nd_pid=${id}` });
const err = (code: string, message: string) => ({ error: { code, message } });

const TS_PLAYS = () => sql`SELECT * FROM plays`;

async function setup() {
  const challenge = await seedTimeline(dbs);
  const player = await dbs.insertPlayer();
  return { challenge, player };
}

async function setupPlay() {
  const { challenge, player } = await setup();
  await seedTimelinePlay(dbs, challenge.id, player.id, {});
  return { challenge, player };
}

describe('Timeline: abrir y empezar', () => {
  it('TS-3 abrir sin sesión', async () => {
    await seedTimeline(dbs);
    const { app } = await buildDbApp(dbs);
    const res = await tlGet(app, undefined, '?lang=es');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      game_id: 'timeline',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'published',
      public_view: TL_PUBLIC_ES,
      play: null,
      result: null,
      game_stats: null,
    });
  });

  it('TS-4 abrir con sesión sin Play, en inglés', async () => {
    const { player } = await setup();
    const { app } = await buildDbApp(dbs);
    const res = await tlGet(app, player, '?lang=en');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      game_id: 'timeline',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'published',
      public_view: TL_PUBLIC_EN,
      play: null,
      result: null,
      game_stats: null,
    });
    expect(Object.keys(json.public_view)).toEqual(['prompt', 'items']);
    for (const i of json.public_view.items) {
      expect(Object.keys(i)).toEqual(['opaque_id', 'label', 'category']);
    }
  });

  it('TS-5 empezar', async () => {
    const { challenge, player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const res = await tlPost(app, 'start', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      play: { status: 'in_progress', state: {}, score: null, code_language: null },
    });
    const [row] = await TS_PLAYS();
    expect(row).toMatchObject({
      game_id: 'timeline',
      challenge_id: challenge.id,
      state: {},
      code_language: null,
    });
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
  });

  it('TS-6 empezar dos veces es idempotente', async () => {
    const { player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const a = await (await tlPost(app, 'start', { challenge_number: 8 }, player)).json();
    const res = await tlPost(app, 'start', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(a);
    expect(await TS_PLAYS()).toHaveLength(1);
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
  });
});

describe('Timeline: confirmar', () => {
  const stats = tlStats;

  it('TS-9 confirmar 3/5 (es)', async () => {
    const { player } = await setupPlay();
    const { app, lines } = await buildDbApp(dbs);
    const res = await tlMove(app, SWAP, player, '?lang=es');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      feedback: null,
      play: { status: 'lost', state: { order: SWAP }, score: 3 },
      result: tlResult(SWAP, 'es'),
      streaks: { game: { current: 1, max: 1 }, global: { current: 1, max: 1 } },
      game_stats: {
        game_id: 'timeline',
        current_streak: 1,
        max_streak: 1,
        played: 1,
        wins: 0,
        win_rate: 0,
        extra: stats(SWAP),
      },
    });
    const [p] = await TS_PLAYS();
    expect(p).toMatchObject({
      status: 'lost',
      score: 3,
      state: { order: SWAP },
      code_language: null,
    });
    expect(p!.result).not.toBeNull();
    expect(new Date(p!.finished_at as string).toISOString()).toBe('2026-12-01T10:00:00.000Z');
    const [gs] = await sql`SELECT * FROM player_game_stats WHERE game_id = 'timeline'`;
    expect(gs).toMatchObject({ current_streak: 1, max_streak: 1, played: 1, wins: 0 });
    expect(gs!.extra).toEqual(stats(SWAP));
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps).toMatchObject({
      global_streak: 1,
      max_global_streak: 1,
      total_completed: 1,
    });
    expect(String(ps!.last_active_date)).toContain('2026-12-01');
    expect(lines().find((l) => l.event === 'PlayFinished')).toMatchObject({
      game_id: 'timeline',
      status: 'lost',
      score: 3,
    });
    expect(lines().find((l) => l.event === 'StreaksUpdated')).toBeDefined();
  });

  it('TS-10 confirmar el orden inverso puntúa 1/5', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const res = await tlMove(app, REVERSED, player);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play).toEqual({ status: 'lost', state: { order: REVERSED }, score: 1 });
    expect(json.result).toMatchObject({ score: 1, win: false, submitted_order: REVERSED });
    expect(json.game_stats.extra).toEqual(stats(REVERSED));
  });

  it('TS-11 confirmar 0/5 cuenta para la racha', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const res = await tlMove(app, ROTATED, player);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.play).toEqual({ status: 'lost', state: { order: ROTATED }, score: 0 });
    expect(json.result).toMatchObject({ score: 0, win: false });
    expect(json.streaks.game.current).toBe(1);
    expect(json.game_stats.extra).toEqual(stats(ROTATED));
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
  });

  it('TS-12 confirmar 5/5 (en) sin Play previa', async () => {
    const { player } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const res = await tlMove(app, CORRECT, player, '?lang=en');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      feedback: null,
      play: { status: 'won', state: { order: CORRECT }, score: 5 },
      result: tlResult(CORRECT, 'en'),
      streaks: { game: { current: 1, max: 1 }, global: { current: 1, max: 1 } },
      game_stats: {
        game_id: 'timeline',
        current_streak: 1,
        max_streak: 1,
        played: 1,
        wins: 1,
        win_rate: 1,
        extra: stats(CORRECT),
      },
    });
    expect(json.result.win).toBe(true);
    expect(json.result.items[0].note).toBe('note on Python');
    const plays = await TS_PLAYS();
    expect(plays).toHaveLength(1);
    expect(plays[0]!.status).toBe('won');
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(1);
  });

  it('TS-13 confirmar continúa la racha y acumula by_category por hito', async () => {
    await seedTimeline(dbs, { date: '2026-11-30', number: 7 });
    const { challenge, player } = await setup();
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'timeline',
      currentStreak: 4,
      maxStreak: 4,
      played: 4,
      wins: 1,
      lastCompletedDate: '2026-11-30',
      extra: {
        by_category: {
          programming_languages: { played: 10, correct: 7 },
          companies: { played: 10, correct: 6 },
        },
      },
    });
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 4,
      maxGlobalStreak: 4,
      lastActiveDate: '2026-11-30',
      totalCompleted: 4,
    });
    await seedTimelinePlay(dbs, challenge.id, player.id, {});
    const { app } = await buildDbApp(dbs);
    const json = await (await tlMove(app, SWAP, player)).json();
    expect(json.streaks).toEqual({ game: { current: 5, max: 5 }, global: { current: 5, max: 5 } });
    expect(json.game_stats).toEqual({
      game_id: 'timeline',
      current_streak: 5,
      max_streak: 5,
      played: 5,
      wins: 1,
      win_rate: 0.2,
      extra: {
        // SWAP: Python, Docker y Kubernetes en su lugar; Java y Go intercambiados.
        by_category: {
          programming_languages: { played: 13, correct: 8 },
          companies: { played: 10, correct: 6 },
          software_tools: { played: 2, correct: 2 },
        },
      },
    });
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(5);
  });
});

describe('Timeline: confirmaciones inválidas', () => {
  const FOREIGN = ['p7k2m9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'zzzzzz'];
  const UPPER = ['P7K2M9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8'];
  const FOUR = ['p7k2m9', 'j4x8q1', 'g2n5w3', 'd9r6t0'];
  const REPEATED = ['p7k2m9', 'p7k2m9', 'g2n5w3', 'd9r6t0', 'k1v3s8'];
  const INVALID = err('invalid_move', 'Jugada inválida.');

  async function expectUntouched() {
    const [p] = await TS_PLAYS();
    expect(p).toMatchObject({
      status: 'in_progress',
      state: {},
      score: null,
      result: null,
      finished_at: null,
    });
    expect(await sql`SELECT 1 FROM player_game_stats`).toHaveLength(0);
  }

  it('TS-14 4 ids no pasa moveSchema', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const res = await tlMove(app, FOUR, player);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(INVALID);
    await expectUntouched();
  });

  it('TS-15 id repetido no pasa moveSchema', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const res = await tlMove(app, REPEATED, player);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(INVALID);
    await expectUntouched();
  });

  it('TS-16 forma inválida', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    for (const move of [
      { order: [...CORRECT, 'x00000'] },
      { order: [1, 2, 3, 4, 5] },
      {},
      { order: CORRECT, extra: 1 },
      { guess: 'REACT' },
    ]) {
      const res = await tlMove(app, move, player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(INVALID);
    }
    await expectUntouched();
  });

  it('TS-17 id ajeno al desafío hace ROLLBACK', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    for (const order of [FOREIGN, UPPER]) {
      const res = await tlMove(app, order, player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(INVALID);
    }
    await expectUntouched();
  });

  it('TS-18 invalid_move sin Play previa no crea Play', async () => {
    const { player } = await setup();
    const { app } = await buildDbApp(dbs);
    const res = await tlMove(app, FOREIGN, player);
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(INVALID);
    expect(await TS_PLAYS()).toHaveLength(0);
  });

  it('TS-19 inválida y luego válida', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    for (const order of [FOUR, REPEATED, FOREIGN]) {
      expect((await tlMove(app, order, player)).status).toBe(422);
    }
    const res = await tlMove(app, SWAP, player);
    expect(res.status).toBe(200);
    expect((await res.json()).play).toEqual({
      status: 'lost',
      state: { order: SWAP },
      score: 3,
    });
  });
});

describe('Timeline: retomar y reabrir', () => {
  it('TS-7 retomar sin confirmar', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const res = await tlGet(app, player, '?lang=es');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.public_view).toEqual(TL_PUBLIC_ES);
    expect(json.play).toEqual({
      status: 'in_progress',
      state: {},
      score: null,
      code_language: null,
    });
    expect(json.result).toBeNull();
    expect(json.game_stats).toBeNull();
  });

  it('TS-8 cambio de idioma en curso', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const es = await (await tlGet(app, player, '?lang=es')).json();
    const en = await (await tlGet(app, player, '?lang=en')).json();
    expect(en.public_view).toEqual(TL_PUBLIC_EN);
    expect(en.public_view.items).toEqual(es.public_view.items);
  });

  it('TS-20 y TS-21 reabrir la partida terminada, en es y en', async () => {
    const { player } = await setupPlay();
    const { app } = await buildDbApp(dbs);
    const closed = await (await tlMove(app, SWAP, player, '?lang=es')).json();
    const es = await (await tlGet(app, player, '?lang=es')).json();
    expect(es.play).toEqual({
      status: 'lost',
      state: { order: SWAP },
      score: 3,
      code_language: null,
    });
    expect(es.result).toEqual(tlResult(SWAP, 'es'));
    expect(es.game_stats).toEqual(closed.game_stats);
    expect(es.public_view).toEqual(TL_PUBLIC_ES);
    const en = await (await tlGet(app, player, '?lang=en')).json();
    expect(en.result).toEqual(tlResult(SWAP, 'en'));
    expect(en.result.items.map((i: { note: string }) => i.note)).toEqual(
      tlChrono('en').map((i) => i.note),
    );
  });
});

describe('Timeline: /api/today y rachas compartidas', () => {
  const none = (game_id: string) => ({
    game_id,
    challenge_status: 'none',
    play_status: null,
    history_label: null,
    current_streak: 0,
  });
  const home = async (app: Awaited<ReturnType<typeof buildDbApp>>['app'], id: string) =>
    (await app.request('/api/today', { headers: cookie(id) })).json();

  it('TS-22 sin jugar, en curso y completado 3/5', async () => {
    const challenge = await seedTimeline(dbs);
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    const c = await dbs.insertPlayer();
    await seedTimelinePlay(dbs, challenge.id, b.id, {});
    const state = { order: SWAP };
    await seedTimelinePlay(dbs, challenge.id, c.id, state, {
      status: 'lost',
      score: 3,
      result: timeline.result(TL_PAYLOAD, state, 'es'),
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    await dbs.insertGameStats({
      playerId: c.id,
      gameId: 'timeline',
      currentStreak: 2,
      maxStreak: 2,
      played: 2,
      wins: 0,
      lastCompletedDate: '2026-12-01',
    });
    const { app } = await buildDbApp(dbs);

    const ha = await home(app, a.id);
    expect(ha.games[2]).toEqual({
      game_id: 'timeline',
      challenge_status: 'published',
      play_status: null,
      history_label: null,
      current_streak: 0,
    });
    const hb = await home(app, b.id);
    expect(hb.games[2]).toMatchObject({ play_status: 'in_progress', history_label: null });
    expect(hb.completed_today).toBe(0);
    const hc = await home(app, c.id);
    expect(hc.games[2]).toEqual({
      game_id: 'timeline',
      challenge_status: 'published',
      play_status: 'lost',
      history_label: '3/5',
      current_streak: 2,
    });
    expect(hc.completed_today).toBe(1);
    for (const h of [ha, hb, hc]) {
      expect(h.games[3]).toEqual(none('big-o'));
      expect(h.games[4]).toEqual(none('bug-hunt'));
    }
  });

  it('TS-23 racha global compartida con Devdle y Grep Grid', async () => {
    const tl = await seedTimeline(dbs);
    const gg = await seedGrepGrid(dbs);
    const dv = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const player = await dbs.insertPlayer();
    const dvState = {
      guesses: [
        { guess: 'REACT', marks: ['absent', 'absent', 'absent', 'absent', 'absent'] },
        { guess: 'MERGE', marks: ['correct', 'correct', 'correct', 'correct', 'correct'] },
      ],
    };
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: dv.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: dvState,
      status: 'won',
      score: 2,
      result: devdle.result(PAYLOAD as never, dvState as never, 'es'),
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const ggState = found(...SEVEN, 'PYTHON');
    await seedGrepGridPlay(dbs, gg.id, player.id, ggState, {
      status: 'won',
      score: 8,
      result: grepGrid.result(GG_PAYLOAD, ggState, 'es'),
      finishedAt: new Date('2026-12-01T09:05:00Z'),
    });
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'devdle',
      currentStreak: 3,
      maxStreak: 3,
      played: 3,
      wins: 3,
      lastCompletedDate: '2026-12-01',
    });
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'grep-grid',
      currentStreak: 1,
      maxStreak: 1,
      played: 1,
      wins: 1,
      lastCompletedDate: '2026-12-01',
    });
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 3,
      maxGlobalStreak: 3,
      lastActiveDate: '2026-12-01',
      totalCompleted: 10,
    });
    await seedTimelinePlay(dbs, tl.id, player.id, {});
    const { app } = await buildDbApp(dbs);
    const json = await (await tlMove(app, CORRECT, player)).json();
    expect(json.streaks).toEqual({ game: { current: 1, max: 1 }, global: { current: 3, max: 3 } });
    const [ps] = await sql`SELECT * FROM player_stats`;
    expect(ps).toMatchObject({ global_streak: 3, max_global_streak: 3, total_completed: 11 });
    expect(String(ps!.last_active_date)).toContain('2026-12-01');
    expect(await TS_PLAYS()).toHaveLength(3);
    const h = await home(app, player.id);
    expect(h.completed_today).toBe(3);
    expect(h.global_streak).toEqual({ current: 3, max: 3 });
    expect(h.games[0].play_status).toBe('won');
    expect(h.games[1].history_label).toBe('8/8');
    expect(h.games[2]).toEqual({
      game_id: 'timeline',
      challenge_status: 'published',
      play_status: 'won',
      history_label: '5/5',
      current_streak: 1,
    });
  });
});

describe('Timeline: publicación', () => {
  it('TS-24 se publica junto con los otros juegos', async () => {
    vi.setSystemTime(new Date('2026-12-02T00:00:05Z'));
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-02',
      number: 9,
      payload: PAYLOAD,
      status: 'approved',
    });
    await seedGrepGrid(dbs, { date: '2026-12-02', number: 9, status: 'approved' });
    const tl = await seedTimeline(dbs, {
      date: '2026-12-02',
      number: 9,
      status: 'approved',
      payload: { ...TL_PAYLOAD, date: '2026-12-02' },
    });
    const { app, lines } = await buildDbApp(dbs);
    const res = await app.request('/api/today');
    expect(res.status).toBe(200);
    const rows = await sql`SELECT game_id, status FROM challenges WHERE date = '2026-12-02'`;
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.status === 'published')).toBe(true);
    const body = await res.json();
    for (const i of [0, 1, 2]) expect(body.games[i].challenge_status).toBe('published');
    const published = lines().filter((l) => l.event === 'ChallengePublished');
    expect(published).toContainEqual(
      expect.objectContaining({ challenge_id: tl.id, game_id: 'timeline', number: 9 }),
    );
    const today = await (await tlGet(app)).json();
    expect(today.number).toBe(9);
    expect(today.public_view.items.map((i: { opaque_id: string }) => i.opaque_id).sort()).toEqual(
      Object.values(TL_OID).sort(),
    );
  });

  it('TS-25 día del despliegue sin desafío de Timeline', async () => {
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const h = await (await app.request('/api/today')).json();
    expect(h.games[2]).toEqual(none('timeline'));
    const get = await tlGet(app);
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual({
      game_id: 'timeline',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'none',
      public_view: null,
      play: null,
      result: null,
      game_stats: null,
    });
    const start = await tlPost(app, 'start', { challenge_number: 8 }, player);
    expect(start.status).toBe(404);
    expect(await start.json()).toEqual(err('no_challenge_today', 'No hay desafío para hoy.'));
  });

  function none(game_id: string) {
    return {
      game_id,
      challenge_status: 'none',
      play_status: null,
      history_label: null,
      current_streak: 0,
    };
  }
});
