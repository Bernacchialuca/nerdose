import { Card, cn, linkClass } from '@nerdose/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { SummaryKey } from '../home-view';

export function ProgressSummary({
  summary,
  streaks,
}: {
  summary: SummaryKey;
  streaks: { current: number; max: number };
}) {
  const { t } = useTranslation();
  return (
    <Card aria-labelledby="progress-title" className="h-full">
      <h2 id="progress-title" className="font-mono text-title-panel text-text">
        {t('catalog.summary.title')}
      </h2>
      <p
        className={cn('text-sm text-text-muted', summary === 'streaks' ? 'font-mono' : 'font-sans')}
      >
        {t(`catalog.summary.${summary}`, { current: streaks.current, max: streaks.max })}
      </p>
      <Link to="/stats" className={cn(linkClass(), 'mt-auto')}>
        {t('catalog.stats')}
        <span aria-hidden="true">→</span>
      </Link>
    </Card>
  );
}
