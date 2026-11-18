import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { GameId, Locale } from '@nerdose/core';

import { useLoadedGameClient } from '@/modules/game-host';
import type { Translate } from '@/modules/game-host';

/** Monta el `StatsSummary` del client del juego (lo carga el registry; requiere `<Suspense>`). */
export function GameStatsSummary({
  gameId,
  extra,
  locale,
}: {
  gameId: GameId;
  extra: unknown;
  locale: Locale;
}) {
  const client = useLoadedGameClient(gameId);
  const { t: gameT } = useTranslation(client.i18n.namespace);
  const t = useMemo<Translate>(() => (key, options) => String(gameT(key, options)), [gameT]);
  return <client.StatsSummary extra={extra} locale={locale} t={t} />;
}
