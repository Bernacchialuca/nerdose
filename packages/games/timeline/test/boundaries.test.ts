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

const ALLOWED: Record<string, { dirs: string[]; externals: string[] }> = {
  shared: { dirs: ['src/shared'], externals: ['@nerdose/core'] },
  definition: { dirs: ['src/definition', 'src/shared'], externals: ['@nerdose/core', 'zod'] },
  generator: {
    dirs: ['src/generator', 'src/definition', 'src/shared'],
    externals: ['@nerdose/core', 'zod'],
  },
  client: {
    dirs: ['src/client', 'src/definition/schemas', 'src/shared/format-date'],
    externals: [
      '@nerdose/core',
      '@nerdose/ui',
      'zod',
      'react',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
  },
};

describe('game-timeline entry boundaries (TS-2)', () => {
  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(Object.keys(ALLOWED))('%s only imports allowed modules', (entry) => {
    const rules = ALLOWED[entry] as { dirs: string[]; externals: string[] };
    for (const { file, text } of files.filter((f) => f.file.startsWith(`${entry}/`))) {
      for (const spec of importsOf(text)) {
        if (spec.startsWith('.')) {
          const normalized = resolveRelative(file, spec);
          expect(
            rules.dirs.some((p) => normalized.startsWith(p)),
            `${file} -> ${spec}`,
          ).toBe(true);
        } else {
          expect(rules.externals, `${file} -> ${spec}`).toContain(spec);
        }
      }
    }
  });

  it('client contains no storage, analytics, game imports nor impure calls (TS-2)', () => {
    const clientFiles = files.filter((f) => f.file.startsWith('client/'));
    expect(clientFiles.length).toBeGreaterThan(0);
    for (const { file, text } of clientFiles) {
      for (const forbidden of [
        'localStorage',
        'sessionStorage',
        'window.plausible',
        '@nerdose/game-',
      ]) {
        expect(text.includes(forbidden), `${file} contains ${forbidden}`).toBe(false);
      }
    }
  });

  it('no entry imports the client', () => {
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
