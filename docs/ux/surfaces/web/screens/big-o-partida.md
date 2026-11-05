---
name: big-o-partida
surface: web
route: /big-o
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

# Pantalla: Big O · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Leer el código, elegir una de 8 complejidades y confirmar (un intento).
- **Viewports:**
  - **mobile** — código, pregunta y las 8 opciones apiladas; «Confirmar respuesta» al final.
  - **desktop** — código a la izquierda (7/12), pregunta, opciones y confirmación a la derecha (5/12).

## Entrada y salida

**Entradas:**
- `big-o-instrucciones` · «Empezar» (crea la Play)
- `home` · tarjeta «en curso» (retoma en el estado exacto, C-10)

**Salidas user-driven:**
- A O-01 · «Reportar un problema»
- A `big-o-resultado` · fin de partida
- A `home` · marca o `./juegos` (la partida queda en curso)

**Salidas automáticas:**
- A `big-o-resultado` · al cerrarse la Play como ganada o perdida (el servidor decide)
- A `big-o-instrucciones` · `challenge_expired` (cambio de día con la partida abierta)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | viewport_overrides: desktop | Marca, #número del desafío del día e idioma |
| 2 | nav-movil | nav-bar | — | navigation | solo mobile | — | Navegación principal compacta en mobile (en desktop va en el header) |
| 3 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | Nombre del juego |
| 4 | consigna | paragraph | body | content | ambos | hidden_in_states: loading, error de sistema | Consigna |
| 5 | tabs-lenguaje | tabs | active=0 | navigation | ambos | hidden_in_states: loading, error de sistema | Selector de lenguaje de código (solo vista, C-26) |
| 6 | codigo | image | — | content | ambos | hidden_in_states: loading, error de sistema | Código del desafío |
| 7 | pregunta | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema | Pregunta fija del juego |
| 8 | opciones | chips | — | content | ambos | hidden_in_states: loading, error de sistema | 8 opciones fijas de complejidad |
| 9 | seleccion | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: selección hecha | Opción elegida antes de confirmar |
| 10 | btn-confirmar | button | disabled | input | ambos | hidden_in_states: loading, error de sistema; state_overrides: selección hecha | Segundo paso: confirma la selección (decisión #26) |
| 11 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Abre O-01 para avisar que el desafío está mal |
| 12 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 13 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 14 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 15 | footer | footer | — | layout | ambos | — | Aviso breve de privacidad y enlace a Acerca de |

## Layout por viewport

### mobile · 400px
- nav-movil
- titulo
- loader
- alerta-sistema
- btn-reintentar
- consigna
- tabs-lenguaje
- codigo
- pregunta
- opciones
- seleccion
- btn-confirmar
- link-reportar

### desktop · 1200px
- titulo
- loader
- alerta-sistema
- btn-reintentar
- row `juego`
  - col 7/12: consigna, tabs-lenguaje, codigo
  - col 5/12: pregunta, opciones, seleccion, btn-confirmar, link-reportar

## Contenido

### header
- Texto/label: > nerdose / Big O · #8 · ES|EN
- Icono: nada
- Override desktop: content="> nerdose / Big O     ./juegos   ./stats   ./about     #8     ES | EN"
- Annotation: #número = número de desafío del día, igual para los 5 juegos; ES|EN es un control inline

### nav-movil
- Texto/label: —
- Etiquetas: ./juegos · ./stats · ./about
- Icono: nada
- Annotation: nada

### titulo
- Texto/label: Big O
- Icono: nada
- Annotation: nada

### consigna
- Texto/label: Leé el código y elegí la complejidad.
- Icono: nada
- Annotation: nada

### tabs-lenguaje
- Texto/label: —
- Etiquetas: JS · Go · Java
- Icono: nada
- Annotation: nada

### codigo
- Texto/label: Código con numeración de líneas
- Asset: placeholder 4:3
- Icono: nada
- Annotation: a 320 px el código scrollea en horizontal

### pregunta
- Texto/label: ¿Cuál es la complejidad temporal (peor caso) de f(n)?
- Icono: nada
- Annotation: nada

### opciones
- Texto/label: —
- Etiquetas: O(1) · O(log n) · O(n) · O(n log n) · O(n²) · O(n³) · O(2ⁿ) · O(n!)
- Icono: nada
- Annotation: selección única; las 8 opciones son siempre las mismas

### seleccion
- Texto/label: Ninguna opción elegida
- Icono: nada
- Annotation: nada

### btn-confirmar
- Texto/label: Confirmar respuesta
- Icono: nada
- Annotation: nada

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: si ya reportó este desafío muestra «Ya reportado» y no abre O-01 (already_reported)

### loader
- Texto/label: Cargando tu partida de Big O…
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
- Texto/label: nerdose.dev · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de
- Icono: nada
- Annotation: «Acerca de» es un enlace a `acerca-de`; el footer es del shell y es igual en todas las pantallas (REQ-002, C-07)

## Estados

### default
- Aplica: Sí
- Mensaje: Sin selección: «Confirmar respuesta» está deshabilitado.
- Cambios: ninguno respecto de default.

### selección hecha
- Aplica: Sí (sub-estado de default)
- Mensaje: Elegiste: O(n²). «Confirmar respuesta» habilitado (paso 2 de 2).
- Cambios:
  - seleccion: content="Elegiste: O(n²)" (state_override)
  - btn-confirmar: variant="primary" (state_override)

### loading
- Aplica: Sí
- Mensaje: Cargando tu partida de Big O…
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - pregunta: oculto en este estado (hidden_in_states)
  - opciones: oculto en este estado (hidden_in_states)
  - seleccion: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - tabs-lenguaje: oculto en este estado (hidden_in_states)
  - codigo: oculto en este estado (hidden_in_states)
  - pregunta: oculto en este estado (hidden_in_states)
  - opciones: oculto en este estado (hidden_in_states)
  - seleccion: oculto en este estado (hidden_in_states)
  - btn-confirmar: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- opciones · tocar chip → selecciona esa complejidad
- btn-confirmar · on click → envía la respuesta (un solo intento)
- link-reportar · on click → abre O-01 (bottom-sheet en mobile, modal en desktop)

**Validaciones:**
- btn-confirmar · sin opción elegida → deshabilitado

**Feedback:**
- Las jugadas inválidas muestran un aviso sin consumir el intento (cuando corresponde).

## Accesibilidad

- **Orden de foco:** titulo → consigna → elementos del juego → acción de confirmar → link-reportar.
- **Landmarks y jerarquía:** `h1` con el nombre del juego; sin otros encabezados salvo la pregunta (`h2`) o el contador (`h2`). Landmarks: header, nav, main, footer.
- **Foco y teclado:** O-01/O-04 atrapan el foco y lo devuelven al disparador al cerrarse.
- **Propio de esta composición:** El feedback de cada jugada se anuncia en una región `aria-live=polite`; el estado nunca depende solo del color (NFR-U04).

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Big O difiere por completo de la de los otros.
- El acceso «Reportar un problema» está en todas las partidas (O-01), con el aviso de no incluir la respuesta.
- El `#número` del desafío está en el header, no en el cuerpo.
- Selección y confirmación en dos pasos (decisión #26).

**Alternativas descartadas:**
- Tabs de lenguaje como overlay: es una vista inline (C-26).

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- F-07, C-27, C-26, C-36 · flujo 1 de `user-flows.md`.
