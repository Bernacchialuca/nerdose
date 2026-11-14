import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { adminAuth, buildDbApp } from '../helpers/app';
import { BO_PAYLOAD } from '../helpers/big-o';
import { PAYLOAD, useDatabases } from '../helpers/db';
import { TL_ID, TL_PAYLOAD } from '../helpers/timeline';

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
type Game = 'devdle' | 'grep-grid' | 'timeline' | 'big-o';
const GAMES: Game[] = ['devdle', 'grep-grid', 'timeline', 'big-o'];

const upcoming = async (query = '') => {
  const { app } = await buildDbApp(dbs);
  return app.request(`/api/admin/challenges/upcoming${query}`, { headers: await adminAuth() });
};
const cell = (body: Json, date: string, game: Game): Json =>
  body.days.find((d: Json) => d.date === date).games.find((g: Json) => g.game_id === game);
const dayStr = (i: number) => new Date(Date.UTC(2026, 11, 1 + i)).toISOString().slice(0, 10);

async function seedWindow() {
  for (const gameId of GAMES) {
    const payload = gameId === 'big-o' ? { payload: BO_PAYLOAD } : {};
    await dbs.insertChallenge({ gameId, date: '2026-12-01', status: 'published', ...payload });
    for (let i = 1; i <= 14; i++) {
      await dbs.insertChallenge({ gameId, date: dayStr(i), status: 'approved', ...payload });
    }
  }
}

describe('GET /api/admin/challenges/upcoming', () => {
  it('TS-1 próximos 14 días sin hoy, un item por juego', async () => {
    await seedWindow();
    const res = await upcoming();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Json;
    expect(body.days).toHaveLength(14);
    expect(body.days[0]).toMatchObject({ date: '2026-12-02', number: 9 });
    expect(body.days[13]).toMatchObject({ date: '2026-12-15', number: 22 });
    expect(body.days.some((d: Json) => d.date === '2026-12-01')).toBe(false);
    for (const d of body.days) {
      expect(d.games.map((g: Json) => g.game_id)).toEqual(GAMES);
      for (const g of d.games) {
        expect(g.challenge.status).toBe('approved');
        expect(g.regeneration).toBeNull();
        expect(g.failure).toBeNull();
      }
    }
    expect(body.active_failures).toBe(0);
  });

  it('TS-2 contenido completo y sin seed', async () => {
    const verification = { ok: true, checks: [{ name: 'in_word_list', ok: true }] };
    const c = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-05',
      status: 'approved',
      payload: PAYLOAD,
      verification,
      generatorVersion: 'devdle@1',
      attempt: 3,
      seed: 'f00dseedcafe',
    });
    await dbs.insertTerm({ id: PAYLOAD.term_id, term: 'MERGE', status: 'approved' });
    const raw = await (await upcoming()).text();
    const body = JSON.parse(raw) as Json;
    expect(cell(body, '2026-12-05', 'devdle').challenge).toEqual({
      id: c.id,
      status: 'approved',
      payload: PAYLOAD,
      verification,
      generator_version: 'devdle@1',
      attempt: 3,
      rejected_items: [],
    });
    expect(raw).not.toContain('"seed"');
    expect(raw).not.toContain('f00dseedcafe');
  });

  it('TS-3 days acota la ventana', async () => {
    await seedWindow();
    const body = (await (await upcoming('?days=3')).json()) as Json;
    expect(body.days.map((d: Json) => d.date)).toEqual(['2026-12-02', '2026-12-03', '2026-12-04']);
  });

  it('TS-4 solo approved', async () => {
    await dbs.insertChallenge({
      gameId: 'grep-grid',
      date: '2026-12-03',
      status: 'rejected',
      attempt: 0,
    });
    await dbs.insertChallenge({
      gameId: 'grep-grid',
      date: '2026-12-03',
      status: 'draft',
      attempt: 1,
    });
    await dbs.insertChallenge({ gameId: 'timeline', date: '2026-12-03', status: 'rejected' });
    await dbs.insertChallenge({
      gameId: 'timeline',
      date: '2026-12-03',
      status: 'approved',
      attempt: 2,
    });
    const body = (await (await upcoming('?days=2')).json()) as Json;
    expect(cell(body, '2026-12-03', 'grep-grid')).toEqual({
      game_id: 'grep-grid',
      challenge: null,
      regeneration: null,
      failure: null,
    });
    expect(cell(body, '2026-12-03', 'timeline').challenge).toMatchObject({
      attempt: 2,
      status: 'approved',
    });
  });

  it('TS-5 falla registrada sin challenge', async () => {
    await dbs.insertGenerationFailure({
      gameId: 'grep-grid',
      date: '2026-12-03',
      attempts: 20,
      lastReason: 'grid_unsolvable',
    });
    const body = (await (await upcoming()).json()) as Json;
    expect(cell(body, '2026-12-03', 'grep-grid')).toEqual({
      game_id: 'grep-grid',
      challenge: null,
      regeneration: null,
      failure: {
        attempts: 20,
        last_reason: 'grid_unsolvable',
        updated_at: expect.stringMatching(/Z$/),
      },
    });
    expect(body.active_failures).toBe(1);
  });

  it('TS-6 la falla deja de estar activa con un challenge vigente', async () => {
    await dbs.insertGenerationFailure({
      gameId: 'devdle',
      date: '2026-12-02',
      attempts: 20,
      lastReason: 'no_candidate',
    });
    await dbs.insertChallenge({ gameId: 'devdle', date: '2026-12-02', status: 'approved' });
    const body = (await (await upcoming()).json()) as Json;
    const c = cell(body, '2026-12-02', 'devdle');
    expect(c.challenge).not.toBeNull();
    expect(c.failure).toBeNull();
    expect(body.active_failures).toBe(0);
    expect(await dbs.owner.sql`SELECT 1 FROM generation_failures`).toHaveLength(1);
  });

  it('TS-7 fallas fuera de la ventana', async () => {
    for (const date of ['2026-12-01', '2026-11-30', '2026-12-16']) {
      await dbs.insertGenerationFailure({ gameId: 'devdle', date, attempts: 1, lastReason: 'x' });
    }
    const body = (await (await upcoming()).json()) as Json;
    expect(body.active_failures).toBe(0);
    expect(body.days.every((d: Json) => d.games.every((g: Json) => g.failure === null))).toBe(true);
  });

  it('TS-8 active_failures usa la ventana fija de 14 días', async () => {
    await dbs.insertGenerationFailure({
      gameId: 'timeline',
      date: '2026-12-10',
      attempts: 1,
      lastReason: 'x',
    });
    const body = (await (await upcoming('?days=3')).json()) as Json;
    expect(body.days).toHaveLength(3);
    expect(body.days.every((d: Json) => d.games.every((g: Json) => g.failure === null))).toBe(true);
    expect(body.active_failures).toBe(1);
  });

  it('TS-9 regeneración pendiente', async () => {
    const c = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-05',
      status: 'approved',
    });
    const r = await dbs.insertGenerationRequest({
      challengeId: c.id,
      status: 'pending',
      requestedAt: new Date('2026-12-01T09:00:00Z'),
    });
    const body = (await (await upcoming()).json()) as Json;
    expect(cell(body, '2026-12-05', 'devdle').regeneration).toEqual({
      request_id: r.id,
      status: 'pending',
      error: null,
      requested_at: '2026-12-01T09:00:00.000Z',
      processed_at: null,
    });
  });

  it('TS-10 último pedido fallido', async () => {
    const c = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-05',
      status: 'approved',
    });
    await dbs.insertGenerationRequest({
      challengeId: c.id,
      status: 'cancelled',
      requestedAt: new Date('2026-11-30T08:00:00Z'),
      processedAt: new Date('2026-11-30T08:01:00Z'),
    });
    const failed = await dbs.insertGenerationRequest({
      challengeId: c.id,
      status: 'failed',
      error: 'no_valid_candidate',
      requestedAt: new Date('2026-12-01T08:00:00Z'),
      processedAt: new Date('2026-12-01T08:05:00Z'),
    });
    const body = (await (await upcoming()).json()) as Json;
    expect(cell(body, '2026-12-05', 'devdle').regeneration).toEqual({
      request_id: failed.id,
      status: 'failed',
      error: 'no_valid_candidate',
      requested_at: '2026-12-01T08:00:00.000Z',
      processed_at: '2026-12-01T08:05:00.000Z',
    });
  });

  it('TS-11 último pedido cancelled o done → null', async () => {
    const c1 = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-05',
      status: 'approved',
    });
    const c2 = await dbs.insertChallenge({
      gameId: 'grep-grid',
      date: '2026-12-05',
      status: 'approved',
    });
    await dbs.insertGenerationRequest({
      challengeId: c1.id,
      status: 'failed',
      error: 'e',
      requestedAt: new Date('2026-12-01T09:00:00Z'),
      processedAt: new Date('2026-12-01T09:01:00Z'),
    });
    await dbs.insertGenerationRequest({
      challengeId: c1.id,
      status: 'cancelled',
      requestedAt: new Date('2026-12-01T09:30:00Z'),
      processedAt: new Date('2026-12-01T09:31:00Z'),
    });
    await dbs.insertGenerationRequest({
      challengeId: c2.id,
      status: 'done',
      newChallengeId: c1.id,
      processedAt: new Date('2026-12-01T09:31:00Z'),
    });
    const body = (await (await upcoming()).json()) as Json;
    expect(cell(body, '2026-12-05', 'devdle').regeneration).toBeNull();
    expect(cell(body, '2026-12-05', 'grep-grid').regeneration).toBeNull();
  });

  it('TS-12 ítems rechazados', async () => {
    await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-06',
      status: 'approved',
      payload: PAYLOAD,
    });
    await dbs.insertTerm({
      id: PAYLOAD.term_id,
      term: 'MERGE',
      status: 'rejected',
      rejectionReason: 'Definición incorrecta',
    });
    await dbs.insertChallenge({
      gameId: 'timeline',
      date: '2026-12-06',
      status: 'approved',
      payload: TL_PAYLOAD,
    });
    for (const [name, id] of Object.entries(TL_ID)) {
      await dbs.insertTimelineFact(
        name === 'JAVA'
          ? { id, label: 'Java', status: 'rejected', rejectionReason: 'disputed_date' }
          : { id, label: name },
      );
    }
    await dbs.insertChallenge({ gameId: 'grep-grid', date: '2026-12-06', status: 'approved' });
    const body = (await (await upcoming()).json()) as Json;
    expect(cell(body, '2026-12-06', 'devdle').challenge.rejected_items).toEqual([
      {
        kind: 'term',
        id: PAYLOAD.term_id,
        label: 'MERGE',
        rejection_reason: 'Definición incorrecta',
      },
    ]);
    expect(cell(body, '2026-12-06', 'timeline').challenge.rejected_items).toEqual([
      { kind: 'timeline_fact', id: TL_ID.JAVA, label: 'Java', rejection_reason: 'disputed_date' },
    ]);
  });

  it('TS-13 juego fuera del registry', async () => {
    await dbs.insertChallenge({ gameId: 'bug-hunt', date: '2026-12-02', status: 'approved' });
    const res = await upcoming();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Json;
    expect(body.days[0].games).toHaveLength(4);
    expect(body.days[0].games.some((g: Json) => g.game_id === 'bug-hunt')).toBe(false);
  });

  it('TS-14 antes del lanzamiento', async () => {
    vi.setSystemTime(new Date('2026-11-20T10:00:00Z'));
    const body = (await (await upcoming()).json()) as Json;
    expect(body.days).toHaveLength(11);
    expect(body.days[0]).toMatchObject({ date: '2026-11-24', number: 1 });
    expect(body.days[10].date).toBe('2026-12-04');
  });

  it('TS-15 days inválido → 422', async () => {
    for (const q of ['0', '15', 'abc', '2.5']) {
      const res = await upcoming(`?days=${q}`);
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({
        error: { code: 'validation_error', message: 'Datos inválidos.' },
      });
    }
  });
});
