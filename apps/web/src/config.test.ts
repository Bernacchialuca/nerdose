// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import viteConfig from '../vite.config';

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');

describe('vite.config', () => {
  it('fija el puerto 5173 con strictPort', () => {
    expect(viteConfig.server?.port).toBe(5173);
    expect(viteConfig.server?.strictPort).toBe(true);
  });

  it('reenvía /api a la api sin reescribir el path', () => {
    const proxy = viteConfig.server?.proxy ?? {};
    expect(Object.keys(proxy)).toEqual(['/api']);
    const rule = proxy['/api'];
    const normalized = typeof rule === 'string' ? { target: rule } : rule;
    expect(normalized?.target).toBe('http://localhost:3000');
    expect(normalized).not.toHaveProperty('rewrite');
  });
});

describe('package.json', () => {
  it('declara los scripts y dependencias que usa Turborepo', () => {
    const pkg = JSON.parse(read('../package.json')) as {
      name: string;
      private: boolean;
      type: string;
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
    };
    expect(pkg.name).toBe('web');
    expect(pkg.private).toBe(true);
    expect(pkg.type).toBe('module');
    expect(pkg.scripts.dev).toBe('vite');
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.dependencies['@nerdose/ui']).toBe('workspace:*');
  });
});

describe('index.html', () => {
  it('declara idioma, viewport, título y punto de montaje', () => {
    const html = read('../index.html');
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"');
    expect(html).toContain('<title>nerdose</title>');
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<script type="module" src="/src/main.tsx">');
  });
});
