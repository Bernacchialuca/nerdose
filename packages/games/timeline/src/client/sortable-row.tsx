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
        'flex min-h-13 items-center gap-2 rounded-control border border-border-subtle bg-surface px-2 py-1',
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
        className={cn(buttonClass({ variant: 'icon', disabled: blocked }), 'touch-none')}
      >
        <span aria-hidden="true">⠿</span>
      </button>
      <span
        aria-hidden="true"
        className="w-4.5 shrink-0 font-mono text-label-comment text-text-dim"
      >
        {index + 1}
      </span>
      <div className="flex min-w-0 grow flex-col">
        <span className="break-words font-mono text-game-item text-text">{label}</span>
        {category ? <CategoryTag category={category} t={t} /> : null}
      </div>
      <div className="flex flex-col gap-1 @xs:flex-row">
        <button
          type="button"
          data-dir="up"
          disabled={blocked || index === 0}
          aria-label={t('row.up', { label })}
          onClick={() => onMove(-1)}
          className={buttonClass({ variant: 'icon', disabled: blocked || index === 0 })}
        >
          <span aria-hidden="true">↑</span>
        </button>
        <button
          type="button"
          data-dir="down"
          disabled={blocked || index === ITEMS_COUNT - 1}
          aria-label={t('row.down', { label })}
          onClick={() => onMove(1)}
          className={buttonClass({
            variant: 'icon',
            disabled: blocked || index === ITEMS_COUNT - 1,
          })}
        >
          <span aria-hidden="true">↓</span>
        </button>
      </div>
    </li>
  );
}
