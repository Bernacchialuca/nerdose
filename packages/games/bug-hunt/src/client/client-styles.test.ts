// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = fileURLToPath(new URL('.', import.meta.url));

const FORBIDDEN = [
  { name: 'hex', re: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'arbitrary', re: /\[(\d|#|rgb)/ },
  { name: 'generic', re: /\b(rounded-md|shadow-md|text-2xl|font-semibold)\b/ },
  { name: 'outline-none', re: /\boutline-none\b/ },
  { name: 'transition', re: /\btransition\b/ },
  { name: 'animate', re: /\banimate-/ },
] as const;

describe('client styles (TS-65)', () => {
  it('use no hex, arbitrary values, generic utilities, transitions nor animations', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const text = readFileSync(`${dir}${f}`, 'utf8');
      for (const { name, re } of FORBIDDEN) {
        expect(re.test(text), `${f} matches ${name}`).toBe(false);
      }
      if (f !== 'code-block.tsx' && f !== 'fix-diff.tsx') {
        expect(/\boverflow-x-auto\b/.test(text), `${f} scrolls horizontally`).toBe(false);
      }
    }
  });
});
