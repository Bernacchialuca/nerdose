import { useTranslation } from 'react-i18next';

import type { GameId } from '@nerdose/core';

type Phase = 'instructions' | 'playing' | 'result';

const KEYS = {
  instructions: 'gameHost.loading',
  playing: 'gameHost.loadingPlay',
  result: 'gameHost.loadingResult',
} as const;

/**
 * El DS no define spinners: el loader es texto Mono (DS Gap aceptado, D2). Sin `phase` (todavía no
 * llegó el estado del día) usa el texto de instrucciones; con la fase ya conocida (mientras carga el
 * client) dice «tu partida» o «tu resultado», como las pantallas de UX.
 */
export function GameLoader({ gameId, phase = 'instructions' }: { gameId: GameId; phase?: Phase }) {
  const { t } = useTranslation();
  return (
    <p role="status" className="font-mono text-mono-body text-text-muted">
      {t(KEYS[phase], { slug: gameId })}
    </p>
  );
}
