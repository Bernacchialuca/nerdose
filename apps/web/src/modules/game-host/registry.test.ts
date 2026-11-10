import { describe, expect, it } from 'vitest';

import { clientRegistry, hasGameClient } from './registry';

describe('clientRegistry', () => {
  it('TS-3: es parcial, Devdle y Grep Grid tienen client', () => {
    expect(typeof clientRegistry.devdle).toBe('function');
    expect(typeof clientRegistry['grep-grid']).toBe('function');
    expect(hasGameClient('grep-grid')).toBe(true);
    for (const id of ['timeline', 'big-o', 'bug-hunt'] as const) {
      expect(clientRegistry[id]).toBeUndefined();
      expect(hasGameClient(id)).toBe(false);
    }
    expect(hasGameClient('devdle')).toBe(true);
  });
});
