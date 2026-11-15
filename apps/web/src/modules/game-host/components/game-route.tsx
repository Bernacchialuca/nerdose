import { useQueryClient } from '@tanstack/react-query';
import { Suspense, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import type { GameId } from '@nerdose/core';
import { Alert, Banner } from '@nerdose/ui';

import { useDocumentTitle } from '@/hooks/use-document-title';
import { ApiError } from '@/lib/api-client';
import { todayKeys } from '@/modules/catalog';
import { createSession, useSession } from '@/modules/session';

import { gameTodayKeys } from '../api/game-today';
import { useGameToday } from '../api/use-game-today';
import { useStartPlay } from '../api/use-start-play';
import { useSubmitMove } from '../api/use-submit-move';
import { deriveGameView } from '../game-view';
import { gameScreens } from '../lazy-game-screens';
import { hasGameClient } from '../registry';

import { Confetti } from './confetti';
import { GameLoader } from './game-loader';
import { NoChallengeView } from './no-client-view';
import { PhaseFocus } from './phase-focus';
import { ReportDialog } from './report-dialog';
import { ReportLink } from './report-link';
import { RetryButton } from './retry-button';
import { VoidedResultView, VoidedView } from './voided-view';

/** Contenedor de las vistas que arma `web` sin montar el client (misma columna que `Instructions`). */
const COLUMN = 'mx-auto flex w-full max-w-5xl flex-col gap-6';

export function GameRoute({ gameId }: { gameId: GameId }) {
  const { t } = useTranslation();
  const { status, locale } = useSession();
  const queryClient = useQueryClient();
  const location = useLocation();
  const hasClient = hasGameClient(gameId);
  const query = useGameToday(gameId, { enabled: hasClient });
  const startPlay = useStartPlay(gameId);
  const submitMove = useSubmitMove(gameId);
  // Se reenvía tal cual al `Game`: sin estado ni efecto, misma referencia que la respuesta.
  const feedback = submitMove.data?.feedback ?? null;
  const [dayChanged, setDayChanged] = useState(false);
  const [voidedDuringPlay, setVoidedDuringPlay] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    number: number;
    from: 'game' | 'result';
  } | null>(null);
  const [reportedFor, setReportedFor] = useState<number | null>(null);
  const lastMove = useRef<{ number: number; move: unknown } | null>(null);
  // La primera fase de una carga directa no roba el foco (D6).
  const firstPhaseRef = useRef(location.key === 'default');

  const game = t(`games.${gameId}.name`);
  useDocumentTitle(t('gameHost.documentTitle', { game }));

  const view = deriveGameView({
    hasClient,
    query,
    sessionStatus: status,
    dayChanged,
    voidedDuringPlay: voidedDuringPlay,
    actionError: submitMove.error ?? startPlay.error,
  });

  const invalidateDay = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: todayKeys.all }),
        queryClient.invalidateQueries({ queryKey: gameTodayKeys.all }),
      ]),
    [queryClient],
  );

  const onDayExpired = useCallback(() => {
    setDayChanged(true);
    void invalidateDay();
  }, [invalidateDay]);

  // Traduce el `error.code` de una mutación en una acción de pantalla (tabla de `error-handling`).
  const onActionError = useCallback(
    (error: Error) => {
      if (!(error instanceof ApiError)) return;
      switch (error.code) {
        case 'challenge_expired':
          onDayExpired();
          break;
        case 'challenge_voided':
          setVoidedDuringPlay(true);
          void invalidateDay();
          break;
        case 'game_finished':
        case 'no_challenge_today':
          void invalidateDay();
          break;
      }
    },
    [invalidateDay, onDayExpired],
  );

  const handleStart = (challengeNumber: number) => {
    setDayChanged(false);
    submitMove.reset();
    startPlay.mutate(
      { challengeNumber },
      {
        onError: (error) => {
          // `challenge_voided` al empezar no es «anulado a mitad de partida»: lo resuelve la query.
          if (error instanceof ApiError && error.code === 'challenge_voided') void invalidateDay();
          else onActionError(error);
        },
      },
    );
  };

  const sendMove = (challengeNumber: number, move: unknown) => {
    lastMove.current = { number: challengeNumber, move };
    startPlay.reset();
    submitMove.mutate({ challengeNumber, move }, { onError: onActionError });
  };

  // Recrea la sesión y deja que `today.has_session` recalcule el estado (D10).
  const recreateSession = async () => {
    try {
      await createSession();
    } catch (error) {
      console.error(error);
    }
    await queryClient.invalidateQueries({ queryKey: todayKeys.all });
  };

  const retrySession = () => {
    void recreateSession().then(() => startPlay.reset());
  };
  const retryLastMove = () => {
    void recreateSession().then(() => {
      const last = lastMove.current;
      if (last) sendMove(last.number, last.move);
      else submitMove.reset();
    });
  };
  const recoverFromMoveFailure = () => {
    submitMove.reset();
    void query.refetch();
  };

  const reportView =
    view.kind === 'playing' || view.kind === 'result' || view.kind === 'voidedResult' ? view : null;
  const reportLink = reportView ? (
    <ReportLink
      reported={reportView.reported || reportedFor === reportView.number}
      onOpen={() => {
        if (reportView.number !== null) {
          setReportTarget({
            number: reportView.number,
            from: reportView.kind === 'playing' ? 'game' : 'result',
          });
        }
      }}
    />
  ) : null;

  const focus = <PhaseFocus key={view.kind} firstPhaseRef={firstPhaseRef} />;

  const renderView = () => {
    switch (view.kind) {
      case 'loading':
        return (
          <div className={COLUMN}>
            <GameLoader gameId={gameId} />
          </div>
        );
      case 'loadError':
        return (
          <div className={COLUMN}>
            {focus}
            <Alert action={<RetryButton onClick={() => void query.refetch()} />}>
              {t('gameHost.error.load', { game })}
            </Alert>
          </div>
        );
      case 'noClient':
      case 'noChallenge':
        return (
          <>
            {focus}
            <NoChallengeView
              gameId={gameId}
              dayChangedNumber={view.kind === 'noChallenge' && view.dayChanged ? view.number : null}
            />
          </>
        );
      case 'voided':
        return (
          <>
            {focus}
            <VoidedView
              gameId={gameId}
              number={view.number}
              onExpired={onDayExpired}
              onStale={() => void invalidateDay()}
            />
          </>
        );
      case 'voidedResult':
        return (
          <>
            {focus}
            <VoidedResultView gameId={gameId} gameStats={view.gameStats} reportLink={reportLink} />
          </>
        );
      default: {
        const Screens = gameScreens[gameId];
        if (!Screens) return null;
        const rateLimited =
          startPlay.error instanceof ApiError && startPlay.error.code === 'rate_limited';
        // Festejo solo en la transición: la jugada que se acaba de enviar cerró la partida ganando.
        // `submitMove.data` no sobrevive a una recarga, así que volver al resultado no lo repite.
        const celebrate = view.kind === 'result' && submitMove.data?.play.status === 'won';
        return (
          <>
            {celebrate ? <Confetti gameId={gameId} /> : null}
            <Suspense fallback={<GameLoader gameId={gameId} phase={view.kind} />}>
              <Screens
                gameId={gameId}
                view={view}
                feedback={feedback}
                locale={locale}
                firstPhaseRef={firstPhaseRef}
                reportLink={reportLink}
                startNotice={
                  rateLimited ? <Banner variant="warning">{startPlay.error?.message}</Banner> : null
                }
                starting={startPlay.isPending}
                movePending={submitMove.isPending}
                onStart={() => handleStart(view.number)}
                onMove={(move) => sendMove(view.number, move)}
                onRetrySession={retrySession}
                onRetryMove={retryLastMove}
                onRecoverMove={recoverFromMoveFailure}
              />
            </Suspense>
          </>
        );
      }
    }
  };

  return (
    <>
      {renderView()}
      {reportTarget ? (
        <ReportDialog
          gameId={gameId}
          number={reportTarget.number}
          from={reportTarget.from}
          onClose={(reported) => {
            if (reported) setReportedFor(reportTarget.number);
            setReportTarget(null);
          }}
        />
      ) : null}
    </>
  );
}
