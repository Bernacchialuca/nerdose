import { afterEach, describe, expect, it, vi } from 'vitest';

import { startScheduler } from '@/scheduler/scheduler';

import { captureLogger } from '../helpers/logger';

afterEach(() => {
  vi.useRealTimers();
});

describe('startScheduler', () => {
  it('con 0 jobs queda activo con un keep-alive', () => {
    vi.useFakeTimers();
    const { logger, lines } = captureLogger();
    const s = startScheduler({ logger });
    expect(lines()).toContainEqual(
      expect.objectContaining({ level: 'info', jobs: 0, msg: 'Scheduler started' }),
    );
    expect(vi.getTimerCount()).toBe(1);
    s.stop();
  });

  it('stop() libera el handle y es idempotente', () => {
    vi.useFakeTimers();
    const { logger } = captureLogger();
    const s = startScheduler({ logger });
    s.stop();
    expect(vi.getTimerCount()).toBe(0);
    expect(() => s.stop()).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('registra un job sin ejecutarlo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-01T00:00:00Z'));
    const { logger, lines } = captureLogger();
    const run = vi.fn();
    const s = startScheduler({ logger }, [{ name: 'probe', pattern: '0 0 1 1 *', run }]);
    expect(lines()).toContainEqual(expect.objectContaining({ jobs: 1, msg: 'Scheduler started' }));
    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(2);
    s.stop();
    expect(vi.getTimerCount()).toBe(0);
    expect(run).not.toHaveBeenCalled();
  });
});
