# core — Arquitectura

> Auto-generado desde [manifest.yaml](./manifest.yaml). No editar a mano.

**Tipo:** library | **Lenguaje:** node

## Especifico del servicio
- [Overview](./overview.md)
- [Manifest](./manifest.yaml)

## Convenciones activas

- **[Convenciones generales](../../../.claude/conventions/node/_base.md)** — Base conventions for any Node service (always active)
- **[Validacion de inputs (Zod + @hono/zod-validator)](./conventions/validation.md)** — Input validation with Zod, wired to Hono routes through @hono/zod-validator, with game move schemas imported from game packages (custom)
- **[Testing (Vitest + Testcontainers, contenedor compartido)](./conventions/testing.md)** — Unit and integration testing with Vitest; one shared PostgreSQL 16 Testcontainers instance per suite via globalSetup, sequential files, per-file reset, fake clocks for dates and streaks (custom)
- **[Registro de juegos (GameDefinition)](./conventions/game-registry.md)** — Generic game routes over a registry of GameDefinition implementations, with anti-spoiler guarantees (custom)
- **[Dia de la plataforma, publicacion y rachas](./conventions/platform-day.md)** — UTC platform day, lazy single-flight publication, late-move detection, streaks with neutral days and transactional Play closing (custom)
- **[Manejo de errores (catalogo cerrado)](./conventions/error-handling.md)** — Error modeling and canonical { error: { code, message } } shape with a closed code catalog exported by @nerdose/core (custom, auto-incluida)

---

**Total:** 7 convenciones activas.
