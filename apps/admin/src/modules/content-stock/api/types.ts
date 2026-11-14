import type { BankName, GameId } from '@nerdose/core';

export type BankConsumerStock = {
  game_id: GameId;
  window_days: number;
  items_per_challenge: number;
  approved_available: number;
  days_of_stock: number;
  cycle_ok: boolean;
};

export type BankRejection = {
  wikidata_id: string;
  label: string;
  reason: string;
};

export type BankStock = {
  bank: BankName;
  approved_available: number;
  approved_total: number;
  rejected_total: number;
  days_of_stock: number;
  cycle_ok: boolean;
  consumers: BankConsumerStock[];
  rejections: BankRejection[];
};

export type LastSync = {
  finished_at: string;
  dataset_version: string;
  inserted: number;
  updated: number;
  unchanged: number;
  kept_rejected: number;
};

export type RejectedGuess = {
  word: string;
  distinct_players: number;
};

export type ContentStockResponse = {
  banks: BankStock[];
  last_sync: LastSync | null;
  top_rejected_guesses: RejectedGuess[];
};
