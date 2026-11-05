import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { IdentityRepository } from '@/domain/identity/identity.repository';

import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
const repo = new IdentityRepository(dbs.api.db);

beforeAll(() => dbs.reset());
afterAll(() => dbs.close());

describe('IdentityRepository (rol nerdose_api)', () => {
  it('create, touch y updatePreferences', async () => {
    const created = await repo.create({ locale: 'en', preferredCodeLanguage: 'js' });
    expect(created.userId).toBeNull();
    const touched = await repo.touch(created.id);
    expect(touched!.lastSeenAt.getTime()).toBeGreaterThanOrEqual(created.createdAt.getTime());
    const updated = await repo.updatePreferences(created.id, { preferredCodeLanguage: 'go' });
    expect(updated).toMatchObject({ locale: 'en', preferredCodeLanguage: 'go' });
    expect(await repo.touch(randomUUID())).toBeNull();
    expect(await repo.updatePreferences(randomUUID(), { locale: 'es' })).toBeNull();
  });

  it('findById existente e inexistente', async () => {
    const player = await dbs.insertPlayer();
    expect((await repo.findById(player.id))?.id).toBe(player.id);
    expect(await repo.findById(randomUUID())).toBeNull();
  });

  it('un patch vacío devuelve la fila sin cambios', async () => {
    const player = await dbs.insertPlayer({ locale: 'en' });
    expect((await repo.updatePreferences(player.id, {}))?.locale).toBe('en');
  });
});
