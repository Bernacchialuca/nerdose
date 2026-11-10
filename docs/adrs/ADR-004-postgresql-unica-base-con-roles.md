# ADR-004: PostgreSQL como única base, con propiedad por roles

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** base-de-datos, postgresql, seguridad, permisos

## Contexto

El modelo tiene datos relacionales con invariantes fuertes. Por ejemplo, una Play por jugador y desafío, un Challenge no `rejected` por juego y fecha, y agregados que se actualizan en la misma transacción que la Play. También tiene datos semiestructurados que varían por juego: el `payload`, el `state`, el `result` y el `extra` de cada uno.

Dos servicios escriben la misma base con responsabilidades muy distintas:
- La `api` nunca debe tocar el `payload` de un desafío ni crear desafíos. Si pudiera, un bug suyo podría alterar contenido verificado.
- El `generator` es el dueño del contenido.

El análisis técnico descartó Redis y cualquier broker (ADR-001).

## Decisión

Vamos a usar **PostgreSQL 16 como única base de datos** (`nerdose-db`): tablas relacionales y `jsonb` para lo propio de cada juego. La frontera entre servicios se hace cumplir **en la base**, con tres roles:

| Rol | Permisos |
|---|---|
| Dueño del schema | DDL. Solo corre las migraciones |
| `nerdose_api` | Lectura y escritura de `players`, `plays`, `player_game_stats`, `player_stats`, `challenge_reports`, `rejected_guesses`. `INSERT` y `SELECT` en `generation_requests`. Sobre `challenges`: `SELECT` y `UPDATE` **solo** de `status`, `void_reason`, `voided_at` y `alerted_at`. Sobre `terms` y `timeline_facts`: `SELECT` y `UPDATE (status, rejection_reason)`. `SELECT` de `job_runs`, `generation_failures` y las vistas `metrics_*` |
| `nerdose_generator` | Lectura y escritura de `challenges`, `terms`, `timeline_facts`, `generation_requests`, `generation_failures` y `job_runs` |

## Reglas de Implementación

- La única base MUST ser PostgreSQL ≥ 16. MUST NOT agregarse otra base (Redis, MongoDB, SQLite) en v1.
- Los campos que varían por juego (`challenges.payload`, `challenges.verification`, `plays.state`, `plays.result`, `player_game_stats.extra`, `challenge_reports.context`, `job_runs.summary`) MUST ser `jsonb`.
- Los textos de contenido bilingües MUST guardarse como `jsonb` con la forma `{ "es": string, "en": string }`.
- Las fechas de día MUST ser `date` (día UTC). Los instantes MUST ser `timestamptz`.
- Los ids MUST ser `uuid` (`gen_random_uuid()`), salvo las PK compuestas o naturales que define `docs/db-schemas/nerdose-db.md`.
- La `api` MUST conectarse con el rol `nerdose_api` y el `generator` con `nerdose_generator`. Ninguno de los dos MUST tener permisos de DDL.
- Los `GRANT` de cada rol MUST estar en una migración versionada en `packages/db`, con permisos por columna sobre `challenges`, `terms` y `timeline_facts` exactamente como en la tabla de arriba.
- La unicidad de un Challenge vigente MUST implementarse como índice único parcial sobre `(game_id, date)` con `WHERE status IN ('approved','published','voided')`.
- `plays` MUST tener `UNIQUE (player_id, challenge_id)` y `challenge_reports` MUST tener `UNIQUE (player_id, challenge_id)`.
- Los enums del dominio (`game_id`, `challenge_status`, `play_status`, `code_language`, `locale`, etc.) MUST ser enums de PostgreSQL con los valores exactos del análisis de dominio.

## Consecuencias

### Positivas
- Integridad transaccional para Play + agregados, y constraints de la base para las invariantes de unicidad.
- `jsonb` permite sumar juegos sin migrar tablas.
- La regla "la `api` nunca toca el `payload`" no depende de la disciplina del código: la base la rechaza.
- `LISTEN/NOTIFY` y `FOR UPDATE SKIP LOCKED` resuelven la cola sin otra pieza (ADR-005).

### Negativas
- Los permisos por columna complican un poco las migraciones: cada tabla nueva necesita sus `GRANT`.
- `api` y `generator` comparten el schema, así que un cambio rompedor afecta a los dos al mismo tiempo.
- Lo que se guarda en `jsonb` no tiene validación de la base: hay que validarlo con Zod en el código.

### Riesgos
- **Riesgo:** una migración olvida los `GRANT` de una tabla nueva y un servicio falla en producción.
  - **Mitigación:** test de integración que corre con cada rol las operaciones esperadas sobre una base migrada.
- **Riesgo:** los `jsonb` crecen sin forma.
  - **Mitigación:** cada paquete de juego define el schema Zod de su `payload`, `state`, `result` y `extra`.

## Alternativas Consideradas

### Alternativa 1: Bases separadas para `api` y `generator`

**Pros:**
- Aislamiento total.

**Contras:**
- La `api` necesita leer los desafíos y los bancos que escribe el `generator`, así que habría que replicar o sincronizar.
- La anulación cruza los dos dominios en una transacción.

**Por qué se descartó:** agrega sincronización sin beneficio a esta escala. Los roles dan el aislamiento necesario.

---

### Alternativa 2: Un solo rol para todos los servicios

**Pros:**
- Más simple de configurar.

**Contras:**
- La regla de propiedad dependería solo del código.

**Por qué se descartó:** el `payload` inmutable y verificado es la base de la confianza en el contenido. Vale la pena protegerlo en la base.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Infraestructura Compartida, Roles de base de datos, Notas de Consistencia, Arq-10
- `docs/discovery/analisis-dominio.md` — Entidades, Invariantes 1, 2, 13, 24, 26
- `docs/db-schemas/nerdose-db.md`
