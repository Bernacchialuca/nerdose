import { createHash } from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { playerRef } from '@/domain/admin/admin.service';

import { adminAuth, ADMIN_HEADERS, buildDbApp } from '../helpers/app';
import { PAYLOAD, useDatabases } from '../helpers/db';
import { GG_PAYLOAD } from '../helpers/grep-grid';
import { registryWithoutBugHunt } from '../helpers/registries';
import { TL_PAYLOAD } from '../helpers/timeline';

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
const VERIFICATION = { ok: true, checks: [] };

async function seedReports(
  challenge: Awaited<ReturnType<typeof dbs.insertChallenge>>,
  n: number,
  extra: Partial<Parameters<typeof dbs.insertReport>[0]> = {},
) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const player = await dbs.insertPlayer();
    out.push(await dbs.insertReport({ challengeId: challenge.id, playerId: player.id, ...extra }));
  }
  return out;
}

async function seedTs12() {
  const a = await dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-11-28',
    number: 5,
    payload: PAYLOAD,
    verification: VERIFICATION,
    alertedAt: new Date('2026-11-29T10:00:00Z'),
  });
  const b = await dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-11-29',
    number: 6,
    payload: PAYLOAD,
    verification: VERIFICATION,
  });
  const c = await dbs.insertChallenge({
    gameId: 'devdle',
    date: '2026-11-30',
    number: 7,
    payload: PAYLOAD,
    verification: VERIFICATION,
  });
  const d = await dbs.insertChallenge({
    gameId: 'grep-grid',
    date: '2026-12-01',
    number: 8,
    payload: GG_PAYLOAD,
    verification: VERIFICATION,
  });
  await seedReports(a, 3);
  await seedReports(b, 5);
  await seedReports(b, 1, { status: 'resolved' });
  await seedReports(c, 2);
  await seedReports(d, 2);
  return { a, b, c, d };
}

const list = async (
  app: { request: (u: string, i?: RequestInit) => Response | Promise<Response> },
  query = '',
) => app.request(`/api/admin/reports${query}`, { headers: await adminAuth() });

describe('GET /api/admin/reports', () => {
  it('TS-12 agrupa y ordena: alertado, cantidad, fecha', async () => {
    const { a, b, c, d } = await seedTs12();
    const { app } = await buildDbApp(dbs);
    const res = await list(app);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { groups: Json[] };
    expect(body.groups.map((g) => g.challenge.id)).toEqual([a.id, b.id, d.id, c.id]);
    const gb = body.groups[1]!;
    expect(gb.report_count).toBe(5);
    expect(gb.reasons).toEqual({ wrong_answer: 5 });
    expect(gb.reports).toHaveLength(5);
    expect(gb.reports.every((r: Json) => r.status === 'open')).toBe(true);
    expect(typeof body.groups[0]!.alerted_at).toBe('string');
    expect(body.groups.slice(1).every((g) => g.alerted_at === null)).toBe(true);
  });

  it('TS-13 forma del challenge con culprits por juego', async () => {
    const { a, d } = await seedTs12();
    const tl = await dbs.insertChallenge({
      gameId: 'timeline',
      date: '2026-11-27',
      number: 4,
      payload: TL_PAYLOAD,
      verification: VERIFICATION,
    });
    await seedReports(tl, 1);
    const { app } = await buildDbApp(dbs);
    const body = (await (await list(app)).json()) as { groups: Json[] };
    const byId = (id: string) => body.groups.find((g) => g.challenge.id === id)!.challenge;
    expect(byId(a.id)).toEqual({
      id: a.id,
      game_id: 'devdle',
      date: '2026-11-28',
      number: 5,
      status: 'published',
      payload: PAYLOAD,
      verification: VERIFICATION,
      void_reason: null,
      voided_at: null,
      culprits: [{ kind: 'term', id: PAYLOAD.term_id, label: 'MERGE' }],
    });
    expect(byId(d.id).culprits).toHaveLength(8);
    expect(byId(d.id).culprits.every((c: Json) => c.kind === 'term')).toBe(true);
    expect(byId(tl.id).culprits).toHaveLength(5);
    expect(byId(tl.id).culprits.every((c: Json) => c.kind === 'timeline_fact')).toBe(true);
  });

  it('juego sin definición registrada: culprits vacío sin fallar', async () => {
    const c = await dbs.insertChallenge({
      gameId: 'bug-hunt',
      date: '2026-11-28',
      number: 5,
      payload: {},
    });
    await seedReports(c, 1);
    const { app } = await buildDbApp(dbs, { games: registryWithoutBugHunt });
    const res = await list(app);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { groups: Json[] }).groups[0]!.challenge.culprits).toEqual([]);
  });

  it('TS-14 forma del reporte y privacidad', async () => {
    const c = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-11-28',
      number: 5,
      payload: PAYLOAD,
    });
    const player = await dbs.insertPlayer();
    const context = {
      code_language: null,
      play_status: 'in_progress',
      play_state: { guesses: [] },
      user_agent: 'UA',
    };
    await dbs.insertReport({
      challengeId: c.id,
      playerId: player.id,
      reason: 'ambiguous',
      message: 'dos palabras posibles',
      context,
    });
    const { app } = await buildDbApp(dbs);
    const text = await (await list(app)).text();
    const report = (JSON.parse(text) as { groups: Json[] }).groups[0]!.reports[0];
    expect(report).toMatchObject({
      reason: 'ambiguous',
      message: 'dos palabras posibles',
      locale: 'es',
      context,
      status: 'open',
    });
    expect(report.player_ref).toMatch(/^[0-9a-f]{8}$/);
    expect(report.player_ref).toBe(
      createHash('sha256').update(player.id).digest('hex').slice(0, 8),
    );
    expect(text).not.toContain(player.id);
    expect(text).not.toContain('player_id');
  });

  it('TS-15 filtro por estado', async () => {
    const { b } = await seedTs12();
    const { app } = await buildDbApp(dbs);
    const resolved = (await (await list(app, '?status=resolved')).json()) as { groups: Json[] };
    expect(resolved.groups).toHaveLength(1);
    expect(resolved.groups[0]).toMatchObject({
      report_count: 1,
      reasons: { wrong_answer: 1 },
      challenge: { id: b.id },
    });
    expect(resolved.groups[0]!.reports[0].status).toBe('resolved');
    expect(await (await list(app, '?status=dismissed')).json()).toEqual({ groups: [] });
  });

  it('TS-16 status inválido: 422', async () => {
    const { app } = await buildDbApp(dbs);
    const res = await list(app, '?status=closed');
    expect(res.status).toBe(422);
    expect(((await res.json()) as Json).error.code).toBe('validation_error');
  });

  it('TS-17 desafío anulado en la lista', async () => {
    const c = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-11-28',
      number: 5,
      payload: PAYLOAD,
      status: 'voided',
      voidReason: 'x',
      voidedAt: new Date('2026-11-29T09:00:00Z'),
    });
    await seedReports(c, 1, { status: 'resolved' });
    const { app } = await buildDbApp(dbs);
    const body = (await (await list(app, '?status=resolved')).json()) as { groups: Json[] };
    expect(body.groups[0]!.challenge).toMatchObject({
      status: 'voided',
      void_reason: 'x',
      voided_at: '2026-11-29T09:00:00.000Z',
    });
  });
});

describe('PATCH /api/admin/reports/{report_id}', () => {
  const patch = async (
    app: { request: (u: string, i?: RequestInit) => Response | Promise<Response> },
    id: string,
    body: unknown,
  ) =>
    app.request(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { ...ADMIN_HEADERS, ...(await adminAuth()) },
      body: JSON.stringify(body),
    });

  async function setup(status: 'open' | 'resolved' | 'dismissed' = 'open') {
    const c = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      alertedAt: new Date('2026-12-01T10:00:00Z'),
    });
    const player = await dbs.insertPlayer();
    await dbs.insertPlay({
      playerId: player.id,
      challengeId: c.id,
      gameId: 'devdle',
      date: '2026-12-01',
      state: { guesses: [] },
    });
    const [report] = await seedReports(c, 1, { status });
    return { c, report: report! };
  }

  it('TS-18 resolver un reporte abierto sin tocar desafío ni Play', async () => {
    const { c, report } = await setup();
    const before = JSON.stringify([
      await sql`SELECT * FROM challenges`,
      await sql`SELECT * FROM plays`,
    ]);
    const { app, lines } = await buildDbApp(dbs);
    const res = await patch(app, report.id, { status: 'resolved' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Json;
    expect(body).toMatchObject({ id: report.id, status: 'resolved' });
    expect(body.player_ref).toBe(playerRef(report.playerId));
    expect(body).not.toHaveProperty('player_id');
    expect(
      JSON.stringify([await sql`SELECT * FROM challenges`, await sql`SELECT * FROM plays`]),
    ).toBe(before);
    expect(lines().some((l) => l.event === 'ReportResolved' && l.challenge_id === c.id)).toBe(true);
  });

  it('TS-19 descartar', async () => {
    const { report } = await setup();
    const { app, lines } = await buildDbApp(dbs);
    const res = await patch(app, report.id, { status: 'dismissed' });
    expect(res.status).toBe(200);
    expect(((await res.json()) as Json).status).toBe('dismissed');
    expect(lines().some((l) => l.event === 'ReportDismissed')).toBe(true);
  });

  it('TS-20 reporte ya cerrado: 409 report_not_open', async () => {
    const { app } = await buildDbApp(dbs);
    for (const [from, to] of [
      ['resolved', 'dismissed'],
      ['dismissed', 'resolved'],
    ] as const) {
      await dbs.reset();
      const { report } = await setup(from);
      const res = await patch(app, report.id, { status: to });
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: { code: 'report_not_open', message: 'El reporte no está abierto.' },
      });
      const [row] = await sql`SELECT status FROM challenge_reports WHERE id = ${report.id}`;
      expect(row!.status).toBe(from);
    }
  });

  it('TS-21 inexistente, id inválido y estado inválido', async () => {
    const { app } = await buildDbApp(dbs);
    const missing = await patch(app, '6a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', {
      status: 'resolved',
    });
    expect(missing.status).toBe(404);
    expect(((await missing.json()) as Json).error.code).toBe('not_found');
    expect((await patch(app, 'no-uuid', { status: 'resolved' })).status).toBe(422);
    const { report } = await setup();
    expect((await patch(app, report.id, { status: 'open' })).status).toBe(422);
  });
});
