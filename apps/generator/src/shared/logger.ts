import pino from 'pino';

import type { GeneratorEnv } from '@/config/env';

export function createLogger(
  env: Pick<GeneratorEnv, 'LOG_LEVEL' | 'SERVICE_NAME' | 'NODE_ENV'>,
  destination?: pino.DestinationStream,
) {
  const options: pino.LoggerOptions = {
    level: env.LOG_LEVEL,
    base: { service: env.SERVICE_NAME, env: env.NODE_ENV },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.token',
        '*.refreshToken',
        '*.apiKey',
        'password',
      ],
      censor: '[REDACTED]',
    },
    transport:
      env.NODE_ENV === 'development' && !destination
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  };
  return destination ? pino(options, destination) : pino(options);
}
