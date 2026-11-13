import type { ComponentType, ReactNode } from 'react';

import type { Locale } from '@nerdose/core';

import type { GameStatsView } from './api/game-today';

export type { GameStatsView };

// Copia estructural del contrato de los `./client` (Devdle, Grep Grid): la capa de `web` no importa
// tipos de ningún juego (solo el registry toca los paquetes).
export type Translate = (key: string, options?: Record<string, unknown>) => string;
export type MoveErrorInfo = { code: string; message: string };

export type ClientBaseProps = {
  number: number;
  locale: Locale;
  t: Translate;
  notices?: ReactNode;
};
export type InstructionsProps = ClientBaseProps & {
  onStart: () => void;
  starting?: boolean;
  startDisabled?: boolean;
  actions?: ReactNode;
};
export type GameProps = ClientBaseProps & {
  publicView: unknown;
  state: unknown;
  /** Último `MoveResponse.feedback`; `null` hasta la primera jugada. El host no lo interpreta. */
  feedback: unknown | null;
  onMove: (move: unknown) => void;
  pending: boolean;
  moveError: MoveErrorInfo | null;
  locked?: boolean;
  gameStats?: GameStatsView | null;
  /** Pie de la columna lateral (link de reporte). */
  aside?: ReactNode;
};
export type ResultProps = ClientBaseProps & {
  result: unknown;
  /** `GameToday.public_view`; el client puede usarla para dibujar el tablero final. */
  publicView?: unknown;
  gameStats: GameStatsView | null;
  aside?: ReactNode;
  footer?: ReactNode;
};

export type GameClient = {
  Instructions: ComponentType<InstructionsProps>;
  Game: ComponentType<GameProps>;
  Result: ComponentType<ResultProps>;
  share: (result: unknown, number: number) => string;
  i18n: { namespace: string; resources: Record<Locale, Record<string, unknown>> };
  HELP_TARGET_ID: string;
};
