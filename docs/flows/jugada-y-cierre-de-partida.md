---
id: jugada-y-cierre-de-partida
title: Jugada y cierre de partida con rachas
type: feature
status: Draft
created: 2026-11-03
last_updated: 2026-11-10
stories: [S-022, S-023, S-024]
---

# Jugada y cierre de partida con rachas

**Tipo:** Feature
**Status:** Draft
**Creado:** 2026-11-03
**Última actualización:** 2026-11-10
**Stories:** S-022, S-023, S-024

## Descripción

El jugador hace una jugada. La `api` la valida con el `moveSchema` del juego, la aplica con `applyMove` y la persiste. Si la jugada termina la partida, en **la misma transacción** cierra la Play, actualiza las rachas y las stats (días neutros, ADR-011) y responde con el resultado. Cubre C-11, C-12, C-15, C-16, C-19, C-20, C-23, C-27, C-30 y C-33 (F3 y F3.1).

## Servicios Involucrados

| Servicio | Rol | Tipo de Participación |
|----------|-----|-----------------------|
| web | Envía la jugada y muestra feedback, resultado y rachas | Iniciador |
| api | Valida, aplica la jugada, cierra la partida y actualiza agregados | Procesador |
| nerdose-db | `plays`, `player_game_stats`, `player_stats`, `players`, `rejected_guesses`, `challenges` (lectura) | Procesador |

## Pasos del Flujo

```mermaid
sequenceDiagram
    participant W as web
    participant A as api
    participant DB as nerdose-db

    W->>A: POST /api/games/{game_id}/today/move { challenge_number, move }
    A->>A: sesión, desafío de hoy, challenge_number, moveSchema.parse(move)
    A->>DB: BEGIN; SELECT plays ... FOR UPDATE
    alt devdle: palabra fuera de la lista
        A->>DB: INSERT rejected_guesses ON CONFLICT DO NOTHING; COMMIT
        A-->>W: 422 not_in_word_list
    else jugada inválida para el estado
        A->>DB: ROLLBACK
        A-->>W: 422 invalid_move
    else jugada válida, partida sigue (con o sin cambio de estado)
        A->>DB: UPDATE plays SET state; COMMIT
        A-->>W: 200 { feedback, play, result: null, streaks: null }
    else jugada cierra la partida
        A->>DB: UPDATE plays SET status, result, score, code_language, finished_at
        A->>DB: SELECT max(date) FROM challenges (prev_active_day)
        A->>DB: UPSERT player_game_stats; UPSERT player_stats
        A->>DB: UPDATE players SET preferred_code_language (big-o / bug-hunt)
        A->>DB: COMMIT
        A-->>W: 200 { feedback, play, result, streaks }
    end
```

### Paso 1: Enviar la jugada

**Origen:** web
**Destino:** api
**Tipo:** REST

**Request:**
- **Método:** POST
- **Endpoint:** `/api/games/{game_id}/today/move`
- **Query:** `lang` (opcional)
- **Body:**
  ```json
  {
    "challenge_number": "integer",
    "move": "Move del juego"
  }
  ```

`move` por juego:

| game_id | `move` |
|---|---|
| devdle | `{ "guess": "REACT" }` (A–Z, largo = `public_view.length`) |
| grep-grid | `{ "type": "select", "from": { "row", "col" }, "to": { "row", "col" } }` o `{ "type": "give_up" }` |
| timeline | `{ "order": [opaque_id ×5] }` |
| big-o | `{ "language": "js" \| "go" \| "java", "option": big_o_option }` |
| bug-hunt | `{ "language": "js" \| "go" \| "java", "line": integer }` |

**Validaciones previas (sin transacción):** `nd_pid` → desafío de hoy en la cache → `challenge_number == number` → `challenges.status != 'voided'` → `moveSchema.parse(move)`.

**Ref:** `docs/apis/api.yaml` POST /api/games/{game_id}/today/move (`MoveRequest`, `Move`)

---

### Paso 2: Aplicar la jugada

**Origen:** api
**Destino:** (interno)
**Tipo:** Interno

**Operación de BD:**
- **Tabla:** `plays`
- **Operación:** SELECT … FOR UPDATE WHERE `player_id` AND `challenge_id`. Si no existe, INSERT con `status = 'in_progress'` y `state = initState(payload)`.
- **Validación:** `plays.status != 'in_progress'` → `409 game_finished`.

**Acción:** `applyMove(payload, state, move, now, ctx)` del `GameDefinition`, con `ctx = { isValidWord, locale }` armado por la `api` (`locale` es el mismo que usa `result`):
- `{ error: 'not_in_word_list' }` (solo Devdle) → **Operación de BD:** `rejected_guesses` INSERT (`word`, `player_id`, `created_at`) ON CONFLICT DO NOTHING; COMMIT; respuesta `422 not_in_word_list`. El `state` no cambia y no consume intento.
- `{ error: 'invalid_move' }` → ROLLBACK; `422 invalid_move`.
- `{ state, feedback }` → **Operación de BD:** `plays` UPDATE `state`.
- Jugada válida sin cambio de estado (solo Grep Grid): una línea válida hacia adelante que no coincide exactamente con una de las 8 palabras (`feedback.reason = 'not_a_word'`) o una palabra ya encontrada (`feedback.reason = 'already_found'`) devuelven el mismo `state`. No son errores: el UPDATE con el mismo `state` es idempotente y la respuesta es `200`, sin penalización.

Grep Grid, `move.type = 'select'`: si `from` y `to` coinciden exactamente con la primera y la última celda de una palabra no encontrada, se agrega `{ term_id, cells }` al final de `state.found_words` y `feedback.definition` va en `ctx.locale`. `move.type = 'give_up'`: `state.gave_up = true` y `feedback = null`.

**Eventos de dominio:** `GuessRejected` o `MoveApplied`, solo en los logs.

---

### Paso 3: Cerrar la partida (si `isFinished(state)`)

**Origen:** api
**Destino:** (interno)
**Tipo:** Interno (misma transacción que el paso 2)

**Acción:** `result = result(payload, state, locale)`, `win = isWin(result)`, `score = score(result)`.

En Grep Grid, `isFinished(state) = state.gave_up || state.found_words.length === 8`: la octava palabra cierra `won` con `score = 8`; `give_up` cierra `lost` con `score = found_words.length` (0–7), cuenta para la racha y `result` trae `gave_up: true` y las 8 `words` con `found` y `cells`. `extra` de grep-grid = `{ words_found: { "0": n, …, "8": n } }`; `reduceStats` suma 1 en `String(score)`.

**Operación de BD:**
- **Tabla:** `plays`
- **Operación:** UPDATE
- **Campos:** `status = win ? 'won' : 'lost'`, `result`, `score`, `code_language` (= `move.language` en big-o / bug-hunt; si no, null), `finished_at = now()`

**Operación de BD (rachas, F3.1 / ADR-011):**
- **Tabla:** `challenges` — SELECT `max(date)` WHERE `game_id` AND `date < D` AND `status IN ('published','voided')` (`prev_active_day`), y lo mismo sin filtrar `game_id` (`prev_active_day_global`)
- **Tabla:** `player_game_stats` — INSERT … ON CONFLICT (`player_id`, `game_id`) DO UPDATE: `current_streak`, `max_streak`, `played + 1`, `wins + (win ? 1 : 0)`, `last_completed_date = D`, `extra = reduceStats(extra, result)`
- **Tabla:** `player_stats` — INSERT … ON CONFLICT (`player_id`) DO UPDATE: `global_streak`, `max_global_streak`, `last_active_date = D`, `total_completed + 1`

**Operación de BD (preferencia):**
- **Tabla:** `players` — UPDATE `preferred_code_language = move.language` (solo big-o y bug-hunt)

**Eventos de dominio:** `PlayFinished`, `StreaksUpdated`, solo en los logs.

---

### Paso 4: Respuesta

**Origen:** api
**Destino:** web
**Tipo:** REST (response del paso 1)

**Response (éxito):**
- **Status:** 200
- **Body:**
  ```json
  {
    "feedback": "Feedback | null",
    "play": { "status": "in_progress | won | lost", "state": "PlayState", "score": "integer | null" },
    "result": "Result | null — solo si cerró",
    "streaks": "null | { game: { current, max }, global: { current, max } } — solo si cerró"
  }
  ```

`feedback` por juego:

| game_id | `feedback` |
|---|---|
| devdle | `{ guess, marks: ("correct" \| "present" \| "absent")[] }` |
| grep-grid | `{ found: true, term_id, word, definition, cells: [{ row, col }] }` o `{ found: false, reason: "not_a_word" \| "already_found" }`; `null` en `give_up` |
| timeline, big-o, bug-hunt | `null` (la jugada cierra) |

**Ref:** `docs/apis/api.yaml` (`MoveResponse`, `Feedback`, `Result`, `Streaks`), `docs/db-schemas/nerdose-db.md` tablas `plays`, `player_game_stats`, `player_stats`, `rejected_guesses`

## Manejo de Errores

| Paso | Error | Código | Response | Comportamiento |
|------|-------|--------|----------|---------------|
| 1 | Sin sesión | 401 | `{ "error": { "code": "no_session", … } }` | web recrea la sesión |
| 1 | Sin desafío de hoy | 404 | `{ "error": { "code": "no_challenge_today", … } }` | web muestra "sin desafío hoy" |
| 1 | Jugada tardía | 409 | `{ "error": { "code": "challenge_expired", … } }` | web recarga `/api/today` y el juego (ver `cambio-de-dia-y-publicacion`) |
| 1 | Desafío anulado | 409 | `{ "error": { "code": "challenge_voided", … } }` | web muestra el aviso de anulación |
| 1 | `move` no pasa `moveSchema` | 422 | `{ "error": { "code": "invalid_move", … } }` | web muestra "jugada inválida" |
| 2 | Play terminada | 409 | `{ "error": { "code": "game_finished", … } }` | web pide de nuevo `GET …/today` y muestra el resultado |
| 2 | Palabra fuera de la lista (Devdle) | 422 | `{ "error": { "code": "not_in_word_list", … } }` | web muestra "no está en la lista"; el intento no cuenta |
| 2 | Inválida para el estado (selección en reversa, no alineada o de una sola celda en Grep Grid, `line` ∉ `pickable_lines`, faltantes en Timeline) | 422 | `{ "error": { "code": "invalid_move", … } }` | web muestra el error; nada cambia |
| 1 | Rate limit (60/min por player, 300/min por IP) | 429 | `{ "error": { "code": "rate_limited", … } }` | Reintento después de `Retry-After` |
| 2–3 | Error de BD | 500 | `{ "error": { "code": "internal_error", … } }` | ROLLBACK completo: ni la Play ni las rachas quedan a medias |

## Resultado

**Éxito:** el jugador ve el feedback de su jugada. Si la partida terminó, ve la solución, la explicación, su resultado, el botón de compartir y sus rachas actualizadas.

**Estado final:**
- Play: `status` `won` o `lost`, con `result`, `score`, `finished_at` (y `code_language` en big-o / bug-hunt).
- PlayerGameStats / PlayerStats: rachas y contadores actualizados en la misma transacción.
- Player: `preferred_code_language` actualizado (big-o / bug-hunt).

## Notas

- Las rachas usan `prev_active_day` sobre `challenges` `published`/`voided`: un día sin desafío es neutro, sin jobs (ADR-011).
- Si `last_completed_date == D` (no debería pasar por la unicidad de Play), la racha no cambia.
- En Bug Hunt la `api` traduce `line` al nodo con `line_of[language]` y lo compara con `bug_node_id`. Ninguno de los dos sale al cliente antes del resultado.
- La lista válida de Devdle está en memoria (ADR-012). `rejected_guesses` solo se usa para el ranking del admin.
