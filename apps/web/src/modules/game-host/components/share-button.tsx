import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GameId } from '@nerdose/core';
import { buttonClass, ShareIcon, track } from '@nerdose/ui';

import { useLoadedGameClient } from '../use-loaded-game-client';

export const COPIED_RESET_MS = 3000;

type Props = {
  gameId: GameId;
  /** El texto lo arma el `share()` del juego; el shell nunca lo compone. */
  getText: () => string;
  variant: 'header';
};

const isAbort = (error: unknown) => (error as { name?: string } | null)?.name === 'AbortError';

export function ShareButton({ gameId, getText, variant }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleClick() {
    const text = getText();
    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ text });
          track(`share:${gameId}`);
          return;
        } catch (error) {
          if (isAbort(error)) return;
          // Otro rechazo: se intenta el portapapeles.
        }
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      track(`share:${gameId}`);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Sin permiso o sin portapapeles: el botón sigue en «Compartir» y se puede reintentar.
    }
  }

  return (
    <button
      type="button"
      data-variant={variant}
      onClick={() => void handleClick()}
      className={buttonClass({ variant: 'accent', game: gameId, size: 'share' })}
    >
      <ShareIcon />
      <span role="status">{copied ? t('gameHost.result.copied') : t('gameHost.result.share')}</span>
    </button>
  );
}

/** Compartir con el client cargado por `use()`: va dentro de un `<Suspense>` (D12). */
export function ClientShareButton({
  gameId,
  result,
  number,
  variant,
}: {
  gameId: GameId;
  result: unknown;
  number: number;
  variant: 'header';
}) {
  const client = useLoadedGameClient(gameId);
  return (
    <ShareButton gameId={gameId} variant={variant} getText={() => client.share(result, number)} />
  );
}
