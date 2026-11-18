import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, Banner, buttonClass } from '@nerdose/ui';

import { useDocumentTitle } from '@/hooks/use-document-title';
import { useToday } from '@/modules/catalog';
import { useSession } from '@/modules/session';

import { useMyStats } from '../api/use-my-stats';
import { ActivityPanel } from '../components/activity-panel';
import { GameStatsCard } from '../components/game-stats-card';
import { HistoryPanel } from '../components/history-panel';
import { StatsInvitation } from '../components/stats-invitation';
import { StatsKpis } from '../components/stats-kpis';
import { deriveStatsView } from '../stats-view';

export function Component() {
  const { t } = useTranslation();
  useDocumentTitle(t('stats.documentTitle'));
  const gamesTitleId = useId();
  const { status, locale } = useSession();
  const todayDate = useToday().data?.date;
  const query = useMyStats();
  const view = deriveStatsView({ sessionStatus: status, query, todayDate });

  return (
    <div className="flex flex-col gap-8">
      <h1 tabIndex={-1} className="font-mono text-title-page break-words text-text">
        {t('stats.title')}
      </h1>
      {view.kind === 'loading' ? (
        <p role="status" className="font-mono text-meta text-text-muted">
          {t('stats.loading')}
        </p>
      ) : view.kind === 'error' ? (
        <Alert
          action={
            <button
              type="button"
              className={buttonClass({ variant: 'secondary', size: 'md' })}
              onClick={() => void query.refetch()}
            >
              {t('stats.error.retry')}
            </button>
          }
        >
          {view.rateLimited ? t('stats.error.rateLimited') : t('stats.error.network')}
        </Alert>
      ) : (
        <>
          {view.localBanner ? (
            <Banner title={t('cookies.title')}>{t('cookies.detail')}</Banner>
          ) : null}
          {view.empty ? <StatsInvitation noSession={view.noSession} /> : null}
          <StatsKpis global={view.global} locale={locale} />
          <ActivityPanel today={view.today} days={view.heatmap} locale={locale} />
          <section aria-labelledby={gamesTitleId} className="flex flex-col gap-4">
            <h2 id={gamesTitleId} className="font-mono text-title-panel text-text">
              {t('stats.games.title')}
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] items-start gap-4">
              {view.games.map((g) => (
                <GameStatsCard key={g.gameId} gameId={g.gameId} stats={g.stats} locale={locale} />
              ))}
            </div>
          </section>
          <HistoryPanel
            rows={view.history}
            locale={locale}
            hasMore={view.hasMore}
            loadingMore={view.loadingMore}
            loadMoreError={view.loadMoreError}
            onLoadMore={() => query.fetchNextPage()}
          />
        </>
      )}
    </div>
  );
}
