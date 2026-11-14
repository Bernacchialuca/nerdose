import { BIG_O_OPTIONS } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { payloadSchema } from '../definition/schemas';

import { previewMarks, resultMarks } from './options';
import { parseResult } from './parse';
import {
  PREVIEW_PAYLOAD,
  PREVIEW_PAYLOAD_PLAIN,
  RESULT_LOST_GO_ES,
  RESULT_WON_JAVA_ES,
} from './test-fixtures';

describe('resultMarks', () => {
  it('marks a win (TS-10)', () => {
    const marks = resultMarks(parseResult(RESULT_WON_JAVA_ES));
    expect(marks.map((m) => m.option)).toEqual([...BIG_O_OPTIONS]);
    expect(marks[3]).toEqual({
      option: 'o_n_log_n',
      label: 'O(n log n)',
      correct: true,
      chosen: true,
    });
    expect(marks.filter((m, i) => i !== 3 && (m.correct || m.chosen))).toHaveLength(0);
    expect(marks[4]?.label).toBe('O(n²)');
  });

  it('marks a loss (TS-11)', () => {
    const marks = resultMarks(parseResult(RESULT_LOST_GO_ES));
    expect(marks[3]).toEqual({
      option: 'o_n_log_n',
      label: 'O(n log n)',
      correct: true,
      chosen: false,
    });
    expect(marks[4]).toEqual({ option: 'o_n2', label: 'O(n²)', correct: false, chosen: true });
  });
});

describe('previewMarks (TS-12)', () => {
  it('marks answer and trap', () => {
    const marks = previewMarks(payloadSchema.parse(PREVIEW_PAYLOAD));
    expect(marks[3]).toEqual({
      option: 'o_n_log_n',
      label: 'O(n log n)',
      correct: true,
      trap: false,
    });
    expect(marks[4]).toEqual({ option: 'o_n2', label: 'O(n²)', correct: false, trap: true });
  });

  it('has no trap when the recipe has none', () => {
    const marks = previewMarks(payloadSchema.parse(PREVIEW_PAYLOAD_PLAIN));
    expect(marks.some((m) => m.trap)).toBe(false);
    expect(marks[6]?.correct).toBe(true);
  });
});
