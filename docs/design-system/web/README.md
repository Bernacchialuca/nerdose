---
version: 1.12.0
last_updated: 2026-11-25
status: defined
source: docs/nerdose.html
---

# Design System — `web`

## Estado actual

- **Surface:** `web`
- **Versión:** `1.12.0`
- **Estado:** definido desde el prototipo
- **Fuente de verdad visual:** [`docs/nerdose.html`](../../nerdose.html). Ante una duda de estética gana el prototipo; en datos, reglas y accesibilidad gana el PRD (ver [`governance.md`](governance.md)).
- **Código:** `@nerdose/ui` está alineado desde S-011 (v1.2.0). `apps/web` tiene alineados el shell, "Acerca de" y la 404 (S-012), la home (S-013) desde la v1.4.0 y las tres pantallas de Devdle (S-021, v1.5.0); los `Preview` (modo solución) de Devdle, Grep Grid y Tech Timeline para el admin siguen `game-boards` 1.5.0 (S-038, v1.9.0); ver [`CHANGELOG.md`](CHANGELOG.md) → "Desalineaciones conocidas en código".

## Identidad en una línea

Terminal oscura y amable: fondo `#0A0C0F`, Inter para la prosa y JetBrains Mono para todo lo demás, acento verde `#3DDC84` y un acento propio por juego, racha siempre ámbar, botones con radio 10px, títulos `// comentario`, prompts `$` y voseo.

## Identidad: cómo diseñar lo que el prototipo no tiene

**Leé esto antes de planificar o implementar UI.** El prototipo no cubre todo, y el producto va a necesitar piezas que no existen (un botón "próximo juego", un modal, un estado nuevo, una pantalla de instrucciones). En ese caso **no hay que frenar ni improvisar algo genérico**: se deriva de la identidad. El resultado tiene que parecer sacado del mismo HTML.

### Rasgos que no se negocian

1. **Terminal oscura y amable.** Superficies sólidas muy oscuras (`#0A0C0F` → `#0F1318` → `#11151A` → `#141920`), bordes finos (`#1E252E` / `#222A33` / `#2A323C`), sin gradientes ni colores pastel.
2. **Dos fuentes con reglas claras.** JetBrains Mono para títulos, números, botones, etiquetas, metadatos y código; Inter solo para prosa (párrafos y descripciones). Titulares grandes con tracking negativo y peso 800.
3. **Radios suaves y consistentes.** Botones y filas 10, paneles 14, tarjetas destacadas 16, celdas y tabs 8, chips `full`. Nunca esquinas rectas en controles, nunca radios fuera de la escala.
4. **Acento con significado.** Verde `#3DDC84` = plataforma y "avanzar"; cada juego se apropia de su pantalla con su acento y su escala de tintes; **la racha siempre es ámbar**; error `#FF7B72` sin dramatismo.
5. **Voz de terminal.** Títulos de bloque `// comentario` en Mono 13 `#8D99A6`, prompts `$ comando`, rutas `./juegos`, `exit 0`, cursores, voseo rioplatense. Con medida: decora, no estorba.
6. **Números protagonistas.** Rachas y puntajes en Mono 800, tamaños display, tracking negativo.
7. **Punteado = "todavía no".** Borde `dashed` para lo provisional, próximo o "presente en otra posición".

### Cómo derivar una pieza nueva

| Necesito… | Partí de… | Regla |
|---|---|---|
| Un botón nuevo ("Próximo juego", "Compartir", "Rendirse") | [button](components/button.md) | Misma familia (radio 10, Mono, 44/48 px). Avanzar = `primary` verde; acción de un juego = acento del juego con su on-accent; secundaria = outline `#2A323C`; destructiva suave = `outline-tinted` de error. |
| Un contenedor o bloque | [card](components/card.md) / [panel](components/panel.md) | `bg.surface` + borde `#222A33` + radio 14 (16 si es protagonista), padding 20-28, título `// comentario`. |
| Un estado o variante de color | [color](foundations/color.md) → escalas | Usar la escala del **mismo** acento: tinte de fondo, borde del tinte, texto apagado, acento, claro, on-accent. Nunca un color nuevo suelto. |
| Hover | El elemento base | Un paso más claro dentro de su escala (borde o texto un tono arriba; link al tono "claro"). Sin transiciones largas. |
| Foco | Requisito NFR-U02 | Outline 2px en el acento de la pantalla, visible sobre fondo oscuro. |
| Un aviso, modal o pantalla nueva | [banner](components/banner.md), [panel](components/panel.md), las pantallas del prototipo | Copiar la estructura de la pantalla más parecida (header, `max-width` 1240, gutter 32, secciones con `gap` 24-32) y su tono. |
| Un texto | [voice-tone](foundations/voice-tone.md) | Corto, voseo, con un guiño de terminal si suma. |

**Prueba final:** ¿se ve como si viniera del mismo archivo que la Home y las pantallas de juego? Si parece un dashboard o un template de Tailwind, no está bien.

**Señales de que algo salió genérico** (pasó en v0.2.0): botones sin radio, todo en Mono (o todo en Inter), `text-2xl` / `rounded-md` / `shadow-md` de Tailwind sin pasar por los tokens, links subrayados, barras de colores planas, racha en verde, fondos liso sin la textura en Home.

### Qué hacer después

Una pieza derivada **se documenta en el DS en la misma story** (variant, componente o token nuevo, bump MINOR), así la próxima la reutiliza. Lo que el DS marca como "Pendiente — el prototipo no lo define" significa **"derivalo con estas reglas y documentalo"**, no "no se puede hacer".

## Inventario

### Foundations

| Archivo | Contenido |
|---|---|
| [color](foundations/color.md) | Paleta, escalas por juego y por estado, racha, heatmap, contrastes medidos |
| [typography](foundations/typography.md) | Inter / JetBrains Mono, regla de uso, ~50 roles, ligaduras desactivadas |
| [spacing](foundations/spacing.md) | Escala 2-72px, página (1240px, gutter 32), paddings por componente, medidas de control |
| [grid](foundations/grid.md) | Sin media queries: flex-wrap y auto-fit, breakpoints efectivos, adaptaciones a 320px |
| [elevation](foundations/elevation.md) | Superficies, las 5 sombras, barras `inset 3px` |
| [borders](foundations/borders.md) | Grosores, punteado con significado, radios 3-16 + full, textura de puntos |
| [iconography](foundations/iconography.md) | SVG Lucide 16/18/20, Unicode, 3 emojis |
| [motion](foundations/motion.md) | Parpadeo 1.1s `steps(1)` y scroll suave; sin transiciones |
| [voice-tone](foundations/voice-tone.md) | Voz de terminal y voseo |

### Tokens

[reference](tokens/reference.md) (primitivos) → [semantic](tokens/semantic.md) (rol) → [component](tokens/component.md) (por componente).

### Componentes y patterns

Ver [`components/README.md`](components/README.md): button, link, card, panel, alert, banner, app-header, game-header, site-footer, language-selector, streak-pill, chip, streak-number, heatmap, progress-bar, terminal-window, code-block, data-table; y [`patterns/game-boards.md`](patterns/game-boards.md) para las piezas de cada juego.

### Guidelines

[accessibility](guidelines/accessibility.md), [i18n](guidelines/i18n.md), [content](guidelines/content.md) (siguen siendo placeholders de v0.1.0; las reglas de accesibilidad vigentes están en cada foundation y spec).

## Estructura

```
docs/design-system/web/
├── README.md
├── CHANGELOG.md
├── governance.md
├── foundations/  color, typography, spacing, grid, elevation, borders, iconography, motion, voice-tone
├── tokens/       reference, semantic, component
├── components/   README + 18 specs
├── patterns/     README + game-boards
└── guidelines/   accessibility, i18n, content
```

## Versionado

Semver independiente del surface `admin`. MAJOR = cambio de valor o rename de token/variant/componente; MINOR = adición; PATCH = corrección. Detalle en [`governance.md`](governance.md).

## Historial

- 2026-11-03 v0.1.0 — Estructura inicial (bootstrap).
- 2026-11-05 v0.2.0 — Paleta oscura y primeros componentes desde el código.
- 2026-11-05 v1.0.0 — DS redefinido desde el prototipo `docs/nerdose.html` como fuente de verdad visual.
- 2026-11-06 v1.2.0 — S-011: `@nerdose/ui` alineado con el DS y piezas derivadas documentadas (ver CHANGELOG 1.2.0).
- 2026-11-06 v1.3.0 — S-012: shell, "Acerca de" y 404 alineados; piezas derivadas documentadas (ver CHANGELOG 1.3.0).
- 2026-11-09 v1.5.1 — `streak-number` alinea la base del número con la última línea de la unidad; ver CHANGELOG 1.5.1.
- 2026-11-09 v1.5.0 — S-021: piezas de juego en `@nerdose/ui` (tokens, `GameHeader`, íconos, `Banner`, `buttonClass`, `Badge`, `track`/`injectAnalytics`); ver CHANGELOG 1.5.0.
- 2026-11-10 v1.6.0 — Grep Grid jugable (S-024): `@nerdose/ui` alineado con `selected-bg`, `found-bg` y `type.numeric.lg`.
- 2026-11-10 v1.7.0 — Tech Timeline jugable (S-029): `game-boards` 1.3.0 resuelve los «Pendiente» de Timeline.
- 2026-11-11 v1.8.0 — Resultado y partida más compactos: `grep-grid.counter` como dato `N/8`, confeti al ganar y card de cierre; ver CHANGELOG 1.8.0.
- 2026-11-13 v1.9.0 — S-038: modo solución para la preview del admin (`game-boards` 1.5.0); ver CHANGELOG 1.9.0.
- 2026-11-14 v1.10.0 — S-046: Big O jugable y preview (`code-block` 1.1.0 con resaltado, `game-boards` 1.6.0); ver CHANGELOG 1.10.0.
- 2026-11-25 v1.12.0 — S-059 (plan `games`): objetivos de toque de 44px en `code-block` y `bug-hunt.line`, filas de Timeline a 320px; ver CHANGELOG 1.12.0.
