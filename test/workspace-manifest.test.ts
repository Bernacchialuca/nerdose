import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { listRepoFiles, REPO_ROOT } from './helpers/repo';

const readText = (file: string): string => readFileSync(join(REPO_ROOT, file), 'utf8');
const readJson = (file: string): Record<string, unknown> =>
  JSON.parse(readText(file)) as Record<string, unknown>;

describe('pnpm-workspace.yaml', () => {
  it('declares exactly the apps, packages and games globs', () => {
    const entries = [...readText('pnpm-workspace.yaml').matchAll(/^\s*-\s*'([^']+)'/gm)].map(
      (m) => m[1],
    );
    expect(entries).toEqual(['apps/*', 'packages/*', 'packages/games/*']);
  });
});

describe('package.json', () => {
  const pkg = readJson('package.json') as {
    private: boolean;
    engines: { node: string };
    packageManager: string;
    scripts: Record<string, string>;
  };

  it('is private, pins node and pnpm, and delegates scripts to turbo', () => {
    expect(pkg.private).toBe(true);
    expect(pkg.engines.node).toBe('>=24 <25');
    expect(pkg.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+/);
    expect(pkg.scripts['dev']).toBe('turbo run dev');
    expect(pkg.scripts['build']).toBe('turbo run build');
    for (const task of ['lint', 'typecheck', 'test']) {
      expect(pkg.scripts[task]).toMatch(/^turbo run /);
    }
  });
});

describe('lockfiles', () => {
  it('uses only pnpm', () => {
    const files = listRepoFiles();
    expect(files).toContain('pnpm-lock.yaml');
    for (const forbidden of ['package-lock.json', 'yarn.lock', 'bun.lockb', 'bun.lock']) {
      expect(files).not.toContain(forbidden);
    }
  });
});

describe('turbo.json', () => {
  const turbo = readJson('turbo.json') as { tasks: Record<string, Record<string, unknown>> };

  it('defines the build and dev tasks', () => {
    expect(turbo.tasks['build']).toEqual({ dependsOn: ['^build'], outputs: ['dist/**'] });
    expect(turbo.tasks['dev']).toEqual({ persistent: true, cache: false });
  });

  it('defines lint, typecheck and test with their dependencies', () => {
    expect(turbo.tasks['lint']).toBeDefined();
    expect(turbo.tasks['typecheck']?.['dependsOn']).toEqual(['^typecheck']);
    expect(turbo.tasks['test']?.['dependsOn']).toEqual(['^test']);
  });

  it('defines the root workspace tasks', () => {
    for (const task of ['//#lint:workspace', '//#typecheck:workspace', '//#test:workspace']) {
      expect(turbo.tasks[task]).toBeDefined();
    }
  });
});

describe('tsconfig.base.json', () => {
  it('is the strict base', () => {
    expect(readJson('tsconfig.base.json')['compilerOptions']).toEqual({
      strict: true,
      noUncheckedIndexedAccess: true,
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      verbatimModuleSyntax: true,
      skipLibCheck: true,
      noEmit: true,
    });
  });
});
