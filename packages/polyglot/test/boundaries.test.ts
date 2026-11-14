/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const srcDir = new URL('../src/', import.meta.url);

describe('polyglot boundaries', () => {
  it('only imports node built-ins and relative modules, and knows nothing about games (TS-2)', () => {
    const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' }).filter((f) =>
      f.endsWith('.ts'),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(new URL(file, srcDir), 'utf8');
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const spec = m[1] as string;
        expect(spec.startsWith('node:') || spec.startsWith('.'), `${file}: ${spec}`).toBe(true);
      }
      expect(text, file).not.toMatch(/@nerdose\/|big-o|bigO|bug-hunt|recipe/);
    }
  });
});
