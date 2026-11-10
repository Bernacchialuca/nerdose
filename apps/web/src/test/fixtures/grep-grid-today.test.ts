import { describe, expect, it } from 'vitest';

import { CELLS, GG_GRID, GG_ID, GG_WORDS } from './grep-grid-today';

describe('fixtures de Grep Grid', () => {
  it('cada palabra se lee en la grilla siguiendo sus celdas', () => {
    for (const w of GG_WORDS) {
      expect(CELLS[w].map(({ row, col }) => GG_GRID[row]?.[col]).join(''), w).toBe(w);
    }
  });

  it('grilla 12x12 de letras A-Z, 8 palabras con term_id únicos', () => {
    expect(GG_GRID).toHaveLength(12);
    for (const row of GG_GRID) {
      expect(row).toHaveLength(12);
      for (const letter of row) expect(letter).toMatch(/^[A-Z]$/);
    }
    expect(GG_WORDS).toHaveLength(8);
    expect(new Set(Object.values(GG_ID)).size).toBe(8);
  });
});
