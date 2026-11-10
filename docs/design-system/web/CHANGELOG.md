# Design System — Changelog

Sigue el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y el versionado [Semantic Versioning](https://semver.org/lang/es/).

## [1.6.0] - 2026-11-10

**MINOR.** Grep Grid jugable (story S-024). Ningún valor definido cambia. Los otros planes de S-024 (`games`, `web`) suman sus ítems a esta misma entrada.

### Código alineado con el spec
- `@nerdose/ui`: tokens `game.grep-grid.selected-bg` (`--color-game-grep-grid-selected-bg`), `game.grep-grid.found-bg` (`--color-game-grep-grid-found-bg`) y `type.numeric.lg` (`--text-numeric-lg`, 26/800, en `TEXT_ROLES`). `found-border`, `hover` y `on` ya existían como `-featured`, `-light` y `-on`.

## [1.5.1] - 2026-11-09

**PATCH.** Corrección de alineación, sin valores nuevos.

### Cambiado
- `components/streak-number.md`: la fila alinea por `last baseline` (antes `baseline`). Con la unidad en dos líneas («día / seguido»), la base del número queda alineada con la segunda línea y no con la primera. Código: `StreakNumber` usa `items-baseline-last`.

## [1.5.0] - 2026-11-09

**MINOR.** `@nerdose/ui` suma las piezas transversales de las pantallas de Devdle (story S-021). Ningún valor definido cambia. Los otros planes de S-021 (`games`, `web`) suman sus ítems a esta misma entrada.

### Agregado
- `foundations/spacing.md` 1.1.1: tokens `--container-keyboard` (620px) y `--container-devdle-aside` (380px).
- `foundations/iconography.md` 1.0.1: `HelpIcon`, `ChartIcon` y `ShareIcon` en `@nerdose/ui`.
- `components/game-header.md` 1.1.0: API de slots, breadcrumb `<nav>` + `<ol>` con `aria-current`, metadato `#número` y Compartir como estado.
- `patterns/game-boards.md` 1.1.0: resueltos los «Pendiente» de Devdle (`devdle.cell`, `devdle.key`), aviso de jugada y cabecera `//` como `h2` (`games`).
- `components/banner.md` 1.4.0, `components/button.md` 1.3.0, `components/chip.md` 1.3.0: variants y tamaños implementados (ver cada Historial).

### Código alineado con el spec
- `@nerdose/ui`: tokens (roles `type.title.game`, `type.brand.*`, `type.game.*`, `type.body.sm*`, `type.code.share`; colores `status.present`, `status.absent.*`, `text.separator`; anchos), `GameHeader`, `HelpIcon`/`ChartIcon`/`ShareIcon`, `Banner` (`success`/`failure`/`neutral`, `titleAs`, `announce`, `action`), `buttonClass` (`icon`, `share`), `Badge` (`loose`) y `track()`/`injectAnalytics()` (ADR-014, `share:<game_id>`).
- `apps/web` (S-021): `GameHeader` en las 3 pantallas de Devdle (`playing`/`finished` según el estado del botón Compartir), `Banner` `neutral`/`warning` para los avisos informativos, Compartir `accent` `share` con el estado «✓ Copiado» y el loader `$ cargando …` (gap aceptado).
- `@nerdose/game-devdle/client`: `Instructions`, `Game`, `Result`, `share()` y las piezas `devdle.cell`, `devdle.key`, `devdle.legend`, `devdle.distribution` según `game-boards` 1.1.0.

### Notas para limpiar en otros docs
- El spec de `game-header` decía «desafío del dd/mm»; el producto usa `#número`.
- Desktop de `devdle-partida.md`: el teclado va en la columna 7/12, como en el prototipo.
- `devdle-resultado.md` pide «enlace a la fuente» del resumen, pero `DevdleResult` no trae URL; el client muestra «Fuente: Wikipedia (CC BY-SA)» sin enlace.
- `devdle-resultado.md` pide `btn-compartir` `primary` y `button.md` dice `accent` (`size: share`): el código sigue al DS.
- El resultado anulado fusiona veredicto y `alerta-anulado` en un solo banner `warning` con `h1` (el DS pide no más de un banner a la vez).
- El ejemplo de share de `docs/flows/preferencias-y-share.md` es anterior al formato de REQ-004 (`🟩 Devdle #N · k/6`).

---

## [1.4.1] - 2026-11-06

**PATCH.** Ajustes de la revisión visual de REQ-003 contra `docs/nerdose.html`.

### Cambiado
- `components/site-footer.md`: una sola línea (lema + `exit 0`), igual al prototipo. El aviso de privacidad sale del footer y queda solo en "Acerca de"; se quita el link "Acerca de →" (sigue en `./about` del header). PRD C-07 y NFR-PR04 actualizados.
- Home: el titular y la bajada pasan a los textos del prototipo («Una dosis diaria de **nerdeo**.» con «nerdeo» en `accent`).
- "Acerca de": la intro dice «Nerdose es una plataforma…» y no nombra la cantidad de juegos; la card «Los 5 juegos» pasa a «Los juegos», genérica y con link «Ver los juegos →»; la card de la racha suma «Ver tus estadísticas →», así las dos de la fila tienen texto + link y la misma altura sin huecos. El cuerpo de `panel` crece y esos links van al pie (`mt-auto`), alineados entre cards. La bajada de la home deja de decir «Cinco». Ningún texto enumera los juegos, así que escalan al sumar juegos.
- Miniatura de Grep Grid: la palabra encontrada es `MUTEX` completa; `E-R-G` queda como selección en curso bajo la `M`.

### Corregido
- Al cargar la página el `h1` recibía foco (y mostraba el contorno) por el doble efecto de `StrictMode`; ahora el foco solo se mueve al cambiar de ruta.

## [1.4.0] - 2026-11-06

**MINOR.** `apps/web` pasa la home a las piezas del DS (story S-013) y se documentan las piezas derivadas. Ningún valor definido cambia.

### Agregado
- `foundations/typography.md` 1.2.0: `type.display.hero` a 320px con corte de palabra y guion (`overflow-wrap: break-word`, `hyphens: auto`), sin reducir el tamaño; mismo criterio que `type.title.page`.
- `foundations/grid.md` 1.2.0: las plantillas `auto-fit` de la home se escriben como `minmax(min(N, 100%), 1fr)` también para "Cómo funciona" (`min(240px, 100%)`, gap 16) y las tarjetas (`min(300px, 100%)`, gap 20).
- `components/terminal-window.md`: la métrica de la fila `done` es el `history_label` sin el glifo inicial (`✓ 4/6` pasa a `4/6`) y el slug de cada fila es el `game_id`.
- `components/panel.md` y `components/streak-number.md`: composición de "Tu progreso" con un solo panel `feature` (cabecera con link a estadísticas, número de racha y mini-stat de récord) y resumen sin datos en `type.caption` (Inter).
- `components/card.md`: la tarjeta de juego usa `h3`, badge de estado, metadatos en lista y `▲` solo con racha mayor a 0; la `placeholder` es un `li` más de la grilla.
- Formato de la fecha del eyebrow: `martes 3 nov` / `Tuesday Nov 3`, en UTC, sin coma ni punto final.

### Código alineado con el spec
- `apps/web` (home): hero con eyebrow, titular `type.display.hero`, botones `lg` y `TerminalWindow` con el estado del día; "Los desafíos de hoy" con barra segmentada, grilla `auto-fit`, tarjetas con miniatura, badge, `next` y tarjeta placeholder; "Tu progreso" con panel `feature`; "Cómo funciona" con 4 pasos y ancla `#como`; sin prefijos `lg:` ni grilla de 12 columnas.

### Desalineaciones conocidas en código
- Solo queda **Foco** (ver la v1.3.0).
- Fuera de alcance hasta FG-3 / FG-10: heatmap, mini-stats de desafíos completados y % de victorias, panel de rachas por juego y O-02 desde la tarjeta anulada.

### Notas para limpiar en otros docs
- El wireframe `home.md` dibuja las tarjetas en otro orden (devdle, bug-hunt, big-o, timeline, grep-grid); el código y la story usan el orden de `GAME_IDS`.
- La redacción del CA-9 de S-013 dice "se reduce" para el titular; en realidad se adapta con corte de palabra, sin reducir el tamaño.

---

## [1.3.0] - 2026-11-06

**MINOR.** `apps/web` pasa el shell, "Acerca de" y la 404 a las piezas del DS (story S-012) y se documentan las piezas derivadas. Ningún valor definido cambia.

### Agregado
- `components/link.md`: variant `inline` para links dentro de prosa (subrayado 1px, offset 4px, `accent.brand`).
- `components/site-footer.md`: ubicación resuelta del lema, `exit 0`, aviso de privacidad y "Acerca de →".
- `components/app-header.md`: `#número` entre la píldora y el selector.
- `components/banner.md`: separación de 24px bajo el header para `warning`.
- `foundations/grid.md` 1.1.0: layouts de "Acerca de" (`flex-wrap`, `1 1 520px`, gap 20) y de pantallas de mensaje (`layout.lede` 540px).
- `foundations/spacing.md` 1.1.0: `layout.page.padding` 48/56 para pantallas de plataforma sin prototipo.
- `foundations/typography.md` 1.1.0: `type.title.page` a 320px con corte de palabra.

### Código alineado con el spec
- `apps/web`: fondo con textura de puntos y header translúcido en la home, nav siempre en el header (`navItemClass`), píldora de racha (`StreakPill`) solo en la home, selector ES/EN con `SegmentedControl`, footer del prototipo, "Acerca de", 404 y error de ruta con `Panel`, `buttonClass` y `linkClass`, contenedor de página `max-w-page` con gutter 32. Se eliminan `useMediaQuery`, `DESKTOP_MEDIA_QUERY` y `mockViewport`.

### Notas para limpiar en otros docs
- `no-encontrado.md` anota el título como "Mono 800"; `type.title.page` es Mono 700.
- El CA-2 de la story S-012 dice "cualquier ruta" para la píldora de racha; el DS y el product-map la limitan a la home.

---

## [1.2.0] - 2026-11-06

**MINOR.** `@nerdose/ui` se alinea con el DS (story S-011) y se documentan las piezas que la story derivó de la identidad (governance 1.1.0). Ningún valor definido cambia.

### Agregado
- Hover de `button` (derivado): `primary` fondo `#3DDC84` → `#7CF0B0` con `#06120B` (13,6:1); `accent` fondo → `game.{j}.hover` con su on-accent (devdle 13,6 · bug-hunt 12,9 · big-o 11,4 · timeline 11,9 · grep-grid 10,3); `secondary` borde `#2A323C` → `#3A424C` (nuevo semántico `border.control.hover`).
- Hover de `link` `subtle`: `#C3CCD5` → `#E6EDF3` (16,6:1). Área táctil de 44px en `link` `arrow` y `subtle`.
- Hover del ítem de nav inactivo: `#9AA6B2` → `#C3CCD5` (12,0:1). Área táctil de 44px del ítem de nav.
- `streak-pill`: hover como link (borde `#5C4419` y texto `#FFD08A`, 12,7:1; nuevos semánticos `streak.border.hover` y `streak.hover`), área táctil de 44px y estado sin racha / sin datos (`bg.control`, `border.control`, `text.dim`, 6,3:1).
- `language-selector`: hover del segmento inactivo (`#C3CCD5`/`#11151A` 11,3:1), área táctil 44×44 por segmento (área ampliada con `::before`), indicador inferior del segmento activo (2px `#3DDC84`, 7,3:1 sobre `#2A323C` y 10,3:1 sobre `#11151A`) y estado deshabilitado (`text.disabled`, `cursor: not-allowed`, exento de contraste).
- `streak-number`: estados 0 y sin datos en `text.dim` (6,4:1); sin datos muestra `—`.
- `terminal-window`: filas `in-progress` (`◐`, `status.pending` 10,6:1), `no-challenge` (`–`, 6,4:1), `voided` (`⊘`, 7,5:1), `upcoming` y `unavailable` (`○`, 6,4:1); línea de racha sin racha en `text.dim`.
- `card` `next` para Devdle (`#1E4A30`), Bug Hunt (`#5C4419`), Tech Timeline (`#3C2E60`) y Grep Grid (`#5B2147`), con anillo del acento al 20% y glow al 25%; nuevos `game.{j}.featured-border` y `elevation.featured.{j}`. Bordes decorativos (1,6 a 2,0 sobre `#0F1318`).
- `chip`: `badge.neutral` (`#141920` + `#9AA6B2`, 7,1:1) para sin desafío, anulado, próximamente y sin sesión.
- `banner` `warning`: ícono `!` de 20px, stroke 3, en un círculo de 40px `status.warning` (`#1A1206`/`#FFB547` 10,5:1).
- `foundations/motion.md`: cursor con 4 ciclos (4,4s) y estado final encendido (WCAG 2.2.2), sin animación con `prefers-reduced-motion`.
- `foundations/color.md`: pares nuevos medidos (hovers de botones por juego, `#FFD08A`/`#1A140A`, `#8D99A6`/`#11151A`, `#3DDC84`/`#2A323C`, `#3DDC84`/`#11151A`, `#1A1206`/`#FFB547`).

### Cambiado
- `components/README.md`: inventario con la implementación de `@nerdose/ui` (helpers `buttonClass`, `linkClass`, `navItemClass`; `Card`, `Panel`, `Alert`, `Banner`, `AppHeader`, `BrandMark`, `SegmentedControl`, `StreakPill`, `Badge`, `StreakNumber`, `ProgressBar`, `TerminalWindow`, `GameThumbnail`).
- `tokens/semantic.md` y `tokens/component.md`: `elevation.featured.*` y `banner.warning.icon` dejan de ser Pendiente; se agregan los tokens derivados.

### Código alineado con el spec
- `packages/ui`: `tokens.css` con neutros, tintes y on-accent por juego, estados, racha, roles tipográficos, radios, contenedores, sombras, parpadeo y textura de puntos; `Alert`, `Banner`, `BrandMark` y `AppHeader` re-estilizados; `Card` con `game`, `next`, `placeholder`, `step` y `mini-stat`; nuevos `Panel`, `Badge`, `StreakPill`, `StreakNumber`, `ProgressBar`, `TerminalWindow`, `SegmentedControl`, `GameThumbnail` y los helpers `buttonClass`, `linkClass` y `navItemClass`.

---

## [1.1.0] - 2026-11-05

### Agregado
- `README.md`: sección "Identidad: cómo diseñar lo que el prototipo no tiene", con los 7 rasgos que no se negocian, una tabla para derivar piezas nuevas (botón, contenedor, estado de color, hover, foco, aviso o pantalla, texto), la prueba final y las señales de que algo salió genérico.

### Cambiado
- `governance.md`: "Pendiente — el prototipo no lo define" deja de bloquear. Una story puede crear piezas nuevas derivadas de la identidad y las documenta en el DS en la misma story; no puede contradecir valores definidos ni usar estilos genéricos.
- `foundations/color.md`: los estados que faltan para un juego se derivan de su propia escala de tintes.

---

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

Diferencias del código con el DS. `@nerdose/ui` quedó alineado en la v1.2.0 (S-011); el shell, "Acerca de" y la 404 de `apps/web` quedaron alineados en la v1.3.0 (S-012); lo que sigue es de la home (lo corrige S-013). S-011 (plan `web`) resolvió fuentes, CTA (`cta.ts` → `buttonClass` / `linkClass`) y títulos con utilidades genéricas:

- **Tipografía**: tamaños genéricos de Tailwind en cuerpos y metadatos (`text-base`, `text-sm`, `text-xs`) y el titular del hero en `type.title.page` (40) en lugar de `type.display.hero` (64/800); sin los interlineados del DS en esos cuerpos.
- **Button**: "¿Cómo funciona?" del hero es un link (`linkClass`) a `/about` (prototipo: botón `secondary` `lg` que baja a `#como`; lo resuelve S-013).
- **Card** (`apps/web/src/modules/catalog/components/game-card.tsx`): título como `h2` (prototipo `h3` bajo el `h2` de sección); descripción Mono 14 `#9AA6B2` (prototipo Inter 15/1.5 `#A9B4BF`); metadatos unidos por " · " en un párrafo y racha sin ámbar ni `▲`; estado como texto plano (prototipo: badge); sin miniatura, `next` ni tarjeta placeholder "próximo juego" (lo resuelve S-013 con las piezas de `@nerdose/ui`).
- **Catálogo** (`apps/web/src/modules/catalog/routes/home.tsx`): grilla `lg:grid-cols-3` con gap 16/24 (prototipo `auto-fit minmax(300px, 1fr)`, gap 20); "Tu progreso" es una Card más dentro de la grilla (prototipo: sección propia con panel `feature` radio 16 / padding 28, número de racha de 88px, heatmap, mini-stats y panel de rachas por juego); sin ventana terminal en el hero; sin sección "Cómo funciona".
- **Progreso del día** (`day-status.tsx`): barra continua de 8px sin radio sobre `surface-2` (prototipo: segmentada 36×6 redondeada, pendiente `#2A323C`); racha como texto (prototipo: número display ámbar).
- **Layout de la home** (`home.tsx`, `game-card.tsx`): prefijos `lg:` y grilla de 12 columnas internos (prototipo: sin media queries y reglas flex-wrap / auto-fit); lo resuelve S-013.
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
