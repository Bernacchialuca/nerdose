import { createGameRegistry } from '@nerdose/core';
import { devdle } from '@nerdose/game-devdle/definition';
import { describe, expect, it } from 'vitest';

import { BANK_COLUMNS, resolveBankConsumers } from '@/domain/admin/bank-columns';
import { games } from '@/games/registry';

describe('resolveBankConsumers', () => {
  it('con el registry real da terms y timeline_facts en orden', () => {
    const r = resolveBankConsumers(games);
    expect(r.map((b) => b.bank)).toEqual(['terms', 'timeline_facts']);
    expect(r[0]!.consumers.map((c) => c.gameId)).toEqual(['devdle', 'grep-grid']);
    expect(r[1]!.consumers.map((c) => c.gameId)).toEqual(['timeline']);
    expect(r[0]!.consumers[0]!.column).toBe(BANK_COLUMNS.terms.lastUsed.last_used_devdle);
  });

  it('omite los juegos con bankUsage null', () => {
    const reg = createGameRegistry([{ ...devdle, bankUsage: null }]);
    expect(resolveBankConsumers(reg)).toEqual([]);
  });

  it('lanza ante un lastUsedField desconocido (TS-37)', () => {
    const reg = createGameRegistry([
      {
        ...devdle,
        bankUsage: {
          bank: 'terms',
          lastUsedField: 'last_used_xyz',
          windowDays: 1,
          itemsPerChallenge: 1,
        },
      },
    ]);
    expect(() => resolveBankConsumers(reg)).toThrow('Unknown bank usage: terms.last_used_xyz');
  });
});
