import { spawnSync } from 'node:child_process';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

import { REPO_ROOT } from './helpers/repo';

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd: REPO_ROOT });
});

async function lint(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) throw new Error('ESLint returned no result');
  return result.messages;
}

async function boundaryErrors(code: string, filePath: string) {
  return (await lint(code, filePath)).filter((m) => m.ruleId === 'no-restricted-imports');
}

async function expectBoundary(code: string, filePath: string, message?: string) {
  const errors = await boundaryErrors(code, filePath);
  expect(errors.length).toBeGreaterThan(0);
  for (const error of errors) expect(error.severity).toBe(2);
  if (message) expect(errors.some((e) => e.message.includes(message))).toBe(true);
}

async function expectNoBoundary(code: string, filePath: string) {
  expect(await boundaryErrors(code, filePath)).toEqual([]);
}

describe('frontends (web and admin)', () => {
  it('web does not import the db package', async () => {
    await expectBoundary(
      "import { createDb } from '@nerdose/db';\n",
      'apps/web/src/main.ts',
      'Frontends never import the database package.',
    );
  });

  it('admin does not import a db subentry', async () => {
    await expectBoundary(
      "import { createRoles } from '@nerdose/db/testing';\n",
      'apps/admin/src/main.tsx',
      'Frontends never import the database package.',
    );
  });

  it('frontends can import core', async () => {
    await expectNoBoundary(
      "import { createGameRegistry } from '@nerdose/core';\n",
      'apps/web/src/main.ts',
    );
  });

  it('frontends import only the client entry of a game', async () => {
    const path = 'apps/web/src/modules/play/x.ts';
    await expectBoundary(
      "import { devdle } from '@nerdose/game-devdle/definition';\n",
      path,
      'Frontends import only ./client.',
    );
    await expectBoundary(
      "import { devdle } from '@nerdose/game-devdle/generator';\n",
      path,
      'Frontends import only ./client.',
    );
    await expectNoBoundary("import { devdle } from '@nerdose/game-devdle/client';\n", path);
  });
});

describe('apps never import from other apps', () => {
  it('web does not import api (relative)', async () => {
    await expectBoundary(
      "import { buildApp } from '../../api/src/app';\n",
      'apps/web/src/main.ts',
      'Apps never import from other apps.',
    );
  });

  it('admin does not import web (deeper relative)', async () => {
    await expectBoundary(
      "import { App } from '../../../../web/src/app/app';\n",
      'apps/admin/src/app/shell/x.tsx',
      'Apps never import from other apps.',
    );
  });

  it('api does not import generator', async () => {
    await expectBoundary(
      "import { startScheduler } from '../../generator/src/scheduler';\n",
      'apps/api/src/index.ts',
      'Apps never import from other apps.',
    );
  });

  it('generator does not import api', async () => {
    await expectBoundary(
      "import { buildApp } from '../../api/src/app';\n",
      'apps/generator/src/index.ts',
      'Apps never import from other apps.',
    );
  });

  it('does not flag an api/ folder that belongs to a web module', async () => {
    await expectNoBoundary(
      "import { useToday } from '../../api/today';\n",
      'apps/web/src/modules/catalog/routes/today/page.tsx',
    );
  });

  it('reports two boundaries in the same file', async () => {
    const errors = await boundaryErrors(
      "import { createDb } from '@nerdose/db';\nimport { buildApp } from '../../api/src/app';\n",
      'apps/web/src/main.ts',
    );
    expect(errors).toHaveLength(2);
    expect(
      errors.some((e) => e.message.includes('Frontends never import the database package.')),
    ).toBe(true);
    expect(errors.some((e) => e.message.includes('Apps never import from other apps.'))).toBe(true);
  });
});

describe('game entries', () => {
  it('api imports only the definition entry', async () => {
    const path = 'apps/api/src/games/registry.ts';
    for (const source of [
      '@nerdose/game-devdle/client',
      '@nerdose/game-devdle/generator',
      '@nerdose/polyglot',
    ]) {
      await expectBoundary(
        `import { devdle } from '${source}';\n`,
        path,
        'api imports only ./definition.',
      );
    }
    await expectNoBoundary("import { devdle } from '@nerdose/game-devdle/definition';\n", path);
  });

  it('generator does not import the client entry', async () => {
    const path = 'apps/generator/src/jobs/x.ts';
    await expectBoundary(
      "import { devdle } from '@nerdose/game-devdle/client';\n",
      path,
      'generator imports ./generator (and ./definition if needed).',
    );
    await expectNoBoundary("import { devdle } from '@nerdose/game-devdle/generator';\n", path);
    await expectNoBoundary("import { devdle } from '@nerdose/game-devdle/definition';\n", path);
  });

  it('definition and client never import code that executes', async () => {
    await expectBoundary(
      "import { emit } from '@nerdose/polyglot';\n",
      'packages/games/devdle/src/definition/index.ts',
    );
    await expectBoundary(
      "import { spawn } from 'node:child_process';\n",
      'packages/games/devdle/src/client/index.ts',
    );
    await expectBoundary(
      "import { gen } from '@nerdose/game-big-o/generator';\n",
      'packages/games/devdle/src/client/index.ts',
    );
  });

  it('the generator entry of a game can use polyglot', async () => {
    await expectNoBoundary(
      "import { emit } from '@nerdose/polyglot';\n",
      'packages/games/devdle/src/generator/index.ts',
    );
  });
});

describe('core', () => {
  it('the isomorphic entry does not import node:*', async () => {
    await expectBoundary(
      "import { createHmac } from 'node:crypto';\n",
      'packages/core/src/index.ts',
    );
  });
});

describe('ui package', () => {
  it('never imports the database package (TS-15)', async () => {
    await expectBoundary(
      "import { createDb } from '@nerdose/db';\n",
      'packages/ui/src/x.ts',
      'never import the database package',
    );
    await expectBoundary(
      "import { createDb } from '@nerdose/db/testing';\n",
      'packages/ui/src/x.ts',
      'never import the database package',
    );
  });

  it('can import the core entry (TS-17)', async () => {
    await expectNoBoundary(
      "import type { GameId } from '@nerdose/core';\n",
      'packages/ui/src/x.ts',
    );
  });
});

describe('eslint CLI', () => {
  it('exits with 1 on a boundary violation', () => {
    const result = spawnSync(
      'pnpm',
      ['exec', 'eslint', '--stdin', '--stdin-filename', 'apps/web/src/main.ts'],
      {
        cwd: REPO_ROOT,
        input: "import { createDb } from '@nerdose/db';\n",
        encoding: 'utf8',
      },
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('no-restricted-imports');
  });
});

describe('react plugins', () => {
  it('applies the rules of hooks to web', async () => {
    const messages = await lint(
      "import { useState } from 'react';\nexport function A({ on }: { on: boolean }) { if (on) { useState(0); } return null; }\n",
      'apps/web/src/components/a.tsx',
    );
    expect(
      messages.some((m) => m.ruleId === 'react-hooks/rules-of-hooks' && m.severity === 2),
    ).toBe(true);
  });

  it('applies jsx-a11y to admin', async () => {
    const messages = await lint(
      'export function B() { return <img src="/logo.png" />; }\n',
      'apps/admin/src/components/b.tsx',
    );
    expect(messages.some((m) => m.ruleId === 'jsx-a11y/alt-text')).toBe(true);
  });
});
