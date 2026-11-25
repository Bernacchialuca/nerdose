---
component: code-block
version: 1.3.0
status: active
last_updated: 2026-11-25
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
   - **Pestañas** — `min-height: 44px` (antes 40; S-059, objetivo de toque 44×44); padding: 0 16px; radius: 8`, sin borde, `type.label.tab` (Mono 13; 700 seleccionada). "JavaScript", "Go", "Java".
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

Único. Línea interactiva: `min-height: 44px`.

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
- **Contraste:** código `#E6EDF3`/`#0D1116` 16,0:1; nombre de archivo 6,3:1; pestaña inactiva `#9AA6B2`/`#11161C` 7,3:1; anotación 9,6:1; diff 11,0 y 13,4:1. **Números de línea `#4F5A66`/`#0D1116` 2,7:1: adaptación requerida** (≥ 4,5:1; **1.1.0:** en `readonly` usan `text.dim` `#8D99A6`, ≈ 6,4:1).
- **Zoom/reflow:** el código no envuelve; su scroll horizontal es interno al bloque (excepción WCAG 1.4.10 para código).

## Guidelines de contenido

- Nombres de archivo con la convención de cada lenguaje (`max-index.js`, `max_index.go`, `MaxIndex.java`).
- Anotaciones cortas en minúscula ("n veces").
- Diff con prefijos literales `- ` y `+ `.

## Do's & don'ts

**Do:** desactivar ligaduras; usar la barra `inset` para resaltar. **Don't:** agregar resaltado de sintaxis salvo con tema desde tokens del DS (AA sobre `bg.surface.sunken`) y fallback sin color; usar `border-left`.

## Variante con resaltado de sintaxis (1.1.0, `readonly` de Big O)

- **Tema desde tokens:** el resaltado usa Shiki con un tema por variables CSS (`--shiki-*`) definidas en el propio bloque y apuntadas a tokens existentes: palabra clave `game.big-o.accent`, función y enlace `game.big-o.light`, constante `game.big-o.muted`, texto y parámetro `text.primary`, cadenas `text.body`, comentarios `text.dim`, puntuación `text.muted`. Todo par cumple ≥ 4,5:1 sobre `bg.surface.sunken` y sobre la línea resaltada. Sin hex ni CSS propio.
- **Fallback sin color:** mientras carga el resaltado, o si falla, se muestra el mismo código con la misma estructura (sin saltos de layout).
- **Nota bajo la línea en bloques angostos:** la anotación va al margen derecho cuando el bloque mide ≥ 32rem y baja a una segunda fila bajo su línea, alineada con el código, cuando mide menos (container query del bloque, sin breakpoint global).
- **Pestañas bloqueadas:** mientras hay una jugada en curso, las pestañas quedan con `aria-disabled="true"` e ignoran clic y teclado.
- **Mapeo provisorio (D3, S-046):** los tokens `game.big-o.tab-selected` (`#1D2A3A`), `line-highlight` (`#0E1D2E`), `tint-strong` (`#11243A`) y `light` (`#8CC8FF`) no están en `@nerdose/ui`. Se usan: pestaña activa `game.big-o.tint-border` (`#1B2E45`), línea resaltada `game.big-o.tint` (`#0B1522`) + barra `inset 3px` `game.big-o.accent`, nota `--color-game-big-o-light` (`#9ACFFF`). Pendiente de una story de `ui`.
- **Preview del admin:** el mismo bloque con `highlight` apagado (texto plano) y las pestañas como vista local.

## Variante `selectable` y resultado con resaltado (1.2.0, Bug Hunt)

- **Tema de Bug Hunt:** mismas variables `--shiki-*` apuntadas a tokens de Bug Hunt: palabra clave `game.bug-hunt.accent`, función y enlace `game.bug-hunt.light`, constante `text.lede`, texto y parámetro `text.primary`, cadenas `text.body`, comentarios `text.dim`, puntuación `text.muted`. AA ≥ 4,5:1 verificado sobre `bg.surface.sunken` y sobre los fondos de línea elegida/bug (`game.bug-hunt.tint`), acierto (`status.success.bg`) y error (`status.error.bg`). `game.bug-hunt.muted` (≈ 3:1) no sirve para texto.
- **Resaltado en `selectable`:** solo las líneas elegibles se colorean; las no elegibles son texto plano `text.dim` fuera de los radios (no radios `disabled`), sin hover y no enfocables. En el resultado todas las líneas se resaltan igual.
- **Números de línea:** Mono 12 `text.dim` (≈ 6,4:1), `aria-hidden`, columna fija alineada a la derecha; se distinguen del texto de las líneas no elegibles por tamaño y posición, no por color.
- **Teclado de `selectable`:** una sola parada de Tab (roving tabindex entre elegibles); ↑ ↓ con wrap, Home y End mueven solo el foco; Espacio o clic eligen; Enter no actúa sobre una línea. ← → quedan para cambiar de pestaña y para el scroll horizontal.
- **Tag de la línea elegida:** glifo `◀` fijo al borde visible del bloque (`position: sticky`) cuando mide menos de 32rem; con ≥ 32rem suma el texto «tu elección». El estado accesible lo dan `aria-checked`, la línea de aviso y el botón de confirmar.
- **Modo resultado:** marcas acierto / bug / elección errónea con barra `inset 3px`, glifo y texto; el tag baja bajo su línea con menos de 32rem y va al margen desde 32rem; cada línea marcada apunta a su tag con `aria-describedby`.
- **Diff:** `-` usa `status.error.diff-text` (`#FFB3AD`) sobre `status.error.bg` y `+` `status.success.diff-text` (`#9EF0C2`) sobre `status.success.bg`, ya en `@nerdose/ui` (DS 1.11.1).

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
- 2026-11-14 v1.1.0 — Story S-046: variante de resaltado con tema desde tokens y fallback sin color, números de línea en `text.dim`, nota bajo la línea en bloques angostos, pestañas bloqueadas y mapeo provisorio de los tokens Big O ausentes en `@nerdose/ui`.
- 2026-11-15 v1.2.0 — Story S-051: resaltado en `selectable` y modo resultado de Bug Hunt (tema desde tokens de Bug Hunt con AA sobre los cuatro fondos de línea, no elegibles sin color), glifo `◀` fijo en bloques angostos, números de línea en `text.dim`, teclado de las líneas y mapeo provisorio del diff.
- 2026-11-15 v1.2.1 — Diff con `status.*.diff-text`: los tokens ya están en `@nerdose/ui` y se elimina el mapeo provisorio.
- 2026-11-25 v1.3.0 — Story S-059 (plan `games`): pestañas y línea interactiva a `min-height: 44px` (objetivo de toque del proyecto); números de línea confirmados en `text.dim` (el `text.line-number` no se usa).
