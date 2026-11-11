import { describe, expect, it } from 'vitest';

import { ApiError } from './api-client';
import { isApiError } from './api-errors';

describe('isApiError', () => {
  it('reconoce ApiError y filtra por código (TS-8)', () => {
    expect(isApiError(new ApiError(409, 'not_voidable', 'x'), 'not_voidable')).toBe(true);
    expect(isApiError(new ApiError(409, 'not_voidable', 'x'), 'report_not_open')).toBe(false);
    expect(isApiError(new ApiError(409, 'not_voidable', 'x'))).toBe(true);
    expect(isApiError(new Error())).toBe(false);
  });
});
