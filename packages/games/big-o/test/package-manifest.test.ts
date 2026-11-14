/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

describe('@nerdose/game-big-o package manifest', () => {
  it('declares the package contract (TS-1)', () => {
    const pkg = read('package.json') as Record<string, unknown>;
    expect(pkg.name).toBe('@nerdose/game-big-o');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.exports).toEqual({
      './definition': './src/definition/index.ts',
      './generator': './src/generator/index.ts',
    });
    expect(pkg.scripts).toEqual({
      lint: 'eslint .',
      typecheck: 'tsc --noEmit',
      test: 'vitest run',
    });
    expect(pkg.dependencies).toEqual({
      '@nerdose/core': 'workspace:*',
      '@nerdose/polyglot': 'workspace:*',
      zod: '^4.6.7',
    });
    expect(pkg.peerDependencies).toBeUndefined();
    expect(pkg.devDependencies).toBeUndefined();
  });

  it('extends the base tsconfig and includes the code folders', () => {
    const tsconfig = read('tsconfig.json') as { extends: string; include: string[] };
    expect(tsconfig.extends).toBe('../../../tsconfig.base.json');
    expect(tsconfig.include).toEqual(expect.arrayContaining(['src', 'test']));
  });
});
