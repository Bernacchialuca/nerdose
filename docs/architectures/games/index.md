# games — Arquitectura

> Auto-generado desde [manifest.yaml](./manifest.yaml). No editar a mano.

**Tipo:** library | **Lenguaje:** node

## Especifico del servicio
- [Overview](./overview.md)
- [Manifest](./manifest.yaml)

## Convenciones activas

- **[Convenciones generales](../../../.claude/conventions/node/_base.md)** — Base conventions for any Node service (always active)
- **[Estructura de un paquete de juego](./conventions/game-package.md)** — Layout of a packages/games/<game_id> package, its three entries (definition, client, generator) and what each entry may import (custom)
- **[Registro de juegos (GameDefinition)](./conventions/game-registry.md)** — Generic game routes over a registry of GameDefinition implementations, with anti-spoiler guarantees (custom)
- **[Validacion de inputs (Zod + @hono/zod-validator)](./conventions/validation.md)** — Input validation with Zod, wired to Hono routes through @hono/zod-validator, with game move schemas imported from game packages (custom)
- **[Testing (Vitest + Testcontainers, contenedor compartido)](./conventions/testing.md)** — Unit and integration testing with Vitest; one shared PostgreSQL 16 Testcontainers instance per suite via globalSetup, sequential files, per-file reset, fake clocks for dates and streaks (custom)
- **[UI de juegos (registry de clients)](./conventions/game-clients.md)** — How the shell mounts each game's client package through a registry without per-game logic (custom)
- **[Estilos (Tailwind CSS v4)](./conventions/styling.md)** — Tailwind CSS v4 with the prototype's visual tokens declared in @theme and owned by @nerdose/ui (custom)
- **[Accesibilidad (WCAG 2.1 AA)](./conventions/accessibility.md)** — Mobile-first, keyboard-complete, non-color-dependent UI that meets WCAG 2.1 AA (custom)
- **[Tests unitarios (Vitest + Testing Library)](./conventions/testing-unit.md)** — Unit and component tests with Vitest, Testing Library and axe-core for the SPAs (custom)
- **[Manejo de errores (catalogo cerrado)](./conventions/error-handling.md)** — Error modeling and canonical { error: { code, message } } shape with a closed code catalog exported by @nerdose/core (custom, auto-incluida)

---

**Total:** 10 convenciones activas.
