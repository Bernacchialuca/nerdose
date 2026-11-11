import { rngFrom } from '@nerdose/core';
import type { DatePrecision, GameGenerator, TimelineCategory } from '@nerdose/core';

import type { TimelinePayload } from '../definition';
import { PROMPT } from '../shared/prompts';
import { compareChronological } from '../shared/dates';
import { chooseFacts } from './choose';
import { REUSE_WINDOW_DAYS, eligibleFacts } from './eligibility';
import { drawInitialOrder, drawOpaqueIds } from './opaque';
import { verifyPayload } from './verify';

export type TimelineFact = {
  id: string;
  label: string;
  category: TimelineCategory;
  event_date: string;
  date_precision: DatePrecision;
  note: { es: string; en: string };
  last_used: string | null;
};

export const generator: GameGenerator<TimelinePayload, TimelineFact> = {
  historySpec: {
    bank: 'timeline_facts',
    lastUsedField: 'last_used',
    recentDays: REUSE_WINDOW_DAYS,
  },

  usedBankItems: (p) => p.items.map((i) => i.fact_id),

  generate({ date, seed, history }) {
    const rng = rngFrom(seed);
    const eligible = eligibleFacts(history.bankItems, date, history.recentChallenges);
    const chosen = chooseFacts(eligible, history.bankItems, rng);
    const chrono = [...chosen].sort(compareChronological);
    const ids = drawOpaqueIds(rng);
    const order = drawInitialOrder(rng);

    return {
      date,
      prompt: { ...PROMPT },
      items: order.flatMap((k) => {
        const f = chrono[k];
        const opaque_id = ids[k];
        return f && opaque_id
          ? [
              {
                fact_id: f.id,
                opaque_id,
                label: f.label,
                category: f.category,
                event_date: f.event_date,
                date_precision: f.date_precision,
                note: { es: f.note.es, en: f.note.en },
              },
            ]
          : [];
      }),
      correct_order: ids,
    };
  },

  verify: verifyPayload,
};
