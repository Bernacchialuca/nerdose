import { Alert, buttonClass } from '@nerdose/ui';
import { GAME_IDS } from '@nerdose/core';
import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '@/hooks/use-document-title';
import { formatDayLabel } from '@/lib/format-day';
import { useSession } from '@/modules/session';

import { useToday } from '../api/use-today';
import { ChallengesHeader } from '../components/challenges-header';
import { DayTerminal } from '../components/day-terminal';
import { GameCard } from '../components/game-card';
import { HowItWorks } from '../components/how-it-works';
import { NextGamePlaceholder } from '../components/next-game-placeholder';
import { ProgressPanel } from '../components/progress-panel';
import { deriveHomeView } from '../home-view';

function scrollToSection(id: string, focusId: string = id) {
  const section = document.getElementById(id);
  if (!section) return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  section.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  document.getElementById(focusId)?.focus();
}

export function Component() {
  const { t } = useTranslation();
  useDocumentTitle(t('shell.title'));
  const query = useToday();
  const { status, locale } = useSession();
  const view = deriveHomeView({
    today: query.data,
    isPending: query.isPending,
    isError: query.isError,
    sessionStatus: status,
  });

  const hero = view.kind === 'ready' ? view.hero : { label: 'browse' as const, disabled: false };
  const cards = view.kind === 'loading' ? null : view.cards;

  return (
    <div className="flex flex-col gap-18">
      <section aria-labelledby="home-title" className="flex flex-wrap items-center gap-12">
        <div className="flex min-w-0 grow basis-130 flex-col gap-5.5">
          {view.kind === 'ready' ? (
            <p className="font-mono text-mono-body text-text-muted">
              {t('catalog.hero.prompt')}{' '}
              <span className="text-accent">
                {t('catalog.hero.date', { date: formatDayLabel(view.date, locale) })}
              </span>
            </p>
          ) : null}
          <h1
            id="home-title"
            tabIndex={-1}
            className="font-mono text-display-hero text-text break-words hyphens-auto"
          >
            {t('catalog.title')}
          </h1>
          <p className="max-w-lede font-sans text-body-lede text-text-lede">
            {t('catalog.subtitle')}
          </p>
          <div className="flex flex-wrap gap-3 pt-1.5">
            {hero.disabled ? (
              <button
                type="button"
                aria-disabled="true"
                className={buttonClass({ size: 'lg', disabled: true })}
              >
                {t(`catalog.hero.${hero.label}`)}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => scrollToSection('juegos')}
                className={buttonClass({ variant: 'primary', size: 'lg' })}
              >
                {t(`catalog.hero.${hero.label}`)}
                <span aria-hidden="true">→</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection('como', 'como-title')}
              className={buttonClass({ variant: 'secondary', size: 'lg' })}
            >
              {t('catalog.howItWorks')}
            </button>
          </div>
        </div>
        {view.kind === 'ready' ? (
          <DayTerminal view={view} syncedAt={query.dataUpdatedAt} className="grow basis-105" />
        ) : null}
      </section>

      {view.kind === 'loading' ? (
        <p role="status" className="font-mono text-mono-body text-text-muted">
          {t('catalog.loading')}
        </p>
      ) : null}
      {view.kind === 'error' ? (
        <Alert
          action={
            <button
              type="button"
              onClick={() => void query.refetch()}
              className={buttonClass({ variant: 'secondary' })}
            >
              <span aria-hidden="true">↻</span>
              {t('errors.retry')}
            </button>
          }
        >
          {t('catalog.error')}
        </Alert>
      ) : null}

      <section
        id="juegos"
        aria-labelledby="challenges-title"
        tabIndex={-1}
        className="flex flex-col gap-6"
      >
        <ChallengesHeader progress={view.kind === 'ready' ? view.progress : null} />
        {cards ? (
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
            {GAME_IDS.map((id) => {
              const card = cards.find((c) => c.game_id === id);
              return card ? (
                <li key={id} className="flex">
                  <GameCard gameId={id} view={card} />
                </li>
              ) : null;
            })}
            <li className="flex">
              <NextGamePlaceholder />
            </li>
          </ul>
        ) : null}
      </section>

      {view.kind === 'ready' ? <ProgressPanel view={view} /> : null}
      <HowItWorks />
    </div>
  );
}
