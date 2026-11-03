/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

describe('@nerdose/ui package manifest', () => {
  it('declares the package contract (TS-1)', () => {
    const pkg = read('package.json') as {
      name: string;
      private: boolean;
      type: string;
      exports: unknown;
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
    };
    expect(pkg.name).toBe('@nerdose/ui');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.exports).toEqual({ '.': './src/index.ts', './tokens.css': './src/tokens.css' });
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.dependencies.clsx).toBeDefined();
    expect(pkg.dependencies['tailwind-merge']).toBeDefined();
  });

  it('extends the base tsconfig (TS-2)', () => {
    expect(read('tsconfig.json')).toEqual({
      extends: '../../tsconfig.base.json',
      include: ['src', 'test'],
    });
  });
});
