import { ZodError } from 'zod';
import { describe, expect, it } from 'vitest';

import { RESULT_0_ES, RESULT_3_EN, RESULT_3_ES, RESULT_5_ES } from './test-fixtures';
import { share } from './share';

describe('share', () => {
  it('formats a 3/5 (TS-10)', () => {
    expect(share(RESULT_3_ES, 128)).toBe('⏳ Tech Timeline #128\n🟩🟥🟥🟩🟩 3/5');
  });

  it('formats 5/5 and 0/5 (TS-11)', () => {
    expect(share(RESULT_5_ES, 8)).toBe('⏳ Tech Timeline #8\n🟩🟩🟩🟩🟩 5/5');
    expect(share(RESULT_0_ES, 8)).toBe('⏳ Tech Timeline #8\n🟥🟥🟥🟥🟥 0/5');
  });

  it('has no spoilers and is identical in es and en (TS-12)', () => {
    const text = share(RESULT_3_ES, 8);
    expect(share(RESULT_3_EN, 8)).toBe(text);
    expect(text.split('\n')).toHaveLength(2);
    expect(text).not.toContain('nerdose');
    for (const leak of [
      'Python',
      'Java',
      'Go',
      'Docker',
      'Kubernetes',
      '1991',
      '2009',
      'p7k2m9',
      'nota',
      'note',
    ]) {
      expect(text.includes(leak), leak).toBe(false);
    }
  });

  it('throws on an invalid result (TS-13)', () => {
    expect(() => share({ win: true }, 8)).toThrow(ZodError);
  });
});
