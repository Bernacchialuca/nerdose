import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router';

import { AppHeader, Banner, BrandMark, cn } from '@nerdose/ui';

import { MainNav } from '@/components/main-nav';
import { SiteFooter } from '@/components/site-footer';
import { ChallengeNumber, GlobalStreakPill } from '@/modules/catalog';
import { LanguageSelector, useSession } from '@/modules/session';

export function Shell() {
  const { t } = useTranslation();
  const { status } = useSession();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>('main h1')?.focus();
  }, [pathname]);

  return (
    <div
      className={cn('flex min-h-dvh flex-col bg-bg font-sans text-text', isHome && 'texture-dots')}
    >
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
      {status === 'cookies_blocked' ? (
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
