import type { ToolchainReport } from '@nerdose/polyglot';
import { describe, expect, it } from 'vitest';

import { warnMissingToolchains } from '@/infra/toolchains/warn-missing-toolchains';

import { captureLogger } from '../helpers/logger';

const report = (go: boolean, java: boolean): ToolchainReport => ({
  js: { ok: true, version: 'v24.22.2' },
  go: go ? { ok: true, version: 'go version go1.26.0 linux/amd64' } : { ok: false, version: null },
  java: java ? { ok: true, version: 'openjdk version "21.0.10"' } : { ok: false, version: null },
});

describe('warnMissingToolchains', () => {
  it('con los toolchains presentes no emite warn', async () => {
    const { logger, lines } = captureLogger();
    await expect(warnMissingToolchains(logger, async () => report(true, true))).resolves.toBe(
      undefined,
    );
    expect(
      lines().filter(
        (l) => l.msg === 'Toolchain missing at startup' || l.msg === 'Toolchain check failed',
      ),
    ).toEqual([]);
  });

  it('no reporta js aunque no esté ok (es el propio proceso)', async () => {
    const { logger, lines } = captureLogger();
    await warnMissingToolchains(logger, async () => ({
      ...report(true, true),
      js: { ok: false, version: null },
    }));
    expect(lines().filter((l) => l.level === 'warn')).toEqual([]);
  });

  it('si el chequeo falla avisa y no rechaza', async () => {
    const { logger, lines } = captureLogger();
    await expect(
      warnMissingToolchains(logger, () => Promise.reject(new Error('probe_boom'))),
    ).resolves.toBe(undefined);
    expect(lines()).toContainEqual(
      expect.objectContaining({
        level: 'warn',
        msg: 'Toolchain check failed',
        err: expect.objectContaining({ message: 'probe_boom' }),
      }),
    );
  });
});
