# core — Overview

## Proposito
Paquete `@nerdose/core` (`packages/core`): la lógica y los contratos que comparten `api`, `generator`, `web` y `admin`. La entrada `.` es **isomorfa** (corre en Node y en el navegador, sin `node:*`) y expone el contrato `GameDefinition` y sus tipos, el registry de juegos, el día UTC de la plataforma, el número de desafío, las rachas con días neutros, el seed/PRNG y el `ERROR_CATALOG` con `AppError`.

## Tipo de servicio
Library en node (TypeScript estricto, Node.js 24 LTS). Vive en `packages/core` y la consumen todas las apps. ADR-003, 006, 008, 011, 013 y 015.

## Modulos del dominio
- **game-contract**: `GameId`, `Locale`, `GameDefinition`, `MoveError` y `createGameRegistry()` (ADR-006).
- **errors**: `ERROR_CATALOG`, `AppError` y `ErrorCode` (ADR-015).
- **platform-day**: `today()`, `challengeNumber()`, `nextStreak()`, `liveStreak()` (ADR-008, ADR-011).
- **seed-prng**: derivación y uso del seed y del PRNG (ADR-007).

## Notas adicionales
- **Convenciones copiadas tal cual** (con `library` agregado a `applies_to`): `error-handling`, `validation`, `testing`, `game-registry` y `platform-day` vienen de `api`. Si se cambia una, hay que cambiar la otra. No hay convenciones nuevas.
- **Seed y PRNG:** el seed (`HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")`, con `node:crypto`) se calcula **solo en `apps/generator`** (convención `challenge-generation` del generator): necesita `GENERATOR_SECRET`, que existe solo ahí, y `node:crypto`, que no puede ir en la entrada isomorfa. `core` expone solo el PRNG determinista `rngFrom(seed: Uint8Array)` sobre `pure-rand` (xoroshiro128+), que es isomorfo y lo usan los `generator` de cada juego.
- **Reglas de entrada:** `@nerdose/core` tiene una sola entrada `.`, que no importa `node:*` (ADR-003; la entrada `./notify` se eliminó con el ADR-017).
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)

## Update (REQ-006)

- `TIMELINE_CATEGORIES`, `TimelineCategory`, `DATE_PRECISIONS` and `DatePrecision` live in `core/src/enums.ts` (like `TERM_CATEGORIES`); `@nerdose/content` re-exports them. The `timeline` game package imports them from `core`, so it does not depend on `content` at runtime.

## Update (REQ-007)

- `replayStreak` and `rebuildGameStats` (`core/src/streaks.ts`): pure recompute of ADR-011, the base of `recomputeStats` in the `api`.
- `GameDefinition.culprits(p): Culprit[]` (types `Culprit` and `CulpritKind` in `game-definition.ts`).
- `invalid_culprit` (422) in `ERROR_CATALOG`.
- `REPORT_REASONS` and `REPORT_STATUSES` in `enums.ts`.
