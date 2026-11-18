import { useTranslation } from 'react-i18next';

import type { Locale } from '@nerdose/core';
import { StreakNumber } from '@nerdose/ui';

import type { MyStats } from '../api/my-stats';
import { formatCount } from '../format';

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-panel border border-border bg-surface p-5">
      <p className="font-mono text-numeric-lg text-text">{value}</p>
      <p className="font-sans text-body-sm text-text-muted">{label}</p>
    </div>
  );
}

export function StatsKpis({ global, locale }: { global: MyStats['global']; locale: Locale }) {
  const { t } = useTranslation();
  const { current_streak: current, max_streak: max, total_completed: completed } = global;
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3">
      <div className="flex flex-col gap-2.5 rounded-feature border border-streak-border bg-streak-surface p-6.5">
        <p className="font-mono text-label-comment text-streak-label">
          <span aria-hidden="true">// </span>
          {t('stats.kpis.streakLabel')}
        </p>
        <StreakNumber
          value={current}
          unit={
            <>
              {t('stats.kpis.streakUnit', { count: current })}
              <br />
              {t('stats.kpis.streakSuffix', { count: current })}
            </>
          }
        />
      </div>
      <StatCard
        value={t('stats.kpis.recordValue', { count: max })}
        label={t('stats.kpis.record')}
      />
      <StatCard value={formatCount(completed, locale)} label={t('stats.kpis.completed')} />
    </div>
  );
}
