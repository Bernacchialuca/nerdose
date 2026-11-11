import { timelineFacts } from '@nerdose/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ContentBanksRepository } from '@/domain/content-banks/content-banks.repository';

import { setupTestDb } from '../helpers/db';
import { insertFacts, makeFact } from '../helpers/facts';

const t = setupTestDb();
const repo = () => new ContentBanksRepository(t.svc.db);
const fact = async (wid: string) =>
  (await t.owner.db.select().from(timelineFacts).where(eq(timelineFacts.wikidataId, wid)))[0];

beforeEach(() => t.reset());
afterAll(() => t.cleanup());

describe('ContentBanksRepository timeline_facts', () => {
  it('TS-1 inserta un hecho approved nuevo', async () => {
    await repo().upsertTimelineFact(makeFact(), '2026.12.10', 'approved');
    expect(await fact('Q15206305')).toMatchObject({
      label: 'Docker',
      category: 'frameworks',
      eventDate: '2013-03-20',
      datePrecision: 'day',
      note: { es: 'Docker se lanzó en 2013.', en: 'Docker was released in 2013.' },
      sitelinks: 60,
      status: 'approved',
      rejectionReason: null,
      lastUsed: null,
      datasetVersion: '2026.12.10',
    });
  });

  it('TS-2 listTimelineFacts devuelve las filas mapeadas', async () => {
    await insertFacts(t.owner.db, [
      { wikidataId: 'Q15206305' },
      { wikidataId: 'Q28865', label: 'Python', status: 'rejected', rejectionReason: 'excluded' },
    ]);
    const rows = await repo().listTimelineFacts();
    expect(rows).toHaveLength(2);
    const python = rows.find((r) => r.wikidataId === 'Q28865')!;
    expect(python).toMatchObject({ status: 'rejected', rejectionReason: 'excluded' });
    expect(Object.keys(python).sort()).toEqual(
      [
        'id',
        'wikidataId',
        'label',
        'category',
        'eventDate',
        'datePrecision',
        'note',
        'sitelinks',
        'status',
        'rejectionReason',
      ].sort(),
    );
  });

  it('TS-3 modo approved actualiza contenido sin tocar last_used', async () => {
    await insertFacts(t.owner.db, [
      { wikidataId: 'Q15206305', sitelinks: 60, lastUsed: '2026-11-20', datasetVersion: 'old' },
    ]);
    const before = await fact('Q15206305');
    await repo().upsertTimelineFact(
      makeFact({
        sitelinks: 75,
        note: { es: 'Docker apareció en 2013.', en: 'Docker appeared in 2013.' },
      }),
      '2026.12.11',
      'approved',
    );
    const after = await fact('Q15206305');
    expect(after).toMatchObject({
      sitelinks: 75,
      note: { es: 'Docker apareció en 2013.', en: 'Docker appeared in 2013.' },
      datasetVersion: '2026.12.11',
      lastUsed: '2026-11-20',
      status: 'approved',
    });
    expect(after!.createdAt).toEqual(before!.createdAt);
    expect(after!.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
  });

  it('TS-4 modo to_rejected no toca el contenido', async () => {
    await insertFacts(t.owner.db, [{ wikidataId: 'Q15206305', lastUsed: '2026-11-20' }]);
    await repo().upsertTimelineFact(
      makeFact({ label: 'Docker Inc', status: 'rejected', rejection_reason: 'disputed_date' }),
      '2026.12.11',
      'to_rejected',
    );
    expect(await fact('Q15206305')).toMatchObject({
      status: 'rejected',
      rejectionReason: 'disputed_date',
      datasetVersion: '2026.12.11',
      label: 'Docker',
      lastUsed: '2026-11-20',
    });
  });

  it('TS-5 modo insert_rejected inserta un rejected nuevo', async () => {
    await repo().upsertTimelineFact(
      makeFact({
        wikidata_id: 'Q2005',
        label: 'Java',
        category: 'programming_languages',
        event_date: '1995-05-23',
        note: { es: '', en: '' },
        sitelinks: 5,
        status: 'rejected',
        rejection_reason: 'low_sitelinks',
      }),
      '2026.12.10',
      'insert_rejected',
    );
    expect(await fact('Q2005')).toMatchObject({
      status: 'rejected',
      rejectionReason: 'low_sitelinks',
      note: { es: '', en: '' },
      datasetVersion: '2026.12.10',
      lastUsed: null,
    });
  });

  it.each(['approved', 'to_rejected', 'insert_rejected'] as const)(
    'TS-6 modo %s no cambia una fila rejected',
    async (mode) => {
      await insertFacts(t.owner.db, [
        { wikidataId: 'Q15206305', lastUsed: '2026-11-15', datasetVersion: 'old' },
      ]);
      await t.owner.db
        .update(timelineFacts)
        .set({ status: 'rejected', rejectionReason: 'voided' })
        .where(eq(timelineFacts.wikidataId, 'Q15206305'));
      const before = await fact('Q15206305');
      await repo().upsertTimelineFact(makeFact(), '2026.12.11', mode);
      const after = await fact('Q15206305');
      expect(after).toMatchObject({
        status: 'rejected',
        rejectionReason: 'voided',
        lastUsed: '2026-11-15',
        datasetVersion: 'old',
        sitelinks: 50,
      });
      expect(after!.updatedAt).toEqual(before!.updatedAt);
    },
  );
});
