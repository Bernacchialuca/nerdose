import { describe, expect, it } from 'vitest';

import { grepGrid } from '../definition';
import { ID, PAYLOAD } from '../definition/test-fixtures';
import { generator } from './index';
import { BANK, DATE, history, seed } from './test-fixtures';

describe('grepGrid culprits vs usedBankItems', () => {
  it('matches on the fixture (TS-12)', () => {
    const ids = grepGrid.culprits(PAYLOAD).map((c) => c.id);
    expect(ids).toEqual(generator.usedBankItems(PAYLOAD));
    expect(ids).toEqual(Object.values(ID));
  });

  it('matches on generated payloads (TS-13)', () => {
    for (let n = 1; n <= 10; n++) {
      const p = generator.generate({ date: DATE, seed: seed(n), history: history(BANK) });
      const out = grepGrid.culprits(p);
      expect(out.map((c) => c.id)).toEqual(generator.usedBankItems(p));
      p.words.forEach((w, i) =>
        expect(out[i]).toEqual({ kind: 'term', id: w.term_id, label: w.word }),
      );
    }
  });
});
