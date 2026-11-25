import type { TimelineCategory } from '@nerdose/core';
import { buttonClass, cn } from '@nerdose/ui';

import { ITEMS_COUNT } from '../definition/schemas';

import { CategoryTag } from './category-tag';
import type { Translate } from './types';
import { useRowSortable } from './use-row-sortable';

type SortableRowProps = {
  id: string;
  label: string;
  category: TimelineCategory | undefined;
  index: number;
  blocked: boolean;
  t: Translate;
  onMove: (delta: -1 | 1) => void;
};

/** `timeline.row` while playing: handle (the only drag activator) · position · name + category · up/down. */
export function SortableRow({ id, label, category, index, blocked, t, onMove }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging, isOver, style } =
    useRowSortable(id, blocked, t('row.roleDescription'));
  const names = { label, position: index + 1, total: ITEMS_COUNT };

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-row-id={id}
      data-row-index={index}
      className={cn(
        'flex min-h-16 flex-wrap items-center gap-2 rounded-control border border-game-timeline-border bg-game-timeline-tint px-2 py-1.5 @xs:flex-nowrap',
        isDragging && 'border-2 border-game-timeline px-1.75 py-0.75',
        isOver && !isDragging && 'border-dashed border-game-timeline',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        disabled={blocked}
        aria-label={t('row.handle', names)}
        className={cn(buttonClass({ variant: 'icon', disabled: blocked }), 'shrink-0 touch-none')}
      >
        <span aria-hidden="true">⠿</span>
      </button>
      <span
        aria-hidden="true"
        className="w-4.5 shrink-0 font-mono text-label-comment text-text-dim"
      >
        {index + 1}
      </span>
      <div className="order-last flex min-w-0 grow basis-full flex-col @xs:order-none @xs:basis-auto">
        <span className="break-words font-mono text-game-item text-text">{label}</span>
        {category ? <CategoryTag category={category} t={t} /> : null}
      </div>
      <span
        aria-hidden="true"
        className="hidden shrink-0 font-mono text-label-comment text-text-dim @sm:inline"
      >
        {t('game.unknownDate')}
      </span>
      <div className="ml-auto flex shrink-0 flex-row gap-1">
        <button
          type="button"
          data-dir="up"
          disabled={blocked || index === 0}
          aria-label={t('row.up', { label })}
          onClick={() => onMove(-1)}
          className={cn(
            buttonClass({ variant: 'icon', disabled: blocked || index === 0 }),
            'shrink-0',
          )}
        >
          <span aria-hidden="true">↑</span>
        </button>
        <button
          type="button"
          data-dir="down"
          disabled={blocked || index === ITEMS_COUNT - 1}
          aria-label={t('row.down', { label })}
          onClick={() => onMove(1)}
          className={cn(
            buttonClass({ variant: 'icon', disabled: blocked || index === ITEMS_COUNT - 1 }),
            'shrink-0',
          )}
        >
          <span aria-hidden="true">↓</span>
        </button>
      </div>
    </li>
  );
}
