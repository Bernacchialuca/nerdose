import { describe, expect, it } from 'vitest';

import { payloadSchema } from '../definition/schemas';

import { payloadFix, previewLineMarks, resultLineMarks } from './marks';
import { parseResult } from './parse';
import { PREVIEW_PAYLOAD, RESULT_LOST_GO_ES, RESULT_WON_JAVA_ES } from './test-fixtures';

describe('line marks (TS-12)', () => {
  it('won marks only the bug line as found', () => {
    const marks = resultLineMarks(parseResult(RESULT_WON_JAVA_ES));
    expect(marks.size).toBe(1);
    expect(marks.get(4)).toBe('found');
  });

  it('lost marks the bug and the wrong pick', () => {
    const marks = resultLineMarks(parseResult(RESULT_LOST_GO_ES));
    expect(marks.size).toBe(2);
    expect(marks.get(4)).toBe('bug');
    expect(marks.get(5)).toBe('wrong');
  });

  it('preview marks the bug line', () => {
    const marks = previewLineMarks(payloadSchema.parse(PREVIEW_PAYLOAD));
    expect(marks.size).toBe(1);
    expect(marks.get(4)).toBe('bug');
  });

  it('payloadFix pairs the buggy line with the fixed one', () => {
    expect(payloadFix(payloadSchema.parse(PREVIEW_PAYLOAD), 'go')).toEqual({
      before: '\t\tif nums[i] >= nums[best] {',
      after: '\t\tif nums[i] > nums[best] {',
    });
  });
});
