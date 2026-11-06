---
component: chip
version: 1.2.0
status: active
last_updated: 2026-11-06
source: docs/nerdose.html
related: [card, panel, streak-pill]
---

# Chip y badge

## Propósito

**Descripción:** etiquetas en píldora (`radius.pill`), Mono 12. El **chip** es outline e informativo (categorías, tipo de bug, "próximamente"); el **badge** es relleno tintado y comunica estado ("✓ resuelto", "pendiente", "✓ bien", "✗ va en 3°").

**Cuándo usar:**
- Chip: lista de categorías posibles (Devdle, L491-496), clasificación de un bug (L735-737), "próximamente" (L195).
- Badge: estado de un juego en su tarjeta (L94-182), marca de acierto/error en una fila (Timeline, L1063).

**Cuándo NO usar:**
- Racha → [streak-pill](./streak-pill.md).
- Opciones elegibles → botones o piezas de juego (los chips del prototipo no son interactivos).

## Anatomía

1. **Container** — píldora, `white-space: nowrap`, `flex: none` (badge).
2. **Texto** — `type.meta` (Mono 12), con glifo opcional (`✓`, `✗`).

## Variants

| Variant | Fondo | Borde | Texto | Padding | Ejemplo | Fuente |
|---|---|---|---|---|---|---|
| `chip.neutral` | — | `border.control` | `text.muted` | 6 10 | "git", "mutación: > → >=" | L491, L737 |
| `chip.neutral` loose | — | `border.control` | `text.muted` | 6 12 | "próximamente" | L195 |
| `chip.accent` | — | `#5C4419` | `#FFB547` | 6 10 | "tipo: comparación" | L736 |
| `badge.success` | `#12301F` | — | `#7CF0B0` | 4 10 | "✓ resuelto 4/6", "✓ encontrado" | L94, L115 |
| `badge.pending` | `#2A1F0B` | — | `#FFB547` | 4 10 | "pendiente" | L136, L160, L182 |
| `badge.neutral` *(derivado, S-011)* | `bg.surface.inset` `#141920` | — | `text.muted` `#9AA6B2` | 4 10 | "sin desafío hoy", "anulado", "próximamente", "sin sesión" | — |
| `badge.*` strong | igual | — | igual, peso 700 | 4 10 | "✓ bien", "✗ va en 3°" | L1063 |

`chip.accent` solo está definido en ámbar (Bug Hunt). Chips de acento de otros juegos: **Pendiente — el prototipo no los define**. Los chips O(…) de la miniatura de Big O (radio 8) son parte de la miniatura (ver [`patterns/game-boards.md`](../patterns/game-boards.md)).

## Sizes

Único: Mono 12; alto ≈ 26px (chip) / 22px (badge).

## States

| State | Descripción |
|---|---|
| default | Estático |
| seleccionado / hover / focus | No aplica: no son interactivos en el prototipo. Un chip interactivo **Pendiente — el prototipo no lo define**. |

## Spacing & sizing rules

- Grupo de chips: `flex-wrap`, gap 6 (L490) u 8 (L735).
- Badge en la fila de título de la tarjeta, a la derecha (gap 8).

## Accesibilidad

- **Estado no solo por color:** los badges llevan glifo y texto ("✓ resuelto", "pendiente", "✗ va en 3°").
- **Contraste:** `#7CF0B0`/`#12301F` 10,2:1; `#FFB547`/`#2A1F0B` 9,2:1; `#9AA6B2`/`#0F1318` 7,5:1; `#FFB547`/`#0F1318` 10,6:1.
- Si una lista de chips es una lista, marcarla como `<ul>`.

## Guidelines de contenido

- Minúsculas, 1-3 palabras; `clave: valor` para clasificaciones ("tipo: comparación").
- Badge con glifo primero: "✓ resuelto 4/6".

## Do's & don'ts

**Do:** usar badge para estado y chip para clasificación. **Don't:** usar chips como botones.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `kind` | `'chip' \| 'badge'` | `'chip'` | Tipo |
| `tone` | `'neutral' \| 'accent' \| 'success' \| 'pending'` | `'neutral'` | Variant |
| `loose` | `boolean` | `false` | Padding 6 12 |
| `strong` | `boolean` | `false` | Peso 700 |
| `children` | contenido | — | Texto |

## Componentes y patterns relacionados

- [card](./card.md), [panel](./panel.md), [streak-pill](./streak-pill.md).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: chips outline (neutro, ámbar, loose) y badges tintados (éxito, pendiente, fuerte).
- 2026-11-06 v1.2.0 — `badge.neutral` derivado (`#141920` + `#9AA6B2`, 7,1:1); implementado como `Badge` de `@nerdose/ui`.
