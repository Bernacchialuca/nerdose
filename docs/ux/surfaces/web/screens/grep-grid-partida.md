---
name: grep-grid-partida
surface: web
route: /grep-grid
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

# Pantalla: Grep Grid · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Encontrar las 8 palabras tocando primera y última letra; contador N/8, sin tiempo, con «Rendirse».
- **Viewports:**
  - **mobile** — contador, grilla 12×12 escalada al ancho, lista de palabras y «Rendirse» en una columna.
  - **desktop** — grilla grande a la izquierda (7/12), lista de palabras, «Rendirse» y reporte a la derecha (5/12).

## Entrada y salida

**Entradas:**
- `grep-grid-instrucciones` · «Empezar» (crea la Play)
- `home` · tarjeta «en curso» (retoma en el estado exacto, C-10)

**Salidas user-driven:**
- A O-01 · «Reportar un problema»
- A `grep-grid-resultado` · fin de partida
- A O-04 · «Rendirse»
- A `home` · marca o `./juegos` (la partida queda en curso)

**Salidas automáticas:**
- A `grep-grid-resultado` · al cerrarse la Play como ganada o perdida (el servidor decide)
- A `grep-grid-instrucciones` · `challenge_expired` (cambio de día con la partida abierta)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | viewport_overrides: desktop | Marca, #número del desafío del día e idioma |
| 2 | nav-movil | nav-bar | — | navigation | solo mobile | — | Navegación principal compacta en mobile (en desktop va en el header) |
| 3 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | Nombre del juego |
| 4 | contador | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema | Contador N/8 (reemplaza el reloj; sin cronómetro en ningún punto) |
| 5 | grilla | image | — | content | ambos | hidden_in_states: loading, error de sistema | Grilla 12×12 de letras |
| 6 | alerta-seleccion | alert | warning | feedback | ambos | visible_only_in_states: error de validación | Selección que no forma una palabra (sin penalización) |
| 7 | lista-palabras | list | — | content | ambos | hidden_in_states: loading, error de sistema | Las 8 palabras: las encontradas tachadas con su definición |
| 8 | btn-rendirse | button | error | input | ambos | hidden_in_states: loading, error de sistema | Cierra la partida como perdida (C-20); abre O-04 |
| 9 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Abre O-01 para avisar que el desafío está mal |
| 10 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 11 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 12 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 13 | footer | footer | — | layout | ambos | — | Aviso breve de privacidad y enlace a Acerca de |

## Layout por viewport

### mobile · 400px
- nav-movil
- titulo
- loader
- alerta-sistema
- btn-reintentar
- contador
- grilla
- alerta-seleccion
- lista-palabras
- btn-rendirse
- link-reportar

### desktop · 1200px
- titulo
- loader
- alerta-sistema
- btn-reintentar
- row `juego`
  - col 7/12: contador, grilla, alerta-seleccion
  - col 5/12: lista-palabras, btn-rendirse, link-reportar

## Contenido

### header
- Texto/label: > nerdose / Grep Grid · #8 · ES|EN
- Icono: nada
- Override desktop: content="> nerdose / Grep Grid     ./juegos   ./stats   ./about     #8     ES | EN"
- Annotation: #número = número de desafío del día, igual para los 5 juegos; ES|EN es un control inline

### nav-movil
- Texto/label: —
- Etiquetas: ./juegos · ./stats · ./about
- Icono: nada
- Annotation: nada

### titulo
- Texto/label: Grep Grid
- Icono: nada
- Annotation: nada

### contador
- Texto/label: 3/8 encontradas
- Icono: nada
- Annotation: nada

### grilla
- Texto/label: Grilla 12×12 · tocá la primera y la última letra de cada palabra
- Asset: placeholder 1:1
- Icono: nada
- Annotation: a 320 px las celdas se escalan al ancho; la selección en reversa se rechaza

### alerta-seleccion
- Texto/label: No es una palabra. Probá con otra selección.
- Icono: nada
- Annotation: nada

### lista-palabras
- Texto/label: —
- Forma: lista de 8 elementos (título + detalle)
- Icono: nada
- Annotation: nada

### btn-rendirse
- Texto/label: Rendirse
- Icono: close
- Annotation: separado visualmente de la grilla para evitar un toque accidental

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: si ya reportó este desafío muestra «Ya reportado» y no abre O-01 (already_reported)

### loader
- Texto/label: Cargando tu partida de Grep Grid…
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
- Mensaje: 3/8 encontradas: sin cronómetro, con «Rendirse» siempre disponible.
- Cambios: ninguno respecto de default.

### error de validación
- Aplica: Sí
- Mensaje: No es una palabra. Probá con otra selección. (Sin penalización.)
- Cambios:
  - alerta-seleccion: solo visible en este estado (visible_only_in_states)

### loading
- Aplica: Sí
- Mensaje: Cargando tu partida de Grep Grid…
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - contador: oculto en este estado (hidden_in_states)
  - grilla: oculto en este estado (hidden_in_states)
  - lista-palabras: oculto en este estado (hidden_in_states)
  - btn-rendirse: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - contador: oculto en este estado (hidden_in_states)
  - grilla: oculto en este estado (hidden_in_states)
  - lista-palabras: oculto en este estado (hidden_in_states)
  - btn-rendirse: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- grilla · tocar primera y última letra → valida la palabra
- btn-rendirse · on click → abre O-04
- link-reportar · on click → abre O-01 (bottom-sheet en mobile, modal en desktop)

**Validaciones:**
- selección · no forma una palabra → «No es una palabra. Probá con otra selección.»
- selección · en reversa → se rechaza sin penalización

**Feedback:**
- Las jugadas inválidas muestran un aviso sin consumir el intento (cuando corresponde).

## Accesibilidad

- **Orden de foco:** titulo → consigna → elementos del juego → acción de confirmar → link-reportar.
- **Landmarks y jerarquía:** `h1` con el nombre del juego; sin otros encabezados salvo la pregunta (`h2`) o el contador (`h2`). Landmarks: header, nav, main, footer.
- **Foco y teclado:** O-01/O-04 atrapan el foco y lo devuelven al disparador al cerrarse.
- **Propio de esta composición:** El feedback de cada jugada se anuncia en una región `aria-live=polite`; el estado nunca depende solo del color (NFR-U04).

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Grep Grid difiere por completo de la de los otros.
- El acceso «Reportar un problema» está en todas las partidas (O-01), con el aviso de no incluir la respuesta.
- El `#número` del desafío está en el header, no en el cuerpo.
- Grep Grid sin tiempo: el contador `N/8` reemplaza al reloj del prototipo (decisión #6); «Rendirse» es un botón de la pantalla (decisión #7).

**Alternativas descartadas:**
- Modal de instrucciones dentro de la partida: queda en la fase de instrucciones.

**Preguntas abiertas:**
- Pregunta 6 del product-map: si «Rendirse» pide confirmación (O-04).

## Trazabilidad

- F-05, C-19, C-20, C-36 · flujo 1 de `user-flows.md`.
