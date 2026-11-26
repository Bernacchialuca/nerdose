import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { RESULT_LOSS, RESULT_WIN } from './test-fixtures';
import { share } from './share';

describe('share', () => {
  it('formats a win (TS-7)', () => {
    expect(share(RESULT_WIN, 128)).toBe(
      '🟩 Devdle #128 · 3/6\n⬛🟨🟨⬛⬛⬛\n🟨⬛🟩⬛🟩🟩\n🟩🟩🟩🟩🟩🟩',
    );
  });

  it('marks a game played with the hint, without the letter', () => {
    const text = share({ ...RESULT_WIN, hint: { position: 0, letter: 'P' } }, 128);
    expect(text.split('\n')[0]).toBe('🟩 Devdle #128 · 3/6 💡');
    expect(share({ ...RESULT_WIN, hint: null }, 128).split('\n')[0]).toBe('🟩 Devdle #128 · 3/6');
  });

  it('formats a loss with X/6 (TS-8)', () => {
    const lines = share(RESULT_LOSS, 128).split('\n');
    expect(lines[0]).toBe('🟩 Devdle #128 · X/6');
    expect(lines).toHaveLength(7);
    expect(lines.at(-1)).toMatch(/^[🟩🟨⬛]{6}$/u);
  });

  it('never leaks the solution (TS-9)', () => {
    for (const r of [RESULT_WIN, RESULT_LOSS]) {
      const text = share(r, 128);
      for (const secret of [
        'PARSER',
        'software_engineering',
        'ingeniería',
        r.definition,
        r.summary,
      ]) {
        expect(text.includes(secret)).toBe(false);
      }
      expect(text).not.toContain('nerdose');
    }
  });

  it('throws ZodError with an invalid result (TS-10)', () => {
    expect(() => share({ win: true }, 128)).toThrow(ZodError);
  });
});
