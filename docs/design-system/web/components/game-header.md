---
component: game-header
version: 1.0.0
status: active
last_updated: 2026-11-05
source: docs/nerdose.html
related: [app-header, button, language-selector, streak-pill]
---

# Game header (header de juego)

## Propósito

**Descripción:** header de las 5 pantallas de partida (L435-449, L590-609, L850-864, L981-995, L1085-1099). Reemplaza el nav por un **breadcrumb de terminal** `> nerdose / {juego}` con el nombre del juego en su acento, y suma las acciones de la partida.

**Cuándo usar:** toda pantalla de juego (jugando o resultado).

**Cuándo NO usar:** pantallas de plataforma → [app-header](./app-header.md).

## Anatomía

1. **Container** — `<header>`, `flex-wrap`, `space-between`, gap 16, padding **14 32**, `border-bottom: 1px solid #1E252E`.
2. **Breadcrumb** (gap 18, `flex-wrap`):
   1. **Logo** — link a Home, `>` en `accent.brand` + `&nbsp;nerdose`, `type.brand.logo.compact` (Mono 800 18). Sin cursor.
   2. **Separador** — `/` en `text.separator` (`#2A323C`), `aria-hidden`. Hereda Inter 16 en el prototipo (L438).
   3. **Juego** — slug en kebab-case (`devdle`, `bug-hunt`, `big-o`, `tech-timeline`, `grep-grid`), `type.brand.crumb` (Mono 700 18) en `game.{j}.accent`.
   4. **Metadato** — "desafío del 30/10[ · categoría]", `type.label.comment` (Mono 13), `text.dim`.
3. **Acciones** (gap 8), en este orden: [button](./button.md) `icon` "Cómo se juega" → `icon` "Estadísticas" (link) → Compartir → [language-selector](./language-selector.md) → [streak-pill](./streak-pill.md) (`<span>` con solo el número).

## Variants

| Variant | Diferencia | Fuente |
|---|---|---|
| `playing` | Compartir deshabilitado (neutro, `title="Disponible al terminar la partida"`) | L445, L601, L1095 |
| `finished` | Compartir activo con el acento del juego (`accent`) | L604, L860, L991 |

## Sizes

Único. Todos los controles miden 44px de alto.

## States

| Elemento | State | Estilo |
|---|---|---|
| Compartir | deshabilitado / activo | Ver [button](./button.md) |
| Botones `icon` | hover / active | **Pendiente — el prototipo no lo define** |
| Todos los controles | focus | **Requisito:** foco visible ≥ 3:1 (precedente L756 en el acento del juego) |

## Spacing & sizing rules

- Padding 14 32 (más bajo que el header global).
- Sin media queries: breadcrumb y acciones envuelven. En anchos chicos las 5 acciones (44 + 44 + Compartir + selector + píldora) ocupan su propia fila.

## Accesibilidad

- **ARIA:** botones `icon` con `aria-label` ("Cómo se juega", "Estadísticas"); Compartir deshabilitado con `aria-disabled` y nombre que explique el motivo ("Compartir resultado (disponible al terminar)"); separador `aria-hidden`.
- **Breadcrumb:** **requisito** — exponerlo como navegación con nombre (p. ej. `<nav aria-label>` con lista) y el juego actual con `aria-current="page"`; el prototipo usa spans sueltos.
- **Teclado:** orden visual = orden del DOM.
- **Contraste:** slug en acento sobre `#0A0C0F` ≥ 7,4:1; metadato 6,8:1; íconos 11,3:1.

## Guidelines de contenido

- Slug en kebab-case, en minúscula, igual en ES y EN.
- Metadato: "desafío del {dd/mm}" + "· {categoría}" si el juego la tiene ("· loops anidados", "· lenguajes y herramientas").

## Do's & don'ts

**Do:**
- Mostrar Compartir siempre, deshabilitado mientras se juega.
- Pintar el slug con el acento del juego.

**Don't:**
- No agregar el nav global.
- No poner el cursor parpadeante en el logo del juego.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `game` | `GameId` | — | Acento y slug |
| `date` | `string` | — | Fecha del desafío |
| `category` | `string` | — | Opcional |
| `finished` | `boolean` | `false` | Habilita Compartir |
| `onShare` / `onHelp` | función | — | Acciones |
| `streak` | `number \| null` | — | Racha global |

## Componentes y patterns relacionados

- [app-header](./app-header.md), [button](./button.md) (`icon`, Compartir), [language-selector](./language-selector.md), [streak-pill](./streak-pill.md).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: breadcrumb `> nerdose / {juego}` en acento, metadato, botones-ícono 44×44, Compartir activo/deshabilitado, selector y píldora de racha.
