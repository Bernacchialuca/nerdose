import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const FORBIDDEN = /from\s+['"](node:http|node:https|node:net|hono|@hono\/node-server)['"]/;

describe('sin puerto ni servidor', () => {
  it('ningún archivo de src importa módulos de red HTTP', () => {
    const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(readFileSync(`${SRC}/${file}`, 'utf8'), file).not.toMatch(FORBIDDEN);
    }
  });
});
