/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

describe('@nerdose/game-timeline package manifest', () => {
  it('declares the package contract (TS-1)', () => {
    const pkg = read('package.json') as {
      name: string;
      private: boolean;
      type: string;
      exports: unknown;
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.name).toBe('@nerdose/game-timeline');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.exports).toEqual({
      './definition': './src/definition/index.ts',
      './client': './src/client/index.ts',
      './generator': './src/generator/index.ts',
    });
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.dependencies['@nerdose/core']).toBe('workspace:*');
    expect(pkg.dependencies.zod).toBe('^4.6.7');
    expect(pkg.devDependencies['@nerdose/content']).toBe('workspace:*');
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(all.react).toBeUndefined();
    expect(all['@nerdose/ui']).toBeUndefined();
    expect(Object.keys(all).some((k) => k.startsWith('@dnd-kit/'))).toBe(false);
  });

  it('extends the base tsconfig and includes the code folders', () => {
    const tsconfig = read('tsconfig.json') as { extends: string; include: string[] };
    expect(tsconfig.extends).toBe('../../../tsconfig.base.json');
    expect(tsconfig.include).toEqual(expect.arrayContaining(['src', 'test']));
  });
});
