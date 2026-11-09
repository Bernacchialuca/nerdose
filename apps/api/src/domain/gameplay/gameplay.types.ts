import type { CodeLanguage, GameId } from '@nerdose/core';

import type { GameStatsView } from '@/domain/progress/progress.types';
import type { PlayStatus, PublicChallengeStatus } from '@/domain/publishing/publishing.types';

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
};
