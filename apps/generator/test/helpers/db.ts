import { createDb } from '@nerdose/db';
import { truncateAll } from '@nerdose/db/testing';
import { inject } from 'vitest';

export type TestDb = ReturnType<typeof setupTestDb>;

export function setupTestDb() {
  const owner = createDb(inject('ownerUrl'), { max: 2 });
  const svc = createDb(inject('generatorUrl'), { max: 5 });
  return {
    owner,
    svc,
    reset: () => truncateAll(owner),
    async cleanup() {
      await Promise.all([owner.sql.end(), svc.sql.end()]);
    },
  };
}
