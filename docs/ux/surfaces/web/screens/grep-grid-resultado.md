---
name: grep-grid-resultado
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

# Pantalla: Grep Grid · Resultado

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver el veredicto `N/8` (victoria solo con 8/8), la grilla con las 8 palabras marcadas distinguiendo las encontradas de las reveladas, la lista de las 8 palabras con su definición y las rachas actualizadas; compartir `N/8` sin revelar las palabras.
- **Viewports:**
  - **mobile** — veredicto (banner) arriba, grilla final, card de cierre (rachas + salidas), lista de palabras con definiciones y reporte, en una columna en el orden del DOM (principal y después lateral).
  - **desktop** — veredicto (banner) a todo el ancho; debajo, grilla final y card de cierre (rachas + salidas) en la columna principal (7/12) y lista de palabras con definiciones y reporte en el lateral (5/12), alineadas arriba (patrón común de resultado, REQ-012). «Compartir» solo en el header.

## Entrada y salida

**Entradas:**
- `grep-grid-partida` · fin de partida (automático: octava palabra o rendición confirmada)
- `home` · tarjeta «completado» (CTA «Ver resultado»)
- URL directa `/grep-grid` con la Play terminada
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
| 1 | header | header | game-header · finished | layout | ambos | — | Breadcrumb `> nerdose / grep-grid`, «desafío del dd/mm», Compartir activo, idioma y racha |
| 2 | veredicto | banner | success · h1 | feedback | ambos | hidden_in_states: loading, error de sistema; state_overrides: perdió, anulado | Veredicto siempre visible: `banner` del DS con el título como `h1` y un detalle corto |
| 3 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de anulación |
| 4 | grilla-final | image | grep-grid.cell | content | ambos | hidden_in_states: loading, error de sistema, anulado | Grilla 12×12 con las 8 palabras marcadas: encontradas y reveladas, distinguidas por algo más que el color |
| 5 | lista-palabras | list | grep-grid.word | content | ambos | hidden_in_states: loading, error de sistema, anulado | Las 8 palabras con su definición en el idioma activo; las reveladas marcadas como no encontradas |
| 6 | card-rachas | card | — | content | ambos | hidden_in_states: loading, error de sistema | Rachas de Grep Grid y global actualizadas |
| 7 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema; state_overrides: ya reportado | Abre O-01 para avisar que el desafío está mal (C-36); deshabilitado si el jugador ya reportó este desafío |
| 8 | cuenta-regresiva | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Cuenta regresiva al próximo desafío |
| 9 | btn-siguiente | button | secondary | input | ambos | hidden_in_states: loading, error de sistema, sin juegos pendientes | Lleva al siguiente juego pendiente |
| 10 | link-stats | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Ir a estadísticas |
| 11 | link-volver | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Salida a la home |
| 12 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 13 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 14 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 15 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- veredicto
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- grilla-final
- card-rachas
- link-stats
- cuenta-regresiva
- btn-siguiente
- link-volver
- lista-palabras
- link-reportar

### desktop · 1200px
- veredicto (12/12)
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- row `resultado`
  - col 7/12: grilla-final, card de cierre (rachas en una línea con link-stats; debajo cuenta-regresiva a la izquierda y btn-siguiente + link-volver a la derecha)
  - col 5/12: lista-palabras (con definiciones), link-reportar (siempre último)

## Contenido

### header
- Texto/label: > nerdose / grep-grid · desafío del 30/10 · [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `finished` (REQ-005): Compartir activo con el acento del juego (único botón de compartir de la pantalla; texto en tres líneas: «🔎 Grep Grid #8», «5/8» y «nerdose.dev», nunca las palabras ni si el jugador se rindió, CA 16); «Estadísticas» → `estadisticas`; ES|EN cambia solo las definiciones; píldora con la racha global ya actualizada. «Cómo se juega» no se muestra en el resultado. Sin nav global ni `nav-movil`

### veredicto
- Texto/label: 8/8: las encontraste todas · Repasá qué significa cada una.
- Icono: check
- Annotation: `Banner` de `@nerdose/ui` con `titleAs="h1"`, siempre visible arriba y a ancho completo (patrón común, REQ-012): `success` al ganar (detalle «Repasá qué significa cada una.») y `failure` al rendirse (detalle «Estas son las palabras que faltaban.»), sin drama, con el veredicto en texto además del color. El confeti del host sigue al ganar. Ya no hay `h1` `sr-only`. Victoria solo con 8/8 (RF 13)

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: `banner` `warning` del DS. Se muestra con la Play `voided` (`challenge_status: voided`): la anulación y «Marcar como completado» llegan con REQ-007

### grilla-final
- Texto/label: Grilla 12×12 · las 8 palabras marcadas · encontradas con relleno y ✓ · reveladas con borde punteado y ○
- Asset: placeholder 1:1
- Icono: nada
- Annotation: pattern `grep-grid.cell`, solo lectura. Encontradas: relleno del acento + glifo; reveladas (solo si se rindió): borde punteado del acento («todavía no» del DS) + glifo distinto, sin relleno, y `aria-label` «{letra}, {encontrada|revelada}» (RF 13, NFR-U04). Las posiciones llegan recién con el cierre (`result.words[].cells`). Al ganar no hay reveladas

### lista-palabras
- Texto/label: // palabras de hoy
- Forma: lista de 8 filas en el orden del desafío; cada fila: nombre de la palabra + etiqueta («✓ encontrada» o «○ no la encontraste») + definición breve en el idioma activo
- Icono: nada
- Annotation: pattern `grep-grid.word`; ahora las 8 tienen definición (RF 13). Las reveladas usan el estilo «pendiente» con la etiqueta «○ no la encontraste» en lugar del largo, para distinguirlas de las encontradas por texto y glifo, no solo por color. La cabecera `//` es `h2`. Las definiciones se recalculan en el idioma activo al cambiar ES|EN (CA 19)

### card-rachas
- Texto/label: (h2 `sr-only`: rachas) — fila superior de la card de cierre
- Texto secundario: Grep Grid: 3 días · Global: 4 días · récord: 7 · Ver mis estadísticas →
- Icono: nada
- Annotation: rachas que devuelve el cierre (rendirse también suma, CA 10, 17). Si el jugador reabre el resultado más tarde, se leen con la racha viva. La stat propia de Grep Grid (promedio de palabras y % de 8/8) se muestra en `estadisticas` (FG-10), no acá (supuesto «Stats propias»)

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: abre O-01 (bottom-sheet en mobile, modal en desktop) desde el resultado (también el anulado), sin el aviso de spoilers. Visible también en `anulado` (C-36 acepta desafíos `voided`). Con `reported: true` en `GameToday`, o tras un envío con éxito o `already_reported`, pasa al estado `ya reportado`: «Ya reportaste este desafío», deshabilitado y sin abrir O-01 (REQ-007)

### cuenta-regresiva
- Texto/label: Próximo desafío en 05:42:10
- Icono: clock
- Annotation: al llegar a 0 recarga el día (Grep Grid vuelve a instrucciones del desafío nuevo)

### btn-siguiente
- Texto/label: Siguiente juego
- Icono: arrow-right
- Annotation: lleva al próximo juego con desafío y sin completar; si no hay ninguno, no se muestra

### link-stats
- Texto/label: Ver mis estadísticas
- Icono: arrow-right
- Annotation: nada

### link-volver
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: nada

### loader
- Texto/label: $ cargando tu resultado de grep-grid…
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
- Mensaje: 8/8: las encontraste todas.
- Cambios: ninguno respecto de default.

### perdió
- Aplica: Sí (sub-estado de default)
- Mensaje: Te rendiste con 5/8. Estas son las palabras que faltaban.
- Cambios:
  - veredicto: content="Te rendiste con 5/8 · Estas son las palabras que faltaban.", variant="failure", icon="x", annotation="banner `failure`; rendirse también suma a la racha. Con 0/8 dice «Te rendiste con 0/8» (CA 12)" (state_override)
  - grilla-final: annotation="las 3 palabras faltantes aparecen reveladas: borde punteado + ○, distintas de las 5 encontradas (CA 10)" (state_override)
  - lista-palabras: las 3 palabras no encontradas llevan la etiqueta «○ no la encontraste» en lugar de «✓ encontrada» (state_override)

### sin juegos pendientes
- Aplica: Sí (sub-estado de default)
- Mensaje: 8/8: las encontraste todas. No te quedan juegos pendientes hoy.
- Cambios:
  - btn-siguiente: oculto en este estado (hidden_in_states)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Desafío anulado. Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - veredicto: content="Desafío anulado" (state_override)
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - grilla-final: oculto en este estado (hidden_in_states)
  - lista-palabras: oculto en este estado (hidden_in_states)
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
- Mensaje: $ cargando tu resultado de grep-grid…
- Cambios:
  - veredicto: oculto en este estado (hidden_in_states)
  - grilla-final: oculto en este estado (hidden_in_states)
  - lista-palabras: oculto en este estado (hidden_in_states)
  - card-rachas: oculto en este estado (hidden_in_states)
  - Compartir del header: oculto en este estado
  - link-reportar: oculto en este estado (hidden_in_states)
  - cuenta-regresiva: oculto en este estado (hidden_in_states)
  - btn-siguiente: oculto en este estado (hidden_in_states)
  - link-stats: oculto en este estado (hidden_in_states)
  - link-volver: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu resultado. Revisá tu conexión e intentá de nuevo.
- Cambios:
  - veredicto: oculto en este estado (hidden_in_states)
  - grilla-final: oculto en este estado (hidden_in_states)
  - lista-palabras: oculto en este estado (hidden_in_states)
  - card-rachas: oculto en este estado (hidden_in_states)
  - Compartir del header: oculto en este estado
  - link-reportar: oculto en este estado (hidden_in_states)
  - cuenta-regresiva: oculto en este estado (hidden_in_states)
  - btn-siguiente: oculto en este estado (hidden_in_states)
  - link-stats: oculto en este estado (hidden_in_states)
  - link-volver: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- Compartir del header · on click → share nativo con «🔎 Grep Grid #8 / 5/8 / nerdose.dev» o copia al portapapeles (estado success); no emite ningún evento (analítica retirada en REQ-011)
- ES|EN · on change → recarga las definiciones en el otro idioma; grilla, palabras, encontradas y reveladas no cambian (CA 19)
- btn-siguiente · on click → siguiente juego pendiente
- link-reportar · on click → abre O-01 desde el resultado (también el anulado), sin el aviso de spoilers; al cerrarlo el foco vuelve al enlace y la pantalla sigue igual. Tras «Gracias, recibimos tu reporte» o `already_reported` → estado `ya reportado` (REQ-007)

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Si se copia al portapapeles: el botón pasa a «✓ Copiado» (estado success). Si el share falla, el botón vuelve a «Compartir» y se puede reintentar.

## Accesibilidad

- **Orden de foco:** header → veredicto → grilla final (lectura) → card de cierre (rachas y salidas) → lista de palabras (lectura) → link-reportar (Compartir va en el header).
- **Landmarks y jerarquía:** `h1` es el veredicto; las secciones `//` (palabras de hoy, rachas) son `h2`. Landmarks: header (breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** O-01 atrapa el foco y lo devuelve a `link-reportar`. La grilla final no es interactiva: se recorre como lectura, con `aria-label` por celda.
- **Propio de esta composición:** La confirmación «Copiado» se anuncia con `role=status`; el veredicto, y la diferencia entre palabras encontradas y reveladas, se comunican con texto y glifo además del color (NFR-U04, RF 13).

## Decisiones y descartes

**Decisiones tomadas:**
- `perdió` y `anulado` son sub-estados de la misma pantalla, no pantallas aparte (C-12, C-41).
- En `anulado` se oculta «Compartir», la grilla y la lista: una Play `voided` por «Marcar como completado» no tiene resultado (pregunta 2 del product-map).
- Se omiten los extras del prototipo que no están en el PRD («tu tiempo final es tu puntaje», reloj).
- REQ-005: header `game-header` (`finished`) con Compartir activo, como Devdle (revisión visual 2026-11-09): se quitan `btn-compartir` y `toast-copiado` del cuerpo; la confirmación de copia es el estado «✓ Copiado» del botón del header, no un toast (el DS no tiene toast).
- REQ-005: el share es `🔎 Grep Grid #N` / `N/8` / `nerdose.dev`, sin palabras ni indicio de rendición (supuesto «Formato del share», CA 16).
- REQ-005: encontradas y reveladas se distinguen con relleno + ✓ frente a borde punteado + ○, siguiendo el rasgo «punteado = todavía no» del DS, y en la lista con la etiqueta «○ no la encontraste» (RF 13, NFR-U04). El estado «revelada» de `grep-grid.cell` no existe en el DS: queda anotado para que la story lo documente.
- REQ-005: la lista muestra las 8 definiciones en el idioma activo (RF 13, CA 19); la stat propia (promedio y % de 8/8) no se muestra en el resultado sino en `estadisticas` (FG-10).
- REQ-005: «Siguiente juego» solo aparece si queda un juego con desafío sin completar, como en Devdle.
- REQ-005: la grilla final va en la columna principal y la lista con definiciones en la lateral, como el layout tablero + aside del prototipo; en mobile la lista sigue a la grilla porque es el momento de aprendizaje.
- REQ-007: «Reportar un problema» se renderiza en los tres juegos (deja de estar oculto hasta FG-6). Es un enlace secundario al final de la columna lateral, no un botón, para no competir con la acción del juego; el estado «ya reportado» se lee de `GameToday.reported` para no ofrecer un intento que va a fallar.
- REQ-012 (S-064, patrón común de resultado, implementado fuera del workflow el 2026-11-25): el veredicto vuelve a ser siempre visible como `banner` (también al ganar, con detalle nuevo «Repasá qué significa cada una.»), arriba y a ancho completo; se quita el `h1` `sr-only` y el armado con `contents` + `order`. Principal (7/12): grilla y card de cierre; lateral (5/12): lista con definiciones y reporte, siempre último. En mobile el orden es el del DOM, así que la card de cierre queda antes de la lista. Supera la nota del 2026-11-11 sobre el banner al ganar.
- REQ-007 resuelve la pregunta 2 del product-map: `anulado` es una sola variante mínima (aviso + rachas, sin Compartir ni solución) haya o no jugado el jugador antes de la anulación. `GameToday` devuelve la Play `voided` con `result: null` y `public_view: null` (decisión 5 del diseño técnico). «Reportar un problema» sigue visible.

**Alternativas descartadas:**
- Compartir también en el cuerpo: dos botones iguales compiten; el prototipo usa solo el del header.
- Toast «Copiado»: requiere un componente nuevo del DS para un solo uso.
- Revelar las faltantes con relleno de otro color: no cumple NFR-U04 por sí solo y agrega un color fuera de la escala del acento.
- Mostrar el promedio y el % de 8/8 en el resultado: la pantalla que los muestra es de FG-10 y el DS no define la pieza; las rachas alcanzan para el cierre.

**Preguntas abiertas:**
- Pregunta 5 del product-map: «Siguiente juego» o «Volver a los juegos» (REQ-005 sigue el criterio de REQ-004).

- 2026-11-11 (pedido del usuario): al ganar no hay banner `success`: festeja un confeti del color del juego (host `web`, solo en la transición partida → resultado ganado, sin animación con `prefers-reduced-motion`) y el `h1` del veredicto queda `sr-only`. Al perder se mantiene el banner `failure`. Rachas y salidas van en una sola card de cierre (rachas en una línea + cuenta regresiva y salidas) debajo del tablero, para que la racha quede a la vista sin scroll; `card-rachas` deja de existir como card aparte.

## Trazabilidad

- C-22, C-12, C-13, C-33, C-36, C-41 · REQ-005 (RF 12-14, 22; CA 9, 10, 12, 16-19) · flujos 1, 3, 4 y 5 de `user-flows.md` · REQ-007 (RF 1, 9; CA 1-3, 24) · REQ-012 (S-064).
