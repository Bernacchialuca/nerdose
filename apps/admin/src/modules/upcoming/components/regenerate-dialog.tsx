import { useRef, useState } from 'react';

import type { GameId } from '@nerdose/core';
import { Alert, Banner, buttonClass, linkClass } from '@nerdose/ui';

import { Dialog } from '@/components/dialog';
import { isApiError } from '@/lib/api-errors';
import { challengeLabel } from '@/modules/reports';

import { useRegenerateChallenge } from '../api/use-regenerate-challenge';

export type RegenerateTarget = {
  challenge_id: string;
  game_id: GameId;
  number: number;
  date: string;
};

type RegenerateDialogProps = {
  target: RegenerateTarget;
  onClose: () => void;
  onRequested: () => void;
  onGone: () => void;
};

export function RegenerateDialog({ target, onClose, onRequested, onGone }: RegenerateDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const regenerate = useRegenerateChallenge();
  const [unavailable, setUnavailable] = useState(false);
  const [system, setSystem] = useState(false);

  const pending = regenerate.isPending;
  const blocked = pending || unavailable;

  const confirm = () => {
    if (blocked) return;
    setSystem(false);
    regenerate.mutate(
      { challenge_id: target.challenge_id },
      {
        onSuccess: onRequested,
        onError: (error) => {
          if (isApiError(error, 'not_regenerable')) setUnavailable(true);
          else if (isApiError(error, 'not_found')) onGone();
          else if (!(isApiError(error) && error.status === 401)) setSystem(true);
        },
      },
    );
  };

  return (
    <Dialog
      variant="modal"
      title="Regenerar desafío"
      onClose={onClose}
      closeDisabled={pending}
      initialFocusRef={confirmRef}
    >
      <div className="flex flex-col gap-4">
        <p className="font-sans text-body text-text-body">
          Se pedirá un reemplazo para {challengeLabel(target)} ({target.date}). El generador lo
          prepara en segundo plano: si pasa la verificación reemplaza al actual; si no, queda el
          actual. Si llega la fecha antes, se publica el actual sin cambios.
        </p>
        {unavailable ? (
          <div role="alert">
            <Banner
              variant="warning"
              announce={false}
              title="Solo se puede regenerar un desafío aprobado de una fecha futura. Refrescá Próximos."
            />
          </div>
        ) : null}
        {system ? <Alert title="No pudimos pedir la regeneración. Probá de nuevo." /> : null}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            ref={confirmRef}
            type="button"
            aria-disabled={blocked || undefined}
            onClick={confirm}
            className={buttonClass({ variant: 'primary', disabled: blocked })}
          >
            {pending ? 'Pidiendo…' : 'Regenerar'}
          </button>
          <button
            type="button"
            aria-disabled={pending || undefined}
            onClick={() => {
              if (!pending) onClose();
            }}
            className={linkClass({ tone: 'subtle' })}
          >
            Cancelar
          </button>
        </div>
      </div>
    </Dialog>
  );
}
