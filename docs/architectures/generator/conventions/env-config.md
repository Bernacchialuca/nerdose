---
id: env-config
display_name: Configuracion de entorno (@t3-oss/env-core)
language: node
description: Type-safe environment validation at startup with @t3-oss/env-core and Zod; secrets only from the runtime environment, only .env.example committed
applies_to: [api, worker, cli]
required_by: []
package: "@t3-oss/env-core"
---

# Environment Config (Node, @t3-oss/env-core)

Type-safe environment variable validation at startup with [@t3-oss/env-core](https://env.t3.gg) and [Zod](https://zod.dev). The service fails fast if a required variable is missing or malformed. Service-local replacement of the catalog default: no committed `.env.dev` / `.env.prod`, because the architecture fixes that the repo only contains an `.env.example` without values and secret storage is deferred with the hosting.

## When to use

- `api` and `generator`: every variable is read through the typed `env` object.
- Each service validates only its own variables. A secret that belongs to one service is not declared in the other.

## Package

```
@t3-oss/env-core     # env validation
zod                  # schema
dotenv               # dev only: loads .env.local
```

## Configuration

```ts
// apps/api/src/config/env.ts
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
    SERVICE_NAME: z.string().default('api'),
    DATABASE_URL: z.string().url(),                       // role nerdose_api
    LAUNCH_DATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // shared with generator
    ADMIN_PASSWORD_HASH: z.string().startsWith('scrypt$'),
    ADMIN_JWT_SECRET: z.string().min(32),
    TRUST_PROXY_HEADER: z.string().optional(),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(1).default(1),
    WEB_ORIGIN: z.string().url(),                         // api: origin allowed for player mutations
    ADMIN_ORIGIN: z.string().url(),                       // api: origin allowed for /api/admin/* mutations
    REPORT_ALERT_COUNT: z.coerce.number().int().default(3),
    REPORT_ALERT_RATIO: z.coerce.number().default(0.05),
    REPORT_ALERT_RATIO_MIN_COUNT: z.coerce.number().int().default(2),
  },
  runtimeEnv: process.env,
  emitErrors: true,
});
```

The `generator` declares its own set in `apps/generator/src/config/env.ts`: `DATABASE_URL` (role `nerdose_generator`), `LAUNCH_DATE`, `GENERATOR_SECRET` (min 32; **only** this service), `GENERATION_MAX_ATTEMPTS` (default 20), `LOG_LEVEL`, `SERVICE_NAME`.

## How to use

### Access

```ts
import { env } from '@/config/env';
const port = env.PORT; // number
```

Never read `process.env` outside `src/config/env.ts`.

### Report alert thresholds

`REPORT_ALERT_COUNT`, `REPORT_ALERT_RATIO` and `REPORT_ALERT_RATIO_MIN_COUNT` (api only) have defaults and tune when a challenge gets `alerted_at` (ADR-017). There are no mail or webhook variables: alerts never leave the database.

### Env files

| File | Committed | Purpose |
|---|---|---|
| `.env.example` | Yes | Every variable of the service, no values, with a one-line comment |
| `.env.local` | No (gitignored) | Developer overrides, loaded with `dotenv` in development |
| `.env.test` | No (gitignored) | Optional test overrides; integration tests inject URLs from Testcontainers |

Production values come from the runtime environment. Where secrets are stored is deferred with the hosting.

```bash
# apps/api/.env.example
DATABASE_URL=          # required, postgres URL of role nerdose_api
LAUNCH_DATE=           # required, YYYY-MM-DD
ADMIN_PASSWORD_HASH=   # required, output of pnpm --filter api admin:hash
ADMIN_JWT_SECRET=      # required, >= 32 random bytes
```

## Rules

- All variables are loaded and validated in one place per service (`src/config/env.ts`). No `process.env` elsewhere.
- Validation happens at startup (`emitErrors: true`); the service does not start with an invalid environment.
- Numeric and boolean variables use `z.coerce`.
- Secrets have a minimum length constraint and are never logged (see `logging`).
- `GENERATOR_SECRET` MUST exist only in the `generator` environment. `ADMIN_PASSWORD_HASH` and `ADMIN_JWT_SECRET` MUST exist only in the `api` environment.
- `api` and `generator` use different `DATABASE_URL` values (one per role). The owner URL (`DATABASE_URL_OWNER`) is read only by `@nerdose/db` migration scripts. `DATABASE_URL_API` and `DATABASE_URL_GENERATOR` are also read only by the `db:migrate` script of `@nerdose/db`, which uses them to synchronize the role passwords (`ALTER ROLE ... PASSWORD`) after applying migrations; they are optional and never read by the services.
- `LAUNCH_DATE` is the same value in both services.
- Only `.env.example` is committed, listing every variable with an empty value and a short comment. Keep it in sync with `env.ts`.
- `.env.local` and `.env.test` are gitignored. No real secret is ever committed.
- Variables used only by dev scripts (`WIKIMEDIA_CONTACT`) are not declared in the services.

## Integration with other conventions

- **orm**: `DATABASE_URL` is validated here.
- **auth-jwt**: `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET` (api).
- **security**: `TRUST_PROXY_HEADER`, `TRUST_PROXY_HOPS`, `WEB_ORIGIN`, `ADMIN_ORIGIN` (api).
- **logging**: `LOG_LEVEL`, `SERVICE_NAME`.
- **Report alerts (ADR-017)**: `REPORT_ALERT_*` thresholds (api).
- **scheduler-jobs** (generator): `GENERATION_MAX_ATTEMPTS`, `GENERATOR_SECRET`.
