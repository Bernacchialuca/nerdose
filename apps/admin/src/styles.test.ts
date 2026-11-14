// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

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
        '@nerdose/game-devdle/client',
        '@nerdose/game-grep-grid/client',
        '@nerdose/game-timeline/client',
      ]);
      const dynamic = content.match(/import\('@nerdose\/game-[a-z-]+\/client'\)/g) ?? [];
      expect(dynamic).toHaveLength(3);
    }
  });

  it('el módulo upcoming no ramifica por game_id', () => {
    for (const file of tsx.filter((f) => f.includes('modules/upcoming/'))) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).not.toContain('switch (');
      expect(content, file).not.toMatch(/=== '(devdle|grep-grid|timeline)'/);
    }
  });
});
