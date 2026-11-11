import { describe, expect, it } from 'vitest';

import { clientRegistry, hasGameClient } from './registry';

describe('clientRegistry', () => {
  it('TS-3: es parcial, Devdle, Grep Grid y Timeline tienen client', () => {
    expect(typeof clientRegistry.devdle).toBe('function');
    expect(typeof clientRegistry['grep-grid']).toBe('function');
    expect(typeof clientRegistry.timeline).toBe('function');
    expect(hasGameClient('grep-grid')).toBe(true);
    expect(hasGameClient('timeline')).toBe(true);
    for (const id of ['big-o', 'bug-hunt'] as const) {
      expect(clientRegistry[id]).toBeUndefined();
      expect(hasGameClient(id)).toBe(false);
    }
    expect(hasGameClient('devdle')).toBe(true);
  });
});
