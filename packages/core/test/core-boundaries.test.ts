/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const srcDir = new URL('../src/', import.meta.url);

describe('core boundaries', () => {
  it('does not import services, apps or game packages (TS-7)', () => {
    const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' }).filter((f) =>
      f.endsWith('.ts'),
    );
    expect(files.length).toBeGreaterThan(0);
    const forbidden =
      /from\s+['"](@nerdose\/(api|generator|web|admin|db)|@nerdose\/game-|[^'"]*apps\/)/;
    const imports = new Set<string>();
    for (const file of files) {
      const text = readFileSync(new URL(file, srcDir), 'utf8');
      expect(text, file).not.toMatch(forbidden);
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const spec = m[1] as string;
        if (!spec.startsWith('.')) imports.add(spec);
      }
    }
    for (const spec of imports) {
      expect(spec === 'zod' || spec.startsWith('pure-rand/'), spec).toBe(true);
    }
  });
});
