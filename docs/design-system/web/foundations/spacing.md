---
foundation: spacing
version: 1.1.1
last_updated: 2026-11-09
status: defined
source: docs/nerdose.html
---

# Espaciado

## Propósito

Define la escala de espaciado (padding, gap, márgenes de página) y las medidas de control que usa el prototipo `docs/nerdose.html`. No es una escala de 4pt pura: el prototipo usa valores pares e impares de 2 a 72px. El DS los registra tal cual en lugar de redondearlos.

## Escala

Los nombres de los primitivos son el valor en píxeles (`space.20` = 20px).

| Primitivo | Valor | Usos más frecuentes | Fuente |
|---|---|---|---|
| `space.2` | 2px | Gap de selector de idioma, logo, textos de banner y contadores | L19, L30, L871 |
| `space.3` | 3px | Padding del contenedor del selector de idioma; padding de barra de distribución | L30, L580 |
| `space.4` | 4px | Gap de pestañas, gap de celdas de Grep y heatmap de Stats; padding vertical de badge | L94, L321, L653, L1117 |
| `space.5` | 5px | Gap de heatmap de Home y celdas de la miniatura de Devdle | L87, L216 |
| `space.6` | 6px | Gap de chips, teclas, segmentos de progreso; padding vertical de chip | L73, L471, L491 |
| `space.7` | 7px | Gap de líneas de la miniatura de Bug Hunt | L105 |
| `space.8` | 8px | **El más usado (×48):** gap de filas de juego, píldora, encabezados; padding de tab-bar | L459, L652 |
| `space.10` | 10px | Gap de botón grande e ícono; padding horizontal de badge y chip; fila de test | L42, L94, L683 |
| `space.12` | 12px | Gap de grillas de stats, cuerpo de tarjeta; padding de fila y métrica | L91, L224, L344 |
| `space.14` | 14px | Gap de metadatos y de ícono-texto de banner; padding horizontal de píldora, Compartir, ítem de nav | L26, L97, L615 |
| `space.16` | 16px | Gap de asides y grillas; padding de botón mediano y de tablero de Grep | L247, L622, L1117 |
| `space.18` | 18px | Padding de banner (vertical) y de header global; gap de breadcrumb de juego | L18, L436, L614 |
| `space.20` | 20px | Padding de tarjeta y panel; gap de grilla de juegos y de filas Home | L82, L91, L481 |
| `space.22` | 22px | Padding de botón grande y banner (horizontal); gap del hero | L37, L42, L614 |
| `space.24` | 24px | Gap de layouts de juego de dos columnas; padding de panel de explicación y footer | L643, L709, L256 |
| `space.26` | 26px | Padding de tarjeta de racha (Stats) | L308 |
| `space.28` | 28px | Padding de panel grande de Home y tarjeta placeholder; gap entre secciones de juego | L192, L201, L611 |
| `space.32` | 32px | **Margen lateral de página**; gap entre secciones de Stats | L34, L301 |
| `space.40` | 40px | Padding superior de juego; gap tablero-aside de Devdle | L451 |
| `space.48` | 48px | Gap del hero; padding inferior de Home y superior de Stats | L34, L36, L301 |
| `space.56` | 56px | Padding inferior de Stats y juegos | L301, L451 |
| `space.64` | 64px | Padding superior de Home | L34 |
| `space.72` | 72px | Gap entre secciones de Home | L34 |

## Página

| Token | Valor | Fuente |
|---|---|---|
| `layout.page.max-width` | 1240px (`margin: 0 auto`) | L34, L301, L451, L611, L866, L997, L1101 |
| `layout.page.gutter` | 32px, igual en todos los anchos (no hay media queries) | mismas |
| `layout.page.padding.home` | 64px arriba · 48px abajo | L34 |
| `layout.page.padding.stats` | 48px arriba · 56px abajo | L301 |
| `layout.page.padding.game` | 40px arriba · 56px abajo | L451, L611, L866, L997, L1101 |
| `layout.section.gap.home` | 72px | L34 |
| `layout.section.gap.stats` | 32px | L301 |
| `layout.section.gap.game` | 28px | L611, L866, L997, L1101 |
| Ancho de contenido máximo | 1240 − 2×32 = **1176px** | derivado |

Otros anchos máximos: lede 540px (L40), teclado 620px (L469), aside de Devdle 380px (L480). Tokens en `@nerdose/ui`: `--container-lede`, `--container-keyboard` (620px) y `--container-devdle-aside` (380px).

## Componentes (paddings y gaps recurrentes)

| Elemento | Padding | Gap interno | Fuente |
|---|---|---|---|
| Header global | 18px 32px | 16px; acciones 10px; nav 4px | L18-30 |
| Header de juego | 14px 32px | 16px; breadcrumb 18px; acciones 8px | L435-442 |
| Ítem de nav | 12px 14px | — | L21 |
| Footer | 24px 32px | 12px | L256 |
| Tarjeta de juego (cuerpo) | 20px | 12px; metadatos 14px con `padding-top` 8px | L91, L97 |
| Tarjeta placeholder | 28px (min-height 300px) | 12px | L192 |
| Panel grande de Home | 28px | 22px / 16px | L201, L231 |
| Panel / tarjeta lateral | 20px | 12-14px | L481, L677 |
| Panel de explicación | 24px | 18-20px | L709, L905 |
| Panel "contexto" ámbar | 18px 20px | 8px | L646 |
| Tarjeta "Cómo funciona" | 22px | 8px | L248 |
| Tarjeta de racha (Stats) | 26px | 10px | L308 |
| Stat-card (Stats) | 20px | 6px | L314 |
| Banner de resultado | 18px 22px | 16px; ícono-texto 14px; textos 2px | L614-619 |
| Caja interna | 14px 16px (o 16px) | 6-8px | L712, L742, L914 |
| Mini-stat / métrica / contador | 14px 16px / 12px / 12px 18px | 4px / 2px / 2px | L225, L344, L1109 |
| Fila (test, palabra de Grep) | 10px 12px | 10px / 4px | L683, L1216 |
| Fila de Timeline | 0 14px (min-height 52px) | 12px | L1064 |
| Celda de tabla | 14px 20px | — | L363, L374 |
| Terminal | barra 12px 16px · cuerpo 22px 22px 24px | barra 8px · filas 14px | L48, L54, L56 |
| Bloque de código | tab-bar 8px · cuerpo 14px 0 (Bug Hunt) / 18px 0 (Big O) · línea 0 18px | pestañas 4px | L652, L660, L891, L807 |
| Botón grande / mediano / Compartir | 0 22px / 0 16px / 0 14px | 10px / 8px / 8px | L42, L622, L445 |
| Píldora de racha | 10px 14px | 8px | L26 |
| Badge / chip | 4px 10px / 6px 10px (6px 12px) | — | L94, L491, L195 |

## Medidas de control (alto / área táctil)

| Token | Valor | Uso | Fuente |
|---|---|---|---|
| `size.control.lg` | 48px (min-height) | Botón grande, Confirmar | L42, L836 |
| `size.control.md` | 44px | Botón mediano, CTA de tarjeta, botón-ícono 44×44, Compartir | L100, L443, L445 |
| `size.control.sm` | 40px | Pestaña de lenguaje, línea de código, "reiniciar demo" | L745, L807, L817 |
| `size.segment` | 36px alto × 40px mínimo de ancho | Botón ES/EN (contenedor total 44px) | L30 |
| `size.option` | 56px | Opción de Big O | L970 |
| `size.key` | 54px | Tecla de Devdle | L558 |
| `size.row.timeline` | 52px | Fila de "tu orden" | L1064 |

## Tokens

### Semánticos (selección; completos en `tokens/semantic.md`)

| Token | Valor | Uso |
|---|---|---|
| `inset.card` | `space.20` | Tarjeta y panel |
| `inset.panel.lg` | `space.28` | Panel grande de Home, placeholder |
| `inset.panel.explain` | `space.24` | Panel de explicación |
| `inset.banner` | `space.18` `space.22` | Banner |
| `inset.box` | `space.14` `space.16` | Caja interna |
| `inset.row` | `space.10` `space.12` | Fila de lista |
| `gap.grid` | `space.20` | Grilla de tarjetas de juego |
| `gap.columns.game` | `space.24` | Columnas de pantalla de juego |
| `gap.stack.panel` | `space.12` | Hijos de un panel |

### De componente

`button.lg.padding-x → space.22`, `card.game.padding → inset.card`, `banner.padding → inset.banner`, etc. (`tokens/component.md`).

## Guidelines

**Do:**
- Usar los valores de la tabla; si un caso nuevo se parece a uno existente, reutilizar su token.
- Mantener el margen lateral de 32px y el ancho máximo de 1240px en todas las pantallas.
- Usar `min-width: 0` en hijos de flex para que el contenido pueda encoger.

**Don't:**
- No redondear a múltiplos de 4 los valores impares del prototipo (14, 18, 22, 26).
- No usar márgenes negativos salvo el de la línea resaltada de la miniatura de Bug Hunt (L108), que compensa su propio padding.

## Accesibilidad

- **Área táctil mínima 44×44px (requisito):** todos los controles principales del prototipo la cumplen (44, 48, 54, 56). Excepciones del prototipo: pestaña de lenguaje, línea de código y "reiniciar demo" a 40px de alto; el link-flecha llega a 44px por su padding vertical de 12px (L207) pero "ver historial completo →" queda en ~32px (padding 8px, L350). **Adaptación requerida:** esos controles necesitan un área táctil de 44px; la forma de lograrlo sin cambiar el aspecto (área ampliada vs. alto) queda **Pendiente**.
- **Separación entre objetivos táctiles:** las teclas de Devdle están a 6px y las celdas de Grep a 4px, ambas ≥ 44px o en conjunto continuo; aceptable.
- **Reflow a 320px (NFR-U01):** con gutter de 32px el contenido útil a 320px es de 256px; ver `foundations/grid.md` para las piezas que desbordan.

## Ejemplos

- `components/card.md`, `components/panel.md`, `components/banner.md`, `components/button.md`.

## Padding de página de pantallas de plataforma sin prototipo (S-012)

"Acerca de", la 404 y el error de ruta usan `layout.page.padding` de la otra pantalla de plataforma (stats, L301): 48 arriba / 56 abajo. La home mantiene 64 / 48 (L34).

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-05 v1.0.0 — Escala real del prototipo (2-72px), medidas de página (1240px, gutter 32px, paddings por tipo de pantalla), paddings y gaps por componente y medidas de control. Los primitivos pasan a nombrarse por su valor en px (`space.4` era 16px y ahora es 4px). Se eliminan `space.xs`…`space.4xl` y los semánticos `space.inline.*`, `space.stack.*`, `space.padding.*`.
- 2026-11-06 v1.1.0 — S-012: padding de página 48/56 para pantallas sin prototipo.
- 2026-11-09 v1.1.1 — S-021: tokens `--container-keyboard` (620px) y `--container-devdle-aside` (380px) en `@nerdose/ui`.
