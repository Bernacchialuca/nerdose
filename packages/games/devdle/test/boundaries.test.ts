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

describe('game-devdle entry boundaries (TS-3, TS-4)', () => {
  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('shared only imports itself (no packages)', () => {
    for (const { file, text } of files.filter((f) => f.file.startsWith('shared/'))) {
      for (const spec of importsOf(text)) {
        expect(
          spec.startsWith('.') && resolveRelative(file, spec).startsWith('src/shared'),
          `${file} -> ${spec}`,
        ).toBe(true);
      }
    }
  });

  it.each(['definition', 'generator'])('%s only imports allowed packages', (entry) => {
    for (const { file, text } of files.filter((f) => f.file.startsWith(`${entry}/`))) {
      for (const spec of importsOf(text)) {
        if (spec.startsWith('.')) {
          const normalized = resolveRelative(file, spec);
          expect(normalized.startsWith('src/client'), `${file} -> ${spec}`).toBe(false);
          const okDefinition =
            normalized.startsWith('src/definition') || normalized.startsWith('src/shared');
          const okGenerator = entry === 'generator' && normalized.startsWith('src/generator');
          if (entry === 'definition') expect(okDefinition, `${file} -> ${spec}`).toBe(true);
          else expect(okGenerator || okDefinition, `${file} -> ${spec}`).toBe(true);
        } else {
          expect(['@nerdose/core', 'zod'], `${file} -> ${spec}`).toContain(spec);
        }
      }
    }
  });

  it('client only imports allowed packages and the schemas of definition (TS-3)', () => {
    for (const { file, text } of files.filter((f) => f.file.startsWith('client/'))) {
      for (const spec of importsOf(text)) {
        if (spec.startsWith('.')) {
          const normalized = resolveRelative(file, spec);
          const ok = normalized.startsWith('src/client') || normalized === 'src/definition/schemas';
          expect(ok, `${file} -> ${spec}`).toBe(true);
        } else {
          expect(['@nerdose/core', '@nerdose/ui', 'zod', 'react'], `${file} -> ${spec}`).toContain(
            spec,
          );
        }
      }
      for (const forbidden of ['@nerdose/game-']) {
        expect(text.includes(forbidden), `${file} contains ${forbidden}`).toBe(false);
      }
    }
  });

  it('src never touches node:, scripts, clock, randomness, network', () => {
    for (const { file, text } of files) {
      for (const forbidden of [
        'node:',
        'scripts/',
        'Math.random(',
        'Date.now(',
        'new Date()',
        'wikidata.org',
        'fetch(',
      ]) {
        expect(text.includes(forbidden), `${file} contains ${forbidden}`).toBe(false);
      }
    }
  });
});
