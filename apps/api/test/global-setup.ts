import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { createRoles, migrateAsOwner } from '@nerdose/db/testing';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    ownerUrl: string;
    apiUrl: string;
  }
}

let container: Awaited<ReturnType<PostgreSqlContainer['start']>> | undefined;

export async function setup({ provide }: TestProject) {
  try {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(
      `Los tests de integración de api necesitan Docker en marcha (Testcontainers): ${detail}`,
      { cause },
    );
  }
  const urls = await createRoles(container.getConnectionUri());
  await migrateAsOwner(urls.owner);
  provide('ownerUrl', urls.owner);
  provide('apiUrl', urls.api);
}

export async function teardown() {
  await container?.stop();
}
