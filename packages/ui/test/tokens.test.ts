// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const raw = readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf8');
const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');
const block = /@theme\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
const declarations = Object.fromEntries(
  [...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value?.trim()]),
);

describe('tokens.css', () => {
  it('declares the tokens the story requires (TS-3)', () => {
    expect(declarations['--color-bg']).toBe('#0A0C0F');
    expect(declarations['--color-accent']).toBe('#3DDC84');
    expect(declarations['--font-mono']).toBe("'JetBrains Mono', ui-monospace, monospace");
  });

  it('declares the warning token of the design system (TS-3)', () => {
    expect(declarations['--color-warning']).toBe('#FFB547');
  });

  it('declares the full prototype token set (TS-4)', () => {
    expect(declarations).toEqual({
      '--font-mono': "'JetBrains Mono', ui-monospace, monospace",
      '--color-bg': '#0A0C0F',
      '--color-surface': '#0F1318',
      '--color-surface-2': '#11151A',
      '--color-surface-3': '#141920',
      '--color-border': '#222A33',
      '--color-border-strong': '#2A323C',
      '--color-border-subtle': '#1E252E',
      '--color-text': '#E6EDF3',
      '--color-text-muted': '#9AA6B2',
      '--color-text-dim': '#8D99A6',
      '--color-accent': '#3DDC84',
      '--color-on-accent': '#06120B',
      '--color-game-devdle': '#3DDC84',
      '--color-game-bug-hunt': '#FFB547',
      '--color-game-big-o': '#5EB1FF',
      '--color-game-timeline': '#C39BFF',
      '--color-game-grep-grid': '#F472B6',
      '--color-warning': '#FFB547',
    });
  });

  it('has a single @theme block and nothing outside it (TS-5)', () => {
    expect(css.match(/@theme\s*\{/g)).toHaveLength(1);
    const outside = css.replace(/@theme\s*\{[^}]*\}/, '').replace('@source "./components";', '');
    expect(outside.trim()).toBe('');
  });

  it('scans the components for utility classes (TS-6)', () => {
    expect(raw.split('@source "./components";')).toHaveLength(2);
  });

  it('is dark only and loads no external resources (TS-7)', () => {
    for (const forbidden of ['prefers-color-scheme', '.dark', 'dark:', '@import', 'url(', 'http']) {
      expect(raw).not.toContain(forbidden);
    }
  });
});
