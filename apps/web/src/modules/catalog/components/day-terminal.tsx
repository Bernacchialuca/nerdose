import { TerminalWindow } from '@nerdose/ui';
import { useTranslation } from 'react-i18next';

import { formatCountdown } from '@/lib/format-countdown';

import { useDayCountdown } from '../api/use-day-countdown';
import type { HomeView } from '../home-view';

type ReadyView = Extract<HomeView, { kind: 'ready' }>;

export function DayTerminal({
  view,
  syncedAt,
  className,
}: {
  view: ReadyView;
  syncedAt: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const remaining = useDayCountdown(view.secondsToReset, syncedAt);
  const { rows, streak } = view.terminal;

  return (
    <TerminalWindow
      className={className}
      label={t('catalog.terminal.label')}
      title={t('catalog.terminal.title')}
      command={t('catalog.terminal.command')}
      rows={rows.map((r) => ({
        key: r.game_id,
        state: r.state,
        slug: r.game_id,
        metric: r.metric,
        status: r.status ? t(`catalog.terminal.status.${r.status}`) : undefined,
      }))}
      summary={{
        label: t('catalog.terminal.streakLabel'),
        value:
          streak.current === null
            ? t('catalog.terminal.streakUnknown')
            : t('catalog.terminal.streakValue', { count: streak.current, max: streak.max }),
        tone: streak.tone,
      }}
      countdown={{
        label: t('catalog.terminal.countdown'),
        value: formatCountdown(remaining),
      }}
    />
  );
}
