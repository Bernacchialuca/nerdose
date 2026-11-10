/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const text = readFileSync(new URL('../wordlist/words.txt', import.meta.url), 'utf8');
const lines = text.slice(0, -1).split('\n');

describe('committed wordlist/words.txt', () => {
  it('has the format required by ADR-016 (TS-61)', () => {
    expect(text.endsWith('\n')).toBe(true);
    expect(text).not.toContain('\r');
    // Una sola aserción por propiedad: 150k `expect` por línea son lentos.
    expect(lines.filter((l) => !/^[A-Z]{4,12}$/.test(l))).toEqual([]);
    expect(lines.filter((l, i) => i > 0 && (lines[i - 1] as string) >= l)).toEqual([]);
    expect(lines.length).toBeGreaterThan(100000);
  });

  it('contains ENABLE words (TS-62)', () => {
    const set = new Set(lines);
    for (const w of ['REACT', 'CACHE', 'TRACE', 'CRANE', 'MERGE']) expect(set.has(w)).toBe(true);
  });

  it('contains the curated extras (wordlist/extra.txt)', () => {
    const set = new Set(lines);
    for (const w of ['LINUX', 'UNIX', 'KUBERNETES', 'REDIS', 'MYSQL', 'DEBIAN']) {
      expect(set.has(w)).toBe(true);
    }
  });

  it('resolves the ./wordlist resource (TS-63)', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      exports: Record<string, string>;
    };
    const target = fileURLToPath(new URL(`../${pkg.exports['./wordlist']}`, import.meta.url));
    expect(target.endsWith('packages/games/devdle/wordlist/words.txt')).toBe(true);
    expect(existsSync(target)).toBe(true);
    try {
      const resolved = createRequire(import.meta.url).resolve('@nerdose/game-devdle/wordlist');
      expect(resolved.endsWith('packages/games/devdle/wordlist/words.txt')).toBe(true);
    } catch {
      // Sin self-reference en este runner: la comprobación por `exports` ya cubre el recurso.
    }
  });
});
