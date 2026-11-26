---
name: big-o-partida
surface: web
route: /big-o
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "2.1"
date: 2026-11-25
---

# Pantalla: Big O · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Leer la función `f(n)` en el lenguaje que prefiera (JavaScript, Go o Java, solo una vista), elegir una de las 8 complejidades fijas y confirmar en un solo intento. Antes del cierre el jugador solo recibe el código en los 3 lenguajes y las 8 opciones: la respuesta, la explicación y la receta llegan recién al confirmar.
- **Viewports:**
  - **mobile** — consigna y pregunta arriba; pestañas y código a ancho completo (una línea que no entra salta de línea con sangría colgante, sin scroll horizontal); las 8 opciones en 2 columnas; «Confirmar respuesta» a ancho completo debajo de las opciones; después «// cómo se juega» y el reporte. Sin scroll horizontal desde 320 px.
  - **desktop** — consigna y pregunta a ancho completo; columna principal (7/12) con código, opciones (4 columnas, como el prototipo), la línea de aviso y «Confirmar respuesta» a ancho completo; lateral (5/12) con «// cómo se juega» y el reporte (REQ-012, patrón común de partida).

## Entrada y salida

**Entradas:**
- `big-o-instrucciones` · «Empezar» (crea la Play)
- `home` · tarjeta «en curso» (retoma la Play: código y 8 opciones sin selección y con el intento intacto, CA 8)
- URL directa `/big-o` con una Play `in_progress`

**Salidas user-driven:**
- A `home` · marca `> nerdose` del header (la partida queda en curso, sin la opción elegida)
- A `estadisticas` · botón «Estadísticas» del header (ídem)
- A O-01 · «Reportar un problema» (`link-reportar`, salvo en `ya reportado`)

**Salidas automáticas:**
- A `big-o-resultado` · al confirmar una respuesta válida: el servidor cierra la Play como `won` o `lost`, guarda el lenguaje con el que se confirmó como preferido y devuelve el resultado
- A `big-o-resultado` · `game_finished` (la Play ya se cerró, por ejemplo desde otra pestaña, CA 6)
- A `big-o-instrucciones` · `challenge_expired` (cambio de día con la partida abierta; llega con el aviso «día nuevo»)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · playing | layout | ambos | — | Breadcrumb `> nerdose / big-o`, «desafío del dd/mm», acciones de juego, idioma y racha |
| 2 | consigna | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Comentario de consigna: peor caso y un solo intento |
| 3 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | La pregunta fija del juego, con `f(n)` en el acento |
| 4 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de desafío anulado durante la partida |
| 5 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Explica que hace falta la cookie funcional (`no_session`) |
| 6 | tabs-lenguaje | tabs | code-block · tablist | navigation | ambos | hidden_in_states: loading, error de sistema, anulado | Pestañas JavaScript / Go / Java del bloque de código (solo vista, C-26) |
| 7 | codigo | image | code-block · readonly | content | ambos | hidden_in_states: loading, error de sistema, anulado | La función `f(n)` con numeración de líneas y resaltado de sintaxis, sin anotaciones; las líneas largas saltan con sangría colgante |
| 8 | opciones | chips | big-o.option · radiogroup | input | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: selección hecha, confirmando | Las 8 complejidades fijas, de selección única |
| 9 | seleccion | paragraph | caption | feedback | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: selección hecha, error de validación, límite de jugadas | Línea de aviso del juego: la opción elegida y los rechazos del servidor, sin penalizar |
| 10 | btn-confirmar | button | accent | input | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: default, confirmando | Segundo paso: envía la opción elegida y el lenguaje visible (un solo intento, decisión #26). CTA principal a ancho completo debajo del área de juego |
| 11 | card-reglas | card | — | content | ambos | hidden_in_states: loading, error de sistema, anulado | «// cómo se juega»: tres reglas cortas y la ayuda de teclado; destino de «Cómo se juega»; primer panel del lateral |
| 12 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema; state_overrides: ya reportado | Abre O-01 para avisar que el desafío está mal (C-36); deshabilitado si el jugador ya reportó este desafío. Siempre último del lateral |
| 13 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 14 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 15 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema, sin sesión; state_overrides: sin sesión | Reintentar la carga o recrear la sesión |
| 16 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- banner-cookies
- consigna
- titulo
- loader
- alerta-sistema
- btn-reintentar
- alerta-anulado
- tabs-lenguaje
- codigo
- opciones
- seleccion
- btn-confirmar
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
  - col 7/12: tabs-lenguaje, codigo, opciones, seleccion, btn-confirmar
  - col 5/12: card-reglas, link-reportar

## Contenido

### header
- Texto/label: > nerdose / big-o · desafío del 30/10 · [?] [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `playing` (REQ-009): «Cómo se juega» lleva a `card-reglas` de esta misma pantalla (con la Play en curso el servidor no vuelve a mostrar las instrucciones); «Estadísticas» → `estadisticas`; Compartir deshabilitado («disponible al terminar la partida»); ES|EN cambia la interfaz sin perder la opción elegida ni el lenguaje visible (CA 22); píldora con la racha global. Sin categoría de receta en el metadato (CA 18). Sin nav global ni `nav-movil`

### consigna
- Texto/label: // peor caso · un solo intento
- Icono: nada
- Annotation: comentario `//` del prototipo (Mono 13 `text.dim`)

### titulo
- Texto/label: ¿Cuál es la complejidad temporal (peor caso) de f(n)?
- Icono: nada
- Annotation: como en el prototipo (`tpl-BigO`), el `h1` es la pregunta y no el nombre del juego, que ya está en el breadcrumb. Mono 30 con tracking negativo y `f(n)` en el acento `#5EB1FF`; a 320 px envuelve en 2 o 3 líneas. Fija para todos los días

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: `banner` `warning` del DS; aparece si «Confirmar respuesta» responde `challenge_voided` (CA 20). El código, las opciones y la confirmación se ocultan; queda «Reportar un problema»

### banner-cookies
- Texto/label: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Icono: warning
- Annotation: banner `warning` (O-03); aparece si la confirmación responde `no_session`. La opción elegida y el lenguaje visible se conservan en pantalla para reintentar

### tabs-lenguaje
- Texto/label: —
- Etiquetas: JavaScript · Go · Java (nombre de archivo a la derecha: `f.js` · `f.go` · `F.java`)
- Icono: nada
- Annotation: barra de pestañas del `code-block` (pestaña activa con el fondo `game.big-o.tab-selected`, como el prototipo). Arranca en el lenguaje preferido de la sesión (`codeLanguage`, JavaScript por defecto) y, al retomar, vuelve a ese lenguaje. Cambiar de pestaña es estado local: no hace requests, no cambia la Play ni la preferencia y **no borra la opción elegida** (C-26, CA 3). El lenguaje visible al tocar «Confirmar respuesta» es el que se envía

### codigo
- Texto/label: function f(n) { … } · código del desafío con numeración de líneas
- Asset: placeholder 4:3 (hasta ~15 líneas)
- Icono: nada
- Annotation: `code-block` `readonly` sin líneas resaltadas ni anotaciones (las notas «n veces» son del resultado: durante la partida serían la respuesta). Texto seleccionable, Mono 15/2, sin ligaduras; resaltado de sintaxis con Shiki cargado en el chunk de `/big-o` (ADR-002) y un tema que sale de los tokens del DS con contraste AA sobre `bg.surface.sunken`; mientras carga, o si falla, se muestra el mismo código sin color, sin saltos de layout (ver «Design System» en la Revisión UX de REQ-009). Números de línea con contraste ≥ 4,5:1. Cada línea que no entra salta de línea (soft-wrap) con sangría colgante: la sangría original queda fija a la izquierda y la continuación arranca alineada con el código de esa línea (`CodeText`, REQ-012 / S-066); el número de línea no se repite. No hay scroll horizontal ni en el bloque ni en la página (CA 21, 320 px). El cuerpo sigue siendo enfocable (`tabindex="0"` y nombre «Código de f(n) en {lenguaje}»). El código no lleva comentarios

### opciones
- Texto/label: // tu respuesta
- Etiquetas: O(1) · O(log n) · O(n) · O(n log n) · O(n²) · O(n³) · O(2ⁿ) · O(n!)
- Icono: nada
- Annotation: pattern `big-o.option` (botón Mono 16, `min-height: 56px`, `radius.control`, borde 2px estable). Siempre las mismas 8 en este orden, nunca dependiente de la respuesta. Grilla de 4 columnas en desktop y de 2 columnas en mobile (4 filas): «O(n log n)» entra sin cortar a 320 px. Grupo `role="radiogroup"` con nombre «Complejidad temporal de f(n)»; cada opción es un `role="radio"` con `aria-checked`. **Jugando** (el prototipo solo define el resultado; se deriva de la escala de Big O): sin elegir, fondo `#0F1318` y borde `#1E252E`, texto `text.muted`; elegida, fondo `#0B1522`, borde 2px `#5EB1FF`, texto `text.primary` 700 y un `●` antes del texto, para que la elección no dependa solo del color (NFR-U04). El verde queda reservado a la respuesta correcta del resultado. Tocar otra opción cambia la elección; ninguna opción se envía hasta confirmar

### seleccion
- Texto/label: > elegí una de las 8 opciones
- Icono: nada
- Annotation: línea de aviso del juego (Mono 13), siempre montada con `min-height` para no mover el layout; repite el último anuncio de la región viva `sr-only` (`aria-live="polite"`). Sin rojo ni shake: un rechazo no consume el intento. Textos: «> elegiste O(n²). Podés cambiarla hasta confirmar.», «> no pudimos registrar tu respuesta. Elegí una opción y confirmá de nuevo: no perdiste tu intento.» (`invalid_move`, CA 7), «> vas muy rápido. Esperá unos segundos y probá de nuevo.» (429)

### btn-confirmar
- Texto/label: Confirmar respuesta →
- Icono: nada (glifo final `→`, `aria-hidden`)
- Annotation: `button` `accent` de Big O (`#5EB1FF` / `#06121F`), tamaño `lg`, **ancho completo en todos los breakpoints**, en la columna principal justo debajo de `seleccion` (REQ-012, patrón común). Deshabilitado hasta elegir una opción: `aria-disabled="true"` y la etiqueta pasa a ser la instrucción «Elegí una opción», sin `→`; al elegir muestra «Confirmar respuesta →». Al tocarlo se valida `{ language, option }` y se envía una sola vez; mientras responde pasa a «Confirmando…» y las opciones y las pestañas quedan bloqueadas. Sin diálogo de confirmación: la selección y la confirmación ya son dos pasos (decisión #26)

### card-reglas
- Texto/label: // cómo se juega
- Texto secundario: 01 · Peor caso: cómo crecen las operaciones cuando n crece. · 02 · Un solo intento: elegí y confirmá. · 03 · El lenguaje es solo una vista: el que tengas abierto al confirmar queda como tu preferido. — Con teclado: flechas ← → para cambiar de lenguaje, Tab hasta las opciones, flechas para elegir y Enter en «Confirmar respuesta».
- Icono: nada
- Annotation: `SectionPanel` con cabecera `//` y `id={HELP_TARGET_ID}`: es el destino de «Cómo se juega» del header (`#game-help`) y el primer panel del lateral, con el mismo título que en los otros cuatro juegos (REQ-012). Inter 14 (`text-body-sm`) `text.body`; las reglas numeradas en Mono

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: abre O-01 (bottom-sheet en mobile, modal en desktop) con el aviso «No incluyas la respuesta si todavía estás jugando»; el contexto del reporte incluye el lenguaje visible (`code_language`). Con `reported: true` en `GameToday`, o tras un envío con éxito o `already_reported`, pasa al estado `ya reportado`: «Ya reportaste este desafío», deshabilitado y sin abrir O-01 (REQ-007)

### loader
- Texto/label: $ cargando tu partida de big-o…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: conservás tu intento.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: en `error de sistema` recarga la partida; en `sin sesión` recrea la sesión y vuelve a enviar la respuesta elegida

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. Es del shell e igual en todas las pantallas (REQ-002, C-07; REQ-003)

## Estados

### default
- Aplica: Sí
- Mensaje: > elegí una de las 8 opciones. El botón dice «Elegí una opción» y está deshabilitado.
- Cambios:
  - btn-confirmar: content="Elegí una opción", variant="disabled", annotation="deshabilitado hasta elegir una opción" (state_override)

### selección hecha
- Aplica: Sí (sub-estado de default)
- Mensaje: > elegiste O(n²). Podés cambiarla hasta confirmar.
- Cambios:
  - opciones: annotation="O(n²) elegida: fondo `#0B1522`, borde 2px `#5EB1FF`, `●` y `aria-checked=true`" (state_override)
  - seleccion: content="> elegiste O(n²). Podés cambiarla hasta confirmar." (state_override)
  - btn-confirmar: content="Confirmar respuesta →", variant="accent" (habilitado)

### confirmando
- Aplica: Sí (sub-estado de selección hecha)
- Mensaje: Confirmando…
- Cambios:
  - btn-confirmar: content="Confirmando…", variant="disabled" (state_override)
  - opciones: annotation="bloqueadas mientras responde el servidor" (state_override)

### error de validación
- Aplica: Sí (sub-estado de selección hecha)
- Mensaje: > no pudimos registrar tu respuesta. Elegí una opción y confirmá de nuevo: no perdiste tu intento.
- Cambios:
  - seleccion: content="> no pudimos registrar tu respuesta. Elegí una opción y confirmá de nuevo: no perdiste tu intento." (state_override)
  - Nota: `422 invalid_move` (opción o lenguaje fuera de los enums; no debería pasar desde la interfaz). La Play sigue `in_progress` y no se guarda ninguna preferencia (CA 7)

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
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - opciones: oculto en este estado (hidden_in_states)
  - seleccion: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - card-reglas: oculto en este estado (hidden_in_states)

### sin sesión
- Aplica: Sí (sub-estado de selección hecha)
- Mensaje: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Cambios:
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: visible en este estado, annotation="recrea la sesión y vuelve a enviar la respuesta elegida" (state_override)

### ya reportado
- Aplica: Sí (sub-estado de default; se combina con cualquier otro sub-estado)
- Mensaje: Ya reportaste este desafío.
- Cambios:
  - link-reportar: content="Ya reportaste este desafío", state="disabled", icon="check" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando tu partida de big-o…
- Cambios:
  - consigna: oculto en este estado (hidden_in_states)
  - titulo: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - opciones: oculto en este estado (hidden_in_states)
  - seleccion: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - card-reglas: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: conservás tu intento.
- Cambios:
  - consigna: oculto en este estado (hidden_in_states)
  - titulo: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - opciones: oculto en este estado (hidden_in_states)
  - seleccion: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - card-reglas: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- tabs-lenguaje · tocar pestaña o flechas ← → → muestra el mismo algoritmo en ese lenguaje; sin requests; la opción elegida se mantiene (CA 3)
- opciones · tocar una opción o flechas dentro del grupo → la elige (reemplaza la anterior); `seleccion` lo anuncia
- btn-confirmar · on click → envía `{ language: <pestaña visible>, option }` una sola vez → `big-o-resultado` (CA 4, 5)
- btn-confirmar · respuesta `invalid_move` → estado `error de validación`; 429 → `límite de jugadas`; `no_session` → `sin sesión`; `challenge_voided` → `anulado`; `game_finished` → `big-o-resultado`; `challenge_expired` → `big-o-instrucciones` con el aviso «día nuevo»
- link-reportar · on click → abre O-01 (bottom-sheet en mobile, modal en desktop)
- ES|EN del header → cambia la interfaz; el código, la opción elegida y el lenguaje visible no cambian

**Validaciones:**
- btn-confirmar · sin opción elegida → deshabilitado
- `{ language, option }` se valida en el cliente antes de enviar; el servidor vuelve a validar (NFR-S02)

**Feedback:**
- La elección y los rechazos se anuncian en `seleccion` (región viva), sin consumir el intento.

## Accesibilidad

- **Orden de foco:** header → titulo → pestañas de lenguaje → cuerpo del código → grupo de opciones → btn-confirmar → card-reglas (lectura) → link-reportar. El orden del DOM es el mismo en mobile y desktop: columna principal y luego lateral.
- **Landmarks y jerarquía:** `h1` es la pregunta; «tu respuesta» y «cómo se juega» son `h2` (la cabecera `//` de cada bloque). Landmarks: header (breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** pestañas con el patrón `tablist`/`tab`/`tabpanel` (flechas ← →, `aria-selected`, foco visible). Opciones como `radiogroup`: Tab entra y sale del grupo, las flechas mueven la elección (roving tabindex). Enter o Espacio en «Confirmar respuesta» envía. O-01 atrapa el foco y lo devuelve a `link-reportar`. Toda la partida se completa sin mouse (RF 15, CA 21).
- **Propio de esta composición:** la opción elegida se distingue con borde, peso y `●`, no solo con color (NFR-U04). El código es texto real, seleccionable y legible por lector de pantalla línea a línea; los números de línea son `aria-hidden`.

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Big O difiere por completo de la de los otros.
- Selección y confirmación en dos pasos (decisión #26), sin diálogo adicional.
- REQ-009: header `game-header` (`playing`) en lugar del header de plataforma y la tira `nav-movil`, como los otros tres juegos ya diseñados. En mobile desaparece la fila de `nav-movil`.
- REQ-009: el `h1` es la pregunta del prototipo con `f(n)` en el acento, y la consigna pasa a comentario `//` arriba, como en Tech Timeline; se elimina el `h2` «pregunta» aparte.
- REQ-009: las opciones son un `radiogroup` (y no botones `aria-pressed`): es selección única, las flechas recorren las 8 sin 8 paradas de Tab, y es el mismo patrón que las líneas elegibles de Bug Hunt (decisión 13 del diseño técnico la dejaba a esta revisión).
- REQ-009: 2 columnas de opciones en mobile y 4 en desktop. Resuelve el «Pendiente» del pattern `big-o.option` (4 columnas fijas no entran a 320 px). El estado «elegida» se deriva de la escala de Big O (tinte + borde 2px del acento + `●`) y no usa verde, que en el resultado significa «correcta».
- REQ-009: el lenguaje inicial es el preferido de la sesión y cambiar de pestaña no borra la opción elegida (CA 3). El lenguaje que se envía es el de la pestaña visible al confirmar (RF 5); por eso `card-reglas` lo dice explícitamente.
- REQ-009: durante la partida el código no muestra líneas resaltadas ni notas «n veces»: el prototipo las tiene porque es la vista de resultado, y acá serían la respuesta.
- REQ-009: el código lleva resaltado de sintaxis (Shiki, ADR-002 y supuesto «Accesibilidad / UX» del REQ) con fallback sin color; el DS de `code-block` hoy lo desaconseja, gap anotado en la Revisión UX.
- REQ-009: se suma `card-reglas` como destino de «Cómo se juega» del header (como la card «// reglas» de Tech Timeline), con la ayuda de teclado. En desktop ocupa la columna derecha sobre «Confirmar respuesta»; en mobile va después de confirmar para no empujar el código hacia abajo.
- REQ-009: estados `confirmando`, `error de validación` (`invalid_move`, CA 7), `límite de jugadas`, `anulado` (`challenge_voided`, CA 20), `sin sesión` y `ya reportado`, como en los otros juegos. La opción elegida no se guarda en el servidor: al retomar se ve el código sin selección (CA 8).

- REQ-012 (2026-11-25, patrón común de partida, S-064): «Confirmar respuesta» pasa a la columna principal, debajo de las opciones, a ancho completo en todos los breakpoints, con `→` y con la etiqueta «Elegí una opción» mientras está deshabilitado (reemplaza el `✓` y el motivo `sr-only`). El lateral queda «// cómo se juega» (antes «// reglas») y el reporte, siempre último. En mobile el orden es el del DOM: principal y después lateral.
- REQ-012 (S-066): el código no scrollea en horizontal: las líneas largas saltan con sangría colgante.

**Alternativas descartadas:**
- Tabs de lenguaje como overlay: es una vista inline (C-26).
- Opciones como `chips` en una sola fila con wrap: el ancho variable de cada opción mueve las posiciones al cambiar de ancho y dificulta encontrar una opción por posición.
- Guardar la opción elegida al cambiar de pestaña o al salir: el REQ fija que solo la confirmación crea la jugada (supuesto «Partida / estado»).
- Un diálogo «¿Confirmás O(n²)?»: los dos pasos ya evitan el toque accidental y un tercer paso alarga una partida de 1 minuto.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- F-07, C-26, C-27, C-36, C-10, C-11 · REQ-009 (RF 2-5, 8, 15; CA 2, 3, 6-8, 18, 20-22) · REQ-012 (S-064, S-066) · flujos 1, 2 y 4 de `user-flows.md`.
