import { Card, linkClass, Panel, StreakNumber } from '@nerdose/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { HomeView } from '../home-view';

type ReadyView = Extract<HomeView, { kind: 'ready' }>;

export function ProgressPanel({ view }: { view: ReadyView }) {
  const { t } = useTranslation();
  const { globalStreak, streaks, summary } = view;

  return (
    <Panel variant="feature" aria-labelledby="progress-title" className="gap-5.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-label-comment text-text-dim">
            <span aria-hidden="true">// </span>
            {t('catalog.progressPanel.label')}
          </p>
          <h2 id="progress-title" className="font-mono text-title-section text-text">
            {t('catalog.summary.title')}
          </h2>
        </div>
        <Link to="/stats" className={linkClass()}>
          {t('catalog.stats')}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="flex flex-wrap items-end gap-5">
        <div className="flex min-w-0 grow-2 basis-140 flex-col gap-4">
          <StreakNumber
            variant="compact"
            value={globalStreak}
            unit={
              globalStreak === null ? (
                t('catalog.progressPanel.unitUnknown')
              ) : (
                <>
                  {t('catalog.progressPanel.unit', { count: globalStreak })}
                  <br />
                  {t('catalog.progressPanel.unitSuffix', { count: globalStreak })}
                </>
              )
            }
          />
          {summary !== 'streaks' ? (
            <p className="font-sans text-caption text-text-muted">
              {t(`catalog.summary.${summary}`)}
            </p>
          ) : null}
        </div>
        <div className="min-w-0 grow basis-80">
          <Card
            variant="mini-stat"
            value={globalStreak === null ? '—' : streaks.max}
            label={t('catalog.progressPanel.record')}
          />
        </div>
      </div>
    </Panel>
  );
}
