/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = fileURLToPath(new URL('../src', import.meta.url));

const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && !f.endsWith('test-fixtures.ts'))
  .map((f) => ({ file: f, text: readFileSync(join(srcDir, f), 'utf8') }));

const importsOf = (text: string): string[] =>
  [...text.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1] as string);

describe('game-devdle entry boundaries (TS-3)', () => {
  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(['definition', 'generator'])('%s only imports allowed packages', (entry) => {
    for (const { file, text } of files.filter((f) => f.file.startsWith(`${entry}/`))) {
      for (const spec of importsOf(text)) {
        if (spec.startsWith('.')) {
          const resolved = join('src', entry, file.slice(entry.length + 1), '..', spec);
          const normalized = resolved.replace(/\\/g, '/');
          const okDefinition = normalized.startsWith('src/definition');
          const okGenerator = entry === 'generator' && normalized.startsWith('src/generator');
          if (entry === 'definition') expect(okDefinition, `${file} -> ${spec}`).toBe(true);
          else expect(okGenerator || okDefinition, `${file} -> ${spec}`).toBe(true);
        } else {
          expect(['@nerdose/core', 'zod'], `${file} -> ${spec}`).toContain(spec);
        }
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
