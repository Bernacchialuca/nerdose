// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcDir = fileURLToPath(new URL('.', import.meta.url));

function filesWith(dir: string, extensions: string[]): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = `${dir}${entry.name}`;
    if (entry.isDirectory()) return filesWith(`${full}/`, extensions);
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [full] : [];
  });
}

const FORBIDDEN = [
  { name: 'hex', re: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'arbitrary', re: /\[(\d|#|rgb)/ },
  { name: 'generic', re: /\b(rounded-md|shadow-md|text-2xl|font-semibold)\b/ },
] as const;

const require = createRequire(import.meta.url);

function fontCss(spec: string): string {
  return readFileSync(require.resolve(spec), 'utf8');
}

describe('index.css', () => {
  const css = readFileSync(`${srcDir}index.css`, 'utf8');

  const IMPORTS = [
    "@import 'tailwindcss';",
    "@import '@nerdose/ui/tokens.css';",
    "@import '@fontsource/jetbrains-mono/400.css';",
    "@import '@fontsource/jetbrains-mono/500.css';",
    "@import '@fontsource/inter/400.css';",
    "@import '@fontsource/inter/700.css';",
    "@import '@fontsource/jetbrains-mono/700.css';",
    "@import '@fontsource/jetbrains-mono/800.css';",
  ];

  it('importa Tailwind, los tokens de @nerdose/ui y las fuentes en el orden de la convención', () => {
    const positions = IMPORTS.map((i) => css.indexOf(i));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('importa solo los pesos del Design System', () => {
    expect(css.match(/@import '@fontsource\/[^']+';/g)).toHaveLength(6);
    for (const forbidden of [
      'inter/500.css',
      'inter/600.css',
      'jetbrains-mono/600.css',
      'inter/index.css',
      'jetbrains-mono/index.css',
      '-italic.css',
    ]) {
      expect(css).not.toContain(forbidden);
    }
  });

  it('no redeclara tokens ni carga recursos externos', () => {
    for (const forbidden of ['@theme', '--color-', 'fonts.googleapis', 'http://', 'https://']) {
      expect(css).not.toContain(forbidden);
    }
  });
});

describe('fuentes', () => {
  const FONTS = [
    { spec: '@fontsource/inter/400.css', family: 'Inter', weight: 400 },
    { spec: '@fontsource/inter/700.css', family: 'Inter', weight: 700 },
    { spec: '@fontsource/jetbrains-mono/400.css', family: 'JetBrains Mono', weight: 400 },
    { spec: '@fontsource/jetbrains-mono/500.css', family: 'JetBrains Mono', weight: 500 },
    { spec: '@fontsource/jetbrains-mono/700.css', family: 'JetBrains Mono', weight: 700 },
    { spec: '@fontsource/jetbrains-mono/800.css', family: 'JetBrains Mono', weight: 800 },
  ];

  it('web declara Inter y JetBrains Mono como dependencias', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies['@fontsource/inter']).toBe('^5.3.0');
    expect(pkg.dependencies['@fontsource/jetbrains-mono']).toBe('^5.3.0');
  });

  it.each(FONTS)('$spec resuelve a la familia y el peso correctos', ({ spec, family, weight }) => {
    const content = fontCss(spec);
    expect(content).toContain(`font-family: '${family}'`);
    expect(content).toContain(`font-weight: ${weight}`);
    expect(content).toContain('font-display: swap');
  });

  it.each(FONTS)('$spec es self-hosted', ({ spec }) => {
    const content = fontCss(spec);
    for (const external of ['http://', 'https://', '//fonts.']) {
      expect(content).not.toContain(external);
    }
    const urls = content.match(/url\([^)]*\)/g) ?? [];
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url).toMatch(/^url\(\.\/files\//);
  });
});

describe('componentes', () => {
  const sources = filesWith(srcDir, ['.tsx']).filter((f) => !f.endsWith('.test.tsx'));

  it('la guarda recorre las piezas de interfaz de web', () => {
    const relative = sources.map((f) => f.slice(srcDir.length));
    for (const expected of [
      'app/shell.tsx',
      'app/not-found.tsx',
      'app/route-error.tsx',
      'modules/about/routes/about.tsx',
      'modules/catalog/routes/home.tsx',
      'modules/catalog/components/game-card.tsx',
      'modules/catalog/components/progress-summary.tsx',
    ]) {
      expect(relative).toContain(expected);
    }
  });

  it('no usan hex literales, valores arbitrarios ni utilidades genéricas', () => {
    const found: string[] = [];
    for (const file of sources) {
      const content = readFileSync(file, 'utf8');
      for (const { name, re } of FORBIDDEN) {
        if (re.test(content)) found.push(`${file.slice(srcDir.length)} (${name})`);
      }
    }
    expect(found).toEqual([]);
  });

  it('la guarda detecta valores fuera del Design System', () => {
    const matches = (s: string) => FORBIDDEN.some(({ re }) => re.test(s));
    for (const bad of [
      'h-[150px]',
      'bg-[#fff]',
      'shadow-[rgba(0,0,0,.4)]',
      'rounded-md',
      'shadow-md',
      'text-2xl',
      'font-semibold',
      'text-[#3DDC84]',
    ]) {
      expect(matches(bad), bad).toBe(true);
    }
    for (const good of [
      'h-37.5',
      'rounded-control',
      'text-title-page',
      'text-title-card',
      'font-bold',
    ]) {
      expect(matches(good), good).toBe(false);
    }
  });
});

describe('cta.ts', () => {
  it('fue eliminado y nadie lo importa', () => {
    expect(existsSync(`${srcDir}components/cta.ts`)).toBe(false);
    const selfName = 'styles.test.ts';
    for (const file of filesWith(srcDir, ['.ts', '.tsx'])) {
      if (file.endsWith(selfName)) continue;
      const content = readFileSync(file, 'utf8');
      for (const legacy of ['@/components/cta', 'CTA_PRIMARY', 'CTA_SECONDARY', 'CTA_DISABLED']) {
        expect(content, `${file} (${legacy})`).not.toContain(legacy);
      }
    }
  });
});

describe('media queries globales (S-012)', () => {
  it('los archivos de media queries fueron eliminados y nadie los usa', () => {
    for (const gone of [
      'lib/breakpoints.ts',
      'hooks/use-media-query.ts',
      'hooks/use-media-query.test.ts',
      'test/viewport.ts',
    ]) {
      expect(existsSync(`${srcDir}${gone}`), gone).toBe(false);
    }
    for (const file of filesWith(srcDir, ['.ts', '.tsx'])) {
      if (file.endsWith('styles.test.ts')) continue;
      const content = readFileSync(file, 'utf8');
      for (const legacy of ['useMediaQuery', 'DESKTOP_MEDIA_QUERY', 'mockViewport']) {
        expect(content, `${file} (${legacy})`).not.toContain(legacy);
      }
    }
  });
});

describe('layout fluido (S-012)', () => {
  const FILES = [
    'app/shell.tsx',
    'app/not-found.tsx',
    'app/route-error.tsx',
    'components/main-nav.tsx',
    'components/site-footer.tsx',
    'modules/about/routes/about.tsx',
    'modules/catalog/components/challenge-number.tsx',
    'modules/catalog/components/global-streak-pill.tsx',
    'modules/session/components/language-selector.tsx',
  ];
  const RULES = [
    { name: 'responsive', re: /\b(sm|md|lg|xl|2xl):/ },
    { name: 'ancho fijo', re: /\b(min-)?w-\[/ },
    { name: 'nowrap', re: /\bwhitespace-nowrap\b/ },
    { name: 'grilla de 12', re: /grid-cols-12/ },
    { name: 'col-span', re: /col-span-/ },
  ] as const;

  it('los archivos de S-012 existen y no usan prefijos responsive ni anchos fijos', () => {
    const found: string[] = [];
    for (const file of FILES) {
      expect(existsSync(`${srcDir}${file}`), file).toBe(true);
      const content = readFileSync(`${srcDir}${file}`, 'utf8');
      for (const { name, re } of RULES) if (re.test(content)) found.push(`${file} (${name})`);
    }
    expect(found).toEqual([]);
  });

  it('la guarda detecta lo prohibido y deja pasar lo permitido', () => {
    const matches = (s: string) => RULES.some(({ re }) => re.test(s));
    for (const bad of [
      'lg:w-auto',
      'w-[200px]',
      'min-w-[10px]',
      'whitespace-nowrap',
      'lg:grid-cols-12',
    ]) {
      expect(matches(bad), bad).toBe(true);
    }
    for (const good of ['max-w-page', 'basis-130', 'flex-wrap', 'min-w-0']) {
      expect(matches(good), good).toBe(false);
    }
  });

  it('index.css fija el fondo y el esquema oscuro del documento', () => {
    const css = readFileSync(`${srcDir}index.css`, 'utf8');
    expect(css).toContain('@apply bg-bg;');
    expect(css).toContain('color-scheme: dark;');
  });
});
