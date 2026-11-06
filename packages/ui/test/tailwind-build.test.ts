// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { compile } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

import { tokensRaw } from './parse-theme';

const req = createRequire(import.meta.url);
const twCss = readFileSync(req.resolve('tailwindcss/index.css'), 'utf8');
const dir = fileURLToPath(new URL('../src', import.meta.url));

const CANDIDATES = [
  'text-display-hero',
  'font-mono',
  'motion-safe:animate-blink',
  'texture-dots',
  'max-w-page',
  'rounded-control',
  'shadow-next-devdle',
  'bg-game-grep-grid-tint',
  'w-6/13',
  'w-2/7',
  'w-7/12',
];

describe('tokens.css compiled by Tailwind (TS-9)', () => {
  it('generates the utilities the components rely on', async () => {
    const compiler = await compile(`@import "tailwindcss";\n${tokensRaw}`, {
      base: dir,
      loadStylesheet: async (_id, base) => ({
        content: twCss,
        base,
        path: 'tailwindcss/index.css',
      }),
    });
    const css = compiler.build(CANDIDATES);
    const flat = css.replace(/\s+/g, ' ');

    expect(flat).toMatch(/\.text-display-hero \{[^}]*font-size: var\(--text-display-hero\)/);
    expect(flat).toContain('--text-display-hero--line-height');
    expect(flat).toContain('--text-display-hero--letter-spacing');
    expect(flat).toContain('--text-display-hero--font-weight');
    expect(flat).toMatch(
      /\.font-mono \{[^}]*font-feature-settings: var\(--font-mono--font-feature-settings\)/,
    );
    expect(flat).toMatch(
      /@media \(prefers-reduced-motion: no-preference\) \{ \.motion-safe\\:animate-blink/,
    );
    expect(flat).toContain('@keyframes blink');
    expect(flat).toMatch(/\.texture-dots \{/);
    expect(flat).toMatch(/\.max-w-page \{ max-width: var\(--container-page\)/);
    expect(flat).toMatch(/\.rounded-control \{ border-radius: var\(--radius-control\)/);
    expect(flat).toContain('.shadow-next-devdle');
    expect(flat).toContain('.bg-game-grep-grid-tint');
    expect(flat).toContain('.w-6\\/13');
    expect(flat).toContain('.w-2\\/7');
  });
});
