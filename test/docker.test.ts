import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from './helpers/repo';

const read = (file: string): string => readFileSync(join(REPO_ROOT, file), 'utf8');

/** Las líneas `FROM ... AS <target>` y lo que sigue hasta el próximo `FROM`. */
const stages = (): Map<string, string> => {
  const text = read('Dockerfile');
  const map = new Map<string, string>();
  for (const block of text.split(/^(?=FROM )/m)) {
    const name = /^FROM \S+ AS (\S+)/.exec(block)?.[1];
    if (name) map.set(name, block);
  }
  return map;
};

describe('Dockerfile', () => {
  it('builds one image per backend service and the static build of web and admin', () => {
    for (const target of ['api', 'generator', 'migrate', 'static']) {
      expect(stages().has(target), target).toBe(true);
    }
  });

  it('runs api, generator and migrate as the non-root node user', () => {
    for (const target of ['api', 'generator', 'migrate']) {
      expect(stages().get(target), target).toMatch(/^USER node$/m);
    }
  });

  it('installs only production dependencies for the backend images', () => {
    for (const filter of ['api...', 'generator...', '@nerdose/db...']) {
      expect(read('Dockerfile')).toContain(`--prod --filter "${filter}"`);
    }
  });

  it('gives the generator the Go and JDK toolchains of ADR-007', () => {
    const generator = stages().get('generator') ?? '';
    expect(generator).toContain('/usr/local/go');
    expect(generator).toContain('/opt/java/openjdk');
    expect(read('Dockerfile')).toMatch(/GO_IMAGE=golang:1\.25-/);
    expect(read('Dockerfile')).toMatch(/JDK_IMAGE=eclipse-temurin:21-/);
  });
});

describe('.dockerignore', () => {
  it('keeps env files, dependencies and git out of the build context', () => {
    const ignore = read('.dockerignore').split('\n');
    for (const pattern of ['**/.env', '**/.env.local', '**/.env.test', '**/node_modules', '.git']) {
      expect(ignore).toContain(pattern);
    }
  });
});
