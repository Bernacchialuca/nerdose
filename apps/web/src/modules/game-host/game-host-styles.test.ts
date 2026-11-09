// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = import.meta.dirname;

function tsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return tsx(full);
    return entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx') ? [full] : [];
  });
}

const FORBIDDEN = [
  { name: 'hex', re: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'arbitrary', re: /\[(\d|#|rgb)/ },
  { name: 'generic', re: /\b(rounded-md|shadow-md|text-2xl|font-semibold|outline-none)\b/ },
  { name: 'responsive', re: /\b(sm|md|lg|xl):/ },
] as const;

describe('estilos del módulo game-host (TS-54)', () => {
  const files = tsx(DIR);

  it('recorre los componentes del módulo', () => {
    expect(files.length).toBeGreaterThan(8);
  });

  it('no usa hex, valores arbitrarios, utilidades genéricas ni prefijos responsive', () => {
    const found: string[] = [];
    for (const file of files) {
      // `minmax(min(240px,100%),1fr)` es la única excepción arbitraria permitida (grid auto-fit).
      const content = readFileSync(file, 'utf8').replace(
        'grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]',
        '',
      );
      for (const { name, re } of FORBIDDEN) {
        if (re.test(content)) found.push(`${file.slice(DIR.length + 1)} (${name})`);
      }
    }
    expect(found).toEqual([]);
  });

  it('la fila de salidas usa auto-fit y las acciones del header envuelven', () => {
    const exits = readFileSync(join(DIR, 'components', 'result-exits.tsx'), 'utf8');
    expect(exits).toContain('minmax(min(240px,100%),1fr)');
    const header = readFileSync(
      join(
        DIR,
        '..',
        '..',
        '..',
        '..',
        '..',
        'packages',
        'ui',
        'src',
        'components',
        'game-header.tsx',
      ),
      'utf8',
    );
    expect(header).toContain('flex flex-wrap items-center gap-2');
  });
});
