/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = fileURLToPath(new URL('../src', import.meta.url));

const isSource = (f: string) =>
  /\.tsx?$/.test(f) &&
  !/\.test\.tsx?$/.test(f) &&
  !f.endsWith('test-fixtures.ts') &&
  !f.endsWith('test-utils.ts');

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

  it('client only imports allowed modules and packages (TS-3)', () => {
    const clientFiles = files.filter((f) => f.file.startsWith('client/'));
    expect(clientFiles.length).toBeGreaterThan(0);
    for (const { file, text } of clientFiles) {
      for (const spec of importsOf(text)) {
        if (spec.startsWith('.')) {
          const normalized = resolveRelative(file, spec);
          const ok =
            normalized.startsWith('src/client') ||
            normalized === 'src/shared/geometry' ||
            normalized === 'src/definition/schemas';
          expect(ok, `${file} -> ${spec}`).toBe(true);
        } else {
          expect(['@nerdose/core', '@nerdose/ui', 'zod', 'react'], `${file} -> ${spec}`).toContain(
            spec,
          );
        }
      }
      for (const forbidden of [
        'window.plausible',
        '@nerdose/game-',
        'localStorage',
        'sessionStorage',
        'lineCells',
        'directionOf',
      ]) {
        expect(text.includes(forbidden), `${file} contains ${forbidden}`).toBe(false);
      }
    }
  });

  it('no other entry imports the client (TS-4)', () => {
    for (const { file, text } of files.filter((f) => !f.file.startsWith('client/'))) {
      for (const spec of importsOf(text)) {
        if (spec.startsWith('.')) {
          expect(resolveRelative(file, spec).startsWith('src/client'), `${file} -> ${spec}`).toBe(
            false,
          );
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
