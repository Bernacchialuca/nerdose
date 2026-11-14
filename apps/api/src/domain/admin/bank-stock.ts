import type { BankName, GameId } from '@nerdose/core';

import type { BankConsumerStock, BankStock } from './admin.types';

export type BankStockInput = {
  bank: BankName;
  approvedTotal: number;
  rejectedTotal: number;
  /** Disponibles por consumidor, en el orden de `consumers`. */
  available: number[];
  /** Disponibles para todos los consumidores a la vez. */
  availableAll: number;
  consumers: Array<{ gameId: GameId; windowDays: number; itemsPerChallenge: number }>;
};

/** Fórmulas de stock (REQ-008, decisión 12): pura, sin base. `rejections` lo completa el servicio. */
export function buildBankStock(input: BankStockInput): Omit<BankStock, 'rejections'> {
  const consumers: BankConsumerStock[] = input.consumers.map((c, i) => {
    const available = input.available[i] ?? 0;
    return {
      game_id: c.gameId,
      window_days: c.windowDays,
      items_per_challenge: c.itemsPerChallenge,
      approved_available: available,
      days_of_stock: Math.floor(available / c.itemsPerChallenge),
      cycle_ok: input.approvedTotal >= c.itemsPerChallenge * c.windowDays,
    };
  });
  return {
    bank: input.bank,
    approved_available: input.availableAll,
    approved_total: input.approvedTotal,
    rejected_total: input.rejectedTotal,
    days_of_stock: consumers.length ? Math.min(...consumers.map((c) => c.days_of_stock)) : 0,
    cycle_ok: consumers.length > 0 && consumers.every((c) => c.cycle_ok),
    consumers,
  };
}
