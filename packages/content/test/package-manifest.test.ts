/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

describe('@nerdose/content package manifest', () => {
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
    expect(pkg.name).toBe('@nerdose/content');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.exports).toEqual({ '.': './src/index.ts' });
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts['import:banks']).toBe('tsx scripts/import-banks.ts');
    expect(pkg.dependencies.zod).toBe('^4.6.7');
    expect(pkg.dependencies['@nerdose/core']).toBe('workspace:*');
    expect(pkg.devDependencies.tsx).toBeDefined();
  });

  it('extends the base tsconfig (TS-1)', () => {
    const tsconfig = read('tsconfig.json') as { extends: string };
    expect(tsconfig.extends).toBe('../../tsconfig.base.json');
  });
});
