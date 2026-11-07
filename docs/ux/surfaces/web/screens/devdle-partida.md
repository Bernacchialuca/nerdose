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
version: "1.1"
date: 2026-11-06
---

# Pantalla: Devdle · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Adivinar el término (de 4 a 12 letras) en hasta 6 intentos con teclado en pantalla y físico, leyendo el feedback por letra.
- **Viewports:**
  - **mobile** — consigna, tablero, avisos, teclado en pantalla y pistas apilados; el teclado queda al alcance del pulgar y el tablero escala sus celdas al ancho.
  - **desktop** — tablero a la izquierda (7/12) y pistas + teclado a la derecha (5/12), como el layout tablero + aside del prototipo, para ver todo sin scroll.

## Entrada y salida

**Entradas:**
- `devdle-instrucciones` · «Empezar» (crea la Play)
- `home` · tarjeta «en curso» (retoma en el estado exacto, C-10)
- URL directa `/devdle` con una Play `in_progress`

**Salidas user-driven:**
- A `home` · marca `> nerdose` del header (la partida queda en curso)
- A `estadisticas` · botón «Estadísticas» del header (la partida queda en curso)
- A O-01 · «Reportar un problema» (cuando exista, FG-6)

**Salidas automáticas:**
- A `devdle-resultado` · al cerrarse la Play como ganada o perdida (el servidor decide)
- A `devdle-resultado` · `game_finished` (la Play ya se cerró, por ejemplo desde otra pestaña)
- A `devdle-instrucciones` · `challenge_expired` (cambio de día con la partida abierta; llega con el aviso «día nuevo»)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · playing | layout | ambos | — | Breadcrumb `> nerdose / devdle`, `#número`, acciones de juego, idioma y racha |
| 2 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | Nombre del juego |
| 3 | consigna | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Largo del término e intento actual |
| 4 | grilla-intentos | image | devdle.cell | content | ambos | hidden_in_states: loading, error de sistema | Tablero de 6 filas × N letras (4 a 12) con feedback por letra |
| 5 | aviso-jugada | alert | warning | feedback | ambos | visible_only_in_states: error de validación, faltan letras, límite de jugadas; state_overrides: faltan letras, límite de jugadas | Hint del juego: palabra fuera de la lista, faltan letras o demasiadas jugadas; nunca consume intento |
| 6 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de desafío anulado durante la partida |
| 7 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Explica que hace falta la cookie funcional (`no_session`) |
| 8 | teclado | image | devdle.key | input | ambos | hidden_in_states: loading, error de sistema, anulado | Teclado en pantalla QWERTY con Enviar y Borrar (también se acepta el físico) |
| 9 | pista-categorias | chips | chip.neutral | content | ambos | hidden_in_states: loading, error de sistema | Pista: las 8 categorías posibles (fijas) |
| 10 | leyenda | chips | devdle.legend | content | ambos | hidden_in_states: loading, error de sistema | Cómo leer las pistas |
| 11 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Abre O-01 para avisar que el desafío está mal (FG-6) |
| 12 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 13 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 14 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema, sin sesión; state_overrides: sin sesión | Reintentar la carga o recrear la sesión |
| 15 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- banner-cookies
- titulo
- loader
- alerta-sistema
- btn-reintentar
- alerta-anulado
- consigna
- grilla-intentos
- aviso-jugada
- teclado
- pista-categorias
- leyenda
- link-reportar

### desktop · 1200px
- banner-cookies
- loader
- alerta-sistema
- btn-reintentar
- row `juego`
  - col 7/12: titulo, consigna, alerta-anulado, grilla-intentos, aviso-jugada
  - col 5/12: pista-categorias, leyenda, teclado, link-reportar

## Contenido

### header
- Texto/label: > nerdose / devdle · #8 · [?] [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `playing` (REQ-004): «Cómo se juega» lleva a la leyenda de pistas de esta pantalla; «Estadísticas» → `estadisticas`; Compartir deshabilitado («disponible al terminar la partida»); ES|EN cambia el idioma sin perder la partida; píldora con la racha global. Sin nav global ni `nav-movil`

### titulo
- Texto/label: Devdle
- Icono: nada
- Annotation: nada

### consigna
- Texto/label: // término técnico · 6 letras · intento 4 de 6
- Icono: nada
- Annotation: el largo sale de la vista pública (`length`, 4 a 12) y el intento del estado de la Play; al retomar muestra el intento real

### grilla-intentos
- Texto/label: Tablero de 6 intentos × 6 letras · intentos anteriores con su feedback, fila actual escrita, filas vacías
- Asset: placeholder 6:6
- Icono: nada
- Annotation: pattern `devdle.cell` (`role="grid"`). Columnas = largo del término (4 a 12); las celdas escalan al ancho disponible (a 320 px y 12 letras bajan de tamaño y de gap). Cada celda suma símbolo además del color (✓ en su lugar, ~ en otro lugar, ✗ no está, NFR-U04) y `aria-label` «{letra}, {correcta|en otra posición|no está}». Al retomar se pintan los intentos guardados en el servidor (C-10)

### aviso-jugada
- Texto/label: No está en la lista. Probá con otro término.
- Icono: warning
- Annotation: hint del juego bajo el tablero (`role=status`), no un error del sistema. `not_in_word_list` no consume intento ni cambia el tablero; la fila escrita queda para corregir. Caracteres que no son A–Z (números, tildes, símbolos) se ignoran al escribir, con el aviso «Solo letras de la A a la Z.»

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
- Annotation: pattern `devdle.key`. Cada tecla refleja lo aprendido (correcta, presente, descartada) con texto/estilo además del color. El teclado físico funciona igual (letras, Enter, Backspace) y en mobile no se abre el teclado del sistema. Mientras se envía una jugada, Enviar queda deshabilitado

### pista-categorias
- Texto/label: // categorías posibles
- Etiquetas: lenguajes · git · bases de datos · redes · linux · apis · seguridad · ingeniería de software
- Texto secundario: La categoría y la definición se revelan al terminar.
- Icono: nada
- Annotation: chips `neutral` informativos (no se tocan). La lista es la misma todos los días y no filtra la del día (REQ-004)

### leyenda
- Texto/label: // cómo leer las pistas
- Etiquetas: ✓ en su lugar · ~ en otro lugar · ✗ no está
- Icono: nada
- Annotation: pattern `devdle.legend`; destino del botón «Cómo se juega» del header

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: O-01 llega con FG-6: hasta entonces el enlace no se renderiza. Cuando exista, si ya reportó muestra «Ya reportado» y no abre O-01 (`already_reported`)

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

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - teclado: oculto en este estado (hidden_in_states)

### sin sesión
- Aplica: Sí (sub-estado de default)
- Mensaje: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Cambios:
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: visible en este estado, annotation="recrea la sesión y reenvía la jugada" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando tu partida de devdle…
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - grilla-intentos: oculto en este estado (hidden_in_states)
  - pista-categorias: oculto en este estado (hidden_in_states)
  - leyenda: oculto en este estado (hidden_in_states)
  - teclado: oculto en este estado (hidden_in_states)
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
  - teclado: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- teclado (en pantalla o físico) · letra → la suma a la fila actual (en mayúsculas); Borrar/Backspace → borra la última
- Enviar/Enter con el largo exacto → envía la jugada; el servidor la valida y se pinta el feedback de la fila
- respuesta con la Play cerrada (`won`/`lost`) → navega a `devdle-resultado` con la solución, la distribución y las rachas
- respuesta `game_finished` → recarga y muestra `devdle-resultado` con el resultado ya registrado
- respuesta `challenge_expired` → carga el desafío nuevo y navega a `devdle-instrucciones` (estado `día nuevo`)
- respuesta `challenge_voided` → estado `anulado`; `no_session` → estado `sin sesión`; 429 → `límite de jugadas`
- ES|EN del header → cambia la interfaz sin perder el tablero
- link-reportar · on click → abre O-01 (bottom-sheet en mobile, modal en desktop), cuando exista (FG-6)

**Validaciones:**
- intento · caracteres que no son A–Z → se ignoran con el aviso «Solo letras de la A a la Z.»
- intento · largo distinto del término → el front no lo envía y avisa «Faltan letras: el término tiene N.»
- intento · palabra fuera de la lista → «No está en la lista. Probá con otro término.» (no consume intento)

**Feedback:**
- Las jugadas rechazadas muestran el aviso sin consumir el intento. Mientras se envía, Enviar queda deshabilitado (dos pestañas a la vez se procesan en serie en el servidor).

## Accesibilidad

- **Orden de foco:** header → titulo → consigna → tablero → teclado → pistas → link-reportar.
- **Landmarks y jerarquía:** `h1` con el nombre del juego; las cabeceras `//` de pistas son `h2`. Landmarks: header (breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** la partida se completa solo con teclado físico (NFR-U03); las teclas en pantalla son botones con nombre («Enviar», «Borrar»). O-01 atrapa el foco y lo devuelve al disparador.
- **Propio de esta composición:** El feedback de cada jugada se anuncia en una región `aria-live=polite` («C correcta, A en otra posición, …»); cada celda tiene etiqueta accesible y el estado nunca depende solo del color (NFR-U04).

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Devdle difiere por completo de la de los otros.
- El `#número` del desafío está en el header, no en el cuerpo.
- REQ-004: header `game-header` (`playing`) en lugar del header de plataforma y la tira `nav-movil`.
- REQ-004: el tablero tiene de 4 a 12 columnas según el término (supuesto «Longitud de la palabra»); las celdas escalan al ancho en lugar de cambiar de layout.
- REQ-004: la pista de categorías lista las 8 categorías fijas del banco como chips `neutral` (antes era una `card` con categorías inventadas).
- REQ-004: un solo bloque `aviso-jugada` cubre los rechazos que no consumen intento (fuera de la lista, faltan letras, caracteres no válidos, 429), como hint del juego del DS.
- REQ-004: estados `anulado` y `sin sesión` para las respuestas `challenge_voided` y `no_session` a mitad de partida (CA 18, 19).
- REQ-004: «Reportar un problema» queda documentado pero no se renderiza hasta FG-6.

**Alternativas descartadas:**
- Modal de instrucciones dentro de la partida: queda en la fase de instrucciones; el header lleva a la leyenda.
- Un toast para los rechazos: el DS no tiene toast y el hint junto al tablero queda donde el jugador mira.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- F-04, C-15, C-16, C-10, C-11, C-36 · REQ-004 (RF 4-11, 25; CA 3-7, 17-22, 36) · flujos 1 y 2 de `user-flows.md`.
