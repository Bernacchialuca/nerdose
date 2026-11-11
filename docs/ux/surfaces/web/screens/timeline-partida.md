---
name: timeline-partida
surface: web
route: /timeline
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.1"
date: 2026-11-10
---

# Pantalla: Tech Timeline · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ordenar los 5 hitos del día del más antiguo al más reciente, moviéndolos con el dedo desde el asa, con los botones ↑ ↓ o con el teclado, y confirmar el orden en un solo intento. El jugador solo ve la consigna fija y el nombre y la categoría de cada hito (el desafío mezcla categorías, 2026-11-11): las fechas, las notas y el orden correcto llegan recién al cerrar.
- **Viewports:**
  - **mobile** — consigna arriba, lista vertical de 5 filas a ancho completo (asa · posición · nombre · ↑ ↓), la ayuda de cómo mover y «Confirmar orden» al final, alcanzable con el pulgar. Sin scroll horizontal desde 320 px.
  - **desktop** — consigna a ancho completo; la lista «// tu orden» a la izquierda (7/12) con el hint debajo, y la ayuda de cómo mover más «Confirmar orden» a la derecha (5/12), a la vista sin scroll.

> **Actualización 2026-11-11 (revisión visual del usuario).** Prevalece sobre la estructura de abajo donde difieran:
> - Encabezado: comentario `// un solo intento · 1 punto por posición correcta`, la consigna como `h1` y un lede «Arriba el más antiguo, abajo el más reciente. Arrastrá cada tarjeta o usá las flechas.».
> - Lista: cada hito es una tarjeta propia (tinte y borde del juego), sin panel contenedor; el `h2` «tu orden» queda solo para lectores de pantalla y rotula la lista. A la izquierda, un eje decorativo vertical «antes» → «después». Cada tarjeta muestra `????` donde irá la fecha (decorativo, desde 384 px de contenedor).
> - Columna derecha: card «// reglas» (es el destino de «Cómo se juega», `#game-help`) con la racha del juego en el dato de la cabecera cuando es > 0, tres reglas numeradas 01–03 y la ayuda de teclado; debajo, «Confirmar orden →» y «Reiniciar» (vuelve a la mezcla inicial y lo anuncia en el hint). No hay card de promedios. Con el desafío anulado se oculta toda la columna.

## Entrada y salida

**Entradas:**
- `timeline-instrucciones` · «Empezar» (crea la Play)
- `home` · tarjeta «en curso» (retoma la Play con los hitos en el orden inicial mezclado: el orden armado antes no se guarda, CA 12)
- URL directa `/timeline` con una Play `in_progress`

**Salidas user-driven:**
- A `home` · marca `> nerdose` del header (la partida queda en curso, sin el orden armado)
- A `estadisticas` · botón «Estadísticas» del header (ídem)
- A O-01 · «Reportar un problema» (cuando exista, FG-6)

**Salidas automáticas:**
- A `timeline-resultado` · al confirmar un orden válido: el servidor cierra la Play como `won` (5/5) o `lost` (0 a 4) y devuelve el resultado
- A `timeline-resultado` · `game_finished` (la Play ya se cerró, por ejemplo desde otra pestaña, CA 18)
- A `timeline-instrucciones` · `challenge_expired` (cambio de día con la partida abierta; llega con el aviso «día nuevo», CA 13)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · playing | layout | ambos | — | Breadcrumb `> nerdose / tech-timeline`, «desafío del dd/mm», acciones de juego, idioma y racha |
| 2 | consigna | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Comentario de consigna y la regla de un solo intento |
| 3 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | La consigna del día en el idioma activo |
| 4 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de desafío anulado durante la partida |
| 5 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Explica que hace falta la cookie funcional (`no_session`) |
| 6 | lista-hitos | list | timeline.row | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: moviendo, confirmando, anulado | Panel «// tu orden»: 5 filas reordenables con asa, posición, nombre + etiqueta de categoría y botones ↑ ↓ |
| 7 | hint-jugada | paragraph | caption | feedback | ambos | hidden_in_states: loading, error de sistema; state_overrides: moviendo, error de validación, límite de jugadas | Línea de aviso del juego: anuncia el último movimiento y los rechazos del servidor, sin penalizar |
| 8 | ayuda-mover | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema, anulado | Las tres formas de mover un hito |
| 9 | btn-confirmar | button | accent | input | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: confirmando | Envía el orden armado (un solo intento) |
| 10 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Abre O-01 para avisar que el desafío está mal (FG-6) |
| 11 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 12 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 13 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema, sin sesión; state_overrides: sin sesión | Reintentar la carga o recrear la sesión |
| 14 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- banner-cookies
- consigna
- titulo
- loader
- alerta-sistema
- btn-reintentar
- alerta-anulado
- lista-hitos
- hint-jugada
- ayuda-mover
- btn-confirmar
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
  - col 7/12: lista-hitos, hint-jugada
  - col 5/12: ayuda-mover, btn-confirmar, link-reportar

## Contenido

### header
- Texto/label: > nerdose / tech-timeline · desafío del 30/10 · lenguajes de programación · [?] [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `playing` (REQ-006): el metadato es «desafío del dd/mm»; desde 2026-11-11 el desafío no tiene categoría propia (mezcla categorías), así que no se muestra una categoría del día. «Cómo se juega» lleva a `ayuda-mover` de esta misma pantalla (con la Play en curso el servidor no vuelve a mostrar las instrucciones); «Estadísticas» → `estadisticas`; Compartir deshabilitado («disponible al terminar la partida»); ES|EN cambia la consigna y las etiquetas de categoría sin perder el orden armado (CA 36); píldora con la racha global. Sin nav global ni `nav-movil`

### consigna
- Texto/label: // consigna: del más antiguo al más reciente · un solo intento
- Icono: nada
- Annotation: comentario `//` del prototipo (Mono 13 `text.dim`)

### titulo
- Texto/label: Ordená estos lenguajes del más antiguo al más reciente
- Icono: nada
- Annotation: `prompt` del desafío en el idioma activo: consigna única y fija para todos los días (actualización 2026-11-11): «Ordená estos hitos del más antiguo al más reciente» / «Order these milestones from oldest to newest». Como en el prototipo, el `h1` es la consigna y no el nombre del juego, que ya está en el breadcrumb. Mono 34 con tracking negativo; a 320 px envuelve en 2 o 3 líneas

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: aparece si «Confirmar orden» responde `challenge_voided` (CA 14); la lista queda bloqueada y «Confirmar orden» se oculta

### banner-cookies
- Texto/label: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Icono: warning
- Annotation: banner `warning` (O-03); aparece si la confirmación responde `no_session` (CA 16). El orden armado se conserva en pantalla para reintentar

### lista-hitos
- Texto/label: // tu orden
- Forma: `<ol>` de 5 filas en el orden que el jugador va armando (al entrar, el orden mezclado que manda el servidor); cada fila: asa ⠿ · posición «1»…«5» · nombre del hito con su categoría debajo (`// lenguajes de programación`, Mono 13 `text.dim`) · botones ↑ ↓
- Icono: nada
- Annotation: pattern `timeline.row` (fila de 52 px, `radius.control`, gap 8) dentro de un `panel` «// tu orden» (cabecera `h2`). Estado jugando: fondo `surface`, borde 1px `border.subtle`, sin badge (el badge «✓ bien / ✗ va en N°» es solo del resultado). Cada fila anuncia «Go, posición 3 de 5». **Asa** (botón con `aria-roledescription` «elemento reordenable», `touch-action: none` solo en el asa): arrastre con el dedo o el mouse; el resto de la fila deja hacer scroll (CA 11). **Botones ↑ ↓** (`button` `icon`, `aria-label` «Subir Go» / «Bajar Go»): mueven una posición; ↑ deshabilitado en la primera fila y ↓ en la última; el foco sigue al hito movido. Los nombres son los `label` en inglés, iguales en ES y EN. Ninguna fila muestra fecha, nota ni pista (RF 2); la etiqueta de categoría no revela la fecha (2026-11-11). A 320 px la lista ocupa todo el ancho, el nombre envuelve a 2 líneas si no entra (la fila crece en alto, nunca en ancho) y no hay scroll horizontal (CA 11, RF 21)

### hint-jugada
- Texto/label: > moviste Go a la posición 3 de 5
- Icono: nada
- Annotation: línea de aviso del juego (Mono 13), siempre montada con `min-height` para no mover el layout; la línea visible repite el último anuncio de la región viva `sr-only` (`aria-live="polite"`). Sin rojo ni shake: un rechazo no consume el intento. Vacía al entrar. Textos: «> moviste {hito} a la posición {n} de 5», «> no pudimos registrar ese orden. Revisalo y confirmá de nuevo» (`invalid_move`), «> vas muy rápido. Esperá unos segundos y probá de nuevo» (429)

### ayuda-mover
- Texto/label: Arrastrá cada fila desde su asa ⠿ o usá ↑ ↓. Con teclado: Espacio para tomar un hito, flechas para moverlo, Espacio para soltarlo y Escape para devolverlo a su lugar.
- Icono: nada
- Annotation: deriva de la nota del prototipo («Se arrastra y se suelta. En pantallas táctiles, cada fila también tiene flechas para subir y bajar.»), sumando el teclado (CA 10, NFR-U03). Inter 13 `text.muted`

### btn-confirmar
- Texto/label: Confirmar orden
- Icono: check
- Annotation: `button` `accent` con el acento del juego (`#C39BFF`), `lg`, ancho completo en mobile. Siempre habilitado: el orden inicial ya es un orden válido que se puede confirmar (supuesto «Confirmación única»). Separado de la lista por la ayuda (mobile) o en la columna lateral (desktop) para que un toque accidental al mover no confirme. Sin segundo diálogo de confirmación

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: O-01 llega con FG-6: hasta entonces el enlace no se renderiza (supuesto «Reportar un problema»). Cuando exista, si ya reportó muestra «Ya reportado» y no abre O-01 (`already_reported`)

### loader
- Texto/label: $ cargando tu partida de tech-timeline…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo.
- Icono: nada
- Annotation: también cubre una confirmación que falla por red o 500: la partida sigue en curso y el orden armado se mantiene en pantalla para reintentar

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: en `sin sesión` recrea la sesión y reenvía la confirmación con el mismo orden

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. Es del shell e igual en todas las pantallas (REQ-002, C-07; REQ-003)

## Estados

### default
- Aplica: Sí
- Mensaje: 5 hitos en el orden mezclado del día; «Confirmar orden» habilitado.
- Cambios: ninguno respecto de default.

### moviendo
- Aplica: Sí (sub-estado de default)
- Mensaje: > Go, posición 3 de 5 (tomado: flechas para mover, Espacio para soltar, Escape para cancelar)
- Cambios:
  - lista-hitos: annotation="la fila tomada (arrastre o Espacio) se marca con borde 2px del acento violeta y el lugar de destino con un hueco punteado; las demás filas se corren sin animación si `prefers-reduced-motion`. Escape devuelve el hito a su lugar original y lo anuncia (CA 10)" (state_override)
  - hint-jugada: content="> Go, posición 3 de 5" (state_override)

### confirmando
- Aplica: Sí (sub-estado de default)
- Mensaje: Confirmando tu orden…
- Cambios:
  - btn-confirmar: content="Confirmando…", variant="disabled", annotation="`aria-disabled` mientras viaja la jugada; un segundo toque no envía otra" (state_override)
  - lista-hitos: annotation="bloqueada mientras se confirma: asas y ↑ ↓ deshabilitados" (state_override)

### error de validación
- Aplica: Sí
- Mensaje: > no pudimos registrar ese orden. Revisalo y confirmá de nuevo
- Cambios:
  - hint-jugada: content="> no pudimos registrar ese orden. Revisalo y confirmá de nuevo", annotation="`422 invalid_move` (ids faltantes, repetidos o de otro desafío; no debería pasar desde la interfaz). La partida sigue en curso, el orden armado se mantiene y se puede confirmar otra vez (CA 6, 7)" (state_override)

### límite de jugadas
- Aplica: Sí (sub-estado de error de validación)
- Mensaje: > vas muy rápido. Esperá unos segundos y probá de nuevo
- Cambios:
  - hint-jugada: content="> vas muy rápido. Esperá unos segundos y probá de nuevo", annotation="HTTP 429 con mensaje genérico; la confirmación no se procesa (CA 17, NFR-S08)" (state_override)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - ayuda-mover: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - lista-hitos: annotation="bloqueada: no acepta arrastre, teclado ni ↑ ↓" (state_override)

### sin sesión
- Aplica: Sí (sub-estado de default)
- Mensaje: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Cambios:
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: visible en este estado, annotation="recrea la sesión y reenvía la confirmación con el mismo orden" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando tu partida de tech-timeline…
- Cambios:
  - consigna: oculto en este estado (hidden_in_states)
  - titulo: oculto en este estado (hidden_in_states)
  - lista-hitos: oculto en este estado (hidden_in_states)
  - hint-jugada: oculto en este estado (hidden_in_states)
  - ayuda-mover: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo.
- Cambios:
  - consigna: oculto en este estado (hidden_in_states)
  - titulo: oculto en este estado (hidden_in_states)
  - lista-hitos: oculto en este estado (hidden_in_states)
  - hint-jugada: oculto en este estado (hidden_in_states)
  - ayuda-mover: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- lista-hitos · arrastrar desde el asa (dedo o mouse) y soltar → el hito pasa a la nueva posición; se anuncia «{hito}, posición {n} de 5»
- lista-hitos · foco en el asa + Espacio/Enter → toma el hito (estado `moviendo`); ↑ ↓ lo mueven; Espacio/Enter lo suelta; Escape lo devuelve a su lugar original (CA 10)
- lista-hitos · botón ↑ o ↓ de una fila → mueve el hito una posición; el foco queda en el mismo botón del hito movido (o pasa al otro botón si llegó a un extremo)
- btn-confirmar · on click → estado `confirmando`; envía `{ order: [5 opaque_id] }`; el servidor valida y calcula el puntaje (el cliente nunca decide el resultado, RF 4)
- respuesta con la Play cerrada (`won` o `lost`) → navega a `timeline-resultado` con el orden correcto, fechas, notas, aciertos por posición y rachas (CA 3-5)
- respuesta `422 invalid_move` → estado `error de validación` (CA 6, 7)
- respuesta `game_finished` → recarga y muestra `timeline-resultado` con el resultado ya registrado (CA 8, 18)
- respuesta `challenge_expired` → carga el desafío nuevo y navega a `timeline-instrucciones` (estado `día nuevo`, CA 13)
- respuesta `challenge_voided` → estado `anulado` (CA 14); `no_session` → estado `sin sesión` (CA 16); 429 → `límite de jugadas` (CA 17)
- ES|EN del header → cambian consigna (`titulo`), etiquetas de categoría de las filas y textos de ayuda; los nombres de los hitos y el orden armado no cambian (CA 36)
- link-reportar · on click → abre O-01 (bottom-sheet en mobile, modal en desktop), cuando exista (FG-6)

**Validaciones:**
- No aplica del lado del jugador: cualquier permutación de los 5 hitos se puede confirmar. El servidor rechaza con `invalid_move` lo que no sea una permutación exacta de los 5 ids del desafío.

**Feedback:**
- Cada movimiento se anuncia una sola vez («Go, posición 3 de 5») en la región viva y en `hint-jugada`. Ningún movimiento consulta al servidor: el orden en construcción vive en la pantalla hasta confirmar.

## Accesibilidad

- **Orden de foco:** header → titulo → lista-hitos (por fila: asa → ↑ → ↓) → ayuda-mover (lectura) → btn-confirmar → link-reportar.
- **Landmarks y jerarquía:** `h1` es la consigna del día; la cabecera `// tu orden` es `h2`. Landmarks: header (breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** todo el reordenamiento funciona con teclado (NFR-U03): `KeyboardSensor` de dnd-kit sobre el asa (Espacio/Enter toma y suelta, flechas mueven, Escape cancela) y, como alternativa sin modo «tomado», los botones ↑ ↓ con Tab. El foco visible se mantiene sobre el hito movido. Las instrucciones para lector de pantalla del arrastre (`screenReaderInstructions`) y los anuncios están en ES y EN.
- **Propio de esta composición:** cada fila expone su posición («3 de 5»); los movimientos se anuncian en una región `aria-live="polite"` `sr-only` con textos cortos. La fila tomada se distingue por borde y anuncio, no solo por color (NFR-U04). Con `prefers-reduced-motion` no hay transición de reacomodo ni animación de soltado. Áreas táctiles: asa y ↑ ↓ de al menos 40 px de lado incluso a 320 px; si el ancho no alcanza, el nombre envuelve antes que achicar los controles.

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Tech Timeline difiere por completo de la de los otros.
- REQ-006: header `game-header` (`playing`) en lugar del header de plataforma y la tira `nav-movil`, como Devdle y Grep Grid (supuesto «Cabecera de las pantallas»). ~~El metadato suma la categoría del día~~ (2026-11-11: sin categoría del día; la categoría va por fila).
- REQ-006: el `h1` es la consigna del día y el comentario `// consigna: …` va arriba, igual que en el resultado del prototipo; el nombre del juego queda en el breadcrumb. El bloque `titulo` deja de decir «Tech Timeline».
- REQ-006: la lista usa el pattern `timeline.row` del DS dentro de un `panel` «// tu orden», la misma pieza que el resultado, para que el jugador reconozca su orden al cerrar. En la partida la fila no lleva badge.
- REQ-006: tres formas de mover equivalentes (asa, ↑ ↓ y teclado), y el arrastre se inicia solo desde el asa para no pelear con el scroll en el teléfono (supuestos «Interacción: ordenar» y «Scroll táctil vs. arrastre», CA 10, 11).
- REQ-006: «Confirmar orden» siempre habilitado y sin diálogo de confirmación: el botón separado ya cumple la regla de selección y confirmación en dos pasos (decisión #26) sin sumar fricción (supuesto «Confirmación única»). Usa la variant `accent` del juego, como los CTA de juego del DS.
- REQ-006: hint de una línea, siempre montado y silencioso, para anunciar movimientos y rechazos (`invalid_move`, 429) sin penalizar, como `devdle.hint` y `grep-grid.hint`.
- REQ-006: estados `confirmando`, `anulado` y `sin sesión` para las respuestas de la confirmación (CA 14, 16), como Devdle y Grep Grid. En los rechazos el orden armado se conserva.
- REQ-006: al retomar, la lista vuelve al orden inicial mezclado, porque el orden en construcción no se guarda (supuesto «Estado de la partida y retomar», CA 12). Lo avisan las instrucciones.
- REQ-006: «Reportar un problema» queda documentado pero no se renderiza hasta FG-6.

**Alternativas descartadas:**
- Arrastrar desde toda la fila: en el teléfono compite con el scroll de la página (CA 11).
- Guardar el orden intermedio en el navegador o en el servidor: el estado de la Play es «casi vacío» (ADR-006) y el PRD no lo pide.
- Diálogo «¿Confirmás este orden?»: agrega un paso a un juego de 1 minuto; el botón separado ya evita el toque accidental.
- Mostrar una línea de tiempo vacía con huecos (como la miniatura de la tarjeta) en lugar de la lista: en 320 px no entra con nombres largos y no tiene un equivalente simple de teclado.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- F-06, C-23, C-10, C-11, C-36, NFR-U01, NFR-U03, NFR-U04 · REQ-006 (RF 2-5, 10, 18, 21; CA 2, 6, 7, 10-14, 16-18, 36) · flujos 1 y 2 de `user-flows.md`.
