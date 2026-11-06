---
component: link
version: 1.2.0
status: active
last_updated: 2026-11-06
source: docs/nerdose.html
related: [button, panel]
---

# Link

## Propósito

**Descripción:** navegación de texto en Mono, sin subrayado, con `→` al final. Su color sale del acento de la pantalla: cada hoja del prototipo redefine `a{color}` y `a:hover{color}` con el acento del juego (L264, L391, L522, L754, L928, L1050, L1154).

**Cuándo usar:**
- Ir a una pantalla relacionada desde un panel: "ver estadísticas →" (L207), "ver historial completo →" (L350).

**Cuándo NO usar:**
- Acción principal de una vista → [button](./button.md).
- Navegación principal → nav de [app-header](./app-header.md).

## Anatomía

1. **Label** — texto Mono en minúscula.
2. **Flecha** — `→` al final.

## Variants

| Variant | Propósito | Tokens | Ejemplo | Fuente |
|---|---|---|---|---|
| `arrow` | Link de panel con el acento de la pantalla | `link.color`, `link.arrow.*` | "ver estadísticas →" (verde en Home) | L207, L264 |
| `subtle` | Link de pie de tarjeta, en gris claro | `link.subtle.*` | "ver historial completo →" | L350 |

## Sizes

| Size | Tipografía | Padding vertical | Fuente |
|---|---|---|---|
| `arrow` | `type.mono.body` (14) | 12px (alto total ≈ 44px) | L207 |
| `subtle` | `type.label.comment` (13) | 8px | L350 |

## States

| State | Descripción | Tokens |
|---|---|---|
| default | Acento de la pantalla (`arrow`) o `text.body` (`subtle`) | `link.color` |
| hover | `arrow`: tono claro del acento (`#7CF0B0` en Home, `#FFD08A` Bug Hunt, `#9ACFFF` Big O, `#DCC4FF` Timeline, `#F9A8D4` Grep). `subtle`: **derivado (S-011)** `text.body` (`#C3CCD5`) → `text.primary` (`#E6EDF3`), 16,6:1. | `link.color.hover` |
| focus | **Requisito:** foco visible ≥ 3:1. Estética **Pendiente** (precedente: L756). | `focus.ring.*` |
| visited / active | **Pendiente — el prototipo no lo define.** | — |

## Spacing & sizing rules

- Sin subrayado (`text-decoration: none`).
- `arrow` llega a 44px de alto con su padding de 12px.
- `arrow` y `subtle` tienen `min-height: 44px` con `inline-flex items-center` (adaptación derivada en S-011; antes `subtle` quedaba en ~32px). Implementado por `linkClass({ tone? })` de `@nerdose/ui`.

## Accesibilidad

- **ARIA:** `<a href>` nativo; `→` puede quedar en el texto o `aria-hidden` si el label ya es claro.
- **Teclado:** `Enter` activa.
- **Distinción sin color (WCAG 1.4.1):** estos links van solos en su línea, no dentro de un párrafo, así que no necesitan subrayado. **Requisito:** un link dentro de prosa (no existe en el prototipo) tiene que distinguirse por algo más que el color (subrayado o 3:1 contra el texto vecino); estética **Pendiente**.
- **Contraste:** acento sobre `#0F1318` ≥ 7,0:1 en los 5 juegos; `#C3CCD5`/`#0F1318` 11,5:1.

## Guidelines de contenido

- Minúsculas, verbo + destino: "ver estadísticas →", "ver historial completo →".
- Siempre con `→`.

## Do's & don'ts

**Do:**
- Heredar el acento de la pantalla.
- Ubicarlo en la cabecera o el pie de un panel.

**Don't:**
- No subrayarlo cuando va solo.
- No usarlo para acciones que cambian estado.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'arrow' \| 'subtle'` | `'arrow'` | Variant |
| `to` | `string` | — | Destino |
| `game` | `GameId` | — | Acento (si no, `accent.brand`) |
| `children` | contenido | — | Label |

## Componentes y patterns relacionados

- [button](./button.md), [panel](./panel.md), [card](./card.md) (variant `game-stats`).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: variants `arrow` y `subtle`, color por acento de pantalla y hover claro; adaptaciones de hover, foco y área táctil.
- 2026-11-06 v1.2.0 — Hover de `subtle` y área táctil de 44px en `arrow` y `subtle` derivados; helper `linkClass` en `@nerdose/ui`.
