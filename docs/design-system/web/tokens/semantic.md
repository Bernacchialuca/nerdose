---
tokens: semantic
version: 1.2.0
last_updated: 2026-11-06
status: defined
source: docs/nerdose.html
---

# Tokens — Semantic (rol)

## Propósito

Tier 2: cada semántico nombra un **rol** (`text.muted`, `streak.bg`) y apunta a un primitivo de `tokens/reference.md`. Los componentes consumen estos tokens, nunca primitivos ni hex.

## Color

### Fondos

| Token | Valor | Uso |
|---|---|---|
| `bg.canvas` | `color.neutral.950` | Fondo de página |
| `bg.canvas.dot` | `color.neutral.770` | Color de los puntos de `texture.dots` (solo Home) |
| `bg.header` | `color.neutral.950-a92` | Header global de Home sobre la textura |
| `bg.surface` | `color.neutral.900` | Tarjetas y paneles |
| `bg.surface.sunken` | `color.neutral.925` | Bloque de código, tablero de Grep, diff |
| `bg.surface.inset` | `color.neutral.800` | Cajas internas sin borde (mini-stat, métrica, fila, celda de Grep, preview de compartir) |
| `bg.control` | `color.neutral.850` | Botón-ícono, selector de idioma, Compartir deshabilitado |
| `bg.control.selected` | `color.neutral.650` | Segmento activo del selector, tecla sin usar, barra de distribución |
| `bg.nav.active` | `color.neutral.790` | Ítem de nav activo |
| `bg.toolbar` | `color.neutral.840` | Barra de pestañas del bloque de código |
| `bg.titlebar` | `color.neutral.830` | Barra de título de la ventana terminal |
| `bg.track` | `color.neutral.775` | Track de barras de progreso |
| `bg.window-dot` | `color.neutral.600` | "Semáforos" de la ventana terminal |
| `bg.discarded` | `color.neutral.835` | Tecla descartada |

### Texto

| Token | Valor | Uso |
|---|---|---|
| `text.primary` | `color.neutral.100` | Texto principal, títulos, valores |
| `text.body` | `color.neutral.200` | Prosa secundaria clara: explicaciones, leyendas, ícono de botón-ícono |
| `text.lede` | `color.neutral.250` | Lede, descripciones de tarjeta, unidades de número display |
| `text.muted` | `color.neutral.300` | Notas, etiquetas de stat, nav inactivo, pestaña inactiva |
| `text.dim` | `color.neutral.400` | Etiqueta-comentario `//`, metadatos, prompt `$` |
| `text.disabled` | `color.neutral.500` | Control deshabilitado neutro |
| `text.discarded` | `color.neutral.510` | Tecla descartada *(requiere adaptación de contraste)* |
| `text.line-number` | `color.neutral.550` | Número de línea de código *(requiere adaptación de contraste)* |
| `text.separator` | `color.neutral.650` | `/` decorativo del breadcrumb |

### Bordes

| Token | Valor | Uso |
|---|---|---|
| `border.default` | `color.neutral.700` | Tarjetas y paneles |
| `border.subtle` | `color.neutral.750` | Separadores, tarjeta "Cómo funciona", opción no elegida |
| `border.control` | `color.neutral.650` | Botones outline, chips, selector, controles, punteado neutro |
| `border.row` | `color.neutral.790` | Separador de filas de tabla |
| `border.emphasis` | `color.neutral.525` | Celda "escrita" de Devdle |
| `border.interactive` | `color.neutral.400` | Reservado: borde que es la única señal de un control (WCAG 1.4.11) |

### Marca

| Token | Valor | Uso |
|---|---|---|
| `accent.brand` | `color.green.500` | Acento de la plataforma, CTA primario, `>` del logo |
| `accent.brand.on` | `color.green.975` | Texto sobre `accent.brand` |
| `accent.brand.hover` | `color.green.300` | Hover de links fuera de un juego |

### Acento por juego

Patrón por juego: `accent`, `on`, `hover`, `tint`, `tint-border`, `muted`, más tonos propios.

| Token | Devdle | Bug Hunt | Big O | Timeline | Grep Grid |
|---|---|---|---|---|---|
| `game.{j}.accent` | `green.500` | `amber.500` | `blue.500` | `purple.500` | `pink.500` |
| `game.{j}.on` | `green.975` | `amber.960` | `blue.975` | `purple.975` | `pink.970` |
| `game.{j}.hover` | `green.300` | `amber.300` | `blue.200` | `purple.300` | `pink.300` |
| `game.{j}.tint` | `green.960` | `amber.950` | `blue.960` | `purple.970` | `pink.975` |
| `game.{j}.tint-border` | `green.890` | `amber.880` | `blue.890` | `purple.900` | `pink.900` |
| `game.{j}.muted` | `green.850` | `amber.700` | `blue.dim.400` | `purple.550` | `pink.dim.600` |

Tonos propios:

| Token | Valor | Uso |
|---|---|---|
| `game.bug-hunt.tint-strong` | `color.amber.900` | Pestaña activa, número de paso, línea resaltada de la miniatura |
| `game.bug-hunt.tint-hover` | `color.amber.970` | Hover de línea elegible |
| `game.bug-hunt.muted-bar` | `color.amber.850` | Barras de la miniatura |
| `game.bug-hunt.chip-border` | `color.amber.800` | Chip ámbar |
| `game.bug-hunt.disabled.bg` | `color.amber.dim.900` | Confirmar deshabilitado |
| `game.bug-hunt.disabled.text` | `color.amber.dim.600` | Confirmar deshabilitado |
| `game.big-o.light` | `color.blue.300` | Anotaciones de código, texto del número de paso |
| `game.big-o.tint-strong` | `color.blue.920` | Fondo del número de paso |
| `game.big-o.line-highlight` | `color.blue.950` | Fondo de línea resaltada |
| `game.big-o.tab-selected` | `color.blue.900` | Fondo de pestaña activa |
| `game.big-o.chip-border` | `color.blue.850` | Chip O(…) de la miniatura |
| `game.big-o.featured-border` | `color.blue.800` | Borde de tarjeta destacada |
| `game.big-o.ring` | `color.blue.500-a20` | Anillo de tarjeta destacada |
| `game.big-o.glow` | `color.blue.glow-a25` | Glow de tarjeta destacada |
| `game.timeline.rail` | `color.purple.850` | Riel de la línea de tiempo, borde del botón de salida |
| `game.grep-grid.selected-bg` | `color.pink.950` | Celda de inicio seleccionada |
| `game.grep-grid.found-bg` | `color.pink.960` | Fila de palabra encontrada |
| `game.grep-grid.found-border` | `color.pink.850` | Fila de palabra encontrada |

### Estados

| Token | Valor | Uso |
|---|---|---|
| `status.success` | `color.green.500` | Acierto: ícono, barra, ✓ |
| `status.success.on` | `color.green.975` | Ícono/texto sobre `status.success` |
| `status.success.bg` | `color.green.960` | Banner de éxito, línea acertada, diff `+` |
| `status.success.border` | `color.green.800` | Borde de banner de éxito y fila correcta |
| `status.success.text-soft` | `color.green.dim.300` | Subtítulo de banner de éxito |
| `status.success.row-bg` | `color.green.955` | Fila correcta de Timeline |
| `status.success.badge.bg` | `color.green.900` | Badge "✓ resuelto", "✓ bien" |
| `status.success.badge.text` | `color.green.300` | Texto del badge de éxito |
| `status.success.diff-text` | `color.green.200` | Línea `+` del diff |
| `status.error` | `color.red.500` | Error: ícono, barra, ✗ |
| `status.error.on` | `color.red.975` | Ícono sobre `status.error` |
| `status.error.bg` | `color.red.960` | Banner de fallo, caja de test fallido, diff `−`, línea errónea |
| `status.error.border` | `color.red.850` | Borde de las superficies de error; punteado de test oculto |
| `status.error.text-soft` | `color.red.dim.300` | Subtítulo de fallo, texto de test oculto |
| `status.error.diff-text` | `color.red.300` | Línea `−` del diff |
| `status.pending` | `color.amber.500` | Texto "pendiente" |
| `status.pending.badge.bg` | `color.amber.900` | Badge "pendiente", "✗ va en N°" |
| `status.present` | `color.amber.500` | Presente (Devdle): borde punteado 2px y letra |
| `status.absent.bg` | `color.neutral.775` | No está (Devdle): fondo y borde |
| `status.absent.text` | `color.neutral.400` | No está (Devdle): letra |
| `status.misplaced.bg` | `color.amber.955` | Fila mal ubicada (Timeline) |
| `status.misplaced.border` | `color.amber.800` | Borde punteado de fila mal ubicada |
| `status.warning` | `color.amber.500` | Advertencia *(adaptación de producto, O-03)* |
| `status.warning.on` | `color.amber.960` | Sobre `status.warning` |
| `status.warning.bg` | `color.amber.975` | Fondo del banner de advertencia (tinte del panel "contexto", L646) |
| `status.warning.border` | `color.amber.860` | Borde del banner de advertencia |
| `status.warning.text-soft` | `color.amber.dim.400` | Detalle del banner de advertencia |

### Racha

| Token | Valor | Uso |
|---|---|---|
| `streak.text` | `color.amber.500` | Texto, ícono y número de racha (siempre ámbar) |
| `streak.bg` | `color.amber.950` | Fondo de la píldora |
| `streak.border` | `color.amber.860` | Borde de píldora y tarjeta de racha |
| `streak.surface` | `color.amber.975` | Fondo de la tarjeta de racha y del panel "contexto" |
| `streak.label` | `color.amber.dim.400` | Etiqueta `//` ámbar y unidad "días" |
| `streak.note` | `color.amber.dim.300` | Nota de la tarjeta de racha |

### Datos

| Token | Valor |
|---|---|
| `data.heatmap.0` | `color.neutral.775` |
| `data.heatmap.1` | `color.green.700` |
| `data.heatmap.2` | `color.green.600` |
| `data.heatmap.3` | `color.green.550` |
| `data.heatmap.4` | `color.green.500` |

### Foco

| Token | Valor | Uso |
|---|---|---|
| `focus.ring.color` | `game.{j}.accent` dentro de un juego; `accent.brand` fuera | Precedente único del prototipo: `outline: 2px solid #FFB547; outline-offset: -2px` en la línea elegible de Bug Hunt (L756). El estilo global de foco es **requisito** (visible, ≥ 3:1); su estética fuera de ese precedente está **Pendiente**. |
| `focus.ring.width` | `border.width.2` | Ídem |

## Tipografía

Cada rol combina familia / tamaño / peso / interlineado / tracking (detalle y fuente en `foundations/typography.md`).

| Token | Familia | Size / weight / lh / tracking |
|---|---|---|
| `type.display.streak` | mono | 96 / 800 / 0.9 / -4 |
| `type.display.streak.compact` | mono | 88 / 800 / 0.9 / -4 |
| `type.display.hero` | mono | 64 / 800 / 1.02 / -2.5 |
| `type.display.score` | mono | 56 / 800 / 1 / -2 |
| `type.title.page` | mono | 40 / 700 / normal / -1.5 |
| `type.title.game` | mono | 34 / 700 / normal / -1 |
| `type.title.game.long` | mono | 30 / 700 / normal / -1 |
| `type.title.section.lg` | mono | 32 / 700 / normal / -1 |
| `type.title.section` | mono | 26 / 700 / normal / -0.5 |
| `type.title.section.compact` | mono | 24 / 700 / normal / -0.5 |
| `type.title.panel.lg` | mono | 22 / 700 / normal / 0 |
| `type.title.panel` | mono | 20 / 700 / normal / 0 |
| `type.title.card` | mono | 20 / 700 / normal / 0 |
| `type.title.card.compact` | mono | 18 / 700 / normal / 0 |
| `type.title.banner` | mono | 18 / 700 / normal / 0 |
| `type.brand.logo` | mono | 20 / 800 / normal / -0.5 |
| `type.brand.logo.compact` | mono | 18 / 800 / normal / 0 |
| `type.brand.crumb` | mono | 18 / 700 / normal / 0 |
| `type.numeric.xl` | mono | 30 / 800 |
| `type.numeric.lg` | mono | 26 / 800 |
| `type.numeric.md` | mono | 22 / 700 |
| `type.numeric.sm` | mono | 20 / 700 |
| `type.numeric.year` | mono | 18 / 800 |
| `type.game.tile.lg` | mono | 28 / 800 |
| `type.game.tile.md` | mono | 18 / 700 |
| `type.game.tile.sm` | mono | 16 / 800 |
| `type.game.option` | mono | 16 / 400 (800 elegida) |
| `type.game.item` | mono | 16 / 700 |
| `type.game.key` | mono | 15 / 700 |
| `type.game.key.small` | mono | 12 / 700 |
| `type.game.word` | mono | 15 / 700 |
| `type.body.lede` | sans | 19 / 400 / 1.55 |
| `type.body.lede.game` | sans | 16 / 400 / 1.5 |
| `type.body.statement` | sans | 16 / 400 / 1.55 |
| `type.body` | sans | 15 / 400 / 1.5 |
| `type.body.explain` | sans | 15 / 400 / 1.55 |
| `type.body.sm` | sans | 14 / 400 / 1.5 |
| `type.body.sm.legend` | sans | 14 / 400 / 1.4 |
| `type.body.sm.tight` | sans | 14 / 400 / normal |
| `type.caption` | sans | 13 / 400 / 1.5 |
| `type.caption.tight` | sans | 13 / 400 / normal |
| `type.caption.definition` | sans | 13 / 400 / 1.45 |
| `type.caption.xs` | sans | 12 / 400 / normal |
| `type.button.lg` | mono | 15 / 700 (relleno) · 15 / 500 (outline) |
| `type.button.md` | mono | 14 / 700 (relleno) · 14 / 500 (outline) |
| `type.mono.body` | mono | 14 / 400 / normal |
| `type.mono.strong` | mono | 14 / 700 / normal |
| `type.mono.unit` | mono | 16 / 400 / normal |
| `type.mono.unit.compact` | mono | 15 / 400 / normal |
| `type.code` | mono | 15 / 400 / 2 (`tab-size: 4`) |
| `type.code.terminal` | mono | 14 / 400 / 2 |
| `type.code.share` | mono | 14 / 400 / 1.7 |
| `type.label.comment` | mono | 13 / 400 / normal |
| `type.label.tab` | mono | 13 / 400 (700 activa) |
| `type.label.step` | mono | 13 / 700 |
| `type.meta` | mono | 12 / 400 |
| `type.meta.strong` | mono | 12 / 700 |
| `type.meta.th` | mono | 12 / 500 |
| `type.micro` | mono | 11 / 400 |
| `type.micro.xs` | mono | 10 / 400 |

Todo `type.*` mono aplica `font.ligatures.mono` (`none`).

## Espaciado y layout

| Token | Valor | Uso |
|---|---|---|
| `layout.page.max-width` | `size.1240` | Ancho máximo de `main` |
| `layout.page.gutter` | `space.32` | Margen lateral, todos los anchos |
| `layout.page.padding.home` | `space.64` arriba · `space.48` abajo | Home |
| `layout.page.padding.stats` | `space.48` · `space.56` | Stats |
| `layout.page.padding.game` | `space.40` · `space.56` | Pantallas de juego |
| `layout.section.gap.home` | `space.72` | Entre secciones de Home |
| `layout.section.gap.stats` | `space.32` | Entre secciones de Stats |
| `layout.section.gap.game` | `space.28` | Entre bloques de juego |
| `gap.grid` | `space.20` | Grilla de tarjetas de juego, filas de Home |
| `gap.grid.compact` | `space.16` | Grillas de "Cómo funciona" y Stats por juego |
| `gap.grid.stats` | `space.12` | Mini-stats, stat-cards |
| `gap.columns.game` | `space.24` | Columnas de Bug Hunt, Big O, Timeline |
| `gap.stack.panel` | `space.12` | Hijos de panel / tarjeta |
| `gap.stack.aside` | `space.16` | Paneles apilados en un aside |
| `gap.inline.control` | `space.8` | Ícono-texto en botón mediano, píldora, acciones de header de juego |
| `gap.inline.meta` | `space.14` | Metadatos de tarjeta |
| `inset.card` | `space.20` | Tarjeta de juego, panel, stat-card |
| `inset.panel.lg` | `space.28` | Panel grande de Home, tarjeta placeholder |
| `inset.panel.explain` | `space.24` | Panel de explicación |
| `inset.panel.context` | `space.18` `space.20` | Panel "contexto" ámbar |
| `inset.step` | `space.22` | Tarjeta "Cómo funciona" |
| `inset.streak` | `space.26` | Tarjeta de racha |
| `inset.banner` | `space.18` `space.22` | Banner |
| `inset.box` | `space.14` `space.16` | Caja interna, mini-stat |
| `inset.row` | `space.10` `space.12` | Fila de lista |
| `inset.header.global` | `space.18` `space.32` | Header global |
| `inset.header.game` | `space.14` `space.32` | Header de juego |
| `inset.footer` | `space.24` `space.32` | Footer |

## Tamaños de control

| Token | Valor |
|---|---|
| `size.control.lg` | `size.48` |
| `size.control.md` | `size.44` |
| `size.control.sm` | `size.40` |
| `size.touch.min` | `size.44` (requisito de accesibilidad) |
| `icon.size.sm` / `md` / `lg` | `size.16` / `size.18` / `size.20` |
| `icon.stroke.default` / `bold` | 2 / 3 |

## Radios

| Token | Valor | Uso |
|---|---|---|
| `radius.micro` | `radius.3` | Heatmap de Stats, leyenda |
| `radius.cell.xs` | `radius.4` | Heatmap de Home, barra de distribución |
| `radius.cell.sm` | `radius.5` | Celda de miniatura |
| `radius.cell.md` | `radius.6` | Muestra de leyenda |
| `radius.segment` | `radius.7` | Segmento ES/EN |
| `radius.tile` | `radius.8` | Nav, pestaña, celda y tecla de juego, número de paso |
| `radius.control` | `radius.10` | Botones, filas, opción, métrica |
| `radius.inset` | `radius.12` | Cajas internas, mini-stat, contador |
| `radius.panel` | `radius.14` | Paneles, banners, código, terminal |
| `radius.feature` | `radius.16` | Tarjeta de juego, paneles grandes de Home, tarjeta de racha |
| `radius.pill` | `radius.full` | Píldoras, badges, chips, barras |

## Elevación, motion y textura

| Token | Valor |
|---|---|
| `elevation.flat` | sin sombra |
| `elevation.window` | `shadow.drop.window` |
| `elevation.featured.big-o` | `shadow.ring.1` (`game.big-o.ring`) + `shadow.glow.featured` (`game.big-o.glow`) |
| `elevation.featured.{devdle,bug-hunt,timeline,grep-grid}` | *Derivados (S-011):* anillo de 1px del acento al 20% + glow del acento oscurecido al 25% (ver `foundations/elevation.md`) |
| `game.{devdle,bug-hunt,timeline,grep-grid}.featured-border` | *Derivados (S-011):* `#1E4A30`, `#5C4419`, `#3C2E60`, `#5B2147` |
| `border.control.hover` | *Derivado (S-011):* `color.neutral.600` (`#3A424C`); hover del botón `secondary` |
| `streak.hover` | *Derivado (S-011):* `#FFD08A` (`amber.300`); hover de la píldora de racha |
| `streak.border.hover` | *Derivado (S-011):* `#5C4419` (`amber.800`) |
| `bar.{color}` | `shadow.inset.bar` con un color de estado o de juego |
| `motion.cursor` | `motion.keyframes.blink` · `motion.duration.blink` · `motion.timing.steps1` · infinito (ver adaptación WCAG 2.2.2 en `foundations/motion.md`) |
| `motion.anchor-scroll` | `motion.scroll.smooth` (instantáneo con `prefers-reduced-motion`) |
| `texture.dots` | `radial-gradient(bg.canvas.dot 1px, transparent 1px)` / 24px |

## Reglas

- **Componentes consumen semánticos, nunca primitivos.**
- **Cambiar el mapeo de un semántico** = MAJOR. **Agregar uno** = MINOR.
- Un token marcado **Pendiente** no se implementa hasta que el DS lo defina.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-03 v0.1.1 — Alias de color remapeados a la paleta oscura.
- 2026-11-05 v0.2.0 — Se agregan `text.warning` y `border.warning`; uso de `text.error` y `border.error` en Alert.
- 2026-11-05 v1.0.0 — Reescritos desde el prototipo: fondos y textos nuevos (`bg.surface.sunken`, `bg.surface.inset`, `text.body`, `text.lede`…), acento por juego con su escala, estados (`status.*`), racha (`streak.*`), heatmap, foco, roles tipográficos `type.*`, layout, inset y radios semánticos. Eliminados: `bg.surface.raised` (→ `bg.control`), `bg.action.primary[.hover]` (→ `accent.brand[.hover]`), `bg.success`/`bg.error` (→ `status.*`), `text.secondary` (→ `text.muted`), `text.inverse` (→ `accent.brand.on` / `game.{j}.on`), `text.action.primary` (→ `accent.brand`), `text.error`/`text.warning`/`border.error`/`border.warning` (→ `status.*`), `border.strong` (→ `border.control`), `border.focus` (→ `focus.ring.color`), `text.heading.*`/`text.body`/`text.caption` tipográficos (→ `type.*`), `space.inline.*`/`space.stack.*`/`space.padding.*` (→ `gap.*`/`inset.*`).
- 2026-11-06 v1.2.0 — Semánticos derivados: `border.control.hover`, `streak.hover`, `streak.border.hover`, `game.{j}.featured-border` y `elevation.featured.*` de cuatro juegos.
