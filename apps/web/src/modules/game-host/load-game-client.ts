import { LOCALES } from '@nerdose/core';
import type { GameId } from '@nerdose/core';

import i18n from '@/i18n';

import { clientRegistry } from './registry';
import type { GameClient } from './types';

const cache = new Map<GameId, Promise<GameClient>>();

/**
 * Carga el client del juego (un chunk por juego) y registra su namespace de i18n en la instancia
 * de la app antes de entregarlo (D11). Memoizado: la misma promesa para todos los llamadores.
 */
export function loadGameClient(gameId: GameId): Promise<GameClient> {
  const cached = cache.get(gameId);
  if (cached) return cached;
  const load = clientRegistry[gameId];
  const promise = load
    ? load().then((client) => {
        for (const lng of LOCALES) {
          i18n.addResourceBundle(
            lng,
            client.i18n.namespace,
            client.i18n.resources[lng],
            true,
            true,
          );
        }
        return client;
      })
    : Promise.reject(new Error(`No hay client registrado para ${gameId}`));
  // Un fallo de carga no se queda en cache: «Reintentar» de la pantalla de error vuelve a intentar.
  promise.catch(() => cache.delete(gameId));
  cache.set(gameId, promise);
  return promise;
}
