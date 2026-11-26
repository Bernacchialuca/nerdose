// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

// Partido a propósito: la guarda de game-host prohíbe esa cadena literal en todo `src/`.
const DND_SCOPE = '@dnd' + '-kit/';

describe('catalog boundaries', () => {
  it('TS-50: la home no importa client de juegos ni registries', () => {
    const files = [...sources(join(ROOT, 'modules', 'catalog')), ...sources(join(ROOT, 'app'))];
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const banned of ['@nerdose/game-', "/client'", 'createGameRegistry', 'GameDefinition']) {
        expect(text, `${file} contiene ${banned}`).not.toContain(banned);
      }
    }
  });

  it('TS-1: web depende solo de los paquetes con client', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, '..', 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(names.filter((n) => n.startsWith('@nerdose/game-'))).toEqual([
      '@nerdose/game-big-o',
      '@nerdose/game-bug-hunt',
      '@nerdose/game-devdle',
      '@nerdose/game-grep-grid',
      '@nerdose/game-timeline',
    ]);
    expect(pkg.dependencies?.['@nerdose/game-big-o']).toBe('workspace:*');
    expect(pkg.dependencies?.['@nerdose/game-bug-hunt']).toBe('workspace:*');
    expect(pkg.dependencies?.['@nerdose/game-devdle']).toBe('workspace:*');
    expect(pkg.dependencies?.['@nerdose/game-grep-grid']).toBe('workspace:*');
    expect(pkg.dependencies?.['@nerdose/game-timeline']).toBe('workspace:*');
    expect(names.filter((n) => n.startsWith(DND_SCOPE))).toEqual([]);
    expect(pkg.dependencies?.zod).toBeUndefined();
  });
});
