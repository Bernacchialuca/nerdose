---
name: timeline-resultado
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

# Pantalla: Tech Timeline · Resultado

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver cuántas posiciones acertó (`N/5`, victoria solo con 5/5), contrastar su orden con el correcto posición por posición, aprender la fecha y una nota breve de cada hito, ver las rachas actualizadas y compartir `N/5` sin revelar los hechos.
- **Viewports:**
  - **mobile** — consigna, veredicto y puntaje arriba; «// tu orden», «// orden correcto» con fechas y notas, rachas y la barra de cierre al pie, en una columna.
  - **desktop** — consigna y veredicto a la izquierda con el puntaje grande a la derecha; «// tu orden» (`1 1 320px`) y «// orden correcto» (`2 1 520px`) lado a lado, como el prototipo; la card de cierre (rachas en una línea + cuenta regresiva y salidas) debajo. Al ganar (5/5) festeja un confeti violeta del juego; el título del veredicto se mantiene porque es el mismo para todos los desenlaces. «Compartir» solo en el header.

## Entrada y salida

**Entradas:**
- `timeline-partida` · fin de partida (automático al confirmar)
- `home` · tarjeta «completado» (CTA «Ver resultado»)
- URL directa `/timeline` con la Play terminada (CA 8)
- O-02 · «Marcar como completado» (estado anulado, FG-6)

**Salidas user-driven:**
- A O-01 · «Reportar un problema» (cuando exista, FG-6)
- A `home` · «Volver a los juegos» o marca `> nerdose` del header
- A `estadisticas` · «Ver mis estadísticas» o botón «Estadísticas» del header
- A la siguiente `*-instrucciones` · «Siguiente juego» (solo si hay otro juego pendiente hoy)

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · finished | layout | ambos | — | Breadcrumb `> nerdose / tech-timeline`, «desafío del dd/mm», Compartir activo, idioma y racha |
| 2 | consigna | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Comentario de consigna fijo (`// consigna: del más antiguo al más reciente`; sin categoría del día desde 2026-11-11) |
| 3 | veredicto | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: perdió, cero aciertos, anulado | Veredicto de la partida, con texto además del color |
| 4 | puntaje | paragraph | body | content | ambos | hidden_in_states: loading, error de sistema, anulado | Puntaje grande `N/5` «posiciones correctas» |
| 5 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de anulación |
| 6 | lista-tu-orden | list | timeline.row | content | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: perdió, cero aciertos | Panel «// tu orden»: el orden confirmado con acierto o error por posición (ícono + texto + borde) |
| 7 | lista-correcto | list | timeline.rail | content | ambos | hidden_in_states: loading, error de sistema, anulado | Panel «// orden correcto»: línea de tiempo con la fecha (según precisión), el nombre, la categoría y la nota de cada hito |
| 8 | card-rachas | card | — | content | ambos | hidden_in_states: loading, error de sistema | Rachas de Tech Timeline y global actualizadas |
| 9 | link-stats | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Ir a estadísticas |
| 10 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Abre O-01 para avisar que el desafío está mal (FG-6) |
| 11 | cuenta-regresiva | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Cuenta regresiva al próximo desafío |
| 12 | btn-siguiente | button | secondary | input | ambos | hidden_in_states: loading, error de sistema, sin juegos pendientes | Lleva al siguiente juego pendiente |
| 13 | link-volver | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Salida a la home |
| 14 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 15 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 16 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 17 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- consigna
- veredicto
- puntaje
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- lista-tu-orden
- lista-correcto
- card-rachas
- link-stats
- link-reportar
- cuenta-regresiva
- btn-siguiente
- link-volver

### desktop · 1200px
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- row `titulo`
  - col 8/12: consigna, veredicto
  - col 4/12: puntaje
- row `resultado`
  - col 4/12: lista-tu-orden
  - col 8/12: lista-correcto
- row `cierre`
  - col 4/12: card-rachas, link-stats
  - col 8/12: barra `salida` (banner neutral: cuenta-regresiva a la izquierda; btn-siguiente y link-volver a la derecha), link-reportar

## Contenido

### header
- Texto/label: > nerdose / tech-timeline · desafío del 30/10 · lenguajes de programación · [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `finished` (REQ-006, como el prototipo): Compartir activo con el acento del juego (`#C39BFF` sobre `#160E26`), único botón de compartir de la pantalla. Texto en tres líneas: «⏳ Tech Timeline #8», «🟩🟥🟥🟩🟩 3/5» (un cuadrado por posición, en el orden confirmado) y «nerdose.dev»; nunca nombres, fechas ni el orden (CA 3, RF 9). «Estadísticas» → `estadisticas`; ES|EN cambia notas, fechas, consigna y categoría; píldora con la racha global ya actualizada. «Cómo se juega» no se muestra en el resultado. Sin nav global ni `nav-movil`

### consigna
- Texto/label: // consigna: del más antiguo al más reciente · lenguajes de programación
- Icono: nada
- Annotation: comentario `//` del prototipo (Mono 13 `text.dim`), en el idioma activo

### veredicto
- Texto/label: Orden perfecto
- Icono: check
- Annotation: `h1` Mono 34 con tracking negativo, como el título del prototipo; al ganar lleva ✓ en verde. Victoria solo con 5/5 (RF 6). El veredicto se dice con texto, no solo con el color del puntaje (NFR-U04)

### puntaje
- Texto/label: 5/5 · posiciones correctas
- Icono: nada
- Annotation: `streak-number` variant `score` del DS (Mono 800 56 en el acento violeta, unidad «posiciones / correctas» en dos líneas), a la derecha del título en desktop y debajo en mobile, como el prototipo (L1003-1005). No es una racha: no usa ámbar

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: la anulación llega con FG-6; en REQ-006 solo se respeta el estado al leer

### lista-tu-orden
- Texto/label: // tu orden
- Forma: `<ol>` de 5 filas en el orden que confirmó el jugador; cada fila: posición · nombre · badge («✓ bien» o «✗ va en 3°»)
- Icono: nada
- Annotation: pattern `timeline.row` dentro de un `panel` (cabecera `h2`). Correcta: fondo verde oscuro, borde 1px sólido y badge `chip` success «✓ bien». Mal ubicada: fondo ámbar oscuro, **borde 1px punteado** y badge `chip` pending «✗ va en N°» con el lugar correcto; nunca rojo (DS `color.md`, NFR-U04). Cada fila anuncia «Go, posición 2: mal ubicado, va en 3°». Sin la nota «Se arrastra y se suelta…» del prototipo: en el resultado ya no se mueve nada

### lista-correcto
- Texto/label: // orden correcto
- Forma: `<ol>` de 5 ítems en orden cronológico; cada ítem: fecha · nodo del riel · nombre del hito + etiqueta de su categoría (`// bases de datos`) + nota breve
- Icono: nada
- Annotation: pattern `timeline.rail` dentro de un `panel` (cabecera `h2`, padding 20 24 como el prototipo). Fecha en Mono 800 18 violeta, formateada en el idioma activo según su precisión (RF 8, CA 9; supuesto «Formato de fecha»): `year` → «1991»; `month` → «jun 2014» / «Jun 2014»; `day` → «14 mar 2013» / «Mar 14, 2013». Nunca se inventa mes ni día. Nota: texto de Wikipedia/Wikidata en el idioma activo (Inter 14/1.5 `text.lede`), nunca generada; la atribución CC BY-SA está en `acerca-de`. A 320 px la columna de fecha se ajusta a su contenido (ver «Pendientes» en la Revisión UX de REQ-006) y el texto envuelve; sin scroll horizontal

### card-rachas
- Texto/label: // rachas
- Texto secundario: Tech Timeline: 4 días · Global: 6 días · récord Tech Timeline: 9
- Icono: nada
- Annotation: rachas que devuelve el cierre; 0/5 también suma (decisión #3, CA 5). Si el jugador reabre el resultado más tarde, se leen con la racha viva. La stat propia de Tech Timeline (acierto por categoría, acumulado por hito) se muestra en `estadisticas` (FG-10), no acá (supuesto «Stats propias»)

### link-stats
- Texto/label: Ver mis estadísticas
- Icono: arrow-right
- Annotation: nada

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: O-01 llega con FG-6: hasta entonces el enlace no se renderiza. Cuando exista, si ya reportó muestra «Ya reportado» (`already_reported`)

### cuenta-regresiva
- Texto/label: racha de Timeline: 4 días · próximo desafío en 08:12:45
- Icono: clock
- Annotation: texto de la barra de cierre del prototipo (`banner` `neutral`: Mono 14, la racha en ámbar y la hora en `text.primary`). Al llegar a 0 recarga el día (Tech Timeline vuelve a instrucciones del desafío nuevo)

### btn-siguiente
- Texto/label: Siguiente juego
- Icono: arrow-right
- Annotation: lleva al próximo juego con desafío y sin completar; si no hay ninguno, no se muestra

### link-volver
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: acción de la barra de cierre (`outline-tinted` con el borde del juego `#3C2E60`, como el prototipo)

### loader
- Texto/label: $ cargando tu resultado de tech-timeline…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar tu resultado. Revisá tu conexión e intentá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. Es del shell e igual en todas las pantallas (REQ-002, C-07; REQ-003)

## Estados

### default
- Aplica: Sí
- Mensaje: Orden perfecto: 5/5 posiciones correctas.
- Cambios: ninguno respecto de default.

### perdió
- Aplica: Sí (sub-estado de default)
- Mensaje: 3 de 5 en su lugar. Este es el orden correcto, con la fecha y la historia de cada hito.
- Cambios:
  - veredicto: content="3 de 5 en su lugar", icon="nada", annotation="sin drama ni rojo: la partida perdida también suma a la racha (RF 6)" (state_override)
  - puntaje: content="3/5 · posiciones correctas" (state_override)
  - lista-tu-orden: annotation="Python ✓ bien · Go ✗ va en 3° · Java ✗ va en 2° · Docker ✓ bien · Kubernetes ✓ bien (CA 3)" (state_override)

### cero aciertos
- Aplica: Sí (sub-estado de perdió)
- Mensaje: Ninguno en su lugar esta vez. Este es el orden correcto.
- Cambios:
  - veredicto: content="Ninguno en su lugar esta vez" (state_override)
  - puntaje: content="0/5 · posiciones correctas" (state_override)
  - lista-tu-orden: annotation="las 5 filas mal ubicadas, cada una con «✗ va en N°»; la partida cuenta para la racha (CA 5)" (state_override)

### sin juegos pendientes
- Aplica: Sí (sub-estado de default)
- Mensaje: Orden perfecto. No te quedan juegos pendientes hoy.
- Cambios:
  - btn-siguiente: oculto en este estado (hidden_in_states)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Desafío anulado. Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - veredicto: content="Desafío anulado" (state_override)
  - puntaje: oculto en este estado (hidden_in_states)
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - lista-tu-orden: oculto en este estado (hidden_in_states)
  - lista-correcto: oculto en este estado (hidden_in_states)
  - Compartir del header: oculto en este estado

### success
- Aplica: Sí (sub-estado de default)
- Mensaje: ✓ Copiado: pegalo donde quieras.
- Cambios:
  - Compartir del header: content="✓ Copiado", icon="check", annotation="confirmación en el mismo botón (`role=status`) durante unos segundos; vuelve a «Compartir»" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando tu resultado de tech-timeline…
- Cambios:
  - consigna: oculto en este estado (hidden_in_states)
  - veredicto: oculto en este estado (hidden_in_states)
  - puntaje: oculto en este estado (hidden_in_states)
  - lista-tu-orden: oculto en este estado (hidden_in_states)
  - lista-correcto: oculto en este estado (hidden_in_states)
  - card-rachas: oculto en este estado (hidden_in_states)
  - Compartir del header: oculto en este estado
  - link-stats: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - cuenta-regresiva: oculto en este estado (hidden_in_states)
  - btn-siguiente: oculto en este estado (hidden_in_states)
  - link-volver: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu resultado. Revisá tu conexión e intentá de nuevo.
- Cambios:
  - consigna: oculto en este estado (hidden_in_states)
  - veredicto: oculto en este estado (hidden_in_states)
  - puntaje: oculto en este estado (hidden_in_states)
  - lista-tu-orden: oculto en este estado (hidden_in_states)
  - lista-correcto: oculto en este estado (hidden_in_states)
  - card-rachas: oculto en este estado (hidden_in_states)
  - Compartir del header: oculto en este estado
  - link-stats: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - cuenta-regresiva: oculto en este estado (hidden_in_states)
  - btn-siguiente: oculto en este estado (hidden_in_states)
  - link-volver: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- Compartir del header · on click → share nativo con «⏳ Tech Timeline #8 / 🟩🟥🟥🟩🟩 3/5 / nerdose.dev» o copia al portapapeles (estado success); registra `share:timeline`
- ES|EN · on change → notas, formato de las fechas, consigna y etiquetas de categoría pasan al otro idioma; los nombres de los hitos, el puntaje y los aciertos no cambian
- btn-siguiente · on click → siguiente juego pendiente
- link-volver · on click → `home`
- link-reportar · on click → abre O-01 (FG-6)

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Si se copia al portapapeles: el botón pasa a «✓ Copiado» (estado success). Si el share falla, el botón vuelve a «Compartir» y se puede reintentar.

## Accesibilidad

- **Orden de foco:** header → veredicto → puntaje → tu orden (lectura) → orden correcto (lectura) → rachas → link-stats → link-reportar → salidas (Compartir va en el header).
- **Landmarks y jerarquía:** `h1` es el veredicto; las secciones `//` (tu orden, orden correcto, rachas) son `h2`. Landmarks: header (breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** O-01 atrapa el foco y lo devuelve a `link-reportar`. Las listas no son interactivas: se recorren como lectura.
- **Propio de esta composición:** cada fila de «tu orden» dice acierto o error con ícono y texto («✓ bien», «✗ va en 3°») y con borde sólido o punteado, nunca solo con color (NFR-U04, CA 9). El riel es decorativo (`aria-hidden`); la fecha se lee como texto antes del nombre. La confirmación «Copiado» se anuncia con `role=status`.

## Decisiones y descartes

**Decisiones tomadas:**
- `perdió`, `cero aciertos` y `anulado` son sub-estados de la misma pantalla, no pantallas aparte (C-12, C-41).
- En `anulado` se ocultan «Compartir», el puntaje y las listas: una Play `voided` por «Marcar como completado» no tiene resultado (pregunta 2 del product-map).
- REQ-006: header `game-header` (`finished`) con Compartir activo, como el prototipo de Timeline y como Devdle y Grep Grid: se quitan `btn-compartir` y `toast-copiado` del cuerpo; la confirmación de copia es el estado «✓ Copiado» del botón del header (el DS no tiene toast).
- REQ-006: composición del prototipo (`tpl-Timeline`): comentario de consigna + título a la izquierda y puntaje grande `streak-number` `score` a la derecha; «// tu orden» y «// orden correcto» lado a lado en desktop; barra de cierre `banner` `neutral` con la racha del juego y la cuenta regresiva. El título del prototipo («Ordená por año de lanzamiento») se reemplaza por el veredicto, que es lo que pide RF 8.
- REQ-006: el error por posición es ámbar + punteado con «✗ va en N°», nunca rojo, como fija el DS para Timeline.
- REQ-006: la fecha se muestra según su precisión (año, mes y año, o fecha completa) en el idioma activo, sin inventar mes ni día (RF 8, supuesto «Formato de fecha»); el prototipo solo mostraba años.
- REQ-006: share `⏳ Tech Timeline #N` / 5 cuadrados 🟩/🟥 + `N/5` / `nerdose.dev`, sin nombres, fechas ni orden (supuesto «Formato del share», CA 3).
- REQ-006: se mantiene `card-rachas` además de la barra de cierre, como en Devdle y Grep Grid, porque suma la racha global y el récord que la barra del prototipo no muestra. La stat propia (acierto por categoría, por hito) va en `estadisticas` (FG-10).
- REQ-006: «Siguiente juego» solo aparece si queda un juego con desafío sin completar, como en Devdle y Grep Grid.

**Alternativas descartadas:**
- Compartir también en el cuerpo: dos botones iguales compiten; el prototipo usa solo el del header.
- Toast «Copiado»: requiere un componente nuevo del DS para un solo uso.
- Banner `success` / `failure` como veredicto (como Grep Grid): el prototipo de Timeline resuelve el cierre con el puntaje grande y la barra neutra; un banner rojo de «perdiste» con 4/5 sería dramático para un juego de un intento.
- Superponer «tu orden» sobre el riel en una sola lista: en 320 px mezcla dos lecturas y pierde la señal «✗ va en N°».

**Preguntas abiertas:**
- Pregunta 2 del product-map: variantes de resultado anulado con y sin resultado propio.
- Pregunta 5 del product-map: «Siguiente juego» o «Volver a los juegos» (REQ-006 sigue el criterio de REQ-004 y REQ-005).

- 2026-11-11 (pedido del usuario): al ganar no hay banner `success`: festeja un confeti del color del juego (host `web`, solo en la transición partida → resultado ganado, sin animación con `prefers-reduced-motion`) y el `h1` del veredicto queda `sr-only`. Al perder se mantiene el banner `failure`. Rachas y salidas van en una sola card de cierre (rachas en una línea + cuenta regresiva y salidas) debajo del tablero, para que la racha quede a la vista sin scroll; `card-rachas` deja de existir como card aparte.

## Trazabilidad

- C-25, C-12, C-13, C-33, C-36, C-41 · REQ-006 (RF 6-9, 21; CA 3-5, 8, 9, 36) · flujos 1, 3, 4 y 5 de `user-flows.md`.
