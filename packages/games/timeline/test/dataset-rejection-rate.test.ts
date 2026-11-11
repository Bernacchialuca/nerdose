import { loadDataset } from '@nerdose/content';
import { describe, expect, it } from 'vitest';

import { payloadSchema } from '../src/definition';
import { generator, type TimelineFact } from '../src/generator';
import { DATE, seed } from '../src/generator/test-fixtures';

const SEEDS = 200;
const MIN_RATE = 0.95;
// Genera y verifica 200 desafíos sobre el dataset real: bajo carga (turbo en paralelo) pasa los 5 s por defecto.
const TIMEOUT_MS = 60_000;

describe('timeline rejection rate on the real dataset (TS-68)', () => {
  it(
    `passes verify in at least ${MIN_RATE * 100}% of ${SEEDS} candidates`,
    () => {
      const bankItems: TimelineFact[] = loadDataset()
        .timelineFacts.filter((f) => f.status === 'approved')
        .map((f) => ({
          id: f.wikidata_id,
          label: f.label,
          category: f.category,
          event_date: f.event_date,
          date_precision: f.date_precision,
          note: f.note,
          last_used: null,
        }));
      const history = { bankItems, recentChallenges: [] };
      const reasons: string[] = [];
      const categories = new Set<string>();
      let ok = 0;
      for (let n = 1; n <= SEEDS; n++) {
        const p = payloadSchema.parse(generator.generate({ date: DATE, seed: seed(n), history }));
        categories.add(p.category);
        const v = generator.verify(p, history);
        if (v.ok) ok++;
        else reasons.push(v.reason ?? '?');
      }
      console.info(
        `timeline rejection: ${ok}/${SEEDS} ok; reasons: ${reasons.join(',') || 'none'}`,
      );
      expect(ok / SEEDS).toBeGreaterThanOrEqual(MIN_RATE);
      expect(categories.size).toBeGreaterThanOrEqual(3);
      expect(categories.has('hardware')).toBe(false);
    },
    TIMEOUT_MS,
  );
});
