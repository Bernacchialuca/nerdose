import type { BankName, BankUsage, GameId, GameRegistry } from '@nerdose/core';
import { terms, timelineFacts } from '@nerdose/db';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

export type BankColumns = {
  table: PgTable;
  id: PgColumn;
  label: PgColumn;
  wikidataId: PgColumn;
  status: PgColumn;
  rejectionReason: PgColumn;
  updatedAt: PgColumn;
  /** Columnas `last_used_*` por nombre de columna SQL. */
  lastUsed: Record<string, PgColumn>;
};

/** Mapa por banco (no por juego): el único lugar de la api que conoce columnas `last_used_*`. */
export const BANK_COLUMNS: Record<BankName, BankColumns> = {
  terms: {
    table: terms,
    id: terms.id,
    label: terms.term,
    wikidataId: terms.wikidataId,
    status: terms.status,
    rejectionReason: terms.rejectionReason,
    updatedAt: terms.updatedAt,
    lastUsed: { last_used_devdle: terms.lastUsedDevdle, last_used_grep: terms.lastUsedGrep },
  },
  timeline_facts: {
    table: timelineFacts,
    id: timelineFacts.id,
    label: timelineFacts.label,
    wikidataId: timelineFacts.wikidataId,
    status: timelineFacts.status,
    rejectionReason: timelineFacts.rejectionReason,
    updatedAt: timelineFacts.updatedAt,
    lastUsed: { last_used: timelineFacts.lastUsed },
  },
};

export type BankConsumer = { gameId: GameId; usage: BankUsage; column: PgColumn };
export type BankConsumers = { bank: BankName; consumers: BankConsumer[] };

/** Bancos en orden de primera aparición en el registry; falla ante un `bankUsage` desconocido. */
export function resolveBankConsumers(games: GameRegistry): BankConsumers[] {
  const result: BankConsumers[] = [];
  for (const gameId of games.ids()) {
    const usage = games.get(gameId).bankUsage as BankUsage | null;
    if (!usage) continue;
    const columns = Object.hasOwn(BANK_COLUMNS, usage.bank) ? BANK_COLUMNS[usage.bank] : undefined;
    const column =
      columns && Object.hasOwn(columns.lastUsed, usage.lastUsedField)
        ? columns.lastUsed[usage.lastUsedField]
        : undefined;
    if (!column) throw new Error(`Unknown bank usage: ${usage.bank}.${usage.lastUsedField}`);
    let entry = result.find((r) => r.bank === usage.bank);
    if (!entry) {
      entry = { bank: usage.bank, consumers: [] };
      result.push(entry);
    }
    entry.consumers.push({ gameId, usage, column });
  }
  return result;
}
