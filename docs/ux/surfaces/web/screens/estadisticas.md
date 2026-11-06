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
version: "1.1"
date: 2026-11-06
---

# Pantalla: Estadísticas

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver rachas, récords, completados, % de victorias, estadísticas por juego, heatmap e historial.
- **Viewports:**
  - **mobile** — una sola columna larga: cifras, heatmap con scroll horizontal, un bloque por juego e historial paginado de 3 columnas.
  - **desktop** — tres cifras en fila, los 5 bloques de juego en grilla 3+2 y el historial en un panel propio; evita la tabla de 5 juegos por fila del prototipo.

## Entrada y salida

**Entradas:**
- `home` · «ver estadísticas →»
- Header · `./stats`
- `*-resultado` · «Ver mis estadísticas»

**Salidas user-driven:**
- A `home` · marca o `./juegos`
- A `{juego}-instrucciones` · «Ir a los juegos» desde el estado vacío (vía `home`)

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Marca, nav, #número e idioma (`app-header` variant `default`) |
| 2 | titulo | heading | h1 | content | ambos | — | Título de la pantalla |
| 3 | kpi-racha | card | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Racha global actual |
| 4 | kpi-record | card | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Mejor racha global |
| 5 | kpi-completados | card | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Total de desafíos completados |
| 6 | heatmap | image | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Heatmap de 365 días |
| 7 | titulo-juegos | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema, empty | Sección de estadísticas por juego |
| 8 | stats-devdle | card | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Racha, récord, jugadas, % de victorias y stat propia de Devdle |
| 9 | stats-bug-hunt | card | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Racha, récord, jugadas, % de victorias y stat propia de Bug Hunt |
| 10 | stats-big-o | card | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Racha, récord, jugadas, % de victorias y stat propia de Big O |
| 11 | stats-timeline | card | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Racha, récord, jugadas, % de victorias y stat propia de Tech Timeline |
| 12 | stats-grep-grid | card | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Racha, récord, jugadas, % de victorias y stat propia de Grep Grid |
| 13 | titulo-historial | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema, empty | Sección de historial |
| 14 | tabla-historial | table | — | content | ambos | hidden_in_states: loading, error de sistema, empty | Historial paginado con etiqueta corta por partida |
| 15 | paginacion | pagination | — | navigation | ambos | hidden_in_states: loading, error de sistema, empty | Paginación del historial |
| 16 | vacio | empty-state | — | feedback | ambos | visible_only_in_states: empty | Estado vacío sin partidas |
| 17 | btn-ir-juegos | button | primary | input | ambos | visible_only_in_states: empty | Salida del estado vacío |
| 18 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 19 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 20 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 21 | footer | footer | — | layout | ambos | — | Aviso breve de privacidad y enlace a Acerca de |

## Layout por viewport

### mobile · 400px
- titulo
- loader
- alerta-sistema
- btn-reintentar
- vacio
- btn-ir-juegos
- kpi-racha
- kpi-record
- kpi-completados
- heatmap
- titulo-juegos
- stats-devdle
- stats-bug-hunt
- stats-big-o
- stats-timeline
- stats-grep-grid
- titulo-historial
- tabla-historial
- paginacion

### desktop · 1200px
- titulo
- loader
- alerta-sistema
- btn-reintentar
- vacio
- btn-ir-juegos
- row `kpis`
  - col 4/12: kpi-racha
  - col 4/12: kpi-record
  - col 4/12: kpi-completados
- heatmap
- titulo-juegos
- row `juegos-1`
  - col 4/12: stats-devdle
  - col 4/12: stats-bug-hunt
  - col 4/12: stats-big-o
- row `juegos-2`
  - col 4/12: stats-timeline
  - col 4/12: stats-grep-grid
  - col 4/12: (vacía, margen)
- row `historial` (card)
  - col 12/12: titulo-historial, tabla-historial, paginacion

## Contenido

### header
- Texto/label: > nerdose_   ./juegos   ./stats   ./about   #8   ES | EN
- Icono: nada
- Annotation: `app-header` variant `default` del shell (sin píldora de racha, cursor estático); `./stats` es el ítem activo. #número = número de desafío del día, igual para los 5 juegos; ES | EN es el grupo segmentado. En mobile se acomoda con `flex-wrap` (REQ-003)

### titulo
- Texto/label: Estadísticas
- Icono: nada
- Annotation: nada

### kpi-racha
- Texto/label: Racha global
- Texto secundario: 4 días
- Icono: nada
- Annotation: nada

### kpi-record
- Texto/label: Récord
- Texto secundario: 9 días
- Icono: nada
- Annotation: nada

### kpi-completados
- Texto/label: Desafíos completados
- Texto secundario: 31
- Icono: nada
- Annotation: nada

### heatmap
- Texto/label: Heatmap de actividad · últimos 365 días
- Asset: placeholder 6:1
- Icono: nada
- Annotation: en mobile el heatmap scrollea horizontal; color + valor en el tooltip (NFR-U04)

### titulo-juegos
- Texto/label: Por juego
- Icono: nada
- Annotation: nada

### stats-devdle
- Texto/label: Devdle
- Texto secundario: Racha 3 · Récord 7 · Jugadas 21 · 75 % victorias · Promedio 4,1 intentos
- Icono: nada
- Annotation: nada

### stats-bug-hunt
- Texto/label: Bug Hunt
- Texto secundario: Racha 2 · Récord 6 · Jugadas 18 · 70 % victorias · Mejor racha 7
- Icono: nada
- Annotation: nada

### stats-big-o
- Texto/label: Big O
- Texto secundario: Racha 5 · Récord 9 · Jugadas 27 · 85 % victorias · Aciertos con n log n: 3
- Icono: nada
- Annotation: nada

### stats-timeline
- Texto/label: Tech Timeline
- Texto secundario: Racha 1 · Récord 5 · Jugadas 15 · 65 % victorias · Posiciones acertadas: 78 %
- Icono: nada
- Annotation: nada

### stats-grep-grid
- Texto/label: Grep Grid
- Texto secundario: Racha 0 · Récord 4 · Jugadas 12 · 60 % victorias · Promedio 6,4/8 palabras
- Icono: nada
- Annotation: nada

### titulo-historial
- Texto/label: Historial
- Icono: nada
- Annotation: nada

### tabla-historial
- Texto/label: —
- Columnas: Fecha / Juego / Resultado (las filas de ejemplo viven solo en screens.json)
- Icono: nada
- Annotation: nada

### paginacion
- Texto/label: —
- Icono: nada
- Annotation: nada

### vacio
- Texto/label: Todavía no jugaste
- Texto secundario: Completá un desafío y acá vas a ver tus rachas, tu heatmap y tu historial.
- Icono: nada
- Annotation: nada

### btn-ir-juegos
- Texto/label: Ir a los juegos
- Icono: arrow-right
- Annotation: nada

### loader
- Texto/label: Cargando tus estadísticas…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar tus estadísticas. Revisá tu conexión e intentá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de · exit 0
- Icono: nada
- Annotation: `site-footer`: el lema a la izquierda y `exit 0` a la derecha; debajo, el aviso de privacidad y el enlace «Acerca de» (a `acerca-de`), todo en Mono 13 gris. Es del shell e igual en todas las pantallas (REQ-002, C-07)

## Estados

### default
- Aplica: Sí
- Mensaje: Rachas, récord, completados, heatmap, bloque por juego e historial.
- Cambios: ninguno respecto de default.

### empty
- Aplica: Sí
- Mensaje: Todavía no jugaste. Completá un desafío y acá vas a ver tus rachas, tu heatmap y tu historial. (También es lo que ve quien tiene las cookies bloqueadas: la pantalla queda vacía y visible.)
- Cambios:
  - kpi-racha: oculto en este estado (hidden_in_states)
  - kpi-record: oculto en este estado (hidden_in_states)
  - kpi-completados: oculto en este estado (hidden_in_states)
  - heatmap: oculto en este estado (hidden_in_states)
  - titulo-juegos: oculto en este estado (hidden_in_states)
  - stats-devdle: oculto en este estado (hidden_in_states)
  - stats-bug-hunt: oculto en este estado (hidden_in_states)
  - stats-big-o: oculto en este estado (hidden_in_states)
  - stats-timeline: oculto en este estado (hidden_in_states)
  - stats-grep-grid: oculto en este estado (hidden_in_states)
  - titulo-historial: oculto en este estado (hidden_in_states)
  - tabla-historial: oculto en este estado (hidden_in_states)
  - paginacion: oculto en este estado (hidden_in_states)
  - vacio: solo visible en este estado (visible_only_in_states)
  - btn-ir-juegos: solo visible en este estado (visible_only_in_states)

### loading
- Aplica: Sí
- Mensaje: Cargando tus estadísticas…
- Cambios:
  - kpi-racha: oculto en este estado (hidden_in_states)
  - kpi-record: oculto en este estado (hidden_in_states)
  - kpi-completados: oculto en este estado (hidden_in_states)
  - heatmap: oculto en este estado (hidden_in_states)
  - titulo-juegos: oculto en este estado (hidden_in_states)
  - stats-devdle: oculto en este estado (hidden_in_states)
  - stats-bug-hunt: oculto en este estado (hidden_in_states)
  - stats-big-o: oculto en este estado (hidden_in_states)
  - stats-timeline: oculto en este estado (hidden_in_states)
  - stats-grep-grid: oculto en este estado (hidden_in_states)
  - titulo-historial: oculto en este estado (hidden_in_states)
  - tabla-historial: oculto en este estado (hidden_in_states)
  - paginacion: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tus estadísticas. Revisá tu conexión e intentá de nuevo.
- Cambios:
  - kpi-racha: oculto en este estado (hidden_in_states)
  - kpi-record: oculto en este estado (hidden_in_states)
  - kpi-completados: oculto en este estado (hidden_in_states)
  - heatmap: oculto en este estado (hidden_in_states)
  - titulo-juegos: oculto en este estado (hidden_in_states)
  - stats-devdle: oculto en este estado (hidden_in_states)
  - stats-bug-hunt: oculto en este estado (hidden_in_states)
  - stats-big-o: oculto en este estado (hidden_in_states)
  - stats-timeline: oculto en este estado (hidden_in_states)
  - stats-grep-grid: oculto en este estado (hidden_in_states)
  - titulo-historial: oculto en este estado (hidden_in_states)
  - tabla-historial: oculto en este estado (hidden_in_states)
  - paginacion: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- btn-ir-juegos · on click → navega a `home`
- paginacion · on click → carga la página del historial en la misma pantalla
- heatmap · on hover/focus → tooltip con fecha y desafíos completados

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Sin feedback propio más allá de la navegación.

## Accesibilidad

- **Orden de foco:** titulo → bloques por juego → historial → paginación.
- **Landmarks y jerarquía:** `h1` «Estadísticas»; `h2` «Por juego» e «Historial»; cada juego es `h3`. Landmarks: header, nav, main, footer.
- **Foco y teclado:** Sin trampas de foco.
- **Propio de esta composición:** El heatmap expone su resumen en texto (días con actividad en el rango) además de la grilla visual.

## Decisiones y descartes

**Decisiones tomadas:**
- El historial va inline y paginado, no en una pantalla propia: así el inventario se queda en 18 pantallas (pregunta 3 del product-map).
- Se muestran las métricas de C-34 (racha, récord, completados, % de victorias, stat propia); «días con actividad» y «juegos por día activo» del prototipo se omiten porque manda el PRD.
- La etiqueta corta del historial usa el `history_label` de C-33 («✓ 4/6», «✗ L7», «6/8»).
- REQ-003 (solo shell): header `app-header` `default` con la nav siempre visible y `flex-wrap`; se elimina la tira `nav-movil` en mobile; footer con lema y `exit 0`. El contenido de la pantalla se alinea al DS cuando se implemente (FG-10).

**Alternativas descartadas:**
- Tabla de 5 juegos por fila (prototipo): no entra en 320 px.
- Gráficos de línea de evolución: no están en C-34.

**Preguntas abiertas:**
- Pregunta 3 del product-map: si «ver historial completo» merece una ruta propia.

## Trazabilidad

- F-09, C-34, C-33, C-02 · flujo 5 de `user-flows.md`.
- REQ-003 (shell): RF 4, 6.
