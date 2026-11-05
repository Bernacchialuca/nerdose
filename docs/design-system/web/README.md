---
version: 1.0.0
last_updated: 2026-11-05
status: defined
source: docs/nerdose.html
---

# Design System — `web`

## Estado actual

- **Surface:** `web`
- **Versión:** `1.0.0`
- **Estado:** definido desde el prototipo
- **Fuente de verdad visual:** [`docs/nerdose.html`](../../nerdose.html). Ante una duda de estética gana el prototipo; en datos, reglas y accesibilidad gana el PRD (ver [`governance.md`](governance.md)).
- **Código:** la implementación actual (`@nerdose/ui`, `apps/web`) corresponde a la v0.2.0 y **no está alineada** con esta versión; ver [`CHANGELOG.md`](CHANGELOG.md) → "Desalineaciones conocidas en código".

## Identidad en una línea

Terminal oscura y amable: fondo `#0A0C0F`, Inter para la prosa y JetBrains Mono para todo lo demás, acento verde `#3DDC84` y un acento propio por juego, racha siempre ámbar, botones con radio 10px, títulos `// comentario`, prompts `$` y voseo.

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
