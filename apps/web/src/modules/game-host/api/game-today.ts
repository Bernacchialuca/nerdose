import type { CodeLanguage, GameId, Locale, ReportReason } from '@nerdose/core';

import { api } from '@/lib/api-client';
import type { PlayStatus } from '@/modules/catalog';

export type GameStatsView = {
  game_id: string;
  current_streak: number;
  max_streak: number;
  played: number;
  wins: number;
  win_rate: number | null;
  extra: unknown;
};

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
  challenge_status: 'published' | 'voided' | 'none';
  public_view: unknown;
  play: PlayView | null;
  result: unknown;
  game_stats: GameStatsView | null;
  reported: boolean;
};

export type StartResponse = { play: PlayView };

export type Streaks = {
  game: { current: number; max: number };
  global: { current: number; max: number };
};

export type MoveResponse = {
  feedback: unknown;
  play: PlayView;
  result: unknown;
  streaks: Streaks | null;
  game_stats: GameStatsView | null;
};

export type ReportRequest = { challenge_number: number; reason: ReportReason; message?: string };

export type ReportResponse = { report_id: string };

export type AcknowledgeVoidResponse = { play: { status: 'voided' }; streaks: Streaks };

export const gameTodayKeys = {
  all: ['game-today'] as const,
  game: (gameId: GameId) => ['game-today', gameId] as const,
  detail: (gameId: GameId, lang: Locale) => ['game-today', gameId, lang] as const,
};

export const fetchGameToday = (gameId: GameId, lang: Locale) =>
  api<GameToday>(`/api/games/${gameId}/today?lang=${lang}`);
