import { useEffect, useId, useRef, type KeyboardEvent } from 'react';

import { buttonClass, cn } from '@nerdose/ui';

import { WORDS_COUNT } from '../definition/schemas';

import { SURRENDER_BUTTON } from './surrender-button';
import type { Translate } from './types';

type SurrenderDialogProps = {
  found: number;
  busy: boolean;
  t: Translate;
  onClose: () => void;
  onConfirm: () => void;
};

/** O-04: confirmation modal derived from `panel` + `button` (accepted DS gap). */
export function SurrenderDialog({ found, busy, t, onClose, onConfirm }: SurrenderDialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    keepRef.current?.focus();
  }, []);

  const close = () => {
    if (!busy) onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const order = [keepRef.current, confirmRef.current, closeRef.current];
    const index = order.indexOf(document.activeElement as HTMLButtonElement | null);
    const step = event.shiftKey ? -1 : 1;
    const next = order[(index + step + order.length) % order.length];
    event.preventDefault();
    next?.focus();
  };

  return (
    // The overlay is not a control: keyboard dismissal is Escape, handled on this node.
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-header px-4"
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="flex w-full max-w-xl flex-col gap-4 rounded-panel border border-border bg-surface p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-mono text-title-panel text-text">
            {t('surrender.title')}
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label={t('surrender.close')}
            aria-disabled={busy || undefined}
            onClick={close}
            className={buttonClass({ variant: 'icon', disabled: busy })}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <p id={bodyId} className="font-sans text-body text-text-body">
          {found === 0
            ? t('surrender.bodyNone', { total: WORDS_COUNT })
            : t('surrender.body', { found, total: WORDS_COUNT })}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            ref={keepRef}
            type="button"
            aria-disabled={busy || undefined}
            onClick={close}
            className={cn(
              buttonClass({ variant: 'primary', size: 'md', disabled: busy }),
              'grow basis-50',
            )}
          >
            {t('surrender.keepPlaying')}
          </button>
          <button
            ref={confirmRef}
            type="button"
            aria-disabled={busy || undefined}
            onClick={() => {
              if (!busy) onConfirm();
            }}
            className={cn(
              busy ? buttonClass({ disabled: true }) : SURRENDER_BUTTON,
              'grow basis-50',
            )}
          >
            {busy ? t('surrender.closing') : t('surrender.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
