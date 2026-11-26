import { useEffect, useId, useMemo, useState } from 'react';

import { MAX_GUESSES, giveUpMoveSchema, hintMoveSchema, moveSchema } from '../definition/schemas';

import { Board, boardMaxWidth } from './board';
import { CategoryHint } from './category-hint';
import { Distribution } from './distribution';
import { Keyboard } from './keyboard';
import { Legend } from './legend';
import { LetterHintButton } from './letter-hint-button';
import { isFinished, keyStates } from './marks';
import { MoveHint } from './move-hint';
import { parsePublicView, parseState } from './parse';
import { SurrenderButton, SurrenderDialog } from './surrender';
import type { GameProps, MoveErrorInfo } from './types';
import { useDevdleInput } from './use-devdle-input';

type LocalHint = 'onlyLetters' | 'missingLetters';

export function Game({
  locale,
  t,
  notices,
  publicView,
  state,
  onMove,
  pending,
  moveError,
  locked = false,
  gameStats = null,
  aside,
}: GameProps) {
  const view = parsePublicView(publicView);
  const play = parseState(state);
  const { length } = view;
  const guesses = play.guesses;
  const titleId = useId();

  const [draft, setDraft] = useState('');
  const [localHint, setLocalHint] = useState<LocalHint | null>(null);
  const [dismissedError, setDismissedError] = useState<MoveErrorInfo | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [prevCount, setPrevCount] = useState(guesses.length);
  const [prevError, setPrevError] = useState(moveError);
  const [surrender, setSurrender] = useState<'closed' | 'open' | 'submitting'>('closed');
  const [picking, setPicking] = useState(false);

  const listFormat = useMemo(() => new Intl.ListFormat(locale, { type: 'conjunction' }), [locale]);

  // Adjusting state while rendering (React docs) instead of in an effect: the row clears and the
  // feedback is announced only when `guesses` grows, never on the first render (resume).
  if (guesses.length !== prevCount) {
    setPrevCount(guesses.length);
    const last = guesses[guesses.length - 1];
    if (guesses.length > prevCount && last) {
      setDraft('');
      setLocalHint(null);
      setAnnouncement(
        listFormat.format(
          last.marks.map((m, i) =>
            t('cell.label', { letter: last.guess[i], state: t(`cell.${m}`) }),
          ),
        ),
      );
    }
  }
  if (moveError !== prevError) {
    setPrevError(moveError);
    if (moveError) setLocalHint(null);
    // Si rendirse falló, el diálogo vuelve a quedar disponible para reintentar o cerrar.
    if (moveError && surrender === 'submitting') setSurrender('open');
  }

  const inputBlocked = locked || pending || isFinished(play);

  const clearHints = () => {
    setPicking(false);
    setLocalHint(null);
    setDismissedError(moveError);
  };
  const onLetter = (l: string) => {
    if (inputBlocked) return;
    clearHints();
    if (draft.length < length) setDraft(draft + l);
  };
  const onBackspace = () => {
    if (inputBlocked) return;
    clearHints();
    setDraft(draft.slice(0, -1));
  };
  const onInvalid = () => {
    if (!inputBlocked) setLocalHint('onlyLetters');
  };
  const onSubmit = () => {
    if (inputBlocked) return;
    if (draft.length !== length) {
      setLocalHint('missingLetters');
      return;
    }
    const parsed = moveSchema.safeParse({ guess: draft });
    if (parsed.success) onMove(parsed.data);
    else setLocalHint('onlyLetters');
  };

  useDevdleInput({
    enabled: !locked && surrender === 'closed',
    onLetter,
    onBackspace,
    onSubmit,
    onInvalid,
  });

  const onPick = (position: number) => {
    setPicking(false);
    if (inputBlocked) return;
    clearHints();
    onMove(hintMoveSchema.parse({ hint: position }));
  };
  const canPick = picking && !inputBlocked && play.hint === undefined;

  useEffect(() => {
    if (!canPick) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPicking(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [canPick]);
  const known = useMemo(() => {
    const out = new Map<number, string>();
    for (const g of guesses) {
      g.marks.forEach((m, i) => {
        if (m === 'correct') out.set(i, g.guess.charAt(i));
      });
    }
    return out;
  }, [guesses]);
  const pickablePositions = useMemo(
    () => new Set(Array.from({ length }, (_, i) => i).filter((i) => !known.has(i))),
    [length, known],
  );

  let hint = '';
  if (canPick) hint = t('letterHint.pick');
  else if (localHint) hint = t(`hint.${localHint}`, { length });
  else if (moveError && moveError !== dismissedError) {
    if (moveError.code === 'not_in_word_list') hint = t('hint.notInList');
    else if (moveError.code === 'rate_limited') hint = t('hint.rateLimited');
    else hint = moveError.message;
  }

  const attempt = Math.min(guesses.length + 1, MAX_GUESSES);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-label-comment text-text-dim">
          <span aria-hidden="true">// </span>
          {t('game.prompt', { length, attempt, max: MAX_GUESSES })}
        </p>
        <h1 id={titleId} className="font-mono text-title-game text-text">
          {t('game.title')}
        </h1>
      </div>
      {notices}
      <div className="flex flex-wrap justify-center gap-10">
        <section
          aria-labelledby={titleId}
          className="flex min-w-0 grow-999 basis-140 flex-col items-center gap-7"
        >
          <Board
            length={length}
            guesses={guesses}
            draft={draft}
            hint={play.hint}
            pickable={canPick ? pickablePositions : undefined}
            onPick={onPick}
            label={t('board.label', { max: MAX_GUESSES, length })}
            t={t}
          />
          <div
            className="flex w-full items-center justify-between gap-3"
            style={{ maxWidth: boardMaxWidth(length) }}
          >
            <MoveHint text={hint} className="min-w-0 flex-1 text-left" />
            {locked ? null : (
              <LetterHintButton
                hint={play.hint}
                picking={canPick}
                disabled={inputBlocked}
                onToggle={() => {
                  setPicking(!picking);
                }}
                t={t}
              />
            )}
          </div>
          {locked ? null : (
            <Keyboard
              states={keyStates(guesses)}
              onLetter={onLetter}
              onBackspace={onBackspace}
              onSubmit={onSubmit}
              submitDisabled={pending}
              t={t}
            />
          )}
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </section>
        <aside className="flex min-w-0 max-w-devdle-aside grow basis-75 flex-col gap-4">
          <Legend t={t} />
          <CategoryHint categories={view.possible_categories} t={t} />
          {gameStats ? <Distribution stats={gameStats} t={t} /> : null}
          {locked ? null : (
            <SurrenderButton
              disabled={inputBlocked}
              onOpen={() => {
                setSurrender('open');
              }}
              t={t}
            />
          )}
          {aside}
        </aside>
      </div>
      {surrender === 'closed' ? null : (
        <SurrenderDialog
          used={guesses.length}
          busy={surrender === 'submitting' && pending}
          onClose={() => {
            setSurrender('closed');
          }}
          onConfirm={() => {
            setSurrender('submitting');
            onMove(giveUpMoveSchema.parse({ give_up: true }));
          }}
          t={t}
        />
      )}
    </div>
  );
}
