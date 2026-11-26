import type { BankName, GameId } from '@nerdose/core';

export type BankItemStatus = 'approved' | 'rejected';

export type BankItem = {
  id: string;
  label: string;
  category: string;
  status: BankItemStatus;
  rejection_reason: string | null;
  sitelinks: number;
  wikidata_id: string;
  /** Términos: definición en español; hechos: la nota en español. */
  description: string;
  /** Solo hechos: fecha del evento (YYYY-MM-DD). */
  event_date: string | null;
  /** Último uso por juego que consume el banco. */
  last_used: Partial<Record<GameId, string | null>>;
  /** Juegos cuyo generador nunca elige este ítem (p. ej. términos de nicho fuera de Devdle). */
  excluded_from: GameId[];
};

export type BankItemsResponse = {
  bank: BankName;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  items: BankItem[];
};

export type BankItemsQuery = {
  bank: BankName;
  q: string;
  status: BankItemStatus | null;
  category: string | null;
  page: number;
};
