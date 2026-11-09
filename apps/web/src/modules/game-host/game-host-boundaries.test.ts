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

describe('game-host boundaries', () => {
  const files = sources(ROOT);

  it('TS-2: solo el registry importa el client, y de forma dinámica', () => {
    expect(files.length).toBeGreaterThan(0);
    const withGame = files.filter((f) => readFileSync(f, 'utf8').includes('@nerdose/game-'));
    expect(withGame.map((f) => f.slice(ROOT.length + 1))).toEqual([
      'modules/game-host/registry.ts',
    ]);
    const text = readFileSync(withGame[0] as string, 'utf8');
    expect(text).toMatch(/import\('@nerdose\/game-[a-z-]+\/client'\)/);
    expect(text).not.toContain("from '@nerdose/game-");
  });

  it('TS-5: nadie referencia window.plausible', () => {
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toContain('window.plausible');
    }
  });
});
