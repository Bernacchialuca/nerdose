/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

describe('@nerdose/polyglot package manifest', () => {
  it('declares the package contract (TS-1)', () => {
    const pkg = read('package.json') as Record<string, unknown>;
    expect(pkg.name).toBe('@nerdose/polyglot');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.exports).toEqual({ '.': './src/index.ts' });
    expect(pkg.scripts).toEqual({
      lint: 'eslint .',
      typecheck: 'tsc --noEmit',
      test: 'vitest run',
    });
    expect(pkg.dependencies).toBeUndefined();
  });

  it('extends the base tsconfig (TS-1)', () => {
    expect(read('tsconfig.json')).toEqual({
      extends: '../../tsconfig.base.json',
      compilerOptions: { types: ['node'] },
      include: ['src', 'test', 'vitest.config.ts'],
    });
  });
});
