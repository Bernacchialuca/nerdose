// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');

describe('index.html', () => {
  it('TS-48 no carga recursos de terceros', () => {
    expect(html).not.toMatch(/<script[^>]+src="http/);
    expect(html).not.toMatch(/<link[^>]+href="http/);
    expect(html).toContain('lang="es"');
  });
});
