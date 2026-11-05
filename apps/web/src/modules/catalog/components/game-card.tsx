import { Card, cn } from '@nerdose/ui';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { GameId } from '../api/today';
import { GAME_CATALOG } from '../games';
import type { CardView } from '../home-view';
import { CTA_DISABLED, CTA_PRIMARY, CTA_SECONDARY } from './cta';

export function GameCard({ gameId, view }: { gameId: GameId; view: CardView }) {
  const { t } = useTranslation();
  const meta = GAME_CATALOG[gameId];
  const { cta, status } = view;

  const metadata = [
    meta.untimed ? t('catalog.card.untimed') : null,
    t('catalog.card.minutes', { count: meta.minutes }),
    view.streak !== null ? t('catalog.card.streak', { count: view.streak }) : null,
  ].filter((item): item is string => item !== null);

  return (
    <Card aria-labelledby={`game-${gameId}`} className="h-full">
      <h2 id={`game-${gameId}`} className={cn('text-xl font-bold', meta.accentClass)}>
        {t(`games.${gameId}.name`)}
      </h2>
      <p className="text-sm text-text-muted">{t(`games.${gameId}.description`)}</p>
      <p className="text-xs text-text-dim">
        {metadata.map((item, index) => (
          <Fragment key={item}>
            {index > 0 ? <span aria-hidden="true"> · </span> : null}
            {item}
          </Fragment>
        ))}
      </p>
      {status !== null ? (
        <p className="text-sm text-text">{view.label ?? t(`catalog.card.status.${status}`)}</p>
      ) : null}
      {cta ? (
        <div className="mt-auto">
          {cta.kind === 'link' ? (
            <Link to={cta.to} className={cta.tone === 'primary' ? CTA_PRIMARY : CTA_SECONDARY}>
              {t(`catalog.card.cta.${cta.label}`)}
              {cta.label === 'play' ? <span aria-hidden="true">→</span> : null}
            </Link>
          ) : (
            <button type="button" aria-disabled="true" className={CTA_DISABLED}>
              {t(`catalog.card.cta.${cta.label}`)}
            </button>
          )}
        </div>
      ) : null}
    </Card>
  );
}
