import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useMatches } from 'react-router';

import { AppHeader, Banner, BrandMark, cn } from '@nerdose/ui';

import { MainNav } from '@/components/main-nav';
import { SiteFooter } from '@/components/site-footer';
import { ChallengeNumber, GlobalStreakPill } from '@/modules/catalog';
import { focusMainHeading } from '@/lib/focus-main-heading';
import type { ShellHandle } from '@/lib/route-handle';
import { LanguageSelector, useSession } from '@/modules/session';
import { useInvalidateStatsOnDayChange } from '@/modules/stats';

export function Shell() {
  const { t } = useTranslation();
  const { status } = useSession();
  useInvalidateStatsOnDayChange();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  // La última ruta con `handle.header` que devuelva un nodo reemplaza al header de plataforma.
  const customHeader = useMatches()
    .map((m) => (m.handle as ShellHandle | undefined)?.header?.(m.params))
    .reverse()
    .find((node) => node != null);
  // Compara contra la ruta anterior (y no un flag de "primer render"): en StrictMode
  // el efecto corre dos veces al montar y el flag dejaba enfocar el h1 al cargar.
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    focusMainHeading();
  }, [pathname]);

  return (
    <div
      className={cn('flex min-h-dvh flex-col bg-bg font-sans text-text', isHome && 'texture-dots')}
    >
      {customHeader ?? (
        <AppHeader
          variant={isHome ? 'home' : 'default'}
          className="font-mono"
          brand={
            <Link
              to="/"
              className="inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <BrandMark label={t('shell.brand')} cursor={isHome ? 'blink' : 'static'} />
            </Link>
          }
          nav={<MainNav />}
        >
          {isHome ? <GlobalStreakPill /> : null}
          <ChallengeNumber />
          <LanguageSelector />
        </AppHeader>
      )}
      {customHeader == null && status === 'cookies_blocked' ? (
        <div className="mx-auto w-full max-w-page px-8 pt-6">
          <Banner title={t('cookies.title')}>{t('cookies.detail')}</Banner>
        </div>
      ) : null}
      <main
        className={cn(
          'mx-auto w-full min-w-0 max-w-page flex-1 px-8',
          isHome ? 'pt-16 pb-12' : 'pt-12 pb-14',
        )}
      >
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
