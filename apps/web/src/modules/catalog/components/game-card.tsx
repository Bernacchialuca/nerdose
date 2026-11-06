import { Badge, buttonClass, Card, cn, GameThumbnail } from '@nerdose/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { GameId } from '../api/today';
import { GAME_CATALOG } from '../games';
import type { CardStatus, CardView } from '../home-view';

const BADGE_TONE = {
  completed: 'success',
  notPlayed: 'pending',
  inProgress: 'pending',
} as const;

function badgeTone(status: NonNullable<CardStatus>): 'success' | 'pending' | 'neutral' {
  return status in BADGE_TONE ? BADGE_TONE[status as keyof typeof BADGE_TONE] : 'neutral';
}

export function GameCard({ gameId, view }: { gameId: GameId; view: CardView }) {
  const { t } = useTranslation();
  const meta = GAME_CATALOG[gameId];
  const { cta, status } = view;

  return (
    <Card
      game={gameId}
      next={view.next}
      thumbnail={<GameThumbnail game={gameId} />}
      aria-labelledby={`game-${gameId}`}
      className="h-full flex-1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`game-${gameId}`} className={cn('font-mono text-title-card', meta.accentClass)}>
          {t(`games.${gameId}.name`)}
        </h3>
        {status !== null ? (
          <Badge tone={badgeTone(status)}>{view.label ?? t(`catalog.card.status.${status}`)}</Badge>
        ) : null}
      </div>
      <p className="font-sans text-body text-text-lede">{t(`games.${gameId}.description`)}</p>
      <ul className="mt-auto flex flex-wrap gap-3.5 pt-2 font-mono text-meta text-text-dim">
        {meta.untimed ? <li>{t('catalog.card.untimed')}</li> : null}
        <li>{t('catalog.card.minutes', { count: meta.minutes })}</li>
        {view.streak !== null ? (
          <li className={view.streak > 0 ? 'text-streak' : undefined}>
            {view.streak > 0 ? <span aria-hidden="true">▲ </span> : null}
            {t('catalog.card.streak', { count: view.streak })}
          </li>
        ) : null}
        {status === 'none' ? <li>{t('catalog.card.neutral')}</li> : null}
      </ul>
      {cta ? (
        cta.kind === 'link' ? (
          <Link
            to={cta.to}
            className={
              cta.tone === 'primary'
                ? buttonClass({ variant: 'accent', game: gameId, fullWidth: true })
                : buttonClass({ variant: 'secondary', fullWidth: true })
            }
          >
            {t(`catalog.card.cta.${cta.label}`)}
            {cta.label === 'play' ? <span aria-hidden="true">→</span> : null}
          </Link>
        ) : (
          <button
            type="button"
            aria-disabled="true"
            className={buttonClass({ disabled: true, fullWidth: true })}
          >
            {t(`catalog.card.cta.${cta.label}`)}
          </button>
        )
      ) : null}
    </Card>
  );
}
