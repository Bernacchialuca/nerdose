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

describe('client color pairs (TS-18)', () => {
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
        ratio(name as string, 'game-big-o-tint'),
        `${name}/game-big-o-tint`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  const TEXT: [string, string][] = [
    ['text-dim', 'surface-sunken'],
    ['game-big-o-light', 'game-big-o-tint'],
    ['text', 'game-big-o-border'],
    ['text-muted', 'toolbar'],
    ['text-dim', 'toolbar'],
    ['text-muted', 'surface'],
    ['text', 'game-big-o-tint'],
    ['status-success-on', 'status-success'],
    ['game-big-o-light', 'game-big-o-border'],
    ['text-body', 'surface'],
    ['text-body', 'game-big-o-tint'],
    ['game-big-o-on', 'game-big-o'],
  ];
  it.each(TEXT)('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(colors.has(fg) && colors.has(bg), `${fg}/${bg} defined`).toBe(true);
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  const UI: [string, string][] = [
    ['game-big-o', 'surface'],
    ['status-error', 'surface'],
    ['game-big-o-muted', 'surface'],
  ];
  it.each(UI)('UI boundary %s on %s is at least 3:1', (fg, bg) => {
    expect(colors.has(fg) && colors.has(bg), `${fg}/${bg} defined`).toBe(true);
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
