import { spawnSync } from 'node:child_process';

import { REPO_ROOT } from './repo';

export interface ComposeService {
  image: string;
  environment: Record<string, string>;
  ports?: { mode: string; host_ip?: string; target: number; published: string; protocol: string }[];
  volumes?: Record<string, unknown>[];
  healthcheck?: { test: string[]; interval: string; retries: number };
}

export interface ComposeConfig {
  services: Record<string, ComposeService>;
  volumes?: Record<string, unknown>;
}

export interface ComposeConfigOptions {
  interpolate?: boolean;
  /** Compose file relative to the repo root. */
  file?: string;
}

/** Runs `docker compose config` and returns the normalized configuration. */
export function composeConfig(options: ComposeConfigOptions = {}): ComposeConfig {
  const { interpolate = true, file = 'compose.yaml' } = options;
  const args = ['compose', '-f', file, 'config', '--format', 'json', ...(interpolate ? [] : ['--no-interpolate'])];
  const result = spawnSync('docker', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, POSTGRES_PASSWORD: 'compose-test' },
  });
  if (result.error !== undefined || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr;
    throw new Error(`docker compose config failed: ${detail}`);
  }
  return JSON.parse(result.stdout) as ComposeConfig;
}
