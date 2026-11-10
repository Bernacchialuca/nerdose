import { challenges, terms } from '@nerdose/db';
import { makeChallenge } from '@nerdose/db/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';

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
      lastUsedField: 'last_used_grep',
      itemIds: [termId],
      date: '2026-12-10',
    });
    expect((await termRow(termId)).lastUsedGrep).toBe('2026-12-10');
  });

  it('Devdle escribe last_used_devdle y no toca last_used_grep', async () => {
    const { termId, draftId } = await seed({ lastUsedDevdle: null }, 'devdle', '2026-12-02');
    await repo().approve(draftId, OK, {
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
        lastUsedField: 'nope',
        itemIds: [],
        date: '2026-12-02',
      }),
    ).rejects.toThrow('Unknown last_used field');
  });
});
