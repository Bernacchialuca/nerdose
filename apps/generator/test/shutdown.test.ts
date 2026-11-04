import { afterEach, describe, expect, inject, it, vi } from 'vitest';

import { createDatabase } from '@/infra/database/db';
import { startScheduler } from '@/scheduler/scheduler';
import { createShutdownHandler } from '@/shared/shutdown';

import { captureLogger } from './helpers/logger';

afterEach(() => {
  vi.useRealTimers();
});

describe('createShutdownHandler', () => {
  it('aborta, detiene, cierra la base, loguea y sale con 0', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const { logger, lines } = captureLogger();
    const controller = new AbortController();
    const scheduler = startScheduler({ logger });
    const { sql } = createDatabase(inject('generatorUrl'));
    await sql`SELECT 1`;
    const exit = vi.fn();
    await createShutdownHandler({ logger, controller, scheduler, sql, exit })();
    expect(controller.signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    await expect(sql`SELECT 1`).rejects.toBeDefined();
    expect(lines()).toContainEqual(expect.objectContaining({ level: 'info', msg: 'Shutdown complete' }));
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('es idempotente', async () => {
    const { logger, lines } = captureLogger();
    const controller = new AbortController();
    const scheduler = startScheduler({ logger });
    const { sql } = createDatabase(inject('generatorUrl'));
    const stop = vi.spyOn(scheduler, 'stop');
    const end = vi.spyOn(sql, 'end');
    const exit = vi.fn();
    const h = createShutdownHandler({ logger, controller, scheduler, sql, exit });
    await Promise.all([h(), h()]);
    await h();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
    expect(lines().filter((l) => l.msg === 'Shutdown complete')).toHaveLength(1);
  });

  it('si sql.end falla, lo loguea y sale con 0', async () => {
    const { logger, lines } = captureLogger();
    const scheduler = { stop: vi.fn() };
    const exit = vi.fn();
    await createShutdownHandler({
      logger,
      controller: new AbortController(),
      scheduler,
      sql: { end: () => Promise.reject(new Error('close failed')) },
      exit,
    })();
    const all = lines();
    expect(all).toContainEqual(
      expect.objectContaining({ level: 'error', msg: 'Database close failed', err: expect.anything() }),
    );
    expect(all.at(-1)).toMatchObject({ msg: 'Shutdown complete' });
    expect(exit).toHaveBeenCalledWith(0);
  });
});
