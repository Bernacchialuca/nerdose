import { afterEach, describe, expect, it, vi } from 'vitest';

import { withTimeout } from '@/shared/with-timeout';

describe('withTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resuelve antes del límite sin dejar timers', async () => {
    vi.useFakeTimers();
    await expect(withTimeout(Promise.resolve('ok'), 2000)).resolves.toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rechaza al vencer', async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise(() => {}), 2000);
    const assertion = expect(result).rejects.toThrow('Timed out after 2000 ms');
    vi.advanceTimersByTime(2000);
    await assertion;
  });
});
