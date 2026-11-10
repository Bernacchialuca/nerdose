# api — Arquitectura

> Auto-generado desde [manifest.yaml](./manifest.yaml). No editar a mano.

**Tipo:** api | **Lenguaje:** node

## Especifico del servicio
- [Overview](./overview.md)
- [Manifest](./manifest.yaml)

## Convenciones activas

- **[Convenciones generales](../../../.claude/conventions/node/_base.md)** — Base conventions for any Node service (always active)
- **[Servidor HTTP (Hono)](./conventions/http-server.md)** — HTTP server, routing and middlewares with Hono and @hono/node-server (custom)
- **[ORM / Acceso a base de datos (Drizzle)](./conventions/orm.md)** — Database access with Drizzle ORM and postgres.js, schema and migrations owned by @nerdose/db, one PostgreSQL role per service (custom)
- **[Validacion de inputs (Zod + @hono/zod-validator)](./conventions/validation.md)** — Input validation with Zod, wired to Hono routes through @hono/zod-validator, with game move schemas imported from game packages (custom)
- **[Autenticacion admin (hono/jwt HS256 + scrypt)](./conventions/auth-jwt.md)** — Single-owner admin authentication with scrypt password hash and an 8-hour HS256 JWT signed through hono/jwt (custom)
- **[Seguridad HTTP (Origin, Content-Type, rate limit en memoria)](./conventions/security.md)** — Same-origin API hardening without CORS - Origin and Content-Type checks, secure headers and in-memory rate limiting with hono-rate-limiter (custom)
- **[Logging estructurado (Pino)](../../../.claude/conventions/node/logging.md)** — Structured logging with Pino
- **[Configuracion de entorno (@t3-oss/env-core)](./conventions/env-config.md)** — Type-safe environment validation at startup with @t3-oss/env-core and Zod; secrets only from the runtime environment, only .env.example committed (custom)
- **[Testing (Vitest + Testcontainers, contenedor compartido)](./conventions/testing.md)** — Unit and integration testing with Vitest; one shared PostgreSQL 16 Testcontainers instance per suite via globalSetup, sequential files, per-file reset, fake clocks for dates and streaks (custom)
- **[Registro de juegos (GameDefinition)](./conventions/game-registry.md)** — Generic game routes over a registry of GameDefinition implementations, with anti-spoiler guarantees (custom)
- **[Identidad del jugador anonimo (cookie nd_pid)](./conventions/player-identity.md)** — Anonymous player identity through the nd_pid cookie, session endpoint, middleware and locale resolution (custom)
- **[Dia de la plataforma, publicacion y rachas](./conventions/platform-day.md)** — UTC platform day, lazy single-flight publication, late-move detection, streaks with neutral days and transactional Play closing (custom)
- **[Caches en memoria de la api](./conventions/memory-cache.md)** — In-process caches of today's challenges and of the Devdle valid word list, reloaded on startup, day change and void (custom)
- **[Manejo de errores (catalogo cerrado)](./conventions/error-handling.md)** — Error modeling and canonical { error: { code, message } } shape with a closed code catalog exported by @nerdose/core (auto-incluida) (custom)

---

**Total:** 14 convenciones activas.
