import { describe, expect, it } from 'vitest';

import * as ui from '../src/index';

describe('@nerdose/ui public API', () => {
  it('exposes the public components and cn (TS-8)', () => {
    expect(Object.keys(ui).sort()).toEqual(['AppHeader', 'Banner', 'BrandMark', 'cn']);
    for (const fn of [ui.AppHeader, ui.Banner, ui.BrandMark, ui.cn]) expect(typeof fn).toBe('function');
  });
});
