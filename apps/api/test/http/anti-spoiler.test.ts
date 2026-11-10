import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { scoreGuess } from '@nerdose/game-devdle/definition';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { CATS, PAYLOAD, useDatabases } from '../helpers/db';
import {
  GG_WORDS,
  cellsOf,
  defEn,
  defEs,
  found,
  ggGet,
  ggMove,
  ggPost,
  seedGrepGrid,
  seedGrepGridPlay,
  selectWord,
  type GGWord,
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

const FORBIDDEN_VALUES = [
  'MERGE',
  PAYLOAD.term_id,
  'Combinar los cambios',
  'Combine the changes',
  'Operación de Git',
  'Git operation',
];
const FORBIDDEN_KEYS = ['word', 'category', 'definition', 'summary', 'term_id', 'payload'];

function assertNoSpoiler(raw: string) {
  for (const v of FORBIDDEN_VALUES) expect(raw).not.toContain(v);
  for (const k of FORBIDDEN_KEYS) expect(raw).not.toContain(`"${k}":`);
}

describe('TS-18 anti-spoiler de la api (Devdle)', () => {
  it('ninguna respuesta previa al cierre contiene la solución', async () => {
    const challenge = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const fresh = await dbs.insertPlayer();
    const playing = await dbs.insertPlayer();
    await dbs.insertPlay({
      playerId: playing.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [{ guess: 'REACT', marks: scoreGuess('MERGE', 'REACT') }] },
    });
    const { app } = await buildDbApp(dbs);

    const bodies: string[] = [];
    for (const headers of <Array<Record<string, string>>>[
      {},
      { Cookie: `nd_pid=${fresh.id}` },
      { Cookie: `nd_pid=${playing.id}` },
    ]) {
      for (const lang of ['es', 'en']) {
        const res = await app.request(`/api/games/devdle/today?lang=${lang}`, { headers });
        expect(res.status).toBe(200);
        const raw = await res.text();
        expect(JSON.parse(raw).public_view).toEqual({ length: 5, possible_categories: CATS });
        bodies.push(raw);
      }
    }
    const started = await app.request('/api/games/devdle/today/start', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${fresh.id}` },
      body: JSON.stringify({ challenge_number: 8 }),
    });
    expect(started.status).toBe(200);
    bodies.push(await started.text());

    const today = await app.request('/api/today', { headers: { Cookie: `nd_pid=${playing.id}` } });
    bodies.push(await today.text());

    for (const raw of bodies) assertNoSpoiler(raw);
  });
});

describe('TS-42 anti-spoiler de move (Devdle)', () => {
  it('ninguna respuesta de move previa al cierre contiene la solución', async () => {
    const challenge = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    const fresh = await dbs.insertPlayer();
    const playing = await dbs.insertPlayer();
    const done = await dbs.insertPlayer();
    const react = { guess: 'REACT', marks: scoreGuess('MERGE', 'REACT') };
    await dbs.insertPlay({
      playerId: playing.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [react] },
    });
    await dbs.insertPlay({
      playerId: done.id,
      challengeId: challenge.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [react] },
      status: 'lost',
      score: 6,
      result: { win: false },
      finishedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const { app } = await buildDbApp(dbs);
    const move = (player: { id: string }, payload: unknown, lang = 'es') =>
      app.request(`/api/games/devdle/today/move?lang=${lang}`, {
        method: 'POST',
        headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${player.id}` },
        body: JSON.stringify(payload),
      });
    const ok = (w: string) => ({ challenge_number: 8, move: { guess: w } });

    const bodies: string[] = [];
    for (const lang of ['es', 'en']) {
      const first = await move(fresh, ok('REACT'), lang);
      expect(first.status).toBe(200);
      const raw = await first.text();
      expect(Object.keys(JSON.parse(raw).feedback).sort()).toEqual(['guess', 'marks']);
      bodies.push(raw);
      bodies.push(await (await move(playing, ok('CACHE'), lang)).text());
      bodies.push(await (await move(playing, ok('ZZZZZ'), lang)).text());
      bodies.push(await (await move(playing, ok('REACTS'), lang)).text());
      bodies.push(await (await move(playing, { challenge_number: 8, move: {} }, lang)).text());
      bodies.push(await (await move(done, ok('REACT'), lang)).text());
      bodies.push(
        await (await move(playing, { challenge_number: 7, move: { guess: 'REACT' } }, lang)).text(),
      );
    }
    for (const raw of bodies) assertNoSpoiler(raw);

    await dbs.owner
      .sql`UPDATE challenges SET status = 'voided', void_reason = 'wrong_answer', voided_at = now()`;
    const { app: voidedApp } = await buildDbApp(dbs);
    const res = await voidedApp.request('/api/games/devdle/today/move', {
      method: 'POST',
      headers: { ...MUTATION_HEADERS, Cookie: `nd_pid=${playing.id}` },
      body: JSON.stringify(ok('CACHE')),
    });
    expect(res.status).toBe(409);
    assertNoSpoiler(await res.text());
  });
});

const GG_FORBIDDEN_KEYS = ['placements', 'direction', 'from', 'to', 'payload'];

function assertNoGrepGridSpoiler(raw: string, hidden: GGWord[]) {
  for (const w of hidden) {
    expect(raw).not.toContain(defEs(w));
    expect(raw).not.toContain(defEn(w));
    expect(raw).not.toContain(JSON.stringify(cellsOf(w)));
  }
  for (const k of GG_FORBIDDEN_KEYS) expect(raw).not.toContain(`"${k}":`);
}

describe('anti-spoiler de la api (Grep Grid)', () => {
  const three: GGWord[] = ['DOCKER', 'MERGE', 'REDIS'];
  const rest = GG_WORDS.filter((w) => !three.includes(w));

  it('TS-42 today y start no revelan definiciones ni posiciones ocultas', async () => {
    const challenge = await seedGrepGrid(dbs);
    const fresh = await dbs.insertPlayer();
    const playing = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, playing.id, found(...three));
    const { app } = await buildDbApp(dbs);

    const bodies: Array<{ raw: string; hidden: GGWord[] }> = [];
    const push = async (res: Response | Promise<Response>, hidden: GGWord[]) => {
      const r = await res;
      expect(r.status).toBe(200);
      bodies.push({ raw: await r.text(), hidden });
    };
    for (const lang of ['?lang=es', '?lang=en']) {
      await push(ggGet(app, undefined, lang), GG_WORDS);
      await push(ggGet(app, fresh, lang), GG_WORDS);
      await push(ggGet(app, playing, lang), rest);
    }
    await push(ggPost(app, 'start', { challenge_number: 8 }, fresh), GG_WORDS);
    // toPublic con el estado inicial recién creado
    await push(ggGet(app, fresh, '?lang=es'), GG_WORDS);
    const home = await app.request('/api/today', { headers: { Cookie: `nd_pid=${playing.id}` } });
    bodies.push({ raw: await home.text(), hidden: rest });

    for (const { raw, hidden } of bodies) assertNoGrepGridSpoiler(raw, hidden);
    // Sin palabras encontradas (A sin jugador, B en ambos idiomas, su start y el GET posterior):
    // ninguna definición, en ningún idioma.
    const noneFound = bodies.filter(({ hidden }) => hidden === GG_WORDS);
    expect(noneFound).toHaveLength(6);
    for (const { raw } of noneFound) {
      expect(raw).not.toContain('definición de');
      expect(raw).not.toContain('definition of');
    }
  });

  it('TS-43 las respuestas de move previas al cierre no revelan lo no encontrado', async () => {
    const challenge = await seedGrepGrid(dbs);
    const hiddenOf = (...ws: GGWord[]) => GG_WORDS.filter((w) => !ws.includes(w));
    const c = await dbs.insertPlayer();
    const d = await dbs.insertPlayer();
    const finder = await dbs.insertPlayer();
    await seedGrepGridPlay(dbs, challenge.id, c.id, found(...three));
    await seedGrepGridPlay(dbs, challenge.id, finder.id, found(...three));
    await seedGrepGridPlay(
      dbs,
      challenge.id,
      d.id,
      { ...found('CACHE'), gave_up: true },
      {
        status: 'lost',
        score: 1,
        result: {},
        finishedAt: new Date('2026-12-01T09:00:00Z'),
      },
    );
    const { app } = await buildDbApp(dbs);

    const check = async (res: Response, hidden: GGWord[]) => {
      assertNoGrepGridSpoiler(await res.text(), hidden);
    };
    for (const lang of ['?lang=es', '?lang=en']) {
      // la respuesta que encuentra CACHE puede traer su definición y sus celdas
      await check(
        await ggMove(app, selectWord('CACHE'), finder, lang),
        hiddenOf(...three, 'CACHE'),
      );
      await check(
        await ggMove(
          app,
          { type: 'select', from: { row: 3, col: 2 }, to: { row: 3, col: 5 } },
          c,
          lang,
        ),
        rest,
      );
      await check(await ggMove(app, selectWord('DOCKER'), c, lang), rest);
      await check(
        await ggMove(
          app,
          { type: 'select', from: { row: 3, col: 7 }, to: { row: 3, col: 2 } },
          c,
          lang,
        ),
        rest,
      );
      await check(
        await ggMove(
          app,
          { type: 'select', from: { row: 0, col: 0 }, to: { row: 1, col: 2 } },
          c,
          lang,
        ),
        rest,
      );
      await check(
        await ggMove(
          app,
          { type: 'select', from: { row: 0, col: 0 }, to: { row: 0, col: 12 } },
          c,
          lang,
        ),
        rest,
      );
      await check(await ggMove(app, selectWord('KERNEL'), c, lang, 7), rest);
      await check(await ggMove(app, selectWord('KERNEL'), d, lang), hiddenOf('CACHE'));
    }
    await dbs.owner
      .sql`UPDATE challenges SET status = 'voided', void_reason = 'wrong_answer', voided_at = now()`;
    const { app: voidedApp } = await buildDbApp(dbs);
    const res = await ggMove(voidedApp, selectWord('KERNEL'), c);
    expect(res.status).toBe(409);
    await check(res, rest);
  });
});
