---
component: panel
version: 1.0.0
status: active
last_updated: 2026-11-05
source: docs/nerdose.html
related: [card, link, code-block, streak-pill]
---

# Panel

## Propósito

**Descripción:** bloque de contenido encabezado por una **etiqueta-comentario** `// …` (Mono 13, gris). Es la pieza más repetida del prototipo: aparece en las 7 pantallas (Home L201, L231; Stats L314, L335, L359; Devdle L481, L488, L501; Bug Hunt L677, L689, L698, L709; Big O L905; Timeline L1010, L1024; Grep L1127).

**Cuándo usar:**
- Asides de juego ("// cómo leer las pistas", "// tests", "// palabras de hoy").
- Paneles de resultado y explicación ("// por qué", "// el fix · línea 4").
- Paneles de Home ("// racha global", "// rachas por juego").

**Cuándo NO usar:**
- Una sola cosa (un juego, un dato) → [card](./card.md).
- Resultado de la partida → [banner](./banner.md).

## Anatomía

1. **Container** — `bg.surface`, borde `border.default`, `radius.panel` (14), padding 20, columna.
2. **Cabecera** — fila `justify-content: space-between; align-items: baseline`:
   - **Etiqueta-comentario** `// minúsculas` (`type.label.comment`, `text.dim`).
   - **Dato (opcional)** a la derecha: "racha 12" en `streak.text` Mono 13 (L504, L1130) o "input → esperado" Mono 12 (L680).
3. **Título (opcional)** — `h2` en `type.title.panel` (Bug Hunt, L727) o `type.title.panel.lg` (Big O, L907).
4. **Contenido** — libre: listas, chips, cajas internas, código.
5. **Nota al pie (opcional)** — `type.caption` (Inter 13/1.5), `text.muted` (L241, L498, L686, L1021, L1146).

## Variants

| Variant | Propósito | Tokens | Ejemplo | Fuente |
|---|---|---|---|---|
| `default` | Panel lateral o de contenido | `panel.*` | "// tus intentos" | L481, L677 |
| `feature` | Panel grande de Home (radio 16, padding 28) | `panel.feature.*` | "Tu progreso" | L201, L231 |
| `explain` | Panel de explicación del resultado (padding 24, gap 18-20) | `panel.explain.*` | "// por qué · Paso a paso" | L709, L905 |
| `context` | Enunciado o dato a tener presente, en ámbar | `panel.context.*` | "// qué debería hacer" | L646-649 |

### Caja interna (`panel.box`)

Subcontenedor dentro de un panel: radio 12, padding 14 16 (o 16).

| Box | Fondo | Borde | Uso | Fuente |
|---|---|---|---|---|
| `neutral` | `bg.surface.inset` | — | "// lo que compartís" (Mono 14/1.7, `pre-line`) | L742 |
| `sunken` | `bg.surface.sunken` | `border.default` | Diff (ver [code-block](./code-block.md)) | L720 |
| `error` | `status.error.bg` | `status.error.border` | "// el test que falla" | L712 |
| `game` (Big O) | `game.big-o.tint` | `game.big-o.tint-border` | "// en números, con n = 1024" (Mono 13) | L914 |

### Etiqueta-comentario

- Default: Mono 13/400, `text.dim` (`#8D99A6`), prefijo `// `, minúsculas (~40 usos).
- Ámbar: `streak.label` (`#C9A46A`) en contexto de racha o enunciado (L309, L647).
- Variante 12px para datos secundarios de cabecera (L680).

**Decisión (prototipo ambiguo):** en Timeline la etiqueta es un `h2` con peso 500 (L1011, L1025). El DS mantiene el peso **400** para todas las etiquetas; el nivel de encabezado se decide por semántica, no por estilo.

## Sizes

| Variant | Radio | Padding | Gap |
|---|---|---|---|
| `default` | 14 | 20 | 12 (14 con listas, L481) |
| `feature` | 16 | 28 | 22 / 16 |
| `explain` | 14 | 24 | 18-20; subsecciones 10 |
| `context` | 14 | 18 20 | 8 |

Variación del prototipo: el panel "// orden correcto" de Timeline usa `padding: 20px 24px; gap: 6px` (L1024).

## States

| State | Descripción |
|---|---|
| default | Estado base |
| hover / focus / active / disabled | No aplica: el panel no es interactivo. |

## Spacing & sizing rules

- Paneles apilados en un aside: gap 16 (L480, L676, L1126).
- Ancho: lo decide el layout (`foundations/grid.md`); el aside de Devdle tiene máximo 380px.

## Accesibilidad

- **ARIA:** si el panel es una región con nombre, usar `<section aria-labelledby>` apuntando a la etiqueta. El `//` lo lee el lector como "barra barra": marcar el prefijo `aria-hidden` o dar un nombre sin prefijo.
- **Teclado / foco:** no aplica al contenedor.
- **Contraste:** etiqueta `#8D99A6`/`#0F1318` 6,4:1; ámbar `#C9A46A`/`#140F07` 8,2:1; nota `#9AA6B2`/`#0F1318` 7,5:1; texto del `context` `#E6EDF3`/`#140F07` 16,1:1.

## Guidelines de contenido

- Etiqueta en minúscula, como comentario de código, con `·` para datos: "// el fix · línea 4", "// término técnico · 6 letras · intento 4 de 6".
- Nota al pie: una o dos frases que expliquen la regla ("La racha global sube con cualquier desafío completado. No hace falta jugar todos.").

## Do's & don'ts

**Do:**
- Empezar todo panel con su etiqueta `//`.
- Poner la racha del juego como dato de cabecera en ámbar.

**Don't:**
- No usar Inter en la etiqueta.
- No usar el `context` ámbar para cosas que no sean enunciado o racha.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'default' \| 'feature' \| 'explain' \| 'context'` | `'default'` | Variant |
| `label` | contenido | — | Texto de la etiqueta (sin `//`; el componente lo agrega) |
| `labelTone` | `'dim' \| 'streak'` | `'dim'` | Color de la etiqueta |
| `datum` | contenido | — | Dato a la derecha de la cabecera |
| `title` | contenido | — | `h2` opcional |
| `note` | contenido | — | Nota al pie |
| `children` | contenido | — | Cuerpo |

## Componentes y patterns relacionados

- [card](./card.md), [code-block](./code-block.md), [streak-pill](./streak-pill.md) (racha inline), [chip](./chip.md).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: panel con etiqueta `//`, variants `default`, `feature`, `explain`, `context`, cajas internas y nota al pie.
- 2026-11-06 v1.0.1 — S-013: composición de "Tu progreso" con un solo panel `feature`.
- 2026-11-06 v1.0.2 — El cuerpo del panel crece (`flex-grow`): en una fila de paneles de igual altura, una acción final con `mt-auto` queda al pie y alineada entre paneles ("Acerca de").
