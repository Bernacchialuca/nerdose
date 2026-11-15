import { describe, expect, it } from 'vitest';

import { bhMove, bhPublicView, bhResult } from './bug-hunt-today';

describe('fixtures de Bug Hunt', () => {
  it('bhResult gana solo con la línea del bug', () => {
    expect(bhResult(4, 'js').win).toBe(true);
    expect(bhResult(5, 'js').win).toBe(false);
  });

  it('bhMove lleva el lenguaje en play.code_language', () => {
    expect(bhMove(4, 'go').play.code_language).toBe('go');
    expect(bhMove(4, 'java').play.status).toBe('won');
    expect(bhMove(2, 'java').play.status).toBe('lost');
  });

  it('la vista pública no filtra la solución', () => {
    const text = JSON.stringify(bhPublicView());
    for (const secret of ['bug_line', 'bug_type', '"fix"', 'failing_test', 'explanation']) {
      expect(text).not.toContain(secret);
    }
  });
});
