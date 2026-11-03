# generator — Arquitectura

> Auto-generado desde [manifest.yaml](./manifest.yaml). No editar a mano.

**Tipo:** worker | **Lenguaje:** node

## Especifico del servicio
- [Overview](./overview.md)
- [Manifest](./manifest.yaml)

## Convenciones activas

- **[Convenciones generales](../../../.claude/conventions/node/_base.md)** — Base conventions for any Node service (always active)
- **[ORM / Acceso a base de datos (Drizzle)](./conventions/orm.md)** — Database access with Drizzle ORM and postgres.js, schema and migrations owned by @nerdose/db, one PostgreSQL role per service (custom)
- **[Validacion de inputs (Zod + @hono/zod-validator)](./conventions/validation.md)** — Input validation with Zod, wired to Hono routes through @hono/zod-validator, with game move schemas imported from game packages (custom)
- **[Logging estructurado (Pino)](../../../.claude/conventions/node/logging.md)** — Structured logging with Pino
- **[Configuracion de entorno (@t3-oss/env-core)](./conventions/env-config.md)** — Type-safe environment validation at startup with @t3-oss/env-core and Zod; secrets only from the runtime environment, only .env.example committed (custom)
- **[Testing (Vitest + Testcontainers, contenedor compartido)](./conventions/testing.md)** — Unit and integration testing with Vitest; one shared PostgreSQL 16 Testcontainers instance per suite via globalSetup, sequential files, per-file reset, fake clocks for dates and streaks (custom)
- **[Alertas por mail (notify)](./conventions/alerts-mail.md)** — Single notify() helper from @nerdose/core over nodemailer with best-effort, once-only claim semantics (custom)
- **[Scheduler y jobs (croner + advisory locks)](./conventions/scheduler-jobs.md)** — Long-running worker with croner (UTC), pg_try_advisory_lock per job, job_runs records, idempotent jobs and graceful shutdown (custom)
- **[Cola de regeneracion en PostgreSQL](./conventions/generation-queue.md)** — Regeneration requests as a PostgreSQL queue using LISTEN generation_requests, FOR UPDATE SKIP LOCKED and a 60 s backup poll (custom)
- **[Generacion y verificacion de desafios](./conventions/challenge-generation.md)** — Deterministic seed with HMAC-SHA256 and pure-rand, per-candidate pipeline, GameGenerator registry, attempts and generation failure alerts (custom)
- **[Ejecucion de snippets (execFile + polyglot)](./conventions/code-runner.md)** — Multi-language snippet runner using child_process.execFile with a 10 s timeout and non-root user, provided by @nerdose/polyglot (custom)
- **[Carga de bancos desde el dataset (sync_banks)](./conventions/content-sync.md)** — Idempotent UPSERT of the versioned dataset of @nerdose/content into terms and timeline_facts, without any external request (custom)
- **[Manejo de errores (catalogo cerrado)](./conventions/error-handling.md)** — Error modeling and canonical { error: { code, message } } shape with a closed code catalog exported by @nerdose/core (auto-incluida) (custom)

---

**Total:** 13 convenciones activas.
