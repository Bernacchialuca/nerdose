import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useToday } from '@/modules/catalog';

import { statsKeys } from './my-stats';

/** Invalida las estadísticas cuando la fecha de `GET /api/today` cambia respecto de la ya conocida. */
export function useInvalidateStatsOnDayChange(): void {
  const queryClient = useQueryClient();
  const date = useToday().data?.date;
  const previous = useRef(date);
  useEffect(() => {
    if (date === undefined) return;
    if (previous.current !== undefined && previous.current !== date) {
      void queryClient.invalidateQueries({ queryKey: statsKeys.all });
    }
    previous.current = date;
  }, [date, queryClient]);
}
