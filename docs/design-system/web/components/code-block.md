---
component: code-block
version: 1.0.0
status: active
last_updated: 2026-11-05
source: docs/nerdose.html
related: [panel, terminal-window]
---

# Code block

## Propósito

**Descripción:** editor de solo lectura con pestañas de lenguaje, números de línea, líneas resaltadas con barra lateral y anotaciones al margen (Bug Hunt L651-665, Big O L885-896). Incluye la variant **diff** (L720-722). Código **monocromo**: sin resaltado de sintaxis.

**Cuándo usar:** mostrar el código de un desafío (Bug Hunt, Big O) y el fix de un bug.

**Cuándo NO usar:** `<code>` inline dentro de un párrafo (es Mono en `text.primary`, sin fondo ni padding, L729); resumen de estado → [terminal-window](./terminal-window.md).

## Anatomía

1. **Container** — borde `border.default`, fondo `bg.surface.sunken` (`#0D1116`), `radius.panel` (14), `overflow: hidden`.
2. **Barra de pestañas** — `role="tablist"`, flex-wrap, `space-between`, gap 4, padding 8, `border-bottom` `border.subtle`, fondo `bg.toolbar` (`#11161C`):
   - **Pestañas** — `min-height: 40px; padding: 0 16px; radius: 8`, sin borde, `type.label.tab` (Mono 13; 700 seleccionada). "JavaScript", "Go", "Java".
   - **Nombre de archivo** — `type.meta` (Mono 12) `text.dim`, padding 0 10: `max-index.js` / `max_index.go` / `MaxIndex.java` (L777).
3. **Cuerpo** — `overflow-x: auto`, padding vertical 14 (Bug Hunt) o 18 (Big O); en Bug Hunt `role="radiogroup"`.
4. **Línea** — flex, `align-items: center`, padding 0 18, `type.code` (Mono 15 / lh 2, `tab-size: 4`), `text.primary`; texto `white-space: pre`.
   - **Número de línea** — `inline-block`, ancho 30px, `flex: none`, `text.line-number` (`#4F5A66`, requiere adaptación).
   - **Barra lateral** — `box-shadow: inset 3px 0 0 <color>`.
   - **Anotación** — a la derecha (`margin-left: auto; padding-left: 20px; flex: none`), Mono 12.

## Variants

| Variant | Propósito | Fuente |
|---|---|---|
| `selectable` (Bug Hunt) | Cada línea elegible es un `role="radio"` (estados en [`patterns/game-boards.md`](../patterns/game-boards.md#bug-hunt)) | L651-665, L786-807 |
| `readonly` (Big O) | Líneas resaltadas con anotación, sin interacción | L885-896, L944-952 |
| `diff` | Fix en formato git, sin pestañas | L720-722 |

### Pestaña seleccionada por juego

| Juego | Fondo | Texto | Fuente |
|---|---|---|---|
| Bug Hunt | `game.bug-hunt.tint-strong` (`#2A1F0B`) | `game.bug-hunt.accent` (`#FFB547`) | L817 |
| Big O | `game.big-o.tab-selected` (`#1D2A3A`) | `text.primary` | L961 |

No seleccionada: transparente, `text.muted`. **Decisión:** el prototipo pinta el texto de la pestaña activa en ámbar en Bug Hunt y en blanco en Big O; el DS registra ambos tal cual y deja **Pendiente** la regla para otros juegos.

### Línea resaltada (`readonly`)

Fondo `game.big-o.line-highlight` (`#0E1D2E`) + barra `#5EB1FF`; anotación "n veces" / "log n veces" en `game.big-o.light` (`#8CC8FF`, Mono 12/400) (L944-952).

### Diff

Caja `radius.inset` (12), `bg.surface.sunken`, borde `border.default`, `overflow-x: auto`, padding 10 0, `type.code.terminal` (Mono 14 / lh 2, `tab-size: 4`). Líneas con padding 0 14 y prefijos literales `- ` / `+ `:

| Línea | Fondo | Texto |
|---|---|---|
| `-` | `status.error.bg` (`#1C0F0E`) | `status.error.diff-text` (`#FFB3AD`) |
| `+` | `status.success.bg` (`#0C1A12`) | `status.success.diff-text` (`#9EF0C2`) |

## Sizes

Único. Línea interactiva: `min-height: 40px`.

## States

| Elemento | State | Estilo |
|---|---|---|
| Pestaña | seleccionada / no | Ver tabla |
| Pestaña | hover / focus | **Pendiente** / requisito de foco visible |
| Línea `selectable` | normal, hover, foco, elegida, acierto, bug no elegido, errónea, no elegible | [`patterns/game-boards.md`](../patterns/game-boards.md#bug-hunt) |

## Spacing & sizing rules

- Código con `white-space: pre` y scroll horizontal del cuerpo (no envuelve).
- Ligaduras desactivadas (`font-variant-ligatures: none`): `>=` se lee como dos caracteres (L757).

## Accesibilidad

- **Pestañas:** patrón `tablist` / `tab` / `tabpanel` con `aria-selected` y flechas izquierda/derecha. El prototipo solo declara `role="tablist"`.
- **Líneas seleccionables:** `role="radiogroup"` + `role="radio"` con `aria-checked`; navegación con flechas; nombre accesible que incluya el número de línea.
- **Scroll horizontal:** el cuerpo con `overflow-x: auto` tiene que ser alcanzable con teclado (`tabindex="0"` + nombre) cuando desborda.
- **Contraste:** código `#E6EDF3`/`#0D1116` 16,0:1; nombre de archivo 6,3:1; pestaña inactiva `#9AA6B2`/`#11161C` 7,3:1; anotación 9,6:1; diff 11,0 y 13,4:1. **Números de línea `#4F5A66`/`#0D1116` 2,7:1: adaptación requerida** (≥ 4,5:1; tono **Pendiente**, ver `foundations/color.md`).
- **Zoom/reflow:** el código no envuelve; su scroll horizontal es interno al bloque (excepción WCAG 1.4.10 para código).

## Guidelines de contenido

- Nombres de archivo con la convención de cada lenguaje (`max-index.js`, `max_index.go`, `MaxIndex.java`).
- Anotaciones cortas en minúscula ("n veces").
- Diff con prefijos literales `- ` y `+ `.

## Do's & don'ts

**Do:** desactivar ligaduras; usar la barra `inset` para resaltar. **Don't:** agregar resaltado de sintaxis; usar `border-left`.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'selectable' \| 'readonly' \| 'diff'` | `'readonly'` | Variant |
| `languages` | `{ id, label, filename, lines }[]` | — | Pestañas y código |
| `game` | `GameId` | — | Acento de pestaña y resaltado |
| `highlight` | `{ line, note? }[]` | — | Líneas resaltadas (`readonly`) |
| `value` / `onSelect` | `number` / función | — | Línea elegida (`selectable`) |
| `lines` | `{ kind: '-' \| '+', text }[]` | — | Diff |

## Componentes y patterns relacionados

- [panel](./panel.md) (caja `sunken` del diff), [terminal-window](./terminal-window.md), [`patterns/game-boards.md`](../patterns/game-boards.md).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: tab-bar con pestañas y nombre de archivo, líneas Mono 15/2 con número de 30px, barra `inset 3px`, anotaciones al margen y diff con fondos tintados.
