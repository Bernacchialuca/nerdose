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
      'Dialog',
      'GameHeader',
      'GameThumbnail',
      'Heatmap',
      'HelpIcon',
      'Panel',
      'ProgressBar',
      'SegmentedControl',
      'SelectField',
      'ShareIcon',
      'StreakNumber',
      'StreakPill',
      'Tabs',
      'TerminalWindow',
      'TextAreaField',
      'TextField',
      'buttonClass',
      'cn',
      'dataTableClass',
      'linkClass',
      'navItemClass',
    ]);
    for (const value of Object.values(ui)) expect(typeof value).toBe('function');
  });
});
