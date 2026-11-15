---
pattern: game-boards
version: 1.7.0
status: active
last_updated: 2026-11-15
source: docs/nerdose.html
related: [card, panel, code-block, button, chip, streak-pill]
---

# Tableros de juego

## Propósito

Reúne las piezas **propias de un solo juego**: celdas, teclas, filas y opciones de Devdle, Bug Hunt, Big O, Tech Timeline y Grep Grid, más las miniaturas de las tarjetas del catálogo. Se documentan juntas porque comparten reglas (borde de 2px estable, acento del juego, feedback que no depende solo del color) y se van a implementar a partir de FG-3. Los componentes transversales que usan (panel, code-block, button, chip) tienen spec propio.

**Convención:** cada pieza se nombra `{juego}.{pieza}` y sus tokens viven en `tokens/component.md` → "Patterns de juego".

## Reglas comunes

1. **El juego se apropia de su pantalla:** breadcrumb, links, pestaña activa, números de paso, Compartir activo y borde de salida en `game.{j}.*`.
2. **Borde estable:** las piezas con borde de 2px lo mantienen en todos los estados (mismo color que el fondo cuando no se ve) para que el cambio de estado no mueva el layout.
3. **Correcto = verde; racha = ámbar;** el error no siempre es rojo (Timeline usa ámbar + punteado).
4. **Sin animación:** no hay flip, shake ni transición (ver `foundations/motion.md`).
5. **Accesibilidad del PRD manda:** todo se juega con teclado (NFR-U03) y el feedback suma ícono o patrón (NFR-U04). Donde el prototipo no lo resuelve, se marca **adaptación requerida**.

## Devdle

Layout: tablero (`flex: 999 1 560px`, columna centrada, gap 28) + aside (`1 1 300px`, máx. 380, gap 16) con gap 40 (L451-480). Encabezado centrado: `// término técnico · 6 letras · intento 4 de 6` + `h1` 34px.

### `devdle.cell` — celda del tablero (L529-537)

64×64, `radius.tile` (8), `type.game.tile.lg` (Mono 800 28), borde 2px. Grilla `repeat(6, 64px)`, gap 8; 6 filas con gap 8 (`role="grid"`).

| Estado | Fondo | Letra | Borde | Fuente |
|---|---|---|---|---|
| correcta | `#3DDC84` | `#06120B` | 2px solid `#3DDC84` | L531 |
| en otra posición | transparente | `#FFB547` | **2px dashed** `#FFB547` | L532 |
| no está | `#1A2028` | `#8D99A6` | 2px solid `#1A2028` | L533 |
| escrita (fila actual) | `#0F1318` | `#E6EDF3` | 2px solid `#5A6573` | L534 |
| vacía | transparente | — | 2px solid `#222A33` | L535 |

`aria-label` por celda: "{letra|casilla}, {correcta|en otra posición|no está|escrita|vacía}" (L537).

**Adaptaciones requeridas:**
- **NFR-U04:** "en otra posición" tiene patrón (punteado). "Correcta" vs "no está" se distinguen por relleno claro/oscuro (9,2:1) y `aria-label`, pero no por ícono o patrón. **Resuelto (1.1.0):** glifo en la esquina superior derecha de cada celda evaluada: `✓` correcta, `~` en otra posición, `✗` no está (`aria-hidden`, mismo color que la letra, tamaño `--tile-mark` = 40% de la letra, mín 8px, máx 12px). Las celdas escrita y vacía no llevan glifo.
- **320px (NFR-U01):** la grilla mide 424px fijos; a 320px hay 256px. La celda tiene que bajar a ≤ 36px con gap 8. **Resuelto (1.1.0):** grilla `repeat(N, minmax(0, 1fr))` con celdas `aspect-ratio: 1` y ancho máximo `N*64px + (N-1)*gap`; gap 8px si N ≤ 8 y 4px si N ≥ 9 (filas con el mismo gap); letra `clamp(10px, (ancho útil - (N-1)*gap) / N * 0.4375, 28px)` con el tablero como contenedor. A 320px (256px útiles): 6 letras → celda 36px; 12 letras → ~17,7px.
- **Contraste no texto:** celda vacía `#222A33` 1,4:1 sobre la página; no es interactiva y su estado lo dice `aria-label`.

### `devdle.legend` — leyenda de pistas (L483-485)

Fila flex, gap 12. Muestra 36×36, `radius.cell.md` (6), `type.game.tile.sm` (Mono 800 16): correcta (relleno verde, "O"), presente (2px dashed ámbar, "C"), ausente (`#1A2028` / `#8D99A6`, "B"). Texto Inter 14/1.4 `text.body`. Panel "// cómo leer las pistas".

### `devdle.key` — teclado (L558-574)

Tecla: alto 54, `radius.tile` (8), sin borde, `type.game.key` (Mono 700 15); letra `flex: 1 1 0; min-width: 0; max-width: 52px`. Filas QWERTY con gap 6; filas con gap 8; teclado `max-width: 620px`.

| Estado | Fondo | Texto | Extra | Fuente |
|---|---|---|---|---|
| sin usar | `#2A323C` | `#E6EDF3` | — | L564 |
| correcta | `#3DDC84` | `#06120B` | — | L562 |
| descartada | `#11151A` (1.1.0) | `#8D99A6` (≈ 6:1, antes `#5F6B78` 3,3:1) | `text-decoration: line-through` | L563 |
| presente (1.1.0) | `#2A323C` | `#FFB547` | **2px dashed** `#FFB547`; nunca relleno amarillo | derivado |
| ENTER | `#3DDC84` | `#06120B` | `flex: 1.6 1 0; max-width: 84px`; 12px (`type.game.key.small`); `aria-label="Enviar"` | L570 |
| ⌫ | `#2A323C` | `#E6EDF3` | `flex: 1.6 1 0; max-width: 84px`; `aria-label="Borrar"` | L571 |

**Adaptaciones resueltas (1.1.0):**
- **Borde estable:** todas las teclas llevan borde de 2px; en los estados sin borde visible es del color del fondo.
- **Hover / foco:** sin usar y ⌫ `hover` un paso más claro (`#3A424C`); ENTER `hover` `#7CF0B0`; correcta, presente y descartada sin hover. Foco: `outline 2px` con offset 2 en `--color-accent`.
- **Deshabilitado:** ENTER con `pending` → `aria-disabled="true"`, neutro (`#11151A` / `text.disabled`), sin hover; la acción se bloquea en el handler.
- **Ancho a 320px:** se mantiene `flex: 1 1 0; min-width: 0`: la tecla mide ~20 × 54px con pitch de 26px. Excepción documentada al target 44×44: cumple WCAG 2.5.8 por espaciado (≥ 24px).
- El teclado físico funciona igual que el virtual (NFR-U03): A–Z, Enter y Backspace; Enter/Espacio sobre un botón enfocado quedan al comportamiento nativo.

### `devdle.hint` — aviso de jugada (1.1.0)

`<p role="status">` siempre montado, sin ícono, Mono 13 en ámbar `status.present` (advertencia del juego, sin rojo), centrado, con `min-height: 20px` reservada para no mover el layout. Se descarta al escribir.

### Cabecera `//` de panel (1.1.0)

En las pantallas de Devdle las cabeceras `// …` de pistas, palabra y distribución son `h2` (Mono 13 `text.dim`, el `//` `aria-hidden`), con dato opcional en `text.streak`. **1.5.0:** embebida en la preview del admin (bajo el título `h2` del drawer O-02), la cabecera es `h3` con el mismo estilo (`SectionPanel` con `headingLevel={3}`).

### `devdle.distribution` — tus intentos (L501-514, L575-581)

Panel con cabecera "// tus intentos" + "racha 12" ámbar. Fila `grid-template-columns: 16px 1fr`, gap 10, Mono 12; etiqueta `1…6, X` en `text.muted`. Barra: `width: max(8%, n/máx)`, `min-width: 22px`, padding 3 8, `radius.cell.xs` (4), número alineado a la derecha; destacada (intento ganador) `#3DDC84` / `#06120B` con peso 800 y texto solo-lector «hoy» (1.1.0), resto `#2A323C` / `#E6EDF3`. Totales: Mono 12 `text.muted` con `<b>` `text.primary` ("**48** jugadas **96%** victorias", gap 20).

### Pista de categoría (L488-498)

Chips `neutral` informativos (gap 6) + nota Inter 13 "La categoría y la definición se revelan al terminar." Ver [chip](../components/chip.md).

## Bug Hunt

Layout: banner (al terminar) → encabezado (`// un solo intento · las líneas con solo llaves no cuentan` + `h1`) → código (`1 1 560px`) + aside (`1 1 360px` jugando / `1 1 380px` resultado), gap 24 (L611-709). Ligaduras desactivadas.

### `bug-hunt.statement` — "qué debería hacer" (L646-649)

[Panel](../components/panel.md) `context` ámbar: etiqueta `#C9A46A`, texto Inter 16/1.55 con `<b>`.

### `bug-hunt.line` — línea elegible (L786-807)

[Code-block](../components/code-block.md) `selectable`. Línea `<button role="radio">`, ancho completo, `min-height: 40px`, padding 0 18, Mono 15/2. Elegibles: líneas con lógica (2, 3, 4, 5, 8); las de solo llaves quedan atenuadas y deshabilitadas.

| Estado | Fondo | Barra `inset 3px` | Tag a la derecha (Mono 700 12) | Fuente |
|---|---|---|---|---|
| normal | transparente | transparente | — | L786 |
| no elegible | transparente | — | texto `#8D99A6`, `cursor: default` | L770 |
| hover (solo elegibles) | `#15110A` | — | — | L755 |
| foco de teclado | `outline: 2px solid #FFB547; outline-offset: -2px` | | | L756 |
| elegida (jugando) | `#1A140A` | `#FFB547` | "◀ tu elección" `#FFB547` | L788 |
| resultado: acierto | `#0C1A12` | `#3DDC84` | "✓ acá estaba el bug" `#3DDC84` | L790 |
| resultado: bug no elegido | `#1A140A` | `#FFB547` | "🐛 acá estaba el bug" `#FFB547` | L792 |
| resultado: elección errónea | `#1C0F0E` | `#FF7B72` | "✗ tu elección" `#FF7B72` | L794 |

El tag lleva glifo + texto: el estado no depende solo del color. Teclado: flechas para moverse entre líneas (patrón radiogroup), `Space` elige.

### `bug-hunt.confirm` — fila confirmar (L668-671, L836)

Flex-wrap centrado, gap 14. [Button](../components/button.md) `accent` `lg` (48, padding 22, Mono 700 15): listo "Confirmar línea N →" (`#FFB547` / `#1A1206`); deshabilitado "Elegí una línea" (`#2A2416` / `#8A7856`, `aria-disabled`). Nota Inter 13 `text.muted`: "El bug es el mismo en los tres lenguajes: cambiar de pestaña no cambia la respuesta."

### `bug-hunt.test` — fila de test (L683-686)

`grid-template-columns: 22px 1fr`, gap 10, padding 10 12, `radius.control` (10), Mono 14.
- Pasa: fondo `#141920`, `✓` `#3DDC84`, texto `text.primary` ("[3, 7, 2] → 1").
- Test oculto que falla: sin fondo, `1px dashed #4A2220`, texto `#D9B3AF`, `✗` `#FF7B72` ("1 test oculto falla").
Cabecera del panel: "// tests" + "input → esperado" (Mono 12). Nota al pie Inter 13.

### Resultado (aside `explain`, L709-745)

- **Test que falla:** caja `error` (radio 12, padding 14 16, Mono 14): llamada + "esperado **0** · obtenido **2**" (verde / rojo en `<b>`).
- **Fix:** [code-block](../components/code-block.md) `diff`.
- **Por qué falla:** `h2` 20px + pasos numerados (abajo) + chips "tipo: comparación" (`chip.accent`) y "mutación: > → >=" (`chip.neutral`).
- **Lo que compartís** (descartado por las pantallas de S-051: el texto lo arma el host con `share()`): caja `neutral` Mono 14/1.7, `pre-line`: "🐛 Bug Hunt #128 · JavaScript / 🟩 bug encontrado / nerdose.dev".
- **↺ reiniciar demo** (descartado por las pantallas de S-051): [button](../components/button.md) `ghost` (es del prototipo como demo; en producto **Pendiente** si existe).

### `{juego}.step` — pasos numerados (Bug Hunt L728-731, Big O L908-912)

`<ol>` sin estilo, gap 14 (BH) / 16 (Big O); ítem `grid-template-columns: 32px 1fr; gap: 12px`. Número: cuadrado 28×28, `radius.tile` (8), `type.label.step` (Mono 700 13), centrado — Bug Hunt `#2A1F0B` / `#FFB547`; Big O `#11243A` / `#8CC8FF`. Texto `type.body.explain` (Inter 15/1.55) `text.body`; `<code>` Mono `text.primary` sin fondo; `<b>` `text.primary` (o acento si es la respuesta, L912).

### Bug Hunt — mapeo de S-051 (1.7.0)

- **`bug-hunt.line`:** el hover de la línea elegible usa `surface-3` (`#141920`, neutro, para no confundirse con la elegida `#1A140A`) hasta que exista `game.bug-hunt.tint-hover`. Las líneas no elegibles no son interactivas (texto plano `text.dim`, no radios `disabled`). El tag de la elegida es el glifo `◀` en bloques < 32rem y «◀ tu elección» desde 32rem; en el resultado los tags bajan bajo su línea en < 32rem.
- **`bug-hunt.test`:** cada test es una llamada con `function_name` (`maxIndex([3, 7, 2]) → 1`), sintaxis neutra igual en las tres pestañas; texto accesible «maxIndex de [3, 7, 2] da 1, pasa». La fila del oculto es «1 test oculto falla» (punteada, sin su entrada).
- **`bug-hunt.confirm`:** deshabilitado con la etiqueta «Elegí una línea» y el `disabled` de `buttonClass`, hasta que existan `game.bug-hunt.disabled.*`.

## Big O

Layout: banner → `h1` 30px (`f(n)` en acento) + código `readonly` + opciones (`1 1 560px`, gap 20) | explicación (`1 1 380px`), gap 24 (L866-905).

### `big-o.option` — opción de respuesta (L898-902, L964-971)

Grilla `repeat(4, minmax(0, 1fr))`, gap 10; 8 opciones: `O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(n³)`, `O(2ⁿ)`, `O(n!)` (superíndices Unicode). Botón `min-height: 56px`, `radius.control` (10), `type.game.option` (Mono 16).

| Estado | Fondo | Texto | Borde | Fuente |
|---|---|---|---|---|
| correcta / elegida (`aria-pressed="true"`) | `#3DDC84` | `#06120B`, 800 | 2px solid `#3DDC84` | L970 |
| no elegida (resultado) | `#0F1318` | `#8D99A6`, 400 | 1px solid `#1E252E` | L970 |
| jugando: sin elegir (1.6.0) | `#0F1318` (`bg.surface`) | `text.muted`, 400 | 2px solid `#1E252E` (`border.subtle`) | pantallas S-046 |
| jugando: elegida (1.6.0) | `#0B1522` (`game.big-o.tint`) | `text.primary`, 700, `●` antes del texto | 2px solid `#5EB1FF` (`game.big-o.accent`) | pantallas S-046 |
| elección incorrecta, resultado (1.6.0) | `#0F1318` | `text.primary` | 2px solid `status.error` (`#FF7B72`), `✗` y etiqueta «tu respuesta»; nunca relleno rojo | pantallas S-046 |
| correcta y elegida, resultado (1.6.0) | `#3DDC84` | `#06120B`, 800 | 2px solid `#3DDC84`, `✓` y «correcta · tu respuesta» | pantallas S-046 |
| trampa, preview del admin (1.6.0) | sin relleno (`bg.surface`) | `text.primary` | 2px dashed `game.big-o.muted` (`#7FA7CF`, ≈ 7,4:1), etiqueta «trampa» | D7 |

**Resueltos en 1.6.0 (story S-046):** el borde es de 2px en todos los estados (borde estable, regla común 2). Columnas: **2 en mobile y 4 desde `lg`** (`grid-cols-2 lg:grid-cols-4`). Jugando, el grupo es un `radiogroup` (`role="radio"` con `aria-checked`, roving tabindex, flechas, Home y End); en el resultado es una lista de solo lectura. La señal no cromática de la correcta es `✓` + etiqueta, la de la elegida incorrecta `✗` + etiqueta, y cada opción marcada se anuncia con su etiqueta («O(n²), tu respuesta, incorrecta»).

### `big-o.step` — paso numerado (1.6.0, mapeo de S-046)

`<ol>` sin estilo, gap 16; ítem con el número en un cuadrado 28×28 (`radius.tile`, Mono 700 13) y el texto Inter 15/1,55 `text.body`. Mapeo provisorio mientras `@nerdose/ui` no tiene `tint-strong`/`light` del DS: número `game.big-o.tint-border` (`#1B2E45`) con `--color-game-big-o-light` (`#9ACFFF`, ≈ 8,4:1).

### Caja "en números" (L914-919)

Caja `game` (Big O): radio 12, `#0B1522` / `#1B2E45`, padding 16, gap 8, Mono 13: "// en números, con n = 1024" + líneas `text.body` con valores `<b>` `text.primary` ("1024 × 10 = **10.240** ops").

## Tech Timeline

Layout: título (`// consigna: …` + `h1`) ↔ puntaje [`streak-number` `score`](../components/streak-number.md) ("3/5", `align-items: end`) → "// tu orden" (`1 1 320px`) + "// orden correcto" (`2 1 520px`), gap 24 → barra de cierre [banner `neutral`](../components/banner.md) (L997-1043).

### `timeline.row` — fila de "tu orden" (L1012-1021, L1062-1064)

`<ol>` columna gap 8. Fila: flex, gap 12, `min-height: 52px`, padding 0 14, `radius.control` (10). Contenido: posición Mono 13 `text.dim` (ancho 18) · nombre `type.game.item` (Mono 700 16, `flex-grow: 1`) · badge.

| Estado | Fondo | Borde | Badge | Fuente |
|---|---|---|---|---|
| correcta | `#0E1A13` | 1px solid `#1E4A30` | `badge.success` strong "✓ bien" | L1064, L1063 |
| mal ubicada | `#17130B` | **1px dashed** `#5C4419` | `badge.pending` strong "✗ va en 3°" | L1064, L1063 |
| jugando: default (1.3.0) | `surface` | 1px solid `border.subtle`, sin badge | — | — |
| jugando: foco (1.3.0) | `surface` | 1px `border.subtle`; el anillo `focus-visible` (`--color-accent`) está en el asa y en cada botón ↑ ↓ | — | — |
| jugando: tomada (arrastre o Espacio) (1.3.0) | `surface` | **2px solid** `game.timeline.accent`; el padding se compensa (7×3 en vez de 8×4) para que el borde no mueva el layout | — | — |
| jugando: destino (1.3.0) | `surface` | 2px `dashed` `game.timeline.accent` (hueco punteado) sobre la fila sobre la que está el hito | — | — |
| jugando: bloqueada (1.3.0) | `surface` | 1px `border.subtle` | asa y ↑ ↓ deshabilitados (neutro, sin hover) | — |

**Fila de partida (1.3.0):** flex, gap 8, `min-height: 52px`, padding 0 8, `radius.control`. Contenido: asa `⠿` (botón `icon` 44×44, único activador de arrastre, `touch-action: none` solo en ella) · posición Mono 13 `text.dim` (ancho 18) · nombre `type.game.item` (`flex-grow: 1`, envuelve) · grupo ↑ ↓ (botones `icon` 44×44). Sin animación: no hay transición de reacomodo ni de soltado.

**A 320px (1.3.0):** contenido útil 256px; panel padding 16 → 224; fila padding 8 → 208. Asa 44 + posición 18 + ↑↓ apilados 44 + 3 gaps de 8 = 130 → quedan **78px para el nombre**, que envuelve a 2 líneas (la fila crece en alto, nunca en ancho) y nunca achica los controles de 44px. Con la lista a 320px o más (`@container`) los ↑ ↓ van en línea.

El error es **ámbar + punteado**, no rojo, y el badge dice dónde va. Nota Inter 13: "Se arrastra y se suelta. En pantallas táctiles, cada fila también tiene flechas para subir y bajar." (L1021).

**Adaptación requerida (NFR-U03) — resuelta en 1.3.0:** el orden se cambia con teclado (`KeyboardSensor` sobre el asa: Espacio/Enter toma, ↑ ↓ mueven, Espacio/Enter suelta, Escape devuelve) y con botones ↑ ↓ por fila (`icon`, `aria-label` «Subir {hito}» / «Bajar {hito}», deshabilitados en los extremos; el foco sigue al hito movido). Arrastre con mouse (`PointerSensor` limitado a mouse/pen) y con el dedo (`TouchSensor`, `delay: 150`, `tolerance: 5`) solo desde el asa.

### `timeline.rail` — línea de tiempo vertical (L1026-1036, L1074-1076)

`<ol>` sin gap (línea continua). Ítem `grid-template-columns: 64px 20px 1fr; gap: 14px`:
- Año `type.numeric.year` (Mono 800 18) `game.timeline.accent`, `padding-top: 12px`.
- **Columna de fecha (1.3.0):** la columna fija de 64px solo entra con años; con `month`/`day` («20 de febrero de 1991», «June 2014») no. La fecha va **arriba del nombre**, dentro de la columna de texto, y el ítem es `flex` gap 14 = riel (20px) + texto. Funciona igual a 320 y a 1200px. Formato largo de `Intl` según precisión.
- Riel: tramo superior 2×16, nodo 12×12 `radius.pill` `#C39BFF`, tramo inferior 2px `flex-grow: 1`; tramos `#3C2E60`, transparentes en el extremo superior del primero e inferior del último.
- Texto (padding 10 0 18, gap 4): nombre Mono 700 16 + nota Inter 14/1.5 `text.lede`.

### `timeline.hint` — línea de aviso (1.3.0)

Línea Mono 13 `text.dim` (`type.label.comment`), siempre montada con `min-height: 20px`, vacía al entrar. La línea visible es silenciosa; una región `aria-live="polite"` `sr-only` anuncia un nodo por mensaje. Textos (ES / EN): `> moviste {hito} a la posición {n} de 5` / `> you moved {hito} to position {n} of 5` (↑ ↓ y soltar), `> {hito}, posición {n} de 5` mientras un hito está tomado, `> no pudimos registrar ese orden. Revisalo y confirmá de nuevo` (`invalid_move`), `> vas muy rápido. Esperá unos segundos y probá de nuevo` (429), `> {mensaje}` para otros códigos. Sin rojo ni shake: un rechazo no consume el intento.

Los arrastres (puntero y teclado) los anuncia dnd-kit en su propia región, para que cada movimiento se anuncie una sola vez: «Tomaste {hito}, posición {n} de 5.», «{hito}, posición {n} de 5.», «Soltaste {hito} en la posición {n} de 5.», «{hito} volvió a la posición {n} de 5.». `screenReaderInstructions`: «Para tomar un hito, presioná Espacio o Enter. Movelo con las flechas arriba y abajo. Presioná Espacio o Enter para soltarlo, o Escape para devolverlo a su lugar.» (EN: «To pick up a milestone, press Space or Enter. Move it with the up and down arrow keys. Press Space or Enter to drop it, or Escape to put it back.»).

## Grep Grid

Layout (1.2.0, sin reloj): encabezado (`$ grep -o '[A-Z]*' hoy.txt` · consigna + `h1`) → **una** [card `counter`](../components/card.md) ("3/8 encontradas" en rosa) → tablero (`grow-7 basis-155`, centrado, gap 14) + aside (`grow-5 basis-85`), gap 28 con `flex-wrap`, sin media queries (L1101-1146). El prototipo traía una segunda card "02:14 tiempo": se descarta, la partida no tiene reloj.

### `grep-grid.board` (L1116-1117) — escalado (1.2.0)

Sin `overflow-x`. Wrapper `@container w-full max-w-163.5` (654px = 12×48 + 11×4 + 2×16 + 2) con tres variables:

- `--board-pad: clamp(6px, 2.5cqi, 16px)`
- `--cell-font: clamp(9px, calc((100cqi - 2 * var(--board-pad) - 46px) / 12 * 0.375), 18px)` (18/48 = 0,375; 46 = 11 gaps × 4 + 2 de borde)
- `--cell-mark: clamp(6px, calc((100cqi - 2 * var(--board-pad) - 46px) / 12 * 0.22), 11px)`

Grilla `grid grid-cols-12 gap-1 rounded-feature border border-border bg-surface-sunken p-(--board-pad)`; celdas `aspect-square`. A 1200px (columna ≥ 654) la celda mide 48 y la letra 18. A 320px (256px útiles) el padding es 6,4, la celda ≈ 16,4px y la letra 9px: el área táctil queda por debajo de 40px, **adaptación aceptada** por la story (CA-13). `role="grid"`, `aria-label="Grilla de 12 por 12"`, `aria-disabled` mientras se envía una jugada o la partida está anulada.

### `grep-grid.cell` (L1191-1202)

1.2.0: la celda de la partida es un `<div role="gridcell">` con un `<button>` adentro (`role="gridcell"` no está permitido en `<button>`: axe `aria-allowed-role`); en el resultado, `<div role="cell">` sin botón. `radius.tile` (8), Mono, borde 2px estable, letra `text-(length:--cell-font)`, glifo en la esquina superior derecha (`aria-hidden`, `--cell-mark`). Prioridad: inicio > encontrada > revelada > default. **La selección la valida el servidor y solo hacia adelante** (se elimina «en ambos sentidos»: el client no decide).

| Estado | Fondo | Letra | Borde | Señal no cromática |
|---|---|---|---|---|
| default | `#141920` | `#C3CCD5` | 2px solid `#141920` | — |
| hover (default, partida) | igual | igual | 2px solid `game.grep-grid.found-border` (`#5B2147`) | decorativo |
| inicio seleccionado | `#2A0F22` | `#F9A8D4` | 2px solid `#F472B6` | `aria-label` «…, inicio» |
| encontrada | `#F472B6` | `#24081A` | 2px solid `#F472B6` | glifo `✓` + peso 800 |
| revelada (solo resultado) | sin relleno | `#F9A8D4` | 2px dashed `#F472B6` | borde punteado + glifo `○` |
| foco (partida) | — | — | outline 2px `#F472B6`, offset 2 | outline |
| bloqueada (`locked` / enviando) | sin cambio visual | | | `aria-disabled` en el `grid` |
| solución (preview del admin, 1.5.0) | `#F472B6` | `#24081A` | 2px solid `#F472B6` | glifo `✓` + peso 800 (mismos valores que encontrada) |

`aria-label`: «{letra}, fila {r+1}, columna {c+1}, {libre|inicio|encontrada|revelada|parte de la solución}». Interacción: primer toque (o Enter/Espacio) marca el inicio; segundo toque envía `{ from, to }`; tocar de nuevo el inicio o Escape lo desmarca sin enviar. Navegación por flechas, Home y End con roving tabindex (una sola parada de tabulación).

### `grep-grid.hint` — línea de consola (L1123, L1221)

Mono 13 `text.dim`, `min-height: 20px` (evita saltos). Textos (1.2.0): «> tocá la primera letra de una palabra» · «> ahora tocá la última letra» · «> {PALABRA} encontrada · N/8» · «> no es una palabra de la lista, probá de nuevo» · «> las palabras se marcan de la primera a la última letra, hacia adelante» (`invalid_move`) · «> vas muy rápido. Esperá unos segundos y probá de nuevo» (429) · «> {mensaje}» para cualquier otro error. El error es **silencioso**: mismo gris, sin rojo ni shake. **Anuncio:** la línea visible no es live region; una región aparte `aria-live="polite"` `sr-only` recibe **un nodo por resultado de selección** (`key` distinta, para que el mismo texto repetido se vuelva a anunciar). La guía de los toques no se anuncia (el estado «inicio» lo dice el `aria-label` de la celda).

### `grep-grid.word` — fila de palabra (L1127-1146, L1215-1218)

Panel `SectionPanel` "// palabras de hoy" (`h2`); lista gap 8 en orden fijo. Fila: columna gap 4, padding 10 12, `radius.control` (10); línea superior `space-between`, gap 8. 1.2.0: se quitan la nota «compartís el reloj» y el `datum` «racha N» (sin reloj; la racha vive en el header y en `card-rachas`).

| Estado | Fondo | Borde | Nombre (Mono 700 15) | Tag (Mono 12) |
|---|---|---|---|---|
| pendiente | `#141920` | 1px solid `#141920` | `text.primary` | "{n} letras" `text.dim` |
| encontrada (partida) | `#1F0D19` | 1px solid `#5B2147` | `#F9A8D4` tachado | "✓" `#F472B6` 800 + «encontrada» solo para lectores de pantalla |
| encontrada (resultado) | igual | igual | igual | "✓ encontrada" `#F472B6` 800 |
| revelada (resultado) | estilo pendiente | igual | `text.primary` | "○ no la encontraste" `text.dim` |
| solución (preview del admin, 1.5.0) | `#1F0D19` | 1px solid `#5B2147` | `#F9A8D4` **sin tachado** | "{n} letras" `text.dim` |

Encontrada, revelada y solución suman la **definición** (Inter 13/1.5 `text.body`, rol `text-caption`; el prototipo dice 1.45): el momento de aprendizaje.

### `grep-grid.counter` — dato `N/8` en el encabezado de la lista (1.4.0)

El contador es el dato a la derecha de «// palabras de hoy» en `grep-grid.word-list`: valor `font-mono text-mono-body font-bold text-game-grep-grid` ("3/8") y la etiqueta «encontradas» `sr-only`. Mismo tamaño durante la partida y en el resultado. **No es live region**: el avance se anuncia en la región del hint. (Hasta 1.3.0 era una `card` `counter` sobre la grilla; se quitó para que la grilla arranque a la altura del título y entre en pantalla.)

### `grep-grid.surrender` — botón «Rendirse» (`outline-tinted`, 1.2.0)

`button` `outline-tinted` de error implementado como constante local (`SURRENDER_BUTTON`), candidata a `buttonClass`: `min-h-11 rounded-control border border-status-error-border px-4 font-mono text-button-md font-medium text-text`, hover `border-status-error`, foco outline 2px del acento del juego. Ícono `✕` `aria-hidden`. Deshabilitado: estilo neutro + `aria-disabled`.

### `grep-grid.surrender-dialog` — O-04 «¿Rendirte?» (1.2.0)

Gap de DS aceptado en REQ-005: el DS no define modales; se deriva de `panel` + `button` según la guía de identidad. Overlay `fixed inset-0 z-50 flex items-center justify-center bg-header px-4` (clic en el overlay = «Seguir jugando»); panel `role="alertdialog" aria-modal="true"` `flex w-full max-w-xl flex-col gap-4 rounded-panel border border-border bg-surface p-6`; cabecera con `h2` Mono `text-title-panel` y botón cerrar `buttonClass({ variant: 'icon' })`; texto `font-sans text-body text-text-body`; acciones `flex flex-wrap gap-3` con cada botón `grow basis-50` («Seguir jugando» `primary` primero; «Sí, rendirme» `outline-tinted`). Foco inicial en «Seguir jugando» (nunca en la destructiva), trampa de foco, Escape / cerrar / overlay cierran salvo en `loading` («Cerrando…», ambos botones `aria-disabled`), el foco vuelve a «Rendirse» y el contenido de la partida queda `inert`. Sin animación.

## Modo solución — preview del admin (1.5.0)

Cada `client` exporta `Preview` (`{ payload, language }`, REQ-008 decisión 10): el tablero del juego con la solución superpuesta. El admin lo muestra en el drawer O-02 desde Próximos, en ES y EN lado a lado (dos cards de 6/12, solo desktop). Se arma con las mismas piezas de la partida y del resultado, con el acento del juego, y no suma tokens.

**Reglas comunes:**
- **Solo lectura:** sin botones, sin roving tabindex, sin hint ni regiones `aria-live`. No se juega ni se crea una partida.
- **Raíz `<div lang={language}>`** sin rol ni landmark: el admin ya envuelve cada panel en una `section` con `aria-label` («Español» / «English»).
- **Cabeceras `//` en `h3`:** van bajo el `h2` del drawer. Nunca `h1` ni `h2`.
- **Textos del `payload` según `language`** (`{ es, en }`). Los rótulos propios de la preview existen en los dos idiomas.
- **Escala al ancho del panel:** los tableros de Devdle y Grep Grid ya escalan con `@container`; todo va en una sola columna.
- **Solo admin:** el `payload` completo trae la solución y llega solo por `/api/admin/*`. `web` nunca monta `Preview`.

| Juego | Contenido (de arriba abajo) | Piezas |
|---|---|---|
| Devdle | Tablero de **una fila** con la palabra, todas las celdas `correcta` (glifo `✓`). `aria-label` del tablero: «Solución: {PALABRA}» / «Solution: {WORD}». Debajo, card «// palabra del día» / «// word of the day» (`h3`) con la palabra (`type.title.panel`, `game.devdle.accent`), «Categoría: {categoría}», la definición, «Resumen» + el resumen y «Fuente: Wikipedia (CC BY-SA)». | `devdle.cell` |
| Grep Grid | Tablero de solo lectura (`role="table"`, como en el resultado), con las celdas de las 8 palabras en estado **solución** (calculadas desde `placements`). `aria-label`: «Grilla con las 8 palabras resaltadas» / «Grid with the 8 words highlighted». Debajo, panel «// palabras del desafío» / «// challenge words» (`h3`) con el dato «8 palabras» / «8 words» (mismo estilo que `grep-grid.counter`) y las 8 filas en estado **solución**, cada una con su definición. | `grep-grid.board`, `grep-grid.cell`, `grep-grid.word` |
| Tech Timeline | Línea «// consigna: {consigna}» / «// task: {prompt}» (`type.label.comment`, `text.dim`). Debajo, card «// orden correcto» / «// correct order» (`h3`) con `timeline.rail`: los 5 hechos en el orden de `correct_order`, cada uno con fecha por precisión, nombre, categoría y nota. | `timeline.rail` |
| Big O (1.6.0) | Pregunta como `p` («¿Cuál es la complejidad temporal (peor caso) de f(n)?»). Debajo, `code-block` `readonly` **en texto plano, sin resaltado** con pestañas JavaScript / Go / Java y las líneas de `line_notes` resaltadas con su nota en el idioma de la columna. «// respuesta» (`h3`) con la lista de las 8 opciones: la respuesta «✓ correcta» y la `trap_option` «trampa» (borde punteado, sin relleno). Panel «Paso a paso» (`h3`) con los pasos, «en números» y el consejo, solo cuando existen. | `code-block`, `big-o.option`, `big-o.step`, caja «en números» |

| Bug Hunt (1.7.0) | Especificación (`Statement`, `h3`), `code-block` en texto plano con pestañas, las no elegibles en `text.dim` y la línea del bug marcada «🐛 línea del bug»; chips «tipo: …» (`chip.accent`) y «mutación: from → to» (`chip.neutral`); tests visibles como llamadas (sin la fila del oculto); test que falla, fix (`-`/`+` de la pestaña activa) y «Por qué falla» con los pasos, todo en `h3` y en el idioma de la columna. | `code-block`, `bug-hunt.statement`, `bug-hunt.test`, `bug-hunt.step`, `chip` |

**Excepción de Big O (D8), también de Bug Hunt:** las tres pestañas del código son estado de vista local (sin efectos, `fetch` ni storage), la única interacción de la preview; el resto sigue sin botones, hints ni regiones `aria-live`. Prevalece lo específico (story S-046 y `o-02-detalle-desafio`) sobre «sin controles».

**Estado «solución» y no «encontrada»:** en la preview nadie jugó. Por eso la celda dice «parte de la solución» / «part of the solution» en su `aria-label`, y la fila no se tacha y muestra «{n} letras» en lugar de «✓ encontrada».

**Contraste (verificado en S-038):** el único par nuevo es el tag «{n} letras» (`text.dim` `#8D99A6`) sobre la fila solución (`#1F0D19`): 6,41:1. El resto repite pares de «encontrada» (`#24081A` sobre `#F472B6`, 7,05:1; `#F9A8D4` sobre `#1F0D19`, 10,25:1) y de `devdle.cell` correcta (`#06120B` sobre `#3DDC84`, 10,71:1).

## Miniaturas de tarjeta

Cabecera de 150px de la [tarjeta de juego](../components/card.md), `aria-hidden`, fondo `game.{j}.tint` y `border-bottom` `game.{j}.tint-border`. Son mini-estados reales del juego hechos con divs, no imágenes.

| Juego | Contenido | Fuente |
|---|---|---|
| Devdle | Grilla `repeat(6, 30px)`, gap 5, celdas 30px radio 5 con borde 2px: vacía `#1E3A28`, presente **dashed** `#FFB547`, correcta relleno `#3DDC84`. Fila 1 mixta, fila 2 toda correcta. | L85-89 |
| Bug Hunt | 5 "líneas" (flex, gap 10): número Mono 10 `#7A5A2A` (ancho 12) + barra 8px radio full `#3A2C14` (58/40/46/28/34%), indentación 16/32/48. Línea con bug: `margin: 0 -10px; padding: 4px 10px; radius 6; bg #2A1F0B; inset 3px 0 0 #FFB547`, número y barra ámbar, `🐛` a la derecha. Columna gap 7, padding 0 24. | L105-110 |
| Big O | Chips (flex-wrap centrado, gap 8, padding 0 20): padding 6 12, radio 8, borde `#23405F`, texto `#7FA7CF` Mono 13; activo `#5EB1FF` / `#06121F` 700. `O(1)`, `O(log n)`, `O(n log n)` (activo), `O(n²)`, `O(2ⁿ)`. | L126-131 |
| Tech Timeline | Línea horizontal 2px `#3C2E60` (top 50%); 5 nodos (columna gap 6): colocado 14×14 `#C39BFF` + año; pendiente hueco (borde 2px `#C39BFF`, fondo `#161024`) + `????`. Años Mono 11 `#B596E6`. Padding 0 22. | L147-155 |
| Grep Grid | Grilla `repeat(7, 22px)`, gap 4, Mono 700 12, lh 22: letra `#8A5C7A`; encontrada (MUTE) radio 4 `#F472B6` / `#24081A`; selección en curso borde 1px `#F472B6`, texto `#F9A8D4`, lh 20. | L171-176 |

## Do's & don'ts

**Do:**
- Mantener borde de 2px estable en todas las piezas.
- Acompañar cada estado de juego con glifo, patrón o texto además del color.
- Usar `aria-label` por celda con letra/posición y estado.
- En la preview del admin, usar el estado «solución» (no «encontrada»): nadie jugó.

**Don't:**
- No animar celdas ni filas.
- No usar rojo para el error de Timeline ni para la jugada fallida de Grep.
- No rellenar de amarillo el "presente" de Devdle.
- No implementar estados marcados **Pendiente** sin pasar antes por `/product-design-system-update`. Los de Devdle quedaron resueltos en 1.1.0 (story S-021) los de Grep Grid en 1.2.0 (story S-024) y los de Timeline en 1.3.0 (story S-029).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: piezas de Devdle (celda, leyenda, tecla, distribución), Bug Hunt (línea elegible, confirmar, tests, pasos, resultado), Big O (opción, caja "en números"), Tech Timeline (fila, riel) y Grep Grid (tablero, celda, hint, palabra), miniaturas de tarjeta y adaptaciones requeridas por NFR-U01/U03/U04.
- 2026-11-09 v1.1.0 — Story S-021: se resuelven los «Pendiente» de Devdle (glifo no cromático, escalado a 320px, tecla presente, descartada ≥ 4,5:1, borde estable, hover/foco/deshabilitado, ancho de tecla a 320px) y se documentan el aviso de jugada y la cabecera `//` como `h2`.
- 2026-11-10 v1.2.0 — Story S-024: se resuelven los «Pendiente» de Grep Grid (tablero escalado a 320px, estados revelada/hover/foco/bloqueada de la celda, `<div role="gridcell">` + `<button>`, textos y anuncio del hint, estado revelada de la palabra, `outline-tinted` de error) y se documentan el contador sin reloj y O-04 «¿Rendirte?».
- 2026-11-10 v1.3.0 — Story S-029: se resuelven los «Pendiente» de Tech Timeline (estados de juego de `timeline.row`: default, foco, tomada, destino y bloqueada; medidas a 320px; teclado y botones ↑ ↓; columna de fecha de `timeline.rail`) y se documenta `timeline.hint` con sus anuncios ES/EN.
- 2026-11-11 v1.4.0 — `grep-grid.counter` pasa de `card` `counter` sobre la grilla a dato `N/8` en el encabezado de la lista (CHANGELOG 1.8.0).
- 2026-11-13 v1.5.0 — Story S-038: modo solución para la preview del admin (Devdle, Grep Grid y Tech Timeline), estado «solución» de `grep-grid.cell` y `grep-grid.word` y cabecera `//` en `h3` cuando va embebida.
- 2026-11-14 v1.6.0 — Story S-046: se resuelven los «Pendiente» de Big O (`big-o.option` jugando, elegida, incorrecta, 2/4 columnas y resultado), mapeo de `big-o.step`, trampa de la preview y fila Big O del modo solución con la excepción de las pestañas.
- 2026-11-15 v1.7.0 — Story S-051: mapeo de `bug-hunt.line` / `bug-hunt.test` / `bug-hunt.confirm` a tokens existentes, tags responsivos, fila Bug Hunt del modo solución con la excepción de las pestañas y «Lo que compartís» / «↺ reiniciar demo» marcados como descartados.
