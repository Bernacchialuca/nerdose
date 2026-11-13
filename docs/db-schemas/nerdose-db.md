---
created: 2026-11-03
last_updated: 2026-11-10
status: "Draft"
---

# Esquema de Base de Datos — nerdose-db

> Derivado del discovery: [análisis de dominio](../discovery/analisis-dominio.md) · [análisis técnico](../discovery/analisis-tecnico.md). Decisiones: ADR-004 (base única y roles), ADR-005 (cola), ADR-011 (rachas), ADR-014 (métricas), ADR-016 (bancos como dataset), ADR-017 (alertas en la base).

## Información General

**Nombre:** `nerdose-db`

**Propósito:** única base de nerdose. Guarda:
- los bancos de contenido;
- los desafíos con su solución;
- los jugadores anónimos, sus partidas y sus agregados de rachas y estadísticas;
- los reportes;
- las tablas técnicas del `generator` (cola de regeneración, fallas de generación y corridas de jobs);
- las vistas de métricas del admin.

**Tecnología:** PostgreSQL 16. ORM y migraciones con Drizzle (`@nerdose/db`), driver postgres.js.

**Usada por:**
- `api` (rol `nerdose_api`): jugadores, partidas, agregados, reportes, rechazos de Devdle; escrituras acotadas sobre `challenges`, `terms` y `timeline_facts`; inserta en `generation_requests`; lee `generation_failures`.
- `generator` (rol `nerdose_generator`, dueño del contenido): `challenges`, `terms`, `timeline_facts`, `generation_requests`, `generation_failures` y `job_runs`.
- Dueño del schema (rol `nerdose_owner`): solo corre las migraciones.

**Convenciones:**
- Nombres en inglés y en `snake_case`, idénticos al dominio, a la API y a los flujos (ADR-015).
- Ids `uuid` con `gen_random_uuid()`.
- Días en `date` (día UTC) e instantes en `timestamptz`.
- Lo que varía por juego va en `jsonb`.
- Los textos bilingües se guardan como `{ "es": string, "en": string }`.

## DBML Schema

```dbml
// Database: nerdose-db
// PostgreSQL 16
// Generated: 2026-11-03

// ─────────────────────────── Enums ───────────────────────────

Enum game_id {
  "devdle"
  "bug-hunt"
  "big-o"
  "timeline"
  "grep-grid"
}

Enum locale {
  es
  en
}

Enum code_language {
  js
  go
  java
}

Enum challenge_status {
  draft
  approved
  published
  rejected
  voided
}

Enum play_status {
  in_progress
  won
  lost
  voided
}

Enum report_reason {
  wrong_answer
  ambiguous
  wrong_explanation
  translation
  display_bug
  other
}

Enum report_status {
  open
  resolved
  dismissed
}

Enum bank_item_status {
  approved
  rejected
}

Enum term_category {
  programming_languages
  git
  databases
  networking
  linux
  apis
  security
  software_engineering
}

Enum timeline_category {
  programming_languages
  frameworks
  companies
  operating_systems
  hardware
  video_games
  databases
  software_tools
}

Enum date_precision {
  year
  month
  day
}

Enum generation_request_status {
  pending
  done
  failed
  cancelled  // REQ-008: la fecha llegó o el challenge dejó de ser approved antes de atenderlo
}

Enum job_run_status {
  running
  success
  failed
}

// ─────────────────────────── Identity ───────────────────────────

Table players {
  id uuid [pk, default: `gen_random_uuid()`, note: 'Valor de la cookie nd_pid (UUID v4)']
  locale locale [not null, default: 'es']
  preferred_code_language code_language [not null, default: 'js']
  user_id uuid [null, note: 'Reservado para enlazar un User (fuera de v1). Sin FK hasta que exista la tabla users']
  created_at timestamptz [not null, default: `now()`]
  last_seen_at timestamptz [not null, default: `now()`]

  indexes {
    created_at [name: 'idx_players_created_at']
  }

  Note: 'Jugador anónimo. Sin PII. Se crea en POST /api/session'
}

// ─────────────────────────── Challenge Publishing ───────────────────────────

Table challenges {
  id uuid [pk, default: `gen_random_uuid()`]
  game_id game_id [not null]
  date date [not null, note: 'Día UTC en que se juega']
  number integer [not null, note: 'date − LAUNCH_DATE + 1; igual para los 5 juegos ese día']
  payload jsonb [not null, note: 'Contenido completo CON la solución y textos {es,en}. Inmutable desde approved. Nunca sale al jugador antes de terminar']
  status challenge_status [not null, default: 'draft']
  generator_version text [not null]
  seed text [not null, note: 'HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}") en hex']
  attempt integer [not null, note: 'Intento con el que se derivó el seed (0..GENERATION_MAX_ATTEMPTS-1, y siguientes en regeneración)']
  verification jsonb [not null, default: `'{}'::jsonb`, note: 'Log de la verificación: { ok, checks[], reason? }']
  void_reason text [null]
  voided_at timestamptz [null]
  alerted_at timestamptz [null, note: 'Alcanzó el umbral de reportes (una sola vez, nunca vuelve a NULL). Es la alerta: el admin lo muestra en Reportes (ADR-017)']
  created_at timestamptz [not null, default: `now()`]

  indexes {
    (game_id, date) [unique, name: 'uq_challenges_active_game_date', note: "Parcial: WHERE status IN ('approved','published','voided')"]
    (game_id, date, status) [name: 'idx_challenges_game_date_status']
    (date, status) [name: 'idx_challenges_date_status']
  }

  Note: 'Desafío de un juego para un día. Lo crea solo el generator'
}

// ─────────────────────────── Gameplay ───────────────────────────

Table plays {
  id uuid [pk, default: `gen_random_uuid()`]
  player_id uuid [not null, ref: > players.id]
  challenge_id uuid [not null, ref: > challenges.id]
  game_id game_id [not null, note: 'Denormalizado de challenges']
  date date [not null, note: 'Denormalizado de challenges']
  state jsonb [not null, note: 'Estado propio del juego (initState / applyMove)']
  status play_status [not null, default: 'in_progress']
  result jsonb [null, note: 'Obligatorio si status ∈ (won, lost); se conserva al anular']
  code_language code_language [null, note: 'Solo big-o y bug-hunt: lenguaje con el que confirmó']
  score integer [null]
  started_at timestamptz [not null, default: `now()`]
  finished_at timestamptz [null, note: 'Obligatorio si status ≠ in_progress']

  indexes {
    (player_id, challenge_id) [unique, name: 'uq_plays_player_challenge']
    (player_id, date) [name: 'idx_plays_player_date']
    (player_id, game_id, date) [name: 'idx_plays_player_game_date']
    (challenge_id, status) [name: 'idx_plays_challenge_status']
    date [name: 'idx_plays_date']
  }

  Note: 'Partida de un jugador sobre un desafío. Fuente de verdad del historial'
}

Table rejected_guesses {
  word text [not null, note: 'A–Z en mayúsculas']
  player_id uuid [not null, ref: > players.id]
  created_at timestamptz [not null, default: `now()`]

  indexes {
    (word, player_id) [pk]
  }

  Note: 'Intentos de Devdle fuera de la lista válida. Cuenta jugadores distintos por palabra (admin: más rechazadas)'
}

// ─────────────────────────── Progress ───────────────────────────

Table player_game_stats {
  player_id uuid [not null, ref: > players.id]
  game_id game_id [not null]
  current_streak integer [not null, default: 0]
  max_streak integer [not null, default: 0]
  played integer [not null, default: 0, note: 'Excluye plays voided']
  wins integer [not null, default: 0, note: 'Excluye plays voided']
  last_completed_date date [null]
  extra jsonb [not null, default: `'{}'::jsonb`, note: 'Stats propias del juego (reduceStats). Excluye voided. Devdle: { guesses: { "1": n, …, "6": n }, losses: n }. Grep Grid: { words_found: { "0": n, …, "8": n } } (partidas por cantidad de palabras encontradas). Timeline: { by_category: { <category>: { played, correct } } }, por hito (cada item suma played a la categoría de su hecho y correct si quedó en su lugar)']

  indexes {
    (player_id, game_id) [pk]
  }

  Note: 'Agregado por jugador y juego. Se actualiza en la transacción que cierra la Play; recalculable desde plays'
}

Table player_stats {
  player_id uuid [pk, ref: - players.id]
  global_streak integer [not null, default: 0]
  max_global_streak integer [not null, default: 0]
  last_active_date date [null]
  total_completed integer [not null, default: 0, note: 'Incluye plays voided']

  indexes {
    global_streak [name: 'idx_player_stats_global_streak']
  }

  Note: 'Agregado global por jugador. Misma transacción que el cierre de la Play'
}

// ─────────────────────────── Quality ───────────────────────────

// Creada por la migración 0006_challenge_reports (REQ-007, S-030), junto con los enums report_reason y report_status.
Table challenge_reports {
  id uuid [pk, default: `gen_random_uuid()`]
  challenge_id uuid [not null, ref: > challenges.id]
  player_id uuid [not null, ref: > players.id]
  reason report_reason [not null]
  message text [null, note: 'Máximo 1000 caracteres']
  locale locale [not null]
  context jsonb [not null, note: '{ code_language, play_status, play_state, user_agent }']
  status report_status [not null, default: 'open']
  created_at timestamptz [not null, default: `now()`]

  indexes {
    (player_id, challenge_id) [unique, name: 'uq_reports_player_challenge']
    (challenge_id, status) [name: 'idx_reports_challenge_status']
    (challenge_id, reason) [name: 'idx_reports_challenge_reason']
    (status, created_at) [name: 'idx_reports_status_created_at']
  }

  Note: 'Reporte de un jugador sobre un desafío published o voided'
}

// ─────────────────────────── Content Banks ───────────────────────────

Table terms {
  id uuid [pk, default: `gen_random_uuid()`]
  term text [not null, unique, note: 'A–Z en mayúsculas, 4–12 letras']
  category term_category [not null]
  definition jsonb [not null, note: '{es,en}']
  summary jsonb [not null, note: '{es,en}']
  example jsonb [null, note: '{es,en}; futuro (post-MVP)']
  wikidata_id text [not null, unique]
  sitelinks integer [not null]
  status bank_item_status [not null]
  rejection_reason text [null]
  last_used_devdle date [null]
  last_used_grep date [null]
  dataset_version text [not null, note: 'Versión del dataset que lo escribió por última vez (ADR-016)']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    (status, category, last_used_devdle) [name: 'idx_terms_devdle_pick']
    (status, last_used_grep) [name: 'idx_terms_grep_pick']
  }

  Note: 'Banco de términos (Devdle, Grep Grid). Se carga desde @nerdose/content con sync_banks'
}

// Creada por la migración 0004_timeline_facts (REQ-006); 0005_timeline_categories_databases_software_tools suma databases y software_tools al enum timeline_category. rejection_reason: disputed_date, imprecise_date, missing_article, low_sitelinks, missing_note, note_year_mismatch, excluded, duplicate
Table timeline_facts {
  id uuid [pk, default: `gen_random_uuid()`]
  label text [not null]
  category timeline_category [not null]
  event_date date [not null]
  date_precision date_precision [not null]
  note jsonb [not null, note: '{es,en}']
  wikidata_id text [not null, unique]
  sitelinks integer [not null]
  status bank_item_status [not null]
  rejection_reason text [null]
  last_used date [null]
  dataset_version text [not null]
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    (status, category, last_used) [name: 'idx_timeline_facts_pick']
  }

  Note: 'Banco de hechos (Tech Timeline). Se carga desde @nerdose/content con sync_banks'
}

// ─────────────────────────── Tablas técnicas del generator ───────────────────────────

Table generation_requests {
  id uuid [pk, default: `gen_random_uuid()`, note: 'request_id del NOTIFY generation_requests']
  challenge_id uuid [not null, ref: > challenges.id, note: 'Desafío approved a reemplazar']
  status generation_request_status [not null, default: 'pending']
  new_challenge_id uuid [null, ref: > challenges.id]
  error text [null]
  requested_at timestamptz [not null, default: `now()`]
  processed_at timestamptz [null]

  indexes {
    challenge_id [unique, name: 'uq_generation_requests_pending', note: "Parcial: WHERE status = 'pending'"]
    (status, requested_at) [name: 'idx_generation_requests_status']
    (challenge_id, requested_at) [name: 'idx_generation_requests_challenge', note: 'Último pedido por challenge (upcoming)']
  }

  // Checks (REQ-008): status = 'done' => new_challenge_id IS NOT NULL; status <> 'pending' => processed_at IS NOT NULL. Migración 0007_generation_queue_and_failures

  Note: 'Cola de regeneración (api inserta + NOTIFY; generator toma con FOR UPDATE SKIP LOCKED)'
}

Table generation_failures {
  game_id game_id [not null]
  date date [not null]
  attempts integer [not null]
  last_reason text [null, note: 'Motivo de rechazo del último intento (se muestra en el admin)']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    (game_id, date) [pk]
  }

  Note: 'Fechas para las que un juego no logró desafío tras todos los intentos. La fila es la alerta (ADR-017): el admin la muestra en Próximos desafíos'
}

Table job_runs {
  id uuid [pk, default: `gen_random_uuid()`]
  job text [not null, note: "'fill' | 'sync_banks'"]
  status job_run_status [not null, default: 'running']
  started_at timestamptz [not null, default: `now()`]
  finished_at timestamptz [null]
  summary jsonb [not null, default: `'{}'::jsonb`, note: "fill: { generated, approved, rejected, missing }; sync_banks: { dataset_version, inserted, updated, unchanged, kept_rejected, skipped }"]

  indexes {
    (job, started_at) [name: 'idx_job_runs_job_started_at']
  }

  Note: 'Registro de cada corrida de job del generator'
}

// ─────────────────────────── Relaciones ───────────────────────────
// Todas las FK son ON DELETE RESTRICT: en v1 no se borran jugadores ni desafíos (retención indefinida).
```

## Vistas de Métricas

Las cuatro vistas viven en migraciones de `@nerdose/db` (ADR-014). El rol `nerdose_api` solo tiene `SELECT` sobre ellas, y la API las filtra por `[from, to]`.

| Vista | Columnas | Definición |
|---|---|---|
| `metrics_daily_players` | `date`, `game_id` (null = total), `players` | `count(DISTINCT player_id)` de `plays` por `date`, agrupado por `game_id` y con `GROUPING SETS ((date, game_id), (date))` |
| `metrics_retention` | `cohort_date`, `cohort_size`, `d1`, `d7` | Cohorte = fecha de la primera Play con `status IN ('won','lost','voided')` de cada jugador. `d1`/`d7` = fracción (0–1) de la cohorte con una Play completada en `cohort_date + 1` / `+ 7`. `null` si esa fecha todavía no pasó |
| `metrics_streak_distribution` | `bucket`, `players` | `player_stats.global_streak` **vivo** (0 si `last_active_date` es anterior al día activo previo, ADR-011), agrupado en `'0'`, `'1'`, `'2-6'`, `'7-29'`, `'30+'` |
| `metrics_challenge_quality` | `challenge_id`, `game_id`, `date`, `number`, `started`, `finished`, `completion_rate`, `win_rate`, `reports`, `status` | Por challenge `published` o `voided`: `started = count(plays)`, `finished = count(plays WHERE status IN ('won','lost'))`, `completion_rate = finished / NULLIF(started, 0)`, `win_rate = count(won) / NULLIF(finished, 0)`, `reports = count(challenge_reports)` |

## Estrategia de Migraciones

**Herramienta:** drizzle-kit, con SQL manual para lo que Drizzle no expresa (índices parciales, triggers, vistas, `GRANT`).

**Ubicación:** `packages/db/migrations/`. El schema TypeScript está en `packages/db/src/schema/`.

**Proceso:**
1. Se modifica el schema en `packages/db/src/schema/`, o se agrega un archivo SQL manual para vistas, triggers o grants.
2. `pnpm --filter @nerdose/db db:generate --name <cambio>` genera la migración SQL.
3. Se revisa el SQL generado. Si la migración crea una tabla, MUST incluir sus `GRANT` para `nerdose_api` y `nerdose_generator`.
4. Se commitea la migración junto con el schema.
5. Antes de levantar `api` y `generator`, se aplica con `pnpm --filter @nerdose/db db:migrate` usando el rol `nerdose_owner` (`DATABASE_URL_OWNER`).
   - La migración `0000_roles_and_grants` crea `nerdose_api` y `nerdose_generator` con `LOGIN` y **sin contraseña** (idempotente). `nerdose_owner` ya existe antes de migrar (en local lo crea Docker Compose con `POSTGRES_USER`).
   - Después de migrar, `db:migrate` asigna las contraseñas con `ALTER ROLE` si `DATABASE_URL_API` / `DATABASE_URL_GENERATOR` están definidas, así las credenciales no se versionan.

**Rollback:** las migraciones son forward-only. Para revertir se escribe una migración nueva que deshace el cambio. Restaurar desde un backup queda definido con el hosting (diferido).

## Estrategia de Índices

| Tabla | Índice | Columnas | Tipo | Motivo |
|-------|--------|----------|------|--------|
| challenges | uq_challenges_active_game_date | (game_id, date) `WHERE status IN ('approved','published','voided')` | UNIQUE parcial | Invariante 1: un desafío vigente por juego y día. Un `draft` puede convivir durante una regeneración |
| challenges | idx_challenges_game_date_status | (game_id, date, status) | BTREE | `prev_active_day` (rachas), relleno de 14 días, próximos desafíos |
| challenges | idx_challenges_date_status | (date, status) | BTREE | Publicación del día y cache de hoy |
| plays | uq_plays_player_challenge | (player_id, challenge_id) | UNIQUE | Invariante 13; `ON CONFLICT` en `/start` y `/move` |
| plays | idx_plays_player_date | (player_id, date) | BTREE | `GET /api/today`, heatmap e historial |
| plays | idx_plays_player_game_date | (player_id, game_id, date) | BTREE | Recálculo de agregados por juego |
| plays | idx_plays_challenge_status | (challenge_id, status) | BTREE | Umbral de reportes (`finished`), anulación, `metrics_challenge_quality` |
| plays | idx_plays_date | (date) | BTREE | `metrics_daily_players`, `metrics_retention` |
| rejected_guesses | PK | (word, player_id) | UNIQUE | Un registro por jugador y palabra; ranking de más rechazadas |
| player_stats | idx_player_stats_global_streak | (global_streak) | BTREE | `metrics_streak_distribution` |
| challenge_reports | uq_reports_player_challenge | (player_id, challenge_id) | UNIQUE | Invariante 26: un reporte por jugador y desafío |
| challenge_reports | idx_reports_challenge_status | (challenge_id, status) | BTREE | Reportes agrupados en el admin; resolver al anular |
| challenge_reports | idx_reports_challenge_reason | (challenge_id, reason) | BTREE | Conteo de `wrong_answer`/`ambiguous` para el umbral |
| terms | idx_terms_devdle_pick | (status, category, last_used_devdle) | BTREE | Elegir término de Devdle (365 días, rotación de categoría) |
| terms | idx_terms_grep_pick | (status, last_used_grep) | BTREE | Elegir 8 palabras de Grep Grid (30 días) |
| timeline_facts | idx_timeline_facts_pick | (status, category, last_used) | BTREE | Elegir hechos elegibles (90 días); el desafío mezcla categorías, así que hoy filtra por `status` y `last_used` |
| generation_requests | uq_generation_requests_pending | (challenge_id) `WHERE status = 'pending'` | UNIQUE parcial | Un pedido pendiente por desafío |
| generation_requests | idx_generation_requests_status | (status, requested_at) | BTREE | Poll de respaldo con `FOR UPDATE SKIP LOCKED` |
| generation_requests | idx_generation_requests_challenge | (challenge_id, requested_at) | BTREE | Último pedido por desafío en Próximos desafíos (REQ-008) |
| job_runs | idx_job_runs_job_started_at | (job, started_at) | BTREE | Última corrida de `sync_banks` en el stock del admin |

## Constraints y Reglas de Negocio

**Check constraints:**
- `challenges.number >= 1`.
- `challenges`: `status = 'voided'` ⇒ `void_reason IS NOT NULL AND voided_at IS NOT NULL` (invariante 7).
- `plays`: `status IN ('won','lost')` ⇒ `result IS NOT NULL`.
- `plays`: `status <> 'in_progress'` ⇒ `finished_at IS NOT NULL`.
- `plays`: `code_language IS NULL OR game_id IN ('big-o','bug-hunt')`.
- `player_game_stats` y `player_stats`: todos los contadores y rachas `>= 0`, `max_streak >= current_streak` y `max_global_streak >= global_streak`.
- `challenge_reports`: `ck_reports_message_length` (`message IS NULL OR char_length(message) <= 1000`).
- Trigger `challenge_reports_status_terminal` (BEFORE UPDATE OF status): si `OLD.status <> 'open'` y el estado cambia, error; `resolved` y `dismissed` son terminales.
- `terms.term ~ '^[A-Z]{4,12}$'` (invariante 30).
- `rejected_guesses.word ~ '^[A-Z]+$'`.
- `terms`/`timeline_facts`: `status = 'rejected'` ⇒ `rejection_reason IS NOT NULL`.
- Textos bilingües (`terms.definition`, `terms.summary`, `timeline_facts.note`): `col ? 'es' AND col ? 'en'` (invariante 29).
- `generation_failures.attempts >= 1`.

**Foreign keys:** todas `ON DELETE RESTRICT` (ver DBML). `players.user_id` no tiene FK en v1.

**Unique constraints:**
- `uq_challenges_active_game_date` (parcial): un desafío vigente por juego y día.
- `uq_plays_player_challenge`: una partida por jugador y desafío.
- `uq_reports_player_challenge`: un reporte por jugador y desafío.
- `terms.term`, `terms.wikidata_id`, `timeline_facts.wikidata_id`: sin duplicados en los bancos; `wikidata_id` es la clave del UPSERT de `sync_banks`.
- `uq_generation_requests_pending` (parcial): un pedido pendiente por desafío.

**Triggers:**
- `challenges_payload_immutable` (BEFORE UPDATE en `challenges`): si `OLD.status IN ('approved','published','voided')` y `NEW.payload`, `NEW.seed` o `NEW.attempt` cambian, lanza un error (invariante 2).
- `challenges_status_transition` (BEFORE UPDATE OF status en `challenges`): permite solo `draft→approved`, `draft→rejected`, `approved→published`, `approved→rejected` y `published→voided`. Cualquier otra transición lanza un error (ciclo de vida del dominio).
- `bank_items_rejected_terminal` (BEFORE UPDATE OF status en `terms` y `timeline_facts`): si `OLD.status = 'rejected'` y `NEW.status <> 'rejected'`, lanza un error. Respalda en la base la regla de `sync_banks` (ADR-016).
- `set_updated_at` (BEFORE UPDATE en `terms`, `timeline_facts` y `generation_failures`): `updated_at = now()`.

## Datos Semilla

**Propósito:**
- **Bancos** (todos los ambientes): no hay seed SQL. `terms` y `timeline_facts` se llenan con `sync_banks` desde `@nerdose/content` cuando arranca el `generator` (ADR-016).
- **Desarrollo y tests:** `pnpm --filter @nerdose/db seed:dev` crea un dataset reducido de bancos, 2–3 jugadores con partidas y rachas de ejemplo (incluidos días neutros y una anulación) y desafíos `approved` para los próximos días con `LAUNCH_DATE` local.

**Ambientes:** `seed:dev` solo en local y tests. Nunca en producción.

## Backup y Recuperación

Diferido: se define con el hosting (frecuencia, retención, ubicación, RTO/RPO). La pérdida de datos afecta el historial y las rachas de los jugadores. Los bancos se pueden reconstruir desde el dataset del repo, y los desafíos futuros se regeneran solos.

## Consideraciones de Seguridad

**Cifrado:** en tránsito, TLS entre los servicios y Postgres si no comparten red privada (se define con el hosting). En reposo, a cargo de la plataforma (diferido).

**Control de acceso** (ADR-004). Los `GRANT` viven en una migración versionada:

```sql
-- Roles (creados sin contraseña en la migración 0000_roles_and_grants;
-- las credenciales se asignan fuera de ella, con db:migrate)
CREATE ROLE nerdose_api LOGIN;
CREATE ROLE nerdose_generator LOGIN;
-- nerdose_owner es dueño del schema y corre las migraciones

-- nerdose_api
GRANT SELECT, INSERT, UPDATE ON players, plays, player_game_stats, player_stats,
  challenge_reports, rejected_guesses TO nerdose_api;
GRANT SELECT ON challenges TO nerdose_api;
GRANT UPDATE (status, void_reason, voided_at, alerted_at) ON challenges TO nerdose_api;
GRANT SELECT ON terms, timeline_facts TO nerdose_api;
GRANT UPDATE (status, rejection_reason) ON terms, timeline_facts TO nerdose_api;
GRANT SELECT, INSERT ON generation_requests TO nerdose_api;
GRANT SELECT ON job_runs, generation_failures TO nerdose_api;
GRANT SELECT ON metrics_daily_players, metrics_retention,
  metrics_streak_distribution, metrics_challenge_quality TO nerdose_api;

-- nerdose_generator
GRANT SELECT, INSERT, UPDATE ON challenges, terms, timeline_facts, generation_requests,
  generation_failures, job_runs TO nerdose_generator;
```

- Ningún rol de servicio tiene `DELETE`, DDL ni `TRUNCATE`.
- La `api` no puede escribir `challenges.payload` ni crear desafíos. El `generator` no puede tocar jugadores, partidas ni reportes.
- `pg_notify('generation_requests', …)` no requiere grants extra. `LISTEN` lo hace `nerdose_generator`.

**Datos sensibles:**
- No se guarda PII. `players` no tiene IP, email ni fingerprint. `challenge_reports.context.user_agent` es lo único asociado a un navegador, y se guarda solo cuando el jugador reporta.
- `challenges.payload` contiene las soluciones. Solo lo leen la `api` (que nunca lo serializa al jugador antes de terminar) y el admin autenticado.
- `GENERATOR_SECRET` no se guarda en la base: solo el `seed` derivado. Sin el secreto no se pueden calcular desafíos futuros.

**Auditoría:** `job_runs` registra las corridas del `generator`. `challenges.void_reason`/`voided_at` y `challenge_reports.status` dejan rastro de las acciones del admin. No hay auditoría a nivel de la base en v1.
