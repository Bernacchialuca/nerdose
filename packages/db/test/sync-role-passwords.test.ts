import { AppError } from '@nerdose/core';
import { afterAll, afterEach, describe, expect, inject, it } from 'vitest';

import { syncRolePasswords } from '../src/migrations/sync-role-passwords';
import { connectAs, withUser } from './helpers';

const apiUrl = inject('apiUrl');
const generatorUrl = inject('generatorUrl');
const owner = connectAs(inject('ownerUrl'));

const currentUser = async (url: string) => {
  const sql = connectAs(url);
  try {
    const rows = await sql`SELECT current_user AS role`;
    return rows.map((r) => ({ ...r }));
  } finally {
    await sql.end();
  }
};

afterEach(async () => {
  await syncRolePasswords(owner, { api: apiUrl, generator: generatorUrl });
});
afterAll(async () => {
  await owner.end();
});

describe('syncRolePasswords', () => {
  it('TS-11: syncs the nerdose_api password', async () => {
    const next = withUser(apiUrl, 'nerdose_api', 'nueva-api-1');
    await expect(syncRolePasswords(owner, { api: next })).resolves.toEqual(['nerdose_api']);
    expect(await currentUser(next)).toEqual([{ role: 'nerdose_api' }]);
  });

  it('TS-12: syncs both passwords', async () => {
    const a = withUser(apiUrl, 'nerdose_api', 'a-2');
    const g = withUser(generatorUrl, 'nerdose_generator', 'g-2');
    await expect(syncRolePasswords(owner, { api: a, generator: g })).resolves.toEqual([
      'nerdose_api',
      'nerdose_generator',
    ]);
    expect(await currentUser(a)).toEqual([{ role: 'nerdose_api' }]);
    expect(await currentUser(g)).toEqual([{ role: 'nerdose_generator' }]);
  });

  it('TS-13: rejects a wrong user without leaking the password', async () => {
    const bad = 'postgres://nerdose_generator:x@127.0.0.1:5432/nerdose';
    const error = await syncRolePasswords(owner, { api: bad }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      code: 'validation_error',
      message: 'DATABASE_URL_API debe usar el usuario nerdose_api (recibido: nerdose_generator)',
    });
    expect((error as Error).message).not.toContain('x@');
    expect(await currentUser(apiUrl)).toEqual([{ role: 'nerdose_api' }]);
  });

  it('TS-14: validates everything before any ALTER', async () => {
    const would = withUser(apiUrl, 'nerdose_api', 'no-aplica');
    await expect(
      syncRolePasswords(owner, {
        api: would,
        generator: 'postgres://nerdose_api:y@h:5432/nerdose',
      }),
    ).rejects.toMatchObject({
      code: 'validation_error',
      message:
        'DATABASE_URL_GENERATOR debe usar el usuario nerdose_generator (recibido: nerdose_api)',
    });
    await expect(currentUser(would)).rejects.toMatchObject({ code: '28P01' });
    expect(await currentUser(apiUrl)).toEqual([{ role: 'nerdose_api' }]);
  });

  it('TS-15: rejects a URL without password', async () => {
    await expect(
      syncRolePasswords(owner, { api: 'postgres://nerdose_api@127.0.0.1:5432/nerdose' }),
    ).rejects.toMatchObject({
      code: 'validation_error',
      message: 'DATABASE_URL_API no tiene contraseña',
    });
  });

  it('TS-16: nothing to sync', async () => {
    await expect(syncRolePasswords(owner, {})).resolves.toEqual([]);
  });

  it('TS-17: handles special characters in the password', async () => {
    const special = withUser(apiUrl, 'nerdose_api', "it's p@ss:w/rd%");
    await expect(syncRolePasswords(owner, { api: special })).resolves.toEqual(['nerdose_api']);
    expect(await currentUser(special)).toEqual([{ role: 'nerdose_api' }]);
  });

  it('TS-18: is repeatable', async () => {
    await expect(syncRolePasswords(owner, { api: apiUrl })).resolves.toEqual(['nerdose_api']);
    await expect(syncRolePasswords(owner, { api: apiUrl })).resolves.toEqual(['nerdose_api']);
    expect(await currentUser(apiUrl)).toEqual([{ role: 'nerdose_api' }]);
  });
});
