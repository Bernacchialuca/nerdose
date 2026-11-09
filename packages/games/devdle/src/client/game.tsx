import { useId, useMemo, useState } from 'react';

import { MAX_GUESSES, moveSchema } from '../definition/schemas';

import { Board } from './board';
import { CategoryHint } from './category-hint';
import { Distribution } from './distribution';
import { Keyboard } from './keyboard';
import { Legend } from './legend';
import { isFinished, keyStates } from './marks';
import { MoveHint } from './move-hint';
import { parsePublicView, parseState } from './parse';
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
  }

  const inputBlocked = locked || pending || isFinished(play);

  const clearHints = () => {
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

  useDevdleInput({ enabled: !locked, onLetter, onBackspace, onSubmit, onInvalid });

  let hint = '';
  if (localHint) hint = t(`hint.${localHint}`, { length });
  else if (moveError && moveError !== dismissedError) {
    if (moveError.code === 'not_in_word_list') hint = t('hint.notInList');
    else if (moveError.code === 'rate_limited') hint = t('hint.rateLimited');
    else hint = moveError.message;
  }

  const attempt = Math.min(guesses.length + 1, MAX_GUESSES);

  return (
    <div className="flex flex-wrap justify-center gap-10">
      <section
        aria-labelledby={titleId}
        className="flex min-w-0 grow-999 basis-140 flex-col items-center gap-7"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 id={titleId} className="font-mono text-title-game text-text">
            {t('game.title')}
          </h1>
          <p className="font-mono text-label-comment text-text-dim">
            <span aria-hidden="true">// </span>
            {t('game.prompt', { length, attempt, max: MAX_GUESSES })}
          </p>
        </div>
        {notices}
        <Board
          length={length}
          guesses={guesses}
          draft={draft}
          label={t('board.label', { max: MAX_GUESSES, length })}
          t={t}
        />
        <MoveHint text={hint} />
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
      </aside>
    </div>
  );
}
