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

const DND = '@dnd' + '-kit';
const HIGHLIGHTER = 'shi' + 'ki';

describe('game-host boundaries', () => {
  const files = sources(ROOT);

  it('TS-2: solo el registry importa el client, y de forma dinámica', () => {
    expect(files.length).toBeGreaterThan(0);
    const withGame = files.filter((f) => readFileSync(f, 'utf8').includes('@nerdose/game-'));
    expect(withGame.map((f) => f.slice(ROOT.length + 1))).toEqual([
      'modules/game-host/registry.ts',
    ]);
    const text = readFileSync(withGame[0] as string, 'utf8');
    expect(text).toContain("import('@nerdose/game-big-o/client')");
    expect(text).toContain("import('@nerdose/game-devdle/client')");
    expect(text).toContain("import('@nerdose/game-grep-grid/client')");
    expect(text).toContain("import('@nerdose/game-timeline/client')");
    expect(text).not.toContain("from '@nerdose/game-");
    expect(text).not.toContain("/definition'");
    expect(text).not.toContain("/generator'");
  });

  it('TS-2: ningún archivo de src/ (ni tests) menciona dnd-kit', () => {
    const all = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return all(path);
        return /\.tsx?$/.test(name) ? [path] : [];
      });
    for (const file of all(ROOT)) expect(readFileSync(file, 'utf8'), file).not.toContain(DND);
  });

  it('TS-3: ningún archivo de src/ (ni tests) menciona el resaltador de código', () => {
    const all = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return all(path);
        return /\.tsx?$/.test(name) ? [path] : [];
      });
    for (const file of all(ROOT)) {
      expect(readFileSync(file, 'utf8').toLowerCase(), file).not.toContain(HIGHLIGHTER);
    }
  });

  it('TS-3: sin lógica por juego para Big O ni lectura de campos suyos', () => {
    const allowed = [
      'modules/game-host/registry.ts',
      'modules/catalog/games.ts',
      'modules/catalog/components/how-it-works.tsx',
      'i18n/es.ts',
      'i18n/en.ts',
    ];
    const rels = files.map((f) => f.slice(ROOT.length + 1)).filter((f) => !f.startsWith('test/'));
    for (const file of rels.filter((f) =>
      readFileSync(join(ROOT, f), 'utf8').includes("'big-o'"),
    )) {
      expect(allowed, file).toContain(file);
    }
    for (const file of rels) {
      expect(readFileSync(join(ROOT, file), 'utf8'), file).not.toMatch(
        /chosen_option|trap_option|recipe_category|line_notes|public_view\.code/,
      );
    }
  });

  it('TS-43: sin lógica por juego para Timeline ni lectura de campos suyos', () => {
    const allowed = [
      'modules/game-host/registry.ts',
      'modules/catalog/games.ts',
      'modules/catalog/components/how-it-works.tsx',
      'i18n/es.ts',
      'i18n/en.ts',
    ];
    const rels = files.map((f) => f.slice(ROOT.length + 1)).filter((f) => !f.startsWith('test/'));
    for (const file of rels.filter((f) =>
      readFileSync(join(ROOT, f), 'utf8').includes("'timeline'"),
    )) {
      expect(allowed, file).toContain(file);
    }
    for (const file of rels) {
      expect(readFileSync(join(ROOT, file), 'utf8'), file).not.toMatch(
        /opaque_id|submitted_order|correct_order|public_view\.category/,
      );
    }
  });

  it('TS-46: sin lógica por juego ni lectura de feedback', () => {
    const allowed = [
      'modules/game-host/registry.ts',
      'modules/catalog/games.ts',
      'i18n/es.ts',
      'i18n/en.ts',
    ];
    // `src/test/` es soporte de tests (fixtures), no código de la app.
    const withGrepGrid = files
      .map((f) => f.slice(ROOT.length + 1))
      .filter((f) => !f.startsWith('test/'))
      .filter((f) => readFileSync(join(ROOT, f), 'utf8').includes("'grep-grid'"));
    for (const file of withGrepGrid) expect(allowed, file).toContain(file);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(/feedback\??\.(found|reason)/);
      expect(text, file).not.toMatch(/\.reason\s*===/);
    }
  });

  it('TS-5: nadie referencia window.plausible', () => {
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toContain('window.plausible');
    }
  });
});
