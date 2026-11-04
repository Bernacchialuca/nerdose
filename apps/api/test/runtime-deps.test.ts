import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const PKG = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  dependencies?: Record<string, string>;
};

function listTsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listTsFiles(path);
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

function packageName(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier);
}

function runtimeImports(source: string): string[] {
  const pattern = /^import\s+(?!type\s)[^;]*?from\s+'([^']+)'/gms;
  return [...source.matchAll(pattern)].map((match) => match[1] ?? '');
}

describe('dependencias de runtime', () => {
  it('todo paquete importado en runtime por src/ está en dependencies', () => {
    const packages = new Set(
      listTsFiles(SRC)
        .flatMap((file) => runtimeImports(readFileSync(file, 'utf8')))
        .filter((specifier) => !specifier.startsWith('node:') && !specifier.startsWith('@/') && !specifier.startsWith('.'))
        .map(packageName),
    );
    const missing = [...packages].filter((name) => !(name in (PKG.dependencies ?? {})));
    expect(missing).toEqual([]);
  });
});
