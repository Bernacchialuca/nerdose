---
foundation: grid
version: 1.2.0
last_updated: 2026-11-06
status: defined
platform: web
source: docs/nerdose.html
---

# Grid (web)

## Propósito

Describe cómo se acomoda el layout de `web` según el ancho. **El prototipo `docs/nerdose.html` no tiene ninguna media query**: no hay grilla de 12 columnas ni breakpoints globales. El comportamiento responsive sale de `flex-wrap: wrap` + `flex-basis` y de `grid-template-columns: repeat(auto-fit, minmax(N, 1fr))`. Este archivo registra esas reglas, los anchos de viewport en los que cada bloque cambia (breakpoints efectivos) y las adaptaciones necesarias para 320px.

**Es la fuente única de los anchos de layout.** Lo consumen `/service-planify-story` (lo copia al Story Plan), `/service-implement-story` y `/product-ux-wireframes`. Cambiar un valor de acá cambia código ya implementado: es breaking (ver `governance.md`).

## Contenedor de página

- `max-width: 1240px; margin: 0 auto; padding-inline: 32px` en todas las pantallas (L34, L301, L451, L611, L866, L997, L1101).
- Ancho de contenido = viewport − 64px, hasta un máximo de **1176px**.
- Los hijos de flex llevan `min-width: 0` para poder encoger.

## Reglas de layout del prototipo

### Flex con wrap (dos columnas que se apilan)

| Pantalla / bloque | Columnas (`flex`) | Gap | Fuente |
|---|---|---|---|
| Home — hero (texto + terminal) | `1 1 520px` + `1 1 420px` | 48px | L36-47 |
| Home — progreso | `2 1 560px` + `1 1 320px` | 20px | L200-231 |
| Stats — racha + stats | `1 1 280px` + `3 1 560px` | 20px | L307-313 |
| Devdle — tablero + aside | `999 1 560px` + `1 1 300px` (máx. 380px), `justify-content: center` | 40px | L451-480 |
| Bug Hunt — código + aside (jugando) | `1 1 560px` + `1 1 360px` | 24px | L643-676 |
| Bug Hunt — código + aside (resultado) | `1 1 560px` + `1 1 380px` | 24px | L709 |
| Big O — código + explicación | `1 1 560px` + `1 1 380px` | 24px | L881-905 |
| Timeline — tu orden + orden correcto | `1 1 320px` + `2 1 520px` | 24px | L1009-1024 |
| Timeline — partida (lista + ayuda/confirmar) | `7 1 520px` + `5 1 320px` | 24px | S-029 |
| Grep — tablero + aside | `999 1 620px` + `1 1 340px` | 28px | L1114-1126 |

Con `flex-grow: 999` (Devdle, Grep) el tablero se queda con casi todo el espacio sobrante y el aside apenas crece.

### Grilla auto-fit

| Bloque | Regla | Gap | Fuente |
|---|---|---|---|
| Home — tarjetas de juego | `repeat(auto-fit, minmax(300px, 1fr))` | 20px | L82 |
| Home — "Cómo funciona" | `repeat(auto-fit, minmax(240px, 1fr))` | 16px | L247 |
| Home — mini-stats | `repeat(auto-fit, minmax(140px, 1fr))` | 12px | L224 |
| Stats — stat-cards (heatmap en `grid-column: 1 / -1`) | `repeat(auto-fit, minmax(160px, 1fr))` | 12px | L313, L318 |
| Stats — tarjetas por juego | `repeat(auto-fit, minmax(220px, 1fr))` | 16px | L333 |
| Stats — métricas de tarjeta | `repeat(2, minmax(0, 1fr))` (fijo 2×2) | 10px | L342 |
| Big O — opciones | `repeat(4, minmax(0, 1fr))` (fijo 4 columnas) | 10px | L898 |
| Home — heatmap | `repeat(14, minmax(0, 1fr))` | 5px | L216 |

### Anchos fijos

| Pieza | Ancho | Comportamiento | Fuente |
|---|---|---|---|
| Tablero de Devdle | 6×64 + 5×8 = **424px** | Sin regla responsive | L461 |
| Tablero de Grep | 12×48 + 11×4 + 32 + 2 = **654px** | Se escala por debajo de 654px (`@container`, celdas `aspect-ratio: 1`), sin scroll horizontal (S-024) | L1116-1117 |
| Tabla de historial (Stats) | `min-width: 640px` | `overflow-x: auto` en el contenedor | L359-360 |
| Heatmap de Stats | 12×14 + 11×4 = 212px | `overflow-x: auto` | L320-321 |

## Breakpoints efectivos (derivados)

No son tokens de media query: son los anchos de **viewport** (contenido + 64px de gutter) en los que cada bloque cambia por sí solo.

| Bloque | Una columna por debajo de | Notas |
|---|---|---|
| Timeline (resultado y partida) | 928px | 320 + 24 + 520 (en la partida la lista de 520 va primero) |
| Home — progreso | 964px | 560 + 20 + 320 |
| Devdle | 964px | 560 + 40 + 300; el aside cae abajo, centrado |
| Stats — racha + stats | 924px | 280 + 20 + 560 |
| Bug Hunt (jugando) | 1008px | 560 + 24 + 360 |
| Bug Hunt (resultado), Big O | 1028px | 560 + 24 + 380 |
| Home — hero | 1052px | 520 + 48 + 420; la terminal cae debajo del texto |
| Grep | 1052px | 620 + 28 + 340 |

| Grilla auto-fit | 1 col | 2 col desde | 3 col desde | 4 col desde | 5 col desde |
|---|---|---|---|---|---|
| Tarjetas de juego (300 / 20) | < 684px | 684px | 1004px | — (no entra en 1176) | — |
| "Cómo funciona" (240 / 16) | < 560px | 560px | 816px | 1072px | — |
| Stats por juego (220 / 16) | < 520px | 520px | 756px | 1008px | 1228px |

## Viewports de UX ↔ comportamiento

Los wireframes se producen en dos viewports canónicos. Como no hay breakpoints globales, la tabla dice cómo se ve cada bloque en cada frame:

| Viewport UX | Frame | Contenido útil | Layouts de dos columnas | Tarjetas de juego | Stats por juego |
|---|---|---|---|---|---|
| `mobile` | 400px | 336px | Todos apilados | 1 columna | 1 columna |
| `desktop` | 1200px | 1136px | Todos lado a lado | 3 columnas | 4 columnas (5 desde 1228px) |

- **Entre 400 y 1200px** no hay un único corte: cada bloque cambia en su propio ancho (tabla anterior). Las grillas auto-fit ganan columnas antes (desde 520-684px) y los layouts de dos columnas se arman recién entre 924 y 1052px. Hasta ~924px la pantalla **se comporta como mobile** salvo las grillas auto-fit.
- El header no cambia de estructura: envuelve con `flex-wrap` (ver `components/app-header.md`).

## Adaptaciones requeridas para 320px (NFR-U01)

A 320px el contenido útil mide **256px** (320 − 2×32). El prototipo no lo resuelve en estos casos; el PRD manda:

| Pieza | Problema a 256px | Adaptación requerida |
|---|---|---|
| Tarjetas de juego `minmax(300px, 1fr)` | La columna mínima (300) supera el contenedor → scroll horizontal | La columna mínima no puede superar el ancho disponible (equivalente a `minmax(min(300px, 100%), 1fr)`). Mantiene el aspecto. |
| Tablero de Devdle (424px) | Desborda | Tiene que entrar en 256px: 6 celdas + 5 gaps → celda ≤ 36px con gap de 8px. **Pendiente** la regla de escalado (celda, gap, tamaño de letra). |
| Tablero de Grep (654px) | Se escala | La página no puede scrollear en horizontal y NFR-U01 pide 320px sin scroll horizontal: se escala (celdas `aspect-ratio: 1`, padding y letra por `clamp` sobre el ancho del contenedor; ver `patterns/game-boards.md` 1.2.0). A 256px la celda mide ≈ 16px: área táctil < 40px aceptada (S-024). |
| Opciones de Big O (4 columnas fijas) | ~56px por opción; "O(n log n)" en 16px necesita ~96px | Menos columnas en anchos chicos. **Pendiente** cuántas. |
| `type.title.page` 40px | "estadísticas" ocupa ~270px | Ver `foundations/typography.md`. |
| Tabla de historial (640px) | Scroll horizontal del contenedor | Excepción WCAG 1.4.10 para tablas de datos: se mantiene el scroll del contenedor; la página no scrollea. |
| Heatmap de Stats (212px) | Entra en 256px | Sin cambios. |

## Tokens

| Token | Valor |
|---|---|
| `layout.page.max-width` | 1240px |
| `layout.page.gutter` | `space.32` |
| `layout.grid.games` | `auto-fit, minmax(300px, 1fr)`, gap `space.20` |
| `layout.grid.steps` | `auto-fit, minmax(240px, 1fr)`, gap `space.16` |
| `layout.grid.mini-stats` | `auto-fit, minmax(140px, 1fr)`, gap `space.12` |
| `layout.grid.stat-cards` | `auto-fit, minmax(160px, 1fr)`, gap `space.12` |
| `layout.grid.game-stats` | `auto-fit, minmax(220px, 1fr)`, gap `space.16` |
| `layout.split.*` | Las bases y gaps de la tabla "Flex con wrap" |

## Guidelines

**Do:**
- Reproducir las bases (`flex-basis`) y los mínimos (`minmax`) del prototipo; dejar que el ancho decida.
- Poner `min-width: 0` en cada columna flex.
- Ordenar el DOM igual que el orden visual apilado (texto antes que terminal, tablero antes que aside).

**Don't:**
- No introducir breakpoints globales (12 columnas, `lg:`) para reemplazar estas reglas.
- No ocultar contenido según el ancho (el prototipo no oculta nada: el nav del header siempre está).
- No usar anchos fijos nuevos sin resolver su comportamiento a 320px.

## Accesibilidad

- Reflow (WCAG 1.4.10 / NFR-U01): sin scroll horizontal de página a 320px; ver tabla de adaptaciones.
- Zoom 200%: equivale a un viewport de la mitad del ancho; las reglas intrínsecas lo absorben igual que un mobile.

## Layouts derivados (S-012)

- **Acerca de:** paneles en `flex-wrap`, gap 20, cada uno `flex: 1 1 520px` (base de la columna de texto del hero, L36-47) y `min-width: 0`. Dos columnas desde 1124px de viewport (2×520 + 20 + gutter 64), una columna por debajo; sin media queries.
- **Pantallas de mensaje (404, error de ruta):** una columna `layout.lede` de 540px centrada (`max-w-lede`), con el botón a ancho completo.
- Los "6/12" y "10/12" de los screen.md solo indican largo de línea; no hay grilla de 12.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-05 v1.0.0 — Reescrita desde el prototipo: sin media queries ni grilla de 12 columnas; reglas flex-wrap y auto-fit con sus valores reales, breakpoints efectivos derivados, mapeo a los viewports de UX y adaptaciones requeridas para 320px. Se eliminan los tokens `bp.xs`…`bp.xl`.
- 2026-11-06 v1.1.0 — S-012: layouts de "Acerca de" y de pantallas de mensaje.
- 2026-11-06 v1.2.0 — S-013: plantillas `auto-fit` de la home (tarjetas y "Cómo funciona") con `min(N, 100%)`.
