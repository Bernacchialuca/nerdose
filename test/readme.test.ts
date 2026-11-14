import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { isIgnored, listRepoFiles, REPO_ROOT } from './helpers/repo';

const readme = (): string => readFileSync(join(REPO_ROOT, 'README.md'), 'utf8');

const section = (text: string, heading: string): string => {
  const start = text.indexOf(`\n## ${heading}\n`);
  if (start === -1) throw new Error(`README has no "## ${heading}" section`);
  const end = text.indexOf('\n## ', start + 1);
  return text.slice(start, end === -1 ? undefined : end);
};

describe('README.md', () => {
  it('exists and is versionable', () => {
    expect(listRepoFiles()).toContain('README.md');
    expect(isIgnored('README.md')).toBe(false);
  });

  it('documents the start-up order', () => {
    const text = readme();
    const up = text.indexOf('docker compose up -d');
    const migrate = text.indexOf('pnpm --filter @nerdose/db db:migrate');
    const dev = text.indexOf('pnpm dev', migrate);
    expect(up).toBeGreaterThanOrEqual(0);
    expect(migrate).toBeGreaterThan(up);
    expect(dev).toBeGreaterThan(migrate);
  });

  it('documents copying every versioned .env.example', () => {
    const text = readme();
    const examples = listRepoFiles().filter((file) => basename(file) === '.env.example');
    expect(examples.length).toBeGreaterThan(0);
    for (const file of examples) {
      const dir = dirname(file);
      const command =
        dir === '.' ? 'cp .env.example .env' : `cp ${dir}/.env.example ${dir}/.env.local`;
      expect(text, command).toContain(command);
    }
  });

  it('names the database roles and their URL variables', () => {
    const text = readme();
    for (const name of [
      'nerdose_api',
      'nerdose_generator',
      'nerdose_owner',
      'DATABASE_URL_API',
      'DATABASE_URL_GENERATOR',
    ]) {
      expect(text, name).toContain(name);
    }
  });

  it('documents the ports', () => {
    const text = readme();
    for (const port of ['3000', '5173', '5174']) {
      expect(text, port).toContain(port);
    }
  });

  it('documents the health check through each origin', () => {
    const text = readme();
    expect(text).toContain('http://localhost:5173/api/health');
    expect(text).toContain('http://localhost:5174/api/admin/health');
  });

  it('contains no literal database passwords', () => {
    const urls = readme().match(/postgres:\/\/[^\s`'"]+/g) ?? [];
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/^postgres:\/\/[a-z_]+:<[^>]+>@/);
    }
  });

  it('documents the explicit reset', () => {
    expect(readme()).toContain('docker compose down -v');
  });

  it('uses no package manager other than pnpm', () => {
    const text = readme();
    expect(text).not.toMatch(/(?<![\w-])npm install/);
    expect(text).not.toMatch(/(?<![\w-])yarn /);
    expect(text).not.toMatch(/(?<![\w-])bun /);
  });

  it('has exactly one Requisitos section', () => {
    expect(readme().match(/^## Requisitos$/gm)).toHaveLength(1);
  });

  it('keeps the section the polyglot toolchain errors point to', () => {
    const helper = readFileSync(
      join(REPO_ROOT, 'packages/polyglot/test/integration/toolchains.ts'),
      'utf8',
    );
    const match = /README "([^"]+)"/.exec(helper);
    expect(match, 'README hint in polyglot toolchains helper').not.toBeNull();
    expect(readme()).toMatch(new RegExp(`^## ${match?.[1]}$`, 'm'));
  });

  it('documents the Go and JDK toolchains in Requisitos', () => {
    const text = section(readme(), 'Requisitos');
    for (const literal of [
      'Node.js 24',
      'Go >= 1.25',
      'JDK 21',
      'go version',
      'java -version',
      'PATH',
    ]) {
      expect(text, literal).toContain(literal);
    }
  });

  it('explains the toolchain errors of the integration tests', () => {
    const text = section(readme(), 'Requisitos');
    expect(text).toContain('Missing toolchain');
    expect(text).toContain('Wrong toolchain version');
  });

  it('documents the non-root rule of the runner', () => {
    const text = section(readme(), 'Requisitos');
    for (const literal of ['RUNNER_UID', 'RUNNER_GID', 'runner_requires_non_root']) {
      expect(text, literal).toContain(literal);
    }
  });

  it('documents how to check the toolchains without the turbo cache', () => {
    expect(section(readme(), 'Requisitos')).toContain('pnpm --filter @nerdose/polyglot test');
  });

  it('keeps start-up commands out of Requisitos', () => {
    const text = section(readme(), 'Requisitos');
    expect(text).not.toContain('docker compose up -d');
    expect(text).not.toContain('pnpm --filter @nerdose/db db:migrate');
  });

  it('lists polyglot in the packages tree', () => {
    const text = readme();
    expect(text).toMatch(/^(├|└)── polyglot\/\s+# \S/m);
    expect(text.split('\n').find((line) => line.includes('packages/{'))).toContain(
      'packages/{core,db,ui,polyglot}',
    );
  });

  it('warns that pnpm test needs the toolchains', () => {
    const line = readme()
      .split('\n')
      .find((l) => l.startsWith('- `pnpm test`'));
    expect(line).toContain('Docker');
    expect(line).toContain('Requisitos');
  });

  it('covers a missing toolchain in common problems', () => {
    const text = readme();
    const start = text.indexOf('## Problemas comunes');
    const end = text.indexOf('Hosting, CI/CD y despliegue: fuera de alcance por ahora.');
    expect(start).toBeGreaterThanOrEqual(0);
    expect(text.slice(start, end)).toContain('Missing toolchain');
  });
});
