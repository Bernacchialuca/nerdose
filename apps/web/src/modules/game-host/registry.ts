import type { GameId } from '@nerdose/core';

import type { GameClient } from './types';

/**
 * Único lugar que lista juegos. Los 5 juegos tienen client. Sigue parcial a propósito: un juego nuevo se suma con su paquete
 * (una línea acá + traducciones) y mientras tanto la ruta muestra «sin desafío hoy».
 */
export const clientRegistry: Partial<Record<GameId, () => Promise<GameClient>>> = {
  'big-o': () => import('@nerdose/game-big-o/client'),
  'bug-hunt': () => import('@nerdose/game-bug-hunt/client'),
  devdle: () => import('@nerdose/game-devdle/client'),
  'grep-grid': () => import('@nerdose/game-grep-grid/client'),
  timeline: () => import('@nerdose/game-timeline/client'),
} satisfies Partial<Record<GameId, () => Promise<GameClient>>>;

export const hasGameClient = (id: GameId): boolean => clientRegistry[id] !== undefined;
