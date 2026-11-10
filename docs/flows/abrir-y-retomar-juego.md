---
id: abrir-y-retomar-juego
title: Abrir el juego de hoy, empezar y retomar
type: feature
status: Draft
created: 2026-11-03
last_updated: 2026-11-10
stories: [S-022, S-023, S-024]
---

# Abrir el juego de hoy, empezar y retomar

**Tipo:** Feature
**Status:** Draft
**Creado:** 2026-11-03
**Última actualización:** 2026-11-10
**Stories:** S-022, S-023, S-024

## Descripción

El jugador abre un juego desde la home. La `api` devuelve la vista pública del desafío de hoy, sin solución, y la Play del jugador si existe. Según el estado, el front muestra las instrucciones, retoma la partida o muestra el resultado. Al salir de las instrucciones se crea la Play. Cubre C-08, C-09, C-10 y C-14 (F2).

## Servicios Involucrados

| Servicio | Rol | Tipo de Participación |
|----------|-----|-----------------------|
| web | Pide el juego de hoy, elige la pantalla y empieza la partida | Iniciador |
| api | Aplica `toPublic` / `result` del `GameDefinition` y crea la Play | Procesador |
| nerdose-db | Guarda y lee `plays` | Procesador |

## Pasos del Flujo

```mermaid
sequenceDiagram
    participant W as web
    participant A as api
    participant DB as nerdose-db

    W->>A: GET /api/games/{game_id}/today
    A->>DB: SELECT plays WHERE player_id AND challenge_id
    A->>A: challenge de hoy (cache) → toPublic(payload, locale, state)
    A-->>W: 200 GameToday { challenge_status, public_view, play, result }
    alt challenge_status = none
        W->>W: "sin desafío hoy"
    else challenge_status = voided
        W->>W: aviso de anulación (ver anulacion-de-desafio)
    else play = null
        W->>W: instrucciones
        W->>A: POST /api/games/{game_id}/today/start { challenge_number }
        A->>DB: INSERT plays ... ON CONFLICT DO NOTHING
        A-->>W: 200 { play }
    else play.status = in_progress
        W->>W: retoma con play.state
    else play terminada
        W->>W: pantalla de resultado con result
    end
```

### Paso 1: Abrir el juego

**Origen:** web
**Destino:** api
**Tipo:** REST

**Request:**
- **Método:** GET
- **Endpoint:** `/api/games/{game_id}/today`
- **Query:** `lang` (opcional)
- **Headers:** cookie `nd_pid` (opcional)

**Operación de BD:**
- **Tabla:** `plays`
- **Operación:** SELECT
- **Campos:** `status`, `state`, `score`, `code_language`, `result` WHERE `player_id` AND `challenge_id`

**Response (éxito):**
- **Status:** 200
- **Body:**
  ```json
  {
    "game_id": "devdle | bug-hunt | big-o | timeline | grep-grid",
    "date": "string (date)",
    "number": "integer",
    "challenge_status": "published | voided | none",
    "public_view": "PublicView | null — toPublic(challenges.payload, locale, state) en el locale; null si none o voided",
    "play": "null | { status, state, score, code_language }",
    "result": "null | Result — result(challenges.payload, plays.state) si la Play terminó"
  }
  ```

`public_view = toPublic(payload, locale, state)`: la `api` pasa `plays.state` solo si la Play está `in_progress`; si no hay Play o ya terminó, `state` es `undefined`. `public_view` por juego (sin solución, ADR-006):

| game_id | `public_view` |
|---|---|
| devdle | `{ length, possible_categories[] }` |
| grep-grid | `{ grid: string[12][12], words: [{ term_id, word, definition? }] ×8 }` — `definition` solo en las palabras ya encontradas (`term_id` presentes en `plays.state.found_words`), en el locale resuelto; nunca en las no encontradas ni sin Play |
| timeline | `{ category, prompt, items: [{ opaque_id, label }] ×5 }` (mezclados) |
| big-o | `{ code: { js, go, java }, options: big_o_option[8] }` |
| bug-hunt | `{ spec, code: { js, go, java }, pickable_lines: int[], visible_tests: [{ input, expected }] }` |

**Ref:** `docs/apis/api.yaml` GET /api/games/{game_id}/today (`GameToday`, `PublicView`, `PlayView`, `Result`)

---

### Paso 2: Empezar la partida

**Origen:** web
**Destino:** api
**Tipo:** REST

**Request:**
- **Método:** POST
- **Endpoint:** `/api/games/{game_id}/today/start`
- **Body:**
  ```json
  { "challenge_number": "integer — number recibido en el paso 1" }
  ```

**Validaciones:** sesión (`nd_pid`) → hay desafío de hoy → `challenge_number == number` de hoy → `challenges.status == 'published'`.

**Operación de BD:**
- **Tabla:** `plays`
- **Operación:** INSERT … ON CONFLICT (`player_id`, `challenge_id`) DO NOTHING, y después SELECT
- **Campos:** `player_id`, `challenge_id`, `game_id`, `date`, `state = initState(payload)`, `status = 'in_progress'`, `started_at`

`state` inicial por juego: devdle `{ guesses: [] }`; grep-grid `{ found_words: [], gave_up: false }`; timeline, big-o y bug-hunt `{}`.

**Evento de dominio:** `PlayStarted` (`play_id`, `player_id`, `challenge_id`), solo en los logs.

**Response (éxito):**
- **Status:** 200
- **Body:**
  ```json
  {
    "play": {
      "status": "in_progress (o el estado actual si ya existía)",
      "state": "PlayState",
      "score": "null",
      "code_language": "null"
    }
  }
  ```

**Ref:** `docs/apis/api.yaml` POST /api/games/{game_id}/today/start (`ChallengeNumberBody`, `PlayView`)

---

### Paso 3: Cambio de lenguaje de código (solo cliente)

**Origen:** web
**Destino:** (interno)
**Tipo:** Interno

**Acción:** en Big O y Bug Hunt, `public_view.code` trae `js`, `go` y `java`. Cambiar de lenguaje no hace ningún request ni altera la Play (invariante 17). El lenguaje inicial es `players.preferred_code_language`.

## Manejo de Errores

| Paso | Error | Código | Response | Comportamiento |
|------|-------|--------|----------|---------------|
| 1 | `game_id` inexistente | 404 | `{ "error": { "code": "not_found", … } }` | web vuelve a la home |
| 2 | Sin cookie `nd_pid` | 401 | `{ "error": { "code": "no_session", … } }` | web llama a `POST /api/session` y reintenta; si sigue fallando, aviso de cookies |
| 2 | Sin desafío de hoy | 404 | `{ "error": { "code": "no_challenge_today", … } }` | web muestra "sin desafío hoy" |
| 2 | `challenge_number` ≠ número de hoy | 409 | `{ "error": { "code": "challenge_expired", … } }` | web invalida la cache y repite el paso 1 |
| 2 | Desafío anulado | 409 | `{ "error": { "code": "challenge_voided", … } }` | web muestra el aviso de anulación |
| 2 | Body inválido | 422 | `{ "error": { "code": "validation_error", … } }` | Error de programación |
| 2 | Rate limit (30/min por `player_id`) | 429 | `{ "error": { "code": "rate_limited", … } }` | Reintento después de `Retry-After` |

## Resultado

**Éxito:** el jugador ve las instrucciones y empieza, retoma la partida donde la dejó, o ve el resultado si ya jugó hoy.

**Estado final:**
- Play: fila en `plays` con `status = 'in_progress'` y `state` inicial (si se empezó).

## Notas

- `/start` es idempotente: dos pestañas o un doble toque no crean dos Play.
- La `api` nunca serializa `challenges.payload` al jugador. Antes de terminar, solo `public_view`. Después, `result`.
- En Grep Grid, al retomar o al cambiar de idioma, las definiciones de las palabras encontradas salen de `public_view.words[].definition`; `plays.state.found_words` guarda solo `{ term_id, cells }` (REQ-005).
- Si `POST …/move` llega sin una Play creada, la crea igual que `/start` (ver `jugada-y-cierre-de-partida`).
