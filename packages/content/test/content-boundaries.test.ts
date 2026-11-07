/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const srcDir = new URL('../src/', import.meta.url);

describe('content runtime boundaries', () => {
  it('has no network access nor imports from scripts (TS-33)', () => {
    const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' }).filter((f) =>
      f.endsWith('.ts'),
    );
    expect(files.length).toBeGreaterThan(0);
    const allowed = new Set(['node:fs', 'node:path', 'node:url', 'zod', '@nerdose/core']);
    for (const file of files) {
      const text = readFileSync(new URL(file, srcDir), 'utf8');
      expect(text, file).not.toMatch(/scripts\//);
      expect(text, file).not.toMatch(/\bfetch\(/);
      expect(text, file).not.toMatch(/wikidata\.org|wikipedia\.org|wiktionary\.org/);
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const spec = m[1] as string;
        if (!spec.startsWith('.')) expect(allowed.has(spec), `${file}: ${spec}`).toBe(true);
      }
    }
  });
});
