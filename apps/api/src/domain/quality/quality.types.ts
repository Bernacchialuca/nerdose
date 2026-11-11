import type { CodeLanguage } from '@nerdose/core';

import type { ProgressRepository } from '@/domain/progress/progress.repository';

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

export type VoidTxRepos = { quality: QualityRepository; progress: ProgressRepository };

/** Transacción de la anulación: repos de calidad y progreso ligados a la misma conexión. */
export type VoidTx = <T>(fn: (repos: VoidTxRepos) => Promise<T>) => Promise<T>;
