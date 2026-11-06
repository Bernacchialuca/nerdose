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
version: "1.0"
date: 2026-11-03
---

# Pantalla: Tech Timeline · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ordenar 5 hitos del más antiguo al más reciente y confirmar (un intento).
- **Viewports:**
  - **mobile** — lista vertical de 5 hitos con arrastre touch y flechas ↑ ↓ por fila.
  - **desktop** — lista de hitos a la izquierda (7/12) y confirmación a la derecha (5/12).

## Entrada y salida

**Entradas:**
- `timeline-instrucciones` · «Empezar» (crea la Play)
- `home` · tarjeta «en curso» (retoma en el estado exacto, C-10)

**Salidas user-driven:**
- A O-01 · «Reportar un problema»
- A `timeline-resultado` · fin de partida
- A `home` · marca o `./juegos` (la partida queda en curso)

**Salidas automáticas:**
- A `timeline-resultado` · al cerrarse la Play como ganada o perdida (el servidor decide)
- A `timeline-instrucciones` · `challenge_expired` (cambio de día con la partida abierta)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | viewport_overrides: desktop | Marca, #número del desafío del día e idioma |
| 2 | nav-movil | nav-bar | — | navigation | solo mobile | — | Navegación principal compacta en mobile (en desktop va en el header) |
| 3 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | Nombre del juego |
| 4 | consigna | paragraph | body | content | ambos | hidden_in_states: loading, error de sistema | Consigna y categoría |
| 5 | lista-hitos | list | — | content | ambos | hidden_in_states: loading, error de sistema | 5 hitos mezclados y sin fecha, reordenables |
| 6 | btn-confirmar | button | primary | input | ambos | hidden_in_states: loading, error de sistema | Confirma el orden elegido (un solo intento) |
| 7 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Abre O-01 para avisar que el desafío está mal |
| 8 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 9 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 10 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 11 | footer | footer | — | layout | ambos | — | Aviso breve de privacidad y enlace a Acerca de |

## Layout por viewport

### mobile · 400px
- nav-movil
- titulo
- loader
- alerta-sistema
- btn-reintentar
- consigna
- lista-hitos
- btn-confirmar
- link-reportar

### desktop · 1200px
- titulo
- loader
- alerta-sistema
- btn-reintentar
- row `juego`
  - col 7/12: consigna, lista-hitos
  - col 5/12: btn-confirmar, link-reportar

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

### titulo
- Texto/label: Tech Timeline
- Icono: nada
- Annotation: nada

### consigna
- Texto/label: Ordená del más antiguo al más reciente. Categoría: lenguajes de programación.
- Icono: nada
- Annotation: nada

### lista-hitos
- Texto/label: —
- Forma: lista de 5 elementos (título + detalle)
- Icono: nada
- Annotation: reordenar con arrastre (touch), teclado y flechas subir/bajar por fila (NFR-U03)

### btn-confirmar
- Texto/label: Confirmar orden
- Icono: check
- Annotation: nada

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: si ya reportó este desafío muestra «Ya reportado» y no abre O-01 (already_reported)

### loader
- Texto/label: Cargando tu partida de Tech Timeline…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.
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
- Mensaje: 5 hitos en un orden inicial mezclado; «Confirmar orden» habilitado.
- Cambios: ninguno respecto de default.

### loading
- Aplica: Sí
- Mensaje: Cargando tu partida de Tech Timeline…
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - lista-hitos: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - lista-hitos: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- lista-hitos · arrastrar o ↑ ↓ → reordena
- btn-confirmar · on click → envía el orden (un solo intento)
- link-reportar · on click → abre O-01 (bottom-sheet en mobile, modal en desktop)

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Las jugadas inválidas muestran un aviso sin consumir el intento (cuando corresponde).

## Accesibilidad

- **Orden de foco:** titulo → consigna → elementos del juego → acción de confirmar → link-reportar.
- **Landmarks y jerarquía:** `h1` con el nombre del juego; sin otros encabezados salvo la pregunta (`h2`) o el contador (`h2`). Landmarks: header, nav, main, footer.
- **Foco y teclado:** O-01/O-04 atrapan el foco y lo devuelven al disparador al cerrarse.
- **Propio de esta composición:** El feedback de cada jugada se anuncia en una región `aria-live=polite`; el estado nunca depende solo del color (NFR-U04).

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Tech Timeline difiere por completo de la de los otros.
- El acceso «Reportar un problema» está en todas las partidas (O-01), con el aviso de no incluir la respuesta.
- El `#número` del desafío está en el header, no en el cuerpo.

**Alternativas descartadas:**
- Modal de instrucciones dentro de la partida: queda en la fase de instrucciones.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- F-06, C-23, C-36, NFR-U03 · flujo 1 de `user-flows.md`.
