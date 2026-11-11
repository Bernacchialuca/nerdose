import { describe, expect, it } from 'vitest';

import { timeline } from '../definition';
import { ID, PAYLOAD } from '../definition/test-fixtures';
import { generator } from './index';
import { BANK, DATE, history, seed } from './test-fixtures';

describe('timeline culprits vs usedBankItems', () => {
  it('matches on the fixture (TS-19)', () => {
    const ids = timeline.culprits(PAYLOAD).map((c) => c.id);
    expect(ids).toEqual(generator.usedBankItems(PAYLOAD));
    expect(ids).toEqual([ID.GO, ID.KUBERNETES, ID.PYTHON, ID.DOCKER, ID.JAVA]);
  });

  it('matches on generated payloads (TS-20)', () => {
    for (let n = 1; n <= 10; n++) {
      const p = generator.generate({ date: DATE, seed: seed(n), history: history(BANK) });
      const out = timeline.culprits(p);
      expect(out.map((c) => c.id)).toEqual(generator.usedBankItems(p));
      p.items.forEach((i, idx) =>
        expect(out[idx]).toEqual({ kind: 'timeline_fact', id: i.fact_id, label: i.label }),
      );
    }
  });
});
