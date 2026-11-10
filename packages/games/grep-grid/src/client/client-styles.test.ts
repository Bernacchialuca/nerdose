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
  { name: 'overflow-x', re: /\boverflow-x-auto\b/ },
] as const;

describe('client styles (TS-5)', () => {
  it('use no hex, arbitrary values nor generic utilities', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
    for (const f of files) {
      const text = readFileSync(`${dir}${f}`, 'utf8');
      for (const { name, re } of FORBIDDEN) {
        expect(re.test(text), `${f} matches ${name}`).toBe(false);
      }
    }
  });
});
