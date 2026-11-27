import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { GameId, Locale } from '@nerdose/core';
import { buttonClass, ShareIcon } from '@nerdose/ui';

import { useLoadedGameClient } from '../use-loaded-game-client';

export const COPIED_RESET_MS = 3000;

/**
 * Texto final del share: el del juego más una última línea con el host del sitio. Sale de la
 * dirección que está abierta, así no hay dominio fijo en el código ni variable que configurar.
 */
export const withSite = (gameText: string, host: string = window.location.host): string =>
  `${gameText}\n${host}`;

type Props = {
  gameId: GameId;
  /** El resultado lo arma el `share()` del juego; el shell solo agrega la línea del sitio. */
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
          return;
        } catch (error) {
          if (isAbort(error)) return;
          // Otro rechazo: se intenta el portapapeles.
        }
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Sin permiso o sin portapapeles: el botón sigue en «Compartir» y se puede reintentar.
    }
  }

  const label = copied ? t('gameHost.result.copied') : t('gameHost.result.share');

  return (
    <button
      type="button"
      data-variant={variant}
      // Nombre explícito: Chrome no toma el nombre del botón desde un hijo con `role="status"`
      // (quedaba «botón» sin nombre para lectores de pantalla). jsdom sí lo calcula, por eso
      // los tests de ruta no lo detectaban (verificación manual TS-40 de S-024).
      aria-label={label}
      onClick={() => void handleClick()}
      className={buttonClass({ variant: 'accent', game: gameId, size: 'share' })}
    >
      <ShareIcon />
      <span role="status">{label}</span>
    </button>
  );
}

/** Compartir con el client cargado por `use()`: va dentro de un `<Suspense>` (D12). */
export function ClientShareButton({
  gameId,
  result,
  number,
  locale,
  variant,
}: {
  gameId: GameId;
  result: unknown;
  number: number;
  locale: Locale;
  variant: 'header';
}) {
  const client = useLoadedGameClient(gameId);
  return (
    <ShareButton
      gameId={gameId}
      variant={variant}
      getText={() => withSite(client.share(result, number, locale))}
    />
  );
}
