import { Writable } from 'node:stream';

import { createLogger } from '@/shared/logger';

type LoggerEnv = Parameters<typeof createLogger>[0];

export function captureLogger(overrides: Partial<LoggerEnv> = {}) {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(String(chunk));
      callback();
    },
  });
  const logger = createLogger(
    { LOG_LEVEL: 'info', SERVICE_NAME: 'generator', NODE_ENV: 'test', ...overrides },
    stream,
  );
  return {
    logger,
    lines: (): Array<Record<string, unknown>> =>
      chunks
        .join('')
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => JSON.parse(line) as Record<string, unknown>),
  };
}
