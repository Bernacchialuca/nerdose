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
  /** Last MoveResponse.feedback; null until the first move. Processed by identity after mount. */
  feedback?: unknown;
  /** Receives a GrepGridMove already validated with moveSchema. */
  onMove: (move: unknown) => void;
  /** POST .../move in flight. */
  pending: boolean;
  /** Last rejection that does not consume an attempt. */
  moveError: MoveErrorInfo | null;
  /** Voided: the grid ignores input and "Rendirse" is hidden. */
  locked?: boolean;
  /** Accepted for host compatibility; Grep Grid does not show it while playing. */
  gameStats?: GameStatsView | null;
  /** Slot for host content at the bottom of the aside column (e.g. the report link). */
  aside?: ReactNode;
};
export type ResultProps = ClientBaseProps & {
  result: unknown;
  /**
   * GameToday.public_view: carries the 144 letters. `result` only has the 8 words, so without it
   * the cells outside the words render as a placeholder dot.
   */
  publicView?: unknown;
  gameStats: GameStatsView | null;
  /** Slot for the streak card (aside column). */
  aside?: ReactNode;
  /** Slot at the bottom of the main column (web's exits bar). */
  footer?: ReactNode;
};
