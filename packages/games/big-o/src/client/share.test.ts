import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { share } from './share';
import {
  RESULT_LOST_GO_ES,
  RESULT_PLAIN_ES,
  RESULT_WON_JAVA_EN,
  RESULT_WON_JAVA_ES,
} from './test-fixtures';

describe('share', () => {
  it('shares a win in Java (TS-6)', () => {
    expect(share(RESULT_WON_JAVA_ES, 128)).toBe('🧮 Big O #128\n🟩 Java\nnerdose.dev');
  });

  it('shares a loss in Go and a win in JavaScript (TS-7)', () => {
    expect(share(RESULT_LOST_GO_ES, 8)).toBe('🧮 Big O #8\n🟥 Go\nnerdose.dev');
    expect(share(RESULT_PLAIN_ES, 8)).toBe('🧮 Big O #8\n🟩 JavaScript\nnerdose.dev');
  });

  it('has no spoilers and is identical in es and en (TS-8)', () => {
    const text = share(RESULT_WON_JAVA_ES, 8);
    expect(share(RESULT_WON_JAVA_EN, 8)).toBe(text);
    expect(text.split('\n')).toHaveLength(3);
    expect(text.endsWith('nerdose.dev')).toBe(true);
    for (const spoiler of ['O(', 'o_n', 'log', 'nested', 'n veces', '10240']) {
      expect(text.includes(spoiler)).toBe(false);
    }
  });

  it('throws on an invalid result (TS-9)', () => {
    expect(() => share({ win: true }, 8)).toThrow(ZodError);
  });
});
