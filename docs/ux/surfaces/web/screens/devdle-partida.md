---
name: devdle-partida
surface: web
route: /devdle
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

# Pantalla: Devdle · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Adivinar el término (de 4 a 12 letras) en hasta 6 intentos con teclado en pantalla y físico, leyendo el feedback por letra. Si se traba, puede revelar una letra (una pista por partida, no consume intento) o rendirse.
- **Viewports:**
  - **mobile** — bloque de título, tablero, aviso y teclado en pantalla; después el lateral (cómo se juega, categorías, distribución, Pista, Rendirse, Reportar), en el orden del DOM. El tablero escala sus celdas al ancho.
  - **desktop** — bloque de título a ancho completo; debajo, columna principal (tablero, aviso y teclado) y lateral (paneles y acciones), con el reparto principal/lateral del patrón común de los juegos (REQ-012). Devdle conserva su `flex-wrap` con `basis` (la principal crece, el lateral tiene ancho máximo `devdle-aside`).

## Entrada y salida

**Entradas:**
- `devdle-instrucciones` · «Empezar» (crea la Play)
- `home` · tarjeta «en curso» (retoma en el estado exacto, C-10)
- URL directa `/devdle` con una Play `in_progress`

**Salidas user-driven:**
- A `home` · marca `> nerdose` del header (la partida queda en curso)
- A `estadisticas` · botón «Estadísticas» del header (la partida queda en curso)
- A O-01 · «Reportar un problema» (`link-reportar`, salvo en `ya reportado`)
- A O-04 · «⚑ Rendirse» (`btn-rendirse`; variante Devdle del diálogo de confirmación)

**Salidas automáticas:**
- A `devdle-resultado` · al cerrarse la Play como ganada o perdida (el servidor decide), incluido rendirse (`{ give_up: true }` confirmado en O-04)
- A `devdle-resultado` · `game_finished` (la Play ya se cerró, por ejemplo desde otra pestaña)
- A `devdle-instrucciones` · `challenge_expired` (cambio de día con la partida abierta; llega con el aviso «día nuevo»)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · playing | layout | ambos | — | Breadcrumb `> nerdose / devdle`, «desafío del dd/mm», acciones de juego, idioma y racha |
| 3 | consigna | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Línea de comentario `//` con el largo del término y el intento actual; va primero en el bloque de título |
| 2 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | Consigna del juego («Adiviná el término del día»), debajo de la línea `//` |
| 4 | grilla-intentos | image | devdle.cell | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: eligiendo pista, pista usada | Tablero de 6 filas × N letras (4 a 12) con feedback por letra; muestra la letra de la pista como guía en la fila actual |
| 5 | aviso-jugada | alert | warning | feedback | ambos | visible_only_in_states: error de validación, faltan letras, límite de jugadas, eligiendo pista; state_overrides: faltan letras, límite de jugadas, eligiendo pista | Hint del juego: palabra fuera de la lista, faltan letras, demasiadas jugadas o la instrucción para elegir la casilla de la pista; nunca consume intento |
| 6 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de desafío anulado durante la partida |
| 7 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Explica que hace falta la cookie funcional (`no_session`) |
| 8 | teclado | image | devdle.key | input | ambos | hidden_in_states: loading, error de sistema, anulado | Teclado en pantalla QWERTY con Enviar y Borrar (también se acepta el físico) |
| 10 | leyenda | chips | devdle.legend | content | ambos | hidden_in_states: loading, error de sistema | Panel de ayuda «// cómo se juega»: cómo leer las marcas. Primero del lateral |
| 9 | pista-categorias | chips | chip.neutral | content | ambos | hidden_in_states: loading, error de sistema | Pista: las 8 categorías posibles (fijas) |
| 9b | distribucion | card | devdle.distribution | content | ambos | visible solo si el host pasa las stats de Devdle; hidden_in_states: loading, error de sistema | Distribución de intentos con la racha de Devdle, jugadas y % de victorias (sin resaltar hoy) |
| 9c | btn-pista | button | secondary · fullWidth | input | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: eligiendo pista, pista usada | «💡 Pista»: revela la letra de una posición de la fila actual. Una por partida, no consume intento |
| 9d | btn-rendirse | button | error-outline · fullWidth | input | ambos | hidden_in_states: loading, error de sistema, anulado | «⚑ Rendirse»: abre O-04 (confirmación). Justo debajo de la Pista |
| 11 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema; state_overrides: ya reportado | Abre O-01 para avisar que el desafío está mal (C-36); deshabilitado si el jugador ya reportó este desafío. Siempre último del lateral |
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
- grilla-intentos
- aviso-jugada
- teclado
- leyenda
- pista-categorias
- distribucion
- btn-pista
- btn-rendirse
- link-reportar

### desktop · 1200px
- banner-cookies
- loader
- alerta-sistema
- btn-reintentar
- row `titulo` (12/12): consigna, titulo, alerta-anulado
- row `juego`
  - col 7/12 (principal): grilla-intentos, aviso-jugada, teclado
  - col 5/12 (lateral): leyenda, pista-categorias, distribucion, btn-pista, btn-rendirse, link-reportar

## Contenido

### header
- Texto/label: > nerdose / devdle · desafío del 30/10 · [?] [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `playing` (REQ-004): «Cómo se juega» lleva a la leyenda de pistas de esta pantalla; «Estadísticas» → `estadisticas`; Compartir deshabilitado («disponible al terminar la partida»); ES|EN cambia el idioma sin perder la partida; píldora con la racha global. Sin nav global ni `nav-movil`

### consigna
- Texto/label: // término técnico · 6 letras · intento 4 de 6
- Icono: nada
- Annotation: línea de comentario `font-mono text-label-comment`, primera del bloque de título (alineado a la izquierda, a ancho completo). El largo sale de la vista pública (`length`, 4 a 12) y el intento del estado de la Play; al retomar muestra el intento real

### titulo
- Texto/label: Adiviná el término del día
- Icono: nada
- Annotation: `h1` debajo de la línea `//` (patrón común de partida, REQ-012). Después van los avisos (`notices`) del host

### grilla-intentos
- Texto/label: Tablero de 6 intentos × 6 letras · intentos anteriores con su feedback, fila actual escrita, filas vacías
- Asset: placeholder 6:6
- Icono: nada
- Annotation: pattern `devdle.cell` (`role="grid"`). Columnas = largo del término (4 a 12); las celdas escalan al ancho disponible (a 320 px y 12 letras bajan de tamaño y de gap). Cada celda suma símbolo además del color (✓ en su lugar, ~ en otro lugar, ✗ no está, NFR-U04) y `aria-label` «{letra}, {correcta|en otra posición|no está}». Al retomar se pintan los intentos guardados en el servidor (C-10). Si la pista se usó, la casilla de esa posición en la fila actual muestra la letra como guía (borde punteado del acento de Devdle, texto atenuado, `aria-label` «{letra}, pista») mientras el jugador no escriba en ella. En `eligiendo pista`, las casillas libres de la fila actual (sin las posiciones ya resueltas en verde) son botones «Revelar la letra N»

### aviso-jugada
- Texto/label: No está en la lista. Probá con otro término.
- Icono: warning
- Annotation: hint del juego bajo el tablero (`role=status`), no un error del sistema. En `eligiendo pista` muestra «> tocá una casilla de la fila actual para revelar su letra · Esc cancela». `not_in_word_list` no consume intento ni cambia el tablero; la fila escrita queda para corregir. Caracteres que no son A–Z (números, tildes, símbolos) se ignoran al escribir, con el aviso «Solo letras de la A a la Z.»

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: aparece si una jugada responde `challenge_voided`; el teclado se oculta y no se aceptan más jugadas

### banner-cookies
- Texto/label: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Icono: warning
- Annotation: banner `warning` (O-03); aparece si una jugada responde `no_session`. La jugada no se procesa

### teclado
- Texto/label: Teclado QWERTY en pantalla · letras, Enviar y Borrar
- Asset: placeholder 10:3
- Icono: nada
- Annotation: pattern `devdle.key`. Cada tecla refleja lo aprendido (correcta, presente, descartada) con texto/estilo además del color. El teclado físico funciona igual (letras, Enter, Backspace) y en mobile no se abre el teclado del sistema. Mientras se envía una jugada, Enviar queda deshabilitado. Va en la columna principal, debajo del tablero y del aviso: Devdle no tiene CTA aparte (Enviar/Enter es la acción principal)

### leyenda
- Texto/label: // cómo se juega
- Etiquetas: ✓ Letra correcta en el lugar correcto. · ~ Está en la palabra, pero en otra posición. · ✗ No está en la palabra.
- Icono: nada
- Annotation: pattern `devdle.legend` en un panel de sección con `id={HELP_TARGET_ID}`, el destino del botón «Cómo se juega» del header. Primero del lateral (patrón común, REQ-012)

### pista-categorias
- Texto/label: // pista de categoría
- Etiquetas: lenguajes · git · bases de datos · redes · linux · apis · seguridad · ingeniería de software
- Texto secundario: La categoría y la definición se revelan al terminar.
- Icono: nada
- Annotation: chips `neutral` informativos (no se tocan). La lista es la misma todos los días y no filtra la del día (REQ-004)

### distribucion
- Texto/label: // tus intentos · racha 3
- Texto secundario: 12 jugadas · 83% victorias
- Icono: nada
- Annotation: pattern `devdle.distribution` (barras 1–6 y X). Solo si el host pasa las stats de Devdle del jugador; en la partida no resalta ninguna barra

### btn-pista
- Texto/label: 💡 Pista
- Icono: nada (💡 decorativo, `aria-hidden`)
- Annotation: `button` `secondary` a ancho completo, en el lateral justo arriba de «Rendirse». Nombre accesible «Pista: revelar una letra (te queda 1)». Al tocarlo pasa a «Cancelar» (`aria-pressed=true`) y entra en `eligiendo pista`: las casillas libres de la fila actual se vuelven elegibles (las posiciones ya resueltas en verde no). Tocar una casilla envía la jugada `{ hint: posición }`; Esc, «Cancelar» o escribir una letra cancelan. Usada: deshabilitado «💡 Letra N: X» (nombre «Pista usada: la letra N es X»). Deshabilitado mientras se envía una jugada o con la partida terminada (REQ-012, S-063 y S-066)

### btn-rendirse
- Texto/label: ⚑ Rendirse
- Icono: nada (⚑ decorativo, `aria-hidden`)
- Annotation: `button` variant `error-outline` del DS a ancho completo (el mismo que Grep Grid). Abre O-04 en su variante Devdle; con el diálogo abierto el teclado físico no escribe en el tablero. Confirmar envía `{ give_up: true }`: la Play cierra como derrota (cuenta para la racha) y se navega a `devdle-resultado` con «Te rendiste: X/6» (REQ-012, S-066)

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: abre O-01 (bottom-sheet en mobile, modal en desktop) desde la partida, con el aviso de no incluir la respuesta. Visible también en `anulado` (C-36 acepta desafíos `voided`). Con `reported: true` en `GameToday`, o tras un envío con éxito o `already_reported`, pasa al estado `ya reportado`: «Ya reportaste este desafío», deshabilitado y sin abrir O-01 (REQ-007). Es el slot `aside` del host y va siempre último del lateral

### loader
- Texto/label: $ cargando tu partida de devdle…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.
- Icono: nada
- Annotation: también cubre una jugada que falla por red o 500: el intento no se registra y el tablero vuelve al último estado del servidor

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: en `sin sesión` recrea la sesión y reenvía la jugada

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. Es del shell e igual en todas las pantallas (REQ-002, C-07; REQ-003)

## Estados

### default
- Aplica: Sí
- Mensaje: Partida en curso: 6 intentos, teclado en pantalla y físico.
- Cambios: ninguno respecto de default.

### error de validación
- Aplica: Sí
- Mensaje: No está en la lista. Probá con otro término. (No consume intento.)
- Cambios:
  - aviso-jugada: solo visible en este estado (visible_only_in_states)

### faltan letras
- Aplica: Sí (sub-estado de error de validación)
- Mensaje: Faltan letras: el término tiene 6.
- Cambios:
  - aviso-jugada: content="Faltan letras: el término tiene 6.", annotation="el front no envía una palabra de otro largo (CA 7)" (state_override)

### límite de jugadas
- Aplica: Sí (sub-estado de error de validación)
- Mensaje: Vas muy rápido. Esperá unos segundos y probá de nuevo.
- Cambios:
  - aviso-jugada: content="Vas muy rápido. Esperá unos segundos y probá de nuevo.", annotation="HTTP 429 con mensaje genérico; la jugada no se procesa ni consume intento (NFR-S08)" (state_override)

### eligiendo pista
- Aplica: Sí (sub-estado de default)
- Mensaje: > tocá una casilla de la fila actual para revelar su letra · Esc cancela
- Cambios:
  - btn-pista: content="Cancelar", aria-pressed="true" (state_override)
  - grilla-intentos: las casillas libres de la fila actual son botones «Revelar la letra N» con borde punteado del acento de Devdle; las posiciones resueltas no (state_override)
  - aviso-jugada: content="> tocá una casilla de la fila actual para revelar su letra · Esc cancela" (state_override)

### pista usada
- Aplica: Sí (sub-estado de default; persiste al retomar)
- Mensaje: Letra 3: A
- Cambios:
  - btn-pista: content="💡 Letra 3: A", state="disabled" (state_override)
  - grilla-intentos: la casilla 3 de la fila actual muestra «A» como guía mientras esté vacía (state_override)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - teclado: oculto en este estado (hidden_in_states)
  - btn-pista: oculto en este estado (hidden_in_states)
  - btn-rendirse: oculto en este estado (hidden_in_states)

### sin sesión
- Aplica: Sí (sub-estado de default)
- Mensaje: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Cambios:
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: visible en este estado, annotation="recrea la sesión y reenvía la jugada" (state_override)

### ya reportado
- Aplica: Sí (sub-estado de default; se combina con cualquier otro sub-estado)
- Mensaje: Ya reportaste este desafío.
- Cambios:
  - link-reportar: content="Ya reportaste este desafío", state="disabled", icon="check" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando tu partida de devdle…
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - grilla-intentos: oculto en este estado (hidden_in_states)
  - pista-categorias: oculto en este estado (hidden_in_states)
  - leyenda: oculto en este estado (hidden_in_states)
  - distribucion: oculto en este estado (hidden_in_states)
  - teclado: oculto en este estado (hidden_in_states)
  - btn-pista: oculto en este estado (hidden_in_states)
  - btn-rendirse: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - grilla-intentos: oculto en este estado (hidden_in_states)
  - pista-categorias: oculto en este estado (hidden_in_states)
  - leyenda: oculto en este estado (hidden_in_states)
  - distribucion: oculto en este estado (hidden_in_states)
  - teclado: oculto en este estado (hidden_in_states)
  - btn-pista: oculto en este estado (hidden_in_states)
  - btn-rendirse: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- teclado (en pantalla o físico) · letra → la suma a la fila actual (en mayúsculas); Borrar/Backspace → borra la última
- Enviar/Enter con el largo exacto → envía la jugada; el servidor la valida y se pinta el feedback de la fila
- btn-pista · on click → `eligiendo pista`; casilla elegible · on click → envía `{ hint: posición }` (feedback `{ hint: { position, letter } }`, no consume intento) → `pista usada`; Esc / «Cancelar» / escribir → vuelve a default sin enviar nada
- btn-rendirse · on click → abre O-04 (Devdle); «Sí, rendirme» → envía `{ give_up: true }`; «Seguir jugando», Esc o ✕ → cierra sin cambios; si el envío falla, el diálogo queda abierto para reintentar o cerrar
- respuesta con la Play cerrada (`won`/`lost`) → navega a `devdle-resultado` con la solución, la distribución y las rachas
- respuesta `game_finished` → recarga y muestra `devdle-resultado` con el resultado ya registrado
- respuesta `challenge_expired` → carga el desafío nuevo y navega a `devdle-instrucciones` (estado `día nuevo`)
- respuesta `challenge_voided` → estado `anulado`; `no_session` → estado `sin sesión`; 429 → `límite de jugadas`
- ES|EN del header → cambia la interfaz sin perder el tablero
- link-reportar · on click → abre O-01 desde la partida, con el aviso de no incluir la respuesta; al cerrarlo el foco vuelve al enlace y la pantalla sigue igual. Tras «Gracias, recibimos tu reporte» o `already_reported` → estado `ya reportado` (REQ-007)

**Validaciones:**
- intento · caracteres que no son A–Z → se ignoran con el aviso «Solo letras de la A a la Z.»
- intento · largo distinto del término → el front no lo envía y avisa «Faltan letras: el término tiene N.»
- intento · palabra fuera de la lista → «No está en la lista. Probá con otro término.» (no consume intento)
- pista · una segunda pista o una posición fuera de la palabra → `invalid_move` en el servidor (el front no lo permite: tras usarla el botón queda deshabilitado y solo ofrece posiciones de la palabra)

**Feedback:**
- Las jugadas rechazadas muestran el aviso sin consumir el intento. Mientras se envía, Enviar queda deshabilitado (dos pestañas a la vez se procesan en serie en el servidor).

## Accesibilidad

- **Orden de foco:** header → consigna → titulo → tablero → teclado → leyenda → pista-categorias → distribucion → btn-pista → btn-rendirse → link-reportar.
- **Landmarks y jerarquía:** un único `h1` («Adiviná el término del día»); las cabeceras `//` de los paneles del lateral son `h2`. Landmarks: header (breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** la partida se completa solo con teclado físico (NFR-U03); las teclas en pantalla son botones con nombre («Enviar», «Borrar»). O-01 y O-04 atrapan el foco y lo devuelven al disparador. «Pista» expone `aria-pressed` mientras se elige la casilla y las casillas elegibles son botones con nombre «Revelar la letra N»; Esc cancela.
- **Propio de esta composición:** El feedback de cada jugada se anuncia en una región `aria-live=polite` («C correcta, A en otra posición, …»); cada celda tiene etiqueta accesible y el estado nunca depende solo del color (NFR-U04).

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Devdle difiere por completo de la de los otros.
- El día del desafío («desafío del dd/mm») está en el header, no en el cuerpo.
- REQ-004: header `game-header` (`playing`) en lugar del header de plataforma y la tira `nav-movil`.
- REQ-004: el tablero tiene de 4 a 12 columnas según el término (supuesto «Longitud de la palabra»); las celdas escalan al ancho en lugar de cambiar de layout.
- REQ-004: la pista de categorías lista las 8 categorías fijas del banco como chips `neutral` (antes era una `card` con categorías inventadas).
- REQ-004: un solo bloque `aviso-jugada` cubre los rechazos que no consumen intento (fuera de la lista, faltan letras, caracteres no válidos, 429), como hint del juego del DS.
- REQ-004: estados `anulado` y `sin sesión` para las respuestas `challenge_voided` y `no_session` a mitad de partida (CA 18, 19).
- REQ-004: «Reportar un problema» queda documentado pero no se renderiza hasta FG-6. Superado por REQ-007.
- REQ-007: «Reportar un problema» se renderiza en los tres juegos (deja de estar oculto hasta FG-6). Es un enlace secundario al final de la columna lateral, no un botón, para no competir con la acción del juego; el estado «ya reportado» se lee de `GameToday.reported` para no ofrecer un intento que va a fallar.

- REQ-012 (implementado fuera del workflow el 2026-11-25, documentado en retrospectiva): patrón común de partida de los 5 juegos (S-064). Bloque de título con la línea `//` primero y el `h1` después, «cómo se juega» primero en el lateral (con `HELP_TARGET_ID`) y «Reportar un problema» siempre último; el teclado queda en la columna principal, debajo del tablero.
- REQ-012: pista de letra (S-063, S-066). Una por partida, no consume intento; se pide con un botón a ancho completo en el lateral, arriba de «Rendirse», y se elige la casilla en el tablero (las posiciones ya resueltas no se ofrecen). Reemplaza la primera versión, que tenía su propio panel con un botón por posición.
- REQ-012: «⚑ Rendirse» en Devdle (S-066), con el `button` `error-outline` compartido con Grep Grid y confirmación en O-04.

**Alternativas descartadas:**
- Modal de instrucciones dentro de la partida: queda en la fase de instrucciones; el header lleva a la leyenda.
- Un toast para los rechazos: el DS no tiene toast y el hint junto al tablero queda donde el jugador mira.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- F-04, C-15, C-16, C-10, C-11, C-36 · REQ-004 (RF 4-11, 25; CA 3-7, 17-22, 36) · flujos 1 y 2 de `user-flows.md` · REQ-007 (RF 1, 9; CA 1-3, 24) · REQ-012 (S-063, S-064, S-066).
