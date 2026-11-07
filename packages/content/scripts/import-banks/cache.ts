import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';

import { AppError } from '@nerdose/core';

export type CacheEntry = { status: number; body: unknown };

export type FileCache = {
  get(url: string): CacheEntry | undefined;
  set(url: string, entry: CacheEntry): void;
};

export function resolveCacheDir(option: string | undefined, repoRoot: string): string {
  if (option === undefined) return join(homedir(), '.cache', 'nerdose-content');
  const dir = resolve(option);
  const fromRepo = relative(resolve(repoRoot), dir);
  if (!fromRepo.startsWith('..') && !isAbsolute(fromRepo)) {
    throw new AppError(
      'validation_error',
      `--cache-dir debe estar fuera del repo (recibido: ${option})`,
    );
  }
  return dir;
}

export function createFileCache(dir: string): FileCache {
  const fileFor = (url: string): string =>
    join(dir, `${createHash('sha256').update(url).digest('hex')}.json`);
  return {
    get(url) {
      try {
        return JSON.parse(readFileSync(fileFor(url), 'utf8')) as CacheEntry;
      } catch {
        return undefined;
      }
    },
    set(url, entry) {
      mkdirSync(dir, { recursive: true });
      const file = fileFor(url);
      writeFileSync(`${file}.tmp`, JSON.stringify(entry));
      renameSync(`${file}.tmp`, file);
    },
  };
}
