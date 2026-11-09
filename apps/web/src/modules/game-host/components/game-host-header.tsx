import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { GameId } from '@nerdose/core';
import { buttonClass, ChartIcon, GameHeader, HelpIcon, ShareIcon, StreakPill } from '@nerdose/ui';

import { useToday } from '@/modules/catalog';
import { LanguageSelector, useSession } from '@/modules/session';

import { useGameToday } from '../api/use-game-today';
import { deriveGameView } from '../game-view';
import { loadGameClient } from '../load-game-client';
import { hasGameClient } from '../registry';

import { ClientShareButton } from './share-button';

function DisabledShare({ gameId }: { gameId: GameId }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={t('gameHost.header.shareDisabled')}
      title={t('gameHost.header.shareDisabledTitle')}
      className={buttonClass({ variant: 'accent', game: gameId, size: 'share', disabled: true })}
    >
      <ShareIcon />
      {t('gameHost.header.share')}
    </button>
  );
}

function scrollToHelp(gameId: GameId) {
  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // El client ya está cargado cuando la ayuda es visible: la promesa está memoizada.
  void loadGameClient(gameId).then((client) => {
    document
      .getElementById(client.HELP_TARGET_ID)
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });
}

/**
 * Header de las pantallas de juego (`game-header`). Va fuera de `<main>`: el `Shell` lo monta a
 * través del `handle` de la ruta. Lee la misma query que la ruta, así que no pide nada extra.
 */
export function GameHostHeader({ gameId }: { gameId: GameId }) {
  const { t } = useTranslation();
  const { status } = useSession();
  const hasClient = hasGameClient(gameId);
  const query = useGameToday(gameId, { enabled: hasClient });
  const today = useToday();

  const view = deriveGameView({
    hasClient,
    query,
    sessionStatus: status,
    dayChanged: false,
    voidedDuringPlay: false,
    actionError: null,
  });

  const number = hasClient ? (query.data?.number ?? null) : null;
  const streak =
    today.data && status !== 'cookies_blocked' && status !== 'unavailable'
      ? today.data.global_streak.current
      : null;
  const showHelp = view.kind === 'instructions' || view.kind === 'playing';

  return (
    <GameHeader
      game={gameId}
      navLabel={t('gameHost.header.nav')}
      homeLabel={t('shell.brand')}
      renderHome={(props) => <Link to="/" {...props} />}
      crumb={gameId}
      meta={number !== null ? t('catalog.challengeNumber', { number }) : undefined}
    >
      {showHelp ? (
        <button
          type="button"
          aria-label={t('gameHost.header.help')}
          onClick={() => scrollToHelp(gameId)}
          className={buttonClass({ variant: 'icon' })}
        >
          <HelpIcon />
        </button>
      ) : null}
      <Link
        to="/stats"
        aria-label={t('gameHost.header.stats')}
        className={buttonClass({ variant: 'icon' })}
      >
        <ChartIcon />
      </Link>
      {view.kind === 'result' ? (
        <Suspense fallback={<DisabledShare gameId={gameId} />}>
          <ClientShareButton
            gameId={gameId}
            variant="header"
            result={view.result}
            number={view.number}
          />
        </Suspense>
      ) : (
        <DisabledShare gameId={gameId} />
      )}
      <LanguageSelector />
      <StreakPill value={streak}>
        <span className="sr-only">{t('gameHost.header.streak')} </span>
        {streak ?? '—'}
      </StreakPill>
    </GameHeader>
  );
}
