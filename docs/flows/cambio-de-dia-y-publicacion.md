---
id: cambio-de-dia-y-publicacion
title: Cambio de día, publicación y jugada tardía
type: event
status: Draft
created: 2026-11-03
last_updated: 2026-11-04
stories: [S-010]
---

# Cambio de día, publicación y jugada tardía

**Tipo:** Evento
**Status:** Draft
**Creado:** 2026-11-03
**Última actualización:** 2026-11-03
**Stories:** —

## Descripción

A las 00:00 UTC cambia el día de la plataforma. El primer request que recibe la `api` con un día nuevo publica los desafíos `approved` de hoy y recarga sus caches, una sola vez (single-flight). Una jugada sobre el desafío de ayer se rechaza con `challenge_expired`. Cubre C-06 y C-48, e invariantes 3 y 15 (F4, ADR-008).

## Servicios Involucrados

| Servicio | Rol | Tipo de Participación |
|----------|-----|-----------------------|
| api | Detecta el día nuevo, publica y recarga las caches | Procesador |
| nerdose-db | `challenges` (UPDATE `status`), `terms` (lectura de la lista válida) | Procesador |
| web | Refetch con jitter; maneja la jugada tardía | Iniciador / Consumidor |

## Pasos del Flujo

```mermaid
sequenceDiagram
    participant W as web
    participant A as api
    participant DB as nerdose-db

    W->>A: cualquier request (today ≠ current_day)
    A->>A: single-flight: un request ejecuta, el resto espera
    A->>DB: UPDATE challenges SET status='published' WHERE status='approved' AND date=:today
    A->>DB: SELECT challenges de hoy (published | voided)
    A->>DB: SELECT term FROM terms WHERE status='approved'
    A->>A: cache de hoy + lista válida de Devdle (base ∪ terms); current_day = today
    A-->>W: respuesta normal del request
    Note over W,A: Jugada tardía
    W->>A: POST /api/games/devdle/today/move { challenge_number: 127, move }
    A-->>W: 409 challenge_expired
    W->>A: GET /api/today + GET /api/games/devdle/today
```

### Paso 1: Detectar el día nuevo

**Origen:** api
**Destino:** (interno)
**Tipo:** Interno

**Acción:** un middleware compara `today = (now() AT TIME ZONE 'UTC')::date` con la variable en memoria `current_day`. Si difieren, ejecuta la publicación con single-flight: los requests concurrentes esperan la misma promesa. También corre al arrancar el proceso.

---

### Paso 2: Publicar los desafíos de hoy

**Origen:** api
**Destino:** nerdose-db
**Tipo:** Interno

**Operación de BD:**
- **Tabla:** `challenges`
- **Operación:** UPDATE
- **Campos:** `status = 'published'` WHERE `status = 'approved'` AND `date = :today`

**Evento de dominio:** `ChallengePublished` (`challenge_id`, `game_id`, `date`, `number`) por fila, solo en los logs.

**Ref:** `docs/db-schemas/nerdose-db.md` tabla `challenges` (trigger `challenges_status_transition`: `approved→published`)

---

### Paso 3: Recargar caches

**Origen:** api
**Destino:** nerdose-db
**Tipo:** Interno

**Operación de BD:**
- **Tabla:** `challenges` — SELECT `id`, `game_id`, `date`, `number`, `payload`, `status` WHERE `date = :today` AND `status IN ('published','voided')`
- **Tabla:** `terms` — SELECT `term` WHERE `status = 'approved'`

**Acción:** reemplaza el `Map<game_id, challenge>` y el `Set` de la lista válida (archivo base del paquete `devdle` ∪ `terms`). Fija `current_day = today`.

---

### Paso 4: Refetch del cliente

**Origen:** web
**Destino:** api
**Tipo:** REST

**Acción:** al llegar `seconds_to_reset` a 0, el front espera entre 0 y 3 s al azar y pide `GET /api/today`. TanStack Query invalida las queries de juego y de stats.

---

### Paso 5: Jugada tardía

**Origen:** web
**Destino:** api
**Tipo:** REST

**Request:**
- **Método:** POST
- **Endpoint:** `/api/games/{game_id}/today/move`
- **Body:** `{ "challenge_number": 127, "move": { … } }`, enviado a las 00:00:05 UTC, cuando hoy es el #128

**Response:**
- **Status:** 409
- **Body:** `{ "error": { "code": "challenge_expired", "message": "…" } }`

**Acción de web:** invalida la cache y vuelve a pedir `GET /api/today` y `GET /api/games/{game_id}/today`.

**Ref:** `docs/apis/api.yaml` POST /api/games/{game_id}/today/move (409 `PlayConflict`)

## Manejo de Errores

| Paso | Error | Código | Response | Comportamiento |
|------|-------|--------|----------|---------------|
| 2 | Falla el UPDATE de publicación | 500 | `{ "error": { "code": "internal_error", … } }` | `current_day` no cambia; el próximo request reintenta (idempotente) |
| 3 | Falla la recarga | 500 | `{ "error": { "code": "internal_error", … } }` | Igual que arriba: se reintenta con el próximo request |
| 2 | No hay `approved` para un juego | — | — | Ese juego queda con `challenge_status: "none"`; el día es neutro para su racha |
| 5 | Jugada sobre el desafío de ayer | 409 | `challenge_expired` | La Play de ayer queda `in_progress` para siempre y no cuenta |

## Resultado

**Éxito:** desde el primer request del día, todos los jugadores ven los desafíos nuevos con su `#número`.

**Estado final:**
- Challenges de hoy: `status = 'published'`.
- api: cache de hoy y lista válida recargadas; `current_day = today`.
- Plays `in_progress` de ayer: sin cambios, no cuentan como completadas.

## Notas

- La publicación no depende del `generator` (NFR-A02).
- Solo se publica `date = :today`. Un `approved` de un día en que la `api` no corrió nunca se publica, y ese día queda neutro.
- Con varias instancias de `api` (post-MVP), el single-flight tiene que pasar a un advisory lock.
