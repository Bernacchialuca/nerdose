import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';

import { createRoles, migrateAsOwner } from '../src/testing';

declare module 'vitest' {
  export interface ProvidedContext {
    adminUrl: string;
    ownerUrl: string;
    apiUrl: string;
    generatorUrl: string;
  }
}

let container: Awaited<ReturnType<PostgreSqlContainer['start']>> | undefined;

export async function setup({ provide }: TestProject) {
  try {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(
      `Los tests de integración de @nerdose/db necesitan Docker en marcha (Testcontainers): ${detail}`,
      { cause },
    );
  }
  const adminUrl = container.getConnectionUri();
  const urls = await createRoles(adminUrl);
  await migrateAsOwner(urls.owner);
  provide('adminUrl', adminUrl);
  provide('ownerUrl', urls.owner);
  provide('apiUrl', urls.api);
  provide('generatorUrl', urls.generator);
}

export async function teardown() {
  await container?.stop();
}
