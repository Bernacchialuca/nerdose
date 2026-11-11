import { useEffect, useRef, useState } from 'react';

import {
  closestCenter,
  DndContext,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { buttonClass } from '@nerdose/ui';

import { ITEMS_COUNT, moveSchema } from '../definition/schemas';

import { makeAnnouncements, makeScreenReaderInstructions } from './announcements';
import { ConsoleHint, type HintAnnouncement } from './console-hint';
import { HELP_TARGET_ID } from './help-target';
import { initialOrder, moveBy, reorder } from './order';
import { parsePublicView, parseState } from './parse';
import { SectionPanel } from './section-panel';
import { useTimelineSensors } from './sensors';
import { SortableRow } from './sortable-row';
import type { GameProps } from './types';

type Hint =
  | { key: 'idle' | 'invalidMove' | 'rateLimited' }
  | { key: 'moved'; id: string }
  | { key: 'over'; id: string; at: string }
  | { key: 'message'; message: string };

const IDLE: Hint = { key: 'idle' };
const idsKeyOf = (ids: readonly string[]): string => [...ids].sort().join(',');

export function Game({
  t,
  notices,
  publicView,
  state,
  onMove,
  pending,
  moveError,
  locked = false,
}: GameProps) {
  const view = parsePublicView(publicView);
  parseState(state);

  const idsKey = idsKeyOf(view.items.map((i) => i.opaque_id));
  const [order, setOrder] = useState(() => initialOrder(view));
  const [prevIdsKey, setPrevIdsKey] = useState(idsKey);
  const [hint, setHint] = useState<Hint>(IDLE);
  const [announcement, setAnnouncement] = useState<HintAnnouncement | null>(null);
  const [prevError, setPrevError] = useState(moveError);
  const sensors = useTimelineSensors();
  const listRef = useRef<HTMLOListElement>(null);
  const focusRef = useRef<{ id: string; dir: -1 | 1 } | null>(null);
  const submittedRef = useRef(false);

  const labels = new Map(view.items.map((i) => [i.opaque_id, i.label]));
  const categories = new Map(view.items.map((i) => [i.opaque_id, i.category]));
  const labelOf = (id: string) => labels.get(id) ?? id;
  const blocked = pending || locked;

  const text = (h: Hint, ord: readonly string[]): string => {
    const at = (id: string) => ord.indexOf(id) + 1;
    switch (h.key) {
      case 'idle':
        return '';
      case 'moved':
        return t('hint.moved', { label: labelOf(h.id), position: at(h.id), total: ITEMS_COUNT });
      case 'over':
        return t('hint.over', { label: labelOf(h.id), position: at(h.at), total: ITEMS_COUNT });
      case 'message':
        return t('hint.message', { message: h.message });
      default:
        return t(`hint.${h.key}`);
    }
  };
  const announce = (h: Hint, ord: readonly string[]) =>
    setAnnouncement({ id: (announcement?.id ?? 0) + 1, text: text(h, ord) });

  // Adjusting state while rendering (React docs): another challenge restarts from the shuffle; a
  // language change keeps the same ids and so keeps the local order (CA-36).
  if (idsKey !== prevIdsKey) {
    setPrevIdsKey(idsKey);
    setOrder(initialOrder(view));
    setHint(IDLE);
    setAnnouncement(null);
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
      announce(next, order);
    }
  }

  // A rejected or finished submit re-arms "Confirmar orden".
  useEffect(() => {
    if (!pending) submittedRef.current = false;
  }, [pending, moveError]);

  // Keep the focus on the moved milestone's button (or the other one if it got disabled).
  useEffect(() => {
    const request = focusRef.current;
    if (!request) return;
    focusRef.current = null;
    const row = listRef.current?.querySelector(`[data-row-id="${request.id}"]`);
    const pick = (dir: string) => row?.querySelector<HTMLButtonElement>(`[data-dir="${dir}"]`);
    const preferred = pick(request.dir < 0 ? 'up' : 'down');
    const other = pick(request.dir < 0 ? 'down' : 'up');
    (preferred && !preferred.disabled ? preferred : other)?.focus();
  }, [order]);

  const moveRow = (id: string, delta: -1 | 1) => {
    const next = moveBy(order, id, delta);
    if (next === order) return;
    focusRef.current = { id, dir: delta };
    setOrder(next);
    const h: Hint = { key: 'moved', id };
    setHint(h);
    announce(h, next);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    setHint({ key: 'over', id, at: id });
  };
  const onDragOver = ({ active, over }: DragOverEvent) => {
    const id = String(active.id);
    setHint({ key: 'over', id, at: String(over?.id ?? id) });
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id);
    if (over && over.id !== active.id) {
      setOrder(reorder(order, order.indexOf(id), order.indexOf(String(over.id))));
    }
    setHint({ key: 'moved', id });
  };
  const onDragCancel = ({ active }: DragCancelEvent) => {
    const id = String(active.id);
    setHint({ key: 'over', id, at: id });
  };

  const confirm = () => {
    if (blocked || submittedRef.current) return;
    submittedRef.current = true;
    onMove(moveSchema.parse({ order }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-label-comment text-text-dim">{`// ${t('game.comment')}`}</p>
        <h1 className="font-mono text-title-game text-text">{view.prompt}</h1>
      </div>
      {notices}
      <div className="flex flex-wrap gap-6">
        <div className="flex min-w-0 grow-7 basis-130 flex-col gap-3.5">
          <SectionPanel title={t('game.listTitle')} className="p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              accessibility={{
                announcements: makeAnnouncements(t, labelOf, (id) => order.indexOf(id) + 1),
                screenReaderInstructions: makeScreenReaderInstructions(t),
              }}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDragCancel={onDragCancel}
            >
              <SortableContext items={order} strategy={verticalListSortingStrategy}>
                <ol ref={listRef} className="@container flex flex-col gap-2">
                  {order.map((id, index) => (
                    <SortableRow
                      key={id}
                      id={id}
                      label={labelOf(id)}
                      category={categories.get(id)}
                      index={index}
                      blocked={blocked}
                      t={t}
                      onMove={(delta) => moveRow(id, delta)}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          </SectionPanel>
          <ConsoleHint text={text(hint, order)} announcement={announcement} />
        </div>
        <div className="flex min-w-0 grow-5 basis-80 flex-col gap-4">
          {locked ? null : (
            <>
              <p id={HELP_TARGET_ID} className="font-sans text-caption text-text-muted">
                {t('game.help')}
              </p>
              <button
                type="button"
                aria-disabled={pending || undefined}
                onClick={confirm}
                className={buttonClass({
                  variant: 'accent',
                  game: 'timeline',
                  size: 'lg',
                  fullWidth: true,
                  disabled: pending,
                })}
              >
                <span aria-hidden="true">✓</span>
                {pending ? t('game.confirming') : t('game.confirm')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
