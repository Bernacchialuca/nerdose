import { describe, expect, it } from 'vitest';

import { turboDryRun, type TurboDryRunTask } from './helpers/turbo';

const NONEXISTENT = '<NONEXISTENT>';
const EXPECTED_COMMANDS: Record<string, string> = {
  'admin#dev': 'vite',
  'api#dev': 'tsx watch src/index.ts',
  'generator#dev': 'tsx watch src/index.ts',
  'web#dev': 'vite',
};

describe('turbo run dev', () => {
  const tasks = turboDryRun('dev').tasks;
  const running: TurboDryRunTask[] = tasks.filter((task) => task.command !== NONEXISTENT);

  it('runs exactly the four apps', () => {
    expect(running.map((task) => task.taskId).sort()).toEqual(['admin#dev', 'api#dev', 'generator#dev', 'web#dev']);
  });

  it('runs each app task as persistent and uncached', () => {
    for (const task of running) {
      expect(task.resolvedTaskDefinition.persistent, task.taskId).toBe(true);
      expect(task.resolvedTaskDefinition.cache, task.taskId).toBe(false);
    }
  });

  it('uses the expected command per app', () => {
    expect(Object.fromEntries(running.map((task) => [task.taskId, task.command]))).toEqual(EXPECTED_COMMANDS);
  });

  it('does not run anything for packages without a dev script', () => {
    const packages = tasks.filter((task) => task.taskId.startsWith('@nerdose/'));
    expect(packages.length).toBeGreaterThan(0);
    for (const task of packages) {
      expect(task.command, task.taskId).toBe(NONEXISTENT);
    }
  });
});
