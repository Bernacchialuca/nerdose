import { useMemo } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import type { CodeLanguage, GameId, Locale } from '@nerdose/core';
import { Alert, Banner } from '@nerdose/ui';

import { useSession } from '@/modules/session';

import type { GameView } from '../game-view';
import type { GameClient, Translate } from '../types';

import { BackLink } from './back-link';
import { PhaseFocus } from './phase-focus';
import { ResultExits } from './result-exits';
import { RetryButton } from './retry-button';

/** REQ-009 decisión 12: sin preferencia guardada, el código se muestra en JavaScript. */
export const DEFAULT_CODE_LANGUAGE: CodeLanguage = 'js';

type ClientView = Extract<GameView, { kind: 'instructions' | 'playing' | 'result' }>;

export type GameScreensProps = {
  gameId: GameId;
  view: ClientView;
  /** Último `MoveResponse.feedback`, reenviado sin interpretar. */
  feedback: unknown;
  locale: Locale;
  firstPhaseRef: RefObject<boolean>;
  /** Disparador de O-01 (lo arma el host: el estado del diálogo vive en `GameRoute`). */
  reportLink: ReactNode;
  /** Aviso extra de «Empezar» (p. ej. `rate_limited`). */
  startNotice: ReactNode;
  starting: boolean;
  movePending: boolean;
  onStart: () => void;
  onMove: (move: unknown) => void;
  onRetrySession: () => void;
  onRetryMove: () => void;
  onRecoverMove: () => void;
};

/** Monta `Instructions` / `Game` / `Result` del client con sus props y los bloques de `web`. */
export function GameScreens({
  client,
  gameId,
  view,
  feedback,
  locale,
  firstPhaseRef,
  reportLink,
  startNotice,
  starting,
  movePending,
  onStart,
  onMove,
  onRetrySession,
  onRetryMove,
  onRecoverMove,
}: GameScreensProps & { client: GameClient }) {
  const { t: host } = useTranslation();
  const codeLanguage = useSession().preferred_code_language ?? DEFAULT_CODE_LANGUAGE;
  const { t: gameT } = useTranslation(client.i18n.namespace);
  const t = useMemo<Translate>(() => (key, options) => String(gameT(key, options)), [gameT]);
  const focus = <PhaseFocus key={view.kind} firstPhaseRef={firstPhaseRef} />;

  if (view.kind === 'instructions') {
    const notices =
      view.dayChanged || startNotice ? (
        <div className="flex flex-col gap-4">
          {view.dayChanged ? (
            <Banner variant="neutral" announce>
              {host('gameHost.notice.dayChanged', { number: view.number })}
            </Banner>
          ) : null}
          {startNotice}
        </div>
      ) : undefined;
    return (
      <>
        {focus}
        {view.session === 'noSession' ? (
          <Banner variant="warning" className="mb-6">
            {host('gameHost.notice.cookies')}
          </Banner>
        ) : null}
        {view.session === 'unavailable' ? (
          <Banner variant="warning" className="mb-6">
            {host('catalog.progress.unavailable')}
          </Banner>
        ) : null}
        <client.Instructions
          number={view.number}
          locale={locale}
          t={t}
          codeLanguage={codeLanguage}
          notices={notices}
          onStart={onStart}
          starting={starting}
          startDisabled={view.session !== 'ok'}
          actions={
            <>
              {view.session === 'noSession' ? <RetryButton onClick={onRetrySession} /> : null}
              <BackLink />
            </>
          }
        />
      </>
    );
  }

  if (view.kind === 'playing') {
    return (
      <>
        {focus}
        {view.session === 'noSession' ? (
          <Banner variant="warning" className="mb-6" action={<RetryButton onClick={onRetryMove} />}>
            {host('gameHost.notice.cookies')}
          </Banner>
        ) : null}
        {view.moveFailed ? (
          <Alert className="mb-6" action={<RetryButton onClick={onRecoverMove} />}>
            {host('gameHost.error.move')}
          </Alert>
        ) : null}
        <client.Game
          number={view.number}
          locale={locale}
          t={t}
          codeLanguage={codeLanguage}
          publicView={view.publicView}
          state={view.state}
          feedback={feedback}
          onMove={onMove}
          pending={movePending}
          moveError={view.moveError}
          locked={view.locked}
          gameStats={view.gameStats}
          aside={reportLink}
          notices={
            view.locked ? (
              <Banner variant="warning">{host('gameHost.notice.voided')}</Banner>
            ) : undefined
          }
        />
      </>
    );
  }

  return (
    <>
      {focus}
      <client.Result
        number={view.number}
        locale={locale}
        t={t}
        codeLanguage={codeLanguage}
        result={view.result}
        publicView={view.publicView}
        gameStats={view.gameStats}
        aside={reportLink}
        footer={<ResultExits gameId={gameId} gameStats={view.gameStats} />}
      />
    </>
  );
}
