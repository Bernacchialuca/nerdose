/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

describe('@nerdose/game-devdle package manifest', () => {
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
    expect(pkg.name).toBe('@nerdose/game-devdle');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.exports).toEqual({
      './definition': './src/definition/index.ts',
      './generator': './src/generator/index.ts',
      './wordlist': './wordlist/words.txt',
    });
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts['build:wordlist']).toBe('tsx scripts/build-wordlist.ts');
    expect(pkg.dependencies['@nerdose/core']).toBe('workspace:*');
    expect(pkg.dependencies.zod).toBe('^4.6.7');
    expect(pkg.devDependencies.tsx).toBeDefined();
    expect(pkg.devDependencies.dotenv).toBeDefined();
  });

  it('extends the base tsconfig and includes the code folders (TS-2)', () => {
    const tsconfig = read('tsconfig.json') as { extends: string; include: string[] };
    expect(tsconfig.extends).toBe('../../../tsconfig.base.json');
    expect(tsconfig.include).toEqual(expect.arrayContaining(['src', 'scripts', 'test']));
  });
});
