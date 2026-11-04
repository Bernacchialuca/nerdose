// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = fileURLToPath(new URL('.', import.meta.url));

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = `${dir}${entry.name}`;
    if (entry.isDirectory()) return tsxFiles(`${full}/`);
    return entry.name.endsWith('.tsx') ? [full] : [];
  });
}

describe('index.css', () => {
  const css = readFileSync(`${srcDir}index.css`, 'utf8');

  it('importa Tailwind, los tokens de @nerdose/ui y JetBrains Mono en orden', () => {
    const imports = [
      "@import 'tailwindcss';",
      "@import '@nerdose/ui/tokens.css';",
      "@import '@fontsource/jetbrains-mono/400.css';",
      "@import '@fontsource/jetbrains-mono/500.css';",
      "@import '@fontsource/jetbrains-mono/700.css';",
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
