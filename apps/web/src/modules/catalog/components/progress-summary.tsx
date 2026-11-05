import { Card } from '@nerdose/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { SummaryKey } from '../home-view';
import { FOCUS } from './cta';

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
      <h2 id="progress-title" className="text-xl font-bold text-text">
        {t('catalog.summary.title')}
      </h2>
      <p className="text-sm text-text-muted">
        {t(`catalog.summary.${summary}`, { current: streaks.current, max: streaks.max })}
      </p>
      <Link
        to="/stats"
        className={`mt-auto inline-flex min-h-11 items-center gap-2 text-accent underline ${FOCUS}`}
      >
        {t('catalog.stats')}
        <span aria-hidden="true">→</span>
      </Link>
    </Card>
  );
}
