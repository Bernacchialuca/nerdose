import { createDb } from '../client';
import type { MigrateEnv } from '../config/env';
import { runMigrations } from './run-migrations';
import { syncRolePasswords } from './sync-role-passwords';

export async function migrateDatabase(env: MigrateEnv) {
  const { db, sql } = createDb(env.DATABASE_URL_OWNER, { max: 1 });
  try {
    await runMigrations(db);
    const synced = await syncRolePasswords(sql, {
      api: env.DATABASE_URL_API,
      generator: env.DATABASE_URL_GENERATOR,
    });
    return { synced };
  } finally {
    await sql.end({ timeout: 5 });
  }
}
