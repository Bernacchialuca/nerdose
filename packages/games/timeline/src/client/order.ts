import { arrayMove } from '@dnd-kit/sortable';

import type { TimelinePublicView } from '../definition/schemas';

/** Order the server sent (shuffled): where every game starts, nothing is persisted. */
export const initialOrder = (view: TimelinePublicView): string[] =>
  view.items.map((i) => i.opaque_id);

/** Pure move shared by drag, keyboard and the up/down buttons (same algorithm as dnd-kit). */
export const reorder = (order: string[], from: number, to: number): string[] =>
  arrayMove(order, from, to);

/** One position up (-1) or down (+1); returns the same array when it would leave the range. */
export function moveBy(order: string[], id: string, delta: -1 | 1): string[] {
  const from = order.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return order;
  return reorder(order, from, to);
}

/** True when both lists hold the same ids, whatever their order. */
export const sameIdSet = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');
