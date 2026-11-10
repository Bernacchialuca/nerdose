import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp } from '../helpers/app';
import { useDatabases } from '../helpers/db';
import {
  SEVEN,
  found,
  ggGet,
  ggMove,
  ggPost,
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
const err = (code: string, message: string) => ({ error: { code, message } });
const GAME_FINISHED = err('game_finished', 'La partida ya terminó.');

async function seedFinished(status: 'won' | 'lost') {
  const challenge = await seedGrepGrid(dbs);
  const player = await dbs.insertPlayer();
  const state =
    status === 'won'
      ? found(...SEVEN, 'PYTHON')
      : { ...found('CACHE', 'DOCKER', 'KERNEL'), gave_up: true };
  await seedGrepGridPlay(dbs, challenge.id, player.id, state, {
    status,
    score: status === 'won' ? 8 : 3,
    result: { win: status === 'won' },
    finishedAt: new Date('2026-12-01T09:00:00Z'),
  });
  return { player, state };
}

describe('Grep Grid: partida terminada', () => {
  for (const [id, status] of [
    ['TS-31', 'won'],
    ['TS-32', 'lost'],
  ] as const) {
    it(`${id} jugadas sobre Play ${status}: 409 game_finished sin cambios`, async () => {
      const { player, state } = await seedFinished(status);
      const { app } = await buildDbApp(dbs);
      for (const move of [selectWord('DOCKER'), { type: 'give_up' }]) {
        const res = await ggMove(app, move, player);
        expect(res.status).toBe(409);
        expect(await res.json()).toEqual(GAME_FINISHED);
      }
      expect((await sql`SELECT state, status FROM plays`)[0]).toMatchObject({ state, status });
      expect(await sql`SELECT 1 FROM player_game_stats`).toHaveLength(0);
      expect(await sql`SELECT 1 FROM player_stats`).toHaveLength(0);
    });
  }

  it('TS-33 reintento de la jugada final', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found(...SEVEN));
    const { app } = await buildDbApp(dbs);
    expect((await ggMove(app, selectWord('PYTHON'), player)).status).toBe(200);
    const again = await ggMove(app, selectWord('PYTHON'), player);
    expect(again.status).toBe(409);
    expect(await again.json()).toEqual(GAME_FINISHED);
    expect((await sql`SELECT played FROM player_game_stats`)[0]!.played).toBe(1);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
  });
});

describe('Grep Grid: concurrencia', () => {
  it('TS-34 dos pestañas envían la octava palabra a la vez', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found(...SEVEN));
    const { app, lines } = await buildDbApp(dbs);
    const res = await Promise.all([
      ggMove(app, selectWord('PYTHON'), player),
      ggMove(app, selectWord('PYTHON'), player),
    ]);
    expect(res.map((r) => r.status).sort()).toEqual([200, 409]);
    const ok = res.find((r) => r.status === 200)!;
    expect((await ok.json()).play.status).toBe('won');
    const [p] = await sql`SELECT state FROM plays`;
    expect((p!.state as { found_words: unknown[] }).found_words).toHaveLength(8);
    const [gs] = await sql`SELECT played, extra FROM player_game_stats`;
    expect(gs!.played).toBe(1);
    expect((gs!.extra as { words_found: Record<string, number> }).words_found['8']).toBe(1);
    expect((await sql`SELECT total_completed FROM player_stats`)[0]!.total_completed).toBe(1);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(1);
  });

  it('TS-35 dos selecciones concurrentes de palabras distintas', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(
      dbs,
      challenge.id,
      player.id,
      found('CACHE', 'DOCKER', 'KERNEL', 'KUBERNETES', 'MERGE'),
    );
    const { app } = await buildDbApp(dbs);
    const res = await Promise.all([
      ggMove(app, selectWord('OAUTH'), player),
      ggMove(app, selectWord('REDIS'), player),
    ]);
    expect(res.map((r) => r.status)).toEqual([200, 200]);
    const counts = (await Promise.all(res.map((r) => r.json()))).map(
      (j) => j.play.state.found_words.length,
    );
    expect(counts.sort()).toEqual([6, 7]);
    const [p] = await sql`SELECT state FROM plays`;
    const ids = (p!.state as { found_words: { term_id: string }[] }).found_words.map(
      (w) => w.term_id,
    );
    expect(ids).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
  });

  it('TS-36 rendirse y octava palabra concurrentes', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found(...SEVEN));
    const { app, lines } = await buildDbApp(dbs);
    const res = await Promise.all([
      ggMove(app, { type: 'give_up' }, player),
      ggMove(app, selectWord('PYTHON'), player),
    ]);
    expect(res.map((r) => r.status).sort()).toEqual([200, 409]);
    const [p] = await sql`SELECT status, score FROM plays`;
    expect(p).toMatchObject(
      p!.status === 'won' ? { status: 'won', score: 8 } : { status: 'lost', score: 7 },
    );
    expect((await sql`SELECT played FROM player_game_stats`)[0]!.played).toBe(1);
    expect(lines().filter((l) => l.event === 'PlayFinished')).toHaveLength(1);
  });
});

describe('Grep Grid: reglas comunes', () => {
  it('TS-37 jugada tardía tras las 00:00 UTC', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found('DOCKER'));
    vi.setSystemTime(new Date('2026-12-02T00:00:05Z'));
    const { app } = await buildDbApp(dbs);
    const res = await ggMove(app, selectWord('MERGE'), player);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(err('challenge_expired', 'El desafío ya venció.'));
    const [p] = await sql`SELECT state, status FROM plays`;
    expect(p).toMatchObject({ status: 'in_progress', state: found('DOCKER') });
  });

  it('TS-38 challenge anulado', async () => {
    await seedGrepGrid(dbs, {
      status: 'voided',
      voidReason: 'wrong_answer',
      voidedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const get = await ggGet(app, player);
    expect(get.status).toBe(200);
    expect(await get.json()).toMatchObject({
      challenge_status: 'voided',
      public_view: null,
      play: null,
      result: null,
      game_stats: null,
    });
    const voided = err('challenge_voided', 'El desafío fue anulado.');
    const start = await ggPost(app, 'start', { challenge_number: 8 }, player);
    expect(start.status).toBe(409);
    expect(await start.json()).toEqual(voided);
    const move = await ggMove(app, selectWord('DOCKER'), player);
    expect(move.status).toBe(409);
    expect(await move.json()).toEqual(voided);
    expect(await sql`SELECT 1 FROM plays`).toHaveLength(0);
  });

  it('TS-39 sin sesión', async () => {
    await seedGrepGrid(dbs);
    const { app } = await buildDbApp(dbs);
    const ghost = { id: '11111111-1111-4111-8111-111111111111' };
    for (const player of [undefined, ghost]) {
      for (const res of [
        await ggPost(app, 'start', { challenge_number: 8 }, player),
        await ggMove(app, selectWord('DOCKER'), player),
      ]) {
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual(err('no_session', 'No hay una sesión activa.'));
      }
    }
    expect(await sql`SELECT 1 FROM plays`).toHaveLength(0);
  });

  it('TS-40 sin desafío de hoy en move', async () => {
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const res = await ggMove(app, { type: 'give_up' }, player);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(err('no_challenge_today', 'No hay desafío para hoy.'));
  });

  it('TS-41 61 jugadas por minuto: la 61.ª es 429', async () => {
    const challenge = await seedGrepGrid(dbs);
    const player = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, player.id, found());
    const { app } = await buildDbApp(dbs);
    const move = { type: 'select', from: { row: 3, col: 2 }, to: { row: 3, col: 5 } };
    for (let i = 0; i < 60; i++) {
      const res = await ggMove(app, move, player);
      expect(res.status).toBe(200);
      expect((await res.json()).feedback.reason).toBe('not_a_word');
    }
    const limited = await ggMove(app, move, player);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual(err('rate_limited', 'Demasiadas solicitudes.'));
    expect(limited.headers.get('retry-after')).not.toBeNull();
    expect((await sql`SELECT state FROM plays`)[0]!.state).toEqual(found());
  });
});
