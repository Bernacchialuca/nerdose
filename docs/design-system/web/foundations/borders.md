---
foundation: borders
version: 1.0.0
last_updated: 2026-11-05
status: defined
source: docs/nerdose.html
---

# Bordes, radios y texturas

## Propósito

Reúne las decisiones de borde del prototipo `docs/nerdose.html`: grosores, colores, el **punteado con significado**, separadores, la escala de radios y la textura de puntos del fondo de Home. Son parte de la identidad (el punteado es "aún no / provisional") y por eso tienen foundation propia.

## Grosor

| Grosor | Uso | Fuente |
|---|---|---|
| 1px | Por defecto: tarjetas, paneles, botones, chips, separadores | — |
| 2px | Solo piezas de juego: celdas de Devdle y Grep, opción correcta de Big O, nodos huecos de Timeline, celdas de la miniatura de Devdle, muestra "presente" | L87, L152, L484, L531-535, L970, L1197-1199 |
| sin borde | Botones rellenos, teclas de Devdle, pestañas, segmentos del selector | L42, L558, L817, L30 |

Las piezas de juego con borde de 2px lo mantienen en todos los estados (del mismo color que el fondo cuando "no se ve", L533, L1199) para que el cambio de estado no mueva el layout. Excepción del prototipo: la opción de Big O pasa de 1px a 2px al quedar elegida (L970), lo que corre el contenido 1px.

## Colores de borde

| Token semántico | Hex | Uso | Fuente |
|---|---|---|---|
| `border.default` | `#222A33` | Tarjetas y paneles (32 usos) | L84, L481 |
| `border.control` | `#2A323C` | Botones outline, chips, selector, controles y punteados neutros (31 usos) | L30, L43, L491 |
| `border.subtle` | `#1E252E` | Separadores de header, tab-bar, `th`, footer; tarjeta "Cómo funciona"; opciones no elegidas | L18, L248, L363, L970 |
| `border.row` | `#161B22` | Separador entre filas de tabla | L374 |
| `border.emphasis` | `#5A6573` | Celda "escrita" de Devdle | L534 |
| `border.interactive` | `#8D99A6` | Reservado: controles cuyo borde es la única señal que los identifica (WCAG 1.4.11). Sin uso en el prototipo. | — |
| `streak.border` | `#3A2A12` | Elementos de racha (píldora, tarjeta de racha, panel "contexto") | L26, L308, L646 |

## Punteado con significado

`dashed` comunica **"aún no / provisional / no confirmado"**. No es decoración.

| Valor | Significado | Fuente |
|---|---|---|
| `2px dashed #FFB547` | **Presente** en Devdle: la letra está en otra posición (en lugar del relleno amarillo de Wordle) | L87, L484, L532 |
| `1px dashed #2A323C` | Tarjeta "próximo juego / próximamente" | L192 |
| `1px dashed #2A323C` | Botón "↺ reiniciar demo" | L745 |
| `1px dashed #2A323C` (border-top) | Separador de la línea de racha dentro de la terminal | L61 |
| `1px dashed #4A2220` | Fila "1 test oculto falla" | L685 |
| `1px dashed #5C4419` | Fila mal ubicada en Timeline | L1064 |

## Separadores

- `border-bottom: 1px solid #1E252E`: header, barra de la terminal, tab-bar del código, `th`.
- `border-top: 1px solid #1E252E`: footer.
- Miniatura de tarjeta de juego: `border-bottom: 1px solid <borde del tinte del juego>` (L85, L105, L126, L147, L171).
- Tarjeta por juego en Stats: barra superior de **4px** con el acento (`height: 4px`, recortada por el radio con `overflow: hidden`, L336, L408).
- Barras laterales: `box-shadow: inset 3px 0 0` (ver `foundations/elevation.md`).

## Radios

Regla visible: celdas chicas 3-5, celdas de juego / teclas / pestañas / nav 8, botones y filas 10, cajas internas 12, tarjetas y paneles 14, tarjetas destacadas 16, píldoras full.

| Primitivo | Valor | Semántico | Uso | Fuente |
|---|---|---|---|---|
| `radius.3` | 3px | `radius.micro` | Cuadros de leyenda del heatmap, celdas del heatmap de Stats | L221, L403 |
| `radius.4` | 4px | `radius.cell.xs` | Celdas del heatmap de Home, letras de la miniatura de Grep, barra de distribución | L173, L274, L580 |
| `radius.5` | 5px | `radius.cell.sm` | Celdas de la miniatura de Devdle | L87 |
| `radius.6` | 6px | `radius.cell.md` | Muestra de leyenda de Devdle, línea resaltada de la miniatura | L108, L483 |
| `radius.7` | 7px | `radius.segment` | Botón ES/EN (10 − 3 de padding: radios concéntricos) | L30 |
| `radius.8` | 8px | `radius.tile` | Ítem de nav, pestaña, celda y tecla de juego, número de paso, chip O(…) | L21, L127, L529, L558, L729, L817 |
| `radius.10` | 10px | `radius.control` | **Botones**, botón-ícono, contenedor del selector, filas, opción Big O, métrica | L42, L30, L344, L683, L970 |
| `radius.12` | 12px | `radius.inset` | Cajas internas, mini-stat, contadores de Grep | L225, L712, L1109 |
| `radius.14` | 14px | `radius.panel` | Paneles, banners, bloque de código, terminal, stat-cards | L47, L481, L614, L651 |
| `radius.16` | 16px | `radius.feature` | Tarjeta de juego, placeholder, paneles grandes de Home, tarjeta de racha, tablero de Grep | L84, L192, L201, L308, L1117 |
| `radius.full` | 999px (también escrito 99px) | `radius.pill` | Píldora de racha, badges, chips, barras, puntos, círculo del ícono del banner | L26, L94, L237, L616 |

## Textura de fondo

| Token | Valor | Dónde | Fuente |
|---|---|---|---|
| `texture.dots` | `background-image: radial-gradient(#1A2029 1px, transparent 1px); background-size: 24px 24px` sobre `#0A0C0F` | **Solo Home.** Stats y juegos tienen fondo liso. | L16 |
| `bg.header` | `rgba(10,12,15,0.92)` | Header de Home: tapa los puntos detrás del header (no es sticky) | L18 |

Las tarjetas sin fondo (placeholder L192, "Cómo funciona" L248) dejan ver los puntos a propósito.

No hay gradientes lineales: los tintes son hex sólidos.

## Tokens

Primitivos: `radius.*` (arriba), colores en `foundations/color.md`. Semánticos: `border.*`, `radius.*` semánticos, `texture.dots`, `bg.header`. De componente: `button.radius → radius.control`, `card.game.radius → radius.feature`, `panel.radius → radius.panel`, `chip.radius → radius.pill`.

## Guidelines

**Do:**
- Usar `dashed` solo con el significado de la tabla.
- Elegir el radio por tamaño/rol según la regla visible.
- Mantener radios concéntricos en controles anidados (contenedor 10 + padding 3 → interno 7).

**Don't:**
- No usar radio 0 en botones (el prototipo usa 10px).
- No poner la textura de puntos fuera de Home.
- No usar punteado como decoración de separadores comunes.

## Accesibilidad

- El punteado es la señal no cromática de "presente" (Devdle) y "mal ubicado" (Timeline), requerida por NFR-U04.
- Contraste de bordes medido en `foundations/color.md` (sección "No texto").

## Ejemplos

- `components/card.md` (placeholder punteado, barra de 4px en Stats), `patterns/game-boards.md` (celdas con 2px y punteado), `components/terminal-window.md` (separador punteado).

## Historial

- 2026-11-05 v1.0.0 — Foundation nueva: grosores, colores de borde, punteado con significado, separadores, escala de radios 3-16 + full y textura de puntos de 24px.
