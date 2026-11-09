import { useQueryClient } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { todayKeys } from './today';

const NO_KEYS: readonly QueryKey[] = [];

/** Jitter máximo (ms) antes de volver a pedir `GET /api/today` al llegar a 0 (ADR-008). */
export const RESET_JITTER_MAX_MS = 3000;

/**
 * Segundos que faltan para el próximo reinicio. Descuenta `secondsToReset` desde el instante de la
 * respuesta (`syncedAt`, ms epoch) y, al llegar a 0, espera un jitter aleatorio de 0–3 s e invalida
 * las queries `today` (y las `extraKeys`, p. ej. la del juego abierto) una sola vez por respuesta. El reloj del cliente solo mide segundos
 * transcurridos: nunca decide el día ni el número.
 */
export function useDayCountdown(
  secondsToReset: number,
  syncedAt: number,
  extraKeys: readonly QueryKey[] = NO_KEYS,
): number {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - syncedAt) / 1000));
  const remaining = Math.max(0, secondsToReset - elapsed);
  const expired = remaining === 0;

  useEffect(() => {
    if (!expired) return;
    const jitter = Math.floor(Math.random() * (RESET_JITTER_MAX_MS + 1));
    const id = setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: todayKeys.all });
      for (const queryKey of extraKeys) void queryClient.invalidateQueries({ queryKey });
    }, jitter);
    return () => clearTimeout(id);
  }, [expired, syncedAt, secondsToReset, queryClient, extraKeys]);

  return remaining;
}
