import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

import { loadMigrateEnv } from '../src/config/env';
import { describeMigrateError } from '../src/migrations/describe-error';
import { migrateDatabase } from '../src/migrations/migrate-database';

try {
  if (process.env.NODE_ENV !== 'test') {
    config({ path: fileURLToPath(new URL('../.env.local', import.meta.url)), quiet: true });
  }
  const env = loadMigrateEnv(process.env);
  const { synced } = await migrateDatabase(env);
  console.log('Migraciones aplicadas.');
  for (const role of synced) console.log(`Credenciales sincronizadas: ${role}`);
} catch (error) {
  console.error(describeMigrateError(error));
  process.exitCode = 1;
}
