import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const ENV_EXAMPLE_LINE = /^[A-Z][A-Z0-9_]*=$/;
const JS_SOURCE = /^(apps|packages)\/.*\.(js|jsx|mjs|cjs)$/;
const TOOL_CONFIG = /\.config\.(js|mjs|cjs)$/;

/** Tracked and untracked-but-not-ignored files, so tests work before the first commit. */
export function listRepoFiles(): string[] {
  const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return output.split('\n').filter((line) => line !== '');
}

/** `--no-index` makes the answer depend only on .gitignore rules, even for missing or tracked paths. */
export function isIgnored(path: string): boolean {
  return (
    spawnSync('git', ['check-ignore', '--no-index', '-q', path], { cwd: REPO_ROOT }).status === 0
  );
}

export function findEnvExampleViolations(content: string): string[] {
  return content
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('#'))
    .filter((line) => !ENV_EXAMPLE_LINE.test(line));
}

export function findJsSourceFiles(paths: string[]): string[] {
  return paths.filter((path) => JS_SOURCE.test(path) && !TOOL_CONFIG.test(path));
}
