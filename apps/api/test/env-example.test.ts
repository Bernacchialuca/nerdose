import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('.env.example', () => {
  it('declara exactamente las variables de env.ts, sin valor y con comentario previo', () => {
    const lines = readFileSync(fileURLToPath(new URL('../.env.example', import.meta.url)), 'utf8')
      .split('\n')
      .filter((line) => line.trim() !== '');
    const names: string[] = [];
    lines.forEach((line, index) => {
      if (line.startsWith('#')) return;
      expect(line).toMatch(/^[A-Z_]+=$/);
      expect(lines[index - 1]?.startsWith('#')).toBe(true);
      names.push(line.slice(0, -1));
    });
    expect(names).toEqual([
      'NODE_ENV',
      'PORT',
      'LOG_LEVEL',
      'SERVICE_NAME',
      'DATABASE_URL',
      'LAUNCH_DATE',
      'WEB_ORIGIN',
      'ADMIN_ORIGIN',
      'ADMIN_PASSWORD_HASH',
      'ADMIN_JWT_SECRET',
      'TRUST_PROXY_HEADER',
      'REPORT_ALERT_COUNT',
      'REPORT_ALERT_RATIO',
      'REPORT_ALERT_RATIO_MIN_COUNT',
    ]);
  });
});
