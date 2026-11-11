import { devdle } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';
import {
  GG_ID,
  GG_PAYLOAD,
  GG_WORDS,
  INITIAL_EXTRA,
  SEVEN,
  cellsOf,
  defEn,
  defEs,
  found,
  ggGet,
  ggMove,
  ggPost,
  ggResultWords,
  seedGrepGrid,
  seedGrepGridPlay,
  selectWord,
} from '../helpers/grep-grid';

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
const plainWords = GG_WORDS.map((w) => ({ term_id: GG_ID[w], word: w }));
const err = (code: string, message: string) => ({ error: { code, message } });

describe('Grep Grid: abrir y empezar', () => {
  it('TS-4 abrir sin sesión', async () => {
    await seedGrepGrid(dbs);
    const { app } = await buildDbApp(dbs);
    const res = await ggGet(app, undefined, '?lang=es');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      game_id: 'grep-grid',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'published',
      public_view: { grid: GG_PAYLOAD.grid, words: plainWords },
      play: null,
      result: null,
      game_stats: null,
      reported: false,
    });
  });

  it('TS-5 abrir con sesión sin Play', async () => {
    await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const json = await (await ggGet(app, player, '?lang=es')).json();
    expect(json.play).toBeNull();
    expect(json.public_view.words).toEqual(plainWords);
    expect(json.public_view.words.every((w: object) => !('definition' in w))).toBe(true);
  });

  it('TS-6 empezar', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    const { app, lines } = await buildDbApp(dbs);
    const res = await ggPost(app, 'start', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      play: {
        status: 'in_progress',
        state: { found_words: [], gave_up: false },
        score: null,
        code_language: null,
      },
    });
    const [row] = await sql`SELECT * FROM plays`;
    expect(row).toMatchObject({
      game_id: 'grep-grid',
      challenge_id: challenge.id,
      code_language: null,
    });
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
  });

  it('TS-7 empezar dos veces es idempotente', async () => {
    await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    const { app, lines } = await buildDbApp(dbs);
    const a = await (await ggPost(app, 'start', { challenge_number: 8 }, player)).json();
    const res = await ggPost(app, 'start', { challenge_number: 8 }, player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(a);
    expect(Number((await sql`SELECT count(*)::int AS n FROM plays`)[0]!.n)).toBe(1);
    expect(lines().filter((l) => l.event === 'PlayStarted')).toHaveLength(1);
  });
});

describe('Grep Grid: selecciones', () => {
  it('TS-8 selección que encuentra una palabra (es) coincide con grep_grid_found', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found());
    const { app } = await buildDbApp(dbs);
    const res = await ggMove(
      app,
      { type: 'select', from: { row: 3, col: 2 }, to: { row: 3, col: 7 } },
      player,
      '?lang=es',
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      feedback: {
        found: true,
        term_id: GG_ID.DOCKER,
        word: 'DOCKER',
        definition: 'definición de DOCKER',
        cells: cellsOf('DOCKER'),
      },
      play: { status: 'in_progress', state: found('DOCKER'), score: null },
      result: null,
      streaks: null,
      game_stats: null,
    });
    expect((await sql`SELECT state FROM plays`)[0]!.state).toEqual(found('DOCKER'));
  });

  it('TS-9 feedback.definition en el locale de la request', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found());
    const { app } = await buildDbApp(dbs);
    const json = await (await ggMove(app, selectWord('DOCKER'), player, '?lang=en')).json();
    expect(json.feedback.definition).toBe(defEn('DOCKER'));
  });

  it('TS-10 ctx.locale del jugador', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer({ locale: 'en' });
    await seedGrepGridPlay(dbs, challenge.id, player.id, found());
    const { app } = await buildDbApp(dbs);
    const json = await (await ggMove(app, selectWord('DOCKER'), player)).json();
    expect(json.feedback.definition).toBe(defEn('DOCKER'));
  });

  it('TS-11 primera selección sin Play previa crea la Play', async () => {
    await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await ggMove(app, selectWord('DOCKER'), player, '?lang=es');
    expect(res.status).toBe(200);
    const rows = await sql`SELECT status, state FROM plays`;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'in_progress', state: found('DOCKER') });
  });

  it('TS-12 not_a_word (tramo parcial) coincide con grep_grid_not_a_word', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found());
    const { app } = await buildDbApp(dbs);
    const res = await ggMove(
      app,
      { type: 'select', from: { row: 3, col: 2 }, to: { row: 3, col: 5 } },
      player,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      feedback: { found: false, reason: 'not_a_word' },
      play: { status: 'in_progress', state: { found_words: [], gave_up: false }, score: null },
      result: null,
      streaks: null,
      game_stats: null,
    });
    expect((await sql`SELECT state FROM plays`)[0]!.state).toEqual(found());
    expect(await sql`SELECT 1 FROM player_game_stats`).toHaveLength(0);
  });

  it('TS-13 already_found coincide con grep_grid_already_found', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found('DOCKER'));
    const { app } = await buildDbApp(dbs);
    const res = await ggMove(app, selectWord('DOCKER'), player);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      feedback: { found: false, reason: 'already_found' },
      play: { status: 'in_progress', state: found('DOCKER'), score: null },
      result: null,
      streaks: null,
      game_stats: null,
    });
    const state = (await sql`SELECT state FROM plays`)[0]!.state as { found_words: unknown[] };
    expect(state.found_words).toHaveLength(1);
  });

  const invalid = [
    ['TS-14 reversa', { type: 'select', from: { row: 3, col: 7 }, to: { row: 3, col: 2 } }],
    ['TS-15 no alineada', { type: 'select', from: { row: 0, col: 0 }, to: { row: 1, col: 2 } }],
    ['TS-16 una sola celda', { type: 'select', from: { row: 0, col: 0 }, to: { row: 0, col: 0 } }],
  ] as const;
  for (const [name, move] of invalid) {
    it(`${name}: 422 invalid_move sin cambiar el estado`, async () => {
      const challenge = await seedGrepGrid(dbs);
      const player = await dbs.insertPlayer();
      await seedGrepGridPlay(dbs, challenge.id, player.id, found('MERGE'));
      const { app } = await buildDbApp(dbs);
      const res = await ggMove(app, move, player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(err('invalid_move', 'Jugada inválida.'));
      expect((await sql`SELECT state FROM plays`)[0]!.state).toEqual(found('MERGE'));
    });
  }

  it('TS-17 fuera de 0-11 y type desconocido no pasan moveSchema', async () => {
    await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    for (const move of [
      { type: 'select', from: { row: 0, col: 0 }, to: { row: 0, col: 12 } },
      { type: 'select', from: { row: -1, col: 0 }, to: { row: 0, col: 3 } },
      { type: 'pick' },
      { guess: 'REACT' },
    ]) {
      const res = await ggMove(app, move, player);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual(err('invalid_move', 'Jugada inválida.'));
    }
  });

  it('TS-18 invalid_move sin Play previa: ROLLBACK', async () => {
    await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await ggMove(
      app,
      { type: 'select', from: { row: 3, col: 7 }, to: { row: 3, col: 2 } },
      player,
    );
    expect(res.status).toBe(422);
    expect(await sql`SELECT 1 FROM plays`).toHaveLength(0);
  });
});

describe('Grep Grid: cierre', () => {
  it('TS-19 y TS-20 octava palabra cierra won y las lecturas son coherentes', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found(...SEVEN));
    const { app, lines } = await buildDbApp(dbs);
    const res = await ggMove(app, selectWord('PYTHON'), player, '?lang=es');
    expect(res.status).toBe(200);
    const result = {
      win: true,
      score: 8,
      gave_up: false,
      words: ggResultWords('es', GG_WORDS),
    };
    const gameStats = {
      game_id: 'grep-grid',
      current_streak: 1,
      max_streak: 1,
      played: 1,
      wins: 1,
      win_rate: 1,
      extra: { words_found: { ...INITIAL_EXTRA.words_found, '8': 1 } },
    };
    expect(await res.json()).toEqual({
      feedback: {
        found: true,
        term_id: GG_ID.PYTHON,
        word: 'PYTHON',
        definition: defEs('PYTHON'),
        cells: cellsOf('PYTHON'),
      },
      play: { status: 'won', state: found(...SEVEN, 'PYTHON'), score: 8 },
      result,
      streaks: { game: { current: 1, max: 1 }, global: { current: 1, max: 1 } },
      game_stats: gameStats,
    });
    const [p] = await sql`SELECT * FROM plays`;
    expect(p).toMatchObject({ status: 'won', score: 8, code_language: null });
    expect(p!.result).not.toBeNull();
    expect(new Date(p!.finished_at as string).toISOString()).toBe('2026-12-01T10:00:00.000Z');
    const [gs] = await sql`SELECT * FROM player_game_stats WHERE game_id = 'grep-grid'`;
    expect(gs).toMatchObject({ current_streak: 1, max_streak: 1, played: 1, wins: 1 });
    expect(gs!.extra).toEqual(gameStats.extra);
    expect((await sql`SELECT * FROM player_stats`)[0]).toMatchObject({
      global_streak: 1,
      max_global_streak: 1,
      total_completed: 1,
    });
    expect(lines().find((l) => l.event === 'PlayFinished')).toMatchObject({
      status: 'won',
      score: 8,
      game_id: 'grep-grid',
    });
    expect(lines().find((l) => l.event === 'StreaksUpdated')).toBeDefined();
    const logs = JSON.stringify(lines());
    expect(logs).not.toContain('definición de');
    expect(logs).not.toContain(JSON.stringify(cellsOf('KERNEL')));

    // TS-20
    const t = await (await ggGet(app, player, '?lang=es')).json();
    expect(t.play).toEqual({
      status: 'won',
      state: found(...SEVEN, 'PYTHON'),
      score: 8,
      code_language: null,
    });
    expect(t.result).toEqual(result);
    expect(t.game_stats).toEqual(gameStats);
    expect(t.public_view.words).toEqual(plainWords);
  });

  it('TS-21 rendirse con 5/8 coincide con grep_grid_give_up', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    const five = ['CACHE', 'DOCKER', 'KERNEL', 'MERGE', 'OAUTH'] as const;
    await seedGrepGridPlay(dbs, challenge.id, player.id, found(...five));
    const { app } = await buildDbApp(dbs);
    const res = await ggMove(app, { type: 'give_up' }, player, '?lang=es');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      feedback: null,
      play: {
        status: 'lost',
        state: { ...found(...five), gave_up: true },
        score: 5,
      },
      result: { win: false, score: 5, gave_up: true, words: ggResultWords('es', [...five]) },
      streaks: { game: { current: 1, max: 1 }, global: { current: 1, max: 1 } },
      game_stats: {
        game_id: 'grep-grid',
        current_streak: 1,
        max_streak: 1,
        played: 1,
        wins: 0,
        win_rate: 0,
        extra: { words_found: { ...INITIAL_EXTRA.words_found, '5': 1 } },
      },
    });
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
  });

  it('TS-22 rendirse con 0/8', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found());
    const { app } = await buildDbApp(dbs);
    const json = await (await ggMove(app, { type: 'give_up' }, player)).json();
    expect(json.play).toEqual({
      status: 'lost',
      state: { found_words: [], gave_up: true },
      score: 0,
    });
    expect(json.result).toMatchObject({ score: 0, gave_up: true });
    expect(json.result.words.every((w: { found: boolean }) => !w.found)).toBe(true);
    expect(json.result.words).toHaveLength(8);
    expect(json.game_stats.extra.words_found['0']).toBe(1);
  });

  it('TS-23 rendirse continúa la racha', async () => {
    await seedGrepGrid(dbs, { date: '2026-11-30', number: 7 });
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'grep-grid',
      currentStreak: 4,
      maxStreak: 4,
      played: 4,
      wins: 2,
      lastCompletedDate: '2026-11-30',
      extra: INITIAL_EXTRA,
    });
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 4,
      maxGlobalStreak: 4,
      lastActiveDate: '2026-11-30',
      totalCompleted: 4,
    });
    await seedGrepGridPlay(dbs, challenge.id, player.id, found('CACHE', 'DOCKER'));
    const { app } = await buildDbApp(dbs);
    const json = await (await ggMove(app, { type: 'give_up' }, player)).json();
    expect(json.streaks).toEqual({ game: { current: 5, max: 5 }, global: { current: 5, max: 5 } });
    expect(json.game_stats).toMatchObject({
      current_streak: 5,
      max_streak: 5,
      played: 5,
      wins: 2,
      win_rate: 0.4,
      extra: { words_found: { ...INITIAL_EXTRA.words_found, '2': 1 } },
    });
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(5);
  });
});

describe('Grep Grid: retomar y cambio de idioma', () => {
  it('TS-24 definiciones solo de las encontradas, en es y en', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    const three = ['DOCKER', 'MERGE', 'REDIS'] as const;
    await seedGrepGridPlay(dbs, challenge.id, player.id, found(...three));
    const { app } = await buildDbApp(dbs);
    for (const [lang, def] of [
      ['es', defEs],
      ['en', defEn],
    ] as const) {
      const res = await ggGet(app, player, `?lang=${lang}`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.public_view.grid).toEqual(GG_PAYLOAD.grid);
      expect(json.public_view.words).toEqual(
        GG_WORDS.map((w) => ({
          term_id: GG_ID[w],
          word: w,
          ...(three.includes(w as never) ? { definition: def(w) } : {}),
        })),
      );
      expect(json.play.state).toEqual(found(...three));
      expect(json.result).toBeNull();
      expect(json.game_stats).toBeNull();
    }
  });
});

describe('Grep Grid: rachas compartidas y /api/today', () => {
  it('TS-27 racha global compartida con Devdle', async () => {
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
    await dbs.insertGameStats({
      playerId: player.id,
      gameId: 'devdle',
      currentStreak: 3,
      maxStreak: 3,
      played: 3,
      wins: 3,
      lastCompletedDate: '2026-12-01',
    });
    await dbs.insertPlayerStats({
      playerId: player.id,
      globalStreak: 3,
      maxGlobalStreak: 3,
      lastActiveDate: '2026-12-01',
      totalCompleted: 10,
    });
    await seedGrepGridPlay(dbs, gg.id, player.id, found(...SEVEN));
    const { app } = await buildDbApp(dbs);
    const json = await (await ggMove(app, selectWord('PYTHON'), player)).json();
    expect(json.streaks).toEqual({ game: { current: 1, max: 1 }, global: { current: 3, max: 3 } });
    expect((await sql`SELECT * FROM player_stats`)[0]).toMatchObject({
      global_streak: 3,
      total_completed: 11,
    });
    expect(
      String((await sql`SELECT last_active_date FROM player_stats`)[0]!.last_active_date),
    ).toContain('2026-12-01');
    const home = await (await app.request('/api/today', { headers: cookie(player.id) })).json();
    expect(home.completed_today).toBe(2);
    expect(home.global_streak).toEqual({ current: 3, max: 3 });
    expect(home.games[1]).toEqual({
      game_id: 'grep-grid',
      challenge_status: 'published',
      play_status: 'won',
      history_label: '8/8',
      current_streak: 1,
    });
    expect(home.games[0].play_status).toBe('won');
  });

  it('TS-28 /api/today con Grep Grid en curso y rendido', async () => {
    const gg = await seedGrepGrid(dbs);
    const a = await dbs.insertPlayer();
    const b = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, gg.id, a.id, found('CACHE'));
    const lostState = { found_words: found('CACHE', 'DOCKER').found_words, gave_up: true };
    await seedGrepGridPlay(dbs, gg.id, b.id, lostState, {
      status: 'lost',
      score: 2,
      result: grepGrid.result(GG_PAYLOAD, lostState, 'es'),
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const { app } = await buildDbApp(dbs);
    const ha = await (await app.request('/api/today', { headers: cookie(a.id) })).json();
    expect(ha.games[1]).toEqual({
      game_id: 'grep-grid',
      challenge_status: 'published',
      play_status: 'in_progress',
      history_label: null,
      current_streak: 0,
    });
    expect(ha.completed_today).toBe(0);
    const hb = await (await app.request('/api/today', { headers: cookie(b.id) })).json();
    expect(hb.games[1]).toMatchObject({ play_status: 'lost', history_label: '2/8' });
    expect(hb.completed_today).toBe(1);
  });
});

describe('Grep Grid: publicación', () => {
  it('TS-29 se publica junto con Devdle', async () => {
    vi.setSystemTime(new Date('2026-12-02T00:00:05Z'));
    const dv = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-02',
      number: 9,
      payload: PAYLOAD,
      status: 'approved',
    });
    const gg = await seedGrepGrid(dbs, { date: '2026-12-02', number: 9, status: 'approved' });
    const { app, lines } = await buildDbApp(dbs);
    const res = await app.request('/api/today');
    expect(res.status).toBe(200);
    const rows = await sql`SELECT status FROM challenges WHERE date = '2026-12-02'`;
    expect(rows.map((r) => r.status)).toEqual(['published', 'published']);
    const body = await res.json();
    expect(body.games[0].challenge_status).toBe('published');
    expect(body.games[1].challenge_status).toBe('published');
    const published = lines().filter((l) => l.event === 'ChallengePublished');
    expect(published).toHaveLength(2);
    expect(published).toContainEqual(
      expect.objectContaining({ challenge_id: gg.id, game_id: 'grep-grid', number: 9 }),
    );
    expect(published).toContainEqual(expect.objectContaining({ challenge_id: dv.id }));
  });

  it('TS-30 día del despliegue sin desafío de Grep Grid', async () => {
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const home = await (await app.request('/api/today')).json();
    expect(home.games[1]).toEqual({
      game_id: 'grep-grid',
      challenge_status: 'none',
      play_status: null,
      history_label: null,
      current_streak: 0,
    });
    const get = await ggGet(app);
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual({
      game_id: 'grep-grid',
      date: '2026-12-01',
      number: 8,
      challenge_status: 'none',
      public_view: null,
      play: null,
      result: null,
      game_stats: null,
      reported: false,
    });
    const start = await ggPost(app, 'start', { challenge_number: 8 }, player);
    expect(start.status).toBe(404);
    expect(await start.json()).toEqual(err('no_challenge_today', 'No hay desafío para hoy.'));
  });
});
