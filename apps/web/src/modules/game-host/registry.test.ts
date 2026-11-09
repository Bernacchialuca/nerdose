import { describe, expect, it } from 'vitest';

import { clientRegistry, hasGameClient } from './registry';

describe('clientRegistry', () => {
  it('TS-6: es parcial, solo Devdle tiene client', () => {
    expect(typeof clientRegistry.devdle).toBe('function');
    for (const id of ['grep-grid', 'timeline', 'big-o', 'bug-hunt'] as const) {
      expect(clientRegistry[id]).toBeUndefined();
      expect(hasGameClient(id)).toBe(false);
    }
    expect(hasGameClient('devdle')).toBe(true);
  });
});
