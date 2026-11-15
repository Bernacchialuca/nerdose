---
name: bug-hunt-resultado
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

# Pantalla: Bug Hunt · Resultado

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver si encontró el bug, la línea del bug junto a la elegida (con ícono y texto, no solo color), el test oculto que falla (llamada, esperado y obtenido), el fix como diff de una línea en el lenguaje de la pestaña, la explicación paso a paso y el tipo de bug; ver las rachas actualizadas y compartir sin revelar la línea ni el tipo (C-32).
- **Viewports:**
  - **mobile** — veredicto arriba; pestañas y código con las líneas marcadas; después la explicación completa (test que falla, fix, por qué falla y tipo) y la card de cierre (rachas + salidas) al pie, en una columna. El código scrollea dentro de su bloque y los tags de línea bajan a una segunda fila bajo su línea.
  - **desktop** — veredicto a ancho completo; código y la card de cierre a la izquierda (7/12); la explicación como panel a la derecha (5/12), como el `aside` del prototipo. «Compartir» solo en el header.

## Entrada y salida

**Entradas:**
- `bug-hunt-partida` · fin de partida (automático al confirmar)
- `home` · tarjeta «completado» (CTA «Ver resultado»)
- URL directa `/bug-hunt` con la Play terminada (RF 8, CA 8)
- O-02 · «Marcar como completado» (estado anulado; REQ-007)
- Instrucciones o URL directa con la Play `voided` (jugó antes de la anulación, o ya marcó como completado): llega directo al estado `anulado`

**Salidas user-driven:**
- A O-01 · «Reportar un problema» (`link-reportar`, salvo en `ya reportado`)
- A `home` · «Volver a los juegos» o marca `> nerdose` del header
- A `estadisticas` · «Ver mis estadísticas» o botón «Estadísticas» del header
- A la siguiente `*-instrucciones` · «Siguiente juego» (solo si hay otro juego pendiente hoy)

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · finished | layout | ambos | — | Breadcrumb `> nerdose / bug-hunt`, «desafío del dd/mm», Compartir activo, idioma y racha |
| 2 | veredicto | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: perdió, anulado | Veredicto de la partida con la línea del bug, en texto además del color |
| 3 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de anulación |
| 4 | pregunta | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema, anulado | La pregunta del juego y la especificación, como en la partida |
| 5 | tabs-lenguaje | tabs | code-block · tablist | navigation | ambos | hidden_in_states: loading, error de sistema, anulado | Pestañas JavaScript / Go / Java (solo vista); arranca en el lenguaje con el que confirmó |
| 6 | codigo | image | code-block · selectable (resultado) | content | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: perdió; viewport_overrides: mobile→tags bajo la línea | El código con la línea del bug y la elegida marcadas con barra, glifo y texto |
| 7 | test-falla | card | bug-hunt · test que falla | content | ambos | hidden_in_states: loading, error de sistema, anulado | «// el test que falla»: la llamada del test oculto, esperado y obtenido |
| 8 | fix | image | code-block · diff | content | ambos | hidden_in_states: loading, error de sistema, anulado | «// el fix · línea N»: la línea con el bug y la corregida, en el lenguaje de la pestaña |
| 9 | explicacion-titulo | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema, anulado | «Por qué falla» |
| 10 | lista-pasos | list | bug-hunt.step | content | ambos | hidden_in_states: loading, error de sistema, anulado | De 2 a 4 pasos numerados: qué hace la línea, la traza sobre el test oculto, por qué pasaban los visibles y el fix |
| 11 | chip-tipo | chips | chip · accent | content | ambos | hidden_in_states: loading, error de sistema, anulado | «tipo: comparación»: el tipo de bug en el idioma activo |
| 12 | card-rachas | card | — | content | ambos | hidden_in_states: loading, error de sistema | Rachas de Bug Hunt y global actualizadas (fila superior de la card de cierre) |
| 13 | link-stats | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Ir a estadísticas |
| 14 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema; state_overrides: ya reportado | Abre O-01 para avisar que el desafío está mal (C-36); deshabilitado si el jugador ya reportó este desafío |
| 15 | cuenta-regresiva | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Cuenta regresiva al próximo desafío |
| 16 | btn-siguiente | button | primary | input | ambos | hidden_in_states: loading, error de sistema, sin juegos pendientes | Lleva al siguiente juego pendiente |
| 17 | link-volver | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Salida a la home |
| 18 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 19 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 20 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 21 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- veredicto
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- pregunta
- tabs-lenguaje
- codigo
- test-falla
- fix
- explicacion-titulo
- lista-pasos
- chip-tipo
- card-rachas
- link-stats
- cuenta-regresiva
- btn-siguiente
- link-volver
- link-reportar

### desktop · 1200px
- veredicto
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- row `resultado`
  - col 7/12: pregunta, tabs-lenguaje, codigo, card de cierre (card-rachas en una línea con link-stats; debajo cuenta-regresiva a la izquierda y btn-siguiente + link-volver a la derecha)
  - col 5/12: panel `explicacion` (test-falla, fix, explicacion-titulo, lista-pasos, chip-tipo), link-reportar

## Contenido

### header
- Texto/label: > nerdose / bug-hunt · desafío del 30/10 · [stats] [Compartir] ES|EN · 🔥 17
- Icono: nada
- Annotation: `game-header` variant `finished` (REQ-010, como el prototipo `tpl-BugHunt`): Compartir activo con el acento del juego (`#FFB547` sobre `#1A1206`), único botón de compartir de la pantalla. Texto en tres líneas, en el idioma activo: «🐛 Bug Hunt #8 · JavaScript», «🟩 bug encontrado» (🟥 «se me escapó» si perdió; en inglés «🟩 bug found» / «🟥 it got away») y «nerdose.dev»; el lenguaje es el que se usó al confirmar; nunca la línea ni el tipo de bug (CA 10). «Estadísticas» → `estadisticas`; ES|EN cambia el veredicto, la especificación, los pasos, el tipo y los tags; píldora con la racha global ya actualizada. «Cómo se juega» no se muestra en el resultado. Sin nav global ni `nav-movil`

### veredicto
- Texto/label: Bug encontrado en la línea 4
- Icono: check
- Annotation: al ganar, sin banner: confeti ámbar del juego (host `web`, solo en la transición partida → resultado ganado, sin animación con `prefers-reduced-motion`) y `h1` `sr-only` («Bug encontrado en la línea 4»), como los otros juegos; la señal visible con ícono y texto es el código («✓ acá estaba el bug»). Al perder, banner `failure` del DS, sin drama (ver estado `perdió`)

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: `banner` `warning` del DS. Se muestra con la Play `voided` (`challenge_status: voided`); `GameToday` devuelve `result: null` y `public_view: null` (REQ-007)

### pregunta
- Texto/label: ¿En qué línea está el bug?
- Texto secundario: // qué debería hacer — Devuelve el índice del mayor valor del array. Si el máximo se repite, devuelve el primero.
- Icono: nada
- Annotation: `h2` Mono 26 (22 en mobile) con la especificación debajo en el pattern `bug-hunt.statement`, compacta; acá es `h2` porque el `h1` es el veredicto. Se repite la especificación porque el fix y la explicación se leen contra ella

### tabs-lenguaje
- Texto/label: —
- Etiquetas: JavaScript · Go · Java (nombre de archivo a la derecha: `max-index.js` · `max_index.go` · `MaxIndex.java`)
- Icono: nada
- Annotation: arranca en `result.code_language` (el lenguaje con el que confirmó); cambiar de pestaña es solo vista, no cambia la preferencia y también cambia el `fix` al mismo lenguaje. Las marcas de línea valen para los 3 lenguajes (misma línea, decisión 1 del diseño técnico)

### codigo
- Texto/label: function maxIndex(nums) { … } · línea 4 «✓ acá estaba el bug»
- Asset: placeholder 4:3 (8 a 15 líneas)
- Icono: nada
- Annotation: `code-block` `selectable` en modo resultado, solo lectura (las líneas ya no son radios: es una lista de líneas, sin foco por línea). Estados del pattern `bug-hunt.line`: **acierto** (elegida = `bug_line`): fondo `#0C1A12`, barra `#3DDC84`, tag «✓ acá estaba el bug». **Perdió**: la línea del bug con fondo `#1A140A`, barra `#FFB547` y tag «🐛 acá estaba el bug»; la elegida con fondo `#1C0F0E`, barra `#FF7B72` y tag «✗ tu elección». El resto sin marca. Cada línea marcada se anuncia con su tag («Línea 4, acá estaba el bug»), así que el resultado no depende del color (CA 5, 23, NFR-U04). Mismo resaltado de sintaxis y fallback sin color que en la partida; texto seleccionable; el cuerpo scrollea en horizontal dentro del bloque, la página no. **mobile:** con el bloque angosto (< 32rem) el tag baja a una segunda fila bajo su línea, alineada con el código, como las notas de Big O (`viewport_override`), para que «acá estaba el bug» no quede fuera de la vista dentro del scroll

### test-falla
- Texto/label: // el test que falla
- Texto secundario: maxIndex([5, 1, 5]) · esperado **0** · obtenido **2**
- Icono: nada
- Annotation: caja `error` del resultado del pattern de Bug Hunt (radio 12, fondo `#1C0F0E`, borde `#4A2220`, padding 14 16, Mono 14): la llamada en `text.primary` y debajo «esperado» con el valor en `<b>` verde y «obtenido» con el valor en `<b>` rojo; las palabras «esperado» y «obtenido» dicen qué es cada valor, el color solo acompaña. Sale de `failing_test` (`input`, `expected`, `actual`), con la misma sintaxis de llamada que los tests de la partida (CA 4)

### fix
- Texto/label: // el fix · línea 4
- Texto secundario: - if (nums[i] >= nums[best]) { · + if (nums[i] > nums[best]) {
- Icono: nada
- Annotation: `code-block` variant `diff` del DS, sin pestañas: dos líneas con prefijos literales `- ` / `+ ` y fondos tintados (`status.error.bg` / `status.success.bg`), Mono 14/2, con su indentación. Sale de `fix[<pestaña activa>]` (`before` / `after`), así que cambia con la pestaña del código: el fix siempre está en el lenguaje que el jugador está mirando. Los prefijos `-`/`+` y la cabecera dicen cuál es cuál sin depender del color. Scroll horizontal propio si la línea no entra a 320 px

### explicacion-titulo
- Texto/label: Por qué falla
- Icono: nada
- Annotation: `h2` Mono 20 dentro del `panel` de explicación (fondo `#0F1318`, borde `#222A33`, `radius.panel`, padding 24), como el `aside` del prototipo

### lista-pasos
- Texto/label: —
- Forma: `<ol>` de 2 a 4 pasos en el idioma activo, por ejemplo: «1 · Con `>=`, cada valor **igual** al máximo actual también mueve `best` hacia la derecha.» «2 · En `[5, 1, 5]`, al llegar a `i = 2` se cumple `5 >= 5` y devuelve el **último** máximo, no el primero.» «3 · Los tests visibles no tenían empates, por eso pasaban. Con `>` solo se actualiza ante un valor **estrictamente mayor**.»
- Icono: nada
- Annotation: pattern `bug-hunt.step` (número en cuadrado 28×28 `#2A1F0B` / `#FFB547`, texto Inter 15/1,55 `text.body`; `<code>` Mono `text.primary` sin fondo; `<b>` `text.primary`). El texto llega del servidor ya resuelto en el locale (`explanation.steps`, ADR-015), nunca se arma en el cliente; los fragmentos de código de los pasos usan los tokens neutros del árbol (`>=`, `best`), válidos en los 3 lenguajes

### chip-tipo
- Texto/label: tipo: comparación
- Icono: nada
- Annotation: `chip` `accent` de Bug Hunt (borde `#5C4419`, texto `#FFB547`, Mono 12), como el prototipo. La etiqueta sale de `bug_type` con las etiquetas del paquete (`shared`) en el idioma activo: «uno de más o de menos», «comparación», «operador equivocado», «variable equivocada», «valor inicial», «return antes de tiempo», «condición invertida» (en inglés: «off by one», «comparison», «wrong operator», «wrong variable», «bad initialization», «early return», «inverted condition»). Resuelve el «a validar» de `bug-hunt-resultado` (C-32 no lo nombra, pero `bug_type` llega en el resultado y le da al jugador el nombre del error para reconocerlo la próxima vez). No se muestra el chip «mutación: > → >=» del prototipo: el fix ya muestra el cambio

### card-rachas
- Texto/label: (h2 `sr-only`: rachas) — fila superior de la card de cierre
- Texto secundario: Bug Hunt: 6 días · Global: 17 días · récord Bug Hunt: 9 · Ver mis estadísticas →
- Icono: nada
- Annotation: rachas que devuelve el cierre; perder también suma (CA 9). Si el jugador reabre el resultado más tarde, se leen con la racha viva. Las stats propias de Bug Hunt (aciertos por lenguaje y por tipo de bug) se muestran en `estadisticas` (FG-10), no acá (supuesto «Stats propias» del REQ)

### link-stats
- Texto/label: Ver mis estadísticas
- Icono: arrow-right
- Annotation: nada

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: abre O-01 (bottom-sheet en mobile, modal en desktop) desde el resultado (también el anulado), sin el aviso de spoilers; el contexto incluye `code_language`. Con `reported: true` en `GameToday`, o tras un envío con éxito o `already_reported`, pasa al estado `ya reportado`: «Ya reportaste este desafío», deshabilitado y sin abrir O-01 (REQ-007)

### cuenta-regresiva
- Texto/label: Próximo desafío en 05:42:10
- Icono: clock
- Annotation: al llegar a 0 recarga el día (Bug Hunt vuelve a instrucciones del desafío nuevo)

### btn-siguiente
- Texto/label: Siguiente juego
- Icono: arrow-right
- Annotation: `button` `primary` como en el banner del prototipo («Siguiente juego →»); lleva al próximo juego con desafío y sin completar; si no hay ninguno, no se muestra

### link-volver
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: nada

### loader
- Texto/label: $ cargando tu resultado de bug-hunt…
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
- Mensaje: Bug encontrado en la línea 4. Confeti y la línea marcada «✓ acá estaba el bug».
- Cambios: ninguno respecto de default.

### perdió
- Aplica: Sí (sub-estado de default)
- Mensaje: El bug estaba en la línea 4, no en la 6. Elegiste la línea 6 en Go: abajo, el test que falla y por qué.
- Cambios:
  - veredicto: content="El bug estaba en la línea 4, no en la 6", icon="x", annotation="banner `failure` del DS, sin drama, con el texto del prototipo; subtítulo «Elegiste la línea 6 en Go. Desafío completado: tus rachas siguen en pie.»; sin confeti. Perder también suma a la racha" (state_override)
  - codigo: annotation="línea 4 «🐛 acá estaba el bug» (ámbar) y línea 6 «✗ tu elección» (barra y fondo de error); en mobile ambos tags bajo su línea (CA 5)" (state_override)

### sin juegos pendientes
- Aplica: Sí (sub-estado de default)
- Mensaje: Bug encontrado en la línea 4. No te quedan juegos pendientes hoy.
- Cambios:
  - btn-siguiente: oculto en este estado (hidden_in_states)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Desafío anulado. Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - veredicto: content="Desafío anulado", annotation="`h1` visible, sin banner ni confeti" (state_override)
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - pregunta: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - test-falla: oculto en este estado (hidden_in_states)
  - fix: oculto en este estado (hidden_in_states)
  - explicacion-titulo: oculto en este estado (hidden_in_states)
  - lista-pasos: oculto en este estado (hidden_in_states)
  - chip-tipo: oculto en este estado (hidden_in_states)
  - Compartir del header: oculto en este estado

### success
- Aplica: Sí (sub-estado de default)
- Mensaje: ✓ Copiado: pegalo donde quieras.
- Cambios:
  - Compartir del header: content="✓ Copiado", icon="check", annotation="confirmación en el mismo botón (`role=status`) durante unos segundos; vuelve a «Compartir»" (state_override)

### ya reportado
- Aplica: Sí (sub-estado de default; se combina con cualquier otro sub-estado)
- Mensaje: Ya reportaste este desafío.
- Cambios:
  - link-reportar: content="Ya reportaste este desafío", state="disabled", icon="check" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando tu resultado de bug-hunt…
- Cambios:
  - veredicto: oculto en este estado (hidden_in_states)
  - pregunta: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - test-falla: oculto en este estado (hidden_in_states)
  - fix: oculto en este estado (hidden_in_states)
  - explicacion-titulo: oculto en este estado (hidden_in_states)
  - lista-pasos: oculto en este estado (hidden_in_states)
  - chip-tipo: oculto en este estado (hidden_in_states)
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
  - veredicto: oculto en este estado (hidden_in_states)
  - pregunta: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - test-falla: oculto en este estado (hidden_in_states)
  - fix: oculto en este estado (hidden_in_states)
  - explicacion-titulo: oculto en este estado (hidden_in_states)
  - lista-pasos: oculto en este estado (hidden_in_states)
  - chip-tipo: oculto en este estado (hidden_in_states)
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
- Compartir del header · on click → share nativo con «🐛 Bug Hunt #8 · JavaScript / 🟩 bug encontrado / nerdose.dev» (en el idioma activo) o copia al portapapeles (estado success); registra `share:bug-hunt`
- tabs-lenguaje · tocar pestaña o flechas ← → → el mismo código en otro lenguaje con las mismas líneas marcadas, y el fix en ese lenguaje; no cambia la preferencia
- ES|EN · on change → veredicto, especificación, pasos, tipo de bug y tags pasan al otro idioma; el código, el test que falla, el fix y el lenguaje no cambian (CA 22)
- btn-siguiente · on click → siguiente juego pendiente
- link-volver · on click → `home`
- link-reportar · on click → abre O-01 desde el resultado (también el anulado), sin el aviso de spoilers; al cerrarlo el foco vuelve al enlace. Tras «Gracias, recibimos tu reporte» o `already_reported` → estado `ya reportado` (REQ-007)

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Si se copia al portapapeles: el botón pasa a «✓ Copiado» (estado success). Si el share falla, el botón vuelve a «Compartir» y se puede reintentar.

## Accesibilidad

- **Orden de foco:** header → veredicto → pestañas de lenguaje → cuerpo del código (si desborda; lectura) → panel de explicación (test que falla, fix y pasos como lectura; el fix es alcanzable si desborda) → card de cierre (link-stats → btn-siguiente → link-volver) → link-reportar (Compartir va en el header). En desktop el DOM sigue el orden visual: columna izquierda y luego el panel; en mobile el panel va antes de la card de cierre.
- **Landmarks y jerarquía:** `h1` es el veredicto (`sr-only` al ganar); la pregunta, «el test que falla», «el fix», «Por qué falla» y rachas son `h2`. Landmarks: header (breadcrumb como `nav` con nombre), main (el panel de explicación como `aside` con nombre «Por qué falla»), footer.
- **Foco y teclado:** O-01 atrapa el foco y lo devuelve a `link-reportar`. Las líneas del código no son interactivas en el resultado.
- **Propio de esta composición:** la línea del bug y la elegida se distinguen con barra, glifo (✓ / 🐛 / ✗) y texto («acá estaba el bug», «tu elección»), no solo con color (CA 5, 23, NFR-U04). El esperado y el obtenido llevan su palabra; el fix sus prefijos `-`/`+`. Cada tag se asocia a su línea (`aria-describedby`). La confirmación «Copiado» se anuncia con `role=status`. El confeti es `aria-hidden` y respeta `prefers-reduced-motion`.

## Decisiones y descartes

**Decisiones tomadas:**
- `perdió` y `anulado` son sub-estados de la misma pantalla, no pantallas aparte (C-12, C-41).
- REQ-010: header `game-header` (`finished`) con Compartir activo, como el prototipo y los otros juegos: se quitan `btn-compartir` y `toast-copiado` del cuerpo; la confirmación de copia es el estado «✓ Copiado» del botón del header (el DS no tiene toast).
- REQ-010: veredicto con el criterio común del 2026-11-11: al ganar, confeti del color del juego y `h1` `sr-only`; al perder, banner `failure` con el texto del prototipo («El bug estaba en la línea 4, no en la 6»). La señal visible con ícono y texto que pide CA 5 y CA 23 la dan los tags del código.
- REQ-010: composición del prototipo (`tpl-BugHunt`): código con las líneas marcadas a la izquierda y el panel de explicación a la derecha con «el test que falla», «el fix · línea N», «Por qué falla» con pasos numerados y el chip del tipo. El banner del prototipo con la racha y «Siguiente juego →» se reemplaza por la card de cierre común (rachas + cuenta regresiva + salidas), como en los otros juegos. Se reemplazan las `card` genéricas (`card-test`, `card-fix`, `card-explicacion`) por las piezas del pattern de Bug Hunt.
- REQ-010 (pendiente del diseño técnico: tipo de bug): se muestra el chip «tipo: …» con la etiqueta de `bug_type` en el idioma activo. El chip «mutación: > → >=» del prototipo no se muestra: el resultado no trae la mutación como campo (decisión 9) y el diff ya muestra el cambio. El tipo nunca va en el share (CA 10).
- REQ-010: el fix es un diff de una línea en el lenguaje de la pestaña activa (`fix[lang].before` / `after`, decisión 9): cambia junto con el código, así el jugador ve el fix del mismo código que está leyendo.
- REQ-010: la especificación se repite bajo la pregunta: el fix y la explicación se leen contra ella (en la partida estaba arriba del código).
- REQ-010: en mobile los tags de línea bajan a una segunda fila bajo su línea, como las notas de Big O (`code-block` 1.1.0 «nota bajo la línea en bloques angostos»), para que «acá estaba el bug» no quede fuera de la vista dentro del scroll horizontal.
- REQ-010: las pestañas arrancan en el lenguaje con el que confirmó (`result.code_language`); el share lleva ese lenguaje (CA 10) y se arma en el idioma activo (`share(result, number, locale)`, decisión 9): es el primer share con texto, no solo emojis.
- REQ-010: `card-rachas` dentro de la card de cierre, como en los otros juegos. Las stats por lenguaje y por tipo de bug van en `estadisticas` (FG-10).
- REQ-007: «Reportar un problema» es un enlace secundario al final; el estado «ya reportado» se lee de `GameToday.reported`. `anulado` es una sola variante mínima (aviso + rachas, sin código, solución ni Compartir).

**Alternativas descartadas:**
- Banner `success` al ganar (como el prototipo): el criterio común del 2026-11-11 lo reemplaza por el confeti en todos los juegos.
- Caja «// lo que compartís» del prototipo: duplica el botón Compartir del header y ningún otro juego la muestra.
- «↺ reiniciar demo» del prototipo: es propio de la demo; una partida diaria no se reinicia.
- El fix como diff unificado de toda la función: el bug es siempre de una sola línea y el diff de una línea entra a 320 px.
- Mostrar el fix en los 3 lenguajes a la vez: triplica el bloque en mobile; la pestaña ya permite verlos todos.
- Los tags de línea siempre al margen derecho también en mobile: a 320 px quedan fuera de la vista dentro del scroll horizontal del código.

**Preguntas abiertas:**
- Pregunta 5 del product-map: «Siguiente juego» o «Volver a los juegos» (REQ-010 sigue el criterio de REQ-004 a REQ-009).

## Trazabilidad

- C-32, C-12, C-13, C-26, C-33, C-36, C-41 · REQ-010 (RF 5-8, 15; CA 4, 5, 8-10, 20, 22, 23) · flujos 1, 3, 4 y 5 de `user-flows.md` · REQ-007 (RF 1, 9).
