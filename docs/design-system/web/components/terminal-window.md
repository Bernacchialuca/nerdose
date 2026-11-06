---
component: terminal-window
version: 1.2.0
status: active
last_updated: 2026-11-06
source: docs/nerdose.html
related: [code-block, app-header]
---

# Terminal window

## Propósito

**Descripción:** ventana de terminal falsa del hero de Home ("~/hoy — progreso.log", L47-63): el estado del día escrito como salida de `$ nerdose status`. Es la única superficie con sombra de caída.

**Cuándo usar:** resumen del día en el hero de Home.

**Cuándo NO usar:** para código de un juego → [code-block](./code-block.md).

## Anatomía

1. **Marco** — borde `border.default`, fondo `bg.surface`, `radius.panel` (14), `overflow: hidden`, sombra `elevation.window` (`0 24px 60px rgba(0,0,0,0.45)`).
2. **Barra de título** — flex, gap 8, padding 12 16, `border-bottom` `border.subtle`, fondo `bg.titlebar` (`#12171D`):
   - 3 puntos 11×11 `radius.pill` en `bg.window-dot` (`#3A424C`) — **grises**, sin rojo/amarillo/verde.
   - Título `type.meta` (Mono 12) `text.dim`, `margin-left: 8px`: "~/hoy — progreso.log".
3. **Cuerpo** — padding 22 22 24, `type.code.terminal` (Mono 14 / lh 2), columna:
   - Comando `$ nerdose status` en `text.dim`.
   - Filas de juego: `grid-template-columns: 22px 1fr auto auto; gap: 14px`: ícono / slug / métrica (`text.muted`) / estado.
   - Separador: `margin-top: 10px; padding-top: 12px; border-top: 1px dashed #2A323C`; "racha global" (`text.dim`) ↔ "17 días · récord 31" (`streak.text`, 700).
   - Countdown: "próximo desafío en " (`text.dim`) + `08:12:45` (`text.primary`) + cursor `▌` en `accent.brand` con [`motion.cursor`](../foundations/motion.md).

## Variants

| Variant | Uso |
|---|---|
| `default` (único) | Hero de Home |

## Sizes

`flex: 1 1 420px` dentro del hero (ver `foundations/grid.md`).

## States

Filas:

| Estado del juego | Ícono | Métrica | Estado | Fuente |
|---|---|---|---|---|
| resuelto | `✓` `status.success` | "4/6", "L4" (`text.muted`) | "resuelto" / "encontrado" `status.success` | L56-57 |
| pendiente | `○` `text.dim` | `—` | "pendiente" `status.pending` | L58-60 |
| en curso *(derivado, S-011)* | `◐` `status.pending` | `—` | `status.pending` (10,6:1) | — |
| sin desafío *(derivado)* | `–` `text.dim` | `—` | `text.dim` (6,4:1) | — |
| anulado *(derivado)* | `⊘` `text.muted` | `—` | `text.muted` (7,5:1) | — |
| próximamente *(derivado)* | `○` `text.dim` | `—` | `text.dim` (6,4:1) | — |
| sin sesión / no disponible *(derivado)* | `○` `text.dim` | `—` | `text.dim` (6,4:1) | — |

Línea de racha sin racha o sin datos *(derivado)*: el valor va en `text.dim`, no en ámbar vacío (6,4:1). El estado siempre se lee en texto además del ícono (NFR-U04).

**Implementación (S-011):** `TerminalWindow` de `@nerdose/ui`. Las filas usan `flex` con `flex-wrap` (ícono de 22px, gap 14) en lugar de la grilla `22px 1fr auto auto` del prototipo, para poder envolver a 320px sin valores arbitrarios; la raíz lleva `min-w-0`. El cursor `▌` usa `motion-safe:animate-blink` (4 ciclos).

## Spacing & sizing rules

- Ver anatomía; línea de 28px (14 × 2).

## Accesibilidad

- **Semántica:** es un resumen de estado, no una terminal real: marcar como región con nombre ("Progreso de hoy") y las filas como lista. Los puntos de la barra son decorativos (`aria-hidden`).
- **Estado no solo por color:** ícono (`✓`/`○`) + palabra ("resuelto"/"pendiente").
- **Cursor:** decorativo (`aria-hidden`); adaptación WCAG 2.2.2 y `prefers-reduced-motion` en `foundations/motion.md`.
- **Countdown:** si se actualiza cada segundo, **no** debe estar en una región `aria-live` (anunciaría cada segundo).
- **Contraste:** `#8D99A6`/`#0F1318` 6,4:1; `#9AA6B2` 7,5:1; verde 10,5:1; ámbar 10,6:1; título `#8D99A6`/`#12171D` 6,2:1.

## Guidelines de contenido

- Slugs en kebab-case (`devdle`, `bug-hunt`, `tech-timeline`); métricas cortas; `—` si no hay dato.

## Do's & don'ts

**Do:** mantener los puntos grises. **Don't:** colorear los puntos como macOS; usar la sombra en otras superficies.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `title` | `string` | — | Título de ventana |
| `command` | `string` | — | Línea `$ …` |
| `rows` | `{ slug, metric, status }[]` | — | Juegos |
| `streak` / `record` | `number` | — | Racha global y récord |
| `countdown` | `string` | — | `hh:mm:ss` |

## Componentes y patterns relacionados

- [code-block](./code-block.md), [streak-pill](./streak-pill.md).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: marco con sombra de caída, barra con puntos grises, cuerpo Mono 14/2 con filas de estado, separador punteado y cursor `▌`.
- 2026-11-06 v1.2.0 — Cinco estados de fila derivados, racha sin datos en gris y layout con flex-wrap.
- 2026-11-06 v1.2.1 — S-013: métrica de `done` sin el glifo de `history_label` y slug = `game_id`.
