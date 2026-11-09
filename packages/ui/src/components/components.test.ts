// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = fileURLToPath(new URL('.', import.meta.url));

const isSource = (f: string) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f);

export const FORBIDDEN = [
  { name: 'hex', re: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'arbitrary', re: /\[(\d|#|rgb)/ },
  { name: 'generic', re: /\b(rounded-md|shadow-md|text-2xl|font-semibold)\b/ },
] as const;

describe('ui components', () => {
  it('use no hex, arbitrary values nor generic utilities (TS-56)', () => {
    const files = readdirSync(dir).filter(isSource);
    expect(files).toEqual(
      expect.arrayContaining([
        'alert.tsx',
        'app-header.tsx',
        'badge.tsx',
        'banner.tsx',
        'brand-mark.tsx',
        'card.tsx',
        'game-header.tsx',
        'game-thumbnail.tsx',
        'icons.tsx',
        'status-icon.tsx',
        'panel.tsx',
        'progress-bar.tsx',
        'segmented-control.tsx',
        'streak-number.tsx',
        'streak-pill.tsx',
        'terminal-window.tsx',
        'button-class.ts',
        'link-class.ts',
        'nav-item-class.ts',
        'game-classes.ts',
      ]),
    );
    for (const file of files) {
      const content = readFileSync(`${dir}${file}`, 'utf8');
      for (const { name, re } of FORBIDDEN) expect(content, `${file} (${name})`).not.toMatch(re);
    }
  });

  it('detects violations instead of passing vacuously (TS-58)', () => {
    const hit = (s: string) => FORBIDDEN.some(({ re }) => re.test(s));
    for (const bad of [
      'h-[150px]',
      'bg-[#fff]',
      'shadow-[rgba(0,0,0,.4)]',
      'rounded-md',
      'font-semibold',
    ])
      expect(hit(bad), bad).toBe(true);
    for (const good of ['h-37.5', 'rounded-control', 'text-title-card'])
      expect(hit(good), good).toBe(false);
  });

  it('import no game client, router, i18n nor server-only package (TS-57)', () => {
    const srcDir = fileURLToPath(new URL('..', import.meta.url));
    const forbidden = [
      "from '@nerdose/game-",
      "from 'react-router",
      "from 'react-i18next'",
      "from 'i18next'",
      "from '@nerdose/db'",
      "from '@nerdose/core/notify'",
    ];
    const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' }).filter(isSource);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(`${srcDir}${file}`, 'utf8');
      for (const pattern of forbidden) expect(content, file).not.toContain(pattern);
    }
  });
});
