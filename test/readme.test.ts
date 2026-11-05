import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { isIgnored, listRepoFiles, REPO_ROOT } from './helpers/repo';

const readme = (): string => readFileSync(join(REPO_ROOT, 'README.md'), 'utf8');

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
});
