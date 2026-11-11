import { describe, expect, it } from 'vitest';

import * as client from './index';

describe('client entry (TS-3)', () => {
  it('exports the contract', () => {
    expect(typeof client.Instructions).toBe('function');
    expect(typeof client.Game).toBe('function');
    expect(typeof client.Result).toBe('function');
    expect(typeof client.share).toBe('function');
    expect(client.i18n.namespace).toBe('timeline');
    expect(client.HELP_TARGET_ID).toBe('game-help');
    for (const leak of ['timeline', 'definition', 'payloadSchema', 'correct_order']) {
      expect(leak in client).toBe(false);
    }
  });
});
