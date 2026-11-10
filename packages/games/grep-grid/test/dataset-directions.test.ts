import { loadDataset } from '@nerdose/content';
import { describe, expect, it } from 'vitest';

import { generator, type GrepGridTerm } from '../src/generator';
import { DATE, seed } from '../src/generator/test-fixtures';

const SEEDS = 300;
// Genera 300 grillas sobre el dataset real: bajo carga (turbo en paralelo) pasa los 5 s por defecto.
const TIMEOUT_MS = 60_000;
const DIAGONALS = new Set(['down_right', 'up_right']);

describe('grep-grid direction mix on the real dataset', () => {
  it(
    'places a fair share of diagonals and almost never a grid without them',
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
      let placed = 0;
      let diagonal = 0;
      let gridsWithoutDiagonal = 0;
      for (let n = 1; n <= SEEDS; n++) {
        const { placements } = generator.generate({ date: DATE, seed: seed(n), history });
        const d = placements.filter((p) => DIAGONALS.has(p.direction)).length;
        placed += placements.length;
        diagonal += d;
        if (d === 0) gridsWithoutDiagonal++;
      }
      console.info(
        `grep-grid directions: ${diagonal}/${placed} diagonal; ${gridsWithoutDiagonal}/${SEEDS} grids without diagonals`,
      );
      // Con direcciones preferidas repartidas (2 por dirección), ~la mitad van en diagonal (antes: 23 %).
      expect(diagonal / placed).toBeGreaterThan(0.4);
      // Antes: 29 % de las grillas sin ninguna diagonal.
      expect(gridsWithoutDiagonal / SEEDS).toBeLessThan(0.02);
    },
    TIMEOUT_MS,
  );
});
