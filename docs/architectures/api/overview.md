# api — Overview

## Proposito
Única interfaz HTTP del backend de nerdose. Sirve a `web` (`/api/*`, jugador anónimo con cookie `nd_pid`) y a `admin` (`/api/admin/*`, JWT del responsable). Identifica al jugador, entrega la vista pública del desafío del día y valida cada jugada con el `GameDefinition` de cada juego, cierra las partidas y actualiza rachas y estadísticas en la misma transacción, recibe reportes, dispara la alerta por mail y anula desafíos, publica `approved → published` al cambiar el día UTC y pide regeneraciones al `generator` por PostgreSQL. **Nunca ejecuta código** ni llama a APIs externas, salvo el SMTP de alertas.

## Tipo de servicio
api en node (TypeScript, Node.js 24 LTS, Hono + `@hono/node-server`). Vive en `apps/api` del monorepo y usa los paquetes `@nerdose/core`, `@nerdose/db` y `./definition` de cada `@nerdose/game-*`.

## Modulos del dominio
- **identity**: jugador anónimo, cookie `nd_pid`, preferencias de idioma y de lenguaje de código (`POST /api/session`, `PATCH /api/me/preferences`).
- **gameplay**: vista pública, `start`, `move`, `acknowledge-void`, cierre de partida y anti-spoiler, genérico sobre el registry de juegos; lista válida de Devdle y `rejected_guesses`.
- **progress**: rachas con días neutros, stats por juego y globales, historial, `recomputeStats` (`GET /api/me/stats`).
- **quality**: reportes de jugadores, umbral de alerta, anulación de desafíos y recálculo de agregados.
- **publishing**: día de la plataforma, publicación perezosa single-flight, `GET /api/today`, cache de desafíos de hoy y pedidos de regeneración (`INSERT` en `generation_requests` + `pg_notify`).
- **admin**: login y JWT del responsable, health de admin, próximos 14 días, stock de contenido y métricas (`metrics_*`); orquesta módulos de lectura, sin lógica de dominio propia.

## Notas adicionales
Supuestos tomados al generar esta arquitectura sin interacción con el usuario:

- **Convenciones del catálogo (`.claude/conventions/node`) usadas tal cual:** `_base` y `logging` (Pino). El resto está reemplazado por convenciones custom porque el catálogo asume Fastify, Prisma, jose, express-rate-limit, NATS u otras piezas que contradicen los ADRs.
- **Convenciones excluidas:** `dockerfile`, `ci-gitlab` y `observability` (despliegue, CI y observabilidad diferidos por el usuario); `queue` y `cache` (no hay Redis ni BullMQ, ADR-001).
- **Convenciones de dominio nuevas (custom):** `game-registry` (ADR-006), `player-identity` (ADR-009), `platform-day` (ADR-008 y ADR-011), `memory-cache` (ADR-012). Las caches y el rate limit en memoria exigen **una sola instancia** de la `api`.
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.
- **Fechas:** `_base` pide ISO 8601 con hora en los bordes del sistema; las fechas de día (`date`) se serializan como `YYYY-MM-DD` por ADR-015 y los instantes como ISO 8601 UTC con `Z`.
- **Chequeo de `Origin`:** las rutas de jugador exigen `WEB_ORIGIN` y `/api/admin/*` exige `ADMIN_ORIGIN`; ambas variables son obligatorias en todos los ambientes (ADR-009).
- **`notify()`** se construye con `createNotify(env, logger)` para que `@nerdose/core` no lea `process.env` (regla de `env-config`).
- **Módulos:** `admin` agrupa las rutas `/api/admin/*` que no son de `quality` ni `publishing` (login, próximos 14 días, stock, métricas).
- **Despliegue, CI, hosting, secretos de producción y monitoreo de infraestructura** quedan fuera hasta que se definan.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
