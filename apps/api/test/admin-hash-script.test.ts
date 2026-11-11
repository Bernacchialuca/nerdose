import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { verifyPassword } from '@/domain/admin/admin-auth';

const CWD = fileURLToPath(new URL('..', import.meta.url));
const run = (input: string) =>
  spawnSync(process.execPath, ['--import', 'tsx', 'scripts/admin-hash.ts'], {
    cwd: CWD,
    input,
    encoding: 'utf8',
    env: { PATH: process.env.PATH },
    timeout: 60_000,
  });

describe('script admin:hash', () => {
  // TS-40
  it('imprime una línea con el hash de la contraseña de stdin', async () => {
    const result = run('nerdose-admin-test\n');
    expect(result.status).toBe(0);
    const line = result.stdout.trimEnd();
    expect(line).toMatch(/^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(line.split('\n')).toHaveLength(1);
    expect(await verifyPassword('nerdose-admin-test', line)).toBe(true);
    expect(result.stdout).not.toContain('nerdose-admin-test');
  });

  it('stdin vacío: exit 1 y nada en stdout', () => {
    const result = run('');
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).not.toBe('');
  });
});
