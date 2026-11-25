---
name: estadisticas
surface: web
route: /stats
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.2"
date: 2026-11-15
---

# Pantalla: Estadísticas

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver su racha global y su récord, los desafíos completados, una tarjeta por juego (racha, récord, jugadas, ganadas, % de victorias y stats propias), el heatmap de los últimos 365 días y el historial de partidas con «Ver más».
- **Viewports:**
  - **mobile** — una sola columna: la racha global grande arriba y récord y completados apilados debajo (en una fila de 2 no entran a 320 px sin partir la etiqueta); el heatmap de 365 días scrollea dentro de su propio contenedor y arranca mostrando hoy (extremo derecho); una tarjeta por juego; historial de 3 columnas con «Ver más partidas» a todo el ancho. Sin scroll horizontal de la página desde 320 px.
  - **desktop** — tres cifras en fila; el heatmap entra completo en un panel a todo el ancho; tarjetas por juego en grilla 3 + 2; historial de 4 columnas en un panel propio.

## Entrada y salida

**Entradas:**
- `home` · «ver estadísticas →» o píldora de racha del header
- Header · `./stats`
- `*-partida` · botón «Estadísticas» del `game-header`
- `*-resultado` · «Ver mis estadísticas»

**Salidas user-driven:**
- A `home` · marca, `./juegos` o «Ir a los juegos» (estado vacío)

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Marca, nav, #número e idioma (`app-header` variant `default`) |
| 2 | titulo | heading | h1 | content | ambos | — | Título de la pantalla |
| 3 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Aviso O-03 del shell (cookies bloqueadas) |
| 4 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 5 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 6 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 7 | invitacion | card | — | feedback | ambos | visible_only_in_states: empty, sin sesión | Invitación a jugar cuando no hay partidas (`panel` del DS) |
| 8 | btn-ir-juegos | button | primary | input | ambos | visible_only_in_states: empty, sin sesión; state_overrides: sin sesión→disabled | Salida a los juegos desde el estado vacío |
| 9 | kpi-racha | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Racha global actual (`streak-number` variant `card`) |
| 10 | kpi-record | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Récord de racha global (`card` variant `stat`) |
| 11 | kpi-completados | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Total de desafíos completados (`card` variant `stat`) |
| 12 | titulo-actividad | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema | Sección del heatmap |
| 13 | heatmap | chart | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Heatmap de los últimos 365 días (`heatmap` del DS) |
| 14 | detalle-dia | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Cantidad del día enfocado o tocado, en texto |
| 15 | titulo-juegos | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema | Sección de estadísticas por juego |
| 16 | stats-devdle | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Racha, récord, jugadas, ganadas, % de victorias y distribución de intentos de Devdle |
| 17 | stats-grep-grid | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Ídem, con promedio de palabras y % de 8/8 de Grep Grid |
| 18 | stats-timeline | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Ídem, con acierto por categoría y mejor categoría de Tech Timeline |
| 19 | stats-big-o | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Ídem, con aciertos por categoría de receta de Big O |
| 20 | stats-bug-hunt | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión | Ídem, con aciertos por lenguaje y por tipo de bug de Bug Hunt |
| 21 | titulo-historial | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema | Sección de historial |
| 22 | tabla-historial | table | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión; viewport_overrides: mobile→3 columnas / desktop→4 columnas | Historial de partidas completadas, de la más reciente a la más antigua |
| 23 | alerta-ver-mas | alert | error | feedback | ambos | visible_only_in_states: error al cargar más | Falla al pedir la página siguiente, sin perder las filas cargadas |
| 24 | btn-ver-mas | button | secondary | input | ambos | hidden_in_states: loading, error de sistema, empty, sin sesión, historial completo; state_overrides: cargando más→disabled | Agrega la página siguiente del historial |
| 25 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- titulo
- banner-cookies
- loader
- alerta-sistema
- btn-reintentar
- invitacion
- btn-ir-juegos
- kpi-racha
- kpi-record
- kpi-completados
- row `actividad` (card)
  - col 12/12: titulo-actividad, heatmap, detalle-dia
- titulo-juegos
- stats-devdle
- stats-grep-grid
- stats-timeline
- stats-big-o
- stats-bug-hunt
- row `historial` (card)
  - col 12/12: titulo-historial, tabla-historial, alerta-ver-mas, btn-ver-mas

### desktop · 1200px
- titulo
- banner-cookies
- loader
- alerta-sistema
- btn-reintentar
- invitacion
- btn-ir-juegos
- row `kpis`
  - col 4/12: kpi-racha
  - col 4/12: kpi-record
  - col 4/12: kpi-completados
- row `actividad` (card)
  - col 12/12: titulo-actividad, heatmap, detalle-dia
- titulo-juegos
- row `juegos-1`
  - col 4/12: stats-devdle
  - col 4/12: stats-grep-grid
  - col 4/12: stats-timeline
- row `juegos-2`
  - col 4/12: stats-big-o
  - col 4/12: stats-bug-hunt
  - col 4/12: (vacía, margen)
- row `historial` (card)
  - col 12/12: titulo-historial, tabla-historial, alerta-ver-mas, btn-ver-mas

## Contenido

### header
- Texto/label: > nerdose_   ./juegos   ./stats   ./about   #8   ES | EN
- Icono: nada
- Annotation: `app-header` variant `default` del shell (sin píldora de racha, cursor estático); `./stats` es el ítem activo. #número = número de desafío del día, igual para los 5 juegos; ES | EN es el grupo segmentado. En mobile se acomoda con `flex-wrap` (REQ-003)

### titulo
- Texto/label: Estadísticas
- Icono: nada
- Annotation: nada

### banner-cookies
- Texto/label: Activá las cookies para poder jugar
- Icono: warning
- Annotation: es el overlay O-03 del shell (`banner` variant `warning`), igual que en `home`. La pantalla no llama a la `api` ni crea una sesión desde acá (REQ-011 CA 10)

### loader
- Texto/label: Cargando tus estadísticas…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar tus estadísticas. Revisá tu conexión e intentá de nuevo.
- Icono: error
- Annotation: ante un `429` el texto es «Hiciste muchas consultas seguidas. Esperá unos segundos e intentá de nuevo.»; no se muestran cifras viejas

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### invitacion
- Texto/label: Todavía no jugaste
- Texto secundario: Completá un desafío y acá vas a ver tus rachas, tu actividad y tu historial.
- Icono: nada
- Annotation: `panel` del DS, arriba de las cifras para que sea lo primero que ve un jugador nuevo. Las cifras, el heatmap y las tarjetas siguen visibles debajo, en cero (REQ-011 CA 9)

### btn-ir-juegos
- Texto/label: Ir a los juegos
- Icono: arrow-right
- Annotation: `button` `primary` `md`; lleva a `home`

### kpi-racha
- Texto/label: Racha global
- Texto secundario: 4 días seguidos
- Icono: nada
- Annotation: `streak-number` variant `card`, en ámbar. Es la racha viva: si el último día completado no es hoy ni ayer (contando días neutros) se muestra 0, sin borrar el récord. Con racha 0 el número va en gris

### kpi-record
- Texto/label: Récord
- Texto secundario: 9 días
- Icono: nada
- Annotation: `card` variant `stat`; el récord nunca baja

### kpi-completados
- Texto/label: Desafíos completados
- Texto secundario: 31
- Icono: nada
- Annotation: `card` variant `stat`. Incluye las partidas anuladas, por eso puede ser mayor que la suma de jugadas de las tarjetas por juego

### titulo-actividad
- Texto/label: Actividad
- Icono: nada
- Annotation: nada

### heatmap
- Texto/label: últimos 365 días · desafíos completados por día
- Etiquetas: meses sobre las columnas (nov · dic · ene · …) · leyenda «0 1 2 3 4 5»
- Icono: nada
- Annotation: `heatmap` del DS con 53 columnas de semana (lunes a domingo) × 7 días; la más antigua a la izquierda y hoy a la derecha, con borde para marcarlo. Días UTC de la plataforma, anclados en el «hoy» que manda el servidor. Rampa verde de 5 niveles: 0, 1, 2, 3 y 4–5 completados comparten el último tono; el número exacto siempre está en texto (línea de detalle y nombre accesible de cada celda), nunca solo en el color. Los días anteriores a la primera partida se ven vacíos. En mobile scrollea dentro del panel y abre mostrando hoy; en desktop entra completo

### detalle-dia
- Texto/label: Hoy · 2 de 5 completados
- Icono: nada
- Annotation: muestra el día enfocado con teclado o tocado; sin interacción, muestra hoy. Formato «{día abreviado} dd/mm · N de 5 completados» («vie 30/10 · 0 de 5 completados» para un día vacío)

### titulo-juegos
- Texto/label: Por juego
- Icono: nada
- Annotation: tarjetas en el orden del catálogo (`GAME_IDS`): Devdle, Grep Grid, Tech Timeline, Big O y Bug Hunt; es el mismo orden del historial dentro de un día

### stats-devdle
- Texto/label: Devdle
- Texto secundario: racha 3 · máx 7 · 21 jugadas · 16 ganadas · 76 % victorias · // intentos 1 · 2 · 3 · 4 · 5 · 6 · X
- Icono: nada
- Annotation: `card` variant `game-stats` con la barra y el `h3` en el acento del juego; «racha N · máx M» en ámbar; jugadas, ganadas y % de victorias como `card` `metric` (entero, «—» sin jugadas). Debajo, el `StatsSummary` del juego: distribución de intentos 1 a 6 y X (derrotas) con el pattern `devdle.distribution`, con el número en cada barra. Las anuladas no cuentan en jugadas, ganadas ni stats propias

### stats-grep-grid
- Texto/label: Grep Grid
- Texto secundario: racha 0 · máx 4 · 12 jugadas · 5 ganadas · 42 % victorias · // palabras · promedio 6,4 de 8 · 8/8 en el 42 % de las partidas
- Icono: nada
- Annotation: misma estructura que Devdle. `StatsSummary`: promedio de palabras encontradas con un decimal y porcentaje de partidas con 8/8. Sin tiempos

### stats-timeline
- Texto/label: Tech Timeline
- Texto secundario: racha 1 · máx 5 · 15 jugadas · 6 ganadas · 40 % victorias · // acierto por categoría · mejor categoría: {categoría}
- Icono: nada
- Annotation: misma estructura. `StatsSummary`: una fila por cada categoría de hito del juego, con su etiqueta del juego en el idioma activo, una barra (`progress-bar` de racha por juego, en el acento) y el porcentaje en texto; «—» en una categoría sin hitos jugados. «Mejor categoría» es la de mayor acierto entre las jugadas (en empate, la primera del catálogo); no se muestra sin partidas

### stats-big-o
- Texto/label: Big O
- Texto secundario: racha 5 · máx 9 · 27 jugadas · 23 ganadas · 85 % victorias · // aciertos por categoría de receta
- Icono: nada
- Annotation: misma estructura. `StatsSummary`: una fila por categoría de receta con su etiqueta del juego, «N de M» y el porcentaje en texto junto a la barra; «—» sin partidas en esa categoría

### stats-bug-hunt
- Texto/label: Bug Hunt
- Texto secundario: racha 2 · máx 6 · 18 jugadas · 13 ganadas · 72 % victorias · // por lenguaje · // por tipo de bug
- Icono: nada
- Annotation: misma estructura. `StatsSummary` con dos grupos: por lenguaje (JavaScript, Go, Java) y por tipo de bug (las 7 etiquetas de `bug_type` del juego), cada fila con «N de M», barra y porcentaje; «—» sin partidas

### titulo-historial
- Texto/label: Historial
- Icono: nada
- Annotation: nada

### tabla-historial
- Texto/label: Historial de partidas completadas
- Columnas: Fecha / Desafío / Juego / Resultado (desktop) · Fecha / Juego / Resultado (mobile)
- Icono: nada
- Annotation: `data-table` del DS, una fila por partida, de la más reciente a la más antigua; dentro de un día, en el orden del catálogo. «Desafío» es el `#número`; en mobile va bajo la fecha («vie 30/10 · #8»). En desktop «Resultado» combina el estado en texto y la etiqueta corta del juego («ganada · ✓ 4/6», «perdida · ✗ L7», «perdida · 6/8»); en mobile solo la etiqueta. Una partida anulada dice «anulada» en ambos. ✓ y ✗ sin color; el nombre accesible de la celda dice el estado completo. Fechas del día de la plataforma (UTC) en el idioma activo. Las partidas en curso no aparecen. El `<caption>` es el texto de este bloque, visualmente oculto

### alerta-ver-mas
- Texto/label: No pudimos cargar más partidas. Probá de nuevo.
- Icono: error
- Annotation: las filas ya cargadas se mantienen; «Ver más partidas» reintenta

### btn-ver-mas
- Texto/label: Ver más partidas
- Icono: chevron-down
- Annotation: `button` `secondary` `md`, a todo el ancho en mobile y centrado en desktop. Agrega la página siguiente (entre 56 y 60 partidas, siempre días completos) debajo de las que ya están, sin recargar ni repetir filas. Desaparece cuando no hay más

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. El aviso de privacidad vive en `acerca-de`. Es del shell e igual en todas las pantallas (REQ-002, C-07)

## Estados

### default
- Aplica: Sí
- Mensaje: Racha global, récord, completados, heatmap de 365 días, una tarjeta por juego y el historial con «Ver más partidas».
- Cambios: ninguno respecto de default.

### empty
- Aplica: Sí
- Mensaje: Todavía no jugaste. Completá un desafío y acá vas a ver tus rachas, tu actividad y tu historial.
- Cambios:
  - invitacion: solo visible en este estado y en `sin sesión` (visible_only_in_states)
  - btn-ir-juegos: solo visible en este estado y en `sin sesión` (visible_only_in_states)
  - kpi-racha: content="0 días seguidos" (state_override; número en gris)
  - kpi-record: content="0 días" (state_override)
  - kpi-completados: content="0" (state_override)
  - heatmap: todas las celdas en nivel 0 (state_override)
  - detalle-dia: content="Sin partidas en los últimos 365 días" (state_override)
  - stats-devdle, stats-grep-grid, stats-timeline, stats-big-o, stats-bug-hunt: content="racha 0 · máx 0 · 0 jugadas · 0 ganadas · — victorias · Todavía no jugaste a este juego." (state_override; sin stats propias, no se inventan valores)
  - tabla-historial: content="Todavía no hay partidas completadas." (state_override; una fila de mensaje en lugar de datos)
  - btn-ver-mas: oculto en este estado (hidden_in_states)

### sin sesión
- Aplica: Sí (sub-estado de `empty`: cookies bloqueadas o `401 no_session`)
- Mensaje: Activá las cookies para poder jugar. Sin sesión no hay progreso para mostrar.
- Cambios:
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - invitacion: content="Sin sesión no hay progreso para mostrar" / "Activá las cookies y recargá la página para empezar a jugar y guardar tus estadísticas." (state_override)
  - btn-ir-juegos: variant=disabled (state_override)
  - kpi-racha, kpi-record, kpi-completados, heatmap, detalle-dia, tarjetas por juego y tabla-historial: igual que en `empty`
  - btn-ver-mas: oculto en este estado (hidden_in_states)

### loading
- Aplica: Sí
- Mensaje: Cargando tus estadísticas…
- Cambios:
  - loader: solo visible en este estado (visible_only_in_states)
  - kpi-racha, kpi-record, kpi-completados, titulo-actividad, heatmap, detalle-dia, titulo-juegos, tarjetas por juego, titulo-historial, tabla-historial, btn-ver-mas: ocultos en este estado (hidden_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tus estadísticas. Revisá tu conexión e intentá de nuevo.
- Cambios:
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)
  - kpi-racha, kpi-record, kpi-completados, titulo-actividad, heatmap, detalle-dia, titulo-juegos, tarjetas por juego, titulo-historial, tabla-historial, btn-ver-mas: ocultos en este estado (hidden_in_states)

### cargando más
- Aplica: Sí (sub-estado de `default`)
- Mensaje: Cargando más partidas…
- Cambios:
  - btn-ver-mas: variant=disabled, content="Cargando…" (state_override)

### error al cargar más
- Aplica: Sí (sub-estado de `default`)
- Mensaje: No pudimos cargar más partidas. Probá de nuevo.
- Cambios:
  - alerta-ver-mas: solo visible en este estado (visible_only_in_states)
  - tabla-historial: conserva las filas ya cargadas (sin cambios)

### historial completo
- Aplica: Sí (sub-estado de `default`)
- Mensaje: Ya ves todas tus partidas.
- Cambios:
  - btn-ver-mas: oculto en este estado (hidden_in_states)

## Interacciones

**Eventos:**
- btn-ir-juegos · on click → navega a `home`
- btn-reintentar · on click → vuelve a pedir las estadísticas
- heatmap · on focus (flechas) / on tap → actualiza `detalle-dia` con la fecha y la cantidad de ese día
- btn-ver-mas · on click → agrega la página siguiente del historial al final de la tabla; el foco queda en el botón (o pasa a la primera fila nueva si el botón desaparece)
- Cambio de idioma ES | EN → textos, etiquetas de categoría, fechas y números se rehacen en el idioma activo sin perder las páginas cargadas del historial

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Al agregar una página, una región `aria-live` anuncia «Se agregaron N partidas».
- Al cerrar una partida, al confirmar una anulación o al cambiar el día, la pantalla se actualiza la próxima vez que se abre (no muestra cifras viejas).

## Accesibilidad

- **Orden de foco:** header → invitación y «Ir a los juegos» (si están) → heatmap (una sola parada de tabulación) → tarjetas por juego → tabla del historial → «Ver más partidas» → footer.
- **Landmarks y jerarquía:** `h1` «Estadísticas»; `h2` «Actividad», «Por juego» e «Historial»; cada juego es `h3` y cada grupo de su `StatsSummary` es `h4`. Landmarks: header, nav, main, footer.
- **Foco y teclado:** el heatmap es una grilla con un solo punto de tabulación: las flechas mueven por día (arriba/abajo) y por semana (izquierda/derecha), Inicio y Fin van al primer y último día. Sin trampas de foco.
- **Propio de esta composición:** cada celda del heatmap tiene nombre accesible «{fecha}: N de 5 desafíos completados» y el grupo un resumen («N desafíos completados en los últimos 365 días»); nada depende solo del color (ni el heatmap, ni el ✓/✗ del historial, ni las barras de las stats propias, que llevan su número). En mobile, el contenedor con scroll del heatmap y el de la tabla son alcanzables con teclado.

## Decisiones y descartes

**Decisiones tomadas:**
- El historial va inline y paginado, no en una pantalla propia: así el inventario se queda en 19 pantallas (pregunta 3 del product-map, resuelta por REQ-011).
- Se muestran las métricas de C-34 (racha, récord, completados, jugadas, ganadas, % de victorias, stats propias); «días con actividad» y «juegos por día activo» del prototipo se omiten porque manda el PRD.
- La etiqueta corta del historial usa el `history_label` de C-33 («✓ 4/6», «✗ L7», «6/8»).
- REQ-003 (solo shell): header `app-header` `default` con la nav siempre visible y `flex-wrap`; se elimina la tira `nav-movil` en mobile; footer con lema y `exit 0`.
- REQ-011: la paginación numerada pasa a ser «Ver más partidas» (`button` `secondary`), porque el servidor pagina por cursor (`history_next_before`) y cada página termina en un día completo (56 a 60 filas): no hay páginas numeradas que mostrar. El DS no tiene `pagination`.
- REQ-011: el estado vacío deja de ocultar todo. Un jugador nuevo ve las cifras en cero, «—» en los porcentajes, el heatmap y el historial vacíos y una invitación a jugar (CA 9). La invitación pasa de `empty-state` a `panel` del DS, que no tiene `empty-state`.
- REQ-011: sin sesión (cookies bloqueadas o `401`) es un sub-estado de `empty` con el banner O-03 y «Ir a los juegos» deshabilitado. La pantalla no llama a la `api` ni crea una sesión (CA 10).
- REQ-011: el heatmap pasa de `image` 6:1 a la grilla de 53 semanas del `heatmap` del DS, con la cantidad exacta en texto (línea de detalle y nombre accesible por celda) en lugar de un tooltip: el tooltip no existe en táctil y el DS no lo define. Se usan los 5 niveles del DS (el DS prohíbe una sexta tonalidad), con 4 y 5 en el mismo tono; el número distingue los dos (CA 6, CA 30).
- REQ-011: en mobile las tres cifras van apiladas. En una fila de 2, a 320 px, «Desafíos completados» se parte palabra por palabra.
- REQ-011: en mobile el heatmap scrollea dentro de su contenedor y abre en hoy. Achicar 53 columnas a 320 px dejaría celdas de 4 px. En desktop entra completo (53 × 18 px ≈ 954 px).
- REQ-011: tarjetas en el orden de `GAME_IDS`, que es el orden en que responde el servidor y el del historial dentro de un día. En desktop van en grilla 3 + 2 alineadas arriba: Bug Hunt (10 filas de stats propias) y Tech Timeline (8) son más altas que Grep Grid, y estirarlas dejaría huecos.
- REQ-011: las stats propias se dibujan con el `StatsSummary` del `client` de cada juego (decisión 9 del diseño técnico). La pantalla solo reserva el lugar bajo las métricas comunes y no ramifica por juego.
- REQ-011: el historial de desktop tiene 4 columnas («Fecha», «Desafío», «Juego», «Resultado»). En mobile tiene 3, con el `#número` bajo la fecha, para entrar en 320 px sin scroll de la página. «Resultado» combina el estado en texto con la etiqueta del juego, porque la etiqueta de Grep Grid o Tech Timeline («6/8», «3/5») no dice por sí sola si se ganó.
- REQ-011: la microcopy de las tarjetas cambia a las stats propias que define el dominio. Se va «Mejor racha 7» de Bug Hunt, «Aciertos con n log n» de Big O y «Posiciones acertadas» de Tech Timeline, que no están en el `extra` de cada juego.

**Alternativas descartadas:**
- Tabla de 5 juegos por fila (prototipo): no entra en 320 px y no muestra el `#número` ni el estado.
- Gráficos de línea de evolución: no están en C-34.
- Tooltip flotante en el heatmap: no funciona en táctil y tapa celdas vecinas en mobile.
- Paginación numerada del historial: el cursor por fecha no sabe cuántas páginas hay.
- Ocultar las cifras y las tarjetas en el estado vacío: CA 9 pide ver los ceros.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- F-09, C-34, C-33, C-02 · flujo 5 de `user-flows.md`.
- REQ-003 (shell): RF 4, 6.
- REQ-011: RF 1-9 · CA 1-12, 29, 30 · decisiones 6-9 del diseño técnico.
