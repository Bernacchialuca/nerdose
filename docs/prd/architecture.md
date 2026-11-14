---
created: 2026-11-03
last_updated: 2026-11-03
status: "Draft"
---

# Arquitectura del Producto — nerdose

> Derivado del discovery: [análisis técnico](../discovery/analisis-tecnico.md)

Documento de alto nivel: qué servicios existen, cómo se comunican, qué base de datos usan y con qué sistemas externos se integran. Las decisiones con su porqué están en los ADRs (`docs/adrs/`). El detalle de cada servicio se documenta después en `docs/architectures/{servicio}/`.

**Principios que ordenan todo el diseño:**

1. **El servidor es dueño de la verdad.** La solución nunca sale del servidor antes de que termine la partida, y cada jugada se valida en la `api`.
2. **El contenido se genera antes de publicarse, nunca durante un request.** El `generator` llena los próximos 14 días y los verifica. La `api` solo lee desafíos y publica los del día.
3. **Cada juego es un módulo enchufable.** Todos implementan el contrato `GameDefinition`, y sumar un juego es sumar un paquete `games/<game_id>`.

**Convención de contratos:** campos, enums y rutas en inglés y en `snake_case`, iguales en el dominio, la base, el JSON de la API y los flujos. Los errores tienen la forma `{ "error": { "code": "<code>", "message": "<texto en el locale>" } }`.

## Servicios

| Servicio | Tecnología | Responsabilidades | Entidades propias | Base de datos | APIs externas |
|----------|-----------|-------------------|-------------------|---------------|---------------|
| `web` | TypeScript, React 19, Vite, React Router, TanStack Query, Tailwind CSS v4, i18next, dnd-kit, Shiki (lazy) | SPA de jugadores: shell, catálogo (home), instrucciones, partida y resultado de cada juego, stats, share, selector de idioma. Nunca tiene la solución antes de terminar | – (UI de Gameplay, Progress e Identity) | – | `api`; Plausible (opcional) |
| `admin` | TypeScript, React 19, Vite, TanStack Query, Tailwind CSS v4 | SPA del responsable: login, reportes y anulación, próximos 14 días (preview con solución y regenerar), stock de contenido, métricas. Solo en español | – (UI de Quality; lectura de Challenge Publishing y Content Banks) | – | `api` |
| `api` | Node.js 24 LTS, Hono, Zod, Drizzle ORM, postgres.js | Única interfaz HTTP. Jugador anónimo y preferencias; vista pública y validación de jugadas con el `GameDefinition` de cada juego; cierre de partidas y rachas en la misma transacción; reportes, umbral de alerta y anulación; rutas `/api/admin/*`; publicación `approved → published` al cambiar el día. **Nunca ejecuta código** | Player, Play, PlayerGameStats, PlayerStats, ChallengeReport, RejectedGuess (y escrituras acotadas sobre Challenge) | `nerdose-db` (rol `nerdose_api`) | — |
| `generator` | Node.js 24 LTS (TS) + Go ≥ 1.25 + JDK 21, croner, pure-rand | Worker siempre activo. Genera, verifica y aprueba desafíos de los próximos 14 días; atiende pedidos de regeneración; carga los bancos desde el dataset versionado (`@nerdose/content`) al arrancar; registra las fallas de generación (`generation_failures`). **Único que crea desafíos y escribe los bancos**. No expone interfaz de red y no llama a APIs externas | Challenge, Term, TimelineFact (y las tablas técnicas `generation_requests`, `generation_failures`, `job_runs`) | `nerdose-db` (rol `nerdose_generator`) | — |

### Componentes compartidos (paquetes del monorepo)

| Paquete | Lo usan | Contenido |
|---|---|---|
| `core` | api, generator, web | Contrato `GameDefinition`, día UTC y número de desafío (`LAUNCH_DATE`), rachas con días neutros, PRNG (`rngFrom`; el seed HMAC se calcula solo en el `generator`), códigos de error |
| `db` | api, generator | Schema Drizzle, migraciones, queries compartidas y vistas `metrics_*` |
| `games/<game_id>` | `definition` → api · `client` → web y admin · `generator` → generator | Un paquete por juego: `devdle`, `grep-grid`, `timeline`, `big-o`, `bug-hunt` |
| `polyglot` | generator | Árbol de código, emisores JS/Go/Java y runner multi-lenguaje |
| `content` | generator (carga); script de importación (desarrollo) | Dataset versionado de los bancos (`data/terms.json`, `data/timeline_facts.json`, `data/manifest.json`) y el script offline `import:banks` que lo genera desde Wikidata y Wikipedia |
| `ui` | web, admin | Header, banners, share, stat cards, tokens visuales y helper `track()` |

Cada paquete compartido tiene su propia arquitectura en `docs/architectures/{workspace,core,db,ui,games,polyglot,content}/` (`workspace` es la raíz del monorepo: pnpm, Turborepo, ESLint, Compose). En las tablas "Servicios Afectados" de requests y stories se los nombra con esos ids.

## Bases de Datos

| Base de datos | Tipo | Usada por | Propósito |
|----------|------|---------|---------|
| `nerdose-db` | PostgreSQL 16 | `api` (rol `nerdose_api`), `generator` (rol `nerdose_generator`) | Única base: contenido (bancos), desafíos, jugadores, partidas, agregados de rachas, reportes, tablas técnicas del generator y vistas `metrics_*`. `LISTEN/NOTIFY` es el único canal asíncrono. La propiedad de cada tabla y columna se hace cumplir con permisos por rol |

No hay Redis ni bus de mensajes: las caches y el rate limit viven en la memoria de la `api` (una sola instancia).

## Interacciones entre Servicios

### Comunicaciones Internas

- **web → api** (HTTPS/JSON, síncrono, mismo origen `nerdose.dev/api/*`)
  - Todas las lecturas y mutaciones del jugador, autenticadas con la cookie `nd_pid`.

- **admin → api** (HTTPS/JSON, síncrono, mismo origen `admin.nerdose.dev/api/admin/*`)
  - Login y operaciones del responsable, con `Authorization: Bearer <JWT>`.

- **api → nerdose-db** (SQL vía postgres.js, síncrono)
  - Lee los desafíos de hoy, escribe jugadores, partidas, agregados, reportes y rechazos de Devdle. Sobre `challenges` solo puede hacer `UPDATE` de `status`, `void_reason`, `voided_at` y `alerted_at`.

- **generator → nerdose-db** (SQL + `LISTEN`, síncrono)
  - Dueño de `challenges`, los bancos y las tablas técnicas.

- **api → generator** (PostgreSQL `pg_notify('generation_requests', request_id)`, asíncrono, fire-and-forget)
  - Pedido de regeneración desde el admin. Es el único mensaje entre backends. El generator toma el pedido de la tabla `generation_requests` con `FOR UPDATE SKIP LOCKED`, y además hace un poll cada 60 s como respaldo.

- **generator → toolchains locales** (subprocesos `node`, `go build` + binario, `java`, locales)
  - Verificación ejecutando de Big O y Bug Hunt, con timeout de 10 s y usuario no root.

### Integraciones Externas

- Ninguna en v1. Las alertas no salen del sistema: el umbral de reportes marca `challenges.alerted_at` (api) y la falla de generación crea una fila en `generation_failures` (generator); el admin las muestra.

- **web → Plausible CE** (HTTPS, asíncrono, **opcional**)
  - Pageviews y eventos `share:<game_id>`. Solo si `VITE_PLAUSIBLE_DOMAIN` tiene valor al compilar; está apagado por defecto.

### Fuentes del dataset (solo en desarrollo, nunca en producción)

El contenido de los bancos se importa **offline** con el script `import:banks` de `@nerdose/content`. Se corre a mano y el resultado (JSON) se commitea en el repo. Ningún servicio desplegado consulta Wikimedia.

- **script → Wikidata SPARQL** (`query.wikidata.org`): conceptos de computación (términos) y lenguajes, empresas, sistemas operativos, hardware y videojuegos con su fecha (P571/P577), con labels, descripciones y sitelinks en es/en.
- **script → Wikipedia REST** (`/api/rest_v1/page/summary/{title}` en es y en): primer párrafo para definiciones, resúmenes y notas.
- **build de `games/devdle` → Wikidata SPARQL + ENABLE:** la lista base de palabras válidas (ENABLE filtrado ∪ labels en inglés A–Z de conceptos de computación) también se genera offline y se commitea como artefacto del paquete.

El script manda un `User-Agent` descriptivo con un contacto del proyecto, como exige la política de Wikimedia. Los bancos se reutilizan cuando vence su ventana anti-repetición, así que un dataset de ≥ 500 términos y ≥ 450 hechos en total (5 por día × 90 días de ventana de Timeline, sin mínimo por categoría) alcanza indefinidamente. El script falla si no llega a esos mínimos.

## Requerimientos Técnicos

### Infraestructura

> **Diferido:** hosting, plataforma de despliegue, ambientes, CI/CD, backups, DNS/TLS, y almacenamiento de secretos se definen en una iteración posterior. Acá solo queda lo que la arquitectura ya exige de la infraestructura.

**Requisitos que el despliegue tiene que cumplir:**
- **Mismo origen:** `nerdose.dev` sirve `web` y enruta `/api/*` a la `api`; `admin.nerdose.dev` sirve `admin` y enruta `/api/admin/*` a la misma `api`. Sin CORS. *Qué* se enruta está decidido; *cómo* (proxy, plataforma) queda diferido.
- **HTTPS obligatorio** en ambos dominios (NFR-S05).
- **Una sola instancia** de `api` y una de `generator` (NFR-SC01).
- El `generator` necesita los toolchains **Node 24, Go ≥ 1.25 y JDK 21** en su entorno, y corre siempre (worker long-running).
- **PostgreSQL 16** con tres roles: dueño del schema (migraciones), `nerdose_api` y `nerdose_generator`.
- Las migraciones (drizzle-kit, rol dueño del schema) se aplican antes de levantar `api` y `generator`.
- Ningún servicio necesita salida a internet.

**Estructura del repositorio:**
- Monorepo con pnpm workspaces y Turborepo: `apps/{web,admin,api,generator}` y `packages/{core,db,ui,polyglot,content,games/*}`.

### Aspectos Transversales

**Logging:**
- Logs JSON estructurados con pino a stdout en `api` y `generator`. Dónde se recolectan y cuánto se retienen queda diferido con el hosting.
- Cada corrida de job del generator queda además en la tabla `job_runs` (consultable desde el admin).

**Monitoreo:**
- `GET /api/health` y `GET /api/admin/health` en la `api`.
- Salud del contenido: stock de los bancos, próximos 14 días y `job_runs` en el admin; fallas de generación y desafíos alertados visibles en el admin.
- Monitoreo de infraestructura (uptime, recursos): diferido.

**Error Tracking:**
- Diferido. En v1 los errores quedan en los logs.

**Testing:**
- Vitest para unit y contrato (incluidos los tests anti-spoiler por juego, NFR-S01/NFR-S04), con relojes falsos para fechas y rachas.
- Playwright para e2e del flujo jugar → terminar → racha.

### Seguridad

**Autenticación:**
- **Jugador:** cookie `nd_pid` = `players.id` (UUID v4), `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, sin `Domain`, `Max-Age` de 400 días renovado en cada `POST /api/session`. Sin PII.
- **Admin:** contraseña única comparada contra `ADMIN_PASSWORD_HASH` (scrypt, `timingSafeEqual`); JWT HS256 de 8 h firmado con `ADMIN_JWT_SECRET`, guardado en `sessionStorage` y enviado como `Authorization: Bearer`. Sin refresh.
- **Backends:** se autentican contra PostgreSQL con roles distintos. El `generator` no expone ninguna interfaz de red.

**Autorización:**
- Todos los jugadores tienen los mismos permisos; solo acceden a sus propios datos (por `player_id` de la cookie).
- `/api/admin/*` (salvo `login` y `health`) exige un JWT válido.
- En la base, el rol `nerdose_api` no puede tocar el `payload` ni crear desafíos; `nerdose_generator` es dueño de `challenges` y los bancos; ninguno de los dos puede alterar el schema.
- CSRF: mismo origen, `SameSite=Lax`, mutaciones solo con `Content-Type: application/json` y chequeo del header `Origin`. CORS deshabilitado.

**Gestión de Secretos:**
- Por variables de entorno, validadas al arrancar; nunca en el repo. En el repo solo hay un `.env.example` sin valores. Dónde se guardan en producción y cómo se rotan queda diferido.
- Secretos: `GENERATOR_SECRET` (**solo** el generator; sin él no se pueden predecir los desafíos), `ADMIN_PASSWORD_HASH` y `ADMIN_JWT_SECRET` (api) y `DATABASE_URL` (uno por rol).
- Rotar `ADMIN_JWT_SECRET` invalida todas las sesiones de admin.

### Rendimiento

**Caching:**
- En memoria de la `api`: mapa `game_id → challenge de hoy` (se invalida al cambiar el día y al anular) y `Set` de la lista válida de Devdle (base de build ∪ `terms` aprobados), que se recarga al arrancar y al cambiar el día.
- En `web`: TanStack Query cachea `/api/today` y `/api/me/stats` y los invalida al terminar una partida o al cambiar el día.
- Cambio de día: una sola ejecución de la publicación (single-flight) y refetch del cliente con jitter de 0–3 s.

**Rate Limiting:** (`hono-rate-limiter`, store en memoria; `429 rate_limited` con `Retry-After`, sin captcha)

| Ruta | Clave | Límite |
|---|---|---|
| `POST /api/session` | IP | 20 / 10 min |
| `POST /api/games/{game_id}/today/move` | `player_id` | 60 / min |
| `POST /api/games/{game_id}/today/move` | IP | 300 / min |
| `POST …/start`, `POST …/acknowledge-void`, `PATCH /api/me/preferences` | `player_id` | 30 / min |
| `POST /api/games/{game_id}/today/report` | IP | 10 / hora (además de `UNIQUE(player_id, challenge_id)`) |
| `GET /api/*` | IP | 600 / min |
| `POST /api/admin/login` | IP | 5 / 15 min |
| `/api/admin/*` con JWT | – | sin límite |

**CDN:**
- Diferido con el hosting. Lo único fijo: los assets con hash de Vite son cacheables como inmutables, `index.html` no, y JetBrains Mono es self-hosted.

## Estrategia de Despliegue

**Fase MVP:**
> La plataforma y el mecanismo de despliegue quedan diferidos. Lo que sigue es lo que la arquitectura ya fija.

- Monorepo (pnpm workspaces + Turborepo) con todos los servicios en un repo.
- Una sola instancia de `api` y una de `generator`, para ~1.000 jugadores diarios con pico a las 00:00 UTC (NFR-SC01).
- La publicación del día no depende del `generator`: la hace la `api` con el primer request después de las 00:00 UTC (NFR-A02). Con 14 días aprobados por adelantado, el generator puede estar caído hasta 13 días sin dejar un juego sin desafío (NFR-A03).
- Alertas solo en el admin (registradas en la base); sin mail ni webhooks.

**Fase Post-MVP:**
- Escalado horizontal de la `api` (NFR-SC03): el rate limit y las caches pasan a Postgres o Redis, y la publicación single-flight se protege con un advisory lock.
- Instalar Plausible CE self-hosted y activar `VITE_PLAUSIBLE_DOMAIN` / `VITE_PLAUSIBLE_SCRIPT_URL`.
- Aislamiento del runner del generator (sin red y con límites de recursos).
