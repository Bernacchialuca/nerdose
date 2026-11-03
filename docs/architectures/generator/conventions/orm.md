---
id: orm
display_name: ORM / Acceso a base de datos (Drizzle)
language: node
description: Database access with Drizzle ORM and postgres.js, schema and migrations owned by @nerdose/db, one PostgreSQL role per service
applies_to: [api, worker, cli]
required_by: []
package: drizzle-orm
---

# ORM / Database Access (Node, Drizzle)

Typed database access with [Drizzle ORM](https://orm.drizzle.team) over the [postgres.js](https://github.com/porsager/postgres) driver. The schema, the migrations and the shared queries live in the `@nerdose/db` package; services only consume it. Service-local replacement of the catalog default (Prisma) per ADR-002 and ADR-004. All DB access is encapsulated behind a repository layer.

## When to use

- `api` and `generator`: both read and write `nerdose-db`.
- Any other Node service or script that touches the database must go through `@nerdose/db`.
- Not applicable to `web` and `admin`, which never access the database (ADR-003).

## Package

```
drizzle-orm         # runtime (schema DSL, query builder)
postgres            # runtime, postgres.js driver
drizzle-kit         # dev only, in @nerdose/db: generate migrations
```

## Structure

```
packages/db/
├── src/
│   ├── schema/                  # Drizzle schema, one file per table group
│   ├── client.ts                # createDb(url) factory (no singleton import side effects)
│   └── queries/                 # shared queries used by api and generator
├── migrations/                  # drizzle-kit SQL + manual SQL (partial indexes, triggers, views, GRANT)
└── drizzle.config.ts
apps/{service}/src/
├── infra/database/
│   └── db.ts                    # builds the service connection with its own role URL
└── domain/{module}/
    └── {module}.repository.ts   # repository per domain module
```

## Configuration

```ts
// apps/api/src/infra/database/db.ts  (generator: same file, same shape)
import { createDb } from '@nerdose/db';
import { env } from '@/config/env';

// DATABASE_URL is the URL of the service role: nerdose_api or nerdose_generator.
export const { db, sql } = createDb(env.DATABASE_URL);
```

```ts
// packages/db/src/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export function createDb(url: string, options: { max?: number } = {}) {
  const sql = postgres(url, { max: options.max ?? 10 });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export type Db = ReturnType<typeof createDb>['db'];
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
```

```ts
// packages/db/drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema',
  out: './migrations',
  dbCredentials: { url: process.env.DATABASE_URL_OWNER! }, // role nerdose_owner, DDL only
});
```

## How to use

### Repository pattern

One repository per domain module. It receives `Db | Tx` by constructor injection, so the same repository works inside and outside a transaction.

```ts
// apps/api/src/domain/identity/identity.repository.ts
import { eq } from 'drizzle-orm';
import { players } from '@nerdose/db';
import type { Db, Tx } from '@nerdose/db';

export class IdentityRepository {
  constructor(private readonly db: Db | Tx) {}

  async findById(id: string) {
    const [row] = await this.db.select().from(players).where(eq(players.id, id));
    return row ?? null;
  }
}
```

### Transactions

Coordinated writes use `db.transaction`. Closing a Play and updating `player_game_stats` and `player_stats` MUST share one transaction (ADR-011).

```ts
await db.transaction(async (tx) => {
  await new GameplayRepository(tx).closePlay(play);
  await new ProgressRepository(tx).applyResult(play.playerId, result);
});
```

### Raw SQL

Raw SQL is allowed only where Drizzle cannot express it: `LISTEN`, `pg_notify`, `pg_try_advisory_lock`, `FOR UPDATE SKIP LOCKED`, the `metrics_*` views and migrations.

```ts
await tx.execute(sql`SELECT pg_notify('generation_requests', ${requestId})`);
```

### Migrations

Migrations are forward-only and live in `packages/db/migrations/`.

```bash
pnpm --filter @nerdose/db db:generate --name add_challenge_reports   # generate SQL
pnpm --filter @nerdose/db db:migrate                                  # apply, with DATABASE_URL_OWNER
```

A migration that creates a table MUST include the `GRANT`s for `nerdose_api` and `nerdose_generator` (column-level on `challenges`, `terms`, `timeline_facts`, per ADR-004).

## Rules

- All DB access goes through Drizzle with postgres.js. No other driver or ORM in `apps/` or `packages/`.
- The Drizzle schema and the migrations live only in `@nerdose/db`. Services MUST NOT declare tables.
- Services connect with their own role: `api` as `nerdose_api`, `generator` as `nerdose_generator`. Neither uses the owner role or has DDL permissions. `DATABASE_URL_OWNER` is used only by `db:migrate`.
- No direct `db` calls from HTTP handlers, jobs or use-case functions. Always go through a module repository.
- One repository per domain module. Never share a repository across unrelated modules.
- Use types inferred from the schema (`typeof table.$inferSelect`) or from `@nerdose/db`. No hand-written types that duplicate the schema.
- Every `jsonb` column MUST be parsed with the Zod schema of its owner (game package) when read or written. The database does not validate it.
- Day columns are `date` (UTC day) and instants are `timestamptz`. Do not convert them with local timezones.
- Raw SQL only for what Drizzle cannot express (see How to use). Document why in a one-line comment.
- Migrations are forward-only, reviewed by hand, and committed together with the schema change. Never edit an applied migration.
- Migrations run before starting `api` and `generator`, with the owner role. Services do not run migrations at startup.
- The first migration, `0000_roles_and_grants` (manual SQL), creates `nerdose_api` and `nerdose_generator` with `LOGIN` and no password (idempotent) and sets the base grants (no DDL for services). Passwords are never versioned: after applying migrations, `db:migrate` optionally runs `ALTER ROLE` from `DATABASE_URL_API` / `DATABASE_URL_GENERATOR`.
- Each service MUST only write the tables and columns its role allows (ADR-004). A test runs the expected operations with each role.

## Integration with other conventions

- **env-config**: `DATABASE_URL` (service role) and `DATABASE_URL_OWNER` (migrations only) are validated at startup.
- **error-handling**: repositories let driver errors propagate; the service layer maps unique violations (`23505`) to domain errors such as `already_reported`.
- **testing**: repositories are integration-tested against a real PostgreSQL 16; migrations and roles are applied once in `globalSetup`.
- **generation-queue** (generator) and **platform-day** (api): use the raw SQL exceptions listed above.
