import { rngFrom } from '@nerdose/core';
import type { GameGenerator, TermCategory } from '@nerdose/core';

import type { GrepGridPayload } from '../definition';
import { directionOf } from '../shared/geometry';
import { chooseTerms } from './choose';
import { REUSE_WINDOW_DAYS, eligibleTerms } from './eligibility';
import { fillGrid, placeWords } from './placement';
import { verifyPayload } from './verify';

export type GrepGridTerm = {
  id: string;
  term: string;
  category: TermCategory;
  definition: { es: string; en: string };
  summary: { es: string; en: string };
  last_used_grep: string | null;
};

export const generator: GameGenerator<GrepGridPayload, GrepGridTerm> = {
  historySpec: { bank: 'terms', lastUsedField: 'last_used_grep', recentDays: REUSE_WINDOW_DAYS },

  usedBankItems: (p) => p.words.map((w) => w.term_id),

  generate({ date, seed, history }) {
    const rng = rngFrom(seed);
    const eligible = eligibleTerms(history.bankItems, date, history.recentChallenges);
    // Sin elegibles suficientes se elige igual: `verify` rechaza y el pipeline reintenta.
    const terms = chooseTerms(eligible, history.bankItems, rng);
    const { grid, placements } = placeWords(
      terms.map((t) => t.term),
      rng,
    );
    const filled = fillGrid(
      grid,
      terms.map((t) => t.term),
      rng,
    );

    const entries = terms
      .map((t, i) => {
        // Sin ubicación el placement es de relleno: el payload es válido y `verify` lo rechaza.
        const placed = placements[i] ?? {
          from: { row: 0, col: 0 },
          to: { row: 0, col: t.term.length - 1 },
          direction: 'right' as const,
        };
        return {
          t,
          placed: { ...placed, direction: directionOf(placed.from, placed.to) ?? placed.direction },
        };
      })
      .sort((a, b) => (a.t.term < b.t.term ? -1 : a.t.term > b.t.term ? 1 : 0));

    return {
      date,
      grid: filled,
      words: entries.map(({ t }) => ({
        term_id: t.id,
        word: t.term,
        definition: { es: t.definition.es, en: t.definition.en },
      })),
      placements: entries.map(({ t, placed }) => ({
        term_id: t.id,
        from: placed.from,
        to: placed.to,
        direction: placed.direction,
      })),
    };
  },

  verify: verifyPayload,
};
