import { describe, expect, it } from 'vitest';

import { clientRegistry, hasGameClient } from './registry';

describe('clientRegistry', () => {
  it('TS-1: es parcial, Devdle, Grep Grid, Timeline y Big O tienen client', () => {
    expect(typeof clientRegistry['big-o']).toBe('function');
    expect(hasGameClient('big-o')).toBe(true);
    expect(typeof clientRegistry.devdle).toBe('function');
    expect(typeof clientRegistry['grep-grid']).toBe('function');
    expect(typeof clientRegistry.timeline).toBe('function');
    expect(hasGameClient('grep-grid')).toBe(true);
    expect(hasGameClient('timeline')).toBe(true);
    expect(clientRegistry['bug-hunt']).toBeUndefined();
    expect(hasGameClient('bug-hunt')).toBe(false);
    expect(hasGameClient('devdle')).toBe(true);
  });
});
