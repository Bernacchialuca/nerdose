import { describe, expect, it } from 'vitest';

import { devdle } from '../definition';
import { PAYLOAD_REACT } from '../definition/test-fixtures';
import { generator } from './index';
import { BANK, DATE, seed } from './test-fixtures';

describe('devdle culprits vs usedBankItems', () => {
  it('matches on the fixture (TS-5)', () => {
    const ids = devdle.culprits(PAYLOAD_REACT).map((c) => c.id);
    expect(ids).toEqual(generator.usedBankItems(PAYLOAD_REACT));
    expect(ids).toEqual(['0b7e6f1c-3a52-4c1e-9f0a-1d2e3f4a5b6c']);
  });

  it('matches on generated payloads (TS-6)', () => {
    for (let n = 1; n <= 20; n++) {
      const p = generator.generate({
        date: DATE,
        seed: seed(n),
        history: { bankItems: BANK, recentChallenges: [] },
      });
      expect(devdle.culprits(p).map((c) => c.id)).toEqual(generator.usedBankItems(p));
      expect(devdle.culprits(p)[0]).toEqual({ kind: 'term', id: p.term_id, label: p.word });
    }
  });
});
