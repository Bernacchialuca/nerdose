import { describe, expect, it } from 'vitest';

import { codeLines, notesByLine } from './lines';
import { CODE } from './test-fixtures';

describe('lines (TS-15)', () => {
  it('splits code into lines', () => {
    const lines = codeLines(CODE.go);
    expect(lines).toHaveLength(9);
    expect(lines[2]).toBe('\tfor i := 0; i < n; i++ {');
  });

  it('indexes notes by line', () => {
    const notes = notesByLine([
      { line: 3, text: 'n veces' },
      { line: 4, text: 'log n veces' },
    ]);
    expect(notes.get(3)).toBe('n veces');
    expect(notes.get(4)).toBe('log n veces');
    expect(notes.get(1)).toBeUndefined();
  });
});
