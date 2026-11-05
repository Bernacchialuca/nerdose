import { randomUUID } from 'node:crypto';

import { AppError } from '@nerdose/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
const service = dbs.identity();

beforeAll(() => dbs.reset());
afterAll(() => dbs.close());

describe('IdentityService', () => {
  it('startSession crea con pid ausente, usando Accept-Language', async () => {
    const r = await service.startSession({ pid: undefined, acceptLanguage: 'en-US' });
    expect(r.created).toBe(true);
    expect(r.player).toMatchObject({ locale: 'en', preferredCodeLanguage: 'js' });
  });

  it('startSession crea con pid inválido o huérfano', async () => {
    expect((await service.startSession({ pid: 'xyz', acceptLanguage: undefined })).created).toBe(
      true,
    );
    const orphan = randomUUID();
    const r = await service.startSession({ pid: orphan, acceptLanguage: 'pt-BR' });
    expect(r.created).toBe(true);
    expect(r.player.id).not.toBe(orphan);
    expect(r.player.locale).toBe('es');
  });

  it('startSession con pid existente no crea y conserva las preferencias', async () => {
    const p = await dbs.insertPlayer({
      locale: 'en',
      preferredCodeLanguage: 'go',
      lastSeenAt: new Date('2026-01-01T00:00:00Z'),
    });
    const r = await service.startSession({ pid: p.id, acceptLanguage: 'es' });
    expect(r.created).toBe(false);
    expect(r.player).toMatchObject({ id: p.id, locale: 'en', preferredCodeLanguage: 'go' });
    expect(r.player.lastSeenAt.getTime()).toBeGreaterThan(new Date('2026-01-01').getTime());
  });

  it('find devuelve null para ausente o no UUID', async () => {
    expect(await service.find(undefined)).toBeNull();
    expect(await service.find('xyz')).toBeNull();
  });

  it('updatePreferences parcial y no_session si el Player no existe', async () => {
    const p = await dbs.insertPlayer({ locale: 'es', preferredCodeLanguage: 'js' });
    const updated = await service.updatePreferences(p.id, { preferredCodeLanguage: 'java' });
    expect(updated).toMatchObject({ locale: 'es', preferredCodeLanguage: 'java' });
    await expect(service.updatePreferences(randomUUID(), { locale: 'en' })).rejects.toBeInstanceOf(
      AppError,
    );
  });
});
