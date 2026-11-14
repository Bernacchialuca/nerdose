import { describe, expect, it } from 'vitest';

import { syncSummarySchema } from '@/domain/admin/admin.schema';
import { buildBankStock } from '@/domain/admin/bank-stock';

const CONSUMERS = [
  { gameId: 'devdle' as const, windowDays: 365, itemsPerChallenge: 1 },
  { gameId: 'grep-grid' as const, windowDays: 30, itemsPerChallenge: 8 },
];

describe('buildBankStock', () => {
  it('TS-32 caso A', () => {
    const r = buildBankStock({
      bank: 'terms',
      approvedTotal: 500,
      rejectedTotal: 0,
      available: [400, 300],
      availableAll: 250,
      consumers: CONSUMERS,
    });
    expect(r.consumers[0]).toMatchObject({
      approved_available: 400,
      days_of_stock: 400,
      cycle_ok: true,
    });
    expect(r.consumers[1]).toMatchObject({
      approved_available: 300,
      days_of_stock: 37,
      cycle_ok: true,
    });
    expect(r).toMatchObject({ approved_available: 250, days_of_stock: 37, cycle_ok: true });
  });

  it('TS-32 caso B', () => {
    const r = buildBankStock({
      bank: 'terms',
      approvedTotal: 300,
      rejectedTotal: 0,
      available: [10, 300],
      availableAll: 10,
      consumers: CONSUMERS,
    });
    expect(r.consumers[0]!.cycle_ok).toBe(false);
    expect(r.consumers[1]!.cycle_ok).toBe(true);
    expect(r).toMatchObject({ cycle_ok: false, days_of_stock: 10 });
  });

  it('banco vacío: todo 0 y cycle_ok false', () => {
    const r = buildBankStock({
      bank: 'terms',
      approvedTotal: 0,
      rejectedTotal: 0,
      available: [0, 0],
      availableAll: 0,
      consumers: CONSUMERS,
    });
    expect(r).toMatchObject({ approved_available: 0, days_of_stock: 0, cycle_ok: false });
  });

  it('un solo consumidor', () => {
    const r = buildBankStock({
      bank: 'timeline_facts',
      approvedTotal: 450,
      rejectedTotal: 1,
      available: [12],
      availableAll: 12,
      consumers: [{ gameId: 'timeline', windowDays: 90, itemsPerChallenge: 5 }],
    });
    expect(r).toMatchObject({ days_of_stock: 2, cycle_ok: true, rejected_total: 1 });
  });
});

describe('syncSummarySchema', () => {
  const base = { dataset_version: 'v', inserted: 1, updated: 2, unchanged: 3, kept_rejected: 4 };
  it('descarta claves extra', () => {
    expect(syncSummarySchema.parse({ ...base, skipped: 0, by_bank: {} })).toEqual(base);
  });
  it('rechaza una clave faltante', () => {
    const rest: Partial<typeof base> = { ...base };
    delete rest.kept_rejected;
    expect(syncSummarySchema.safeParse(rest).success).toBe(false);
  });
});
