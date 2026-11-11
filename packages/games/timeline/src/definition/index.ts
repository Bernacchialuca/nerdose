import type { GameDefinition } from '@nerdose/core';

import {
  ITEMS_COUNT,
  moveSchema,
  type TimelineFeedback,
  type TimelineMove,
  type TimelinePayload,
  type TimelinePublicView,
  type TimelineResult,
  type TimelineState,
  type TimelineStats,
} from './schemas';

export const timeline: GameDefinition<
  TimelinePayload,
  TimelinePublicView,
  TimelineState,
  TimelineMove,
  TimelineFeedback,
  TimelineResult,
  TimelineStats
> = {
  id: 'timeline',
  version: 1,
  moveSchema,

  toPublic: (p, locale) => ({
    prompt: p.prompt[locale],
    items: p.items.map(({ opaque_id, label, category }) => ({ opaque_id, label, category })),
  }),

  initState: () => ({}),

  applyMove(p, s, m) {
    if (s.order !== undefined) return { error: 'invalid_move' };
    const ids = new Set(p.items.map((i) => i.opaque_id));
    if (
      m.order.length !== ITEMS_COUNT ||
      new Set(m.order).size !== ITEMS_COUNT ||
      m.order.some((id) => !ids.has(id))
    ) {
      return { error: 'invalid_move' };
    }
    return { state: { order: [...m.order] }, feedback: null };
  },

  isFinished: (s) => s.order !== undefined,

  result(p, s, locale) {
    const submitted = s.order ?? [];
    const score = p.correct_order.filter((id, i) => submitted[i] === id).length;
    const items = p.correct_order.flatMap((id) => {
      const i = p.items.find((x) => x.opaque_id === id);
      return i
        ? [
            {
              opaque_id: i.opaque_id,
              label: i.label,
              category: i.category,
              event_date: i.event_date,
              date_precision: i.date_precision,
              note: i.note[locale],
            },
          ]
        : [];
    });
    return {
      win: score === ITEMS_COUNT,
      score,
      correct_order: [...p.correct_order],
      submitted_order: [...submitted],
      items,
    };
  },

  isWin: (r) => r.win,
  score: (r) => r.score,

  initialStats: () => ({ by_category: {} }),

  // Por hito: `r.items` va en el orden correcto, así que el item k acertó si quedó en la posición k.
  reduceStats(prev, r) {
    const byCategory = { ...prev.by_category };
    r.items.forEach((item, k) => {
      const cur = byCategory[item.category] ?? { played: 0, correct: 0 };
      const hit = r.submitted_order[k] === item.opaque_id ? 1 : 0;
      byCategory[item.category] = { played: cur.played + 1, correct: cur.correct + hit };
    });
    return { by_category: byCategory };
  },

  historyLabel: (r) => `${r.score}/${ITEMS_COUNT}`,
  culprits: (p) => p.items.map((i) => ({ kind: 'timeline_fact', id: i.fact_id, label: i.label })),
};

export { timeline as definition };
export {
  ITEMS_COUNT,
  OPAQUE_ID_PATTERN,
  feedbackSchema,
  moveSchema,
  payloadSchema,
  publicViewSchema,
  resultSchema,
  stateSchema,
  statsSchema,
} from './schemas';
export type {
  TimelineFeedback,
  TimelineItem,
  TimelineMove,
  TimelinePayload,
  TimelinePublicView,
  TimelineResult,
  TimelineState,
  TimelineStats,
} from './schemas';
