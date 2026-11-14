import type { ReactNode } from 'react';

import type { Locale } from '@nerdose/core';

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
  /** Receives a DevdleMove already validated with moveSchema. */
  onMove: (move: unknown) => void;
  /** POST .../move in flight. */
  pending: boolean;
  /** Last rejection that does not consume an attempt. */
  moveError: MoveErrorInfo | null;
  /** Voided: hides the keyboard and ignores input. */
  locked?: boolean;
  /** GameToday.game_stats: "tus intentos" panel in the aside while playing. */
  gameStats?: GameStatsView | null;
  /** Slot for host content at the bottom of the aside column (e.g. the report link). */
  aside?: ReactNode;
};
export type ResultProps = ClientBaseProps & {
  result: unknown;
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
