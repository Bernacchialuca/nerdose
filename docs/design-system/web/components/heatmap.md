---
component: heatmap
version: 1.1.0
status: active
last_updated: 2026-11-25
source: docs/nerdose.html
related: [streak-number, panel, card]
---

# Heatmap de actividad

## Propósito

**Descripción:** grilla tipo "contribution graph" de juegos completados por día, en la rampa verde de la marca (`#1A2028` → `#3DDC84`). Acompaña al número de racha: sus celdas activas cuentan visualmente los mismos días (L271, L400-402).

**Cuándo usar:** resumen de actividad reciente en Home (4 semanas) y Stats (12 semanas), y el último año en Estadísticas (`year`, 365 días).

**Cuándo NO usar:** `month` y `quarter` no tienen valor por celda accesible: para datos que el jugador tiene que leer celda por celda se usa `year`.

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
| `year` (Stats) | 53 columnas de semana (lunes a domingo) × 7 filas = 365 días; etiquetas de mes `aria-hidden` sobre la semana que contiene el día 1 | 14×14, radio 3 (`radius.micro`) | 4px | Sí (0–5, `aria-hidden`) | Contenedor con `overflow-x: auto` que abre scrolleado en hoy | adaptación de producto (REQ-011), derivada de `quarter` + `month` |

## Sizes

Fijados por variant. `quarter` mide 212px de ancho (entra a 320px). `year` es más ancho que el contenido útil a 320px: scrollea dentro de su contenedor (alcanzable con teclado, una sola parada de Tab) y la página no scrollea en horizontal; medido en la auditoría de S-059 (informe, «320 px»).

## States

| Nivel | Color |
|---|---|
| 0 | `#1A2028` |
| 1 | `#14532D` |
| 2 | `#1F8F4E` |
| 3 | `#2FBF6B` |
| 4 | `#3DDC84` |

En `year`, 4 y 5 completados comparten el nivel 4 (sin sexta tonalidad).

- Hoy (`year`): anillo 1px `border.interactive` + `aria-current="date"`.
- Foco (`year`): `focus.ring` (outline 2px acento, offset 2).

Sin hover, foco ni tooltip en `month` y `quarter` (prototipo). El «Pendiente» de detalle por celda queda resuelto para `year`.

## Spacing & sizing rules

- Caption sobre la grilla con gap 8 (`month`) o 10 (`quarter`).

## Accesibilidad

- **ARIA:** `role="img"` + `aria-label` con el resumen ("Actividad de las últimas 4 semanas: 17 días seguidos con al menos un desafío completado", L216; "Mapa de actividad de las últimas 12 semanas", L321). **Requisito:** el `aria-label` lleva el dato, no solo el título.
- **`year`:** `role="grid"` con `aria-label` de resumen («{n} desafíos completados en los últimos 365 días»); cada celda es un `button` con nombre «{fecha larga}: {n} de 5 desafíos completados». Una sola parada de Tab (roving, arranca en hoy); ↑ ↓ día, ← → semana, Home primer día, End hoy. Línea de detalle con el día enfocado o tocado («{fecha} · {n} de 5 completados»; vacío: «Sin partidas en los últimos 365 días»).
- **WCAG 1.4.1 y 1.4.11 en `year`:** resueltos por la alternativa en texto por celda y el detalle. Las celdas < 44 px son una excepción aceptada (grilla de datos con alternativa por teclado; informe `docs/audits/accesibilidad-REQ-011.md`).
- **WCAG 1.4.11 (`month` y `quarter`):** niveles 0 y 1 contra el fondo `#0F1318` dan 1,1:1 y 2,1:1. Aceptable porque el dato está en texto (caption, número de racha y `aria-label`); si el heatmap pasara a transmitir el valor de cada día, hace falta alternativa por celda.
- **WCAG 1.4.1 (`month` y `quarter`):** la intensidad es la única señal por celda; mismo criterio que el punto anterior.

## Guidelines de contenido

- Caption: "{período} · juegos completados por día".
- Caption de `year`: «últimos 365 días · desafíos completados por día».

## Do's & don'ts

**Do:** usar la rampa verde. **Don't:** usar el acento de un juego ni agregar una sexta tonalidad.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'month' \| 'quarter' \| 'year'` | `'month'` | Variant |
| `levels` | `number[]` (0-4) | — | Un nivel por día, en orden cronológico |
| `caption` | contenido | — | Texto superior |
| `label` | `string` | — | `aria-label` con el resumen |

Implementación en `@nerdose/ui` (`Heatmap`, variante `year`): `today`, `days` (`{ date, completed }[]`), `locale`, `caption`, `summaryLabel(total)`, `cellLabel(day)`, `detailLabel(day)`, `emptyDetail`.

## Componentes y patterns relacionados

- [streak-number](./streak-number.md), [panel](./panel.md) `feature`, [card](./card.md) `stat`.

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: rampa de 5 niveles, variants `month` (Home, 28 celdas con leyenda) y `quarter` (Stats, 84 celdas en columnas).
- 2026-11-25 v1.1.0 — Story S-059 (plan `ui`): variante `year` (365 días) documentada desde `@nerdose/ui` (S-056) con su accesibilidad resuelta; cierra el gap aceptado en REQ-011.
