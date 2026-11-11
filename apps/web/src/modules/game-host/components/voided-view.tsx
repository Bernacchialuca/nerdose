import { useTranslation } from 'react-i18next';

import type { GameId } from '@nerdose/core';
import { Banner } from '@nerdose/ui';

import type { GameStatsView } from '../types';

import { BackLink } from './back-link';
import { ResultExits } from './result-exits';

/** Desafío anulado sin Play: aviso + volver (O-02 y `acknowledge-void` son FG-6, D4). */
export function VoidedView({ gameId }: { gameId: GameId }) {
  const { t } = useTranslation();
  const game = t(`games.${gameId}.name`);
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="font-mono text-title-game break-words text-text">{game}</h1>
      <Banner variant="warning">{t('gameHost.notice.voided')}</Banner>
      <div>
        <BackLink />
      </div>
    </div>
  );
}

/** Resultado anulado: un solo banner (veredicto + aviso, D3), rachas y salidas; sin `Result`. */
export function VoidedResultView({
  gameId,
  gameStats,
}: {
  gameId: GameId;
  gameStats: GameStatsView | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Banner variant="warning" titleAs="h1" title={t('gameHost.notice.voidedTitle')}>
        {t('gameHost.notice.voided')}
      </Banner>
      <ResultExits gameId={gameId} gameStats={gameStats} />
    </div>
  );
}
