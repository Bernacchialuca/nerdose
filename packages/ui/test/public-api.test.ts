import { describe, expect, it } from 'vitest';

import * as ui from '../src/index';

describe('@nerdose/ui public API', () => {
  it('exposes only cn from the entry point (TS-13)', () => {
    expect(Object.keys(ui).sort()).toEqual(['cn']);
    expect(typeof ui.cn).toBe('function');
  });
});
