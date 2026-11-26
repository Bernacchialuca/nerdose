---
name: grep-grid-partida
surface: web
route: /grep-grid
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.3"
date: 2026-11-25
---

# Pantalla: Grep Grid · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Encontrar las 8 palabras de la lista en la grilla de 12×12 tocando (o marcando con el teclado) la primera y la última letra de cada una, leer la definición de cada palabra encontrada, seguir el contador `N/8`, sin tiempo y con «Rendirse» siempre disponible.
- **Viewports:**
  - **mobile** — línea de comentario y título, grilla 12×12 escalada al ancho (sin scroll horizontal desde 320 px), hint de consola, panel «// cómo se juega», lista de palabras, «Rendirse» y reporte en una columna, en el orden del DOM; «Rendirse» queda separado de la grilla para evitar un toque accidental.
  - **desktop** — bloque de título (comentario + `h1`) a todo el ancho; debajo, grilla y hint en la columna principal (7/12) y, en el lateral (5/12), «// cómo se juega», la lista de palabras (con el contador `N/8` en su encabezado), «Rendirse» y el reporte, en ese orden, alineados arriba (patrón común de partida, REQ-012).

## Entrada y salida

**Entradas:**
- `grep-grid-instrucciones` · «Empezar» (crea la Play con 0/8)
- `home` · tarjeta «en curso» (retoma en el estado exacto: palabras encontradas, marcadas y con su definición, C-10)
- URL directa `/grep-grid` con una Play `in_progress`

**Salidas user-driven:**
- A O-04 · «Rendirse» (confirmación)
- A `home` · marca `> nerdose` del header (la partida queda en curso)
- A `estadisticas` · botón «Estadísticas» del header (la partida queda en curso)
- A O-01 · «Reportar un problema» (`link-reportar`, salvo en `ya reportado`)

**Salidas automáticas:**
- A `grep-grid-resultado` · al cerrarse la Play como ganada (octava palabra) o perdida (rendirse confirmado); el servidor decide
- A `grep-grid-resultado` · `game_finished` (la Play ya se cerró, por ejemplo desde otra pestaña)
- A `grep-grid-instrucciones` · `challenge_expired` (cambio de día con la partida abierta; llega con el aviso «día nuevo»)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · playing | layout | ambos | — | Breadcrumb `> nerdose / grep-grid`, «desafío del dd/mm», acciones de juego, idioma y racha |
| 2 | consigna | paragraph | label-comment | content | ambos | hidden_in_states: loading, error de sistema | Línea de comentario `// ` arriba del `h1`: prompt de terminal y consigna de la partida |
| 3 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | Consigna principal de la partida |
| 4 | contador | card | counter | content | ambos | hidden_in_states: loading, error de sistema | Contador `N/8 encontradas` (reemplaza el reloj; sin cronómetro en ningún punto) |
| 5 | grilla | image | grep-grid.cell | content | ambos | hidden_in_states: loading, error de sistema | Grilla 12×12 de letras, `role="grid"`, celdas tocables y navegables con teclado |
| 6 | hint-jugada | paragraph | caption | feedback | ambos | hidden_in_states: loading, error de sistema; state_overrides: primera letra marcada, error de validación, selección inválida, límite de jugadas | Línea de consola `grep-grid.hint`: guía los dos toques y anuncia el resultado de cada selección; nunca penaliza |
| 7 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de desafío anulado durante la partida |
| 8 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Explica que hace falta la cookie funcional (`no_session`) |
| 8b | panel-ayuda | card | panel | content | ambos | hidden_in_states: loading, error de sistema | Panel «// cómo se juega» (ancla del «?» del header, `HELP_TARGET_ID`), primero del lateral: las 3 reglas de la partida |
| 9 | lista-palabras | list | grep-grid.word | content | ambos | hidden_in_states: loading, error de sistema | Las 8 palabras en orden fijo: pendientes con su largo; encontradas tachadas, con ✓ y su definición |
| 10 | btn-rendirse | button | error-outline | input | ambos | hidden_in_states: loading, error de sistema, anulado | Abre O-04 para cerrar la partida como perdida con `N/8` (C-20) |
| 11 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema; state_overrides: ya reportado | Abre O-01 para avisar que el desafío está mal (C-36); deshabilitado si el jugador ya reportó este desafío |
| 12 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 13 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 14 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema, sin sesión; state_overrides: sin sesión | Reintentar la carga o recrear la sesión |
| 15 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- banner-cookies
- consigna
- titulo
- loader
- alerta-sistema
- btn-reintentar
- alerta-anulado
- contador
- grilla
- hint-jugada
- panel-ayuda
- lista-palabras
- btn-rendirse
- link-reportar

### desktop · 1200px
- banner-cookies
- loader
- alerta-sistema
- btn-reintentar
- row `juego`
  - col 12/12: consigna, titulo, alerta-anulado
  - col 7/12: grilla, hint-jugada
  - col 5/12: panel-ayuda, lista-palabras (contador `N/8` en el encabezado), btn-rendirse, link-reportar

## Contenido

### header
- Texto/label: > nerdose / grep-grid · desafío del 30/10 · [?] [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `playing` (REQ-005): «Cómo se juega» lleva al panel `panel-ayuda` («// cómo se juega») del lateral de esta misma pantalla (con la Play en curso el servidor no vuelve a mostrar la fase de instrucciones); «Estadísticas» → `estadisticas`; Compartir deshabilitado («disponible al terminar la partida»); ES|EN cambia el idioma sin perder la partida: las definiciones de las encontradas se recargan en el idioma nuevo, la grilla y las palabras no cambian (CA 19); píldora con la racha global. Sin nav global ni `nav-movil`

### consigna
- Texto/label: // $ grep -o '[A-Z]*' hoy.txt · tocá la primera y la última letra de cada palabra
- Icono: nada
- Annotation: línea de comentario del bloque de título, **arriba** del `h1` (patrón común, REQ-012): toda la línea en Mono `label-comment` `text.dim`, con el `// ` decorativo (`aria-hidden`). Sin «tu tiempo final es tu puntaje» (se elimina: el puntaje son las palabras encontradas, C-22)

### titulo
- Texto/label: Encontrá las 8 palabras escondidas
- Icono: nada
- Annotation: la consigna es el `h1` de la partida (como Devdle y Tech Timeline); el nombre del juego queda para las instrucciones y el breadcrumb. Alineado a la izquierda, a ancho completo

### contador
- Texto/label: 3/8 (en el encabezado de `lista-palabras`; «encontradas» `sr-only`)
- Icono: nada
- Annotation: dato `N/8` en Mono bold con el acento del juego, a la derecha de «// palabras de hoy»; no es live region (el avance lo anuncia `hint-jugada`). Al retomar muestra el valor real de la Play (CA 14). No hay segunda tarjeta de tiempo: el prototipo la mostraba y el PRD la elimina (decisión #6)

### grilla
- Texto/label: Grilla 12×12 · 144 letras A–Z · las celdas de las palabras encontradas quedan marcadas
- Asset: placeholder 1:1
- Icono: nada
- Annotation: pattern `grep-grid.board` / `grep-grid.cell` (`role="grid"`, 12 filas, roving tabindex). Primer toque marca la celda inicial (estado «inicio seleccionado»); el segundo envía `{ from, to }` al servidor, que decide; tocar de nuevo la inicial la desmarca sin enviar nada. Las celdas encontradas se pintan con el relleno del acento **y** con el peso/glifo del DS (NFR-U04), no solo con el color. Nunca se pintan posiciones de palabras no encontradas: el cliente no las conoce hasta el cierre (RF 2, CA 15). A 320 px las celdas escalan al ancho con `aspect-ratio: 1` y la página no scrollea en horizontal (CA 36); se acepta un área táctil menor a 40 px como adaptación documentada en el DS. Con `locked` (anulado) la grilla no acepta entrada

### hint-jugada
- Texto/label: > tocá la primera letra de una palabra
- Icono: nada
- Annotation: `grep-grid.hint`: Mono 13 `text.dim`, siempre montada con `min-height` para no mover el layout, `aria-live="polite"`. Es un hint del juego, no un error del sistema: sin rojo ni shake. Cambia según el estado: «> ahora tocá la última letra», «> no es una palabra de la lista, probá de nuevo», «> las palabras se marcan de la primera a la última letra, hacia adelante», «> vas muy rápido. Esperá unos segundos y probá de nuevo». Al encontrar una palabra anuncia «> DOCKER encontrada · 4/8». Una palabra ya encontrada que se vuelve a seleccionar no muestra aviso (`already_found`, CA 7)

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: aparece si una selección responde `challenge_voided` (CA 22); la grilla queda bloqueada y «Rendirse» se oculta

### banner-cookies
- Texto/label: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Icono: warning
- Annotation: banner `warning` (O-03); aparece si una selección responde `no_session` (CA 23). La selección no se procesa

### panel-ayuda
- Texto/label: // cómo se juega · Tocá la primera letra de una palabra y después la última. Tocar de nuevo el inicio cancela la selección. · Van en 4 direcciones, siempre hacia adelante: → horizontal, ↓ vertical, ↘ y ↗ en diagonal. Nunca al revés. · No hay reloj. Podés rendirte cuando quieras y ver las palabras que faltaban.
- Icono: nada
- Annotation: `SectionPanel` del juego con `id = HELP_TARGET_ID` (destino del «?» del header), cabecera `h2` «// cómo se juega» y las reglas en `body-sm`. Es el primer bloque del lateral (patrón común, REQ-012). Sigue visible en `anulado`

### lista-palabras
- Texto/label: // palabras de hoy
- Forma: lista de 8 filas en el orden fijo que envía el servidor; cada fila: nombre de la palabra + etiqueta («{n} letras» si está pendiente; «✓» si fue encontrada) + definición breve solo en las encontradas
- Icono: nada
- Annotation: pattern `grep-grid.word`. Encontrada = nombre tachado, tinte del acento y definición en el idioma activo (el momento de aprendizaje, RF 4). Las definiciones de las no encontradas no llegan al cliente hasta el cierre (RF 2). El orden de la lista no cambia al encontrar palabras, para que el jugador no pierda la referencia. La cabecera `//` es `h2`

### btn-rendirse
- Texto/label: Rendirse
- Icono: flag (⚑, decorativo)
- Annotation: `buttonClass({ variant: 'error-outline', fullWidth: true })` (REQ-012, S-066): borde `status.error.border`, texto `status.error.soft`, sin relleno; hover con fondo `status.error.bg`. A ancho completo del lateral, debajo de la lista de palabras y arriba del reporte. Separado de la grilla por la lista de palabras (mobile) o en la columna lateral (desktop) para evitar un toque accidental (CA 36). Abre O-04; disponible desde 0/8 (CA 12). Mientras se envía la rendición queda `aria-disabled`. Es el mismo botón que «⚑ Rendirse» de Devdle

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: abre O-01 (bottom-sheet en mobile, modal en desktop) desde la partida, con el aviso de no incluir la respuesta. Visible también en `anulado` (C-36 acepta desafíos `voided`). Con `reported: true` en `GameToday`, o tras un envío con éxito o `already_reported`, pasa al estado `ya reportado`: «Ya reportaste este desafío», deshabilitado y sin abrir O-01 (REQ-007)

### loader
- Texto/label: $ cargando tu partida de grep-grid…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.
- Icono: nada
- Annotation: también cubre una selección que falla por red o 500: la selección no se registra y la grilla vuelve al último estado del servidor

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: en `sin sesión` recrea la sesión y reenvía la selección

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. Es del shell e igual en todas las pantallas (REQ-002, C-07; REQ-003)

## Estados

### default
- Aplica: Sí
- Mensaje: 3/8 encontradas: sin cronómetro, con «Rendirse» siempre disponible.
- Cambios: ninguno respecto de default.

### primera letra marcada
- Aplica: Sí (sub-estado de default)
- Mensaje: > ahora tocá la última letra
- Cambios:
  - hint-jugada: content="> ahora tocá la última letra" (state_override)
  - grilla: annotation="la celda inicial se muestra en el estado «inicio seleccionado» del DS (tinte + borde del acento); Escape o tocar la misma celda la desmarca sin enviar nada" (state_override)

### error de validación
- Aplica: Sí
- Mensaje: > no es una palabra de la lista, probá de nuevo
- Cambios:
  - hint-jugada: content="> no es una palabra de la lista, probá de nuevo", annotation="`feedback.reason = not_a_word`: una línea válida hacia adelante que no coincide exactamente con una de las 8 palabras (incluido un tramo parcial). Sin penalización ni cambio de estado (CA 6)" (state_override)

### selección inválida
- Aplica: Sí (sub-estado de error de validación)
- Mensaje: > las palabras se marcan de la primera a la última letra, hacia adelante
- Cambios:
  - hint-jugada: content="> las palabras se marcan de la primera a la última letra, hacia adelante", annotation="`422 invalid_move`: selección en reversa, no alineada, de una sola celda o fuera de la grilla. La partida no cambia (CA 4, 8)" (state_override)

### límite de jugadas
- Aplica: Sí (sub-estado de error de validación)
- Mensaje: > vas muy rápido. Esperá unos segundos y probá de nuevo
- Cambios:
  - hint-jugada: content="> vas muy rápido. Esperá unos segundos y probá de nuevo", annotation="HTTP 429 con mensaje genérico; la selección no se procesa (CA 24, NFR-S08)" (state_override)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - btn-rendirse: oculto en este estado (hidden_in_states)
  - grilla: annotation="bloqueada: no acepta toques ni teclado" (state_override)

### sin sesión
- Aplica: Sí (sub-estado de default)
- Mensaje: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Cambios:
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: visible en este estado, annotation="recrea la sesión y reenvía la selección" (state_override)

### ya reportado
- Aplica: Sí (sub-estado de default; se combina con cualquier otro sub-estado)
- Mensaje: Ya reportaste este desafío.
- Cambios:
  - link-reportar: content="Ya reportaste este desafío", state="disabled", icon="check" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando tu partida de grep-grid…
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - contador: oculto en este estado (hidden_in_states)
  - grilla: oculto en este estado (hidden_in_states)
  - hint-jugada: oculto en este estado (hidden_in_states)
  - panel-ayuda: oculto en este estado (hidden_in_states)
  - lista-palabras: oculto en este estado (hidden_in_states)
  - btn-rendirse: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - contador: oculto en este estado (hidden_in_states)
  - grilla: oculto en este estado (hidden_in_states)
  - hint-jugada: oculto en este estado (hidden_in_states)
  - panel-ayuda: oculto en este estado (hidden_in_states)
  - lista-palabras: oculto en este estado (hidden_in_states)
  - btn-rendirse: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- grilla · primer toque (o Enter/Espacio sobre una celda) → marca la celda inicial; estado `primera letra marcada`
- grilla · segundo toque en otra celda → envía `{ type: select, from, to }`; el servidor valida (el cliente nunca decide si es correcta, RF 3)
- grilla · tocar de nuevo la celda inicial o Escape → desmarca sin enviar nada
- respuesta `feedback.found` → la palabra se tacha en `lista-palabras`, sus celdas se marcan en `grilla`, aparece su definición en el idioma activo, `contador` suma 1 y `hint-jugada` anuncia «> {PALABRA} encontrada · N/8» (CA 3, 5)
- respuesta `feedback.reason = not_a_word` → estado `error de validación`, sin cambio de estado de la partida (CA 6)
- respuesta `feedback.reason = already_found` → se ignora: sin aviso, sin cambio del contador (CA 7)
- respuesta `422 invalid_move` → estado `selección inválida` (CA 4, 8)
- respuesta con la Play cerrada (`won` al encontrar la octava) → navega a `grep-grid-resultado` con las 8 palabras, sus definiciones y las rachas (CA 9)
- btn-rendirse · on click → abre O-04; «Sí, rendirme» envía `{ type: give_up }` y la respuesta `lost` navega a `grep-grid-resultado` (CA 10, 12); «Seguir jugando» o Escape cierran O-04 sin request y devuelven el foco a `btn-rendirse` (CA 11)
- respuesta `game_finished` → recarga y muestra `grep-grid-resultado` con el resultado ya registrado (CA 13)
- respuesta `challenge_expired` → carga el desafío nuevo y navega a `grep-grid-instrucciones` (estado `día nuevo`, CA 20)
- respuesta `challenge_voided` → estado `anulado` (CA 22); `no_session` → estado `sin sesión` (CA 23); 429 → `límite de jugadas` (CA 24)
- ES|EN del header → recarga la vista pública: las definiciones de las encontradas cambian de idioma; grilla, palabras y encontradas no cambian (CA 19)
- link-reportar · on click → abre O-01 desde la partida, con el aviso de no incluir la respuesta; al cerrarlo el foco vuelve al enlace y la pantalla sigue igual. Tras «Gracias, recibimos tu reporte» o `already_reported` → estado `ya reportado` (REQ-007)

**Validaciones:**
- selección · `from` igual a `to`, celdas no alineadas en una de las 4 direcciones hacia adelante, en reversa o fuera de 0–11 → el servidor responde `invalid_move` → «> las palabras se marcan de la primera a la última letra, hacia adelante»
- selección · línea válida que no es una de las 8 palabras → «> no es una palabra de la lista, probá de nuevo»
- selección · palabra ya encontrada → se ignora sin aviso

**Feedback:**
- Ninguna selección penaliza: no hay límite de intentos ni cronómetro; el único freno es el rate limit general (60/min por jugador). Mientras se envía una selección, la grilla no acepta otra (dos pestañas a la vez se procesan en serie en el servidor: la palabra se cuenta una sola vez, CA 25).

## Accesibilidad

- **Orden de foco:** header → titulo → grilla (una sola parada de tabulación; dentro, las flechas) → hint → panel-ayuda y lista-palabras (lectura) → btn-rendirse → link-reportar.
- **Landmarks y jerarquía:** `h1` con la consigna; las cabeceras `// cómo se juega` y `// palabras de hoy` son `h2`. Landmarks: header (breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** la grilla es `role="grid"` con roving tabindex: las flechas mueven el foco entre las 144 celdas, Enter o Espacio marcan la primera y la última celda, Escape cancela la celda inicial (NFR-U03, CA 35). O-04 atrapa el foco y lo devuelve a `btn-rendirse` al cerrarse (CA 11). O-01, cuando exista, igual.
- **Propio de esta composición:** cada celda anuncia «{letra}, fila {r}, columna {c}, {encontrada|inicio|libre}»; el resultado de cada selección (encontrada, no es una palabra, selección inválida, límite) se anuncia una sola vez en `hint-jugada` (`aria-live=polite`), y el contador en `role=status`. Las celdas encontradas se distinguen por relleno más peso/glifo, nunca solo por color (NFR-U04). Textos cortos para que la región viva no sea ruidosa con 144 celdas.

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Grep Grid difiere por completo de la de los otros.
- El `#número` del desafío va en el header, no en el cuerpo; el cuerpo lleva el prompt del prototipo como consigna.
- Grep Grid sin tiempo: el contador `N/8` reemplaza al reloj del prototipo (decisión #6); «Rendirse» es un botón de la pantalla (decisión #7).
- REQ-005: header `game-header` (`playing`) en lugar del header de plataforma y la tira `nav-movil`, como Devdle (supuesto «Cabecera de las pantallas»).
- REQ-005: el contador es una `card` `counter` del DS (la pieza que el prototipo usa para «3/8 encontradas»), en lugar de un `h2`; la segunda tarjeta del prototipo («02:14 tiempo») se elimina.
- REQ-005: la alerta de «no es una palabra» se reemplaza por la línea de consola `grep-grid.hint` del DS, siempre montada y silenciosa (gris, sin rojo), con `aria-live`. Un solo bloque cubre guía de los dos toques, `not_a_word`, `invalid_move` y 429; `already_found` no muestra nada (supuestos «Selección en reversa», «Qué es invalid_move…», «Palabra ya encontrada»).
- REQ-005: estados `anulado` y `sin sesión` para las respuestas `challenge_voided` y `no_session` a mitad de partida (CA 22, 23), como Devdle.
- REQ-005: «Rendirse» usa la variant `outline-tinted` con tinte de error del DS (destructiva suave), no un relleno rojo: la identidad pide error sin dramatismo y el modal O-04 ya protege de un toque accidental.
- REQ-005: la grilla entra completa a 320 px sin scroll horizontal (CA 36, NFR-U01): celdas con `aspect-ratio: 1` escaladas al ancho, como se resolvió para Devdle; el área táctil por debajo de 40 px se acepta como adaptación documentada en el DS (supuesto «Ancho mínimo»). El `overflow-x: auto` del prototipo se descarta.
- REQ-005: anti-spoiler en la vista: la grilla y la lista solo conocen posiciones y definiciones de lo ya encontrado (RF 2, CA 15); por eso la lista no muestra definiciones pendientes ni «pistas» de posición.
- REQ-005: «Reportar un problema» queda documentado pero no se renderiza hasta FG-6. Superado por REQ-007.
- REQ-007: «Reportar un problema» se renderiza en los tres juegos (deja de estar oculto hasta FG-6). Es un enlace secundario al final de la columna lateral, no un botón, para no competir con la acción del juego; el estado «ya reportado» se lee de `GameToday.reported` para no ofrecer un intento que va a fallar.
- REQ-012 (S-064, patrón común de partida, implementado fuera del workflow el 2026-11-25): la línea de comentario pasa arriba del `h1` y en una sola pieza Mono; el ancla de «Cómo se juega» deja de ser el bloque de título y pasa al panel nuevo `panel-ayuda`, primero del lateral; el lateral queda «cómo se juega» → lista → «Rendirse» → reporte (siempre último).
- REQ-012 (S-066): «Rendirse» usa la variant nueva `error-outline` de `buttonClass` (reemplaza la clase ad-hoc `outline-tinted` de error del paquete), a ancho completo y con el glifo ⚑ en vez de ✕; la confirmación de O-04 usa `error` (relleno rojo). Supera la decisión de REQ-005 sobre `outline-tinted`.

**Alternativas descartadas:**
- Modal de instrucciones dentro de la partida: las reglas quedan en la fase de instrucciones; durante la partida, «Cómo se juega» del header lleva a la consigna y al hint de esta pantalla.
- Selección arrastrando el dedo sobre las celdas: el PRD define la mecánica como dos toques y el arrastre no se traslada al teclado.
- Alerta roja para la selección fallida: el DS define el hint de Grep Grid como silencioso y la jugada no penaliza; un error rojo sugeriría castigo.
- Mostrar las posiciones de las palabras no encontradas al pasar el mouse o como pista: rompe NFR-S01/S04.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla. La pregunta 6 del product-map (confirmación de «Rendirse») quedó resuelta por REQ-005: O-04 se implementa.

- 2026-11-11 (pedido del usuario): el contador deja de ser una `card` `counter` sobre la grilla y pasa a un `N/8` rosa en el encabezado de `lista-palabras` (mismo tamaño en toda la partida; «encontradas» queda para lectores). Sin la card, la grilla arranca a la altura del título y entra en pantalla.

## Trazabilidad

- F-05, C-19, C-20, C-10, C-11, C-36 · REQ-005 (RF 2-11, 19, 22; CA 2-8, 11, 13, 14, 19, 20, 22-25, 35, 36) · flujos 1 y 2 de `user-flows.md` · REQ-007 (RF 1, 9; CA 1-3, 24) · REQ-012 (S-064, S-066).
