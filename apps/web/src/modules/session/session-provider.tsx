import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { LOCALES } from '@nerdose/core';
import type { Locale } from '@nerdose/core';

import { ApiError } from '@/lib/api-client';
import { fetchToday, todayKeys } from '@/modules/catalog';

import { createSession, sessionKeys, updatePreferences } from './api/session';
import type { SessionResponse } from './api/session';
import { SessionContext } from './session-context';
import type { SessionContextValue, SessionStatus } from './session-context';

function toLocale(lang: string | undefined): Locale {
  return LOCALES.find((l) => l === lang) ?? 'es';
}

export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const locale = toLocale(i18n.resolvedLanguage);

  const bootstrap = useQuery({
    queryKey: sessionKeys.all,
    queryFn: async () => {
      const res = await createSession();
      await i18n.changeLanguage(res.locale);
      await queryClient.cancelQueries({ queryKey: todayKeys.all });
      try {
        await queryClient.fetchQuery({
          queryKey: todayKeys.detail(res.locale),
          queryFn: () => fetchToday(res.locale),
          staleTime: 0,
        });
      } catch {
        // la home muestra su propio error; la sesión sigue siendo válida
      }
      return res;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const today = useQuery({
    queryKey: todayKeys.detail(locale),
    queryFn: () => fetchToday(locale),
    enabled: bootstrap.isSuccess,
  });

  useEffect(() => {
    if (bootstrap.error) console.error(bootstrap.error);
  }, [bootstrap.error]);

  let status: SessionStatus = 'active';
  if (bootstrap.isPending) status = 'loading';
  else if (bootstrap.isError) status = 'unavailable';
  else if (today.data?.has_session === false) status = 'cookies_blocked';

  const changeLocale = useCallback(
    async (next: Locale) => {
      if (next === locale) return;
      await i18n.changeLanguage(next);
      if (status !== 'active') return;
      try {
        let prefs;
        try {
          prefs = await updatePreferences({ locale: next });
        } catch (err) {
          if (!(err instanceof ApiError) || err.code !== 'no_session') throw err;
          await createSession();
          prefs = await updatePreferences({ locale: next });
        }
        queryClient.setQueryData<SessionResponse>(
          sessionKeys.all,
          (old) => old && { ...old, ...prefs },
        );
        await queryClient.invalidateQueries({ queryKey: todayKeys.all });
      } catch (err) {
        const expected =
          err instanceof ApiError && (err.code === 'rate_limited' || err.code === 'no_session');
        if (!expected) console.error(err);
      }
    },
    [i18n, locale, queryClient, status],
  );

  const preferredCodeLanguage = bootstrap.data?.preferred_code_language ?? null;
  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      canPlay: status === 'active',
      locale,
      preferred_code_language: preferredCodeLanguage,
      changeLocale,
    }),
    [status, locale, preferredCodeLanguage, changeLocale],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
