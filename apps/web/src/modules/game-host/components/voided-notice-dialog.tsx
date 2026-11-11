import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GameId } from '@nerdose/core';
import { Alert, buttonClass, cn, Dialog, linkClass } from '@nerdose/ui';

import { ApiError } from '@/lib/api-client';

import { useAcknowledgeVoid } from '../api/use-acknowledge-void';

export type VoidedNoticeDialogProps = {
  gameId: GameId;
  number: number;
  onClose: () => void;
  /** `challenge_expired`: cambió el día con el aviso abierto. */
  onExpired: () => void;
  /** `not_voided` / `no_challenge_today`: la pantalla de origen quedó vieja. */
  onStale: () => void;
};

/** O-02: aviso de desafío anulado con «Marcar como completado» (idempotente). */
export function VoidedNoticeDialog({
  gameId,
  number,
  onClose,
  onExpired,
  onStale,
}: VoidedNoticeDialogProps) {
  const { t } = useTranslation();
  const acknowledge = useAcknowledgeVoid(gameId);
  const [failed, setFailed] = useState(false);
  const pending = acknowledge.isPending;

  const mark = () => {
    if (pending) return;
    setFailed(false);
    acknowledge.mutate(
      { challengeNumber: number },
      {
        onError: (error) => {
          const code = error instanceof ApiError ? error.code : null;
          if (code === 'challenge_expired') onExpired();
          else if (code === 'not_voided' || code === 'no_challenge_today') onStale();
          else setFailed(true);
        },
      },
    );
  };

  const half = 'grow basis-50';
  return (
    <Dialog
      variant="modal"
      role="alertdialog"
      title={t('gameHost.voided.title')}
      closeLabel={t('gameHost.voided.close')}
      closeDisabled={pending}
      onClose={onClose}
    >
      <p className="font-sans text-body text-text-body">{t('gameHost.notice.voided')}</p>
      <p className="font-sans text-caption text-text-muted">{t('gameHost.voided.streakNote')}</p>
      {failed ? <Alert>{t('gameHost.voided.error')}</Alert> : null}
      <div className="flex flex-row-reverse flex-wrap gap-3">
        <button
          type="button"
          className={cn(buttonClass({ variant: 'primary', disabled: pending }), half)}
          aria-disabled={pending || undefined}
          onClick={mark}
        >
          {pending ? (
            t('gameHost.voided.marking')
          ) : (
            <>
              <span aria-hidden="true">✓</span> {t('gameHost.voided.mark')}
            </>
          )}
        </button>
        <button
          type="button"
          className={cn(linkClass({ tone: 'subtle' }), 'justify-center', half)}
          onClick={() => {
            if (!pending) onClose();
          }}
        >
          {t('gameHost.voided.close')}
        </button>
      </div>
    </Dialog>
  );
}
