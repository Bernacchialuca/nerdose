import { ZodError } from 'zod';
import { describe, expect, it } from 'vitest';

import { RESULT_LOST_GO_ES, RESULT_WON_JAVA_ES } from './test-fixtures';
import { share } from './share';

describe('share', () => {
  it('won in Java (TS-7)', () => {
    expect(share(RESULT_WON_JAVA_ES, 128, 'es')).toBe('🐛 Bug Hunt #128 · Java\n🟩 bug encontrado');
  });

  it('lost and in English (TS-8)', () => {
    expect(share(RESULT_LOST_GO_ES, 8, 'es')).toBe('🐛 Bug Hunt #8 · Go\n🟥 se me escapó');
    expect(share(RESULT_LOST_GO_ES, 8, 'en')).toBe('🐛 Bug Hunt #8 · Go\n🟥 it got away');
    expect(share(RESULT_WON_JAVA_ES, 8, 'en')).toBe('🐛 Bug Hunt #8 · Java\n🟩 bug found');
    expect(share({ ...RESULT_LOST_GO_ES, code_language: 'js' }, 8, 'es')).toBe(
      '🐛 Bug Hunt #8 · JavaScript\n🟥 se me escapó',
    );
  });

  it('has no spoilers and defaults to es (TS-9)', () => {
    expect(share(RESULT_WON_JAVA_ES, 8)).toBe(share(RESULT_WON_JAVA_ES, 8, 'es'));
    for (const out of [share(RESULT_WON_JAVA_ES, 8), share(RESULT_LOST_GO_ES, 8, 'es')]) {
      const lines = out.split('\n');
      expect(lines).toHaveLength(2);
      expect(out).not.toContain('nerdose');
      for (const s of [
        'L4',
        'línea',
        'line',
        'comparación',
        'comparison',
        '>=',
        'maxIndex',
        '[5, 1, 5]',
      ]) {
        expect(out.includes(s), s).toBe(false);
      }
      expect(lines[1]).not.toMatch(/\d/);
    }
  });

  it('throws on an invalid result (TS-10)', () => {
    expect(() => share({ win: true }, 8, 'es')).toThrow(ZodError);
  });
});
