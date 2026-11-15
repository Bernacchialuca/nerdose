// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { codeLines } from './lines';
import { CODE } from './test-fixtures';

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('shiki/core');
});

describe('loadTokenizer', () => {
  it('tokenizes the three languages line by line (TS-15)', async () => {
    const { loadTokenizer } = await import('./highlight');
    const tokenize = await loadTokenizer();
    for (const lang of ['js', 'go', 'java'] as const) {
      const tokens = tokenize(CODE[lang], lang);
      const lines = codeLines(CODE[lang]);
      expect(tokens).toHaveLength(9);
      tokens.forEach((line, i) => {
        expect(line.map((t) => t.content).join('')).toBe(lines[i]);
        for (const t of line) {
          expect(t.color === null || /^var\(--shiki-[a-z-]+\)$/.test(t.color)).toBe(true);
        }
      });
    }
    const keyword = tokenize(CODE.js, 'js')[2]?.find((t) => t.content === 'for');
    expect(keyword?.color).toBe('var(--shiki-token-keyword)');
  });

  it('memoises the promise (TS-16)', async () => {
    const { loadTokenizer } = await import('./highlight');
    expect(loadTokenizer()).toBe(loadTokenizer());
  });

  it('clears the memo after a rejection so the next call retries (TS-16)', async () => {
    vi.resetModules();
    vi.doMock('shiki/core', () => {
      throw new Error('boom');
    });
    const mod = await import('./highlight');
    const failed = mod.loadTokenizer();
    await expect(failed).rejects.toThrow();
    vi.doUnmock('shiki/core');
    const retry = mod.loadTokenizer();
    expect(retry).not.toBe(failed);
    await retry.catch(() => {});
  });
});
