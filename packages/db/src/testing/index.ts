import { randomBytes } from 'node:crypto';

import postgres, { type Sql } from 'postgres';

import { createDb, type Db } from '../client';
import {
  challenges,
  players,
  type Challenge,
  type NewChallenge,
  type NewPlayer,
  type Player,
} from '../schema';
import { runMigrations } from '../migrations/run-migrations';

const password = () => randomBytes(18).toString('base64url');

function withCredentials(base: string, user: string, pass: string): string {
  const url = new URL(base);
  url.username = user;
  url.password = encodeURIComponent(pass);
  return url.toString();
}

async function execFormatted(sql: Sql, template: string, ...args: string[]) {
  // CREATE/ALTER ROLE y OWNER TO no admiten parámetros ligados ni los expresa Drizzle: format() arma la sentencia.
  const [row] = await sql<
    { stmt: string }[]
  >`SELECT format(${template}::text, VARIADIC ${args}::text[]) AS stmt`;
  await sql.unsafe(row!.stmt);
}

export async function createRoles(
  adminUri: string,
): Promise<{ owner: string; api: string; generator: string }> {
  const ownerPass = password();
  const apiPass = password();
  const generatorPass = password();
  const database = decodeURIComponent(new URL(adminUri).pathname.slice(1));

  const admin = postgres(adminUri, { max: 1 });
  try {
    await execFormatted(
      admin,
      'CREATE ROLE %I LOGIN CREATEROLE NOSUPERUSER PASSWORD %L',
      'nerdose_owner',
      ownerPass,
    );
    await execFormatted(admin, 'ALTER DATABASE %I OWNER TO %I', database, 'nerdose_owner');
    await admin.unsafe('ALTER SCHEMA public OWNER TO nerdose_owner');
  } finally {
    await admin.end();
  }

  const ownerUrl = withCredentials(adminUri, 'nerdose_owner', ownerPass);
  // Creados por el dueño (CREATEROLE) para que obtenga ADMIN OPTION y pueda hacer ALTER ROLE ... PASSWORD.
  const owner = postgres(ownerUrl, { max: 1 });
  try {
    await execFormatted(owner, 'CREATE ROLE %I LOGIN PASSWORD %L', 'nerdose_api', apiPass);
    await execFormatted(
      owner,
      'CREATE ROLE %I LOGIN PASSWORD %L',
      'nerdose_generator',
      generatorPass,
    );
  } finally {
    await owner.end();
  }

  return {
    owner: ownerUrl,
    api: withCredentials(adminUri, 'nerdose_api', apiPass),
    generator: withCredentials(adminUri, 'nerdose_generator', generatorPass),
  };
}

export async function migrateAsOwner(url: string): Promise<void> {
  const { db, sql } = createDb(url, { max: 1 });
  try {
    await runMigrations(db);
  } finally {
    await sql.end();
  }
}

export async function truncateAll(owner: { sql: Sql }): Promise<void> {
  const { sql } = owner;
  // TRUNCATE no admite parámetros ligados ni lo expresa Drizzle: format('%I') escapa cada identificador.
  const [row] = await sql<{ stmt: string | null }[]>`
    SELECT 'TRUNCATE TABLE ' || string_agg(format('%I', tablename), ', ') || ' RESTART IDENTITY CASCADE' AS stmt
    FROM pg_tables WHERE schemaname = 'public'`;
  if (row?.stmt) await sql.unsafe(row.stmt);
}

export async function makePlayer(db: Db, overrides: Partial<NewPlayer> = {}): Promise<Player> {
  const [row] = await db
    .insert(players)
    .values({ ...overrides })
    .returning();
  return row!;
}

export async function makeChallenge(
  db: Db,
  values: Pick<NewChallenge, 'gameId' | 'date'> & Partial<NewChallenge>,
): Promise<Challenge> {
  const [row] = await db
    .insert(challenges)
    .values({
      status: 'published',
      number: 1,
      payload: {},
      generatorVersion: 'test',
      seed: 'test',
      attempt: 0,
      ...values,
    })
    .returning();
  return row!;
}
