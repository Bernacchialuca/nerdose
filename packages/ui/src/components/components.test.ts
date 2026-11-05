// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = fileURLToPath(new URL('.', import.meta.url));

describe('ui components', () => {
  it('use no literal hex colors nor arbitrary color values (TS-26)', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
    expect(files.length).toBeGreaterThan(0);
    expect(files).toEqual(expect.arrayContaining(['alert.tsx', 'card.tsx']));
    for (const file of files) {
      const content = readFileSync(`${dir}${file}`, 'utf8');
      expect(content, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(content, file).not.toContain('[#');
    }
  });

  it('import no game client, router, i18n nor server-only package (TS-24)', () => {
    const srcDir = fileURLToPath(new URL('..', import.meta.url));
    const forbidden = [
      "from '@nerdose/game-",
      "from 'react-router",
      "from 'react-i18next'",
      "from 'i18next'",
      "from '@nerdose/db'",
      "from '@nerdose/core/notify'",
    ];
    const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' }).filter(
      (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(`${srcDir}${file}`, 'utf8');
      for (const pattern of forbidden) expect(content, file).not.toContain(pattern);
    }
  });
});
