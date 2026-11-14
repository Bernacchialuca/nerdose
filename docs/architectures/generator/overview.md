# generator — Overview

## Proposito
Worker siempre activo, sin interfaz de red, que produce el contenido de nerdose. Mantiene aprobados y verificados los desafíos de los próximos 14 días de cada juego (job `fill`, cada hora en UTC), atiende los pedidos de regeneración que la `api` deja en PostgreSQL (`LISTEN generation_requests` + `FOR UPDATE SKIP LOCKED`), carga los bancos (`terms`, `timeline_facts`) desde el dataset versionado de `@nerdose/content` al arrancar (`sync_banks`) y registra en `generation_failures` si falta el desafío de mañana (la fila es la alerta, ADR-017). Es el único proceso que inserta en `challenges`, `terms` y `timeline_facts`. No tiene salida de red fuera de la base.

## Tipo de servicio
worker en node (TypeScript, Node.js 24 LTS, croner, pure-rand) más toolchains Go >= 1.25 y JDK 21 para verificar el código. Vive en `apps/generator` y usa `@nerdose/core`, `@nerdose/db`, `@nerdose/polyglot`, `@nerdose/content` y `./generator` de cada `@nerdose/game-*`.

## Modulos del dominio
- **challenge-publishing**: `fill`, pipeline de generación y verificación por candidato, seed (HMAC + pure-rand), regeneración por cola, `generation_failures` (registro de la falla de generación, que el admin muestra).
- **content-banks**: `sync_banks`, UPSERT idempotente del dataset en los bancos y reglas de precedencia de ítems `rejected`.

## Notas adicionales
Supuestos tomados al generar esta arquitectura sin interacción con el usuario:

- **Convenciones del catálogo usadas tal cual:** `_base` y `logging` (Pino). El resto es custom: o reemplaza a una del catálogo que contradice los ADRs (`orm`, `validation`, `error-handling`, `env-config`, `testing`), o es nueva (`scheduler-jobs`, `generation-queue`, `challenge-generation`, `code-runner`, `content-sync`).
- **Convenciones compartidas con `api`** (`orm`, `validation`, `error-handling`, `env-config`, `testing`): los archivos son idénticos en ambos servicios; si se cambia uno hay que cambiar el otro.
- **Convenciones excluidas:** `dockerfile`, `ci-gitlab`, `observability` (diferidas); `queue` y `cache` (sin Redis/BullMQ, ADR-001); `http-server`, `auth-jwt` y `security` no aplican (el `generator` no expone red).
- **Tipo `worker`:** sin servidor HTTP, el `generator` no usa `http-server`; `error-handling` se incluye por `validation`.
- **Seed:** los 32 bytes del HMAC se reducen a una semilla entera de 32 bits para `pure-rand` en el ejemplo de `challenge-generation`; la derivación exacta queda a cargo de `@nerdose/core`.
- **Cola:** mientras genera una regeneración, la fila del pedido queda bloqueada (`SKIP LOCKED`); es aceptable porque hay una sola instancia del `generator`.
- **Aislamiento del runner** (sin red, límites de recursos), imagen con toolchains, despliegue y CI quedan diferidos con el hosting.
- **Idioma de las convenciones:** siguen el template del workflow (inglés, `display_name` en español).

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)

## Update (REQ-009)

- Registry con Devdle, Grep Grid, Timeline y Big O (`big-o@1`). Big O es el primer juego sin banco (`historySpec.bank = null`, `aheadDays: 30`) y el primero cuyo `verify` es asíncrono y ejecuta código con `@nerdose/polyglot` (convenciones `challenge-generation` y `code-runner`).
- Al arrancar, antes de `sync_banks` y `fill`, el `generator` corre `checkToolchains()` y loguea un `warn` `Toolchain missing at startup` por cada toolchain que falte (Go >= 1.25, JDK 21). No se niega a arrancar: los candidatos de Big O se rechazan con `run_<lang>: toolchain_missing`.
- El runner necesita `HOME` (o `GOCACHE`) en el entorno del proceso: el hijo recibe solo `PATH`, `HOME`, `GOCACHE`, `GOPATH` y `TMPDIR`, y sin cache `go build` falla como `compile_error`.
