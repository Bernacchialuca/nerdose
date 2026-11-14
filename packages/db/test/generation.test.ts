import { randomUUID } from 'node:crypto';

import { GENERATION_REQUEST_STATUSES } from '@nerdose/core';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

import { createDb } from '../src/client';
import { makeChallenge, truncateAll } from '../src/testing';
import { connectAs } from './helpers';

const owner = connectAs(inject('ownerUrl'));
const api = connectAs(inject('apiUrl'));
const generator = connectAs(inject('generatorUrl'));
const generator2 = connectAs(inject('generatorUrl'));
const { db: ownerDb, sql: ownerDbSql } = createDb(inject('ownerUrl'), { max: 1 });

type Sql = typeof api;

beforeAll(async () => {
  await truncateAll({ sql: owner });
});

afterAll(async () => {
  await Promise.all([owner.end(), api.end(), generator.end(), generator2.end(), ownerDbSql.end()]);
});

const denied = (t: string) => ({ code: '42501', message: `permission denied for table ${t}` });

let dayCounter = 0;
const uniqueDate = () => {
  dayCounter += 1;
  return new Date(Date.UTC(2031, 0, dayCounter)).toISOString().slice(0, 10);
};

const approved = (gameId: 'devdle' | 'grep-grid' = 'grep-grid') =>
  makeChallenge(ownerDb, { gameId, date: uniqueDate(), status: 'approved' });

type RequestOpts = {
  challengeId: string;
  status?: string;
  newChallengeId?: string;
  processedAt?: boolean;
  error?: string;
};

const insertRequest = async (sql: Sql, o: RequestOpts) => {
  const cols: Record<string, unknown> = { challenge_id: o.challengeId };
  if (o.status !== undefined) cols.status = o.status;
  if (o.newChallengeId !== undefined) cols.new_challenge_id = o.newChallengeId;
  if (o.error !== undefined) cols.error = o.error;
  const names = Object.keys(cols);
  const values = Object.values(cols) as string[];
  const placeholders = names.map((n, i) =>
    n === 'status' ? `$${i + 1}::generation_request_status` : `$${i + 1}`,
  );
  const extraCols = o.processedAt ? ', processed_at' : '';
  const extraVals = o.processedAt ? ', now()' : '';
  const rows = await sql.unsafe(
    `INSERT INTO generation_requests (${names.join(', ')}${extraCols}) VALUES (${placeholders.join(', ')}${extraVals}) RETURNING *`,
    values,
  );
  return rows[0]!;
};

type FailureOpts = {
  gameId: string;
  date: string;
  attempts: number;
  lastReason: string | null;
};

const upsertFailure = (sql: Sql, o: FailureOpts) =>
  sql`INSERT INTO generation_failures (game_id, date, attempts, last_reason)
    VALUES (${o.gameId}::game_id, ${o.date}, ${o.attempts}, ${o.lastReason})
    ON CONFLICT (game_id, date) DO UPDATE
    SET attempts = EXCLUDED.attempts, last_reason = EXCLUDED.last_reason
    RETURNING *`;

const insertFailure = (sql: Sql, o: FailureOpts) =>
  sql`INSERT INTO generation_failures (game_id, date, attempts, last_reason)
    VALUES (${o.gameId}::game_id, ${o.date}, ${o.attempts}, ${o.lastReason}) RETURNING *`;

const failure = (over: Partial<FailureOpts> = {}): FailureOpts => ({
  gameId: 'devdle',
  date: uniqueDate(),
  attempts: 20,
  lastReason: 'no_candidate_passed',
  ...over,
});

const close = (sql: Sql, id: string, status: 'failed' | 'cancelled') =>
  status === 'failed'
    ? sql`UPDATE generation_requests SET status = 'failed', error = 'no_candidate_passed', processed_at = now() WHERE id = ${id}`
    : sql`UPDATE generation_requests SET status = 'cancelled', processed_at = now() WHERE id = ${id}`;

const columns = async (table: string) => {
  const rows = await owner`SELECT column_name, udt_name, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${table}
    ORDER BY ordinal_position`;
  return rows.map((r) => [r.column_name, r.udt_name, r.is_nullable, r.column_default]);
};

describe('generation tables structure', () => {
  it('S035-TS-2: generation_request_status enum', async () => {
    const rows = await owner`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'generation_request_status' ORDER BY e.enumsortorder`;
    const labels = rows.map((r) => r.enumlabel);
    expect(labels).toEqual(['pending', 'done', 'failed', 'cancelled']);
    expect(labels).toEqual([...GENERATION_REQUEST_STATUSES]);
  });

  it('S035-TS-3: generation_requests columns', async () => {
    expect(await columns('generation_requests')).toEqual([
      ['id', 'uuid', 'NO', 'gen_random_uuid()'],
      ['challenge_id', 'uuid', 'NO', null],
      ['status', 'generation_request_status', 'NO', "'pending'::generation_request_status"],
      ['new_challenge_id', 'uuid', 'YES', null],
      ['error', 'text', 'YES', null],
      ['requested_at', 'timestamptz', 'NO', 'now()'],
      ['processed_at', 'timestamptz', 'YES', null],
    ]);
  });

  it('S035-TS-4: generation_failures columns', async () => {
    expect(await columns('generation_failures')).toEqual([
      ['game_id', 'game_id', 'NO', null],
      ['date', 'date', 'NO', null],
      ['attempts', 'int4', 'NO', null],
      ['last_reason', 'text', 'YES', null],
      ['created_at', 'timestamptz', 'NO', 'now()'],
      ['updated_at', 'timestamptz', 'NO', 'now()'],
    ]);
  });

  it.each([
    ['generation_requests', ['id']],
    ['generation_failures', ['date', 'game_id']],
  ])('S035-TS-5: primary key of %s', async (table, expected) => {
    const rows = await owner`SELECT a.attname FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ${table}::regclass AND i.indisprimary`;
    expect(rows.map((r) => r.attname).sort()).toEqual(expected);
  });

  it('S035-TS-6: RESTRICT foreign keys', async () => {
    const rows = await owner`SELECT conname, confrelid::regclass::text AS ref, confdeltype
      FROM pg_constraint WHERE conrelid = 'generation_requests'::regclass AND contype = 'f'
      ORDER BY conname`;
    expect(rows.map((r) => [r.conname, r.ref, r.confdeltype])).toEqual([
      ['generation_requests_challenge_id_challenges_id_fk', 'challenges', 'r'],
      ['generation_requests_new_challenge_id_challenges_id_fk', 'challenges', 'r'],
    ]);
    const none = await owner`SELECT conname FROM pg_constraint
      WHERE conrelid = 'generation_failures'::regclass AND contype = 'f'`;
    expect(none).toHaveLength(0);
  });

  it('S035-TS-8: generation_requests indexes', async () => {
    const rows = await owner`SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'generation_requests'`;
    const defs = Object.fromEntries(rows.map((r) => [r.indexname, r.indexdef as string]));
    expect(Object.keys(defs).sort()).toEqual([
      'generation_requests_pkey',
      'idx_generation_requests_challenge',
      'idx_generation_requests_status',
      'uq_generation_requests_pending',
    ]);
    expect(defs['uq_generation_requests_pending']).toBe(
      "CREATE UNIQUE INDEX uq_generation_requests_pending ON public.generation_requests USING btree (challenge_id) WHERE (status = 'pending'::generation_request_status)",
    );
    expect(defs['idx_generation_requests_status']).toBe(
      'CREATE INDEX idx_generation_requests_status ON public.generation_requests USING btree (status, requested_at)',
    );
    expect(defs['idx_generation_requests_challenge']).toBe(
      'CREATE INDEX idx_generation_requests_challenge ON public.generation_requests USING btree (challenge_id, requested_at)',
    );
  });

  it('S035-TS-9: generation_failures indexes', async () => {
    const rows = await owner`SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'generation_failures'`;
    expect(rows.map((r) => [r.indexname, r.indexdef])).toEqual([
      [
        'generation_failures_game_id_date_pk',
        'CREATE UNIQUE INDEX generation_failures_game_id_date_pk ON public.generation_failures USING btree (game_id, date)',
      ],
    ]);
  });

  it('S035-TS-10: checks', async () => {
    const rows = await owner`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
      WHERE conrelid IN ('generation_requests'::regclass, 'generation_failures'::regclass)
      AND contype = 'c' ORDER BY conname`;
    expect(rows.map((r) => r.conname)).toEqual([
      'ck_generation_failures_attempts',
      'ck_generation_requests_done_new_challenge',
      'ck_generation_requests_processed_at',
    ]);
    expect(rows[0]!.def).toContain('attempts >= 1');
    expect(rows[1]!.def).toContain('new_challenge_id IS NOT NULL');
    expect(rows[2]!.def).toContain('processed_at IS NOT NULL');
  });

  it('S035-TS-12: triggers', async () => {
    const rows = await owner`SELECT tgname, pg_get_triggerdef(oid) AS def FROM pg_trigger
      WHERE tgrelid = 'generation_failures'::regclass AND NOT tgisinternal`;
    expect(rows.map((r) => [r.tgname, r.def])).toEqual([
      [
        'set_updated_at',
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.generation_failures FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      ],
    ]);
    const none = await owner`SELECT tgname FROM pg_trigger
      WHERE tgrelid = 'generation_requests'::regclass AND NOT tgisinternal`;
    expect(none).toHaveLength(0);
  });
});

describe('generation_requests queue', () => {
  it('S035-TS-15: api enqueues with defaults', async () => {
    const c = await approved();
    const r = await insertRequest(api, { challengeId: c.id });
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r).toMatchObject({
      challenge_id: c.id,
      status: 'pending',
      new_challenge_id: null,
      error: null,
      processed_at: null,
    });
    expect(r.requested_at).toBeInstanceOf(Date);
  });

  it('S035-TS-16: second pending for the same challenge fails', async () => {
    const c = await approved();
    await insertRequest(api, { challengeId: c.id });
    await expect(insertRequest(api, { challengeId: c.id })).rejects.toMatchObject({
      code: '23505',
      constraint_name: 'uq_generation_requests_pending',
    });
  });

  it('S035-TS-17: new pending after closing the previous one', async () => {
    const c = await approved();
    const r1 = await insertRequest(api, { challengeId: c.id });
    await close(generator, r1.id, 'failed');
    await insertRequest(api, { challengeId: c.id });
    const rows = await owner`SELECT status FROM generation_requests
      WHERE challenge_id = ${c.id} ORDER BY requested_at, id`;
    expect(rows.map((r) => r.status).sort()).toEqual(['failed', 'pending']);
  });

  it('S035-TS-18: several closed requests coexist', async () => {
    const c = await approved();
    const n = await makeChallenge(ownerDb, { gameId: 'grep-grid', date: c.date, status: 'draft' });
    await insertRequest(owner, {
      challengeId: c.id,
      status: 'done',
      newChallengeId: n.id,
      processedAt: true,
    });
    await insertRequest(owner, { challengeId: c.id, status: 'failed', processedAt: true });
    await insertRequest(owner, { challengeId: c.id, status: 'cancelled', processedAt: true });
    const [row] = await owner`SELECT count(*)::int AS n FROM generation_requests
      WHERE challenge_id = ${c.id}`;
    expect(row!.n).toBe(3);
  });

  it('S035-TS-19: pending of different challenges', async () => {
    const c1 = await approved();
    const c2 = await approved('devdle');
    await insertRequest(api, { challengeId: c1.id });
    await insertRequest(api, { challengeId: c2.id });
  });

  it('S035-TS-20: status outside the enum', async () => {
    const c = await approved();
    await expect(
      owner`INSERT INTO generation_requests (challenge_id, status) VALUES (${c.id}, 'running')`,
    ).rejects.toMatchObject({
      code: '22P02',
      message: expect.stringContaining('invalid input value for enum generation_request_status'),
    });
  });

  it('S035-TS-21: unknown challenge', async () => {
    await expect(insertRequest(api, { challengeId: randomUUID() })).rejects.toMatchObject({
      code: '23503',
      constraint_name: 'generation_requests_challenge_id_challenges_id_fk',
    });
  });

  it('S035-TS-22: unknown new challenge', async () => {
    const c = await approved();
    const r = await insertRequest(api, { challengeId: c.id });
    await expect(
      generator`UPDATE generation_requests SET status = 'done', new_challenge_id = ${randomUUID()}, processed_at = now() WHERE id = ${r.id}`,
    ).rejects.toMatchObject({
      code: '23503',
      constraint_name: 'generation_requests_new_challenge_id_challenges_id_fk',
    });
  });

  it('S035-TS-23: RESTRICT when deleting the requested challenge', async () => {
    const c = await approved();
    await insertRequest(api, { challengeId: c.id });
    await expect(owner`DELETE FROM challenges WHERE id = ${c.id}`).rejects.toMatchObject({
      code: '23503',
      constraint_name: 'generation_requests_challenge_id_challenges_id_fk',
    });
    const rows = await owner`SELECT id FROM challenges WHERE id = ${c.id}`;
    expect(rows).toHaveLength(1);
  });

  it('S035-TS-24: RESTRICT when deleting the new challenge', async () => {
    const c = await approved();
    const n = await makeChallenge(ownerDb, { gameId: 'grep-grid', date: c.date, status: 'draft' });
    await insertRequest(owner, {
      challengeId: c.id,
      status: 'done',
      newChallengeId: n.id,
      processedAt: true,
    });
    await expect(owner`DELETE FROM challenges WHERE id = ${n.id}`).rejects.toMatchObject({
      code: '23503',
      constraint_name: 'generation_requests_new_challenge_id_challenges_id_fk',
    });
  });

  it('S035-TS-25: ON CONFLICT DO NOTHING without target', async () => {
    const c = await approved();
    const first = await api`INSERT INTO generation_requests (challenge_id) VALUES (${c.id})
      ON CONFLICT DO NOTHING RETURNING id`;
    expect(first).toHaveLength(1);
    const second = await api`INSERT INTO generation_requests (challenge_id) VALUES (${c.id})
      ON CONFLICT DO NOTHING RETURNING id`;
    expect(second).toHaveLength(0);
    const [row] = await owner`SELECT count(*)::int AS n FROM generation_requests
      WHERE challenge_id = ${c.id} AND status = 'pending'`;
    expect(row!.n).toBe(1);
  });

  it('S035-TS-26: ON CONFLICT (challenge_id) WHERE status = pending', async () => {
    const c = await approved();
    await insertRequest(api, { challengeId: c.id });
    const second = await api`INSERT INTO generation_requests (challenge_id) VALUES (${c.id})
      ON CONFLICT (challenge_id) WHERE status = 'pending' DO NOTHING RETURNING id`;
    expect(second).toHaveLength(0);
  });

  it('S035-TS-27: ON CONFLICT ON CONSTRAINT does not apply to a partial index', async () => {
    const c = await approved();
    await expect(
      api`INSERT INTO generation_requests (challenge_id) VALUES (${c.id})
        ON CONFLICT ON CONSTRAINT uq_generation_requests_pending DO NOTHING`,
    ).rejects.toMatchObject({
      code: '42704',
      message:
        'constraint "uq_generation_requests_pending" for table "generation_requests" does not exist',
    });
  });

  it('S035-TS-28: FOR UPDATE SKIP LOCKED hands out different requests', async () => {
    await owner`DELETE FROM generation_requests`.catch(() => undefined);
    const c1 = await approved();
    const c2 = await approved('devdle');
    const r1 = await insertRequest(api, { challengeId: c1.id });
    const r2 = await insertRequest(api, { challengeId: c2.id });
    const take = (sql: Sql) => sql`SELECT id FROM generation_requests
      WHERE status = 'pending' AND challenge_id IN (${c1.id}, ${c2.id})
      ORDER BY requested_at FOR UPDATE SKIP LOCKED LIMIT 1`;
    let a: string | undefined;
    let b: string | undefined;
    await expect(
      generator.begin(async (tx) => {
        a = (await take(tx as unknown as Sql))[0]!.id;
        b = (await take(generator2))[0]!.id;
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(a).toBe(r1.id);
    expect(b).toBe(r2.id);
  });
});

describe('generation_requests consistency checks', () => {
  const pendingWithNew = async () => {
    const c = await approved();
    const n = await makeChallenge(ownerDb, { gameId: 'grep-grid', date: c.date, status: 'draft' });
    const r = await insertRequest(api, { challengeId: c.id });
    return { c, n, r };
  };

  it('S035-TS-29: done without new_challenge_id', async () => {
    const { r } = await pendingWithNew();
    await expect(
      generator`UPDATE generation_requests SET status = 'done', processed_at = now() WHERE id = ${r.id}`,
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_generation_requests_done_new_challenge',
    });
    const [row] = await owner`SELECT status FROM generation_requests WHERE id = ${r.id}`;
    expect(row!.status).toBe('pending');
  });

  it('S035-TS-30: done without processed_at', async () => {
    const { r, n } = await pendingWithNew();
    await expect(
      generator`UPDATE generation_requests SET status = 'done', new_challenge_id = ${n.id} WHERE id = ${r.id}`,
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_generation_requests_processed_at',
    });
  });

  it('S035-TS-31: failed without processed_at', async () => {
    const { r } = await pendingWithNew();
    await expect(
      generator`UPDATE generation_requests SET status = 'failed', error = 'no_candidate_passed' WHERE id = ${r.id}`,
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_generation_requests_processed_at',
    });
  });

  it('S035-TS-32: cancelled without processed_at', async () => {
    const { r } = await pendingWithNew();
    await expect(
      generator`UPDATE generation_requests SET status = 'cancelled' WHERE id = ${r.id}`,
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_generation_requests_processed_at',
    });
  });

  it('S035-TS-33: complete done', async () => {
    const { r, n } = await pendingWithNew();
    const rows = await generator`UPDATE generation_requests SET status = 'done',
      new_challenge_id = ${n.id}, processed_at = now() WHERE id = ${r.id}
      RETURNING status, new_challenge_id`;
    expect(rows).toEqual([{ status: 'done', new_challenge_id: n.id }]);
  });

  it('S035-TS-34: complete failed and cancelled', async () => {
    const a = await pendingWithNew();
    const b = await pendingWithNew();
    await close(generator, a.r.id, 'failed');
    await close(generator, b.r.id, 'cancelled');
    const rows = await owner`SELECT id, status, new_challenge_id, error FROM generation_requests
      WHERE id IN (${a.r.id}, ${b.r.id})`;
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId[a.r.id]).toMatchObject({
      status: 'failed',
      new_challenge_id: null,
      error: 'no_candidate_passed',
    });
    expect(byId[b.r.id]).toMatchObject({ status: 'cancelled', new_challenge_id: null });
  });

  it('S035-TS-35: inconsistent direct insert', async () => {
    const c = await approved();
    await expect(
      owner`INSERT INTO generation_requests (challenge_id, status) VALUES (${c.id}, 'cancelled')`,
    ).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_generation_requests_processed_at',
    });
  });
});

describe('generation_failures upsert', () => {
  it('S035-TS-36: generator UPSERT keeps created_at and bumps updated_at', async () => {
    const f = failure();
    const [first] = await upsertFailure(generator, f);
    expect(first).toMatchObject({ attempts: 20, last_reason: 'no_candidate_passed' });
    expect(first!.created_at).toEqual(first!.updated_at);
    await owner`SELECT pg_sleep(0.01)`;
    const [second] = await upsertFailure(generator, { ...f, lastReason: 'grid_too_dense' });
    expect(second).toMatchObject({ last_reason: 'grid_too_dense' });
    expect(second!.created_at).toEqual(first!.created_at);
    expect(second!.updated_at.getTime()).toBeGreaterThan(second!.created_at.getTime());
    const [row] = await owner`SELECT count(*)::int AS n FROM generation_failures
      WHERE game_id = 'devdle' AND date = ${f.date}`;
    expect(row!.n).toBe(1);
  });

  it('S035-TS-37: duplicate without ON CONFLICT', async () => {
    const f = failure();
    await insertFailure(generator, f);
    await expect(insertFailure(generator, f)).rejects.toMatchObject({
      code: '23505',
      constraint_name: 'generation_failures_game_id_date_pk',
    });
  });

  it('S035-TS-38: same date, other game', async () => {
    const date = uniqueDate();
    await insertFailure(generator, failure({ date, gameId: 'devdle' }));
    await insertFailure(generator, failure({ date, gameId: 'grep-grid' }));
  });

  it('S035-TS-39: attempts = 0', async () => {
    await expect(insertFailure(generator, failure({ attempts: 0 }))).rejects.toMatchObject({
      code: '23514',
      constraint_name: 'ck_generation_failures_attempts',
    });
  });

  it('S035-TS-40: attempts = 1 and null last_reason', async () => {
    const [row] = await insertFailure(generator, failure({ attempts: 1, lastReason: null }));
    expect(row).toMatchObject({ attempts: 1, last_reason: null });
  });

  it('S035-TS-41: game_id outside the enum', async () => {
    await expect(insertFailure(generator, failure({ gameId: 'sudoku' }))).rejects.toMatchObject({
      code: '22P02',
      message: expect.stringContaining('invalid input value for enum game_id'),
    });
  });

  it('S035-TS-42: direct UPDATE bumps updated_at', async () => {
    const f = failure();
    await insertFailure(generator, f);
    await owner`SELECT pg_sleep(0.01)`;
    const [row] = await generator`UPDATE generation_failures SET attempts = 21
      WHERE game_id = 'devdle' AND date = ${f.date} RETURNING created_at, updated_at`;
    expect(row!.updated_at.getTime()).toBeGreaterThan(row!.created_at.getTime());
  });
});

describe('generation tables permissions', () => {
  it('S035-TS-44: api cannot update requests', async () => {
    const c = await approved();
    const r = await insertRequest(api, { challengeId: c.id });
    await expect(
      api`UPDATE generation_requests SET status = 'cancelled', processed_at = now() WHERE id = ${r.id}`,
    ).rejects.toMatchObject(denied('generation_requests'));
  });

  it('S035-TS-45: api cannot write failures', async () => {
    await expect(insertFailure(api, failure())).rejects.toMatchObject(
      denied('generation_failures'),
    );
    await expect(api`UPDATE generation_failures SET attempts = 2`).rejects.toMatchObject(
      denied('generation_failures'),
    );
  });

  it('S035-TS-46: api reads failures', async () => {
    const f = failure();
    await insertFailure(owner, f);
    const rows =
      await api`SELECT game_id, date::text AS date, attempts, last_reason FROM generation_failures
      WHERE date = ${f.date}`;
    expect(rows.map((r) => ({ ...r }))).toEqual([
      { game_id: 'devdle', date: f.date, attempts: 20, last_reason: 'no_candidate_passed' },
    ]);
  });

  it.each([
    ['api', api],
    ['generator', generator],
  ])('S035-TS-47: %s cannot delete or truncate', async (_name, sql) => {
    for (const t of ['generation_requests', 'generation_failures']) {
      await expect(sql.unsafe(`DELETE FROM ${t}`)).rejects.toMatchObject(denied(t));
      await expect(sql.unsafe(`TRUNCATE ${t}`)).rejects.toMatchObject(denied(t));
    }
  });

  it('S035-TS-48: no DDL', async () => {
    await expect(generator`ALTER TABLE generation_failures ADD COLUMN x int`).rejects.toMatchObject(
      {
        code: '42501',
        message: 'must be owner of table generation_failures',
      },
    );
    await expect(api`ALTER TABLE generation_requests ADD COLUMN x int`).rejects.toMatchObject({
      code: '42501',
      message: 'must be owner of table generation_requests',
    });
  });

  it('S035-TS-49: api can pg_notify', async () => {
    const c = await approved();
    const r = await insertRequest(api, { challengeId: c.id });
    await expect(api`SELECT pg_notify('generation_requests', ${r.id})`).resolves.toBeDefined();
  });
});
