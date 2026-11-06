import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router';

import { AppHeader, Banner, BrandMark } from '@nerdose/ui';

import { MainNav } from '@/components/main-nav';
import { SiteFooter } from '@/components/site-footer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { DESKTOP_MEDIA_QUERY } from '@/lib/breakpoints';
import { ChallengeNumber } from '@/modules/catalog';
import { LanguageSelector, useSession } from '@/modules/session';

export function Shell() {
  const { t } = useTranslation();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const { status } = useSession();
  const { pathname } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>('main h1')?.focus();
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg font-sans text-text">
      <AppHeader
        className="font-mono"
        brand={
          <Link
            to="/"
            className="inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <BrandMark label={t('shell.brand')} />
          </Link>
        }
      >
        {isDesktop ? <MainNav /> : null}
        <ChallengeNumber />
        <LanguageSelector />
      </AppHeader>
      {isDesktop ? null : <MainNav className="border-b border-border px-4 font-mono" />}
      {status === 'cookies_blocked' ? (
        <Banner title={t('cookies.title')}>{t('cookies.detail')}</Banner>
      ) : null}
      <main className="flex-1 px-4 py-6 lg:px-12">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
