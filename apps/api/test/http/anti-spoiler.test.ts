import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { scoreGuess } from '@nerdose/game-devdle/definition';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import {
  BO_FORBIDDEN,
  WON_JAVA,
  boGet,
  boMove,
  boPost,
  seedBigO,
  seedBigOPlay,
} from '../helpers/big-o';
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
import {
  CORRECT,
  SWAP,
  TL_FORBIDDEN,
  seedTimeline,
  seedTimelinePlay,
  tlGet,
  tlMove,
  tlPost,
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

function assertNoTimelineSpoiler(raw: string) {
  for (const v of TL_FORBIDDEN) expect(raw).not.toContain(v);
}

describe('anti-spoiler de la api (Timeline)', () => {
  const LANGS = ['?lang=es', '?lang=en'];
  const FOREIGN = ['p7k2m9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'zzzzzz'];
  const UPPER = ['P7K2M9', 'j4x8q1', 'g2n5w3', 'd9r6t0', 'k1v3s8'];

  it('TS-35 today, start y /api/today no contienen la solución', async () => {
    await seedTimeline(dbs);
    const a = undefined;
    const b = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const bodies: string[] = [];
    const grab = async (res: Response | Promise<Response>) => {
      const r = await res;
      expect(r.status).toBe(200);
      bodies.push(await r.text());
    };
    for (const q of LANGS) {
      await grab(tlGet(app, a, q));
      await grab(tlGet(app, b, q));
    }
    await grab(tlPost(app, 'start', { challenge_number: 8 }, b));
    for (const q of LANGS) await grab(tlGet(app, b, q));
    await grab(app.request('/api/today', { headers: { Cookie: `nd_pid=${b.id}` } }));
    expect(bodies.length).toBeGreaterThan(0);
    for (const raw of bodies) assertNoTimelineSpoiler(raw);
  });

  it('TS-36 las respuestas de move previas al cierre no contienen la solución', async () => {
    const challenge = await seedTimeline(dbs);
    const b = await dbs.insertPlayer();
    await seedTimelinePlay(dbs, challenge.id, b.id, {});
    const { app } = await buildDbApp(dbs);
    const bodies: string[] = [];
    for (const q of LANGS) {
      for (const move of [
        { order: CORRECT.slice(0, 4) },
        { order: ['p7k2m9', 'p7k2m9', 'g2n5w3', 'd9r6t0', 'k1v3s8'] },
        { order: [...CORRECT, 'x00000'] },
        { order: [1, 2, 3, 4, 5] },
        {},
        { order: CORRECT, extra: 1 },
        { guess: 'REACT' },
        { order: FOREIGN },
        { order: UPPER },
      ]) {
        const res = await tlMove(app, move, b, q);
        expect(res.status).toBe(422);
        bodies.push(await res.text());
      }
      const late = await tlMove(app, SWAP, b, q, 7);
      expect(late.status).toBe(409);
      expect((await late.clone().json()).error.code).toBe('challenge_expired');
      bodies.push(await late.text());
      const anon = await tlMove(app, SWAP, undefined, q);
      expect(anon.status).toBe(401);
      bodies.push(await anon.text());
    }
    for (const raw of bodies) assertNoTimelineSpoiler(raw);
  });

  it('TS-36 challenge anulado no filtra la solución', async () => {
    await seedTimeline(dbs, {
      status: 'voided',
      voidReason: 'wrong_answer',
      voidedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const b = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    for (const res of [
      await tlGet(app, b),
      await tlPost(app, 'start', { challenge_number: 8 }, b),
      await tlMove(app, SWAP, b),
    ]) {
      assertNoTimelineSpoiler(await res.text());
    }
  });

  it('TS-37 los logs no contienen la solución', async () => {
    const challenge = await seedTimeline(dbs);
    const b = await dbs.insertPlayer();
    const { app, lines } = await buildDbApp(dbs);
    await tlPost(app, 'start', { challenge_number: 8 }, b);
    await tlMove(app, CORRECT.slice(0, 4), b);
    await tlMove(app, FOREIGN, b);
    expect((await tlMove(app, SWAP, b)).status).toBe(200);
    const logs = JSON.stringify(lines());
    for (const bad of [
      'nota de ',
      'note on ',
      '1991-02-20',
      '2014-06-01',
      '"correct_order"',
      '"result"',
    ]) {
      expect(logs).not.toContain(bad);
    }
    const finished = lines().filter((l) => l.event === 'PlayFinished');
    expect(finished).toHaveLength(1);
    for (const k of ['play_id', 'player_id', 'challenge_id', 'game_id', 'status', 'score']) {
      expect(finished[0]).toHaveProperty(k);
    }
    for (const k of ['result', 'state', 'order', 'payload']) {
      expect(finished[0]).not.toHaveProperty(k);
    }
    expect(finished[0]).toMatchObject({ challenge_id: challenge.id, game_id: 'timeline' });
  });
});

describe('anti-spoiler de la api (Big O)', () => {
  const LANGS = ['?lang=es', '?lang=en'];
  const INVALID: unknown[] = [
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

  function assertNoBigOSpoiler(raw: string) {
    for (const bad of BO_FORBIDDEN) expect(raw).not.toContain(bad);
  }

  it('TS-33 today, start y /api/today no contienen la solución', async () => {
    await seedBigO(dbs);
    const b = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const bodies: string[] = [];
    const grab = async (res: Response | Promise<Response>) => {
      const r = await res;
      expect(r.status).toBe(200);
      bodies.push(await r.text());
    };
    for (const q of LANGS) {
      await grab(boGet(app, undefined, q));
      await grab(boGet(app, b, q));
    }
    await grab(boPost(app, 'start', { challenge_number: 8 }, b));
    for (const q of LANGS) await grab(boGet(app, b, q));
    await grab(app.request('/api/today', { headers: { Cookie: `nd_pid=${b.id}` } }));
    expect(bodies.length).toBeGreaterThan(0);
    for (const raw of bodies) assertNoBigOSpoiler(raw);
  });

  it('TS-34 las respuestas de move previas al cierre no contienen la solución', async () => {
    const challenge = await seedBigO(dbs);
    const b = await dbs.insertPlayer();
    await seedBigOPlay(dbs, challenge.id, b.id, {});
    const { app } = await buildDbApp(dbs);
    const bodies: string[] = [];
    for (const q of LANGS) {
      for (const move of INVALID) {
        const res = await boMove(app, move, b, q);
        expect(res.status).toBe(422);
        bodies.push(await res.text());
      }
      const late = await boMove(app, WON_JAVA, b, q, 7);
      expect(late.status).toBe(409);
      expect((await late.clone().json()).error.code).toBe('challenge_expired');
      bodies.push(await late.text());
      const anon = await boMove(app, WON_JAVA, undefined, q);
      expect(anon.status).toBe(401);
      bodies.push(await anon.text());
    }
    for (const raw of bodies) assertNoBigOSpoiler(raw);
    const [p] = await dbs.owner.sql`SELECT status, state FROM plays`;
    expect(p).toEqual({ status: 'in_progress', state: {} });
  });

  it('TS-35 desafío anulado no filtra la solución', async () => {
    await seedBigO(dbs, {
      status: 'voided',
      voidReason: 'wrong_answer',
      voidedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const b = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    for (const res of [
      await boGet(app, b),
      await boPost(app, 'start', { challenge_number: 8 }, b),
      await boMove(app, WON_JAVA, b),
    ]) {
      assertNoBigOSpoiler(await res.text());
    }
  });

  it('TS-36 los logs no contienen la solución', async () => {
    const challenge = await seedBigO(dbs);
    const b = await dbs.insertPlayer();
    const { app, lines } = await buildDbApp(dbs);
    await boPost(app, 'start', { challenge_number: 8 }, b);
    await boMove(app, { language: 'rust', option: 'o_n' }, b);
    await boMove(app, {}, b);
    expect((await boMove(app, WON_JAVA, b)).status).toBe(200);
    const logs = JSON.stringify(lines());
    for (const bad of [
      'El loop externo',
      'The outer loop',
      'nest(linear,doubling)',
      'nested_loops',
      '"explanation"',
      '"result"',
    ]) {
      expect(logs).not.toContain(bad);
    }
    const finished = lines().filter((l) => l.event === 'PlayFinished');
    expect(finished).toHaveLength(1);
    for (const k of ['play_id', 'player_id', 'challenge_id', 'game_id', 'status', 'score']) {
      expect(finished[0]).toHaveProperty(k);
    }
    for (const k of ['result', 'state', 'option', 'payload']) {
      expect(finished[0]).not.toHaveProperty(k);
    }
    expect(finished[0]).toMatchObject({ challenge_id: challenge.id, game_id: 'big-o' });
  });
});

describe('anti-spoiler: anulación y reportes (S-031)', () => {
  it('today voided sin Play, report y acknowledge-void no filtran la solución', async () => {
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'voided',
      voidReason: 'x',
      voidedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const h = { ...MUTATION_HEADERS, Cookie: `nd_pid=${player.id}` };

    const bodies = [
      await (await app.request('/api/games/devdle/today')).text(),
      await (await app.request('/api/games/devdle/today', { headers: h })).text(),
    ];
    const report = await app.request('/api/games/devdle/today/report', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ challenge_number: 8, reason: 'wrong_answer' }),
    });
    expect(report.status).toBe(201);
    bodies.push(await report.text());
    const ack = await app.request('/api/games/devdle/today/acknowledge-void', {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ challenge_number: 8 }),
    });
    expect(ack.status).toBe(200);
    bodies.push(await ack.text());
    bodies.push(await (await app.request('/api/games/devdle/today', { headers: h })).text());
    for (const raw of bodies) assertNoSpoiler(raw);
  });
});
