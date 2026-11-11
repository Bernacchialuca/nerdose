import { describe, expect, it } from 'vitest';

import * as client from './index';

describe('timeline client stub', () => {
  it('exports nothing until S-029 (TS-3)', () => {
    expect(Object.keys(client)).toEqual([]);
  });
});
