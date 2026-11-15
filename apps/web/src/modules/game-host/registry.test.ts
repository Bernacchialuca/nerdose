import { describe, expect, it } from 'vitest';

import { GAME_IDS } from '@nerdose/core';

import { clientRegistry, hasGameClient } from './registry';

describe('clientRegistry', () => {
  it('TS-1: los 5 juegos tienen client', () => {
    expect(typeof clientRegistry['big-o']).toBe('function');
    expect(hasGameClient('big-o')).toBe(true);
    expect(typeof clientRegistry.devdle).toBe('function');
    expect(typeof clientRegistry['grep-grid']).toBe('function');
    expect(typeof clientRegistry.timeline).toBe('function');
    expect(hasGameClient('grep-grid')).toBe(true);
    expect(hasGameClient('timeline')).toBe(true);
    expect(typeof clientRegistry['bug-hunt']).toBe('function');
    expect(hasGameClient('bug-hunt')).toBe(true);
    expect(GAME_IDS.every((id) => hasGameClient(id))).toBe(true);
    expect(hasGameClient('devdle')).toBe(true);
  });
});
