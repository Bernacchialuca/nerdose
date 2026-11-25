---
name: bug-hunt-partida
surface: web
route: /bug-hunt
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "2.0"
date: 2026-11-14
---

# Pantalla: Bug Hunt · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Leer la especificación de una función de 8 a 15 líneas y sus tests visibles, buscar la línea con el bug en el lenguaje que prefiera (JavaScript, Go o Java, solo una vista), elegirla y confirmar en un solo intento. Antes del cierre el jugador solo recibe la especificación, el código en los 3 lenguajes, las líneas elegibles y los tests que pasan: la línea del bug, el tipo de bug, el test que falla, el fix y la explicación llegan recién al confirmar (NFR-S01, NFR-S04).
- **Viewports:**
  - **mobile** — consigna y pregunta arriba; especificación, tests y el código a ancho completo (el código scrollea en horizontal dentro de su bloque, nunca la página); «Confirmar línea» justo debajo del código, alcanzable con el pulgar, y las reglas al final. Sin scroll horizontal de página desde 320 px.
  - **desktop** — consigna y pregunta a ancho completo; especificación, código y confirmación a la izquierda (7/12); tests, reglas y el reporte a la derecha (5/12), como el prototipo, todo a la vista sin scroll para funciones de hasta 15 líneas.

## Entrada y salida

**Entradas:**
- `bug-hunt-instrucciones` · «Empezar» (crea la Play)
- `home` · tarjeta «en curso» (retoma la Play: código sin línea marcada y con el intento intacto, CA 8)
- URL directa `/bug-hunt` con una Play `in_progress`

**Salidas user-driven:**
- A `home` · marca `> nerdose` del header (la partida queda en curso, sin la línea elegida)
- A `estadisticas` · botón «Estadísticas» del header (ídem)
- A O-01 · «Reportar un problema» (`link-reportar`, salvo en `ya reportado`)

**Salidas automáticas:**
- A `bug-hunt-resultado` · al confirmar una línea elegible: el servidor cierra la Play como `won` o `lost`, guarda el lenguaje con el que se confirmó como preferido y devuelve el resultado
- A `bug-hunt-resultado` · `game_finished` (la Play ya se cerró, por ejemplo desde otra pestaña, CA 7)
- A `bug-hunt-instrucciones` · `challenge_expired` (cambio de día con la partida abierta; llega con el aviso «día nuevo»)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · playing | layout | ambos | — | Breadcrumb `> nerdose / bug-hunt`, «desafío del dd/mm», acciones de juego, idioma y racha |
| 2 | consigna | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Comentario de consigna: un solo intento y las líneas que no cuentan |
| 3 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | La pregunta fija del juego |
| 4 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de desafío anulado durante la partida |
| 5 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Explica que hace falta la cookie funcional (`no_session`) |
| 6 | especificacion | card | bug-hunt.statement | content | ambos | hidden_in_states: loading, error de sistema, anulado | «// qué debería hacer»: la especificación de la función en el idioma activo |
| 7 | card-tests | card | bug-hunt.test | content | ambos | hidden_in_states: loading, error de sistema, anulado | «// tests»: los tests visibles que pasan como llamadas y la fila del test oculto que falla |
| 8 | tabs-lenguaje | tabs | code-block · tablist | navigation | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: confirmando | Pestañas JavaScript / Go / Java del bloque de código (solo vista, C-26) |
| 9 | codigo | image | code-block · selectable | input | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: selección hecha, confirmando; viewport_overrides: mobile→tag compacto | La función con numeración y resaltado; las líneas elegibles forman un grupo de selección única |
| 10 | seleccion | paragraph | caption | feedback | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: selección hecha, error de validación, límite de jugadas | Línea de aviso del juego: la línea elegida y los rechazos del servidor, sin penalizar |
| 11 | btn-confirmar | button | accent | input | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: default, selección hecha, confirmando | Segundo paso: envía la línea elegida y el lenguaje visible (un solo intento, decisión #26) |
| 12 | nota-lenguajes | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema, anulado | Recuerda que el bug es el mismo en los tres lenguajes |
| 13 | card-reglas | card | — | content | ambos | hidden_in_states: loading, error de sistema, anulado | «// cómo se juega»: tres reglas cortas y la ayuda de teclado; destino de «Cómo se juega» |
| 14 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema; state_overrides: ya reportado | Abre O-01 para avisar que el desafío está mal (C-36); deshabilitado si el jugador ya reportó este desafío |
| 15 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 16 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 17 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema, sin sesión; state_overrides: sin sesión | Reintentar la carga o recrear la sesión |
| 18 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- banner-cookies
- consigna
- titulo
- loader
- alerta-sistema
- btn-reintentar
- alerta-anulado
- especificacion
- card-tests
- tabs-lenguaje
- codigo
- seleccion
- btn-confirmar
- nota-lenguajes
- card-reglas
- link-reportar

### desktop · 1200px
- banner-cookies
- consigna
- titulo
- loader
- alerta-sistema
- btn-reintentar
- alerta-anulado
- row `juego`
  - col 7/12: especificacion, tabs-lenguaje, codigo, seleccion, btn-confirmar, nota-lenguajes
  - col 5/12: card-tests, card-reglas, link-reportar

## Contenido

### header
- Texto/label: > nerdose / bug-hunt · desafío del 30/10 · [?] [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `playing` (REQ-010): «Cómo se juega» lleva a `card-reglas` de esta misma pantalla (con la Play en curso el servidor no vuelve a mostrar las instrucciones); «Estadísticas» → `estadisticas`; Compartir deshabilitado («disponible al terminar la partida»); ES|EN cambia la interfaz y la especificación sin perder la línea elegida ni el lenguaje visible (CA 22); píldora con la racha global. Sin nav global ni `nav-movil`

### consigna
- Texto/label: // un solo intento · la firma y las líneas con solo llaves no cuentan
- Icono: nada
- Annotation: comentario `//` del prototipo (Mono 13 `text.dim`); suma «la firma» al texto del prototipo porque C-30 también la excluye

### titulo
- Texto/label: ¿En qué línea está el bug?
- Icono: nada
- Annotation: como en el prototipo (`tpl-BugHunt`), el `h1` es la pregunta y no el nombre del juego, que ya está en el breadcrumb. Mono 34 con tracking negativo en desktop (28 en mobile); fija para todos los días

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: `banner` `warning` del DS; aparece si «Confirmar línea» responde `challenge_voided` (CA 20). La especificación, los tests, el código y la confirmación se ocultan; queda «Reportar un problema»

### banner-cookies
- Texto/label: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Icono: warning
- Annotation: banner `warning` (O-03); aparece si la confirmación responde `no_session`. La línea elegida y el lenguaje visible se conservan en pantalla para reintentar

### especificacion
- Texto/label: // qué debería hacer
- Texto secundario: Devuelve el índice del mayor valor del array. Si el máximo se repite, devuelve **el primero**.
- Icono: nada
- Annotation: pattern `bug-hunt.statement` (`panel` `context` ámbar: etiqueta `#C9A46A`, texto Inter 16/1,55 con `<b>`). El texto es `spec` de la vista pública, ya resuelto en el idioma activo (ADR-015); cambia con ES|EN. Resuelve empates y casos borde, que es donde suele estar el bug

### card-tests
- Texto/label: // tests · llamada → esperado
- Texto secundario: ✓ maxIndex([3, 7, 2]) → 1 · ✓ maxIndex([4]) → 0 · ✓ maxIndex([-2, -5, 9]) → 2 · ✗ 1 test oculto falla — El test que falla se revela al confirmar. Los que pasan te ayudan a descartar líneas.
- Icono: nada
- Annotation: pattern `bug-hunt.test`. Entre 2 y 3 tests visibles (todos pasan), cada uno como llamada con `function_name` y sus argumentos (`maxIndex([3, 7, 2]) → 1`), en Mono 14; si la función recibe dos argumentos, `countAbove([3, 7, 2], 4) → 1`. Resultados enteros o `true`/`false`. La sintaxis de la llamada es neutra (la misma en las 3 pestañas: no cambia con el lenguaje). Cada test que pasa lleva `✓` + fondo `#141920` y se anuncia «pasa»; la fila del oculto es punteada `1px dashed #4A2220` con `✗` y el texto «1 test oculto falla», nunca su entrada (CA 15, 21). Nota al pie Inter 13 `text.muted`. La cabecera dice «llamada → esperado» en lugar del «input → esperado» del prototipo porque las filas muestran la llamada completa

### tabs-lenguaje
- Texto/label: —
- Etiquetas: JavaScript · Go · Java (nombre de archivo a la derecha: `max-index.js` · `max_index.go` · `MaxIndex.java`)
- Icono: nada
- Annotation: barra de pestañas del `code-block` (pestaña activa con fondo `game.bug-hunt.tint-strong` `#2A1F0B` y texto `#FFB547`, como el prototipo). El nombre de archivo sale de `function_name` con la convención de cada lenguaje. Arranca en el lenguaje preferido de la sesión (`codeLanguage`, JavaScript por defecto) y, al retomar, vuelve a ese lenguaje. Cambiar de pestaña es estado local: no hace requests, no cambia la Play ni la preferencia y **no borra la línea elegida**, porque el bug está en el mismo número de línea en los 3 lenguajes (C-26, CA 3, decisión 1). El lenguaje visible al tocar «Confirmar línea» es el que se envía. Bloqueadas (`aria-disabled`) mientras se confirma

### codigo
- Texto/label: function maxIndex(nums) { … } · 9 líneas con numeración; elegibles 2, 3, 4, 5 y 8
- Asset: placeholder 4:3 (8 a 15 líneas)
- Icono: nada
- Annotation: `code-block` `selectable` del DS con el pattern `bug-hunt.line`. El cuerpo es un `role="radiogroup"` con nombre «Líneas de maxIndex en {lenguaje}»; **solo las líneas de `pickable_lines` son `role="radio"`** (botón de ancho completo, `min-height: 44px`, Mono 15/2): la firma (línea 1), las líneas con solo llaves y cualquier otra fuera de `pickable_lines` son texto plano en `text.dim`, sin hover, no enfocables ni seleccionables (C-30, CA 6). Elegible: hover `#15110A`, foco `outline 2px #FFB547` (offset −2). Elegida: fondo `#1A140A`, barra `inset 3px #FFB547` y el tag «◀ tu elección» (Mono 700 12, ámbar). Tocar otra línea cambia la elección; ninguna se envía hasta confirmar. Resaltado de sintaxis con Shiki cargado en el chunk de `/bug-hunt` (ADR-002) y un tema por variables CSS apuntadas a tokens de Bug Hunt con contraste AA sobre `bg.surface.sunken` y sobre la línea elegida; mientras carga, o si falla, el mismo código sin color y sin saltos de layout (ver «Design System» en la Revisión UX de REQ-010). Números de línea con contraste ≥ 4,5:1 y `aria-hidden`; el nombre accesible de cada radio incluye el número («Línea 4: if (nums[i] > nums[best]) {»). Ligaduras desactivadas (`>=` se lee como dos caracteres). El cuerpo tiene scroll horizontal propio; la página nunca scrollea en horizontal (CA 23, 320 px). El código no lleva comentarios. **mobile:** con el bloque angosto (< 32rem) el tag «◀ tu elección» se reduce al glifo `◀` fijo al borde derecho visible del bloque (no queda fuera de la vista dentro del scroll); el texto completo lo dicen `seleccion` y la etiqueta del botón

### seleccion
- Texto/label: > tocá la línea donde creés que está el bug
- Icono: nada
- Annotation: línea de aviso del juego (Mono 13), siempre montada con `min-height` para no mover el layout; repite el último anuncio de la región viva `sr-only` (`aria-live="polite"`). Sin rojo ni shake: un rechazo no consume el intento. Textos: «> elegiste la línea 4. Podés cambiarla hasta confirmar.», «> no pudimos registrar esa línea. Elegí una y confirmá de nuevo: no perdiste tu intento.» (`invalid_move`, CA 6), «> vas muy rápido. Esperá unos segundos y probá de nuevo.» (429)

### btn-confirmar
- Texto/label: Elegí una línea
- Icono: nada
- Annotation: pattern `bug-hunt.confirm`: `button` `accent` de Bug Hunt (`#FFB547` / `#1A1206`), tamaño `lg`, ancho completo en mobile. Sin línea elegida: deshabilitado con la etiqueta «Elegí una línea» (`#2A2416` / `#8A7856`, `aria-disabled`). Con una línea: «Confirmar línea 4 →». Al tocarlo se valida `{ language, line }` y se envía una sola vez; mientras responde pasa a «Confirmando…» y las líneas y las pestañas quedan bloqueadas. Sin diálogo de confirmación: la selección y la confirmación ya son dos pasos (decisión #26)

### nota-lenguajes
- Texto/label: El bug es el mismo en los tres lenguajes: cambiar de pestaña no cambia la respuesta.
- Icono: nada
- Annotation: nota del pattern `bug-hunt.confirm` (Inter 13 `text.muted`), junto al botón en desktop y debajo en mobile

### card-reglas
- Texto/label: // cómo se juega
- Texto secundario: 01 · Leé qué debería hacer la función y mirá los tests. · 02 · Tocá la línea donde creés que está el bug. · 03 · Confirmá: tenés **un solo intento**. El lenguaje que tengas abierto queda como tu preferido. — Con teclado: flechas ← → para cambiar de lenguaje, Tab hasta el código, flechas ↑ ↓ para recorrer las líneas elegibles, Espacio para elegir y Enter en «Confirmar línea».
- Icono: nada
- Annotation: `card` con cabecera `//`, como la card «// cómo se juega» del prototipo y la «// reglas» de Big O y Tech Timeline; es el destino de «Cómo se juega» del header (`#game-help`). Inter 14 `text.body`; «un solo intento» en `<b>` con el acento

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: abre O-01 (bottom-sheet en mobile, modal en desktop) con el aviso «No incluyas la respuesta si todavía estás jugando»; el contexto del reporte incluye el lenguaje visible (`code_language`). Con `reported: true` en `GameToday`, o tras un envío con éxito o `already_reported`, pasa al estado `ya reportado`: «Ya reportaste este desafío», deshabilitado y sin abrir O-01 (REQ-007)

### loader
- Texto/label: $ cargando tu partida de bug-hunt…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: conservás tu intento.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: en `error de sistema` recarga la partida; en `sin sesión` recrea la sesión y vuelve a enviar la línea elegida

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. Es del shell e igual en todas las pantallas (REQ-002, C-07; REQ-003)

## Estados

### default
- Aplica: Sí
- Mensaje: > tocá la línea donde creés que está el bug. «Elegí una línea» está deshabilitado.
- Cambios:
  - btn-confirmar: variant="disabled", annotation="«Elegí una línea», deshabilitado hasta elegir (`aria-disabled` con el motivo)" (state_override)

### selección hecha
- Aplica: Sí (sub-estado de default)
- Mensaje: > elegiste la línea 4. Podés cambiarla hasta confirmar.
- Cambios:
  - codigo: annotation="línea 4 elegida: fondo `#1A140A`, barra `inset 3px #FFB547`, «◀ tu elección» (en mobile, glifo `◀` al borde) y `aria-checked=true`" (state_override)
  - seleccion: content="> elegiste la línea 4. Podés cambiarla hasta confirmar." (state_override)
  - btn-confirmar: content="Confirmar línea 4 →", variant="accent" (habilitado) (state_override)

### confirmando
- Aplica: Sí (sub-estado de selección hecha)
- Mensaje: Confirmando…
- Cambios:
  - btn-confirmar: content="Confirmando…", variant="disabled" (state_override)
  - codigo: annotation="líneas bloqueadas mientras responde el servidor" (state_override)
  - tabs-lenguaje: annotation="pestañas bloqueadas (`aria-disabled`)" (state_override)

### error de validación
- Aplica: Sí (sub-estado de selección hecha)
- Mensaje: > no pudimos registrar esa línea. Elegí una y confirmá de nuevo: no perdiste tu intento.
- Cambios:
  - seleccion: content="> no pudimos registrar esa línea. Elegí una y confirmá de nuevo: no perdiste tu intento." (state_override)
  - Nota: `422 invalid_move` (línea fuera de `pickable_lines`, lenguaje fuera del enum o número no entero; no debería pasar desde la interfaz). La Play sigue `in_progress`, la línea elegida se conserva y no se guarda ninguna preferencia (CA 6)

### límite de jugadas
- Aplica: Sí (sub-estado de selección hecha)
- Mensaje: > vas muy rápido. Esperá unos segundos y probá de nuevo.
- Cambios:
  - seleccion: content="> vas muy rápido. Esperá unos segundos y probá de nuevo." (state_override)

### anulado
- Aplica: Sí
- Mensaje: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - especificacion: oculto en este estado (hidden_in_states)
  - card-tests: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - seleccion: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - nota-lenguajes: oculto en este estado (hidden_in_states)
  - card-reglas: oculto en este estado (hidden_in_states)

### sin sesión
- Aplica: Sí (sub-estado de selección hecha)
- Mensaje: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Cambios:
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: visible en este estado, annotation="recrea la sesión y vuelve a enviar la línea elegida" (state_override)

### ya reportado
- Aplica: Sí (sub-estado de default; se combina con cualquier otro sub-estado)
- Mensaje: Ya reportaste este desafío.
- Cambios:
  - link-reportar: content="Ya reportaste este desafío", state="disabled", icon="check" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando tu partida de bug-hunt…
- Cambios:
  - consigna: oculto en este estado (hidden_in_states)
  - titulo: oculto en este estado (hidden_in_states)
  - especificacion: oculto en este estado (hidden_in_states)
  - card-tests: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - seleccion: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - nota-lenguajes: oculto en este estado (hidden_in_states)
  - card-reglas: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: conservás tu intento.
- Cambios:
  - consigna: oculto en este estado (hidden_in_states)
  - titulo: oculto en este estado (hidden_in_states)
  - especificacion: oculto en este estado (hidden_in_states)
  - card-tests: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - seleccion: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - nota-lenguajes: oculto en este estado (hidden_in_states)
  - card-reglas: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- tabs-lenguaje · tocar pestaña o flechas ← → → muestra la misma función en ese lenguaje; sin requests; la línea elegida se mantiene (mismo número de línea, CA 3)
- codigo · tocar una línea elegible, o flechas ↑ ↓ dentro del grupo + Espacio → la elige (reemplaza la anterior); `seleccion` lo anuncia. Las líneas no elegibles no reaccionan al toque ni reciben foco
- btn-confirmar · on click → envía `{ language: <pestaña visible>, line }` una sola vez → `bug-hunt-resultado` (CA 4, 5)
- btn-confirmar · respuesta `invalid_move` → estado `error de validación`; 429 → `límite de jugadas`; `no_session` → `sin sesión`; `challenge_voided` → `anulado`; `game_finished` → `bug-hunt-resultado`; `challenge_expired` → `bug-hunt-instrucciones` con el aviso «día nuevo»
- link-reportar · on click → abre O-01 (bottom-sheet en mobile, modal en desktop)
- ES|EN del header → cambia la interfaz y la especificación; el código, los tests, la línea elegida y el lenguaje visible no cambian (CA 22)

**Validaciones:**
- btn-confirmar · sin línea elegida → deshabilitado
- `{ language, line }` se valida en el cliente antes de enviar (`line` ∈ `pickable_lines`); el servidor vuelve a validar (NFR-S02, CA 6)

**Feedback:**
- La elección y los rechazos se anuncian en `seleccion` (región viva), sin consumir el intento.

## Accesibilidad

- **Orden de foco:** header → titulo → especificación y tests (lectura) → pestañas de lenguaje → grupo de líneas (una sola parada de Tab; roving tabindex entre elegibles) → btn-confirmar → card-reglas (lectura) → link-reportar. En desktop el DOM sigue el orden visual: columna izquierda (especificación, código, confirmar) y luego la derecha (tests, reglas, reporte); en mobile los tests van antes del código.
- **Landmarks y jerarquía:** `h1` es la pregunta; «qué debería hacer», «tests» y «cómo se juega» son `h2` (la cabecera `//` de cada bloque). Landmarks: header (breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** pestañas con el patrón `tablist`/`tab`/`tabpanel` (flechas ← →, `aria-selected`, foco visible). Líneas como `radiogroup`: Tab entra y sale del grupo, ↑ ↓ recorren solo las elegibles (las demás no están en el orden de foco), Espacio elige. Enter o Espacio en «Confirmar línea» envía. O-01 atrapa el foco y lo devuelve a `link-reportar`. Toda la partida se completa sin mouse (RF 15, CA 23).
- **Propio de esta composición:** la línea elegida se distingue con barra lateral, tag «◀ tu elección» (o glifo `◀`) y el número en el botón, no solo con color (NFR-U04, CA 23). Las líneas no elegibles se anuncian como texto del código, no como opciones deshabilitadas, para no alargar el grupo. Los tests se leen como lista: «maxIndex de [3, 7, 2] da 1, pasa»; el oculto: «1 test oculto falla».

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Bug Hunt difiere por completo de la de los otros.
- Selección y confirmación en dos pasos (decisión #26), sin diálogo adicional.
- REQ-010: header `game-header` (`playing`) en lugar del header de plataforma y la tira `nav-movil`, como los otros cuatro juegos. En mobile desaparece la fila de `nav-movil`.
- REQ-010: composición del prototipo (`tpl-BugHunt`): comentario `//` + `h1` con la pregunta; a la izquierda la especificación, el código con pestañas y la fila de confirmar con su nota; a la derecha los tests y las reglas. Se elimina el `h1` «Bug Hunt» y la consigna como párrafo aparte.
- REQ-010: las líneas son un `radiogroup` en el que solo las de `pickable_lines` son opciones; la firma y las líneas de llaves son texto no interactivo. Se elimina `alerta-linea` («Esa línea no se puede elegir»): una línea que no se puede tocar no necesita un mensaje de error, y la regla está en la consigna, las instrucciones y las reglas. El único rechazo posible es `invalid_move` del servidor, que va a la línea de aviso.
- REQ-010: la línea elegida sobrevive al cambio de pestaña y de idioma porque es el mismo número de línea en los 3 lenguajes (decisión 1 del diseño técnico; corrige el supuesto del REQ que hablaba de conservar el nodo). La línea elegida no se guarda en el servidor: al retomar se ve el código sin selección (CA 8).
- REQ-010: los tests visibles se muestran como llamadas (`maxIndex([3, 7, 2]) → 1`) con `function_name`, que el diseño técnico suma a la vista pública para esto (decisión 3); el prototipo los muestra solo como `[3, 7, 2] → 1`, que no funciona para funciones de dos argumentos. La sintaxis es la misma en las 3 pestañas para no recalcular los tests al cambiar de lenguaje.
- REQ-010: en mobile los tests van antes del código: la especificación y los tests forman el enunciado y tienen que leerse antes de buscar; así «Confirmar línea» queda pegado al código, donde está el pulgar al elegir. En desktop los tests van a la derecha, a la vista, como el prototipo.
- REQ-010 (pendiente del diseño técnico: selección de líneas en mobile): cada línea elegible es un blanco de 44 px de alto y ancho completo del bloque; en el bloque angosto el tag «◀ tu elección» se reduce al glifo `◀` fijo al borde derecho visible, para que no quede fuera de la vista dentro del scroll horizontal. El texto completo lo dan la línea de aviso y la etiqueta «Confirmar línea 4 →».
- REQ-010: el código lleva resaltado de sintaxis (ADR-002: Shiki solo en los chunks de big-o y bug-hunt) con un tema desde los tokens de Bug Hunt y fallback sin color, como Big O; el DS define el tema solo para Big O `readonly`, gap anotado en la Revisión UX.
- REQ-010: se suma `card-reglas` («// cómo se juega» del prototipo) como destino de «Cómo se juega» del header, con la ayuda de teclado, como en Big O y Tech Timeline. En mobile va después de confirmar para no empujar el código hacia abajo.
- REQ-010: estados `confirmando`, `error de validación` (`invalid_move`, CA 6), `límite de jugadas`, `anulado` (`challenge_voided`, CA 20), `sin sesión` y `ya reportado`, como en los otros juegos.

**Alternativas descartadas:**
- Tabs de lenguaje como overlay: es una vista inline (C-26).
- Mostrar las líneas no elegibles como radios deshabilitados (como el prototipo, `disabled`): alarga el recorrido con lector de pantalla y anuncia como «no disponible» algo que nunca fue una opción.
- Mensaje «Esa línea no se puede elegir» al tocar la firma o una llave: las líneas no elegibles no son interactivas, así que no hay evento que lo dispare.
- Card «// tu historial» del prototipo (racha, jugadas y % de aciertos durante la partida): las stats propias de Bug Hunt se muestran en `estadisticas` (FG-10) y la racha ya está en el header; en mobile empujaría el código hacia abajo.
- Tests como llamadas con la sintaxis de cada lenguaje (`new int[]{3, 7, 2}` en Java): alargan las filas a 320 px y no aportan a encontrar el bug.
- Guardar la línea elegida al cambiar de pestaña o al salir: el REQ fija que solo la confirmación crea la jugada (supuesto «Partida / estado»).

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- F-08, C-26, C-30, C-36, C-10, C-11 · REQ-010 (RF 2-5, 8, 15; CA 2, 3, 6-8, 15, 20-23) · flujos 1, 2 y 4 de `user-flows.md`.
