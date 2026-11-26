---
name: big-o-resultado
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

# Pantalla: Big O · Resultado

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver si acertó, la opción correcta junto a la elegida (con ícono y texto, no solo color), el código con una nota en cada loop o llamada, la explicación paso a paso (costo de cada bloque, reglas de anidamiento y secuencia, simplificación final), el recuadro «en números» y el consejo si la receta tenía trampa; ver las rachas actualizadas y compartir sin revelar la respuesta.
- **Viewports:**
  - **mobile** — veredicto (banner) arriba; pregunta, pestañas, código con notas, la grilla de opciones (2 columnas) y la card de cierre (rachas + salidas); después la explicación completa y el reporte, en una columna (orden del DOM: principal y después lateral). Las líneas largas del código saltan con sangría colgante (sin scroll horizontal) y las notas bajan a una segunda fila bajo su línea.
  - **desktop** — veredicto a ancho completo; código, opciones (4 columnas) y la card de cierre a la izquierda (7/12); la explicación «// por qué · Paso a paso» como panel a la derecha (5/12), como el prototipo, y debajo el reporte. «Compartir» solo en el header.

## Entrada y salida

**Entradas:**
- `big-o-partida` · fin de partida (automático al confirmar)
- `home` · tarjeta «completado» (CTA «Ver resultado»)
- URL directa `/big-o` con la Play terminada (RF 8)
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
| 1 | header | header | game-header · finished | layout | ambos | — | Breadcrumb `> nerdose / big-o`, «desafío del dd/mm», Compartir activo, idioma y racha |
| 2 | veredicto | banner | success · h1 | feedback | ambos | hidden_in_states: loading, error de sistema; state_overrides: perdió, anulado | Veredicto siempre visible (`Banner` con `titleAs="h1"`): la respuesta correcta y un detalle, en texto además del color |
| 3 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de anulación |
| 4 | pregunta | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema, anulado | La pregunta del juego, como en la partida |
| 5 | tabs-lenguaje | tabs | code-block · tablist | navigation | ambos | hidden_in_states: loading, error de sistema, anulado | Pestañas JavaScript / Go / Java (solo vista); arranca en el lenguaje con el que confirmó |
| 6 | codigo | image | code-block · readonly | content | ambos | hidden_in_states: loading, error de sistema, anulado; viewport_overrides: mobile→notas bajo la línea | El código con las líneas de cada loop o llamada resaltadas y su nota («n veces»); las líneas largas saltan con sangría colgante |
| 7 | opciones-resultado | chips | big-o.option · resultado | content | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: perdió | Las 8 opciones con la correcta y la elegida marcadas con ícono y texto |
| 8 | explicacion-titulo | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema, anulado | Cabecera del panel de explicación: «// por qué» + «Paso a paso» |
| 9 | lista-pasos | list | big-o.step | content | ambos | hidden_in_states: loading, error de sistema, anulado | De 2 a 6 pasos numerados: costo de cada bloque, reglas de composición y simplificación final |
| 10 | caja-numeros | card | big-o · en números | content | ambos | hidden_in_states: loading, error de sistema, anulado, sin ejemplo | Recuadro «// en números, con n = N»: operaciones de f(n) en ese n y las que daría la trampa |
| 11 | consejo | paragraph | body | content | ambos | hidden_in_states: loading, error de sistema, anulado, sin ejemplo | Consejo para las recetas con trampa |
| 12 | card-rachas | card | — | content | ambos | hidden_in_states: loading, error de sistema | Rachas de Big O y global actualizadas (fila superior de la card de cierre) |
| 13 | link-stats | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Ir a estadísticas |
| 14 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema; state_overrides: ya reportado | Abre O-01 para avisar que el desafío está mal (C-36); deshabilitado si el jugador ya reportó este desafío. Siempre último del lateral |
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
- opciones-resultado
- card-rachas
- link-stats
- cuenta-regresiva
- btn-siguiente
- link-volver
- explicacion-titulo
- lista-pasos
- caja-numeros
- consejo
- link-reportar

### desktop · 1200px
- veredicto
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- row `resultado`
  - col 7/12: pregunta, tabs-lenguaje, codigo, opciones-resultado, card de cierre (card-rachas en una línea con link-stats; debajo cuenta-regresiva a la izquierda y btn-siguiente + link-volver a la derecha)
  - col 5/12: panel `explicacion` (explicacion-titulo, lista-pasos, caja-numeros, consejo), link-reportar

## Contenido

### header
- Texto/label: > nerdose / big-o · desafío del 30/10 · [stats] [Compartir] ES|EN · 🔥 17
- Icono: nada
- Annotation: `game-header` variant `finished` (REQ-009, como el prototipo `tpl-BigO`): Compartir activo con el acento del juego (`#5EB1FF` sobre `#06121F`), único botón de compartir de la pantalla. Texto en tres líneas: «🧮 Big O #8», «🟩 Java» (🟥 si perdió; el lenguaje con el que confirmó) y «nerdose.dev», igual en ES y EN; nunca la opción elegida ni la correcta (CA 10). «Estadísticas» → `estadisticas`; ES|EN cambia el veredicto, los pasos, las notas, «en números» y el consejo; píldora con la racha global ya actualizada. «Cómo se juega» no se muestra en el resultado. Sin nav global ni `nav-movil`

### veredicto
- Texto/label: Correcto: O(n log n)
- Texto secundario: Confirmaste en Java. El paso a paso repasa por qué es O(n log n).
- Icono: check
- Annotation: `Banner` `success` de `@nerdose/ui` con `titleAs="h1"`, siempre visible arriba y a ancho completo (REQ-012, patrón común de resultado; reemplaza el `h1` `sr-only` del caso ganador). El confeti azul del juego sigue igual (host `web`, solo en la transición partida → resultado ganado, sin animación con `prefers-reduced-motion`). Al perder, banner `failure` del DS, sin drama (ver estado `perdió`). El detalle no dice «abajo» ni «a la derecha»: la posición del paso a paso cambia según el viewport

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: `banner` `warning` del DS. Se muestra con la Play `voided` (`challenge_status: voided`); `GameToday` devuelve `result: null` y `public_view: null` (REQ-007)

### pregunta
- Texto/label: ¿Cuál es la complejidad temporal (peor caso) de f(n)?
- Icono: nada
- Annotation: Mono 30 en desktop (26 en mobile) con `f(n)` en el acento, como el `h1` del prototipo; acá es `h2` porque el `h1` es el veredicto

### tabs-lenguaje
- Texto/label: —
- Etiquetas: JavaScript · Go · Java (nombre de archivo a la derecha: `f.js` · `f.go` · `F.java`)
- Icono: nada
- Annotation: arranca en `result.code_language` (el lenguaje con el que confirmó); cambiar de pestaña es solo vista y no cambia la preferencia. Las notas por línea valen para los 3 lenguajes (misma línea por sentencia, decisión 3 del diseño técnico)

### codigo
- Texto/label: function f(n) { … } · líneas 3 y 4 resaltadas con «n veces» y «log n veces»
- Asset: placeholder 4:3 (hasta ~15 líneas)
- Icono: nada
- Annotation: `code-block` `readonly` del DS: las líneas de `explanation.line_notes` llevan fondo `game.big-o.line-highlight` (`#0E1D2E`) + barra `inset 3px` `#5EB1FF` y la nota en `game.big-o.light` (`#8CC8FF`, Mono 12), en el idioma activo. En desktop la nota va al margen derecho de su línea, como el prototipo; **en mobile baja a una segunda fila bajo su línea**, alineada con el código, para que no compita por el ancho con el código (`viewport_override`; ver «Design System» en la Revisión UX). Mismo resaltado de sintaxis y fallback sin color que en la partida; texto seleccionable. Las líneas largas saltan con sangría colgante (`CodeText`, REQ-012 / S-066): no hay scroll horizontal ni en el bloque ni en la página (CA 21)

### opciones-resultado
- Texto/label: // tu respuesta · confirmada en Java
- Etiquetas: O(1) · O(log n) · O(n) · O(n log n) ✓ correcta · tu respuesta · O(n²) · O(n³) · O(2ⁿ) · O(n!)
- Icono: nada
- Annotation: pattern `big-o.option` en modo resultado, solo lectura (lista, no `radiogroup`), en el mismo orden y grilla que la partida (2 columnas en mobile, 4 en desktop). Correcta: relleno `#3DDC84`, texto `#06120B` 800, ✓ y la etiqueta «correcta» debajo del valor (L970 del prototipo). Elegida e incorrecta: fondo `#0F1318`, borde 2px `status.error` (`#FF7B72`), ✗ y la etiqueta «tu respuesta»; nunca relleno rojo. Si coinciden: «✓ correcta · tu respuesta». El resto, apagadas (`text.muted`, borde `#1E252E`). Cada opción marcada se anuncia con su etiqueta («O(n²), tu respuesta, incorrecta»), así que el resultado no depende del color (CA 5, 21, NFR-U04). La cabecera dice con qué lenguaje confirmó

### explicacion-titulo
- Texto/label: Paso a paso
- Texto secundario: // por qué
- Icono: nada
- Annotation: cabecera del `panel` de explicación (fondo `#0F1318`, borde `#222A33`, `radius.panel`, padding 24), como el `aside` del prototipo: comentario `// por qué` (Mono 13 `text.dim`) arriba del `h2` (Mono 22)

### lista-pasos
- Texto/label: —
- Forma: `<ol>` de 2 a 6 pasos en el idioma activo: un paso de costo por bloque, uno por regla de composición (anidamiento = producto, secuencia = suma y domina el mayor) y uno final de simplificación («descartamos constantes y términos menores: O(n log n)»)
- Icono: nada
- Annotation: pattern `big-o.step` (número en cuadrado 28×28 `#11243A` / `#8CC8FF`, texto Inter 15/1,55 `text.body`; `<code>` Mono sin fondo; la respuesta en `<b>`). El texto llega del servidor ya resuelto en el locale (`explanation.steps`, ADR-015), nunca se arma en el cliente. En recursión doble un paso aclara que la cota exacta es φⁿ ≈ 1,618ⁿ, dentro de O(2ⁿ) (CA 16)

### caja-numeros
- Texto/label: // en números, con n = 1024
- Texto secundario: f(1024) cuenta 10.240 operaciones · con O(n²) serían 1.048.576
- Icono: nada
- Annotation: caja «en números» del pattern de Big O (radio 12, `#0B1522` / `#1B2E45`, Mono 13, valores en `<b>` `text.primary`), como el prototipo. Sale de `explanation.example`: `n`, `ops` (comprobado por ejecución) y `trap_ops`; la segunda línea solo aparece si hay trampa (`trap_ops` no nulo) y nombra la `trap_option` («con O(n²) serían…»). Números con separador de miles del idioma activo (`10.240` / `10,240`). Si no hay `example`, no se muestra

### consejo
- Texto/label: La trampa más común es ver dos for y responder O(n²). Mirá siempre cómo avanza cada variable.
- Icono: nada
- Annotation: `explanation.tip` en el idioma activo (Inter 14/1,5 `#9AA6B2`, `<code>` en Mono), solo en las recetas con trampa; si es `null`, no se muestra

### card-rachas
- Texto/label: (h2 `sr-only`: rachas) — fila superior de la card de cierre
- Texto secundario: Big O: 9 días · Global: 17 días · récord Big O: 12 · Ver mis estadísticas →
- Icono: nada
- Annotation: rachas que devuelve el cierre; perder también suma (CA 9). Si el jugador reabre el resultado más tarde, se leen con la racha viva. Las stats propias de Big O (aciertos por categoría de receta) se muestran en `estadisticas` (FG-10), no acá (supuesto «Stats propias» del REQ)

### link-stats
- Texto/label: Ver mis estadísticas
- Icono: arrow-right
- Annotation: nada

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: slot `aside` del host, siempre último del lateral (debajo del panel de explicación). Abre O-01 (bottom-sheet en mobile, modal en desktop) desde el resultado (también el anulado), sin el aviso de spoilers. Con `reported: true` en `GameToday`, o tras un envío con éxito o `already_reported`, pasa al estado `ya reportado`: «Ya reportaste este desafío», deshabilitado y sin abrir O-01 (REQ-007)

### cuenta-regresiva
- Texto/label: Próximo desafío en 05:42:10
- Icono: clock
- Annotation: al llegar a 0 recarga el día (Big O vuelve a instrucciones del desafío nuevo)

### btn-siguiente
- Texto/label: Siguiente juego
- Icono: arrow-right
- Annotation: `button` `primary` como en el banner del prototipo («Siguiente juego →»); lleva al próximo juego con desafío y sin completar; si no hay ninguno, no se muestra

### link-volver
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: nada

### loader
- Texto/label: $ cargando tu resultado de big-o…
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
- Mensaje: Correcto: O(n log n). Confirmaste en Java. El paso a paso repasa por qué es O(n log n). Banner `success`, confeti y la opción marcada «✓ correcta · tu respuesta».
- Cambios: ninguno respecto de default.

### perdió
- Aplica: Sí (sub-estado de default)
- Mensaje: Incorrecto: era O(n log n). Elegiste O(n²) en Go. El paso a paso explica por qué.
- Cambios:
  - veredicto: content="Incorrecto: era O(n log n)", icon="x", annotation="banner `failure` del DS, sin drama; subtítulo «Elegiste O(n²) en Go. El paso a paso explica por qué.»; sin confeti. Perder también suma a la racha" (state_override)
  - opciones-resultado: content="// tu respuesta · confirmada en Go", annotation="O(n log n) ✓ correcta (relleno verde) · O(n²) ✗ tu respuesta (borde 2px de error, sin relleno) (CA 5)" (state_override)

### sin ejemplo
- Aplica: Sí (sub-estado de default o de perdió)
- Mensaje: La receta no trae recuadro «en números» ni consejo.
- Cambios:
  - caja-numeros: oculto en este estado (hidden_in_states)
  - consejo: oculto en este estado (hidden_in_states)
  - Nota: `example` y `tip` son independientes; con `example` sin trampa, la caja muestra solo la primera línea, y sin `tip` solo se oculta el consejo

### sin juegos pendientes
- Aplica: Sí (sub-estado de default)
- Mensaje: Correcto: O(n log n). No te quedan juegos pendientes hoy.
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
  - opciones-resultado: oculto en este estado (hidden_in_states)
  - explicacion-titulo: oculto en este estado (hidden_in_states)
  - lista-pasos: oculto en este estado (hidden_in_states)
  - caja-numeros: oculto en este estado (hidden_in_states)
  - consejo: oculto en este estado (hidden_in_states)
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
- Mensaje: $ cargando tu resultado de big-o…
- Cambios:
  - veredicto: oculto en este estado (hidden_in_states)
  - pregunta: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - opciones-resultado: oculto en este estado (hidden_in_states)
  - explicacion-titulo: oculto en este estado (hidden_in_states)
  - lista-pasos: oculto en este estado (hidden_in_states)
  - caja-numeros: oculto en este estado (hidden_in_states)
  - consejo: oculto en este estado (hidden_in_states)
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
  - opciones-resultado: oculto en este estado (hidden_in_states)
  - explicacion-titulo: oculto en este estado (hidden_in_states)
  - lista-pasos: oculto en este estado (hidden_in_states)
  - caja-numeros: oculto en este estado (hidden_in_states)
  - consejo: oculto en este estado (hidden_in_states)
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
- Compartir del header · on click → share nativo con «🧮 Big O #8 / 🟩 Java / nerdose.dev» o copia al portapapeles (estado success); no emite ningún evento (sin analítica desde REQ-011)
- tabs-lenguaje · tocar pestaña o flechas ← → → el mismo código en otro lenguaje, con las mismas notas por línea; no cambia la preferencia
- ES|EN · on change → veredicto, pasos, notas por línea, «en números» y consejo pasan al otro idioma; el código, las opciones y el lenguaje no cambian (CA 22)
- btn-siguiente · on click → siguiente juego pendiente
- link-volver · on click → `home`
- link-reportar · on click → abre O-01 desde el resultado (también el anulado), sin el aviso de spoilers; al cerrarlo el foco vuelve al enlace. Tras «Gracias, recibimos tu reporte» o `already_reported` → estado `ya reportado` (REQ-007)

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Si se copia al portapapeles: el botón pasa a «✓ Copiado» (estado success). Si el share falla, el botón vuelve a «Compartir» y se puede reintentar.

## Accesibilidad

- **Orden de foco:** header → veredicto → pestañas de lenguaje → cuerpo del código → opciones (lectura) → card de cierre (link-stats → btn-siguiente → link-volver) → explicación (lectura) → link-reportar (Compartir va en el header). El orden del DOM es el mismo en mobile y desktop: columna principal y luego el lateral.
- **Landmarks y jerarquía:** `h1` es el título del banner del veredicto (visible también al ganar); la pregunta, «tu respuesta», «Paso a paso» y rachas son `h2`. Landmarks: header (breadcrumb como `nav` con nombre), main (el panel de explicación como `aside` con nombre «Paso a paso»), footer.
- **Foco y teclado:** O-01 atrapa el foco y lo devuelve a `link-reportar`. Las opciones del resultado no son interactivas: se recorren como lectura.
- **Propio de esta composición:** la correcta y la elegida se distinguen con ✓/✗ y las etiquetas «correcta» / «tu respuesta», no solo con color (CA 5, 21, NFR-U04). Cada nota de línea se asocia a su línea (`aria-describedby`) para que el lector la lea junto al código. La confirmación «Copiado» se anuncia con `role=status`. El confeti es `aria-hidden` y respeta `prefers-reduced-motion`.

## Decisiones y descartes

**Decisiones tomadas:**
- `perdió` y `anulado` son sub-estados de la misma pantalla, no pantallas aparte (C-12, C-41).
- REQ-009: header `game-header` (`finished`) con Compartir activo, como el prototipo y los otros juegos: se quitan `btn-compartir` y `toast-copiado` del cuerpo; la confirmación de copia es el estado «✓ Copiado» del botón del header (el DS no tiene toast).
- REQ-009: veredicto con el criterio común del 2026-11-11: al ganar, confeti del color del juego y `h1` `sr-only`; al perder, banner `failure`. La señal visible con ícono y texto que pide CA 5 y CA 21 la da la grilla de opciones, que marca la correcta y la elegida con ✓/✗ y etiqueta; por eso se elimina la `card-respuesta` aparte.
- REQ-009: composición del prototipo (`tpl-BigO`): pregunta + código + grilla de opciones a la izquierda y el panel «// por qué · Paso a paso» a la derecha, con pasos numerados, recuadro «en números» y consejo. El banner del prototipo con la racha y «Siguiente juego →» se reemplaza por la card de cierre común (rachas + cuenta regresiva + salidas), como en los otros juegos.
- REQ-009: se incorporan el recuadro «en números» y el consejo, que el product-map marcaba «a validar»: el diseño técnico los convierte en datos verificados (`explanation.example`, comprobado por ejecución, y `explanation.tip`, decisión 5) y C-29 pide la explicación paso a paso. Se ocultan cuando la receta no los trae (estado `sin ejemplo`).
- REQ-009: las notas por línea («n veces», «log n veces») se muestran en el código del resultado, en el idioma activo, y valen para los 3 lenguajes. En mobile bajan a una segunda fila bajo su línea, para que no queden fuera de la vista dentro del scroll horizontal.
- REQ-009: la elegida e incorrecta se marca con borde 2px de error + ✗ + «tu respuesta», sin relleno rojo (error «sin dramatismo» del DS); resuelve el «Pendiente — elección incorrecta» del pattern `big-o.option`.
- REQ-009: las pestañas arrancan en el lenguaje con el que confirmó (`result.code_language`) y la cabecera de las opciones lo dice; el share lleva ese lenguaje (CA 10).
- REQ-009: share `🧮 Big O #N` / `🟩|🟥 <Lenguaje>` / `nerdose.dev`. Se confirma el 🧮 que propone el diseño técnico: es el ábaco de «contar operaciones», no se repite con los otros juegos (🟩 Devdle, 🔎 Grep Grid, ⏳ Tech Timeline) y no revela la respuesta.
- REQ-009: `card-rachas` dentro de la card de cierre, como en Devdle, Grep Grid y Tech Timeline. Las stats por categoría de receta van en `estadisticas` (FG-10).
- REQ-007: «Reportar un problema» es un enlace secundario al final; el estado «ya reportado» se lee de `GameToday.reported`. `anulado` es una sola variante mínima (aviso + rachas, sin código, solución ni Compartir).

- REQ-012 (2026-11-25, patrón común de resultado, S-064): el veredicto es siempre un `Banner` visible (`success` al ganar, con el detalle nuevo «Confirmaste en {lenguaje}. El paso a paso repasa por qué es {respuesta}.»; `failure` al perder), con el confeti del host igual; reemplaza el `h1` `sr-only` del criterio del 2026-11-11. Dos columnas reales: principal (pregunta, código, opciones y card de cierre) y lateral (explicación y reporte, siempre último); en mobile la card de cierre queda antes de la explicación. Los detalles no dicen «abajo».
- REQ-012 (S-066): el código no scrollea en horizontal: las líneas largas saltan con sangría colgante.

**Alternativas descartadas:**
- ~~Banner `success` al ganar (como el prototipo): el criterio común del 2026-11-11 lo reemplaza por el confeti en todos los juegos.~~ Revertido por REQ-012: el banner `success` vuelve, junto con el confeti.
- Mantener `card-respuesta` («Respuesta correcta: …, elegiste …»): duplica lo que la grilla ya muestra con ícono y texto, y en mobile empuja el código hacia abajo.
- Las notas por línea siempre al margen derecho también en mobile: a 320 px le quitan casi todo el ancho al código.
- Mostrar la categoría de la receta («loops anidados») en el resultado: no está en C-29 y el header del prototipo la usa como metadato también durante la partida, donde sería pista; queda para las stats por categoría (FG-10).
- Toast «Copiado»: requiere un componente nuevo del DS para un solo uso.

**Preguntas abiertas:**
- Pregunta 5 del product-map: «Siguiente juego» o «Volver a los juegos» (REQ-009 sigue el criterio de REQ-004 a REQ-006).

## Trazabilidad

- C-29, C-12, C-13, C-26, C-33, C-36, C-41 · REQ-009 (RF 5-8, 15; CA 4, 5, 9, 10, 16, 21, 22) · REQ-012 (S-064, S-066) · flujos 1, 3, 4 y 5 de `user-flows.md` · REQ-007 (RF 1, 9).
