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
version: "1.0"
date: 2026-11-03
---

# Pantalla: Tech Timeline · Resultado

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver el orden correcto con fechas y notas y las posiciones acertadas; compartir.
- **Viewports:**
  - **mobile** — veredicto arriba, explicación en columna y «Compartir» antes de las salidas.
  - **desktop** — explicación a la izquierda (7/12); rachas, «Compartir» y reporte a la derecha (5/12), y una fila de salidas al pie.

## Entrada y salida

**Entradas:**
- `timeline-partida` · fin de partida (automático)
- `home` · tarjeta «completado» (CTA «Ver resultado»)
- URL directa `/timeline` con la Play terminada
- O-02 · «Marcar como completado» (estado anulado)

**Salidas user-driven:**
- A O-01 · «Reportar un problema»
- A `home` · «Volver a los juegos»
- A `estadisticas` · «Ver mis estadísticas»
- A la siguiente `*-instrucciones` · «Siguiente juego»

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | viewport_overrides: desktop | Marca, #número del desafío del día e idioma |
| 2 | nav-movil | nav-bar | — | navigation | solo mobile | — | Navegación principal compacta en mobile (en desktop va en el header) |
| 3 | puntaje | paragraph | body | content | ambos | hidden_in_states: loading, error de sistema, anulado | Puntaje N/5 |
| 4 | veredicto | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: perdió, anulado | Veredicto y resultado de la partida |
| 5 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de anulación |
| 6 | lista-tu-orden | list | — | content | ambos | hidden_in_states: loading, error de sistema | Tu orden con indicador por posición (ícono + color) |
| 7 | lista-correcto | list | — | content | ambos | hidden_in_states: loading, error de sistema | Orden correcto con fecha y nota de cada hito |
| 8 | card-rachas | card | — | content | ambos | hidden_in_states: loading, error de sistema | Rachas del juego y global actualizadas |
| 9 | btn-compartir | button | primary | input | ambos | hidden_in_states: loading, error de sistema, anulado | Comparte el resultado sin spoilers (emoji, nombre, #número, resultado, nerdose.dev) |
| 10 | toast-copiado | toast | success | feedback | ambos | visible_only_in_states: success | Aviso tras copiar al portapapeles |
| 11 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Abre O-01 para avisar que el desafío está mal |
| 12 | cuenta-regresiva | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Cuenta regresiva al próximo desafío |
| 13 | btn-siguiente | button | secondary | input | ambos | hidden_in_states: loading, error de sistema | Lleva al siguiente juego pendiente |
| 14 | link-stats | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Ir a estadísticas |
| 15 | link-volver | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Salida a la home |
| 16 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 17 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 18 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 19 | footer | footer | — | layout | ambos | — | Aviso breve de privacidad y enlace a Acerca de |

## Layout por viewport

### mobile · 400px
- nav-movil
- veredicto
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- puntaje
- lista-tu-orden
- lista-correcto
- card-rachas
- btn-compartir
- toast-copiado
- link-reportar
- cuenta-regresiva
- btn-siguiente
- link-stats
- link-volver

### desktop · 1200px
- veredicto
- alerta-anulado
- loader
- alerta-sistema
- btn-reintentar
- row `resultado`
  - col 7/12: puntaje, lista-tu-orden
  - col 5/12: lista-correcto, card-rachas, btn-compartir, toast-copiado, link-reportar
- row `salida`
  - col 4/12: cuenta-regresiva
  - col 4/12: btn-siguiente
  - col 4/12: link-stats, link-volver

## Contenido

### header
- Texto/label: > nerdose / Tech Timeline · #8 · ES|EN
- Icono: nada
- Override desktop: content="> nerdose / Tech Timeline     ./juegos   ./stats   ./about     #8     ES | EN"
- Annotation: #número = número de desafío del día, igual para los 5 juegos; ES|EN es un control inline

### nav-movil
- Texto/label: —
- Etiquetas: ./juegos · ./stats · ./about
- Icono: nada
- Annotation: nada

### puntaje
- Texto/label: Acertaste 3/5 posiciones
- Icono: nada
- Annotation: nada

### veredicto
- Texto/label: Orden correcto: 5/5
- Icono: nada
- Annotation: nada

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: nada
- Annotation: nada

### lista-tu-orden
- Texto/label: —
- Forma: lista de 5 elementos (título + detalle)
- Icono: nada
- Annotation: nada

### lista-correcto
- Texto/label: —
- Forma: lista de 5 elementos (título + detalle)
- Icono: nada
- Annotation: nada

### card-rachas
- Texto/label: Rachas
- Texto secundario: Tech Timeline: 3 días · Global: 4 días
- Icono: nada
- Annotation: nada

### btn-compartir
- Texto/label: Compartir
- Icono: share
- Annotation: share nativo del sistema; si no está disponible copia al portapapeles

### toast-copiado
- Texto/label: Copiado
- Icono: nada
- Annotation: nada

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: si ya reportó este desafío muestra «Ya reportado» y no abre O-01 (already_reported)

### cuenta-regresiva
- Texto/label: Próximo desafío en 05:42:10
- Icono: nada
- Annotation: nada

### btn-siguiente
- Texto/label: Siguiente juego
- Icono: arrow-right
- Annotation: nada

### link-stats
- Texto/label: Ver mis estadísticas
- Icono: arrow-right
- Annotation: nada

### link-volver
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: nada

### loader
- Texto/label: Cargando tu resultado de Tech Timeline…
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
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de · exit 0
- Icono: nada
- Annotation: `site-footer`: el lema a la izquierda y `exit 0` a la derecha; debajo, el aviso de privacidad y el enlace «Acerca de» (a `acerca-de`), todo en Mono 13 gris. Es del shell e igual en todas las pantallas (REQ-002, C-07; REQ-003)

## Estados

### default
- Aplica: Sí
- Mensaje: Orden correcto: 5/5.
- Cambios: ninguno respecto de default.

### perdió
- Aplica: Sí (sub-estado de default)
- Mensaje: Acertaste 3/5 posiciones. Mostramos el orden correcto.
- Cambios:
  - veredicto: content="Acertaste 3/5 posiciones" (state_override)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Desafío anulado. Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios:
  - puntaje: oculto en este estado (hidden_in_states)
  - veredicto: content="Desafío anulado" (state_override)
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - btn-compartir: oculto en este estado (hidden_in_states)

### success
- Aplica: Sí (sub-estado de default)
- Mensaje: Copiado: el resultado quedó en el portapapeles.
- Cambios:
  - toast-copiado: solo visible en este estado (visible_only_in_states)

### loading
- Aplica: Sí
- Mensaje: Cargando tu resultado de Tech Timeline…
- Cambios:
  - puntaje: oculto en este estado (hidden_in_states)
  - veredicto: oculto en este estado (hidden_in_states)
  - lista-tu-orden: oculto en este estado (hidden_in_states)
  - lista-correcto: oculto en este estado (hidden_in_states)
  - card-rachas: oculto en este estado (hidden_in_states)
  - btn-compartir: oculto en este estado (hidden_in_states)
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
  - puntaje: oculto en este estado (hidden_in_states)
  - veredicto: oculto en este estado (hidden_in_states)
  - lista-tu-orden: oculto en este estado (hidden_in_states)
  - lista-correcto: oculto en este estado (hidden_in_states)
  - card-rachas: oculto en este estado (hidden_in_states)
  - btn-compartir: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - cuenta-regresiva: oculto en este estado (hidden_in_states)
  - btn-siguiente: oculto en este estado (hidden_in_states)
  - link-stats: oculto en este estado (hidden_in_states)
  - link-volver: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- btn-compartir · on click → share nativo o copia al portapapeles
- btn-siguiente · on click → siguiente juego pendiente
- link-reportar · on click → abre O-01

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Si se copia al portapapeles: toast «Copiado» (estado success).

## Accesibilidad

- **Orden de foco:** veredicto → explicación → btn-compartir → link-reportar → salidas.
- **Landmarks y jerarquía:** `h1` es el veredicto; las secciones de explicación son `h2`. Landmarks: header, nav, main, footer.
- **Foco y teclado:** O-01 atrapa el foco y lo devuelve a `link-reportar`.
- **Propio de esta composición:** El toast «Copiado» se anuncia con `role=status`; el veredicto se comunica con texto además del color.

## Decisiones y descartes

**Decisiones tomadas:**
- `perdió` y `anulado` son sub-estados de la misma pantalla, no pantallas aparte (C-12, C-41).
- En `anulado` se oculta «Compartir» y la stat propia: C-13 no cubre explícitamente la Play `voided` (pregunta 2 del product-map).
- Se omiten los extras del prototipo que no están en el PRD.

**Alternativas descartadas:**
- «Compartir» en el header: se mantiene en el cuerpo para que no compita con la navegación (el header ya carga marca, nav, #número e idioma).

**Preguntas abiertas:**
- Pregunta 2 del product-map: variantes de resultado anulado con y sin resultado propio.
- Pregunta 5 del product-map: «Siguiente juego» o «Volver a los juegos».

## Trazabilidad

- C-25, C-12, C-13, C-36, C-41 · flujos 1, 3, 4 y 5 de `user-flows.md`.
