import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DESKTOP_MEDIA_QUERY } from '@/lib/breakpoints';
import { mockViewport } from '@/test/viewport';

import { useMediaQuery } from './use-media-query';

describe('useMediaQuery', () => {
  it('devuelve false sin matchMedia', () => {
    // @ts-expect-error simula un entorno sin matchMedia
    window.matchMedia = undefined;
    const { result } = renderHook(() => useMediaQuery(DESKTOP_MEDIA_QUERY));
    expect(result.current).toBe(false);
  });

  it('devuelve true en desktop', () => {
    mockViewport('desktop');
    const { result } = renderHook(() => useMediaQuery(DESKTOP_MEDIA_QUERY));
    expect(result.current).toBe(true);
  });

  it('se re-renderiza al disparar change', () => {
    const vp = mockViewport('mobile');
    const { result } = renderHook(() => useMediaQuery(DESKTOP_MEDIA_QUERY));
    expect(result.current).toBe(false);
    act(() => {
      vp.setViewport('desktop');
    });
    expect(result.current).toBe(true);
  });
});
