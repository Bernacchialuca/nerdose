# Design System — Changelog

Sigue el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y el versionado [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2026-11-05

**MAJOR.** El DS de `web` se redefine desde el prototipo `docs/nerdose.html`, que pasa a ser la **fuente de verdad visual** del surface (PRD NFR-U07). Cambian valores de tokens existentes (radio de Button, padding de Card, nombres de espaciado y radios), se remapean los tokens de componente y se reemplazan todas las foundations. Ante una duda de estética gana el prototipo; en datos, reglas y accesibilidad gana el PRD.

### Agregado
- `foundations/borders.md` (nueva): grosores, colores de borde, punteado con significado ("aún no / provisional"; "presente" de Devdle = `2px dashed #FFB547`), separadores, escala de radios 3·4·5·6·7·8·10·12·14·16·full y textura de puntos de 24px (solo Home).
- `foundations/color.md`: 14 neutros nuevos (`#0D1116`, `#11161C`, `#12161B`, `#12171D`, `#161B22`, `#1A2028`, `#1A2029`, `#3A424C`, `#4F5A66`, `#5A6573`, `#5F6B78`, `#6B7682`, `#A9B4BF`, `#C3CCD5`), escala de tintes por juego (tinte, borde, apagado, acento, claro, on-accent) y por estado (acierto, error, presente, no está, pendiente, mal ubicado, advertencia), racha ámbar, rampa del heatmap, contrastes medidos de todos los pares de texto.
- `foundations/typography.md`: Inter para prosa y JetBrains Mono para todo lo demás, con la regla de uso; ~50 roles `type.*` con tamaño, peso, interlineado y tracking reales; ligaduras desactivadas en Mono.
- `foundations/spacing.md`, `grid.md`, `elevation.md`, `iconography.md`, `motion.md`, `voice-tone.md`: valores reales del prototipo (ver "Cambiado").
- `tokens/reference.md`: inventario completo de primitivos (color por matiz con tonos `dim` y alfas, 22 tamaños de fuente, pesos 400/500/700/800, interlineados, tracking, espaciado 2-72px, tamaños, radios, sombras, motion, textura).
- `tokens/semantic.md`: `bg.surface.sunken`, `bg.surface.inset`, `bg.control[.selected]`, `bg.nav.active`, `bg.toolbar`, `bg.titlebar`, `bg.track`, `text.body`, `text.lede`, `text.disabled`, `border.subtle`, `border.control`, `border.row`, `border.emphasis`, `accent.brand.*`, `game.{juego}.*`, `status.*`, `streak.*`, `data.heatmap.*`, `focus.ring.*`, roles `type.*`, `layout.*`, `gap.*`, `inset.*`, radios semánticos, `elevation.*`, `motion.*`, `texture.dots`.
- Componentes nuevos: `link`, `panel` (etiqueta `//`), `app-header`, `game-header` (breadcrumb en el color del juego), `site-footer`, `language-selector`, `streak-pill` (y racha inline), `chip` (chip + badge), `streak-number` (número display y puntaje), `heatmap`, `progress-bar`, `terminal-window`, `code-block` (pestañas, números de línea, línea resaltada, diff), `data-table`.
- `patterns/game-boards.md`: piezas de un solo juego (celda, leyenda, tecla y distribución de Devdle; línea elegible, confirmar, tests y pasos de Bug Hunt; opción de Big O; fila y riel de Timeline; tablero, celda, hint y palabra de Grep Grid) y miniaturas de tarjeta.
- Adaptaciones de accesibilidad documentadas (el PRD manda sobre el prototipo): números de línea `#4F5A66` (2,7:1) y tecla descartada `#5F6B78` (3,3:1) a ≥ 4,5:1; estado activo del selector de idioma (1,4:1); parpadeo del cursor (WCAG 2.2.2); áreas táctiles de 40px; 320px sin scroll horizontal (grilla `minmax(300px)`, tablero de Devdle de 424px, tablero de Grep de 654px, opciones de Big O en 4 columnas, título de 40px); NFR-U04 en celdas de Devdle y opción de Big O; teclado en Timeline y Grep.

### Cambiado
- `components/button.md`: **radio 10px** (antes sin radio). Tamaños `lg` 48px (padding 22, Mono 15) y `md` 44px (padding 16, Mono 14); variants `primary`, `secondary` (texto `#E6EDF3`, borde `#2A323C`, peso 500), `accent` (acento del juego con su on-accent), `outline-tinted`, `ghost` (punteado) e `icon` (44×44); Compartir activo/deshabilitado.
- `components/card.md`: tarjeta de juego con **padding 20** (antes 16), miniatura de 150px, badge, metadatos con racha ámbar y CTA de ancho completo; variants `next` (anillo + glow, solo Big O definido), `placeholder`, `step`, `mini-stat`, `stat`, `metric`, `counter`, `game-stats`.
- `components/alert.md`: se declara **adaptación de producto** y toma la estética del banner de fallo (tinte `#1C0F0E`, borde 1px `#4A2220`, radio 14, padding 18 22, ícono `x` en círculo).
- `components/banner.md`: pasa a ser el **banner de resultado** del prototipo (`success`, `failure`, `neutral`) más `warning` como adaptación de producto (tintes del panel ámbar "contexto"); borde de 1px y radio 14 en lugar de barra lateral.
- `foundations/spacing.md`: escala real 2-72px; los primitivos `space.N` pasan a nombrarse por su valor en px (**`space.4` era 16px y ahora es 4px**).
- `foundations/grid.md`: sin media queries ni grilla de 12 columnas; reglas flex-wrap / auto-fit del prototipo y breakpoints efectivos derivados; gutter de 32px en todos los anchos y `max-width` 1240px.
- `foundations/elevation.md`: las 5 sombras reales (`0 24px 60px rgba(0,0,0,.45)`, anillo + glow de la tarjeta destacada, barras `inset 3px 0 0`).
- `foundations/motion.md`: solo parpadeo 1.1s `steps(1)` y scroll suave; sin transiciones.
- `foundations/iconography.md`, `voice-tone.md`: contenido real del prototipo.
- `tokens/reference.md`: `color.green.950` (`#06120B`) pasa a `color.green.975`; `radius.none/sm/md/lg/xl` pasan a `radius.{3…16}` + `full`.
- `tokens/component.md`: remapeo completo; `button.radius` = `radius.control` (10px), `card.game.padding` = `inset.card` (20px).
- `governance.md` y `README.md`: `docs/nerdose.html` es la fuente de verdad visual; precedencia prototipo (estética) / PRD (datos, reglas, accesibilidad); estado "definido desde el prototipo".

### Eliminado
- `button` variant `disabled` (pasa a ser un estado) y tokens reservados `button.destructive.*`, `button.height.min`, `button.padding.x`, `button.gap`.
- `card.elevation`, `alert.border` y `banner.border` laterales de 4px, `banner.padding.y/x`.
- `input.*` (no hay inputs en el prototipo; quedan Pendiente).
- Semánticos: `bg.surface.raised` (→ `bg.control`), `bg.action.primary[.hover]` (→ `accent.brand[.hover]`), `bg.success` / `bg.error` (→ `status.*`), `text.secondary` (→ `text.muted`), `text.inverse` (→ `accent.brand.on` / `game.{juego}.on`), `text.action.primary` (→ `accent.brand`), `text.error` / `text.warning` / `border.error` / `border.warning` (→ `status.*`), `border.strong` (→ `border.control`), `border.focus` (→ `focus.ring.color`), `text.heading.*` / `text.body` / `text.caption` tipográficos (→ `type.*`), `space.inline.*` / `space.stack.*` / `space.padding.*` (→ `gap.*` / `inset.*`), `color.info`.
- Escalas placeholder: tipográfica (`display`, `h1`…`caption`), de espaciado (`space.xs`…`space.4xl`), breakpoints `bp.xs`…`bp.xl`, duraciones y easings de motion, niveles `elevation.0`…`N`.

### Decisiones donde el prototipo es ambiguo
- Outline mediano: el prototipo usa pesos 500, 700 y 400; el DS fija **500**.
- Etiqueta-comentario: Timeline la usa con peso 500; el DS fija **400** en todas.
- Deshabilitado de `primary`/`secondary`/`accent` fuera de Bug Hunt: se usa el neutro de Compartir (L445).
- Tarjeta destacada (`next`) y chip de acento: solo definidos para Big O y Bug Hunt respectivamente; el resto queda Pendiente.
- Pestaña activa del código: ámbar en Bug Hunt y blanca en Big O; se registran ambas.
- Título de panel: 20px (Bug Hunt) y 22px (Big O); se registran ambos (`type.title.panel`, `.lg`).
- Bordes de control `#2A323C` (1,5:1): se respeta el prototipo porque la etiqueta identifica al control (WCAG 1.4.11); `border.interactive` (`#8D99A6`) queda reservado para cuando el borde es la única señal. Revierte la decisión de v0.2.0 para el botón secundario.
- Banner `warning`: se alinea al contenedor de página (no de borde a borde) y no lleva ícono hasta que el DS lo defina.

### Desalineaciones conocidas en código

El código implementa el DS v0.2.0. Diferencias con v1.0.0 (las corrige una request posterior):

- **Fuentes** (`apps/web/src/index.css`, `apps/web/src/app/shell.tsx`): solo se carga JetBrains Mono 400/500/700; falta Inter y el peso 800. El shell aplica `font-mono` a toda la página, así que la prosa sale en Mono.
- **Tokens** (`packages/ui/src/tokens.css`): faltan los 14 neutros nuevos, los tintes y on-accent por juego (solo existe `--color-on-accent: #06120B`), los tintes de estado, la familia ámbar de racha, el heatmap, radios, roles tipográficos y sombras. `--color-border-interactive` (`#8D99A6`) se usa donde el prototipo usa `#2A323C`.
- **Fondo** (`shell.tsx`): liso, sin la textura de puntos de 24px en Home ni el header translúcido.
- **Tipografía**: tamaños genéricos de Tailwind (`text-2xl/3xl` en `h1` vs 64/800 del hero, `text-xl`, `text-base`, `text-sm`, `text-xs`), sin tracking negativo, sin los interlineados del DS y con ligaduras activas.
- **Button** (`apps/web/src/components/cta.ts`): sin radio (10px); 44px y padding 16 en todos los casos (el hero usa 48px / 22); tamaño de texto heredado (16px) en lugar de 15/14; `secondary` con texto verde y borde `#8D99A6` (prototipo: `#E6EDF3`, `#2A323C`, peso 500); deshabilitado sin fondo, borde `#222A33` y texto `#8D99A6` (prototipo: `#11151A` / `#2A323C` / `#6B7682`); "Jugar →" siempre verde (prototipo: acento del juego con su on-accent); el CTA de tarjeta no ocupa el ancho completo; "¿Cómo funciona?" del hero es un link subrayado (prototipo: botón `secondary` `lg`).
- **Card** (`packages/ui/src/components/card.tsx`, `apps/web/src/modules/catalog/components/game-card.tsx`): padding 16 (prototipo 20); sin miniatura de 150px; sin variant `next` (borde + anillo + glow); título como `h2` (prototipo `h3` bajo el `h2` de sección); descripción Mono 14 `#9AA6B2` (prototipo Inter 15/1.5 `#A9B4BF`); metadatos unidos por " · " en un párrafo y racha sin ámbar ni `▲` (prototipo: ítems con gap 14 y "▲ racha N" ámbar); estado como texto plano (prototipo: badge); sin tarjeta placeholder "próximo juego".
- **Catálogo** (`apps/web/src/modules/catalog/routes/home.tsx`): grilla `lg:grid-cols-3` con gap 16/24 (prototipo `auto-fit minmax(300px, 1fr)`, gap 20); "Tu progreso" es una Card más dentro de la grilla (prototipo: sección propia con panel `feature` radio 16 / padding 28, número de racha de 88px, heatmap, mini-stats y panel de rachas por juego); sin ventana terminal en el hero; sin sección "Cómo funciona".
- **Progreso del día** (`day-status.tsx`): barra continua de 8px sin radio sobre `surface-2` (prototipo: segmentada 36×6 redondeada, pendiente `#2A323C`); racha como texto (prototipo: número display ámbar).
- **Acerca de** (`apps/web/src/modules/about/routes/about.tsx`): secciones con borde y padding 16 **sin radio**; `h2` con `font-semibold` (600, peso que el DS no usa).
- **Alert** (`packages/ui/src/components/alert.tsx`): barra lateral de 4px, sin radio, sin ícono, padding 16, mensaje en rojo (DS: tinte `#1C0F0E`, borde 1px `#4A2220`, radio 14, padding 18 22, ícono `x`, título claro).
- **Banner** (`packages/ui/src/components/banner.tsx`): de borde a borde con barra lateral de 4px, padding 16/48 y detalle en 12px (DS: tinte ámbar `#140F07` / `#3A2A12`, radio 14, padding 18 22, alineado al contenedor).
- **App header** (`packages/ui/src/components/app-header.tsx`): padding 16 / 48 (prototipo 18 32), gap 24, sin `border-bottom #1E252E` ni fondo translúcido; muestra el número de desafío (`ChallengeNumber`) en lugar de la píldora de racha.
- **BrandMark** (`packages/ui/src/components/brand-mark.tsx`): todo el logo en verde (prototipo: solo `>` y `_` en verde, "nerdose" en `#E6EDF3`, Mono 800 20 con tracking -0.5), sin cursor parpadeante.
- **Nav** (`apps/web/src/components/main-nav.tsx`, `shell.tsx`): se saca del header por debajo de 1024px y va en una fila aparte (prototipo: siempre en el header, con wrap); ítems con padding 8 y sin radio; activo en verde (prototipo: padding 12 14, radio 8, activo `#161B22` + `#E6EDF3`).
- **Selector de idioma** (`language-selector.tsx`): dos botones sueltos de 44×44 con borde `#8D99A6` y activo en verde (prototipo: grupo de 44px con fondo `#11151A`, borde `#2A323C` y radio 10; segmentos 40×36 radio 7; activo `#2A323C` / `#E6EDF3`; Mono 700 12).
- **Footer** (`site-footer.tsx`): borde `#222A33`, padding 16/48, 12px y otro contenido (prototipo: borde `#1E252E`, padding 24 32, Mono 13 `#8D99A6`, lema + `exit 0`, `space-between`). El aviso de privacidad es contenido de producto y se mantiene.
- **Layout** (`shell.tsx`, `apps/web/src/lib/breakpoints.ts`): `main` con padding 16/48 y sin `max-width` 1240; grilla de 12 columnas y breakpoint global de 1024px (prototipo: sin media queries, gutter 32 y reglas flex-wrap / auto-fit).
- **Links** (`home.tsx`, `progress-summary.tsx`, `about.tsx`, `site-footer.tsx`): subrayados en verde (prototipo: sin subrayado, con `→`, color del acento de la pantalla y hover claro).
- **Foco**: `outline` 2px verde con offset +2 en todos los controles. El DS lo deja como requisito con estética Pendiente (único precedente del prototipo: 2px en el acento del juego con offset -2, L756); no es una desalineación hasta que se defina.

---

## [0.2.0] - 2026-11-05

### Agregado
- `components/button.md`: variants `primary`, `secondary` y `disabled` (con `aria-disabled`, sigue siendo focusable), alto mínimo de 44px y sin radio. Queda `experimental`: hover, active y loading están pendientes y la implementación son clases en `web` (`cta.ts`), no un componente de `@nerdose/ui`.
- `components/card.md`: contenedor `<article>` de `@nerdose/ui`, con radio de 16px, padding de 16px y sin sombra.
- `components/alert.md`: error con `role="alert"`, barra lateral en `color.error` y slot de acción.
- `components/banner.md`: advertencia persistente con `role="status"`, barra lateral en `color.warning`, título y detalle opcional (aviso de cookies bloqueadas, O-03).
- `tokens/reference.md`: `radius.xl` (16px).
- `tokens/semantic.md`: `text.warning` y `border.warning` (Banner O-03).
- `tokens/component.md`: `button.disabled.*`, `button.focus.outline`, `button.radius`, `button.height.min`, `button.padding.x`, `button.gap`, `alert.*` y `banner.*`.

### Cambiado
- `tokens/component.md`: Card alineada con la implementación: `card.radius` pasa de `radius.md` a `radius.xl`, `card.padding` de `space.padding.default` a `space.padding.spacious` y `card.elevation` de `elevation.1` a `elevation.0`. Se agrega `card.gap`.
- `tokens/component.md`: `button.secondary.border` pasa de `border.focus` a `border.interactive`, según la regla de contraste ≥3:1 de `foundations/color.md`.
- `foundations/color.md`: se documentan los consumidores de `color.warning` y `color.error` y su contraste sobre `bg.surface` (10,6:1 y 7,4:1).

### Código alineado con el spec
- `@nerdose/ui/tokens.css` suma `--color-border-interactive: #8D99A6` (`border.interactive`).
- El CTA `secondary` usa `border-border-interactive` en lugar de `border-border-strong` (1,5:1 → 6,8:1 sobre el fondo de página).
- `cta.ts` pasa a `apps/web/src/components/` y lo importan también `not-found.tsx` y `route-error.tsx`, en lugar de repetir las clases.

---

## [0.1.1] - 2026-11-03

### Cambiado
- `foundations/color.md`, `tokens/reference.md`, `tokens/semantic.md` y `tokens/component.md`: la paleta clara de relleno (por ejemplo `#ffffff`) se reemplaza por la paleta oscura del prototipo `docs/nerdose.html` (fondo `#0A0C0F`, texto `#E6EDF3`, acento `#3DDC84`), alineada con `@nerdose/ui/tokens.css`.
- Se mantienen los acentos por juego.
- Se agrega el semántico `border.interactive` para bordes de controles con contraste ≥3:1.

## [0.1.0] - 2026-11-03

### Agregado
- Estructura inicial del Design System (bootstrap automático).
- Archivos placeholder en foundations/, tokens/, guidelines/.
- Carpetas vacías components/ y patterns/.

> **Nota:** esta versión `0.1.0` es solo la estructura inicial. El primer DS
> "real" se versiona como `0.2.0` o superior cuando el equipo de diseño
> reemplace los placeholders con valores definitivos.

---

## Cómo registrar cambios

Cada vez que se ejecuta `/product-design-system-update`, el agente:

1. Aplica el cambio pedido.
2. Bumpea versión semver según naturaleza:
   - **MAJOR**: breaking (remover variant, renombrar componente)
   - **MINOR**: agregar (componente, variant, foundation)
   - **PATCH**: corrección, ajuste de spec
3. Agrega entrada en este CHANGELOG con formato:

```
## [X.Y.Z] - YYYY-MM-DD

### Agregado / Cambiado / Eliminado / Corregido / Deprecado
- {descripción concisa del cambio}
```
