import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

function listTsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listTsFiles(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

describe('env-config: aislamiento de process.env', () => {
  it('solo src/config/env.ts lee process.env', () => {
    const offenders = listTsFiles(SRC)
      .filter((file) => readFileSync(file, 'utf8').includes('process.env'))
      .map((file) => relative(SRC, file))
      .filter((file) => file !== join('config', 'env.ts'));
    expect(offenders).toEqual([]);
  });
});
