import { useTranslation } from 'react-i18next';

import { formatCountdown } from '@/lib/format-countdown';

import { useDayCountdown } from '../api/use-day-countdown';
import type { HomeView } from '../home-view';

type ReadyView = Extract<HomeView, { kind: 'ready' }>;

export function DayStatus({ view, syncedAt }: { view: ReadyView; syncedAt: number }) {
  const { t } = useTranslation();
  const remaining = useDayCountdown(view.secondsToReset, syncedAt);
  const { progress, globalStreak } = view;

  return (
    <div className="flex flex-col gap-3 font-mono">
      <p className="text-base text-text">
        {t(`catalog.progress.${progress.key}`, {
          completed: progress.completed,
          total: progress.total,
        })}
      </p>
      <div aria-hidden="true" className="h-2 w-full bg-surface-2">
        <div className="h-full bg-accent" style={{ width: `${progress.fill * 100}%` }} />
      </div>
      <p className="text-base text-text">
        {globalStreak === null
          ? t('catalog.globalStreakUnknown')
          : t('catalog.globalStreak', { count: globalStreak })}
      </p>
      <p className="text-xs text-text-dim">
        {t('catalog.countdown', { time: formatCountdown(remaining) })}
      </p>
    </div>
  );
}
