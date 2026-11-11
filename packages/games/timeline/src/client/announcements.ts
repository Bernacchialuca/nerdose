import type { Announcements, ScreenReaderInstructions } from '@dnd-kit/core';

import { ITEMS_COUNT } from '../definition/schemas';

import type { Translate } from './types';

/**
 * dnd-kit announcements. `positionOf(id)` is the 1-based position in the CURRENT local order: while
 * dragging the order does not change until drop, so `over` gives the target position.
 */
export function makeAnnouncements(
  t: Translate,
  labelOf: (id: string) => string,
  positionOf: (id: string) => number,
): Announcements {
  const say = (key: string, id: string, at: string) =>
    t(key, { label: labelOf(id), position: positionOf(at), total: ITEMS_COUNT });
  return {
    onDragStart: ({ active }) => say('dnd.start', String(active.id), String(active.id)),
    onDragOver: ({ active, over }) =>
      say('dnd.over', String(active.id), String((over ?? active).id)),
    onDragEnd: ({ active, over }) => say('dnd.end', String(active.id), String((over ?? active).id)),
    onDragCancel: ({ active }) => say('dnd.cancel', String(active.id), String(active.id)),
  };
}

export const makeScreenReaderInstructions = (t: Translate): ScreenReaderInstructions => ({
  draggable: t('dnd.instructions'),
});
