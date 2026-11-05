import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { isIgnored, listRepoFiles, REPO_ROOT } from './helpers/repo';

const read = (file: string): string => readFileSync(join(REPO_ROOT, file), 'utf8');
const envExample = (): string => read('.env.example');

describe('root .env.example', () => {
  it('declares only Compose variables', () => {
    const names = [...envExample().matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]);
    expect(names).toEqual(['POSTGRES_PASSWORD']);
  });

  it('comments every variable', () => {
    const lines = envExample().split('\n');
    lines.forEach((line, index) => {
      if (/^[A-Z][A-Z0-9_]*=/.test(line)) {
        expect(lines[index - 1]?.startsWith('#'), line).toBe(true);
      }
    });
  });

  it('documents every variable used by compose.yaml', () => {
    const used = [...read('compose.yaml').matchAll(/\$\{([A-Z][A-Z0-9_]*)(?:[:?-][^}]*)?\}/g)].map(
      (m) => m[1],
    );
    const documented = [...envExample().matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]);
    expect(used).toEqual(['POSTGRES_PASSWORD']);
    for (const name of used) {
      expect(documented).toContain(name);
    }
  });

  it('keeps .env ignored and .env.example versionable', () => {
    const files = listRepoFiles();
    expect(isIgnored('.env')).toBe(true);
    expect(isIgnored('.env.example')).toBe(false);
    expect(files).toContain('.env.example');
    expect(files).toContain('compose.yaml');
    expect(files.filter((file) => basename(file) === '.env' && !file.includes('/'))).toEqual([]);
  });
});
