import { describe, expect, it } from 'vitest';
import { readRunnerEnv } from '../../src/config/env';
import { buildChildEnv } from '../../src/runner/child-env';
import { resolveRunAs } from '../../src/runner/run-as';

describe('readRunnerEnv', () => {
  it('returns ids only when both are positive integers', () => {
    expect(readRunnerEnv({ RUNNER_UID: '1001', RUNNER_GID: '1002' })).toEqual({
      uid: 1001,
      gid: 1002,
    });
    expect(readRunnerEnv({ RUNNER_UID: '1001' })).toBeNull();
    expect(readRunnerEnv({ RUNNER_UID: '0', RUNNER_GID: '1' })).toBeNull();
    expect(readRunnerEnv({ RUNNER_UID: '-1', RUNNER_GID: '1' })).toBeNull();
    expect(readRunnerEnv({ RUNNER_UID: '1.5', RUNNER_GID: '1' })).toBeNull();
  });
});

describe('buildChildEnv', () => {
  it('copies only the minimal variables (TS-22)', () => {
    expect(
      buildChildEnv({
        PATH: '/usr/bin',
        HOME: '/home/gen',
        GOCACHE: '/cache/go',
        DATABASE_URL: 'postgres://x',
        GENERATOR_SECRET: 's3cr3t',
        RUNNER_UID: '1001',
      }),
    ).toStrictEqual({ PATH: '/usr/bin', HOME: '/home/gen', GOCACHE: '/cache/go' });
  });
});

describe('resolveRunAs (TS-23)', () => {
  it('resolves the user', () => {
    expect(resolveRunAs({ uid: 1000, env: {} })).toEqual({ kind: 'current' });
    expect(resolveRunAs({ uid: 0, env: { RUNNER_UID: '1001', RUNNER_GID: '1001' } })).toEqual({
      kind: 'as',
      uid: 1001,
      gid: 1001,
    });
    expect(resolveRunAs({ uid: 0, env: {} })).toEqual({ kind: 'refuse' });
    expect(resolveRunAs({ uid: 0, env: { RUNNER_UID: '1001' } })).toEqual({ kind: 'refuse' });
    expect(resolveRunAs({ uid: 0, env: { RUNNER_UID: '0', RUNNER_GID: '0' } })).toEqual({
      kind: 'refuse',
    });
    expect(resolveRunAs({ uid: 0, env: { RUNNER_UID: 'abc', RUNNER_GID: '1001' } })).toEqual({
      kind: 'refuse',
    });
    expect(resolveRunAs({ uid: undefined, env: {} })).toEqual({ kind: 'current' });
  });
});
