import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  findEnvExampleViolations,
  findJsSourceFiles,
  isIgnored,
  listRepoFiles,
  REPO_ROOT,
} from './helpers/repo';

describe('.gitignore', () => {
  it.each([
    '.env',
    '.env.local',
    '.env.test',
    'apps/api/.env.local',
    'apps/generator/.env.test',
    'packages/db/.env.local',
  ])('ignores %s', (path) => {
    expect(isIgnored(path)).toBe(true);
  });

  it.each(['.env.example', 'apps/api/.env.example'])('does not ignore %s', (path) => {
    expect(isIgnored(path)).toBe(false);
  });

  it.each([
    'node_modules/some-package/package.json',
    'packages/core/node_modules/x',
    'apps/web/dist/index.html',
    '.turbo/cache/x',
    'apps/api/.turbo/x',
  ])('ignores dependencies, build output and cache: %s', (path) => {
    expect(isIgnored(path)).toBe(true);
  });
});

describe('versioned files', () => {
  const files = listRepoFiles();

  it('contains no environment files', () => {
    const envFiles = files.filter((file) =>
      ['.env', '.env.local', '.env.test'].includes(basename(file)),
    );
    expect(envFiles).toEqual([]);
  });

  it('keeps every .env.example free of values', () => {
    const examples = files.filter((file) => basename(file) === '.env.example');
    for (const example of examples) {
      const content = readFileSync(join(REPO_ROOT, example), 'utf8');
      expect(findEnvExampleViolations(content), example).toEqual([]);
    }
  });

  it('has no JavaScript source in apps/ or packages/', () => {
    expect(findJsSourceFiles(files)).toEqual([]);
  });
});

describe('findEnvExampleViolations', () => {
  it('reports a line that carries a value', () => {
    expect(findEnvExampleViolations('# comment\nPOSTGRES_PASSWORD=secret\n')).toEqual([
      'POSTGRES_PASSWORD=secret',
    ]);
  });

  it('accepts comments and empty values', () => {
    expect(
      findEnvExampleViolations('# Password of the local owner role\nPOSTGRES_PASSWORD=\n'),
    ).toEqual([]);
  });
});

describe('findJsSourceFiles', () => {
  it('reports source files and allows tool configuration', () => {
    expect(
      findJsSourceFiles([
        'packages/core/src/index.js',
        'apps/web/vite.config.js',
        'eslint.config.js',
      ]),
    ).toEqual(['packages/core/src/index.js']);
  });
});
