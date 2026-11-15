---
id: estadisticas-del-jugador
title: Estadísticas del jugador
type: feature
status: Draft
created: 2026-11-03
last_updated: 2026-11-14
stories: [S-043, S-048]
---

# Estadísticas del jugador

**Tipo:** Feature
**Status:** Draft
**Creado:** 2026-11-03
**Última actualización:** 2026-11-14
**Stories:** S-043, S-048

## Descripción

El jugador abre la pantalla de estadísticas. Ve:
- sus rachas vivas y récords (global y por juego);
- los totales y el porcentaje de victorias;
- las stats propias de cada juego;
- el heatmap de los últimos 365 días;
- el historial paginado.

Cubre C-34 (F12, ADR-011).

## Servicios Involucrados

| Servicio | Rol | Tipo de Participación |
|----------|-----|-----------------------|
| web | Pantalla `/stats`, con paginación del historial | Iniciador |
| api | Calcula las rachas vivas y arma la respuesta | Procesador |
| nerdose-db | `player_stats`, `player_game_stats`, `plays`, `challenges` (lectura) | Procesador |

## Pasos del Flujo

```mermaid
sequenceDiagram
    participant W as web
    participant A as api
    participant DB as nerdose-db

    W->>A: GET /api/me/stats
    A->>DB: SELECT player_stats, player_game_stats
    A->>DB: SELECT max(date) FROM challenges (prev_active_day por juego y global)
    A->>DB: SELECT plays últimos 365 días (heatmap)
    A->>DB: SELECT plays terminadas ORDER BY date DESC LIMIT 60 (historial)
    A-->>W: 200 MyStats
    opt history_next_before != null
        W->>A: GET /api/me/stats?history_before=YYYY-MM-DD
        A-->>W: 200 MyStats (siguiente página)
    end
```

### Paso 1: Pedir estadísticas

**Origen:** web
**Destino:** api
**Tipo:** REST

**Request:**
- **Método:** GET
- **Endpoint:** `/api/me/stats`
- **Query:** `lang` (opcional), `history_before` (opcional, `YYYY-MM-DD`)
- **Headers:** cookie `nd_pid`

**Ref:** `docs/apis/api.yaml` GET /api/me/stats

---

### Paso 2: Leer agregados y calcular rachas vivas

**Origen:** api
**Destino:** nerdose-db
**Tipo:** Interno

**Operación de BD:**
- **Tabla:** `player_stats` — SELECT `global_streak`, `max_global_streak`, `last_active_date`, `total_completed`
- **Tabla:** `player_game_stats` — SELECT `game_id`, `current_streak`, `max_streak`, `played`, `wins`, `last_completed_date`, `extra`
- **Tabla:** `challenges` — `prev_active_day(game_id, today)` y `prev_active_day_global(today)`

**Acción:** la racha se muestra viva si `last_completed_date == today` o `last_completed_date >= prev_active_day`. Si no, 0 (sin escribir en la base). `win_rate = wins / played` (`null` si `played = 0`).

---

### Paso 3: Heatmap e historial

**Origen:** api
**Destino:** nerdose-db
**Tipo:** Interno

**Operación de BD:**
- **Tabla:** `plays` — heatmap: `date`, `count(*)` WHERE `player_id` AND `date >= today − 364` AND `status IN ('won','lost','voided')` GROUP BY `date`
- **Tabla:** `plays` JOIN `challenges` — historial: `date`, `number`, `game_id`, `status`, `result` WHERE `player_id` AND `status IN ('won','lost','voided')` AND (`date < history_before` si viene) ORDER BY `date` DESC LIMIT 61

**Acción:** `label = historyLabel(result)` del `GameDefinition`. En Play `voided` sin `result`, la etiqueta es "anulado" en el locale. Si vinieron 61 filas, `history_next_before` = `date` de la fila 60 y se devuelven 60.

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
    "global": { "current_streak": "integer", "max_streak": "integer", "total_completed": "integer" },
    "games": [ { "game_id", "current_streak", "max_streak", "played", "wins", "win_rate": "number | null", "extra": "object" } ],
    "heatmap": [ { "date": "YYYY-MM-DD", "completed": "integer 0–5" } ],
    "history": [ { "date", "number", "game_id", "status", "label" } ],
    "history_next_before": "YYYY-MM-DD | null"
  }
  ```

**Ref:** `docs/apis/api.yaml` (`MyStats`, `GameStatsView`), `docs/db-schemas/nerdose-db.md` tablas `player_stats`, `player_game_stats`, `plays`

## Manejo de Errores

| Paso | Error | Código | Response | Comportamiento |
|------|-------|--------|----------|---------------|
| 1 | Sin sesión | 401 | `{ "error": { "code": "no_session", … } }` | web muestra stats vacías y el aviso de cookies |
| 1 | `history_before` inválido | 422 | `{ "error": { "code": "validation_error", … } }` | Error de programación |
| 1 | Rate limit de lecturas (600/min por IP) | 429 | `{ "error": { "code": "rate_limited", … } }` | Reintento después de `Retry-After` |

## Resultado

**Éxito:** el jugador ve todo su progreso, con rachas que respetan los días neutros y las anulaciones.

**Estado final:** sin cambios (solo lectura).

## Notas

- Las Play `voided` cuentan en el heatmap, el historial, las rachas y `total_completed`, pero no en `played`, `wins` ni `extra` (invariante 23).
- Las Play `in_progress` (incluidas las de días pasados) no aparecen.
- `extra` de big-o = `{ by_category: { <recipe_category>: { played, correct } } }` (una partida suma `played` a la categoría de su receta y `correct` si ganó). La `api` ya lo devuelve en `games[].extra`; mostrar los aciertos por categoría en la pantalla es de FG-10. La etiqueta del historial de big-o es `✓ O(n log n)` (la respuesta correcta) si ganó, o `✗` si no.
- `extra` de bug-hunt = `{ by_language: { <code_language>: { played, correct } }, by_bug_type: { <bug_type>: { played, correct } } }`; la etiqueta del historial es `✓ L<n>` / `✗ L<n>` con `n` = `bug_line`.
- TanStack Query invalida esta query al terminar una partida y al cambiar el día.

> Actualizado por REQ-009 (story S-043): `extra` y etiqueta del historial de Big O.

> Actualizado por REQ-010 (story S-048): `extra` y etiqueta del historial de Bug Hunt.
