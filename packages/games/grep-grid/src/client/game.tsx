import { useEffect, useRef, useState } from 'react';

import { buttonClass, cn } from '@nerdose/ui';

import { moveSchema, WORDS_COUNT } from '../definition/schemas';
import { sameCell, type Cell } from '../shared/geometry';

import { Board } from './board';
import { cellKey, playCells } from './cells';
import { ConsoleHint, type HintAnnouncement } from './console-hint';
import { CounterCard } from './counter-card';
import { HELP_TARGET_ID } from './help-target';
import { parseFeedback, parsePublicView, parseState } from './parse';
import { SURRENDER_BUTTON } from './surrender-button';
import { SurrenderDialog } from './surrender-dialog';
import type { GameProps } from './types';
import { WordList, type WordRow } from './word-list';

type Learned = Record<string, { definition: string; cells: Cell[] }>;
type Hint =
  | { key: 'idle' | 'start' | 'notAWord' | 'invalidMove' | 'rateLimited' }
  | { key: 'found'; word: string; found: number }
  | { key: 'message'; message: string };
type Dialog = 'closed' | 'open' | 'submitting';

const IDLE: Hint = { key: 'idle' };

export function Game({
  locale,
  t,
  notices,
  publicView,
  state,
  feedback = null,
  onMove,
  pending,
  moveError,
  locked = false,
}: GameProps) {
  const view = parsePublicView(publicView);
  const play = parseState(state);

  const [start, setStart] = useState<Cell | null>(null);
  const [learned, setLearned] = useState<Learned>({});
  const [hint, setHint] = useState<Hint>(IDLE);
  const [announcement, setAnnouncement] = useState<HintAnnouncement | null>(null);
  const [prevFeedback, setPrevFeedback] = useState(feedback);
  const [prevError, setPrevError] = useState(moveError);
  const [prevPending, setPrevPending] = useState(pending);
  const [prevLocale, setPrevLocale] = useState(locale);
  const [dialog, setDialog] = useState<Dialog>('closed');
  const surrenderRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const foundIds = new Set([...play.found_words.map((w) => w.term_id), ...Object.keys(learned)]);

  const text = (h: Hint): string => {
    switch (h.key) {
      case 'found':
        return t('hint.found', { word: h.word, found: h.found, total: WORDS_COUNT });
      case 'message':
        return t('hint.message', { message: h.message });
      default:
        return t(`hint.${h.key}`);
    }
  };
  const announce = (h: Hint) => setAnnouncement({ id: (announcement?.id ?? 0) + 1, text: text(h) });

  // Adjusting state while rendering (React docs): only identity changes after mount are processed,
  // so a stale feedback from the first render never paints cells of another day.
  if (feedback !== prevFeedback) {
    setPrevFeedback(feedback);
    const fb = parseFeedback(feedback);
    if (fb?.found) {
      setLearned({ ...learned, [fb.term_id]: { definition: fb.definition, cells: fb.cells } });
      const next: Hint = {
        key: 'found',
        word: fb.word,
        found: new Set([...foundIds, fb.term_id]).size,
      };
      setHint(next);
      announce(next);
    } else if (fb?.reason === 'not_a_word') {
      setHint({ key: 'notAWord' });
      announce({ key: 'notAWord' });
    } else if (fb) {
      setHint(IDLE);
    }
  }
  // A past hint is stale once the language changes: back to the idle guide.
  if (locale !== prevLocale) {
    setPrevLocale(locale);
    if (!start) setHint(IDLE);
  }
  if (moveError !== prevError) {
    setPrevError(moveError);
    if (moveError) {
      const next: Hint =
        moveError.code === 'invalid_move'
          ? { key: 'invalidMove' }
          : moveError.code === 'rate_limited'
            ? { key: 'rateLimited' }
            : { key: 'message', message: moveError.message };
      setHint(next);
      announce(next);
      if (dialog === 'submitting') setDialog('closed');
    }
  }
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (prevPending && !pending && dialog === 'submitting') setDialog('closed');
  }
  if (locked && dialog !== 'closed') setDialog('closed');

  useEffect(() => {
    if (dialog === 'closed' && wasOpenRef.current) surrenderRef.current?.focus();
    wasOpenRef.current = dialog !== 'closed';
  }, [dialog]);

  const found = foundIds.size;
  const foundCells = new Set<string>([
    ...play.found_words.flatMap((w) => w.cells.map(cellKey)),
    ...Object.values(learned).flatMap((l) => l.cells.map(cellKey)),
  ]);
  const rows: WordRow[] = view.words.map((w) => ({
    term_id: w.term_id,
    word: w.word,
    definition: w.definition ?? learned[w.term_id]?.definition,
    status: foundIds.has(w.term_id) ? 'found' : 'pending',
  }));

  const blocked = locked || pending;
  const onCellPress = (cell: Cell) => {
    if (blocked) return;
    if (!start) {
      setStart(cell);
      setHint({ key: 'start' });
    } else if (sameCell(start, cell)) {
      setStart(null);
      setHint(IDLE);
    } else {
      onMove(moveSchema.parse({ type: 'select', from: start, to: cell }));
      setStart(null);
      setHint(IDLE);
    }
  };
  const onCancel = () => {
    setStart(null);
    setHint(IDLE);
  };

  return (
    <div className="relative">
      <div inert={dialog !== 'closed'} className="flex flex-wrap gap-7">
        <div className="flex min-w-0 grow-7 basis-155 flex-col items-center gap-3.5">
          <div id={HELP_TARGET_ID} className="flex w-full flex-col gap-2">
            <h1 className="font-mono text-title-game text-text">{t('title')}</h1>
            <p>
              <span className="font-mono text-label-comment text-text-dim">{t('game.prompt')}</span>{' '}
              <span aria-hidden="true">·</span>{' '}
              <span className="font-sans text-caption text-text-muted">
                {t('game.instruction')}
              </span>
            </p>
          </div>
          {notices}
          <div className="flex w-full justify-start">
            <CounterCard found={found} t={t} />
          </div>
          <Board
            mode="play"
            cells={playCells(view.grid, foundCells, start)}
            label={t('board.label')}
            t={t}
            disabled={blocked}
            onCellPress={onCellPress}
            onCancel={onCancel}
          />
          <div className="w-full">
            <ConsoleHint text={text(hint)} announcement={announcement} />
          </div>
        </div>
        <div className="flex min-w-0 grow-5 basis-85 flex-col gap-4">
          <WordList rows={rows} mode="play" t={t} />
          {locked ? null : (
            <button
              ref={surrenderRef}
              type="button"
              aria-disabled={pending || undefined}
              onClick={() => {
                if (!pending) setDialog('open');
              }}
              className={cn(
                pending ? buttonClass({ disabled: true }) : SURRENDER_BUTTON,
                'self-start',
              )}
            >
              <span aria-hidden="true">✕</span>
              {t('surrender.button')}
            </button>
          )}
        </div>
      </div>
      {dialog === 'closed' ? null : (
        <SurrenderDialog
          found={found}
          busy={dialog === 'submitting'}
          t={t}
          onClose={() => setDialog('closed')}
          onConfirm={() => {
            onMove(moveSchema.parse({ type: 'give_up' }));
            setDialog('submitting');
          }}
        />
      )}
    </div>
  );
}
