import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { GameId } from '@nerdose/core';
import { Banner, buttonClass } from '@nerdose/ui';

import type { GameStatsView } from '../types';

import { BackLink } from './back-link';
import { ResultExits } from './result-exits';
import { VoidedNoticeDialog } from './voided-notice-dialog';

/**
 * Desafío anulado sin Play: aviso + volver. O-02 se abre solo al entrar; al cerrarlo el foco va a
 * «Ver aviso de anulación» (D11), que lo reabre para marcar después, el mismo día.
 */
export function VoidedView({
  gameId,
  number,
  onExpired,
  onStale,
}: {
  gameId: GameId;
  number: number | null;
  onExpired: () => void;
  onStale: () => void;
}) {
  const { t } = useTranslation();
  const game = t(`games.${gameId}.name`);
  const [open, setOpen] = useState(number !== null);
  const openRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    // El `Dialog` devuelve el foco al elemento previo (el `h1`/body); la acción lo recupera.
    queueMicrotask(() => openRef.current?.focus());
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <h1 className="font-mono text-title-game break-words text-text">{game}</h1>
      <Banner
        variant="warning"
        action={
          number !== null ? (
            <button
              type="button"
              ref={openRef}
              className={buttonClass({ variant: 'secondary' })}
              onClick={() => setOpen(true)}
            >
              {t('gameHost.voided.open')}
            </button>
          ) : undefined
        }
      >
        {t('gameHost.notice.voided')}
      </Banner>
      <div>
        <BackLink />
      </div>
      {open && number !== null ? (
        <VoidedNoticeDialog
          gameId={gameId}
          number={number}
          onClose={close}
          onExpired={onExpired}
          onStale={onStale}
        />
      ) : null}
    </div>
  );
}

/** Resultado anulado: un solo banner (veredicto + aviso, D3), rachas y salidas; sin `Result`. */
export function VoidedResultView({
  gameId,
  gameStats,
  reportLink,
}: {
  gameId: GameId;
  gameStats: GameStatsView | null;
  reportLink: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Banner variant="warning" titleAs="h1" title={t('gameHost.notice.voidedTitle')}>
        {t('gameHost.notice.voided')}
      </Banner>
      <ResultExits gameId={gameId} gameStats={gameStats} />
      <div className="flex">{reportLink}</div>
    </div>
  );
}
