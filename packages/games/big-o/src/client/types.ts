import type { ReactNode } from 'react';

import type { CodeLanguage, Locale } from '@nerdose/core';

export type Translate = (key: string, options?: Record<string, unknown>) => string;
export type MoveErrorInfo = { code: string; message: string };
export type GameStatsView = {
  game_id: string;
  current_streak: number;
  max_streak: number;
  played: number;
  wins: number;
  win_rate: number | null;
  extra: unknown;
};

export type ClientBaseProps = {
  /** GameToday.number (never null: web does not mount the client without a challenge). */
  number: number;
  /** Active language (Intl and format fallback). */
  locale: Locale;
  /** `t` of the game namespace. */
  t: Translate;
  /** Slot for web banners, rendered at the position the screen.md declares. */
  notices?: ReactNode;
  /** session.preferred_code_language ?? 'js' (REQ-009 decision 12). Optional: defaults to 'js'. */
  codeLanguage?: CodeLanguage;
};
export type InstructionsProps = ClientBaseProps & {
  onStart: () => void;
  /** POST .../start in flight. */
  starting?: boolean;
  /** No session. */
  startDisabled?: boolean;
  /** Slot for the actions row (retry, back link). */
  actions?: ReactNode;
};
export type GameProps = ClientBaseProps & {
  /** GameToday.public_view (parsed inside the client). */
  publicView: unknown;
  /** PlayView.state */
  state: unknown;
  /** Last MoveResponse.feedback; Big O ignores it (feedbackSchema is null). */
  feedback?: unknown;
  /** Receives a BigOMove already validated with moveSchema. */
  onMove: (move: unknown) => void;
  /** POST .../move in flight. */
  pending: boolean;
  /** Last rejection that does not consume an attempt. */
  moveError: MoveErrorInfo | null;
  /** Voided: the board is hidden and input is ignored. */
  locked?: boolean;
  /** Accepted for host compatibility; Big O does not show it while playing. */
  gameStats?: GameStatsView | null;
  /** Slot for host content at the bottom of the aside column (e.g. the report link). */
  aside?: ReactNode;
};
export type ResultProps = ClientBaseProps & {
  result: unknown;
  /** Accepted for host compatibility; the Big O `result` does not carry the code: it comes from here. */
  publicView?: unknown;
  gameStats: GameStatsView | null;
  /** Slot for the streak card (aside column). */
  aside?: ReactNode;
  /** Slot at the bottom of the main column (web's exits bar). */
  footer?: ReactNode;
};

export type PreviewProps = {
  /** Full `{es,en}` payload (only reachable through /api/admin/*). */
  payload: unknown;
  /** Picks the text of every localized field. */
  language: Locale;
};
export type StatsSummaryProps = {
  /** GameStatsView.extra (shape of the game's statsSchema); parsed inside. */
  extra: unknown;
  /** Active language: number format and labels that do not come from i18n. */
  locale: Locale;
  /** `t` of the game namespace. */
  t: Translate;
};
