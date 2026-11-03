---
created: 2026-11-03
last_updated: 2026-11-03
status: "Análisis técnico cerrado"
analisis_funcional: "docs/discovery/analisis-funcional.md"
analisis_dominio: "docs/discovery/analisis-dominio.md"
alcance: "Tecnologías, servicios, comunicación, autenticación, flujos clave y cobertura. CI/CD, testing, observabilidad, estructura del proyecto y hosting quedan diferidos a una iteración posterior."
---

# Análisis Técnico — nerdose

> **Alcance:** este documento define **solo** tecnologías, servicios, comunicación, autenticación, flujos clave y la validación de cobertura. CI/CD, testing, observabilidad, estructura del proyecto y hosting quedan **fuera de alcance** (ver [Decisiones Operativas Fuera de Alcance](#decisiones-operativas-fuera-de-alcance)).
>
> **Base:** parte de `docs/ARCHITECTURE.md`, que ya fijaba el stack (D1–D18). Este análisis lo reconcilia con las decisiones del discovery funcional y de dominio, y completa lo que faltaba. Los cambios respecto de `ARCHITECTURE.md` están en [Notas de Consistencia](#notas-de-consistencia).
>
> **Convención de nombres:** los nombres de campos, enums y rutas están en inglés y en `snake_case`, igual que en el análisis de dominio. El JSON de la API usa exactamente esos nombres, sin traducir a `camelCase`, para que flujos, OpenAPI y DBML coincidan literalmente.

## Mapa de Servicios

```
                     nerdose.dev                                admin.nerdose.dev
          ┌───────────────────────────────┐            ┌───────────────────────────────┐
Navegador │ S1 web  (SPA React)           │            │ S2 admin (SPA React)          │
          │ shell · catálogo · juegos ·   │            │ reportes · próximos · stock · │
          │ stats · share                 │            │ métricas                      │
          └──────────────┬────────────────┘            └──────────────┬────────────────┘
                         │ HTTPS/JSON  /api/*                         │ HTTPS/JSON  /api/admin/*
                         │ cookie nd_pid (mismo origen)               │ Bearer JWT (mismo origen)
                         ▼                                            ▼
          ┌────────────────────────────────────────────────────────────────────────┐
          │ S3 api  (Node + Hono) — instancia única                                │
          │ Identity · Gameplay (registry GameDefinition) · Progress · Quality     │
          │ cache en memoria: desafíos de hoy + lista válida de Devdle             │
          │ publica approved→published al cambiar el día · rate limit en memoria   │
          └───────────────┬───────────────────────────────────────┬────────────────┘
                          │ SQL                                    │ HTTPS POST (alerta de reportes)
                          ▼                                        ▼
          ┌───────────────────────────────┐            ┌─────────────────────────┐
          │ PostgreSQL                    │            │ Webhook (Discord/Slack) │
          │ datos + LISTEN/NOTIFY         │            └─────────────────────────┘
          └───────────────▲───────────────┘                        ▲
                          │ SQL + LISTEN generation_requests       │ HTTPS POST (falla de generación)
          ┌───────────────┴───────────────────────────────────────┴────────────────┐
          │ S4 generator  (worker Node + Go + JDK, siempre activo)                 │
          │ Challenge Publishing · Content Banks                                   │
          │ scheduler interno · polyglot runner (subprocesos node/go/java)         │
          └───────────────┬────────────────────────────────────────────────────────┘
                          │ HTTPS GET
                          ▼
          Wikidata (SPARQL, wbsearchentities) · Wikipedia REST · Wiktionary API

  S1 ──HTTPS──> Plausible (opcional, detrás de flag: pageviews + eventos de share)
```

### Servicios

| # | Servicio | Responsabilidad | Contexto(s) de dominio |
|---|---|---|---|
| S1 | `web` | SPA de jugadores: shell, catálogo (home), instrucciones/partida/resultado de cada juego, stats, share, selector de idioma. Nunca tiene la solución antes de terminar | Gameplay (UI), Progress (UI), Identity (UI de preferencias) |
| S2 | `admin` | SPA del responsable: reportes y anulación, próximos 14 días (preview con solución y log de verificación, regenerar), stock de contenido y métricas | Quality (UI), Challenge Publishing (lectura), Content Banks (lectura) |
| S3 | `api` | Única interfaz HTTP. Jugador anónimo y preferencias; vista pública y validación de jugadas con el `GameDefinition` de cada juego; cierre de partidas y rachas en la misma transacción; reportes, umbral de alerta y anulación; rutas `/api/admin/*`; publicación al cambiar el día. **Nunca ejecuta código ni llama a APIs externas** (salvo el webhook de alerta) | Identity, Gameplay, Progress, Quality |
| S4 | `generator` | Worker siempre activo. Genera, verifica y aprueba desafíos para los próximos 14 días; atiende pedidos de regeneración; repone los bancos desde Wikidata/Wikipedia; promueve palabras a la lista válida de Devdle; alerta las fallas de generación. **Único que crea desafíos y escribe en los bancos** | Challenge Publishing, Content Banks |

**Trazabilidad:** los 6 contextos de dominio tienen servicio, y los 4 servicios trazan a algún contexto. Gameplay se reparte entre `api` (reglas) y `web` (UI) a través del mismo paquete por juego (ver [Componentes compartidos](#componentes-compartidos)).

### Infraestructura Compartida

| Componente | Rol |
|---|---|
| PostgreSQL (≥ 16) | Única base de datos: contenido, desafíos, jugadores, partidas, agregados, reportes y tablas técnicas del generator. `LISTEN/NOTIFY` como único canal asíncrono (`generation_requests`). Dos roles con permisos distintos (ver [Tokens y Autenticación](#tokens-y-autenticación)) |
| Webhook de alertas | URL única (`ALERT_WEBHOOK_URL`) compatible con Discord y Slack. La usan `api` (umbral de reportes) y `generator` (falla de generación) |
| Plausible Community Edition (self-hosted, **opcional**) | Analítica sin cookies en `web`: pageviews, orígenes del tráfico y eventos de share. **Apagado por defecto**: se activa con `VITE_PLAUSIBLE_DOMAIN` (ver [Analítica opcional](#analítica-opcional-plausible)). Se instala aparte (por ejemplo en `plausible.nerdose.dev`); no lo usa ningún servicio backend |
| APIs de Wikimedia | Fuente de los bancos `terms` y `timeline_facts` y de la promoción de palabras. Solo las consume `generator` |
| Enrutamiento de mismo origen | `nerdose.dev` sirve `web` y enruta `/api/*` a `api`; `admin.nerdose.dev` sirve `admin` y enruta `/api/admin/*` a la misma `api`. **Qué** se enruta está decidido; **cómo** (proxy, plataforma) es hosting y queda diferido |

### Servicios eliminados / fusionados

- **Servicio de stats/progreso separado** → dentro de `api`. Los agregados se actualizan en la **misma transacción** que cierra la partida (invariante 24); separarlo obligaría a consistencia eventual sin beneficio a esta escala.
- **Servicio de contenido/bancos separado** → dentro de `generator`. Content Banks y Challenge Publishing comparten toolchain, scheduler y acceso a Wikimedia, y el único consumidor de los bancos es el generador.
- **Scheduler/cron externo y cola de jobs (Redis, BullMQ)** → scheduler interno del `generator` + Postgres (`LISTEN/NOTIFY` + `FOR UPDATE SKIP LOCKED`). Un solo worker y pocos jobs por día no justifican otra pieza de infraestructura.
- **Publicador a las 00:00** → la `api` publica al cambiar el día. La publicación no depende de que otro proceso esté vivo justo en el pico de tráfico.
- **Servicio de notificaciones** → un helper `notify()` compartido. Hay dos emisores y un solo canal.
- **Redis (cache / rate limit)** → memoria del proceso de `api`. Hay una sola instancia para ~1.000 jugadores diarios; si se escala horizontalmente, el rate limit pasa a Postgres o Redis.
- **Sandbox de ejecución en la API** → no existe. La API nunca ejecuta código (D8); solo el `generator` ejecuta código **generado por él mismo**, nunca código de usuarios.

## Tecnologías por Servicio

### S1 — web

| Pieza | Tecnología | Razón |
|---|---|---|
| Lenguaje | TypeScript | Comparte tipos y schemas de jugadas con `api` y `generator` (D1) |
| UI | React 19 | SPA 100% interactiva; no hace falta SSR porque todo el contenido es por jugador y por día |
| Build | Vite | Arranque y build rápidos; code splitting nativo para cargar cada juego por separado |
| Routing | React Router | Rutas `/`, `/:game_id`, `/stats`, `/about`. Cada juego se carga con `React.lazy`, así la home no paga el peso de cada uno |
| Datos de servidor | TanStack Query | Cache de `/api/today` y `/api/me/stats`, e invalidación al terminar una partida o al cambiar el día |
| Estilos | Tailwind CSS v4 | Los tokens del prototipo (`#0A0C0F`, `#3DDC84`, acentos por juego) van al `@theme`. Es mobile-first por defecto |
| Tipografía | JetBrains Mono self-hosted (`@fontsource/jetbrains-mono`) | Identidad visual sin pedir fuentes a terceros: refuerza "sin banner de cookies" y no filtra IPs a Google |
| i18n de interfaz | i18next + react-i18next | Estándar maduro con detección del idioma del navegador. Los textos de **contenido** llegan ya resueltos desde la `api`; i18next solo maneja los textos de la UI |
| Drag & drop | dnd-kit (`TouchSensor` + `KeyboardSensor`) | Tech Timeline jugable con touch y teclado (WCAG / teclado) |
| Resaltado de código | Shiki (core, motor de regex JS, gramáticas js/go/java y un tema), lazy | Da tokens **por línea**, lo que necesita Bug Hunt para elegir líneas, con calidad tipo editor. Se carga solo en Big O y Bug Hunt |
| Validación | Zod (schemas de jugada del paquete de cada juego) | El front valida antes de enviar con el mismo schema que valida la `api` |
| Share | Web Share API, con Clipboard API como alternativa | Share nativo en mobile y copiar al portapapeles en desktop, sin dependencias |
| Analítica | Plausible (script) + eventos `share:<game_id>`, **detrás de un flag** | Sin cookies (sin banner). Los eventos por nombre no dependen de propiedades personalizadas. Con el flag apagado no se carga nada y no hay costo |

#### Analítica opcional (Plausible)

| Variable | Default | Efecto |
|---|---|---|
| `VITE_PLAUSIBLE_DOMAIN` | vacío | Vacío: no se inyecta el script y `track()` no hace nada. Con valor (`nerdose.dev`): se inyecta el script con `data-domain` |
| `VITE_PLAUSIBLE_SCRIPT_URL` | vacío (obligatorio si el dominio tiene valor) | URL del script del Plausible self-hosted, por ejemplo `https://plausible.nerdose.dev/js/script.js`. También sirve para apuntar al plan cloud sin cambiar código |

- Todo el código llama a un helper `track(event)` de `packages/ui`, nunca a `window.plausible` directamente. Así, prender o apagar la analítica no toca a los juegos.
- Las variables `VITE_*` se leen **al compilar**: cambiar el flag requiere un build y un deploy nuevos.
- Con el flag apagado, la plataforma funciona igual y solo se pierde la medición de tráfico y de shares. Las métricas del admin no dependen de Plausible.

### S2 — admin

| Pieza | Tecnología | Razón |
|---|---|---|
| Lenguaje / UI / build | TypeScript + React 19 + Vite | Mismo stack que `web`: reutiliza `packages/ui` y los componentes de cada juego |
| Preview de desafíos | Componentes `client` de cada juego en modo "solución" | La preview muestra lo que verá el jugador, con la solución superpuesta, sin duplicar UI |
| Datos | TanStack Query | Polling corto de "próximos desafíos" mientras haya regeneraciones pendientes |
| Estilos | Tailwind CSS v4 (mismos tokens) | Consistencia y cero costo extra |
| Métricas | Tablas HTML simples sobre `GET /api/admin/metrics` | Es una herramienta interna de una persona: tablas legibles alcanzan, sin librería de gráficos en v1 |
| Sesión | JWT en `sessionStorage` + `Authorization: Bearer` | Se borra al cerrar la pestaña; el origen es distinto de `web`, así que no comparte la cookie del jugador |
| Idioma | Solo español; las previews muestran `es` y `en` lado a lado | Un único usuario. Ver los dos idiomas juntos sirve para revisar las traducciones |
| Analítica | Ninguna | No hay nada que medir del uso interno |

### S3 — api

| Pieza | Tecnología | Razón |
|---|---|---|
| Runtime | Node.js 24 LTS | LTS con soporte hasta abril de 2028. `ARCHITECTURE.md` decía Node 22, que deja de tener soporte en abril de 2027, poco después del lanzamiento |
| Framework | Hono + `@hono/node-server` | Liviano y tipado, con middleware de cookies, JWT y validación incluidos (decisión previa) |
| Validación | Zod + `@hono/zod-validator` | `move_schema` de cada `GameDefinition` y bodies de todas las rutas |
| ORM / migraciones | Drizzle ORM + drizzle-kit | Tipado y SQL legible. El schema y las migraciones viven en `packages/db`, compartido con `generator` |
| Driver | postgres.js | Rápido, con soporte de `LISTEN/NOTIFY` y buena integración con Drizzle |
| JWT admin | `hono/jwt` (HS256) | Incluido en el framework; no hace falta una librería de auth para un solo usuario |
| Contraseña admin | `scrypt` + `timingSafeEqual` de `node:crypto`, con `ADMIN_PASSWORD_HASH` | Sin dependencias; no guarda la contraseña en texto plano y la comparación no filtra información por tiempo |
| Rate limit | `hono-rate-limiter` con store en memoria | Alcanza con una instancia (ver [Límites](#rate-limiting)) |
| Lista válida de Devdle | `Set` en memoria: archivo base + `terms` aprobados + `word_list_additions` | ~200k palabras, unos pocos MB. Lookup O(1) sin consultar la base en cada intento |
| Cache de desafíos | Mapa en memoria `game_id → challenge de hoy` | El payload es inmutable; solo se invalida al cambiar el día o al anular, ambos en el mismo proceso |
| Webhook | `fetch` nativo | Un POST JSON no justifica una dependencia |

### S4 — generator

| Pieza | Tecnología | Razón |
|---|---|---|
| Runtime | Node.js 24 LTS (TypeScript) | Reutiliza `packages/games/*/generator`, `polyglot`, `core` y `db` |
| Modo de ejecución | Worker long-running | Atiende los pedidos de regeneración al instante (decisión del usuario) y concentra todos los jobs en un proceso |
| Scheduler | croner (expresiones cron en UTC, dentro del proceso) | Sin cron del sistema ni infraestructura extra; los jobs quedan versionados con el código |
| Exclusión mutua | `pg_try_advisory_lock` por job | Evita corridas superpuestas aunque se reinicie el worker o haya dos réplicas por error |
| Pedidos de regeneración | `LISTEN generation_requests` + poll de respaldo cada 60 s con `FOR UPDATE SKIP LOCKED` | Reacción inmediata; el poll cubre los NOTIFY perdidos durante un reinicio |
| Toolchains | Node 24 · Go ≥ 1.25 · JDK 21 LTS | Compilan y ejecutan los snippets de Big O y Bug Hunt. Java corre en modo *source-file* (`java Main.java`) para evitar el paso de `javac` |
| Runner | `child_process.execFile` con timeout (10 s), usuario no root y un `main` por variante que corre todos los inputs | Un compilado por variante y lenguaje, no uno por test. El código lo genera el propio worker, así que el riesgo es bajo. El aislamiento del contenedor (sin red, límites de recursos) es parte del hosting y queda diferido |
| Seed / PRNG | `HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")` → `pure-rand` (xoroshiro128+) | Reproducible para debug, imposible de predecir sin el secreto; el `attempt` da los seeds derivados de los reintentos |
| Fuentes de datos | Wikidata SPARQL (`query.wikidata.org`), Wikipedia REST `page/summary` (es/en), Wiktionary y Wikidata `wbsearchentities` (MediaWiki API) | Datos abiertos con licencia compatible (CC0 / CC BY-SA). El cliente HTTP manda un `User-Agent` descriptivo con un contacto del proyecto, como exige la política de Wikimedia |
| Diccionario | ENABLE (dominio público) | Base de la lista válida de Devdle; se elige sobre SCOWL porque al ser de dominio público no exige atribución |

### Componentes compartidos

| Componente | Tecnología | Lo usan | Razón |
|---|---|---|---|
| `core` | TypeScript | api, generator, web | Contrato `GameDefinition`, día UTC y número de desafío (`LAUNCH_DATE`), lógica de rachas con días neutros, seed/PRNG, `notify()`, códigos de error |
| `db` | Drizzle (schema + migraciones + queries) | api, generator | Una sola definición del schema; las vistas `metrics_*` también viven acá |
| `games/<game_id>` | TypeScript, Zod, React | `definition` → api · `client` → web y admin · `generator` → generator | Un juego es un paquete enchufable: sumar un juego no toca la `api` ni el shell |
| `polyglot` | TypeScript | generator | Árbol de código, emisores JS/Go/Java (`emit(tree, lang) → { code, line_of }`) y runner multi-lenguaje |
| `ui` | React + Tailwind | web, admin | Header, banners, share, stat cards, tokens |

## Comunicación entre Servicios

### Conexiones

| De → A | Protocolo | Dirección | Naturaleza |
|---|---|---|---|
| web → api | HTTPS/JSON, mismo origen (`nerdose.dev/api/*`) | request/response | Todas las lecturas y mutaciones del jugador, con la cookie `nd_pid` |
| admin → api | HTTPS/JSON, mismo origen (`admin.nerdose.dev/api/admin/*`) | request/response | Login y operaciones del admin, con `Authorization: Bearer` |
| api → PostgreSQL | SQL (postgres.js) | lectura/escritura | Rol `nerdose_api`, con escritura limitada sobre `challenges` |
| generator → PostgreSQL | SQL + `LISTEN` | lectura/escritura | Rol `nerdose_generator`: dueño de `challenges` y de los bancos |
| api → generator | `pg_notify('generation_requests', request_id)` vía PostgreSQL | asíncrono, fire-and-forget | Pedido de regeneración desde el admin. Es el único mensaje entre backends |
| api → Webhook | HTTPS POST | saliente | Umbral de reportes alcanzado (best-effort, una vez por desafío) |
| generator → Webhook | HTTPS POST | saliente | Falta el desafío de mañana tras N reintentos (una vez por juego y fecha) |
| generator → Wikimedia | HTTPS GET | saliente | Reposición de bancos (semanal) y verificación de palabras (diaria) |
| generator → toolchains | Subproceso local (`node`, `go run`, `java`) | local | Verificación ejecutando de Big O y Bug Hunt |
| web → Plausible | HTTPS | saliente | Pageviews y eventos `share:<game_id>`. Solo si `VITE_PLAUSIBLE_DOMAIN` tiene valor |

### Patrones

1. **Request/response síncrono (HTTP) para todo lo del jugador.** Cada jugada se valida y se persiste antes de responder. No hay tiempo real ni WebSockets: el juego es por turnos y personal.
2. **Base de datos compartida con propiedad clara.** `api` y `generator` no se llaman por HTTP: se coordinan por PostgreSQL. La propiedad sigue los contextos: `generator` crea y aprueba desafíos y escribe los bancos; `api` solo cambia campos acotados de `challenges` (publicar, anular, `alert_sent_at`) y escribe jugadores, partidas, agregados y reportes. Los permisos por columna de los roles de Postgres hacen cumplir esa frontera.
3. **Cola de trabajos sobre Postgres.** `generation_requests` es una cola: la `api` inserta y notifica, y el `generator` toma con `FOR UPDATE SKIP LOCKED`. No hace falta un broker.
4. **Jobs programados en el worker.** El scheduler del `generator` corre jobs idempotentes protegidos por advisory locks; cada corrida se registra en `job_runs`.
5. **Publicación perezosa al cambiar el día.** El primer request de la `api` después de las 00:00 UTC ejecuta, una sola vez y protegido contra concurrencia, `UPDATE challenges SET status='published' WHERE status='approved' AND date = :today`, y recarga sus caches. Es idempotente y solo toca la fecha de hoy: un desafío `approved` de un día en el que la API no corrió nunca se publica, y ese día queda neutro.
6. **Recarga periódica de caches en la `api`.** La lista válida de Devdle se recarga al cambiar el día y cada 15 minutos (`terms` aprobados y `word_list_additions` nuevos).
7. **Alertas best-effort por webhook.** Se reclama el envío con un `UPDATE … WHERE alert_sent_at IS NULL RETURNING` y se manda después del commit. Si el POST falla, se vuelve `alert_sent_at` a `NULL` para que el próximo evento lo reintente.

### Canales de mensajería

No hay bus de mensajes. El único canal asíncrono es un `NOTIFY` de PostgreSQL:

| Canal | Publica | Escucha | Payload | Auth |
|---|---|---|---|---|
| `generation_requests` | api (rol `nerdose_api`) | generator (rol `nerdose_generator`) | `request_id` (uuid) | Credenciales de la base. El payload es solo un aviso: el dato real está en la tabla |

### Rate limiting

Valores para ~1.000 jugadores diarios, con margen para IPs compartidas (CGNAT de operadoras móviles, oficinas). Store en memoria de la `api`.

| Ruta | Clave | Límite | Razón |
|---|---|---|---|
| `POST /api/session` | IP | 20 / 10 min | Frena la creación masiva de jugadores sin bloquear un NAT compartido |
| `POST /api/games/:game_id/today/move` | `player_id` | 60 / min | Un humano no pasa de ~20 jugadas por minuto (Devdle, más los rechazos de lista; Grep Grid, más los errores) |
| `POST /api/games/:game_id/today/move` | IP | 300 / min | Varios jugadores detrás de la misma IP |
| `POST …/start`, `POST …/acknowledge-void`, `PATCH /api/me/preferences` | `player_id` | 30 / min | Acciones de baja frecuencia |
| `POST /api/games/:game_id/today/report` | IP (además de `UNIQUE(player_id, challenge_id)`) | 10 / hora | Limita reportes masivos desde una misma fuente |
| `GET /api/*` | IP | 600 / min | Solo frena abusos evidentes |
| `POST /api/admin/login` | IP | 5 / 15 min | Protege la contraseña única contra fuerza bruta |
| `/api/admin/*` (con JWT) | — | sin límite | Un solo usuario autenticado |

**Respuesta:** `429` con `{ "error": { "code": "rate_limited", "message": "…" } }` y header `Retry-After`. Sin captcha.

## Tokens y Autenticación

### Filosofía

No hay cuentas de jugador en v1. Hay tres identidades, cada una con el mínimo necesario:

- **Jugador anónimo:** una cookie funcional con un identificador imposible de adivinar. No guarda PII ni tiene contraseña. Si se borra la cookie, se pierde el progreso (límite aceptado).
- **Admin:** una contraseña única y un JWT de 8 horas, solo para `/api/admin/*`.
- **Servicios backend:** se autentican contra PostgreSQL con roles distintos. El `generator` no expone ninguna interfaz de red.

El modelo separa `Player` de `User` para sumar autenticación más adelante (por ejemplo con Better Auth) sin migrar datos.

### Cookie de jugador (`nd_pid`)

| Pieza | Definición |
|---|---|
| Valor | `players.id` (UUID v4, 122 bits aleatorios: imposible de adivinar) |
| Emisión | `POST /api/session`. Si la cookie ya existe y el jugador existe, se renueva y no crea nada (idempotente) |
| Atributos | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, sin `Domain`: solo se envía a `nerdose.dev`, nunca a `admin.nerdose.dev` |
| Duración | `Max-Age` de 400 días (el máximo que acepta Chrome), renovada en cada `POST /api/session`, que el front llama en cada carga. Mientras el jugador vuelva, la cookie no vence |
| Uso | Todas las rutas `/api/*` de jugador. Las que lo exigen responden `401 no_session` si falta |
| Cookies bloqueadas | `GET /api/today` funciona sin cookie y devuelve `has_session: false`. Si sigue en `false` después de `POST /api/session`, el front muestra el aviso y no deja jugar |
| CSRF | Mismo origen, `SameSite=Lax`, mutaciones solo con `Content-Type: application/json` y chequeo del header `Origin`. No hace falta token CSRF |
| CORS | Deshabilitado: todo es de mismo origen |

### JWT de admin

| Pieza | Definición |
|---|---|
| Login | `POST /api/admin/login { password }`. Se compara con `ADMIN_PASSWORD_HASH` (scrypt) en tiempo constante |
| Formato | JWT HS256 firmado con `ADMIN_JWT_SECRET`; claims `{ sub: "admin", iat, exp }` |
| Duración | 8 horas, sin refresh. Al vencer, `401` y vuelta al login |
| Almacenamiento | `sessionStorage` del admin |
| Transporte | `Authorization: Bearer <token>` |
| Revocación | Rotar `ADMIN_JWT_SECRET` invalida todas las sesiones |

### Roles de base de datos

| Rol | Permisos | Razón |
|---|---|---|
| `nerdose_api` | Lectura y escritura de `players`, `plays`, `player_game_stats`, `player_stats`, `challenge_reports`, `rejected_guesses`; `INSERT` en `generation_requests`. Sobre `challenges`: `SELECT` y `UPDATE` **solo** de `status`, `void_reason`, `voided_at` y `alert_sent_at`. Sobre `terms` y `timeline_facts`: `SELECT` y `UPDATE (status, rejection_reason)` (rechazo por anulación). Lectura de `word_list_additions`, `job_runs` y las vistas `metrics_*` | Hace cumplir en la base que la API nunca toca un `payload` ni crea desafíos |
| `nerdose_generator` | Dueño de `challenges`, `terms`, `timeline_facts`, `word_list_additions`, `generation_requests`, `generation_failures`, `job_runs`; lectura de `rejected_guesses` | Challenge Publishing y Content Banks |
| Dueño del schema | Corre las migraciones | Ninguno de los servicios puede alterar el schema |

### Secretos

| Secreto | Lo usa | Nota |
|---|---|---|
| `GENERATOR_SECRET` | generator | **Nunca** en la `api` ni en el repo: sin él no se pueden predecir los desafíos |
| `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET` | api | — |
| `ALERT_WEBHOOK_URL` | api, generator | — |
| `DATABASE_URL` (uno por rol) | api, generator | — |

Dónde y cómo se guardan es parte del hosting (diferido).

## Flujos Clave

Convenciones de todos los flujos:

- Errores: `{ "error": { "code": "<code>", "message": "<texto en el locale>" } }`.
- Locale de la respuesta: `?lang=` → `players.locale` → `Accept-Language` → `es`. La `api` resuelve los campos `{ es, en }` antes de responder.
- `today` = `(now() AT TIME ZONE 'UTC')::date`, calculado siempre en la `api`. `number` = `today − LAUNCH_DATE + 1`.
- Enums: `game_id` ∈ `devdle | bug-hunt | big-o | timeline | grep-grid`; `code_language` ∈ `js | go | java`; `locale` ∈ `es | en`.

### F1 — Primera visita, sesión y home

```
1. Browser → GET /api/today → api (sin cookie)
   ↓ lee los challenges de hoy de la cache; sin player, play_status = null
   ← 200 {
       date: "2026-11-03", number: 128,
       next_reset_at: "2026-11-04T00:00:00Z", seconds_to_reset: 41000,
       has_session: false,
       global_streak: { current: 0, max: 0 }, completed_today: 0,
       games: [ { game_id: "devdle",
                  challenge_status: "published" | "voided" | "none",
                  play_status: null | "in_progress" | "won" | "lost" | "voided",
                  history_label: null | "✓ 4/6",
                  current_streak: 0 }, … ×5 ]
     }
   → la home ya puede mostrar el catálogo

2. Browser → POST /api/session → api
   ↓ si la cookie nd_pid es válida y el player existe: renueva la cookie, actualiza last_seen_at
   ↓ si no: INSERT players (id, locale ← Accept-Language ∈ {es,en}, si no 'es',
                           preferred_code_language='js') → PlayerCreated; Set-Cookie nd_pid
   ← 200 { locale, preferred_code_language, created: true|false }

3. Browser → GET /api/today → api (con cookie)
   ← 200 { …, has_session: true, … }
   ↓ si has_session sigue en false: aviso "activá las cookies para jugar" (catálogo visible)

4. Countdown: cuando seconds_to_reset llega a 0, el front espera 0–3 s al azar
   (para no llegar todos juntos) y vuelve a pedir GET /api/today (ver F4)
```

`challenge_status` + `play_status` alcanzan para los 5 estados de la home: sin jugar (`published` + `null`), en curso (`in_progress`), completado (`won`/`lost`), sin desafío (`none`) y anulado (`voided`).

### F2 — Abrir un juego y retomar

```
1. Browser → GET /api/games/{game_id}/today → api
   ↓ challenge de hoy desde la cache
   ↓ play = SELECT plays WHERE player_id AND challenge_id
   ← 200 {
       game_id, date, number,
       challenge_status: "published" | "voided" | "none",
       public_view: <toPublic(payload) en el locale> | null,   // null si none o voided
       play: null | { status, state, score, code_language },
       result: null | <result(payload, state) en el locale>     // solo si play terminó
     }
   ↓ play == null → pantalla de instrucciones
   ↓ play.status == "in_progress" → retoma la partida con play.state
   ↓ play terminada → pantalla de resultado

2. El jugador sale de las instrucciones →
   Browser → POST /api/games/{game_id}/today/start { challenge_number: 128 } → api
   ↓ valida challenge_number == number de hoy (si no: 409 challenge_expired)
   ↓ INSERT plays (status='in_progress', state=initState(payload), started_at)
     ON CONFLICT (player_id, challenge_id) DO NOTHING → PlayStarted
   ← 200 { play: { status, state, score: null, code_language: null } }
```

Vistas públicas por juego (sin solución, invariante 18):

| game_id | `public_view` |
|---|---|
| devdle | `{ length, possible_categories[] }` |
| grep-grid | `{ grid: string[12][12], words: [ { term_id, word } ×8 ] }` |
| timeline | `{ category, prompt, items: [ { opaque_id, label } ×5 ] }` (mezclados) |
| big-o | `{ code: { js, go, java }, options: big_o_option[8] }` |
| bug-hunt | `{ spec, code: { js, go, java }, pickable_lines: int[], visible_tests: [ { input, expected } ] }` |

El cambio de lenguaje en Big O y Bug Hunt es **solo del cliente**: `public_view` trae el código en los tres lenguajes y no hace ningún request.

### F3 — Jugada y cierre de partida

```
1. Browser → POST /api/games/{game_id}/today/move
             { challenge_number: 128, move: <Move del juego> } → api
   ↓ 401 no_session · 404 no_challenge_today
   ↓ challenge_number ≠ number de hoy → 409 challenge_expired (F4)
   ↓ challenge.status == 'voided' → 409 challenge_voided
   ↓ move_schema.parse(move) → si falla: 422 invalid_move

2. BEGIN
   ↓ SELECT plays … FOR UPDATE (si no existe: INSERT in_progress, igual que /start)
   ↓ play.status ≠ 'in_progress' → 409 game_finished
   ↓ applyMove(payload, state, move, now)
       error not_in_word_list (Devdle) → INSERT rejected_guesses (word, player_id)
                                          ON CONFLICT DO NOTHING; COMMIT; 422 not_in_word_list
                                          (no consume intento, state sin cambios) → GuessRejected
       error invalid_move → ROLLBACK; 422 invalid_move
   ↓ UPDATE plays SET state → MoveApplied
   ↓ si isFinished(state):
       result = result(payload, state); win = isWin(result)
       UPDATE plays SET status = win ? 'won' : 'lost', result, score, code_language, finished_at
       → PlayFinished
       Progress (misma transacción, F3.1):
         player_game_stats ← streak por juego + played+1, wins+win, extra = reduceStats(extra, result)
         player_stats      ← global_streak, total_completed+1, last_active_date
       si game_id ∈ {big-o, bug-hunt}: players.preferred_code_language = move.language
       → StreaksUpdated
   COMMIT

3. ← 200 {
       feedback: <Feedback del juego>,
       play: { status, state, score },
       result: null | <Result en el locale>,
       streaks: null | { game: { current, max }, global: { current, max } }
     }
```

**Move y Feedback por juego** (`move` dentro del body):

| game_id | `move` | `feedback` |
|---|---|---|
| devdle | `{ guess: "REACT" }` (A–Z, largo = `length`; el front pasa a mayúsculas) | `{ guess, marks: ("correct"\|"present"\|"absent")[] }` |
| grep-grid | `{ type: "select", from: { row, col }, to: { row, col } }` o `{ type: "give_up" }` (0-based) | `{ found: true, term_id, word, definition, cells: [{row,col}] }` o `{ found: false, reason: "not_a_word" \| "already_found" }`. Dirección no permitida → `422 invalid_move` |
| timeline | `{ order: [opaque_id ×5] }` (faltantes o duplicados → `invalid_move`) | — (cierra) |
| big-o | `{ language: code_language, option: big_o_option }` | — (cierra) |
| bug-hunt | `{ language: code_language, line: int }` (`line` ∉ `pickable_lines` → `invalid_move`) | — (cierra). La `api` traduce `line` a nodo con `line_of[language]` y lo compara con `bug_node_id` |

**F3.1 — Rachas con días neutros** (`packages/core`, la usan cierre, lectura y recálculo):

```
prev_active_day(game_id, D) = max(date) FROM challenges
                              WHERE game_id = :game_id AND date < D
                                AND status IN ('published','voided')
prev_active_day_global(D)   = el mismo max(date), sin filtrar game_id

Al completar una Play del día D:
  game:   current_streak = (last_completed_date >= prev_active_day(game_id, D)) ? current_streak + 1 : 1
          (si last_completed_date == D, no cambia)
  global: global_streak  = (last_active_date >= prev_active_day_global(D)) ? global_streak + 1 : 1
          (si last_active_date == D, no cambia)
  max_* = max(max_*, current)

Al leer (racha viva):
  muestra current_streak si last_completed_date >= prev_active_day(game_id, today) o == today; si no, 0
```

Un día sin desafío publicado no figura en `challenges` como `published`/`voided`, así que el salto lo trata como neutro sin ningún job (invariantes 20–22).

### F4 — Cambio de día y jugada tardía

```
1. Primer request a la api con today ≠ current_day (variable en memoria):
   single-flight (un solo request ejecuta, el resto espera):
   ↓ UPDATE challenges SET status='published'
       WHERE status='approved' AND date = :today → ChallengePublished (por fila)
   ↓ recarga la cache de desafíos de hoy y la lista válida de Devdle
   ↓ current_day = today
   (también al arrancar el proceso)

2. Jugador con la partida de ayer abierta:
   Browser → POST /api/games/devdle/today/move { challenge_number: 127, move } (00:00:05 UTC)
   ← 409 challenge_expired
   ↓ el front invalida la cache y vuelve a pedir GET /api/today y GET /api/games/devdle/today
   ↓ la Play de ayer queda in_progress para siempre: no cuenta (invariante 15)
```

Sin `challenge_number` en el body, la jugada tardía se aplicaría al desafío nuevo, porque la ruta es siempre `today`. El número **no** es una fecha que manda el cliente: el servidor sigue calculando "hoy" y solo lo usa para detectar el desfase.

### F5 — Reporte de un problema y umbral de alerta

```
1. Browser → POST /api/games/{game_id}/today/report
             { challenge_number: 128, reason, message?, code_language? } → api
   reason ∈ wrong_answer | ambiguous | wrong_explanation | translation | display_bug | other
   ↓ 422 invalid_report si message > 1000 caracteres
   ↓ challenge de hoy con status ∈ {published, voided}; si no, 404
   BEGIN
   ↓ INSERT challenge_reports (challenge_id, player_id, reason, message, locale,
       context = { code_language, play_status, play_state, user_agent }, status='open')
     ON CONFLICT (player_id, challenge_id) → 409 already_reported
     → ChallengeReported
   ↓ n = count(DISTINCT player_id) WHERE reason IN (wrong_answer, ambiguous)
     f = count(plays) WHERE challenge_id AND status IN (won, lost)
     si alert_sent_at IS NULL y (n >= REPORT_ALERT_COUNT (3)
                                  o (n >= REPORT_ALERT_RATIO_MIN_COUNT (2) y n / f > REPORT_ALERT_RATIO (0.05))):
       UPDATE challenges SET alert_sent_at = now() WHERE id AND alert_sent_at IS NULL RETURNING id
   COMMIT
   ← 201 { report_id }

2. Si el UPDATE devolvió fila → notify(webhook, "Desafío #128 devdle: 3 reportes …  admin.nerdose.dev")
   → ReportThresholdReached. Si el POST falla: alert_sent_at = NULL (se reintenta con el próximo reporte)
```

### F6 — Anulación de un desafío

```
1. Admin → POST /api/admin/challenges/{challenge_id}/void
           { void_reason: "…", culprit: { kind: "term"|"timeline_fact"|"template"|"none", id?: uuid } }
           → api (JWT)
   ↓ status ≠ 'published' → 409 not_voidable; falta void_reason → 422
   BEGIN
   ↓ UPDATE challenges SET status='voided', void_reason, voided_at=now() → ChallengeVoided
   ↓ UPDATE plays SET status='voided', finished_at = coalesce(finished_at, now())
       WHERE challenge_id      (conservan result)
   ↓ UPDATE challenge_reports SET status='resolved' WHERE challenge_id AND status='open'
   ↓ culprit.kind = term          → UPDATE terms SET status='rejected', rejection_reason
     culprit.kind = timeline_fact → UPDATE timeline_facts SET status='rejected', rejection_reason
     culprit.kind = template      → solo queda en void_reason (se corrige en código)
   ↓ para cada player afectado: recalcula player_game_stats (ese juego) y player_stats
     recorriendo sus plays en orden de fecha con F3.1 y reduceStats, excluyendo las voided de
     played / wins / extra → StreaksUpdated
   COMMIT
   ↓ invalida la cache de desafíos de hoy
   ← 200 { challenge_id, affected_plays }

2. Jugador sin Play en el desafío anulado de hoy:
   GET /api/games/{game_id}/today → challenge_status: "voided", play: null
   → aviso "Este desafío tenía un error y fue anulado. Tu racha no se ve afectada" + botón
   Browser → POST /api/games/{game_id}/today/acknowledge-void { challenge_number } → api
   ↓ challenge de hoy con status 'voided'; INSERT plays (status='voided', finished_at=now())
     ON CONFLICT DO NOTHING; actualiza rachas (F3.1) y total_completed
   ← 200 { play: { status: "voided" }, streaks: { game, global } }
```

### F7 — Generación diaria (relleno de 14 días)

```
Scheduler del generator: cada hora en el minuto 10 (cron "10 * * * *", UTC)
1. pg_try_advisory_lock('fill'); si no lo obtiene, sale
2. Para cada game_id del registry, para cada date en [today+1 … today+14]
   sin challenge en status approved|published|voided:
     for attempt in 0 … GENERATION_MAX_ATTEMPTS-1 (20):
       seed = HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")
       candidate = games[game_id].generator.generate({ date, seed, history })
         history = challenges no rejected del juego en la ventana anti-repetición
       INSERT challenges (status='draft', number, payload, seed, generator_version) → ChallengeGenerated
       verification = verify(candidate):
         · comunes: textos es y en presentes; reglas de variedad del juego
         · devdle: término no usado en 365 días, categoría distinta de los últimos 3 días
         · grep-grid: cada palabra exactamente 1 vez en las direcciones permitidas
         · timeline: misma categoría, ≥ 1 año o precisión suficiente, 90 días
         · big-o: polyglot.run(versión instrumentada, n = 2^8…2^16 | 10…20) en js/go/java;
                  ajuste ops/f(n) para las 8 opciones → mejor ajuste == answer y sin empate
         · bug-hunt: polyglot.run(correcta y mutada, tests) en js/go/java; correcta coincide;
                  mutada falla ≥ 1 con el mismo resultado en los 3; ≥ 2 pasan; no equivalente;
                  failing_test = el más chico; línea del bug ∈ pickable_lines
       ok  → UPDATE status='approved', verification; terms/timeline_facts.last_used_* = date
             → ChallengeApproved; break
       no  → UPDATE status='rejected', verification → ChallengeRejected
3. Si para date = today+1 un juego sigue sin desafío:
     UPSERT generation_failures (game_id, date, attempts)
     si alert_sent_at IS NULL → notify(webhook) y alert_sent_at = now() → ChallengeGenerationFailed
4. INSERT job_runs (job='fill', status, summary={ generated, approved, rejected, missing })
```

Nunca se genera para `today`: si llega el día sin desafío, el juego muestra "sin desafío hoy" y el día es neutro. Generar a mitad del día cambiaría retroactivamente qué días son neutros.

### F8 — Regenerar un desafío desde el admin

```
1. Admin → POST /api/admin/challenges/{challenge_id}/regenerate → api (JWT)
   ↓ status ≠ 'approved' o date <= today → 409 not_regenerable
   ↓ INSERT generation_requests (challenge_id, status='pending', requested_at)
       (uno pendiente por challenge: si ya hay, devuelve ese)
   ↓ SELECT pg_notify('generation_requests', request_id)
   ← 202 { request_id }

2. generator (LISTEN, o poll cada 60 s):
   ↓ SELECT … FROM generation_requests WHERE status='pending' FOR UPDATE SKIP LOCKED
   ↓ genera y verifica como F7, con attempt a partir del último usado para (game_id, date)
   ↓ ok → BEGIN
            UPDATE challenges (viejo) SET status='rejected' (verification.reason='regenerated')
            UPDATE challenges (nuevo) SET status='approved'
            UPDATE generation_requests SET status='done', new_challenge_id, processed_at
          COMMIT → ChallengeRejected + ChallengeApproved
   ↓ falla tras N intentos → generation_requests.status='failed', error; el viejo sigue approved

3. Admin hace polling de GET /api/admin/challenges/upcoming mientras haya pendientes
```

El viejo sigue `approved` hasta que el nuevo está verificado, así que regenerar nunca deja un día sin desafío.

### F9 — Reposición de bancos

```
Scheduler: semanal, lunes 04:00 UTC ("0 4 * * 1"); advisory lock 'replenish'
Para bank ∈ { terms, timeline_facts }:
1. stock = ítems approved disponibles según el consumo y la ventana anti-repetición del banco
   si alcanza para ≥ 365 días → registra y sigue con el próximo banco
2. Wikidata SPARQL por cada clase del mapeo clase → categoría (tabla en código):
     wikidata_id, label en, labels/descripciones es/en, sitelinks, artículos es/en,
     (timeline) P571 | P577 con su precisión
3. Wikipedia REST GET /api/rest_v1/page/summary/{title} en es y en → summary / note
4. Reglas de aceptación:
     terms: label en → mayúsculas, solo A–Z, 4–12 letras; descripción y artículo en es y en;
            sitelinks ≥ mínimo; no está en la lista de exclusión; sin duplicados
     timeline_facts: una sola fecha sin contradicciones; sitelinks ≥ mínimo; si la nota menciona
            otro año, se usa la descripción corta
   UPSERT por wikidata_id: approved | rejected (rejection_reason) → ContentItemApproved / Rejected
5. INSERT job_runs (job='replenish_<bank>', summary = { imported, approved, rejected, stock,
                    rejections: [ { wikidata_id, label, reason } ] }) → ContentBankReplenished
```

### F10 — Lista válida de Devdle y su ampliación

```
Base (en build): script del generator → ENABLE filtrado (A–Z, 4–12)
                 ∪ labels en inglés A–Z de conceptos de computación de Wikidata
                 → artefacto versionado del paquete devdle (unión ordenada alfabéticamente)

api (al arrancar, al cambiar el día y cada 15 min):
  valid_words = base ∪ { term FROM terms WHERE status='approved' } ∪ { word FROM word_list_additions }
  (sumar terms garantiza que toda respuesta posible sea un intento válido aunque el banco
   haya crecido después del build)

generator, diario 05:00 UTC ("0 5 * * *"), advisory lock 'promote_words':
1. SELECT word, count(*) AS distinct_players FROM rejected_guesses
   GROUP BY word HAVING count(*) >= 5 AND word NOT IN (SELECT word FROM word_list_additions)
2. Por palabra: Wikidata wbsearchentities (label exacto, en) → source='wikidata'
               si no, Wiktionary (en) action=query&titles={word} existe → source='wiktionary'
3. INSERT word_list_additions (word, source, distinct_players, added_at) → WordListExtended
4. job_runs (job='promote_words')
```

La lista nunca se envía al cliente. Si algún día se manda para validar al instante, se manda la unión ordenada y nunca las respuestas posibles por separado.

### F11 — Admin: login, reportes, próximos, stock y métricas

```
POST  /api/admin/login { password } → 200 { token, expires_at } | 401 invalid_credentials | 429
GET   /api/admin/reports?status=open
      → 200 { groups: [ { challenge: { id, game_id, date, number, status, payload, verification },
                          report_count, reasons: { <reason>: n },
                          reports: [ { id, reason, message, locale, context, status, created_at } ] } ] }
        (ordenados por report_count desc; el payload incluye la solución y ambos idiomas)
PATCH /api/admin/reports/{report_id} { status: "resolved"|"dismissed" } → 200 → ReportResolved/Dismissed
POST  /api/admin/challenges/{challenge_id}/void        → F6
GET   /api/admin/challenges/upcoming?days=14
      → 200 { days: [ { date, number, games: [ { game_id,
                          challenge: null | { id, status, payload, verification, generator_version },
                          pending_request: null | { request_id, status } } ] } ] }
POST  /api/admin/challenges/{challenge_id}/regenerate  → F8
GET   /api/admin/content/stock
      → 200 { banks: [ { bank: "terms"|"timeline_facts", approved_available, approved_total,
                         rejected_total, days_of_stock,
                         last_run: { finished_at, imported, approved, rejected, rejections[] } } ] }
GET   /api/admin/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD
      → 200 { daily_players:       [ { date, game_id | null, players } ],        // metrics_daily_players
              retention:           [ { cohort_date, cohort_size, d1, d7 } ],      // metrics_retention
              streak_distribution: [ { bucket, players } ],                       // metrics_streak_distribution
              challenge_quality:   [ { challenge_id, game_id, date, number, started, finished,
                                       completion_rate, win_rate, reports, status } ] } // metrics_challenge_quality
```

Definiciones de las vistas `metrics_*`:
- `daily_players`: jugadores distintos con alguna Play iniciada, por fecha (total y por juego).
- `retention`: cohorte por fecha de la primera Play completada; `d1`/`d7` = % con una Play completada en cohorte+1 / cohorte+7.
- `streak_distribution`: jugadores por tramo de `global_streak` vivo (0, 1, 2–6, 7–29, 30+).
- `challenge_quality`: `started` = Play creadas (incluye `/start`), `finished` = won + lost, `completion_rate` = finished / started, `win_rate` = won / finished.

### F12 — Estadísticas del jugador

```
Browser → GET /api/me/stats?history_before=YYYY-MM-DD → api
↓ player_stats, player_game_stats (rachas vivas según F3.1)
↓ plays de los últimos 365 días para el heatmap; historial paginado de a 60
← 200 {
    global: { current_streak, max_streak, total_completed },
    games: [ { game_id, current_streak, max_streak, played, wins, win_rate, extra } ],
    heatmap: [ { date, completed } ],
    history: [ { date, number, game_id, status, label } ],     // label = historyLabel(result)
    history_next_before: null | "YYYY-MM-DD"
  }
```

`extra` es la stat propia de cada juego (distribución de intentos, promedio N/8, promedio por categoría, aciertos por `recipe_category`, aciertos por `code_language` y `bug_type`). Las Play `voided` no entran en `played`, `wins` ni `extra`.

### F13 — Preferencias y share

```
Idioma / lenguaje de código:
Browser → PATCH /api/me/preferences { locale?: "es"|"en", preferred_code_language?: "js"|"go"|"java" }
← 200 { locale, preferred_code_language } → PlayerPreferencesChanged
↓ cambiar el locale a mitad de partida: el front vuelve a pedir GET /api/games/{game_id}/today
  (los textos vuelven en el idioma nuevo; la partida no cambia)

Share (solo cliente, sin request a la api):
texto = share(result, number)   // del paquete del juego; nunca incluye la solución
"🟩 Devdle #128\n🟩🟨⬛⬛⬛\n🟩🟩🟩🟩🟩\n2/6\nnerdose.dev"
→ navigator.share({ text }) | navigator.clipboard.writeText(text)
→ track('share:devdle')   // no hace nada si Plausible está apagado
```

## Validación de Cobertura

**Cobertura: 97/99 requerimientos funcionales.** Las 2 faltas son diferimientos con nombre (ver al final de la tabla).

| Categoría | Requerimiento | Cubierto por |
|---|---|---|
| Reglas comunes | Día de la plataforma UTC, calculado por el servidor | api: `today` UTC en `core`; el cliente nunca manda fecha (F1, F4) |
| Reglas comunes | Número de desafío = día de la plataforma, igual para los 5 juegos | `core`: `today − LAUNCH_DATE + 1`; el generator lo graba en `challenges.number` (F7) |
| Reglas comunes | Una partida por jugador, juego y día; terminada no acepta jugadas | `UNIQUE(player_id, challenge_id)` + `FOR UPDATE` + `409 game_finished` (F3) |
| Reglas comunes | Pantallas de instrucciones, partida y resultado | web: `client` de cada juego; el estado se deriva de `play` (F2) |
| Reglas comunes | Retomar la partida el mismo día | `plays.state` persistido + `GET /api/games/{game_id}/today` (F2) |
| Reglas comunes | Jugada tardía → `challenge_expired`; partida vieja sin terminar | `challenge_number` en el body + `409 challenge_expired` (F4) |
| Reglas comunes | Resultado: solución, explicación, resultado, share y rachas | `result` + `streaks` en la respuesta de la jugada que cierra (F3) |
| Reglas comunes | Share sin spoilers por portapapeles o share nativo | web: `share()` del paquete + Web Share / Clipboard API (F13) |
| Reglas comunes | Sin desafío hoy → aviso y día neutro | `challenge_status: "none"` (F1/F2) + `prev_active_day` (F3.1) |
| FG-1 | Jugador anónimo con cookie funcional httpOnly | `POST /api/session` + cookie `nd_pid` (F1, Tokens) |
| FG-1 | Home: 5 juegos, estado del día, racha global, resumen y cuenta regresiva | `GET /api/today` (F1) |
| FG-1 | Idioma del navegador, selector visible, persistido y cambiable a mitad de partida | `Accept-Language` al crear + `PATCH /api/me/preferences` + i18next (F1, F13) |
| FG-1 | Lenguaje de código preferido (JS por defecto) | `players.preferred_code_language` (F1, F3, F13) |
| FG-1 | Cookie borrada → jugador nuevo | `POST /api/session` sin cookie crea otro Player (límite aceptado) |
| FG-1 | Cookies bloqueadas → catálogo visible, sin jugar, con aviso | `has_session: false` (F1) |
| FG-1 | Cuenta regresiva en 0 → recarga del estado | `next_reset_at` + refetch con jitter (F1, F4) |
| FG-1 | Home como producto de entretenimiento; juegos como experiencias independientes | web: shell + `client` por juego con acento propio (decisión de UX, sin impacto técnico) |
| FG-2 Devdle | Feedback verde/amarillo/gris con letras repetidas, 6 intentos | `devdle.definition.applyMove` en api (F3) |
| FG-2 Devdle | Lista de palabras válidas; fuera de lista → `not_in_word_list` sin consumir intento | `Set` en memoria (F10) + `422 not_in_word_list` sin cambiar el state (F3) |
| FG-2 Devdle | La lista crece sola (5 jugadores + Wikidata/Wiktionary) | `rejected_guesses` (api) + job `promote_words` (generator) + recarga cada 15 min (F10) |
| FG-2 Devdle | Las respuestas posibles nunca se envían al cliente | La lista vive solo en la api; `public_view` = `{ length, possible_categories }` |
| FG-2 Devdle | Respuesta no usada en 365 días, rotando la categoría respecto de 3 días | `devdle.generator` + verificación (F7) |
| FG-2 Devdle | Share `N/6` con grilla y stats de distribución de intentos | `share()` + `reduceStats` → `extra` |
| FG-3 Grep Grid | Grilla 12×12, 8 palabras, direcciones permitidas, validación server de la selección | `grep-grid.definition.applyMove` (F3) |
| FG-3 Grep Grid | Sin tiempo | Sin `/start` de tiempo ni reloj server; puntaje = palabras encontradas |
| FG-3 Grep Grid | "Rendirse" → derrota N/8, cuenta para la racha y revela las faltantes | `move: { type: "give_up" }` → `lost` + `result` (F3) |
| FG-3 Grep Grid | 8 palabras ≤ 12, sin repetir en 30 días; cada una exactamente 1 vez | `grep-grid.generator` + verificación de unicidad (F7) |
| FG-3 Grep Grid | Las posiciones nunca se envían al cliente | `public_view` sin `placements`; solo se devuelven las `cells` de palabras ya encontradas |
| FG-3 Grep Grid | Selección inválida, repetida o en reversa | `found:false not_a_word` / `already_found` / `422 invalid_move` (F3) |
| FG-3 Grep Grid | Share `N/8` y stats (promedio, % 8/8) | `share()` + `reduceStats` |
| FG-4 Timeline | 5 elementos, drag & drop con touch y teclado, un intento, puntaje 0–5 | dnd-kit (web) + `timeline.definition` (F3) |
| FG-4 Timeline | Misma categoría, sin ambigüedad, sin repetir en 90 días | `timeline.generator` + verificación (F7) |
| FG-4 Timeline | IDs opacos aleatorios por desafío | `items[].opaque_id` generados con el seed del desafío |
| FG-4 Timeline | Envío con faltantes o duplicados → `invalid_move`; fechas discutidas fuera del banco | `move_schema` + regla de reposición (F9) |
| FG-4 Timeline | Categorías v1 = las que Wikidata cubre con calidad | Mapeo clase → categoría (6 categorías) en el generator (F9) |
| FG-4 Timeline | Share 🟩/🟥 ×5 + `N/5` y stats por categoría | `share()` + `reduceStats` |
| FG-5 | Reportar con motivo, comentario ≤ 1000 y contexto | `POST …/report` (F5) |
| FG-5 | Un reporte por jugador y desafío, con rate limit | `UNIQUE` + `409 already_reported` + 10/h por IP |
| FG-5 | Umbral de alerta configurable + webhook | F5 + `ALERT_WEBHOOK_URL` (Discord/Slack) |
| FG-5 | Admin en `admin.nerdose.dev`, contraseña única, sesión 8 h, 401 al vencer | S2 + JWT HS256 de 8 h (Tokens, F11) |
| FG-5 | Reportes agrupados por desafío con la solución; resolver o descartar | `GET /api/admin/reports` + `PATCH …/reports/{id}` (F11) |
| FG-5 | Anular: deja de aceptar jugadas, muestra aviso, permite marcar completado, cierra partidas en curso, excluye de % y stats, rechaza el ítem culpable | F6 |
| FG-5 | Próximos 14 días con log de verificación; regenerar | `GET …/upcoming` + F8 |
| FG-5 | Stock de contenido y rechazos de la última reposición | `GET /api/admin/content/stock` + `job_runs` (F9, F11) |
| FG-5 | Nunca se despublica automáticamente | Solo `POST …/void` (JWT) cambia a `voided`; la alerta solo notifica |
| FG-5 | Cada reporte confirmado → test de regresión o regla nueva | ❌ Diferido — es un proceso de desarrollo; se define con la estrategia de testing (fuera de alcance) |
| FG-5 | Canal de alerta: mail | ❌ Diferido — v1 manda a un webhook compatible con Discord/Slack; el mail requiere un proveedor de envío (se resuelve con hosting) |
| FG-6 Big O | Código en el lenguaje elegido, cambio libre como vista | `public_view.code {js,go,java}`; el cambio es solo del cliente (F2) |
| FG-6 Big O | 8 opciones fijas, un intento con selección + confirmación | `big_o_option` + `big-o.definition` (F3) |
| FG-6 Big O | Peor caso, sin construcciones dependientes de datos, O(2ⁿ) por convención, trampas, ≤ 15 líneas y 3 niveles | Catálogo de bloques + `big-o.generator` |
| FG-6 Big O | Verificación ejecutando con varios tamaños; si no coincide o es ambigua, se descarta | `polyglot.run` + ajuste `ops/f(n)` (F7) |
| FG-6 Big O | Variedad: receta no repetida en 30 días, misma respuesta ≤ 2 días seguidos | Verificación de variedad sobre `history` (F7) |
| FG-6 Big O | Se registra el lenguaje confirmado y se guarda como preferencia | `plays.code_language` + `players.preferred_code_language` (F3) |
| FG-6 Big O | Share 🟩/🟥 + lenguaje; stats por `recipe_category` | `share()` + `reduceStats` |
| FG-7 Bug Hunt | Spec, función, tests visibles y aviso de test oculto | `public_view` (F2) |
| FG-7 Bug Hunt | Líneas elegibles; una sentencia por línea, igual en los 3 lenguajes | Emisores de `polyglot` + `pickable_lines` + `line_of` |
| FG-7 Bug Hunt | Mutation testing: falla en los 3, ≥ 2 pasan, sin equivalentes, test más chico | `bug-hunt.generator` + `polyglot.run` (F7) |
| FG-7 Bug Hunt | Tipos de bug v1 | Catálogo de mutaciones (`bug_type`) |
| FG-7 Bug Hunt | Variedad: sin repetir plantilla + parámetros + mutación en 60 días | Verificación de variedad (F7) |
| FG-7 Bug Hunt | Resultado: línea, test que falla, diff y explicación | `result()` de bug-hunt (F3) |
| FG-7 Bug Hunt | Share 🟩/🟥 + lenguaje; stats por lenguaje y por tipo de bug | `share()` + `reduceStats` |
| FG-8 | Pantalla de stats: rachas, récords, completados, % de victorias y stats propias | `GET /api/me/stats` (F12) |
| FG-8 | Heatmap e historial con etiquetas cortas | `heatmap` + `history[].label` = `historyLabel` (F12) |
| FG-8 | Racha por juego y global con días neutros; viva si es hoy o ayer | F3.1 |
| FG-8 | Los anulados cuentan para la racha, no para % ni stats propias | F6 (recálculo) + exclusión en `played`/`wins`/`extra` |
| FG-8 | El historial es la fuente de verdad; los agregados se recalculan | Recálculo desde `plays` en `core` (F6) |
| Generación | Siempre hay desafíos aprobados para los próximos 14 días | Job `fill` cada hora (F7) |
| Generación | Publicación automática sin revisión humana | `approved` → `published` al cambiar el día (F4) |
| Generación | Reintentos con seed derivado | `attempt` en el HMAC (F7) |
| Generación | Alerta si falta el desafío de mañana tras N reintentos | `generation_failures` + webhook una vez (F7) |
| Generación | Bancos se reponen solos (semanal) con < 1 año de stock; sin dos idiomas → rejected | Job `replenish` (F9) |
| Generación | Inmutabilidad: se guarda el desafío, no solo el seed | `challenges.payload` + `generator_version`; `nerdose_api` sin permiso sobre `payload` |
| Generación | Imprevisibilidad: seed con secreto fuera del repo | `GENERATOR_SECRET` solo en el generator (Secretos) |
| Generación | Sin LLM | Generadores por reglas + ejecución (S4) |
| Anti-spoiler | La solución nunca sale del servidor antes de terminar | `toPublic` / `result` del `GameDefinition`; `payload` nunca se serializa (F2, F3) |
| Anti-spoiler | Validación 100% server-side; la API nunca ejecuta código | `applyMove` en api; la ejecución vive solo en el generator |
| Anti-spoiler | IDs públicos que no revelan información | `opaque_id` (Timeline), sin `placements` (Grep Grid), sin `bug_node_id` (Bug Hunt) |
| Rate limiting | Jugadas por jugador e IP (valores concretos) | 60/min por player, 300/min por IP ([Rate limiting](#rate-limiting)) |
| Rate limiting | Crear sesión por IP | 20 / 10 min por IP |
| Rate limiting | Reportes: 1 por jugador y desafío + límite por IP | `UNIQUE` + 10/h por IP |
| Rate limiting | HTTP 429 con mensaje genérico, sin captcha | `429 rate_limited` + `Retry-After` |
| Escala | ~1.000 jugadores diarios, pico a las 00:00, una instancia | api única con caches en memoria, publicación single-flight y refetch con jitter (F1, F4) |
| Accesibilidad | Mobile-first y desktop | Tailwind mobile-first (S1) |
| Accesibilidad | WCAG 2.1 AA (contraste, foco visible, labels) | Tokens del DS + componentes de `ui` (detalle en UX/DS) |
| Accesibilidad | Todos los juegos jugables con teclado, incluido el drag & drop | dnd-kit `KeyboardSensor`; inputs de teclado por juego |
| Accesibilidad | El feedback no depende solo del color | `marks` / posiciones con ícono o patrón en `client` (Devdle, Timeline) |
| Privacidad | Cookie funcional sin PII y sin banner | `nd_pid` = UUID; sin cookies de terceros; fuente self-hosted |
| Privacidad | Analítica sin cookies | Plausible en S1, detrás de flag (apagado por defecto: sin ningún script de terceros) |
| Privacidad | Retención indefinida | Sin jobs de purga |
| Privacidad | Aviso de privacidad en el footer y atribución de Wikipedia/Wikidata en "Acerca de" | web: ruta `/about` + footer |
| Identidad visual | Estética terminal, JetBrains Mono, `#3DDC84`, acento por juego | Tailwind `@theme` + `@fontsource/jetbrains-mono` |
| i18n | Todo lo que lee el jugador en ES y EN; sin los dos idiomas no se publica | Campos `{es,en}` + verificación de textos (F7, F9) + i18next para la UI |
| i18n | Misma solución en ambos idiomas; el código no se traduce | La solución vive fuera de `{es,en}`; `code {js,go,java}` sin traducir |
| Métricas | DAU total y por juego | `metrics_daily_players` + admin Métricas (F11) |
| Métricas | Distribución de rachas globales y retorno D1/D7 | `metrics_streak_distribution` + `metrics_retention` (F11) |
| Métricas | Tasa de completado y % de victorias por juego y desafío | `metrics_challenge_quality` (F11) |
| Métricas | Reportes por desafío y desafíos anulados | `metrics_challenge_quality.reports/status` + admin Reportes |
| Métricas | Clicks en compartir por juego | Plausible `share:<game_id>` vía `track()` (F13). ⚠️ Solo se mide con el flag activo; el código queda listo desde v1 |
| Extensibilidad | Sumar juegos nuevos como módulos | Contrato `GameDefinition` + paquete `games/<game_id>` (registry en api, web y generator) |

**Diferidos con nombre (2):**
1. **Reporte confirmado → test de regresión / regla nueva:** es un proceso de desarrollo, no un mecanismo del sistema. Se define junto con la estrategia de testing.
2. **Alertas por mail:** v1 cubre Discord/Slack por webhook. El mail necesita un proveedor de envío, que se decide con el hosting.

**Alcance agregado respecto del análisis funcional:** la sección **Métricas** del admin (`GET /api/admin/metrics` + vistas `metrics_*`), por decisión del usuario en este análisis. `/product-initialize` la tiene que sumar a FG-5 o a un FG propio.

## Decisiones Operativas Fuera de Alcance

- **Estructura del proyecto:** monorepo con pnpm workspaces y Turborepo, ya propuesto en `ARCHITECTURE.md` §5. Este análisis solo fija los **componentes** compartidos (`core`, `db`, `games/*`, `polyglot`, `ui`), no el layout.
- **CI/CD y ambientes**, incluido el job de CI que compila con `go build` y `javac` para detectar código mal emitido.
- **Estrategia de testing** (`ARCHITECTURE.md` proponía Vitest + Playwright), relojes falsos para fechas y rachas, y el proceso de convertir reportes confirmados en tests de regresión.
- **Observabilidad:** logs, métricas técnicas, error tracking y alertas operativas más allá del webhook funcional.
- **Hosting y despliegue:** plataforma, reverse proxy o routing para el mismo origen, imagen del generator (Node + Go + JDK), aislamiento del contenedor (sin red y con límites para el runner), Postgres gestionado, backups, DNS y TLS de `nerdose.dev` / `admin.nerdose.dev`.
- **Gestión de secretos:** dónde viven `GENERATOR_SECRET`, `ADMIN_*`, `ALERT_WEBHOOK_URL` y `DATABASE_URL`, y cómo se rotan.
- **Proveedor de mail** para alertas.
- **Instalar Plausible Community Edition self-hosted** (Plausible + su PostgreSQL + ClickHouse, en un subdominio propio como `plausible.nerdose.dev`) y activar `VITE_PLAUSIBLE_DOMAIN` / `VITE_PLAUSIBLE_SCRIPT_URL`. El código de `web` queda listo desde v1; instalarlo es parte del hosting.
- **Escalado horizontal:** si se supera una instancia, el rate limit y las caches pasan a un store compartido.

## Notas de Consistencia

Cambios respecto de `docs/ARCHITECTURE.md`, a reflejar en `/product-initialize-technical`:

| Tema | `ARCHITECTURE.md` | Este análisis | Origen |
|---|---|---|---|
| Grep Grid | Tiempo oficial, `/start` solo para Grep Grid, stats de tiempo | Sin tiempo. `/start` pasa a ser genérico e idempotente (crea la Play `in_progress` al salir de las instrucciones); desaparece `not_started` | Decisión funcional #6 |
| Jugada | `{ move }` | `{ challenge_number, move }` para detectar la jugada tardía | Hueco detectado (F4) |
| Preferencias | `PUT /api/me/locale` | `PATCH /api/me/preferences { locale?, preferred_code_language? }` | Dominio: `PlayerPreferencesChanged` |
| Anulación | Sin endpoint | `POST /api/admin/challenges/{id}/void` y `POST …/today/acknowledge-void` | Invariante 28 |
| `plays.status` | `in_progress \| won \| lost` | Suma `voided` | Decisión funcional #13 |
| Lista válida de Devdle | Solo un archivo de build | Base de build ∪ `terms` aprobados ∪ `word_list_additions`, recargada | Hueco detectado: un término nuevo podría ser la respuesta y no estar en la lista |
| Regenerar | "Opcionalmente se puede regenerar" | Cola `generation_requests` + `LISTEN/NOTIFY`; reemplazo atómico | El worker siempre activo es decisión del usuario |
| Publicación | Implícita | La api publica al cambiar el día (UPDATE idempotente) | Decisión del usuario |
| Generación | Cron diario 03:00 UTC | Job `fill` cada hora, nunca para `today` | Necesario para regenerar y reintentar sin dejar huecos |
| Runtime | Node 22 | Node 24 LTS | Node 22 deja de tener soporte en abril de 2027 |
| Admin | 3 secciones | 4 secciones (suma Métricas) | Decisión del usuario |
| Plausible | Fase 6 del plan de construcción | Integrado desde v1 detrás de `VITE_PLAUSIBLE_DOMAIN`, apagado por defecto; se va a usar Plausible CE self-hosted | Decisión del usuario: sin costo de SaaS, se activa cuando esté instalado |
| Contraseña admin | `ADMIN_PASSWORD` en texto plano | `ADMIN_PASSWORD_HASH` (scrypt) | Seguridad |
| Rate limit | Sin valores | Valores definidos | Pendiente del análisis funcional |

Ajustes al modelo de dominio:

- **Escrituras de la `api` sobre Challenge:** además de la anulación (`status`, `void_reason`, `voided_at`, `alert_sent_at`), la `api` hace la transición `approved → published` al cambiar el día. No toca el `payload`.
- **Invariante 1 (unicidad):** se implementa como índice único parcial sobre `(game_id, date)` con `status IN ('approved','published','voided')`. Un `draft` puede convivir un momento con el `approved` que va a reemplazar durante una regeneración (F8).
- **Umbral de alerta (invariante 27):** el criterio del 5% exige además un mínimo de 2 reportes (`REPORT_ALERT_RATIO_MIN_COUNT`, configurable), para que un solo reporte temprano sobre pocas partidas no dispare la alerta.
- **Entidades técnicas nuevas** (no son del dominio; las escribe el generator): `generation_requests` (id, challenge_id, status `pending|done|failed`, new_challenge_id, error, requested_at, processed_at), `generation_failures` (PK game_id + date, attempts, alert_sent_at) y `job_runs` (id, job, status, started_at, finished_at, summary jsonb).
- **Vistas `metrics_*`** en `packages/db`: `metrics_daily_players`, `metrics_retention`, `metrics_streak_distribution`, `metrics_challenge_quality`.

## Resumen de Decisiones Técnicas

| # | Tema | Decisión |
|---|---|---|
| Arq-1 | Servicios | 4 servicios: `web`, `admin`, `api`, `generator`, más un PostgreSQL compartido. Sin bus ni Redis |
| Arq-2 | Lenguaje | TypeScript en todo; Node.js 24 LTS en `api` y `generator` |
| Arq-3 | Front | React 19 + Vite + React Router + TanStack Query + Tailwind v4; i18next; dnd-kit; Shiki lazy |
| Arq-4 | Back | Hono + Zod + Drizzle + postgres.js |
| Arq-5 | Contrato de juegos | `GameDefinition` por paquete `games/<game_id>`, con `definition` (api), `client` (web/admin) y `generator` |
| Arq-6 | Generator | Worker siempre activo con croner, advisory locks y `LISTEN generation_requests`; toolchains Node 24 / Go ≥ 1.25 / JDK 21 |
| Arq-7 | Publicación | La api pasa `approved → published` con el primer request del día (single-flight, solo `date = today`) |
| Arq-8 | Relleno | Job `fill` cada hora para `today+1 … today+14`; 20 intentos con seed `HMAC(secret, game:date:attempt)`; nunca para hoy |
| Arq-9 | Regenerar | Cola en Postgres + NOTIFY; el viejo sigue `approved` hasta que el nuevo está verificado (swap atómico) |
| Arq-10 | Comunicación api ↔ generator | Solo por PostgreSQL, con propiedad de tablas y permisos por columna en dos roles |
| Arq-11 | Mismo origen | `nerdose.dev/api/*` y `admin.nerdose.dev/api/admin/*` enrutan a la misma api; sin CORS |
| Arq-12 | Identidad del jugador | Cookie `nd_pid` (UUID v4, HttpOnly, Secure, Lax, host-only, 400 días renovados) |
| Arq-13 | Auth admin | Contraseña con scrypt + JWT HS256 de 8 h en `sessionStorage`, como Bearer |
| Arq-14 | Jugada tardía | `challenge_number` en cada mutación de partida → `409 challenge_expired` |
| Arq-15 | Rachas | `prev_active_day` sobre `challenges` publicados/anulados: días neutros sin jobs; recálculo desde `plays` |
| Arq-16 | Caches | En memoria de la api: desafíos de hoy y lista válida de Devdle (base ∪ terms ∪ additions), recargadas por día, cada 15 min y al anular |
| Arq-17 | Rate limit | En memoria; valores en la tabla de [Rate limiting](#rate-limiting); 429 con `Retry-After` |
| Arq-18 | Alertas | Webhook único compatible con Discord/Slack, best-effort y una vez por evento |
| Arq-19 | Métricas | Vistas `metrics_*` en Postgres + sección Métricas en el admin. Plausible CE self-hosted para tráfico y shares, detrás de `VITE_PLAUSIBLE_DOMAIN` y apagado por defecto |
| Arq-20 | Contratos JSON | `snake_case`, con los mismos nombres que el dominio y la DB; errores `{ error: { code, message } }` |
