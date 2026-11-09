---
component: streak-number
version: 1.2.1
status: active
last_updated: 2026-11-09
source: docs/nerdose.html
related: [streak-pill, panel, card, heatmap]
---

# Streak number (número display)

## Propósito

**Descripción:** número gigante y apretado (Mono 800, tracking negativo, interlineado < 1) con una unidad chica al costado; la última línea de la unidad se alinea con la base del número. Es el protagonista de la racha (Home L210-212, Stats L308-312) y se reutiliza para el puntaje de resultado (Timeline L1003-1005).

**Cuándo usar:**
- Racha global en "Tu progreso" (Home) y en Stats.
- Puntaje final de una partida ("3/5 posiciones correctas").

**Cuándo NO usar:**
- Datos secundarios → [card](./card.md) `stat` / `mini-stat`.
- Racha en el header → [streak-pill](./streak-pill.md).

## Anatomía

1. **Fila** — `display: flex; align-items: last baseline; gap: 10px`. Con la unidad en dos líneas, la base del número coincide con la segunda («seguidos»), no con la primera (el prototipo usaba `baseline` y la segunda línea quedaba colgando).
2. **Número** — display Mono 800.
3. **Unidad** — texto chico, a veces en dos líneas (`días<br>seguidos`, `posiciones<br>correctas`).
4. **Tarjeta (solo `hero`)** — contenedor ámbar con etiqueta `//` y nota.

## Variants

| Variant | Número | Unidad | Contenedor | Fuente |
|---|---|---|---|---|
| `hero` | `type.display.streak` (96/800/0.9/-4) `streak.text` | "días", `type.mono.unit` (Mono 16) `streak.label` (`#C9A46A`) | **Tarjeta de racha:** fondo `streak.surface` (`#140F07`), borde `streak.border` (`#3A2A12`), radio 16, padding 26, gap 10; etiqueta "// racha global actual" Mono 13 `streak.label`; nota Inter 14 `streak.note` (`#C9B48F`) | L308-312 |
| `compact` | `type.display.streak.compact` (88/800/0.9/-4) `streak.text` | "días / seguidos" en 2 líneas, `type.mono.unit.compact` (Mono 15/400) `text.lede` | Dentro del panel `feature` "Tu progreso" | L210-212 |
| `score` | `type.display.score` (56/800/1/-2) en `game.{j}.accent` | "posiciones / correctas", Mono 14 `text.lede` | Sin contenedor; a la derecha del título (`align-items: end`) | L1003-1005 |

`score` no es una racha: usa el acento del juego, no ámbar.

## Sizes

Fijadas por variant (96 / 88 / 56).

## States

| State | Descripción |
|---|---|
| default | Valor actual |
| 0 / sin datos | **Derivado (S-011):** el número va en `text.dim` (`#8D99A6`/`#0F1318` 6,4:1), nunca en ámbar; sin datos muestra `—` y la unidad la decide la app |

## Spacing & sizing rules

- Gap número–unidad 10px.
- La tarjeta `hero` ocupa `flex: 1 1 280px` junto a las stat-cards (ver `foundations/grid.md`).

## Accesibilidad

- **Nombre accesible:** número y unidad se leen juntos ("17 días seguidos"); el `<br>` no corta la lectura.
- **Contraste:** `#FFB547`/`#140F07` ≈ 10,9:1; `#C9A46A`/`#140F07` 8,2:1; `#C9B48F`/`#140F07` 9,5:1; `#A9B4BF`/`#0F1318` 8,9:1; `#C39BFF`/`#0A0C0F` 8,8:1.
- **Zoom/reflow:** 96px de 2 dígitos ≈ 120px; entra a 320px.

## Guidelines de contenido

- Número sin separador de miles hasta 999; unidad en minúscula.
- Nota de la tarjeta: la regla de la racha ("Cualquier desafío completado mantiene la racha.").

## Do's & don'ts

**Do:** alinear por la última baseline (`last baseline`). **Don't:** usar el tamaño display para otros datos; pintar la racha con otro color.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'hero' \| 'compact' \| 'score'` | `'compact'` | Variant |
| `value` | `string \| number` | — | Número ("17", "3/5") |
| `unit` | contenido | — | Unidad (admite salto de línea) |
| `game` | `GameId` | — | Acento de `score` |
| `label` / `note` | contenido | — | Etiqueta y nota de `hero` |

## Componentes y patterns relacionados

- [streak-pill](./streak-pill.md), [panel](./panel.md) `feature`, [heatmap](./heatmap.md), [card](./card.md) `stat`.

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: número de racha 96/88px ámbar con unidad, tarjeta de racha de Stats y puntaje de 56px en el acento del juego.
- 2026-11-06 v1.2.0 — Estados 0 y sin datos derivados.
