---
name: devdle-resultado
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

# Pantalla: Devdle · Resultado

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver el veredicto, la palabra con su categoría, definición y resumen, la distribución de intentos y las rachas, y compartir sin spoilers.
- **Viewports:**
  - **mobile** — veredicto arriba, explicación en columna y las salidas al pie de la columna principal.
  - **desktop** — columna principal a la izquierda (7/12) con veredicto, grilla, explicación y la card de cierre (rachas + salidas) al pie, todos con el mismo ancho; distribución y reporte a la derecha (5/12) como sección aparte. «Compartir» solo en el header.

## Entrada y salida

**Entradas:**
- `devdle-partida` · fin de partida (automático)
- `home` · tarjeta «completado» (CTA «Ver resultado»)
- URL directa `/devdle` con la Play terminada
- O-02 · «Marcar como completado» (estado anulado, FG-6)

**Salidas user-driven:**
- A O-01 · «Reportar un problema» (cuando exista, FG-6)
- A `home` · «Volver a los juegos»
- A `estadisticas` · «Ver mis estadísticas» o botón «Estadísticas» del header
- A la siguiente `*-instrucciones` · «Siguiente juego» (solo si hay otro juego pendiente hoy)

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · finished | layout | ambos | — | Breadcrumb `> nerdose / devdle`, «desafío del dd/mm», Compartir activo, idioma y racha |
| 2 | veredicto | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: perdió, anulado | Veredicto y resultado de la partida |
| 3 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de anulación |
| 4 | grilla-resultado | image | devdle.cell | content | ambos | hidden_in_states: loading, error de sistema, anulado | Tablero de los intentos jugados |
| 5 | card-palabra | card | — | content | ambos | hidden_in_states: loading, error de sistema | Palabra, categoría, definición y resumen en el idioma activo |
| 6 | distribucion | chart | devdle.distribution | content | ambos | hidden_in_states: loading, error de sistema, anulado | Stat propia: distribución de intentos 1–6 y derrotas (C-18) |
| 7 | card-rachas | card | — | content | ambos | hidden_in_states: loading, error de sistema | Rachas de Devdle y global actualizadas |
| 9 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Abre O-01 para avisar que el desafío está mal (FG-6) |
| 10 | cuenta-regresiva | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Cuenta regresiva al próximo desafío |
| 11 | btn-siguiente | button | secondary | input | ambos | hidden_in_states: loading, error de sistema, sin juegos pendientes | Lleva al siguiente juego pendiente |
| 12 | link-stats | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Ir a estadísticas |
| 13 | link-volver | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Salida a la home |
| 14 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 15 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 16 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 17 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- veredicto
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- grilla-resultado
- card-palabra
- distribucion
- card-rachas
- link-stats
- link-reportar
- cuenta-regresiva
- btn-siguiente
- link-volver

### desktop · 1200px
- veredicto
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- row `resultado`
  - col 7/12: veredicto, grilla-resultado, card-palabra, barra `salida` (tarjeta: cuenta-regresiva a la izquierda; btn-siguiente y link-volver a la derecha)
  - col 5/12: distribucion, link-reportar (las rachas pasan a la card de cierre de la col 7/12)

## Contenido

### header
- Texto/label: > nerdose / devdle · desafío del 30/10 · [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `finished` (REQ-004): Compartir activo con el acento del juego (único botón de compartir de la pantalla; texto: «🟩 Devdle #8 · 4/6» o «X/6», una línea de 🟩🟨⬛ por intento y «nerdose.dev», nunca la palabra ni la categoría); «Estadísticas» → `estadisticas`; ES|EN cambia solo la definición y el resumen; píldora con la racha global ya actualizada. «Cómo se juega» no se muestra en el resultado. Sin nav global ni `nav-movil`

### veredicto
- Texto/label: Ganaste en 4/6
- Icono: check
- Annotation: al ganar, sin banner: confeti verde del juego y `h1` `sr-only` («Ganaste en N/6»); al perder, banner `failure` del DS, sin drama, con el veredicto en texto además del color

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: warning
- Annotation: la anulación llega con FG-6; en REQ-004 solo se respeta el estado al leer

### grilla-resultado
- Texto/label: Tus intentos · tablero 4 × 6 letras con feedback
- Asset: placeholder 6:4
- Icono: nada
- Annotation: pattern `devdle.cell`, solo lectura; mismo símbolo + color + `aria-label` que en la partida

### card-palabra
- Texto/label: Palabra del día: PARSER
- Texto secundario: Categoría: ingeniería de software · Programa que analiza una secuencia de texto según una gramática formal. · Resumen: primer párrafo de Wikipedia en el idioma activo, con enlace a la fuente (CC BY-SA).
- Icono: nada
- Annotation: palabra y categoría no cambian con el idioma; definición y resumen se recalculan en el idioma activo al cambiar ES|EN (CA 15)

### distribucion
- Texto/label: // tus intentos · racha 3
- Etiquetas: 1 · 2 · 3 · 4 · 5 · 6 · X
- Texto secundario: 12 jugadas · 92% victorias
- Icono: nada
- Annotation: pattern `devdle.distribution`, con los datos de `game_stats` (solo vienen con la Play terminada). Barras 1 a 6 y X (derrotas); la barra del intento de hoy se destaca con el acento, con el número visible en la barra (no solo el color)

### card-rachas
- Texto/label: // rachas
- Texto secundario: Devdle: 3 días · Global: 4 días · récord Devdle: 7
- Icono: nada
- Annotation: rachas que devuelve el cierre (perder también suma). Si el jugador reabre el resultado más tarde, se leen con la racha viva

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: O-01 llega con FG-6: hasta entonces el enlace no se renderiza. Cuando exista, si ya reportó muestra «Ya reportado» (`already_reported`)

### cuenta-regresiva
- Texto/label: Próximo desafío en 05:42:10
- Icono: clock
- Annotation: al llegar a 0 recarga el día (Devdle vuelve a instrucciones del desafío nuevo)

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
- Texto/label: $ cargando tu resultado de devdle…
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
- Mensaje: Ganaste en 4/6.
- Cambios: ninguno respecto de default.

### perdió
- Aplica: Sí (sub-estado de default)
- Mensaje: No salió: X/6. Mostramos la palabra y su explicación.
- Cambios:
  - veredicto: content="No salió: X/6", icon="x", annotation="banner `failure`; perder también suma a la racha" (state_override)

### sin juegos pendientes
- Aplica: Sí (sub-estado de default)
- Mensaje: Ganaste en 4/6. No te quedan juegos pendientes hoy.
- Cambios:
  - btn-siguiente: oculto en este estado (hidden_in_states)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Desafío anulado. Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - veredicto: content="Desafío anulado" (state_override)
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - grilla-resultado: oculto en este estado (hidden_in_states)
  - distribucion: oculto en este estado (hidden_in_states)
  - Compartir del header: oculto en este estado

### success
- Aplica: Sí (sub-estado de default)
- Mensaje: ✓ Copiado: pegalo donde quieras.
- Cambios:
  - Compartir del header: content="✓ Copiado", icon="check", annotation="confirmación en el mismo botón (`role=status`) durante unos segundos; vuelve a «Compartir»" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando tu resultado de devdle…
- Cambios:
  - veredicto: oculto en este estado (hidden_in_states)
  - grilla-resultado: oculto en este estado (hidden_in_states)
  - card-palabra: oculto en este estado (hidden_in_states)
  - distribucion: oculto en este estado (hidden_in_states)
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
  - grilla-resultado: oculto en este estado (hidden_in_states)
  - card-palabra: oculto en este estado (hidden_in_states)
  - distribucion: oculto en este estado (hidden_in_states)
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
- Compartir del header · on click → share nativo o copia al portapapeles (estado success)
- ES|EN · on change → recarga definición y resumen en el otro idioma; palabra, tablero y distribución no cambian
- btn-siguiente · on click → siguiente juego pendiente
- link-reportar · on click → abre O-01 (FG-6)

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Si se copia al portapapeles: el botón pasa a «✓ Copiado» (estado success). Si el share falla, el botón vuelve a «Compartir» y se puede reintentar.

## Accesibilidad

- **Orden de foco:** header → veredicto → explicación → distribución → rachas → link-reportar → salidas (Compartir va en el header).
- **Landmarks y jerarquía:** `h1` es el veredicto; las secciones `//` (palabra, tus intentos, rachas) son `h2`. Landmarks: header (breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** O-01 atrapa el foco y lo devuelve a `link-reportar`.
- **Propio de esta composición:** La confirmación «Copiado» se anuncia con `role=status`; el veredicto y la barra destacada de la distribución se comunican con texto además del color.

## Decisiones y descartes

**Decisiones tomadas:**
- `perdió` y `anulado` son sub-estados de la misma pantalla, no pantallas aparte (C-12, C-41).
- En `anulado` se oculta «Compartir» y la stat propia: C-13 no cubre explícitamente la Play `voided` (pregunta 2 del product-map).
- Se omiten los extras del prototipo que no están en el PRD.
- REQ-004: header `game-header` (`finished`) con Compartir activo, como pide el DS. Revisión visual (2026-11-09): se quitó el `btn-compartir` del cuerpo; el prototipo tiene un único Compartir en el header, en el mismo lugar en todos los juegos. El veredicto y la barra de salidas pasan a la columna principal para que la lateral quede como sección aparte.
- REQ-004: la distribución muestra 1–6 y X (derrotas) desde `game_stats` (decisión 10 del diseño técnico) con el pattern `devdle.distribution`.
- REQ-004: la confirmación de copia es un cambio de estado del Compartir del header («✓ Copiado»), no un toast: el DS no tiene toast y el botón ya cubre el trabajo.
- REQ-004: «Siguiente juego» solo aparece si queda un juego con desafío sin completar; mientras los otros 4 no tengan desafío (supuesto «Juegos distintos de Devdle»), no se muestra.
- REQ-004: la categoría es una de las 8 del banco y la definición y el resumen siguen el idioma activo (CA 15).

**Alternativas descartadas:**
- Compartir también en el cuerpo: dos botones iguales compiten; el prototipo usa solo el del header.
- Toast «Copiado»: requiere un componente nuevo del DS para un solo uso.

**Preguntas abiertas:**
- Pregunta 2 del product-map: variantes de resultado anulado con y sin resultado propio.
- Pregunta 5 del product-map: «Siguiente juego» o «Volver a los juegos» (REQ-004 solo fija que «Siguiente juego» se oculta cuando no hay pendientes).

- 2026-11-11 (pedido del usuario): al ganar no hay banner `success`: festeja un confeti del color del juego (host `web`, solo en la transición partida → resultado ganado, sin animación con `prefers-reduced-motion`) y el `h1` del veredicto queda `sr-only`. Al perder se mantiene el banner `failure`. Rachas y salidas van en una sola card de cierre (rachas en una línea + cuenta regresiva y salidas) debajo del tablero, para que la racha quede a la vista sin scroll; `card-rachas` deja de existir como card aparte.

## Trazabilidad

- C-18, C-12, C-13, C-33, C-36, C-41 · REQ-004 (RF 12-16; CA 8-11, 14, 15) · flujos 1, 3, 4 y 5 de `user-flows.md`.
