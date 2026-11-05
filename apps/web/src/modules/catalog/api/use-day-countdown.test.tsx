import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDayCountdown } from './use-day-countdown';

const advance = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

function setup(initial: { s: number; at: number }) {
  const queryClient = new QueryClient();
  const spy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const hook = renderHook(({ s, at }) => useDayCountdown(s, at), {
    wrapper,
    initialProps: initial,
  });
  return { ...hook, spy };
}

describe('useDayCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
    });
    vi.setSystemTime(new Date('2026-12-01T23:59:50Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('TS-18: descuenta desde la respuesta', async () => {
    const { result } = setup({ s: 10, at: Date.now() });
    expect(result.current).toBe(10);
    await advance(3000);
    expect(result.current).toBe(7);
  });

  it('TS-19: re-sincroniza con cada respuesta', async () => {
    const { result, rerender } = setup({ s: 10, at: Date.now() });
    await advance(3000);
    rerender({ s: 500, at: Date.now() });
    expect(result.current).toBe(500);
  });

  it('TS-20 y TS-21: espera el jitter y recarga una sola vez', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { result, spy } = setup({ s: 10, at: Date.now() });
    await advance(10000);
    expect(result.current).toBe(0);
    await advance(1499);
    expect(spy).not.toHaveBeenCalled();
    await advance(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ queryKey: ['today'] });
    await advance(10000);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('TS-22: jitter máximo y mínimo', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    const max = setup({ s: 0, at: Date.now() });
    await advance(2999);
    expect(max.spy).not.toHaveBeenCalled();
    await advance(1);
    expect(max.spy).toHaveBeenCalledTimes(1);
    max.unmount();

    vi.spyOn(Math, 'random').mockReturnValue(0);
    const min = setup({ s: 0, at: Date.now() });
    await advance(0);
    expect(min.spy).toHaveBeenCalledTimes(1);
  });

  it('TS-23: cancela al desmontar', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { spy, unmount } = setup({ s: 1, at: Date.now() });
    await advance(1000);
    unmount();
    await advance(3000);
    expect(spy).not.toHaveBeenCalled();
  });
});
