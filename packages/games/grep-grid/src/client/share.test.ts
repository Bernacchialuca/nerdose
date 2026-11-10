import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { share } from './share';
import { RESULT_GAVE_UP_5, RESULT_WIN, WORD_NAMES } from './test-fixtures';

describe('share', () => {
  it('victory (TS-7)', () => {
    expect(share(RESULT_WIN, 8)).toBe('🔎 Grep Grid #8\n8/8\nnerdose.dev');
  });

  it('gave up shows only the score (TS-8)', () => {
    expect(share({ ...RESULT_GAVE_UP_5, score: 6 }, 8)).toBe('🔎 Grep Grid #8\n6/8\nnerdose.dev');
  });

  it('never leaks words, definitions nor the surrender (TS-9)', () => {
    const text = share(RESULT_GAVE_UP_5, 8);
    expect(text.split('\n')).toHaveLength(3);
    expect(text.endsWith('nerdose.dev')).toBe(true);
    for (const w of WORD_NAMES) expect(text).not.toContain(w);
    for (const leak of ['definici', 'rend', 'give', 'gave', '○', '✓']) {
      expect(text).not.toContain(leak);
    }
    expect(share(RESULT_WIN, 8).replace('8/8', '5/8')).toBe(text);
  });

  it('throws on an invalid result (TS-10)', () => {
    expect(() => share({ win: true }, 8)).toThrow(ZodError);
  });
});
