import { useTranslation } from 'react-i18next';

import type { Locale } from '@nerdose/core';
import { Heatmap, Panel } from '@nerdose/ui';

export function ActivityPanel({
  today,
  days,
  locale,
}: {
  today: string;
  days: { date: string; completed: number }[];
  locale: Locale;
}) {
  const { t } = useTranslation();
  return (
    <Panel title={t('stats.activity.title')}>
      <Heatmap
        today={today}
        days={days}
        locale={locale}
        caption={t('stats.activity.caption')}
        summaryLabel={(n) => t('stats.activity.summary', { count: n })}
        cellLabel={(d) => t('stats.activity.cell', { date: d.longDate, count: d.completed })}
        detailLabel={(d) =>
          t('stats.activity.detail', {
            date: d.isToday ? t('stats.activity.today') : d.shortDate,
            count: d.completed,
          })
        }
        emptyDetail={t('stats.activity.empty')}
      />
    </Panel>
  );
}
