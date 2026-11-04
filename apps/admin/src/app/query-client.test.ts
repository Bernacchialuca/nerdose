import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api-client';

import { queryClient } from './query-client';

describe('queryClient', () => {
  const defaults = queryClient.getDefaultOptions();
  const retry = defaults.queries?.retry as (n: number, e: unknown) => boolean;

  it('no reintenta errores 4xx', () => {
    expect(retry(0, new ApiError(401, 'unauthorized', 'x'))).toBe(false);
  });

  it('reintenta 5xx hasta 2 veces', () => {
    expect(retry(0, new ApiError(503, 'internal_error', 'x'))).toBe(true);
    expect(retry(2, new ApiError(503, 'internal_error', 'x'))).toBe(false);
  });

  it('reintenta errores de red', () => {
    expect(retry(0, new TypeError('Failed to fetch'))).toBe(true);
  });

  it('usa la política de cache de la convención', () => {
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.retry).toBe(false);
  });
});
