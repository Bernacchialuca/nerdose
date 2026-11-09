import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PublishingRepository } from '@/domain/publishing/publishing.repository';
import { TodayCache } from '@/infra/cache/today-cache';

import { PAYLOAD, useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
beforeEach(() => dbs.reset());
afterAll(() => dbs.close());

describe('PublishingRepository (integración)', () => {
  it('TS-8 TodayCache lee solo published/voided de hoy', async () => {
    const devdle = await dbs.insertChallenge({
      gameId: 'devdle',
      date: '2026-12-01',
      number: 8,
      payload: PAYLOAD,
      status: 'published',
    });
    await dbs.insertChallenge({
      gameId: 'big-o',
      date: '2026-12-01',
      status: 'voided',
      voidReason: 'wrong_answer',
      voidedAt: new Date('2026-12-01T09:00:00Z'),
    });
    await dbs.insertChallenge({ gameId: 'timeline', date: '2026-12-01', status: 'draft' });
    await dbs.insertChallenge({ gameId: 'grep-grid', date: '2026-11-30', status: 'published' });

    const cache = new TodayCache(new PublishingRepository(dbs.api.db));
    await cache.reload('2026-12-01');
    expect(cache.find('devdle')).toEqual({
      id: devdle.id,
      game_id: 'devdle',
      date: '2026-12-01',
      number: 8,
      status: 'published',
      payload: PAYLOAD,
    });
    expect(cache.find('big-o')?.status).toBe('voided');
    expect(cache.find('timeline')).toBeUndefined();
    expect(cache.find('grep-grid')).toBeUndefined();
  });

  it('publishApproved publica solo la fecha pedida', async () => {
    for (const date of ['2026-11-30', '2026-12-01', '2026-12-02']) {
      await dbs.insertChallenge({ gameId: 'devdle', date, status: 'approved' });
    }
    const repo = new PublishingRepository(dbs.api.db);
    const rows = await repo.publishApproved('2026-12-01');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ game_id: 'devdle', date: '2026-12-01' });
    const status = async (date: string) =>
      (await dbs.owner.sql`SELECT status FROM challenges WHERE date = ${date}`)[0]!.status;
    expect(await status('2026-12-01')).toBe('published');
    expect(await status('2026-11-30')).toBe('approved');
    expect(await status('2026-12-02')).toBe('approved');
  });

  it('findApprovedTerms devuelve solo términos approved', async () => {
    await dbs.insertTerm({ term: 'KUBECTL', status: 'approved' });
    await dbs.insertTerm({ term: 'DOCKERX', status: 'rejected', rejectionReason: 'x' });
    const rows = await new PublishingRepository(dbs.api.db).findApprovedTerms();
    expect(rows).toEqual([{ term: 'KUBECTL' }]);
  });
});
