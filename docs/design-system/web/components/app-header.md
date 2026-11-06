---
component: app-header
version: 1.3.0
status: active
last_updated: 2026-11-06
source: docs/nerdose.html
related: [game-header, language-selector, streak-pill, site-footer]
---

# App header (header global)

## Propósito

**Descripción:** header del sitio en las pantallas de plataforma (Home y Stats, L18-32, L289-299): logo `> nerdose_`, nav con rutas de terminal y acciones a la derecha.

**Cuándo usar:**
- Home, Stats, Acerca de y cualquier pantalla que no sea una partida.

**Cuándo NO usar:**
- Pantallas de juego → [game-header](./game-header.md) (sin nav, con breadcrumb del juego).

## Anatomía

1. **Container** — `<header>`, `flex-wrap`, `align-items: center`, `justify-content: space-between`, gap 16, padding 18 32, `border-bottom: 1px solid #1E252E`. En Home, fondo `rgba(10,12,15,0.92)` para tapar la textura de puntos (no es sticky).
2. **Logo** — link a Home: `>` en `accent.brand` + `&nbsp;nerdose` en `text.primary` + `_` en `accent.brand` con [cursor parpadeante](../foundations/motion.md) (solo en Home; estático en Stats, L290). `type.brand.logo` (Mono 800 20, tracking -0.5), gap 2.
3. **Nav** — `<nav aria-label="Principal">`, gap 4, Mono 14: ítems `./juegos`, `./stats`, `./about`.
4. **Acciones** — gap 10: [streak-pill](./streak-pill.md) (solo Home, como link a Stats) → [language-selector](./language-selector.md). En Stats, solo el selector.

## Variants

| Variant | Propósito | Diferencia | Fuente |
|---|---|---|---|
| `home` | Header sobre textura | Fondo translúcido, cursor parpadeante, píldora de racha | L18-31 |
| `default` | Resto de pantallas de plataforma | Fondo transparente, cursor estático, sin píldora | L289-298 |

## Sizes

Único. Alto resultante ≈ 44px de contenido (controles de 44) + 36px de padding vertical.

## States

| Elemento | State | Estilo | Fuente |
|---|---|---|---|
| Ítem de nav | inactivo | `text.muted` (`#9AA6B2`), sin fondo, padding 12 14, radio 8 | L22-23 |
| Ítem de nav | activo | `text.primary` + `bg.nav.active` (`#161B22`) | L21, L293 |
| Ítem de nav | hover | **Derivado (S-011):** inactivo `text.muted` → `text.body` (`#C3CCD5`, 12,0:1). El activo no cambia | — |
| Ítem de nav | focus | **Requisito:** foco visible ≥ 3:1; estética **Pendiente** | — |
| Logo | hover / focus | **Pendiente** / requisito de foco | — |

## Spacing & sizing rules

- Padding 18 32 (el gutter de 32 coincide con el de `main`).
- Ítem de nav: padding 12 14 → alto ≈ 41px con texto de 14px. **Adaptación aplicada (S-011):** `min-height: 44px` (antes ≈41px). `navItemClass({ active })` de `@nerdose/ui` devuelve las clases; `aria-current="page"` lo pone el `NavLink` de la app.
- **Responsive:** sin media queries; los tres grupos (logo, nav, acciones) envuelven con `flex-wrap`. El nav no se oculta ni se mueve a otra fila en mobile.

## Accesibilidad

- **ARIA:** `<header>` (banner); `<nav aria-label>` ("Principal" en el prototipo; la etiqueta pasa por i18n); el ítem activo con `aria-current="page"` (requisito; el prototipo solo lo marca visualmente).
- El cursor `_` es decorativo (`aria-hidden`); el nombre accesible del logo es "nerdose".
- **Teclado:** orden logo → nav → racha → idioma.
- **Contraste:** inactivo 7,9:1; activo `#E6EDF3`/`#161B22` 14,6:1; logo 16,6:1 / acento 11,0:1.
- **Motion:** ver adaptación WCAG 2.2.2 del cursor en `foundations/motion.md`.

## Guidelines de contenido

- Ítems como rutas: `./juegos`, `./stats`, `./about` (EN mantiene las rutas o las traduce según i18n).
- Logo literal `> nerdose_`.

## Do's & don'ts

**Do:**
- Mantener el nav visible en todos los anchos.
- Marcar el activo con fondo y color, más `aria-current`.

**Don't:**
- No usar el acento verde para el ítem activo (el prototipo usa fondo `#161B22` + texto claro).
- No poner la píldora de racha en Stats (el prototipo no la muestra ahí).

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'home' \| 'default'` | `'default'` | Fondo, cursor y píldora |
| `active` | `'games' \| 'stats' \| 'about'` | — | Ítem activo |
| `streak` | `number \| null` | — | Racha global para la píldora (`home`) |
| `actions` | nodo | — | Slot de acciones (selector de idioma) |

## Componentes y patterns relacionados

- [game-header](./game-header.md), [language-selector](./language-selector.md), [streak-pill](./streak-pill.md), [site-footer](./site-footer.md).

## `#número` del desafío (S-012)

Dato de producto (PRD decisión #12): entre la píldora y el selector de idioma, `type.mono.body` en `text.muted` (7,9:1 sobre `#0F1318`), con prefijo `sr-only` "Desafío del día". Se muestra en todas las pantallas de plataforma y se oculta si no hay número o `GET /api/today` falla. La píldora de racha sigue solo en la variant `home`.

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: logo con cursor, nav con rutas `./` y estado activo con fondo, acciones con píldora de racha y selector de idioma, sin media queries.
- 2026-11-06 v1.2.0 — Hover y área táctil de 44px del ítem de nav; helper `navItemClass`; `AppHeader` de `@nerdose/ui` alineado (variant `home`, slot `nav`).
- 2026-11-06 v1.3.0 — S-012: `#número` documentado en las acciones del header.
