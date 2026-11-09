import { useTranslation } from 'react-i18next';

import type { GameId } from '@nerdose/core';

/** El DS no define spinners: el loader es texto Mono (DS Gap aceptado, D2). */
export function GameLoader({ gameId }: { gameId: GameId }) {
  const { t } = useTranslation();
  return (
    <p role="status" className="font-mono text-mono-body text-text-muted">
      {t('gameHost.loading', { slug: gameId })}
    </p>
  );
}
