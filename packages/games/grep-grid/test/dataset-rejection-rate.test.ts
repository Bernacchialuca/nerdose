import { loadDataset } from '@nerdose/content';
import { describe, expect, it } from 'vitest';

import { payloadSchema } from '../src/definition';
import { generator, type GrepGridTerm } from '../src/generator';
import { DATE, seed } from '../src/generator/test-fixtures';

const SEEDS = 200;
const MIN_RATE = 0.95;
// Genera y verifica 200 grillas sobre el dataset real: bajo carga (turbo en paralelo) pasa los 5 s por defecto.
const TIMEOUT_MS = 60_000;

describe('grep-grid rejection rate on the real dataset (TS-73)', () => {
  it(
    `passes verify in at least ${MIN_RATE * 100}% of ${SEEDS} candidates`,
    () => {
      const bankItems: GrepGridTerm[] = loadDataset()
        .terms.filter((t) => t.status === 'approved')
        .map((t) => ({
          id: t.wikidata_id,
          term: t.term,
          category: t.category,
          definition: t.definition,
          summary: t.summary,
          last_used_grep: null,
        }));
      const history = { bankItems, recentChallenges: [] };
      const reasons: string[] = [];
      let ok = 0;
      for (let n = 1; n <= SEEDS; n++) {
        const p = payloadSchema.parse(generator.generate({ date: DATE, seed: seed(n), history }));
        const v = generator.verify(p, history);
        if (v.ok) ok++;
        else reasons.push(v.reason ?? '?');
      }
      console.info(
        `grep-grid rejection: ${ok}/${SEEDS} ok; reasons: ${reasons.join(',') || 'none'}`,
      );
      expect(ok / SEEDS).toBeGreaterThanOrEqual(MIN_RATE);
    },
    TIMEOUT_MS,
  );
});
