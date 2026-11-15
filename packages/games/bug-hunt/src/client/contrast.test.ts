// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

import { SHIKI_VARS } from './shiki-vars';

const css = readFileSync(createRequire(import.meta.url).resolve('@nerdose/ui/tokens.css'), 'utf8');
const colors = new Map<string, string>();
for (const m of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  colors.set(m[1] as string, m[2] as string);
}

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (fg: string, bg: string): number => {
  const [a, b] = [luminance(colors.get(fg) as string), luminance(colors.get(bg) as string)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

describe('client color pairs (TS-17)', () => {
  it('maps every Shiki variable to a defined DS color with AA on both code backgrounds', () => {
    const vars = Object.values(SHIKI_VARS) as string[];
    expect(vars).toHaveLength(11);
    for (const v of vars) {
      const isBackground = v === SHIKI_VARS['--shiki-background' as keyof typeof SHIKI_VARS];
      const name = /^var\(--color-([a-z0-9-]+)\)$/.exec(v)?.[1];
      expect(name, v).toBeDefined();
      expect(colors.has(name as string), `${name} in tokens.css`).toBe(true);
      if (isBackground) continue;
      expect(
        ratio(name as string, 'surface-sunken'),
        `${name}/surface-sunken`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        ratio(name as string, 'game-bug-hunt-tint'),
        `${name}/game-bug-hunt-tint`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  // Result lines (success/error) and the hover of a pickable line (game.bug-hunt.tint-hover).
  const BACKGROUNDS = ['status-success-bg', 'status-error-bg', 'game-bug-hunt-tint-hover'];
  it('keeps AA on the result line and hover backgrounds too', () => {
    for (const v of Object.values(SHIKI_VARS) as string[]) {
      const name = /^var\(--color-([a-z0-9-]+)\)$/.exec(v)?.[1] as string;
      if (name === 'surface-sunken') continue;
      for (const bg of BACKGROUNDS) {
        expect(ratio(name, bg), `${name}/${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  const TEXT: [string, string][] = [
    ['text-dim', 'surface-sunken'],
    ['game-bug-hunt', 'game-bug-hunt-tint-strong'],
    ['text-muted', 'toolbar'],
    ['text-dim', 'toolbar'],
    ['game-bug-hunt', 'game-bug-hunt-tint'],
    ['status-success', 'status-success-bg'],
    ['status-error', 'status-error-bg'],
    ['status-success', 'status-error-bg'],
    ['text', 'status-error-bg'],
    ['text-body', 'surface'],
    ['text-dim', 'surface'],
    ['text-muted', 'surface'],
    ['text', 'surface-inset'],
    ['status-success', 'surface-inset'],
    ['status-error-diff-text', 'status-error-bg'],
    ['status-success-diff-text', 'status-success-bg'],
    ['text', 'game-bug-hunt-tint-hover'],
    ['streak-label', 'streak-surface'],
    ['text', 'streak-surface'],
    ['game-bug-hunt', 'surface-sunken'],
    ['game-bug-hunt-on', 'game-bug-hunt'],
    ['game-bug-hunt', 'surface'],
    ['status-error-soft', 'surface'],
    ['text-body', 'game-bug-hunt-tint-strong'],
  ];
  it.each(TEXT)('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(colors.has(fg) && colors.has(bg), `${fg}/${bg} defined`).toBe(true);
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  const UI: [string, string][] = [
    ['game-bug-hunt', 'surface'],
    ['status-error', 'surface'],
  ];
  it.each(UI)('UI boundary %s on %s is at least 3:1', (fg, bg) => {
    expect(colors.has(fg) && colors.has(bg), `${fg}/${bg} defined`).toBe(true);
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
