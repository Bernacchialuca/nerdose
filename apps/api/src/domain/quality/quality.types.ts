import type { CodeLanguage } from '@nerdose/core';

import type { QualityRepository } from './quality.repository';

export type ReportContext = {
  code_language: CodeLanguage | null;
  play_status: string | null;
  play_state: unknown;
  user_agent: string | null;
};

export type AlertThresholds = {
  count: number;
  ratio: number;
  ratioMinCount: number;
};

/** Ejecuta `fn` en una transacción con un repositorio ligado a ella. */
export type ReportTx = <T>(fn: (repo: QualityRepository) => Promise<T>) => Promise<T>;
