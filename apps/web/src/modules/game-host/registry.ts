import type { GameId } from '@nerdose/core';

import type { GameClient } from './types';

/**
 * Único lugar que lista juegos. Parcial a propósito (Devdle, Grep Grid y Tech Timeline): los demás juegos se suman con su paquete
 * (una línea acá + traducciones) y mientras tanto la ruta muestra «sin desafío hoy».
 */
export const clientRegistry: Partial<Record<GameId, () => Promise<GameClient>>> = {
  devdle: () => import('@nerdose/game-devdle/client'),
  'grep-grid': () => import('@nerdose/game-grep-grid/client'),
  timeline: () => import('@nerdose/game-timeline/client'),
} satisfies Partial<Record<GameId, () => Promise<GameClient>>>;

export const hasGameClient = (id: GameId): boolean => clientRegistry[id] !== undefined;
