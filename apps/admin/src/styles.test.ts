// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { buildAdmin, compiledCss } from './test/vite-build';

const srcDir = fileURLToPath(new URL('.', import.meta.url));

function sourceFiles(dir: string, exts: string[]): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = `${dir}${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(`${full}/`, exts);
    return exts.some((e) => entry.name.endsWith(e)) ? [full] : [];
  });
}

const tsxFiles = (dir: string) => sourceFiles(dir, ['.tsx']);
const isTest = (file: string) => /\.test\.tsx?$/.test(file) || file.includes('/test/');

describe('index.css', () => {
  const css = readFileSync(`${srcDir}index.css`, 'utf8');

  it('importa Tailwind, los tokens de @nerdose/ui JetBrains Mono e Inter en orden', () => {
    const imports = [
      "@import 'tailwindcss';",
      "@import '@nerdose/ui/tokens.css';",
      '@source "../../../packages/games/*/src/client/**/*.{ts,tsx}";',
      "@import '@fontsource/jetbrains-mono/400.css';",
      "@import '@fontsource/jetbrains-mono/500.css';",
      "@import '@fontsource/inter/400.css';",
      "@import '@fontsource/inter/700.css';",
      "@import '@fontsource/jetbrains-mono/700.css';",
      "@import '@fontsource/jetbrains-mono/800.css';",
    ];
    const positions = imports.map((i) => css.indexOf(i));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('no redeclara tokens ni carga recursos externos', () => {
    for (const forbidden of ['@theme', '--color-', 'fonts.googleapis', 'http://', 'https://']) {
      expect(css).not.toContain(forbidden);
    }
  });
});

describe('componentes', () => {
  it('no usan colores hex literales ni valores arbitrarios de color', () => {
    for (const file of tsxFiles(srcDir)) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(content, file).not.toContain('[#');
    }
  });
});

describe('guardas estáticas del código de producción', () => {
  const files = sourceFiles(srcDir, ['.ts', '.tsx']).filter((f) => !isTest(f));
  const tsx = files.filter((f) => f.endsWith('.tsx'));

  it('los .tsx no usan valores arbitrarios ni clases fuera de los tokens', () => {
    for (const file of tsx) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).not.toMatch(/\[(\d|#|rgb)/);
      for (const forbidden of ['rounded-md', 'shadow-md', 'text-2xl', 'font-semibold']) {
        expect(content, file).not.toContain(forbidden);
      }
    }
  });

  it('nunca inserta HTML ni usa localStorage', () => {
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).not.toContain('dangerouslySetInnerHTML');
      expect(content, file).not.toContain('localStorage');
    }
  });

  it('no importa paquetes ni apps prohibidos', () => {
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).not.toMatch(/from '(@nerdose\/db|[^']*apps\/web)/);
    }
  });

  it('de los juegos solo se importa ./client, dinámico y desde el registry', () => {
    const registry = 'modules/upcoming/registry.ts';
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).not.toMatch(/@nerdose\/game-[a-z-]+\/(definition|generator)/);
      expect(content, file).not.toMatch(/from '@nerdose\/game-/);
      if (!content.includes('@nerdose/game-')) continue;
      expect(file.endsWith(registry), file).toBe(true);
      const all = content.match(/@nerdose\/game-[a-z-]+\/[a-z]+/g) ?? [];
      expect(all.sort()).toEqual([
        '@nerdose/game-big-o/client',
        '@nerdose/game-bug-hunt/client',
        '@nerdose/game-devdle/client',
        '@nerdose/game-grep-grid/client',
        '@nerdose/game-timeline/client',
      ]);
      const dynamic = content.match(/import\('@nerdose\/game-[a-z-]+\/client'\)/g) ?? [];
      expect(dynamic).toHaveLength(5);
    }
  });

  it('el módulo upcoming no ramifica por game_id', () => {
    for (const file of tsx.filter((f) => f.includes('modules/upcoming/'))) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).not.toContain('switch (');
      expect(content, file).not.toMatch(/=== '(devdle|grep-grid|timeline|big-o|bug-hunt)'/);
    }
  });

  it('el módulo content-stock no importa juegos ni ramifica por juego o banco (TS-31)', () => {
    const own = files.filter((f) => f.includes('modules/content-stock/') && !f.includes('.test.'));
    expect(own.length).toBeGreaterThan(0);
    for (const file of own) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).not.toContain('@nerdose/game-');
      expect(content, file).not.toContain('switch (');
      expect(content, file).not.toMatch(/=== '(devdle|grep-grid|timeline|terms|timeline_facts)'/);
    }
  });
});

type BuiltChunk = Awaited<ReturnType<typeof buildAdmin>>['chunks'][number];

/** Chunks alcanzables con imports estáticos desde el chunk de entrada. */
function entryClosure(chunks: BuiltChunk[]): Set<string> {
  const entry = chunks.find((c) => c.isEntry);
  expect(entry).toBeDefined();
  const byName = new Map(chunks.map((c) => [c.fileName, c]));
  const closure = new Set<string>();
  const queue = [(entry as BuiltChunk).fileName];
  while (queue.length > 0) {
    const name = queue.shift() as string;
    if (closure.has(name)) continue;
    closure.add(name);
    for (const imp of byName.get(name)?.imports ?? []) queue.push(imp);
  }
  return closure;
}

describe('build del admin (D4)', () => {
  const highlighter = 'shi' + 'ki';

  it('el CSS compilado incluye lo que usa el Preview de Big O (TS-24)', async () => {
    const css = compiledCss(await buildAdmin());
    for (const needle of [
      '--color-game-big-o-muted',
      '--color-game-big-o-tint',
      '--color-game-big-o-light',
      '--color-game-big-o-border',
      '--color-surface-sunken',
      '--color-toolbar',
      '--color-text-body',
      '@container',
      'dashed',
    ]) {
      expect(css, needle).toContain(needle);
    }
  }, 60_000);

  it('el CSS compilado incluye lo que usa el Preview de Bug Hunt (TS-25)', async () => {
    const css = compiledCss(await buildAdmin());
    for (const needle of [
      '--color-game-bug-hunt-tint',
      '--color-game-bug-hunt-tint-strong',
      '--color-game-bug-hunt-featured',
      '--shadow-bar-bug-hunt',
      '--color-streak-surface',
      '--color-streak-border',
      '--color-streak-label',
      '--color-status-error-soft',
      '--color-status-success-soft',
      '--color-game-big-o-tint',
      '@container',
    ]) {
      expect(css, needle).toContain(needle);
    }
  }, 60_000);

  it('el resaltador y los clients de Big O y Bug Hunt quedan fuera del chunk de entrada (TS-26)', async () => {
    const { chunks } = await buildAdmin();
    const closure = entryClosure(chunks);
    const hl = new RegExp('[\\\\/](' + highlighter + '|@' + highlighter + 'js)[\\\\/]');
    const hlChunks = chunks.filter((c) => c.moduleIds.some((id) => hl.test(id)));
    expect(hlChunks.length).toBeGreaterThan(0);
    for (const c of hlChunks) expect(closure.has(c.fileName), c.fileName).toBe(false);
    for (const game of ['big-o', 'bug-hunt']) {
      const client = chunks.find((c) =>
        c.moduleIds.some((id) => id.endsWith(`packages/games/${game}/src/client/index.ts`)),
      );
      expect(client, game).toBeDefined();
      expect(closure.has((client as BuiltChunk).fileName), game).toBe(false);
    }
  }, 60_000);

  it('ni polyglot ni los generadores entran al bundle (TS-27)', async () => {
    const { chunks } = await buildAdmin();
    const generator = /packages[\\/]games[\\/][a-z-]+[\\/]src[\\/]generator[\\/]/;
    for (const c of chunks) {
      expect(
        c.moduleIds.some((id) => id.includes('packages/polyglot/')),
        c.fileName,
      ).toBe(false);
      expect(
        c.moduleIds.some((id) => generator.test(id)),
        c.fileName,
      ).toBe(false);
    }
  }, 60_000);

  it('ningún archivo del admin menciona el resaltador (TS-27)', () => {
    for (const file of sourceFiles(srcDir, ['.ts', '.tsx'])) {
      expect(readFileSync(file, 'utf8'), file).not.toContain(highlighter);
    }
  });
});
