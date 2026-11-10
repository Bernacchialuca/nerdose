import { describe, expect, it } from 'vitest';

import * as client from './index';

describe('client entry (TS-2)', () => {
  it('exports the contract', () => {
    expect(typeof client.Instructions).toBe('function');
    expect(typeof client.Game).toBe('function');
    expect(typeof client.Result).toBe('function');
    expect(typeof client.share).toBe('function');
    expect(client.i18n.namespace).toBe('grep-grid');
    expect(client.HELP_TARGET_ID).toBe('game-help');
    for (const leak of ['grepGrid', 'definition', 'payloadSchema', 'lineCells']) {
      expect(leak in client).toBe(false);
    }
  });
});
