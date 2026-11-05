import { randomUUID } from 'node:crypto';

import { players } from '@nerdose/db';
import { createDb } from '@nerdose/db';
import { truncateAll } from '@nerdose/db/testing';
import { inject } from 'vitest';

import { IdentityRepository } from '@/domain/identity/identity.repository';
import { IdentityService } from '@/domain/identity/identity.service';

export function useDatabases() {
  const owner = createDb(inject('ownerUrl'), { max: 2 });
  const api = createDb(inject('apiUrl'), { max: 4 });
  return {
    owner,
    api,
    identity: () => new IdentityService(new IdentityRepository(api.db)),
    reset: () => truncateAll(owner),
    close: async () => {
      await Promise.all([owner.sql.end({ timeout: 0 }), api.sql.end({ timeout: 0 })]);
    },
    insertPlayer: async (values: Partial<typeof players.$inferInsert> = {}) => {
      const [row] = await owner.db
        .insert(players)
        .values({ id: randomUUID(), ...values })
        .returning();
      return row!;
    },
  };
}

export function parseSetCookie(header: string | null) {
  if (!header) return null;
  const [pair = '', ...attrs] = header.split(';').map((p) => p.trim());
  const [name, value] = pair.split('=');
  return {
    name,
    value,
    attrs: attrs.map((a) => a.toLowerCase()).sort(),
  };
}

export const COOKIE_ATTRS = ['httponly', 'max-age=34560000', 'path=/', 'samesite=lax', 'secure'];
