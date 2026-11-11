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
    category: p.category,
    prompt: p.prompt[locale],
    items: p.items.map(({ opaque_id, label }) => ({ opaque_id, label })),
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
      category: p.category,
      correct_order: [...p.correct_order],
      submitted_order: [...submitted],
      items,
    };
  },

  isWin: (r) => r.win,
  score: (r) => r.score,

  initialStats: () => ({ by_category: {} }),

  reduceStats(prev, r) {
    const cur = prev.by_category[r.category] ?? { played: 0, correct: 0 };
    return {
      by_category: {
        ...prev.by_category,
        [r.category]: { played: cur.played + 1, correct: cur.correct + r.score },
      },
    };
  },

  historyLabel: (r) => `${r.score}/${ITEMS_COUNT}`,
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
