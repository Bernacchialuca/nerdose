import type { ComponentType, ReactNode } from 'react';

import type { Locale } from '@nerdose/core';

import type { GameStatsView } from './api/game-today';

export type { GameStatsView };

// Copia estructural del contrato del `./client` del paquete de Devdle: la capa de `web` no importa
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
  onMove: (move: unknown) => void;
  pending: boolean;
  moveError: MoveErrorInfo | null;
  locked?: boolean;
  gameStats?: GameStatsView | null;
};
export type ResultProps = ClientBaseProps & {
  result: unknown;
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
