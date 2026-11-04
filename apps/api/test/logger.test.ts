import { describe, expect, it } from 'vitest';

import { captureLogger } from './helpers/logger';

describe('createLogger', () => {
  it('emite JSON con base, hora ISO y redacción', () => {
    const { logger, lines } = captureLogger();
    logger.info({ password: 'p' }, 'x');
    const [line] = lines();
    expect(line).toMatchObject({ level: 'info', service: 'api', env: 'test', password: '[REDACTED]', msg: 'x' });
    expect(new Date(String(line?.time)).toISOString()).toBe(line?.time);
  });
});
