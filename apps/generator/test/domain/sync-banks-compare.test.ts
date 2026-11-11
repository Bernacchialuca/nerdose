import { loadDataset, DatasetError, timelineFactsFileSchema } from '@nerdose/content';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { isStorableDate, sameFactContent } from '@/domain/content-banks/sync-banks.service';

import { makeFact, makeFacts } from '../helpers/facts';

const row = {
  id: 'x',
  wikidataId: 'Q15206305',
  label: 'Docker',
  category: 'frameworks' as const,
  eventDate: '2013-03-20',
  datePrecision: 'day' as const,
  note: { es: 'Docker se lanzó en 2013.', en: 'Docker was released in 2013.' },
  sitelinks: 60,
  status: 'approved' as const,
  rejectionReason: null,
};

describe('sameFactContent', () => {
  it('TS-7 igual', () => {
    expect(sameFactContent(row, makeFact())).toBe(true);
  });

  it.each([
    ['label', { label: 'Docker Engine' }, row],
    ['category', { category: 'companies' as const }, row],
    ['event_date', { event_date: '2013-03-21' }, row],
    [
      'date_precision',
      { date_precision: 'month' as const, event_date: '2013-03-01' },
      { ...row, eventDate: '2013-03-01' },
    ],
    ['note.es', { note: { es: 'x', en: 'Docker was released in 2013.' } }, row],
    ['note.en', { note: { es: 'Docker se lanzó en 2013.', en: 'x' } }, row],
    ['sitelinks', { sitelinks: 61 }, row],
  ])('TS-8 detecta cambio en %s', (_name, change, base) => {
    expect(sameFactContent(base, makeFact(change))).toBe(false);
  });

  it('TS-9 ignora estado y versión', () => {
    expect(
      sameFactContent(row, makeFact({ status: 'rejected', rejection_reason: 'excluded' })),
    ).toBe(true);
  });
});

describe('isStorableDate', () => {
  it.each([
    ['2013-03-20', true],
    ['2000-02-29', true],
    ['2014-02-30', false],
    ['1900-02-29', false],
    ['0000-01-01', false],
    ['2013-13-01', false],
    ['2013-3-1', false],
  ])('TS-10 %s -> %s', (value, expected) => {
    expect(isStorableDate(value)).toBe(expected);
  });
});

describe('helpers de hechos', () => {
  it('makeFacts(40) pasa el schema y invalid-facts falla el loader', () => {
    expect(timelineFactsFileSchema.safeParse(makeFacts(40)).success).toBe(true);
    try {
      loadDataset(fileURLToPath(new URL('../fixtures/datasets/invalid-facts/', import.meta.url)));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(DatasetError);
      expect((error as DatasetError).file).toBe('timeline_facts.json');
    }
  });
});
