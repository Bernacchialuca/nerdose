---
pattern: game-boards
version: 1.0.0
status: active
last_updated: 2026-11-05
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
- **NFR-U04:** "en otra posición" tiene patrón (punteado). "Correcta" vs "no está" se distinguen por relleno claro/oscuro (9,2:1) y `aria-label`, pero no por ícono o patrón. **Pendiente** la señal adicional.
- **320px (NFR-U01):** la grilla mide 424px fijos; a 320px hay 256px. La celda tiene que bajar a ≤ 36px con gap 8. **Pendiente** la regla de escalado (celda, gap, letra).
- **Contraste no texto:** celda vacía `#222A33` 1,4:1 sobre la página; no es interactiva y su estado lo dice `aria-label`.

### `devdle.legend` — leyenda de pistas (L483-485)

Fila flex, gap 12. Muestra 36×36, `radius.cell.md` (6), `type.game.tile.sm` (Mono 800 16): correcta (relleno verde, "O"), presente (2px dashed ámbar, "C"), ausente (`#1A2028` / `#8D99A6`, "B"). Texto Inter 14/1.4 `text.body`. Panel "// cómo leer las pistas".

### `devdle.key` — teclado (L558-574)

Tecla: alto 54, `radius.tile` (8), sin borde, `type.game.key` (Mono 700 15); letra `flex: 1 1 0; min-width: 0; max-width: 52px`. Filas QWERTY con gap 6; filas con gap 8; teclado `max-width: 620px`.

| Estado | Fondo | Texto | Extra | Fuente |
|---|---|---|---|---|
| sin usar | `#2A323C` | `#E6EDF3` | — | L564 |
| correcta | `#3DDC84` | `#06120B` | — | L562 |
| descartada | `#12161B` | `#5F6B78` | `text-decoration: line-through` | L563 |
| presente | **Pendiente — el prototipo no lo define** (el mock solo asigna correcta y descartada) | | | L556-557 |
| ENTER | `#3DDC84` | `#06120B` | `flex: 1.6 1 0; max-width: 84px`; 12px (`type.game.key.small`); `aria-label="Enviar"` | L570 |
| ⌫ | `#2A323C` | `#E6EDF3` | `flex: 1.6 1 0; max-width: 84px`; `aria-label="Borrar"` | L571 |

**Adaptaciones requeridas:** texto de tecla descartada 3,3:1 → ≥ 4,5:1 (tono **Pendiente**); hover/active/focus **Pendiente** (foco visible es requisito); el teclado físico tiene que funcionar igual que el virtual (NFR-U03).

### `devdle.distribution` — tus intentos (L501-514, L575-581)

Panel con cabecera "// tus intentos" + "racha 12" ámbar. Fila `grid-template-columns: 16px 1fr`, gap 10, Mono 12; etiqueta `1…6, X` en `text.muted`. Barra: `width: max(8%, n/máx)`, `min-width: 22px`, padding 3 8, `radius.cell.xs` (4), número alineado a la derecha; destacada (intento ganador) `#3DDC84` / `#06120B`, resto `#2A323C` / `#E6EDF3`. Totales: Mono 12 `text.muted` con `<b>` `text.primary` ("**48** jugadas **96%** victorias", gap 20).

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
- **Lo que compartís:** caja `neutral` Mono 14/1.7, `pre-line`: "🐛 Bug Hunt #128 · JavaScript / 🟩 bug encontrado / nerdose.dev".
- **↺ reiniciar demo:** [button](../components/button.md) `ghost` (es del prototipo como demo; en producto **Pendiente** si existe).

### `{juego}.step` — pasos numerados (Bug Hunt L728-731, Big O L908-912)

`<ol>` sin estilo, gap 14 (BH) / 16 (Big O); ítem `grid-template-columns: 32px 1fr; gap: 12px`. Número: cuadrado 28×28, `radius.tile` (8), `type.label.step` (Mono 700 13), centrado — Bug Hunt `#2A1F0B` / `#FFB547`; Big O `#11243A` / `#8CC8FF`. Texto `type.body.explain` (Inter 15/1.55) `text.body`; `<code>` Mono `text.primary` sin fondo; `<b>` `text.primary` (o acento si es la respuesta, L912).

## Big O

Layout: banner → `h1` 30px (`f(n)` en acento) + código `readonly` + opciones (`1 1 560px`, gap 20) | explicación (`1 1 380px`), gap 24 (L866-905).

### `big-o.option` — opción de respuesta (L898-902, L964-971)

Grilla `repeat(4, minmax(0, 1fr))`, gap 10; 8 opciones: `O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(n³)`, `O(2ⁿ)`, `O(n!)` (superíndices Unicode). Botón `min-height: 56px`, `radius.control` (10), `type.game.option` (Mono 16).

| Estado | Fondo | Texto | Borde | Fuente |
|---|---|---|---|---|
| correcta / elegida (`aria-pressed="true"`) | `#3DDC84` | `#06120B`, 800 | 2px solid `#3DDC84` | L970 |
| no elegida (resultado) | `#0F1318` | `#8D99A6`, 400 | 1px solid `#1E252E` | L970 |
| jugando: default / hover / foco / elegida | **Pendiente — el prototipo solo muestra la vista de resultado** (`cursor: default`) | | | L970 |
| elección incorrecta | **Pendiente — el prototipo no lo define** | | | — |

**Adaptaciones requeridas:** el borde pasa de 1 a 2px y corre el contenido: mantener el borde estable (regla común 2). 4 columnas fijas no entran a 320px ("O(n log n)" necesita ~96px): **Pendiente** cuántas columnas en anchos chicos. Opción correcta: relleno + peso; **Pendiente** confirmar señal no cromática (NFR-U04).

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
| jugando: default / arrastrando / foco | **Pendiente — el prototipo solo muestra el resultado** | | | — |

El error es **ámbar + punteado**, no rojo, y el badge dice dónde va. Nota Inter 13: "Se arrastra y se suelta. En pantallas táctiles, cada fila también tiene flechas para subir y bajar." (L1021).

**Adaptación requerida (NFR-U03):** el orden tiene que poder cambiarse con teclado; las flechas por fila que menciona la nota no están dibujadas en el prototipo → **Pendiente** su estética.

### `timeline.rail` — línea de tiempo vertical (L1026-1036, L1074-1076)

`<ol>` sin gap (línea continua). Ítem `grid-template-columns: 64px 20px 1fr; gap: 14px`:
- Año `type.numeric.year` (Mono 800 18) `game.timeline.accent`, `padding-top: 12px`.
- Riel: tramo superior 2×16, nodo 12×12 `radius.pill` `#C39BFF`, tramo inferior 2px `flex-grow: 1`; tramos `#3C2E60`, transparentes en el extremo superior del primero e inferior del último.
- Texto (padding 10 0 18, gap 4): nombre Mono 700 16 + nota Inter 14/1.5 `text.lede`.

## Grep Grid

Layout: encabezado (`$ grep -o '[A-Z]*' hoy.txt` + `h1` + bajada Inter 16/1.5 `text.lede`) ↔ 2 [cards `counter`](../components/card.md) ("3/8 encontradas" en rosa, "02:14 tiempo") → tablero (`999 1 620px`, centrado, gap 14) + aside (`1 1 340px`), gap 28 (L1101-1146).

### `grep-grid.board` (L1116-1117)

Wrapper `overflow-x: auto; max-width: 100%`. Grilla `repeat(12, 48px)`, gap 4, padding 16, `radius.feature` (16), borde `border.default`, fondo `bg.surface.sunken` (`#0D1116`). `role="grid"`, `aria-label="Grilla de 12 por 12"`.

### `grep-grid.cell` (L1191-1202)

`<button role="gridcell">` 48×48, `radius.tile` (8), `type.game.tile.md` (Mono 700 18), borde 2px. Prioridad: inicio > encontrada > default.

| Estado | Fondo | Letra | Borde | Fuente |
|---|---|---|---|---|
| default | `#141920` | `#C3CCD5` | 2px solid `#141920` | L1199 |
| inicio seleccionado | `#2A0F22` | `#F9A8D4` | 2px solid `#F472B6` | L1197 |
| encontrada | `#F472B6` | `#24081A` | 2px solid `#F472B6` | L1198 |
| hover / foco / error | **Pendiente — el prototipo no lo define** (el error solo cambia el hint) | | | — |

`aria-label`: "{letra}, fila {r}, columna {c}" (L1202). Interacción: primer toque marca el inicio; segundo toque compara contra los extremos de cada palabra en ambos sentidos; tocar la misma celda cancela sin error.

**Adaptaciones requeridas:** el tablero mide 654px y scrollea dentro del wrapper; NFR-U01 pide 320px sin scroll horizontal → **Pendiente** (ver `foundations/grid.md`). Navegación por flechas dentro de la grilla (patrón `grid`) y foco visible: requisito, estética **Pendiente**.

### `grep-grid.hint` — línea de consola (L1123, L1221)

Mono 13 `text.dim`, `min-height: 20px` (evita saltos). Textos: "> tocá la primera letra de una palabra" · "> ahora tocá la última letra" · "> no es una palabra de la lista, probá de nuevo". El error es **silencioso**: mismo gris, sin rojo ni shake. **Requisito:** región `aria-live="polite"` para que el cambio se anuncie.

### `grep-grid.word` — fila de palabra (L1127-1146, L1215-1218)

Panel "// palabras de hoy" + "racha 6" ámbar; lista gap 8 en orden fijo. Fila: columna gap 4, padding 10 12, `radius.control` (10); línea superior `space-between`, gap 8.

| Estado | Fondo | Borde | Nombre (Mono 700 15) | Tag (Mono 12) |
|---|---|---|---|---|
| pendiente | `#141920` | 1px solid `#141920` | `text.primary` | "{n} letras" `text.dim` |
| encontrada | `#1F0D19` | 1px solid `#5B2147` | `#F9A8D4` tachado | "✓" `#F472B6`, 800 |

Encontrada suma la **definición** (Inter 13/1.45 `text.body`): el momento de aprendizaje. Nota al pie: "…compartís el reloj, no las palabras."

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

**Don't:**
- No animar celdas ni filas.
- No usar rojo para el error de Timeline ni para la jugada fallida de Grep.
- No rellenar de amarillo el "presente" de Devdle.
- No implementar estados marcados **Pendiente** sin pasar antes por `/product-design-system-update`.

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: piezas de Devdle (celda, leyenda, tecla, distribución), Bug Hunt (línea elegible, confirmar, tests, pasos, resultado), Big O (opción, caja "en números"), Tech Timeline (fila, riel) y Grep Grid (tablero, celda, hint, palabra), miniaturas de tarjeta y adaptaciones requeridas por NFR-U01/U03/U04.
