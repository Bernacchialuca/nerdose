import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDbApp, MUTATION_HEADERS } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';
import { GG_PAYLOAD, seedGrepGrid } from '../helpers/grep-grid';
import { TL_PAYLOAD, seedTimeline } from '../helpers/timeline';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(async () => {
  await dbs.reset();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-01T10:00:00Z'));
});
afterEach(() => vi.useRealTimers());
afterAll(() => dbs.close());

const FUTURE_ID = 'aaaaaaaa-0000-4000-8000-00000000f001';
const KEYS = ['"payload":', '"verification":', '"seed":'];

describe('TS-41 anti-spoiler de futuros (Devdle)', () => {
  it('ninguna respuesta incluye el desafío de mañana', async () => {
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      status: 'published',
      payload: PAYLOAD,
    });
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-02',
      number: 9,
      status: 'approved',
      payload: {
        term_id: FUTURE_ID,
        word: 'REDIS',
        category: 'databases',
        definition: {
          es: 'Almacén clave-valor en memoria futuro',
          en: 'Future in-memory key-value store',
        },
        summary: { es: 'Resumen futuro', en: 'Future summary' },
        date: '2026-12-02',
      },
      verification: { ok: true, checks: [], marker: 'VERIF-FUTURE-MARKER' },
    });
    const player = await dbs.insertPlayer();
    const { app } = await buildDbApp(dbs);
    const headers = { ...MUTATION_HEADERS, Cookie: `nd_pid=${player.id}` };
    const responses = [
      await app.request('/api/today', { headers: { Cookie: `nd_pid=${player.id}` } }),
      await app.request('/api/games/devdle/today', { headers: { Cookie: `nd_pid=${player.id}` } }),
      await app.request('/api/games/devdle/today/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ challenge_number: 8 }),
      }),
      await app.request('/api/games/devdle/today/move', {
        method: 'POST',
        headers,
        body: JSON.stringify({ challenge_number: 8, move: { guess: 'CACHE' } }),
      }),
    ];
    for (const res of responses) {
      const raw = await res.text();
      for (const v of [
        'REDIS',
        FUTURE_ID,
        'Almacén clave-valor en memoria futuro',
        'Future in-memory key-value store',
        'VERIF-FUTURE-MARKER',
        ...KEYS,
      ]) {
        expect(raw).not.toContain(v);
      }
    }
  });
});

describe('TS-42 anti-spoiler de futuros (Grep Grid y Timeline sin desafío hoy)', () => {
  it('challenge_status none y nada de la solución', async () => {
    await seedGrepGrid(dbs, {
      date: '2026-12-02',
      number: 9,
      status: 'approved',
      payload: GG_PAYLOAD,
    });
    await seedTimeline(dbs, {
      date: '2026-12-02',
      number: 9,
      status: 'approved',
      payload: TL_PAYLOAD,
    });
    const { app } = await buildDbApp(dbs);
    const gg = await app.request('/api/games/grep-grid/today');
    const tl = await app.request('/api/games/timeline/today');
    const today = await app.request('/api/today');
    // Sin desafío publicado hoy el endpoint responde `challenge_status: 'none'` (no 404).
    for (const res of [gg, tl]) {
      expect(res.status).toBe(200);
      const raw = await res.clone().text();
      expect(((await res.json()) as { challenge_status: string }).challenge_status).toBe('none');
      for (const v of [
        '"placements"',
        '"correct_order"',
        '"fact_id"',
        '"event_date"',
        '00000000-0000-4000-8000-000000000001',
        ...KEYS,
      ]) {
        expect(raw).not.toContain(v);
      }
    }
    const body = (await today.json()) as {
      games: Array<{ game_id: string; challenge_status: string }>;
    };
    for (const id of ['grep-grid', 'timeline']) {
      expect(body.games.find((g) => g.game_id === id)?.challenge_status).toBe('none');
    }
    const raw = JSON.stringify(body);
    for (const v of [
      '"placements"',
      '"correct_order"',
      '"fact_id"',
      '"event_date"',
      '00000000-0000-4000-8000-000000000001',
      ...KEYS,
    ]) {
      expect(raw).not.toContain(v);
    }
  });
});
