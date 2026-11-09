import { useTranslation } from 'react-i18next';

import { Banner } from '@nerdose/ui';
import type { GameId } from '@nerdose/core';

import { BackLink } from './back-link';

type Props = { gameId: GameId; dayChangedNumber: number | null };

/** «Sin desafío hoy» (también para juegos sin client): web lo arma sin montar el client (CA-8). */
export function NoChallengeView({ gameId, dayChangedNumber }: Props) {
  const { t } = useTranslation();
  const game = t(`games.${gameId}.name`);
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="font-mono text-title-game break-words text-text">{game}</h1>
      {dayChangedNumber !== null ? (
        <Banner variant="neutral" announce>
          {t('gameHost.notice.dayChanged', { number: dayChangedNumber })}
        </Banner>
      ) : null}
      <Banner variant="neutral" announce>
        {t('gameHost.notice.noChallenge', { game })}
      </Banner>
      <div>
        <BackLink />
      </div>
    </div>
  );
}
