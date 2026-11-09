import { describe, expect, it } from 'vitest';

import { createJobTracker } from '@/scheduler/job-tracker';

describe('JobTracker', () => {
  it('idle espera a los jobs en curso', async () => {
    const tracker = createJobTracker();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    void tracker.track(pending);
    let idle = false;
    const waiting = tracker.idle().then(() => {
      idle = true;
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(idle).toBe(false);
    release();
    await waiting;
    expect(idle).toBe(true);
  });

  it('idle resuelve de inmediato sin jobs y tolera rechazos', async () => {
    const tracker = createJobTracker();
    await tracker.idle();
    const failing = tracker.track(Promise.reject(new Error('x')));
    await expect(failing).rejects.toThrow('x');
    await tracker.idle();
  });
});
