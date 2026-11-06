import { ProgressBar } from '@nerdose/ui';
import { GAME_IDS } from '@nerdose/core';
import { useTranslation } from 'react-i18next';

import type { HomeProgress } from '../home-view';

export function ChallengesHeader({ progress }: { progress: HomeProgress | null }) {
  const { t } = useTranslation();
  const label = progress
    ? t(`catalog.progress.${progress.key}`, {
        completed: progress.completed,
        total: progress.total,
      })
    : null;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1.5">
        {label ? (
          <p className="font-mono text-label-comment text-text-dim">
            <span aria-hidden="true">// </span>
            {label}
          </p>
        ) : null}
        <h2 id="challenges-title" className="font-mono text-title-section-lg text-text">
          {t('catalog.challenges.title')}
        </h2>
      </div>
      {progress && label ? (
        <ProgressBar
          variant="segmented"
          value={progress.completed ?? 0}
          total={progress.total ?? GAME_IDS.length}
          label={label}
        />
      ) : null}
    </div>
  );
}
