import { describe, expect, it } from 'vitest';

import * as ui from '../src/index';

describe('@nerdose/ui public API', () => {
  it('exposes the public components, helpers and cn (TS-59)', () => {
    expect(Object.keys(ui).sort()).toEqual([
      'Alert',
      'AppHeader',
      'Badge',
      'Banner',
      'BrandMark',
      'Card',
      'ChartIcon',
      'GameHeader',
      'GameThumbnail',
      'HelpIcon',
      'Panel',
      'ProgressBar',
      'SegmentedControl',
      'ShareIcon',
      'StreakNumber',
      'StreakPill',
      'TerminalWindow',
      'buttonClass',
      'cn',
      'injectAnalytics',
      'linkClass',
      'navItemClass',
      'track',
    ]);
    for (const value of Object.values(ui)) expect(typeof value).toBe('function');
  });
});
