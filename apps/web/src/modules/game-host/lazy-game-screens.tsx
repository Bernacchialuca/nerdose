import { lazy } from 'react';
import type { ComponentType } from 'react';

import { GAME_IDS } from '@nerdose/core';
import type { GameId } from '@nerdose/core';

import { GameScreens } from './components/game-screens';
import type { GameScreensProps } from './components/game-screens';
import { loadGameClient } from './load-game-client';
import { clientRegistry } from './registry';

function createScreens(gameId: GameId): ComponentType<GameScreensProps> {
  return lazy(() =>
    loadGameClient(gameId).then((client) => ({
      default: (props: GameScreensProps) => <GameScreens client={client} {...props} />,
    })),
  );
}

/**
 * `React.lazy` de las pantallas de cada juego con client (ADR-002). Se crean una sola vez al cargar
 * el módulo: crear un `lazy()` por render remontaría el árbol y perdería el estado del client
 * (borrador, hints). La lista de juegos sale del registry, no de acá.
 */
export const gameScreens: Partial<Record<GameId, ComponentType<GameScreensProps>>> =
  Object.fromEntries(
    GAME_IDS.filter((id) => clientRegistry[id] !== undefined).map((id) => [id, createScreens(id)]),
  );
