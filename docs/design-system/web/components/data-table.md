---
component: data-table
version: 1.0.0
status: active
last_updated: 2026-11-05
source: docs/nerdose.html
related: [card, panel]
---

# Data table

## Propósito

**Descripción:** tabla de historial de Stats (L359-383): una fila por día y una columna por juego, toda en Mono, con encabezados en el color de cada juego.

**Cuándo usar:** historial reciente de partidas.

**Cuándo NO usar:** para métricas sueltas → [card](./card.md) `stat` / `metric`.

## Anatomía

1. **Contenedor** — borde `border.default`, fondo `bg.surface`, `radius.panel` (14), `overflow-x: auto`.
2. **Tabla** — `width: 100%; min-width: 640px; border-collapse: collapse`, `type.mono.body` (Mono 14).
3. **Encabezado** — `th` alineados a la izquierda, `type.meta.th` (Mono 12/500), padding 14 20, `border-bottom` `border.subtle`. Columna `fecha` en `text.dim`; cada columna de juego en su acento (`devdle`, `bug`, `big-o`, `timeline`, `grep`).
4. **Celdas** — padding 14 20, `border-bottom` `border.row` (`#161B22`, también en la última fila). Fecha en `text.muted` ("vie 30/10"); resultados en `text.primary`: "✓ 4/6", "✗ L7", "✓ O(log n)", "✓ 02:31", `—` si no se jugó.

## Variants

| Variant | Uso |
|---|---|
| `default` (único) | Historial de Stats |

## Sizes

Único.

## States

Sin hover de fila ni zebra en el prototipo. `✓` y `✗` **no van coloreados** (L374-379). Hover de fila: **Pendiente — el prototipo no lo define**.

## Spacing & sizing rules

- Scroll horizontal del contenedor por debajo de ~704px de viewport (640 + 64).

## Accesibilidad

- **Semántica:** `<table>` con `<caption>` (puede ser visualmente oculto) y `<th scope="col">`; la fecha como `<th scope="row">`.
- **Glifos:** `✓`/`✗` sin color; el nombre accesible de cada celda tiene que decir el resultado ("resuelto en 4 de 6", "falló, elegiste la línea 7"). **Requisito**; el prototipo solo muestra el glifo.
- **Scroll:** el contenedor con `overflow-x: auto` es alcanzable con teclado (`tabindex="0"` + nombre). Excepción WCAG 1.4.10 para tablas de datos.
- **Contraste:** encabezados en acento sobre `#0F1318` ≥ 7,0:1; fecha 7,5:1; celdas 15,8:1.

## Guidelines de contenido

- Encabezados en minúscula con slugs CLI cortos (`bug`, `grep`), no nombres comerciales.
- Fechas "{día abreviado} dd/mm" ("vie 30/10").

## Do's & don'ts

**Do:** mantener toda la tabla en Mono. **Don't:** colorear `✓`/`✗`; envolver el contenido de celdas.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `rows` | `{ date, results: Record<GameId, string \| null> }[]` | — | Filas |
| `caption` | `string` | — | Título accesible |

## Componentes y patterns relacionados

- [card](./card.md) (`game-stats`), [panel](./panel.md).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: tabla Mono 14 con `min-width` 640 y scroll del contenedor, encabezados por juego en su acento, separadores `#1E252E` / `#161B22`.
