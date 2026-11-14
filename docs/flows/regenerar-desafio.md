---
id: regenerar-desafio
title: Regenerar un desafío desde el admin
type: feature
status: Draft
created: 2026-11-03
last_updated: 2026-11-13
stories: [S-035, S-036, S-037, S-038, S-039]
---

# Regenerar un desafío desde el admin

**Tipo:** Feature
**Status:** Draft
**Creado:** 2026-11-03
**Última actualización:** 2026-11-03
**Stories:** —

## Descripción

El responsable pide regenerar un desafío `approved` de una fecha futura. La `api` encola el pedido en `generation_requests` y avisa con `NOTIFY`. El `generator` genera y verifica uno nuevo, y reemplaza al viejo en una transacción. El viejo sigue `approved` hasta que el nuevo está verificado. Es el único mensaje entre `api` y `generator`. Cubre C-43 y C-44 (F8, ADR-005).

## Servicios Involucrados

| Servicio | Rol | Tipo de Participación |
|----------|-----|-----------------------|
| admin | Pide la regeneración y hace polling de próximos desafíos | Iniciador |
| api | Valida, encola y notifica | Procesador |
| nerdose-db | `generation_requests` (cola), canal `generation_requests`, `challenges` | Procesador |
| generator | Toma el pedido, genera, verifica y reemplaza | Consumidor / Procesador |

## Pasos del Flujo

```mermaid
sequenceDiagram
    participant AD as admin
    participant A as api
    participant DB as nerdose-db
    participant G as generator

    AD->>A: POST /api/admin/challenges/{challenge_id}/regenerate (Bearer)
    A->>DB: INSERT generation_requests (pending) ON CONFLICT DO NOTHING o devuelve el pendiente
    A->>DB: SELECT pg_notify('generation_requests', request_id)
    A-->>AD: 202 { request_id, status, requested_at }
    DB-->>G: NOTIFY generation_requests (o poll cada 60 s)
    G->>DB: SELECT ... WHERE status='pending' FOR UPDATE SKIP LOCKED
    alt challenge ya no approved o date <= today
        G->>DB: UPDATE generation_requests SET status='cancelled'
    end
    loop attempt = último + 1 ... + GENERATION_MAX_ATTEMPTS
        G->>DB: INSERT challenges (draft)
        G->>G: verify()
        alt no pasa
            G->>DB: UPDATE challenges SET status='rejected', verification
        end
    end
    alt alguno pasó
        G->>DB: BEGIN; SELECT viejo FOR UPDATE; viejo → rejected; nuevo → approved; request → done; COMMIT (si ya no es approved: nuevo → rejected, request → cancelled)
    else ninguno pasó
        G->>DB: UPDATE generation_requests SET status='failed', error
    end
    loop cada 5 s mientras haya regeneration.status = pending
        AD->>A: GET /api/admin/challenges/upcoming
        A-->>AD: 200 { days[].games[].challenge, regeneration, active_failures }
    end
```

### Paso 1: Pedir la regeneración

**Origen:** admin
**Destino:** api
**Tipo:** REST

**Request:**
- **Método:** POST
- **Endpoint:** `/api/admin/challenges/{challenge_id}/regenerate`
- **Headers:** `Authorization: Bearer <jwt>`

**Validaciones:** JWT → challenge existe → `challenges.status == 'approved'` y `challenges.date > today` (si no, `409 not_regenerable`).

**Operación de BD:**
- **Tabla:** `generation_requests`
- **Operación:** INSERT (`challenge_id`) ON CONFLICT (`challenge_id`) WHERE `status = 'pending'` DO NOTHING RETURNING; si no devuelve fila, SELECT del pendiente existente. Todo en la misma transacción que lee el challenge
  - `uq_generation_requests_pending` es un **índice** único parcial, no una constraint: `ON CONFLICT ON CONSTRAINT` falla con `42704`. El árbitro se infiere con la columna y el mismo predicado del índice (en Drizzle: `.onConflictDoNothing({ target: generationRequests.challengeId, where: sql\`status = 'pending'\` })`)
- **Operación:** `SELECT pg_notify('generation_requests', <id>)`

**Response (éxito):**
- **Status:** 202
- **Body:** `{ "request_id": "uuid", "status": "pending", "requested_at": "date-time" }`

**Ref:** `docs/apis/api.yaml` POST /api/admin/challenges/{challenge_id}/regenerate

---

### Paso 2: Tomar el pedido

**Origen:** generator
**Destino:** nerdose-db
**Tipo:** Evento (consumidor)

**Evento consumido:** `NOTIFY generation_requests` con payload `request_id` (uuid). Como respaldo, poll cada 60 s.

**Operación de BD:**
- **Tabla:** `generation_requests` — SELECT `id`, `challenge_id` WHERE `status = 'pending'` FOR UPDATE SKIP LOCKED
- **Tabla:** `challenges` — SELECT `game_id`, `date`, `status`, `max(attempt)` para (`game_id`, `date`)

**Cancelación:** si el challenge ya no es `approved` o `date <= today`, UPDATE `status = 'cancelled'`, `processed_at`; COMMIT, sin generar (REQ-008, enmienda ADR-005).

---

### Paso 3: Generar y verificar

**Origen:** generator
**Destino:** nerdose-db
**Tipo:** Interno

**Acción:** igual que `generacion-diaria`, con `attempt` desde `max(attempt) + 1` y hasta `GENERATION_MAX_ATTEMPTS` intentos. `seed = HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")`.

**Operación de BD (por candidato):**
- **Tabla:** `challenges` — INSERT (`game_id`, `date`, `number`, `payload`, `status = 'draft'`, `generator_version`, `seed`, `attempt`, `verification`)
- Si `verify()` falla: UPDATE `status = 'rejected'`, `verification`

---

### Paso 4: Reemplazo atómico

**Origen:** generator
**Destino:** nerdose-db
**Tipo:** Interno (transacción)

**Operaciones de BD:**
0. **Tabla:** `challenges` (viejo) — SELECT ... FOR UPDATE; si ya no es `approved` o `date <= today`: nuevo → `rejected` (`reason = 'request_cancelled'`), pedido → `cancelled`, fin
1. **Tabla:** `challenges` (viejo) — UPDATE `status = 'rejected'`, `verification = verification || '{"reason":"regenerated"}'`
2. **Tabla:** `challenges` (nuevo) — UPDATE `status = 'approved'`, `verification`
3. **Tabla:** `terms` / `timeline_facts` — UPDATE `last_used_*` = `GREATEST(last_used_*, date)` de los ítems del nuevo (los del viejo no se revierten)
4. **Tabla:** `generation_requests` — UPDATE `status = 'done'`, `new_challenge_id`, `processed_at = now()`

El orden 1 → 2 respeta el índice único parcial `uq_challenges_active_game_date`.

**Eventos de dominio:** `ChallengeRejected` + `ChallengeApproved`, solo en los logs.

---

### Paso 5: Polling del admin

**Origen:** admin
**Destino:** api
**Tipo:** REST

**Request:** `GET /api/admin/challenges/upcoming?days=14`

**Operación de BD:** `challenges` (`status = 'approved'`, `date` en `[today+1, today+days]`) + `generation_requests` (último por `challenge_id`, solo `pending`/`failed`) + `generation_failures` + `terms`/`timeline_facts` (`rejected_items` vía `definition.culprits`). El admin refetchea cada 5 s mientras haya un pedido `pending`. El contador del shell usa `GET /api/admin/generation-failures`.

**Response:** `200 { "days": [ { "date", "number", "games": [ { "game_id", "challenge": { "id", "status", "payload", "verification", "generator_version", "attempt", "rejected_items" } | null, "regeneration": { "request_id", "status", "error", "requested_at", "processed_at" } | null, "failure" } ] } ], "active_failures": n }`

**Ref:** `docs/apis/api.yaml` GET /api/admin/challenges/upcoming (`UpcomingDay`)

## Manejo de Errores

| Paso | Error | Código | Response | Comportamiento |
|------|-------|--------|----------|---------------|
| 1 | JWT inválido | 401 | `{ "error": { "code": "unauthorized", … } }` | admin vuelve al login |
| 1 | Challenge inexistente | 404 | `{ "error": { "code": "not_found", … } }` | admin refresca |
| 1 | No `approved` o `date <= today` | 409 | `{ "error": { "code": "not_regenerable", … } }` | admin muestra que no se puede regenerar |
| 2 | `generator` caído | — | — | El pedido queda `pending`; se procesa al volver (poll) |
| 2 | La fecha llegó o el challenge ya no es `approved` | — | `generation_requests.status = 'cancelled'` | El original se publica sin cambios; el admin no lo ve pendiente |
| 3 | Ningún candidato pasa la verificación | — | `generation_requests.status = 'failed'`, `error` | El viejo sigue `approved`; el admin ve "regeneración fallida" con el motivo; no se escribe `generation_failures` |
| 4 | Error de BD en el reemplazo | — | ROLLBACK | El viejo sigue `approved`; el pedido sigue `pending` y se reintenta |

## Resultado

**Éxito:** en próximos desafíos, la fecha muestra el desafío nuevo, y el viejo queda `rejected`.

**Estado final:**
- Challenge viejo: `rejected` (`verification.reason = 'regenerated'`).
- Challenge nuevo: `approved`.
- GenerationRequest: `done` con `new_challenge_id`, o `failed` con `error`.

## Notas

- Regenerar nunca deja un día sin desafío: el viejo sigue vigente hasta el reemplazo.
- El `NOTIFY` es fire-and-forget. El `202` no depende de que el `generator` esté vivo.
- Un `published` (hoy) nunca se regenera (invariante 6). Si tiene errores, se anula (`anulacion-de-desafio`).
