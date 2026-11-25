// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = import.meta.dirname;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('stats boundaries', () => {
  const files = sources(ROOT);

  it('TS-43: el módulo no conoce juegos concretos ni sus clients', () => {
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const banned of [
        '@nerdose/game-',
        "'big-o'",
        "'bug-hunt'",
        "'timeline'",
        "'grep-grid'",
        "'devdle'",
        '"big-o"',
        '"bug-hunt"',
        '"timeline"',
        '"grep-grid"',
        '"devdle"',
        'bug_type',
        'recipe_category',
      ]) {
        expect(text, `${file} contiene ${banned}`).not.toContain(banned);
      }
    }
  });

  it('TS-43: sin colores hex ni valores arbitrarios en px', () => {
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text, `${file} contiene un color hex`).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(text, `${file} contiene un valor arbitrario numérico`).not.toMatch(/-\[\d/);
    }
  });
});
