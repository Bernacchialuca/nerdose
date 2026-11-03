# db — Arquitectura

> Auto-generado desde [manifest.yaml](./manifest.yaml). No editar a mano.

**Tipo:** library | **Lenguaje:** node

## Especifico del servicio
- [Overview](./overview.md)
- [Manifest](./manifest.yaml)

## Convenciones activas

- **[Convenciones generales](../../../.claude/conventions/node/_base.md)** — Base conventions for any Node service (always active)
- **[ORM / Acceso a base de datos (Drizzle)](./conventions/orm.md)** — Database access with Drizzle ORM and postgres.js, schema and migrations owned by @nerdose/db, one PostgreSQL role per service (custom)
- **[Configuracion de entorno (@t3-oss/env-core)](./conventions/env-config.md)** — Type-safe environment validation at startup with @t3-oss/env-core and Zod; secrets only from the runtime environment, only .env.example committed (custom)
- **[Testing (Vitest + Testcontainers, contenedor compartido)](./conventions/testing.md)** — Unit and integration testing with Vitest; one shared PostgreSQL 16 Testcontainers instance per suite via globalSetup, sequential files, per-file reset, fake clocks for dates and streaks (custom)
- **[Manejo de errores (catalogo cerrado)](./conventions/error-handling.md)** — Error modeling and canonical { error: { code, message } } shape with a closed code catalog exported by @nerdose/core (custom)

---

**Total:** 5 convenciones activas.
