/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

describe('@nerdose/game-bug-hunt package manifest', () => {
  it('declares the package contract (TS-3)', () => {
    const pkg = read('package.json') as Record<string, unknown>;
    expect(pkg.name).toBe('@nerdose/game-bug-hunt');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.exports).toEqual({
      './definition': './src/definition/index.ts',
      './client': './src/client/index.ts',
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
      '@nerdose/ui': 'workspace:*',
      shiki: '^4.6.0',
      zod: '^4.6.7',
    });
    expect(pkg.peerDependencies).toEqual({ react: '^19.3.1' });
    expect(pkg.devDependencies).toEqual({
      '@testing-library/jest-dom': '^7.0.1',
      '@testing-library/react': '^16.3.3',
      '@testing-library/user-event': '^14.6.8',
      '@types/react': '^19.3.0',
      '@types/react-dom': '^19.3.0',
      jsdom: '^30.1.3',
      react: '^19.3.1',
      'react-dom': '^19.3.1',
      'vitest-axe': '^0.1.0',
    });
    expect((pkg.dependencies as Record<string, string>).react).toBeUndefined();
  });

  it('extends the base tsconfig and includes the code folders', () => {
    const tsconfig = read('tsconfig.json') as {
      extends: string;
      include: string[];
      compilerOptions: { jsx?: string };
    };
    expect(tsconfig.extends).toBe('../../../tsconfig.base.json');
    expect(tsconfig.include).toEqual(expect.arrayContaining(['src', 'test']));
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
  });
});
