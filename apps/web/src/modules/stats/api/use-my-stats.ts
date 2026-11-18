import { keepPreviousData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useSession } from '@/modules/session';

import { fetchMyStats, statsKeys } from './my-stats';
import type { MyStats } from './my-stats';

export function useMyStats() {
  const { status, locale } = useSession();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: statsKeys.detail(locale),
    queryFn: ({ pageParam }) => fetchMyStats(locale, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.history_next_before ?? undefined,
    enabled: status === 'active' || status === 'unavailable',
    placeholderData: keepPreviousData,
  });

  // Al cambiar de idioma se recuerda cuántas páginas había cargadas (un número, no datos del servidor).
  const [tracked, setTracked] = useState({ locale, target: 1 });
  if (tracked.locale !== locale) {
    setTracked({
      locale,
      target:
        queryClient.getQueryData<InfiniteData<MyStats>>(statsKeys.detail(tracked.locale))?.pages
          .length ?? 1,
    });
  }
  const targetPages = tracked.target;

  const { data, isPlaceholderData, hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } =
    query;
  useEffect(() => {
    if (isPlaceholderData || !data) return;
    if (data.pages.length >= targetPages || isFetchNextPageError) return;
    if (hasNextPage && !isFetching) void fetchNextPage();
  }, [
    data,
    isPlaceholderData,
    hasNextPage,
    isFetching,
    isFetchNextPageError,
    fetchNextPage,
    targetPages,
  ]);

  return query;
}
