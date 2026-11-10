/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = fileURLToPath(new URL('../src', import.meta.url));

const isSource = (f: string) =>
  /\.ts$/.test(f) && !/\.test\.ts$/.test(f) && !f.endsWith('test-fixtures.ts');

const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
  .map((f) => f.replace(/\\/g, '/'))
  .filter(isSource)
  .map((f) => ({ file: f, text: readFileSync(join(srcDir, f), 'utf8') }));

const importsOf = (text: string): string[] =>
  [...text.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1] as string);

const resolveRelative = (file: string, spec: string): string =>
  join('src', file, '..', spec).replace(/\\/g, '/');

const ALLOWED: Record<string, string[]> = {
  shared: ['src/shared'],
  definition: ['src/definition', 'src/shared'],
  generator: ['src/generator', 'src/definition', 'src/shared'],
};

describe('game-grep-grid entry boundaries (TS-4)', () => {
  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(Object.keys(ALLOWED))('%s only imports allowed modules', (entry) => {
    for (const { file, text } of files.filter((f) => f.file.startsWith(`${entry}/`))) {
      for (const spec of importsOf(text)) {
        if (spec.startsWith('.')) {
          const normalized = resolveRelative(file, spec);
          const ok = (ALLOWED[entry] ?? []).some((p) => normalized.startsWith(p));
          expect(ok, `${file} -> ${spec}`).toBe(true);
        } else {
          const externals = entry === 'shared' ? [] : ['@nerdose/core', 'zod'];
          expect(externals, `${file} -> ${spec}`).toContain(spec);
        }
      }
    }
  });

  it('src never touches node:, clock, randomness, network', () => {
    for (const { file, text } of files) {
      for (const forbidden of ['node:', 'Math.random(', 'Date.now(', 'new Date()', 'fetch(']) {
        expect(text.includes(forbidden), `${file} contains ${forbidden}`).toBe(false);
      }
    }
  });
});
