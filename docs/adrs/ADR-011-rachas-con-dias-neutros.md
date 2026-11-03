# ADR-011: Rachas con días neutros y agregados recalculables

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** progreso, rachas, estadísticas, consistencia

## Contexto

Las rachas son el motor del hábito diario (G-01). Las reglas del dominio son:
- Completar es ganar, perder o tener la partida anulada (decisión #3, invariante 19).
- Un día sin desafío publicado de un juego es **neutro** para su racha. Para la racha global, un día es neutro solo si ningún juego tuvo desafío (decisión #5, invariantes 20–21).
- La racha se muestra viva solo si el último día completado es hoy o el día activo anterior. Si no, se muestra 0, sin jobs de reseteo (invariante 22).
- Las Play `voided` cuentan para las rachas y `total_completed`, pero no para `played`, `wins` ni `extra` (invariante 23).
- Los agregados se actualizan en la misma transacción que cierra la Play y se pueden recalcular desde `plays` (invariante 24).

## Decisión

La lógica vive en `@nerdose/core` y la usan el cierre, la lectura y el recálculo:

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

Al leer: muestra current_streak si last_completed_date == today
         o last_completed_date >= prev_active_day(game_id, today); si no, 0
```

**Recálculo** (al anular): para cada jugador afectado, se recorren sus `plays` en orden de fecha aplicando la misma función, y se excluyen las `voided` de `played`, `wins` y `extra`.

## Reglas de Implementación

- La función de rachas MUST vivir en `@nerdose/core` y ser la única implementación. La `api` MUST usarla en el cierre, en la lectura y en el recálculo.
- `prev_active_day` MUST considerar solo challenges con `status IN ('published','voided')`. MUST NOT haber jobs que reseteen rachas ni que marquen días neutros.
- El cierre de una Play (`won`/`lost`) y la actualización de `player_game_stats` y `player_stats` MUST ocurrir en la misma transacción. Si falla una, se revierte todo.
- Una Play cuenta como completada si `status IN ('won','lost','voided')`. Una `in_progress` nunca cuenta.
- `played`, `wins` y `extra` MUST excluir las Play `voided`. `total_completed` y las rachas MUST incluirlas.
- `extra` MUST calcularse solo con `reduceStats` del `GameDefinition` del juego.
- La racha leída MUST ser 0 si no está viva, sin escribir en la base.
- Debe existir una función `recomputeStats(player_id, game_id?)` que reconstruya `player_game_stats` y `player_stats` desde `plays`. MUST dar el mismo resultado que la aplicación incremental (test de propiedad con historias aleatorias).
- Los tests de rachas MUST usar relojes falsos e incluir días neutros, anulaciones y cambio de día.

## Consecuencias

### Positivas
- No se castiga al jugador por un error de la plataforma (día sin desafío).
- No hacen falta jobs: la neutralidad se deduce de `challenges`.
- Los agregados siempre se pueden reconstruir desde el historial.

### Negativas
- Cada cierre hace una consulta extra (`prev_active_day`). Es barata con el índice de `(game_id, date)`.
- El recálculo al anular puede tocar muchos jugadores en una transacción.

### Riesgos
- **Riesgo:** divergencia entre el cálculo incremental y el recálculo.
  - **Mitigación:** una sola función en `core` y un test de propiedad que compara ambos.

## Alternativas Consideradas

### Alternativa 1: Racha basada en `D - 1` (sin días neutros)

**Pros:**
- Más simple.

**Contras:**
- Un día sin desafío (falla de la plataforma) corta la racha de todos.

**Por qué se descartó:** contradice la decisión #5.

---

### Alternativa 2: Job nocturno que resetea rachas

**Pros:**
- El valor guardado es siempre el que se muestra.

**Contras:**
- Una pieza más que puede fallar, y escrituras masivas a las 00:00.

**Por qué se descartó:** la racha "viva" se resuelve al leer, sin escribir.

## Referencias

- `docs/discovery/analisis-tecnico.md` — F3.1, F6, F12, Arq-15
- `docs/discovery/analisis-dominio.md` — Invariantes 19–25
