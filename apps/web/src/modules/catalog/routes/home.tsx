import { Alert } from '@nerdose/ui';
import { GAME_IDS } from '@nerdose/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useDocumentTitle } from '@/hooks/use-document-title';
import { useSession } from '@/modules/session';

import { useToday } from '../api/use-today';
import { CTA_DISABLED, CTA_PRIMARY, CTA_SECONDARY, FOCUS } from '../components/cta';
import { DayStatus } from '../components/day-status';
import { GameCard } from '../components/game-card';
import { ProgressSummary } from '../components/progress-summary';
import { deriveHomeView } from '../home-view';

function scrollToGames() {
  const section = document.getElementById('juegos');
  if (!section) return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  section.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  section.focus();
}

export function Component() {
  const { t } = useTranslation();
  useDocumentTitle(t('shell.title'));
  const query = useToday();
  const { status } = useSession();
  const view = deriveHomeView({
    today: query.data,
    isPending: query.isPending,
    isError: query.isError,
    sessionStatus: status,
  });

  const hero = view.kind === 'ready' ? view.hero : { label: 'browse' as const, disabled: false };
  const cards = view.kind === 'loading' ? null : view.cards;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="home-title" className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col items-start gap-4 lg:col-span-7">
          <h1 id="home-title" tabIndex={-1} className="text-2xl font-bold text-text lg:text-3xl">
            {t('catalog.title')}
          </h1>
          <p className="text-base text-text-muted">{t('catalog.subtitle')}</p>
          <div className="flex flex-wrap items-center gap-4">
            {hero.disabled ? (
              <button type="button" aria-disabled="true" className={CTA_DISABLED}>
                {t(`catalog.hero.${hero.label}`)}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button type="button" onClick={scrollToGames} className={CTA_PRIMARY}>
                {t(`catalog.hero.${hero.label}`)}
                <span aria-hidden="true">→</span>
              </button>
            )}
            <Link
              to="/about"
              className={`inline-flex min-h-11 items-center gap-2 text-accent underline ${FOCUS}`}
            >
              {t('catalog.howItWorks')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        {view.kind === 'ready' ? (
          <div className="lg:col-span-5">
            <DayStatus view={view} syncedAt={query.dataUpdatedAt} />
          </div>
        ) : null}
      </section>

      {view.kind === 'loading' ? (
        <p role="status" className="text-base text-text-muted">
          {t('catalog.loading')}
        </p>
      ) : null}
      {view.kind === 'error' ? (
        <Alert
          action={
            <button type="button" onClick={() => void query.refetch()} className={CTA_SECONDARY}>
              <span aria-hidden="true">↻</span>
              {t('errors.retry')}
            </button>
          }
        >
          {t('catalog.error')}
        </Alert>
      ) : null}

      <section id="juegos" aria-label={t('catalog.gamesLabel')} tabIndex={-1}>
        {cards ? (
          <ul className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            {GAME_IDS.map((id) => {
              const card = cards.find((c) => c.game_id === id);
              return card ? (
                <li key={id}>
                  <GameCard gameId={id} view={card} />
                </li>
              ) : null;
            })}
            {view.kind === 'ready' ? (
              <li>
                <ProgressSummary summary={view.summary} streaks={view.streaks} />
              </li>
            ) : null}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
