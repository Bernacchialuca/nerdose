import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { describe, expect, it } from 'vitest';

import { GG_PAYLOAD, SEVEN, cellsOf, found } from './grep-grid';

describe('fixture de Grep Grid', () => {
  it('toPublic sin estado no trae definiciones y la octava palabra gana', () => {
    const view = grepGrid.toPublic(GG_PAYLOAD, 'es');
    expect(view.words).toHaveLength(8);
    expect(view.words.every((w) => !('definition' in w))).toBe(true);
    expect(grepGrid.result(GG_PAYLOAD, found(...SEVEN, 'PYTHON'), 'es').win).toBe(true);
    expect(cellsOf('DOCKER')).toHaveLength(6);
  });
});
