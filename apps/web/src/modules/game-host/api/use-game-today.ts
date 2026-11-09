import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { GameId } from '@nerdose/core';

import { useSession } from '@/modules/session';

import { fetchGameToday, gameTodayKeys } from './game-today';

type Options = { enabled?: boolean };

/** Con `placeholderData` el cambio de idioma no vacía el tablero (D7). */
export function useGameToday(gameId: GameId, { enabled = true }: Options = {}) {
  const { locale, status } = useSession();
  return useQuery({
    queryKey: gameTodayKeys.detail(gameId, locale),
    queryFn: () => fetchGameToday(gameId, locale),
    placeholderData: keepPreviousData,
    enabled: enabled && status !== 'loading',
  });
}
