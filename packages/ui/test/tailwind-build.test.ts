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
  'bg-game-grep-grid-selected-bg',
  'bg-game-grep-grid-found-bg',
  'text-numeric-lg',
  'w-6/13',
  'w-2/7',
  'w-7/12',
  'text-title-game',
  'text-game-tile-lg',
  'text-game-key',
  'text-brand-crumb',
  'border-status-present',
  'bg-status-absent-bg',
  'text-status-absent-text',
  'text-text-separator',
  'max-w-keyboard',
  'max-w-devdle-aside',
  'bg-status-success-row-bg',
  'bg-status-misplaced-bg',
  'border-status-misplaced-border',
  'text-display-score',
  'text-numeric-year',
  'text-game-item',
  'rounded-t-panel',
  'sm:rounded-panel',
  'sm:max-w-xl',
  'sm:items-center',
  'items-end',
  'border-b-0',
  'sm:border-b',
  'pt-12',
  'sm:pt-0',
  'sm:px-4',
  'bg-heatmap-0',
  'bg-heatmap-1',
  'bg-heatmap-2',
  'bg-heatmap-3',
  'bg-heatmap-4',
  'rounded-micro',
  'ring-border-interactive',
  'size-3.5',
  'w-max',
];

const PREVIEW_CANDIDATES = [
  'bg-game-devdle',
  'text-game-devdle-on',
  'border-game-devdle',
  'text-game-devdle',
  'bg-game-grep-grid',
  'text-game-grep-grid-on',
  'border-game-grep-grid',
  'border-game-grep-grid-featured',
  'text-game-grep-grid-light',
  'text-game-grep-grid',
  'bg-game-grep-grid-found-bg',
  'bg-game-timeline',
  'bg-game-timeline-rail',
  'text-game-timeline',
  'rounded-tile',
  'rounded-control',
  'rounded-panel',
  'rounded-feature',
  'text-label-comment',
  'text-title-panel',
  'text-mono-unit-compact',
  'text-mono-body',
  'text-meta',
  'text-caption',
  'text-body-sm',
  'text-numeric-year',
  'text-game-item',
  'bg-surface-sunken',
  'bg-surface-inset',
  'text-text-lede',
  'text-text-body',
  'text-text-dim',
  'max-w-163.5',
  'font-extrabold',
];

async function compileTokens() {
  return compile(`@import "tailwindcss";\n${tokensRaw}`, {
    base: dir,
    loadStylesheet: async (_id, base) => ({
      content: twCss,
      base,
      path: 'tailwindcss/index.css',
    }),
  });
}

describe('tokens.css compiled by Tailwind (TS-9)', () => {
  it('generates the utilities the components rely on', async () => {
    const compiler = await compileTokens();
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
    expect(flat).toMatch(/\.text-title-game \{[^}]*font-size: var\(--text-title-game\)/);
    expect(flat).toContain('--text-title-game--letter-spacing');
    expect(flat).toContain('.border-status-present');
    expect(flat).toContain('.bg-status-absent-bg');
    expect(flat).toContain('.text-status-absent-text');
    expect(flat).toContain('.text-text-separator');
    expect(flat).toMatch(/\.max-w-keyboard \{ max-width: var\(--container-keyboard\)/);
    expect(flat).toContain('.max-w-devdle-aside');
    expect(flat).toContain(
      '.bg-game-grep-grid-selected-bg { background-color: var(--color-game-grep-grid-selected-bg)',
    );
    expect(flat).toContain(
      '.bg-game-grep-grid-found-bg { background-color: var(--color-game-grep-grid-found-bg)',
    );
    expect(flat).toMatch(/\.text-numeric-lg \{[^}]*font-size: var\(--text-numeric-lg\)/);
    expect(flat).toContain('--text-numeric-lg--font-weight');
    expect(flat).toContain(
      '.bg-status-success-row-bg { background-color: var(--color-status-success-row-bg)',
    );
    expect(flat).toContain(
      '.bg-status-misplaced-bg { background-color: var(--color-status-misplaced-bg)',
    );
    expect(flat).toContain(
      '.border-status-misplaced-border { border-color: var(--color-status-misplaced-border)',
    );
    expect(flat).toMatch(/\.text-display-score \{[^}]*font-size: var\(--text-display-score\)/);
    expect(flat).toMatch(/\.text-numeric-year \{[^}]*font-size: var\(--text-numeric-year\)/);
    expect(flat).toMatch(/\.text-game-item \{[^}]*font-size: var\(--text-game-item\)/);
    expect(flat).toContain('--text-display-score--letter-spacing');
    expect(flat).toContain('--text-display-score--line-height');
    expect(flat).toMatch(
      /\.rounded-t-panel \{[^}]*border-top-left-radius: var\(--radius-panel\)[^}]*border-top-right-radius: var\(--radius-panel\)/,
    );
    for (const cls of ['sm\\\\:rounded-panel', 'sm\\\\:max-w-xl', 'sm\\\\:items-center']) {
      expect(flat).toMatch(new RegExp(`@media \\(width >= 40rem\\) \\{[^@]*\\.${cls} \\{`));
    }
  });

  it('generates the utilities the solution previews rely on (S-038 TS-5)', async () => {
    const flat = (await compileTokens()).build(PREVIEW_CANDIDATES).replace(/\s+/g, ' ');

    for (const expected of [
      '.bg-game-devdle { background-color: var(--color-game-devdle)',
      '.text-game-devdle-on { color: var(--color-game-devdle-on)',
      '.border-game-devdle { border-color: var(--color-game-devdle)',
      '.text-game-grep-grid-on { color: var(--color-game-grep-grid-on)',
      '.border-game-grep-grid-featured { border-color: var(--color-game-grep-grid-featured)',
      '.bg-game-grep-grid-found-bg { background-color: var(--color-game-grep-grid-found-bg)',
      '.bg-game-timeline-rail { background-color: var(--color-game-timeline-rail)',
      '.bg-surface-sunken { background-color: var(--color-surface-sunken)',
      '.text-text-lede { color: var(--color-text-lede)',
      '.rounded-tile { border-radius: var(--radius-tile)',
      '.rounded-panel { border-radius: var(--radius-panel)',
      '.rounded-feature { border-radius: var(--radius-feature)',
      '.max-w-163\\.5 { max-width: calc(var(--spacing) * 163.5)',
    ]) {
      expect(flat).toContain(expected);
    }
    for (const role of [
      'label-comment',
      'title-panel',
      'mono-unit-compact',
      'body-sm',
      'caption',
    ]) {
      expect(flat).toMatch(
        new RegExp(`\\.text-${role} \\{[^}]*font-size: var\\(--text-${role}\\)`),
      );
    }
    expect(flat).toMatch(/\.font-extrabold \{[^}]*font-weight: var\(--font-weight-extrabold\)/);
  });
});
