import { challenges, terms, timelineFacts } from '@nerdose/db';
import { makeChallenge } from '@nerdose/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';

import { FACT_ID, CHRONO5, insertFacts } from '../helpers/facts';
import { insertTerms, type TermSpec } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';

const t = setupTestDb();
const OK = { ok: true, checks: [] };

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

async function seed(spec: Partial<TermSpec>, gameId: 'devdle' | 'grep-grid', date: string) {
  const [term] = await insertTerms(t.owner.db, [
    { term: 'REACT', category: 'programming_languages', ...spec },
  ]);
  const draft = await makeChallenge(t.owner.db, { gameId, date, status: 'draft', number: 13 });
  return { termId: term!.id, draftId: draft.id };
}

const termRow = async (id: string) =>
  (await t.owner.db.select().from(terms).where(eq(terms.id, id)))[0]!;

describe('ChallengePublishingRepository.approve (GREATEST)', () => {
  const repo = () => new ChallengePublishingRepository(t.svc.db);

  it('NULL pasa a la fecha', async () => {
    const { termId, draftId } = await seed({ lastUsedGrep: null }, 'grep-grid', '2026-12-02');
    const result = await repo().approve(draftId, OK, {
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      itemIds: [termId],
      date: '2026-12-02',
    });
    expect(result).toBe('approved');
    const [c] = await t.owner.db.select().from(challenges).where(eq(challenges.id, draftId));
    expect(c!.status).toBe('approved');
    const row = await termRow(termId);
    expect(row.lastUsedGrep).toBe('2026-12-02');
    expect(row.lastUsedDevdle).toBeNull();
  });

  it('no retrocede una fecha posterior', async () => {
    const { termId, draftId } = await seed(
      { lastUsedGrep: '2026-12-20' },
      'grep-grid',
      '2026-12-10',
    );
    const result = await repo().approve(draftId, OK, {
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      itemIds: [termId],
      date: '2026-12-10',
    });
    expect(result).toBe('approved');
    expect((await termRow(termId)).lastUsedGrep).toBe('2026-12-20');
  });

  it('avanza una fecha anterior', async () => {
    const { termId, draftId } = await seed(
      { lastUsedGrep: '2026-11-01' },
      'grep-grid',
      '2026-12-10',
    );
    await repo().approve(draftId, OK, {
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      itemIds: [termId],
      date: '2026-12-10',
    });
    expect((await termRow(termId)).lastUsedGrep).toBe('2026-12-10');
  });

  it('Devdle escribe last_used_devdle y no toca last_used_grep', async () => {
    const { termId, draftId } = await seed({ lastUsedDevdle: null }, 'devdle', '2026-12-02');
    await repo().approve(draftId, OK, {
      bank: 'terms',
      lastUsedField: 'last_used_devdle',
      itemIds: [termId],
      date: '2026-12-02',
    });
    const row = await termRow(termId);
    expect(row.lastUsedDevdle).toBe('2026-12-02');
    expect(row.lastUsedGrep).toBeNull();
  });

  it('un choque con el índice único no escribe last_used_grep', async () => {
    const { termId, draftId } = await seed({}, 'grep-grid', '2026-12-02');
    await makeChallenge(t.owner.db, {
      gameId: 'grep-grid',
      date: '2026-12-02',
      status: 'approved',
      number: 13,
    });
    const result = await repo().approve(draftId, OK, {
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      itemIds: [termId],
      date: '2026-12-02',
    });
    expect(result).toBe('duplicate');
    const [c] = await t.owner.db.select().from(challenges).where(eq(challenges.id, draftId));
    expect(c).toMatchObject({ status: 'rejected', verification: { reason: 'duplicate_active' } });
    expect((await termRow(termId)).lastUsedGrep).toBeNull();
  });

  it('rechaza un lastUsedField desconocido', async () => {
    await expect(
      repo().approve('00000000-0000-0000-0000-000000000000', OK, {
        bank: 'terms',
        lastUsedField: 'nope',
        itemIds: [],
        date: '2026-12-02',
      }),
    ).rejects.toThrow('Unknown last_used field');
  });
});

const factRow = async (id: string) =>
  (await t.owner.db.select().from(timelineFacts).where(eq(timelineFacts.id, id)))[0]!;

const TL = { bank: 'timeline_facts', lastUsedField: 'last_used' } as const;

describe('ChallengePublishingRepository.bankItems', () => {
  const repo = () => new ChallengePublishingRepository(t.svc.db);

  it('TS-1 timeline_facts devuelve los approved con forma TimelineFact', async () => {
    await insertFacts(t.owner.db, [
      ...CHRONO5.map((f) => (f.id === FACT_ID('02') ? { ...f, lastUsed: '2026-11-20' } : f)),
      {
        id: FACT_ID('06'),
        wikidataId: 'Q999',
        label: 'Rejected',
        status: 'rejected',
        rejectionReason: 'excluded',
      },
    ]);
    const items = await repo().bankItems({ ...TL, recentDays: 90 });
    expect(items).toHaveLength(5);
    expect(items.map((i) => i.id)).not.toContain(FACT_ID('06'));
    expect(items.find((i) => i.id === FACT_ID('02'))).toEqual({
      id: FACT_ID('02'),
      label: 'Java',
      category: 'programming_languages',
      event_date: '1995-05-23',
      date_precision: 'day',
      note: { es: 'nota de Java', en: 'note on Java' },
      last_used: '2026-11-20',
    });
    for (const item of items.filter((i) => i.id !== FACT_ID('02')))
      expect(item.last_used).toBeNull();
    for (const item of items) {
      expect(item).not.toHaveProperty('eventDate');
      expect(item).not.toHaveProperty('lastUsed');
    }
  });

  it('TS-2 terms no cambia', async () => {
    await insertTerms(t.owner.db, [
      { term: 'REACT', category: 'programming_languages', lastUsedGrep: '2026-11-01' },
    ]);
    const items = await repo().bankItems({
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      recentDays: 30,
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      term: 'REACT',
      category: 'programming_languages',
      last_used_grep: '2026-11-01',
    });
    expect(Object.keys(items[0]!).sort()).toEqual(
      ['category', 'definition', 'id', 'last_used_grep', 'summary', 'term'].sort(),
    );
  });

  it('TS-3 banco null devuelve []', async () => {
    expect(await repo().bankItems({ bank: null, lastUsedField: '', recentDays: 0 })).toEqual([]);
  });

  it('TS-4 campo ajeno al banco', async () => {
    await expect(
      repo().bankItems({ bank: 'timeline_facts', lastUsedField: 'last_used_grep', recentDays: 90 }),
    ).rejects.toThrow(/Unknown last_used field/);
    await expect(
      repo().bankItems({ bank: 'terms', lastUsedField: 'last_used', recentDays: 30 }),
    ).rejects.toThrow(/Unknown last_used field/);
  });
});

describe('ChallengePublishingRepository.approve (timeline_facts)', () => {
  const repo = () => new ChallengePublishingRepository(t.svc.db);
  const draft = (date: string) =>
    makeChallenge(t.owner.db, { gameId: 'timeline', date, status: 'draft', number: 13 });

  it('TS-5 NULL pasa a la fecha y terms no cambia', async () => {
    await insertFacts(t.owner.db, CHRONO5);
    const [term] = await insertTerms(t.owner.db, [
      { term: 'REACT', category: 'programming_languages' },
    ]);
    const d = await draft('2026-12-02');
    const result = await repo().approve(d.id, OK, {
      ...TL,
      itemIds: [FACT_ID('01'), FACT_ID('02')],
      date: '2026-12-02',
    });
    expect(result).toBe('approved');
    const [c] = await t.owner.db.select().from(challenges).where(eq(challenges.id, d.id));
    expect(c!.status).toBe('approved');
    expect((await factRow(FACT_ID('01'))).lastUsed).toBe('2026-12-02');
    expect((await factRow(FACT_ID('02'))).lastUsed).toBe('2026-12-02');
    for (const nn of ['03', '04', '05']) expect((await factRow(FACT_ID(nn))).lastUsed).toBeNull();
    const row = await termRow(term!.id);
    expect(row.lastUsedDevdle).toBeNull();
    expect(row.lastUsedGrep).toBeNull();
  });

  it('TS-6 GREATEST no retrocede', async () => {
    await insertFacts(t.owner.db, [{ ...CHRONO5[0]!, lastUsed: '2026-12-20' }]);
    const d = await draft('2026-12-10');
    await repo().approve(d.id, OK, { ...TL, itemIds: [FACT_ID('01')], date: '2026-12-10' });
    expect((await factRow(FACT_ID('01'))).lastUsed).toBe('2026-12-20');
    const [c] = await t.owner.db.select().from(challenges).where(eq(challenges.id, d.id));
    expect(c!.status).toBe('approved');
  });

  it('TS-7 GREATEST avanza', async () => {
    await insertFacts(t.owner.db, [{ ...CHRONO5[0]!, lastUsed: '2026-08-01' }]);
    const d = await draft('2026-12-10');
    await repo().approve(d.id, OK, { ...TL, itemIds: [FACT_ID('01')], date: '2026-12-10' });
    expect((await factRow(FACT_ID('01'))).lastUsed).toBe('2026-12-10');
  });

  it('TS-8 choque con el índice único no escribe last_used', async () => {
    await insertFacts(t.owner.db, CHRONO5);
    await makeChallenge(t.owner.db, {
      gameId: 'timeline',
      date: '2026-12-02',
      status: 'approved',
      number: 13,
    });
    const d = await draft('2026-12-02');
    const result = await repo().approve(d.id, OK, {
      ...TL,
      itemIds: [FACT_ID('01')],
      date: '2026-12-02',
    });
    expect(result).toBe('duplicate');
    const [c] = await t.owner.db.select().from(challenges).where(eq(challenges.id, d.id));
    expect(c).toMatchObject({ status: 'rejected', verification: { reason: 'duplicate_active' } });
    expect((await factRow(FACT_ID('01'))).lastUsed).toBeNull();
  });

  it('TS-9 terms con bank terms no toca timeline_facts', async () => {
    await insertFacts(t.owner.db, CHRONO5);
    const { termId, draftId } = await seed({}, 'grep-grid', '2026-12-02');
    await repo().approve(draftId, OK, {
      bank: 'terms',
      lastUsedField: 'last_used_grep',
      itemIds: [termId],
      date: '2026-12-02',
    });
    for (const f of CHRONO5) expect((await factRow(f.id!)).lastUsed).toBeNull();
  });

  it('TS-10 combinación inválida y banco nulo', async () => {
    await insertFacts(t.owner.db, CHRONO5);
    const d1 = await draft('2026-12-02');
    await expect(
      repo().approve(d1.id, OK, {
        bank: 'timeline_facts',
        lastUsedField: 'last_used_grep',
        itemIds: [FACT_ID('01')],
        date: '2026-12-02',
      }),
    ).rejects.toThrow(/Unknown last_used field/);
    const [c1] = await t.owner.db.select().from(challenges).where(eq(challenges.id, d1.id));
    expect(c1!.status).toBe('draft');

    const d2 = await draft('2026-12-03');
    const result = await repo().approve(d2.id, OK, {
      bank: null,
      lastUsedField: '',
      itemIds: [],
      date: '2026-12-03',
    });
    expect(result).toBe('approved');
    const [c2] = await t.owner.db.select().from(challenges).where(eq(challenges.id, d2.id));
    expect(c2!.status).toBe('approved');
    for (const f of CHRONO5) expect((await factRow(f.id!)).lastUsed).toBeNull();
  });
});
