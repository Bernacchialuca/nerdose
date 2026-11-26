import { useId, useRef } from 'react';

import { Dialog, buttonClass, cn } from '@nerdose/ui';

import { MAX_GUESSES } from '../definition/schemas';

import type { Translate } from './types';

/** «Rendirse» del lateral: mismo botón que Grep Grid (`error-outline`, ⚑). */
export function SurrenderButton({
  disabled,
  onOpen,
  t,
}: {
  disabled: boolean;
  onOpen: () => void;
  t: Translate;
}) {
  return (
    <button
      type="button"
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) onOpen();
      }}
      className={buttonClass({ variant: 'error-outline', fullWidth: true, disabled })}
    >
      <span aria-hidden="true">⚑</span>
      {t('surrender.button')}
    </button>
  );
}

/** Confirmación: «Seguir jugando» tiene el foco; rendirse es la acción destructiva, en rojo. */
export function SurrenderDialog({
  used,
  busy,
  onClose,
  onConfirm,
  t,
}: {
  used: number;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: Translate;
}) {
  const bodyId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const half = 'grow basis-50';
  return (
    <Dialog
      variant="modal"
      role="alertdialog"
      title={t('surrender.title')}
      closeLabel={t('surrender.close')}
      closeDisabled={busy}
      onClose={onClose}
      initialFocusRef={keepRef}
      describedBy={bodyId}
    >
      <p id={bodyId} className="font-sans text-body text-text-body">
        {t('surrender.body', { count: used, max: MAX_GUESSES })}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          ref={keepRef}
          type="button"
          aria-disabled={busy || undefined}
          onClick={() => {
            if (!busy) onClose();
          }}
          className={cn(buttonClass({ variant: 'primary', disabled: busy }), half)}
        >
          {t('surrender.keepPlaying')}
        </button>
        <button
          type="button"
          aria-disabled={busy || undefined}
          onClick={() => {
            if (!busy) onConfirm();
          }}
          className={cn(buttonClass({ variant: 'error', disabled: busy }), half)}
        >
          {busy ? t('surrender.closing') : t('surrender.confirm')}
        </button>
      </div>
    </Dialog>
  );
}
