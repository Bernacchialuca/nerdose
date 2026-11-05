// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = fileURLToPath(new URL('.', import.meta.url));

describe('ui components', () => {
  it('use no literal hex colors nor arbitrary color values (TS-26)', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const content = readFileSync(`${dir}${file}`, 'utf8');
      expect(content, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(content, file).not.toContain('[#');
    }
  });
});
