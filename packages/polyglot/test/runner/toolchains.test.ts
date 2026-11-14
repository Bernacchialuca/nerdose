import { describe, expect, it } from 'vitest';
import { requireToolchains } from '../integration/toolchains';
import { parseGoVersion, parseJavaMajor, parseNodeMajor } from '../../src/runner/toolchains';

describe('version parsing (TS-28)', () => {
  it('parses node, go and java versions', () => {
    expect(parseNodeMajor('v24.22.2')).toBe(24);
    expect(parseGoVersion('go version go1.26.0 linux/amd64')).toEqual({ major: 1, minor: 26 });
    expect(parseGoVersion('go version go1.24.3 linux/amd64')).toEqual({ major: 1, minor: 24 });
    expect(parseJavaMajor('openjdk version "21.0.10" 2026-01-20')).toBe(21);
    expect(parseJavaMajor('openjdk version "17.0.2" 2022-01-18')).toBe(17);
    expect(parseGoVersion('garbage')).toBeNull();
  });
});

describe('requireToolchains (TS-29)', () => {
  const ok = { ok: true, version: 'v24.22.2' };
  const java = { ok: true, version: 'openjdk version "21.0.10"' };
  const go = { ok: true, version: 'go version go1.26.0 linux/amd64' };

  it('names the missing toolchain', async () => {
    await expect(
      requireToolchains(async () => ({ js: ok, go: { ok: false, version: null }, java })),
    ).rejects.toThrow(
      new Error('Missing toolchain: go (Go >= 1.25 required, see README "Requisitos")'),
    );
  });

  it('names the wrong version', async () => {
    await expect(
      requireToolchains(async () => ({
        js: ok,
        go: { ok: true, version: 'go version go1.24.3 linux/amd64' },
        java,
      })),
    ).rejects.toThrow(
      new Error(
        'Wrong toolchain version: go (found go1.24.3, Go >= 1.25 required, see README "Requisitos")',
      ),
    );
  });

  it('resolves when the three are ok', async () => {
    await expect(requireToolchains(async () => ({ js: ok, go, java }))).resolves.toBeUndefined();
  });
});
