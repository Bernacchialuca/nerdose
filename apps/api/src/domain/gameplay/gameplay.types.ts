import type { CodeLanguage, GameId } from '@nerdose/core';

import type { IdentityRepository } from '@/domain/identity/identity.repository';
import type { GameStatsView, ProgressWriteRepo, Streaks } from '@/domain/progress/progress.types';
import type { PlayStatus, PublicChallengeStatus } from '@/domain/publishing/publishing.types';

import type { GameplayRepository } from './gameplay.repository';

export type PlayView = {
  status: PlayStatus;
  state: unknown;
  score: number | null;
  code_language: CodeLanguage | null;
};

export type GameToday = {
  game_id: GameId;
  date: string;
  number: number | null;
  challenge_status: PublicChallengeStatus;
  public_view: unknown;
  play: PlayView | null;
  result: unknown;
  game_stats: GameStatsView | null;
  reported: boolean;
};

export type AcknowledgeVoidResponse = {
  play: { status: 'voided' };
  streaks: Streaks;
};

export type MoveResponse = {
  feedback: unknown;
  play: PlayView;
  result: unknown;
  streaks: Streaks | null;
  game_stats: GameStatsView | null;
};

export type MoveTxRepos = {
  plays: Pick<
    GameplayRepository,
    | 'insertPlayIfAbsent'
    | 'lockPlay'
    | 'updateState'
    | 'closePlay'
    | 'lockChallenge'
    | 'findPlay'
    | 'insertVoidedPlayIfAbsent'
  >;
  progress: ProgressWriteRepo;
  identity: Pick<IdentityRepository, 'updatePreferences'>;
};

/** Ejecuta `fn` en una transacción: si lanza, ROLLBACK y relanza. */
export type MoveTx = <T>(fn: (r: MoveTxRepos) => Promise<T>) => Promise<T>;
