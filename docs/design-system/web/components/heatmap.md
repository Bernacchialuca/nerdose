---
component: heatmap
version: 1.0.0
status: active
last_updated: 2026-11-05
source: docs/nerdose.html
related: [streak-number, panel, card]
---

# Heatmap de actividad

## Propósito

**Descripción:** grilla tipo "contribution graph" de juegos completados por día, en la rampa verde de la marca (`#1A2028` → `#3DDC84`). Acompaña al número de racha: sus celdas activas cuentan visualmente los mismos días (L271, L400-402).

**Cuándo usar:** resumen de actividad reciente en Home (4 semanas) y Stats (12 semanas).

**Cuándo NO usar:** para datos que el jugador tiene que leer celda por celda (no hay valores por celda accesibles).

## Anatomía

1. **Caption** — `type.meta` (Mono 12), `text.dim`: "últimas 4 semanas · juegos completados por día" (L215) / "últimas 12 semanas · …" (L319).
2. **Grilla** — `role="img"` con `aria-label` que resume el dato.
3. **Celdas** — color por nivel 0-4 (`data.heatmap.*`).
4. **Leyenda (solo `month`)** — "0" + 5 cuadros 12×12 radio 3 + "4", Mono 11 `text.dim`, gap 6 (L221).

## Variants

| Variant | Grilla | Celda | Gap | Leyenda | Contenedor | Fuente |
|---|---|---|---|---|---|---|
| `month` (Home) | `repeat(14, minmax(0, 1fr))`, 2 filas = 28 días, en orden de fila | alto 22px, radio 4 | 5px | Sí | Columna gap 8, `flex: 1 1 280px` dentro del panel "Tu progreso" | L214-221, L271-275 |
| `quarter` (Stats) | `grid-template-rows: repeat(7, 14px); grid-auto-flow: column; grid-auto-columns: 14px` = 7×12 = 84 días | 14×14, radio 3 | 4px | No | Stat-card de ancho completo (`grid-column: 1 / -1`), wrapper `overflow-x: auto` | L318-327, L396-404 |

## Sizes

Fijados por variant. `quarter` mide 212px de ancho (entra a 320px).

## States

| Nivel | Color |
|---|---|
| 0 | `#1A2028` |
| 1 | `#14532D` |
| 2 | `#1F8F4E` |
| 3 | `#2FBF6B` |
| 4 | `#3DDC84` |

Sin hover, foco ni tooltip en el prototipo: **Pendiente** si se agrega detalle por celda.

## Spacing & sizing rules

- Caption sobre la grilla con gap 8 (`month`) o 10 (`quarter`).

## Accesibilidad

- **ARIA:** `role="img"` + `aria-label` con el resumen ("Actividad de las últimas 4 semanas: 17 días seguidos con al menos un desafío completado", L216; "Mapa de actividad de las últimas 12 semanas", L321). **Requisito:** el `aria-label` lleva el dato, no solo el título.
- **WCAG 1.4.11:** niveles 0 y 1 contra el fondo `#0F1318` dan 1,1:1 y 2,1:1. Aceptable porque el dato está en texto (caption, número de racha y `aria-label`); si el heatmap pasara a transmitir el valor de cada día, hace falta alternativa por celda.
- **WCAG 1.4.1:** la intensidad es la única señal por celda; mismo criterio que el punto anterior.

## Guidelines de contenido

- Caption: "{período} · juegos completados por día".

## Do's & don'ts

**Do:** usar la rampa verde. **Don't:** usar el acento de un juego ni agregar una sexta tonalidad.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'month' \| 'quarter'` | `'month'` | Variant |
| `levels` | `number[]` (0-4) | — | Un nivel por día, en orden cronológico |
| `caption` | contenido | — | Texto superior |
| `label` | `string` | — | `aria-label` con el resumen |

## Componentes y patterns relacionados

- [streak-number](./streak-number.md), [panel](./panel.md) `feature`, [card](./card.md) `stat`.

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: rampa de 5 niveles, variants `month` (Home, 28 celdas con leyenda) y `quarter` (Stats, 84 celdas en columnas).
