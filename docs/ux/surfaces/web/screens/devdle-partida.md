---
name: devdle-partida
surface: web
route: /devdle
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

# Pantalla: Devdle · Partida

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Adivinar el término en hasta 6 intentos con teclado en pantalla y físico.
- **Viewports:**
  - **mobile** — grilla de intentos, teclado en pantalla y pistas apilados; el teclado queda al alcance del pulgar.
  - **desktop** — grilla a la izquierda (7/12) y pistas + teclado a la derecha (5/12), para ver todo sin scroll.

## Entrada y salida

**Entradas:**
- `devdle-instrucciones` · «Empezar» (crea la Play)
- `home` · tarjeta «en curso» (retoma en el estado exacto, C-10)

**Salidas user-driven:**
- A O-01 · «Reportar un problema»
- A `devdle-resultado` · fin de partida
- A `home` · marca o `./juegos` (la partida queda en curso)

**Salidas automáticas:**
- A `devdle-resultado` · al cerrarse la Play como ganada o perdida (el servidor decide)
- A `devdle-instrucciones` · `challenge_expired` (cambio de día con la partida abierta)

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | viewport_overrides: desktop | Marca, #número del desafío del día e idioma |
| 2 | nav-movil | nav-bar | — | navigation | solo mobile | — | Navegación principal compacta en mobile (en desktop va en el header) |
| 3 | titulo | heading | h1 | content | ambos | hidden_in_states: loading, error de sistema | Nombre del juego |
| 4 | consigna | paragraph | body | content | ambos | hidden_in_states: loading, error de sistema | Consigna y largo del término |
| 5 | grilla-intentos | image | — | content | ambos | hidden_in_states: loading, error de sistema | Grilla de intentos con feedback por letra |
| 6 | alerta-palabra | alert | warning | feedback | ambos | visible_only_in_states: error de validación | Palabra fuera de la lista (C-15), sin consumir intento |
| 7 | pista-categorias | card | — | content | ambos | hidden_in_states: loading, error de sistema | Pista: lista de categorías, sin la del día |
| 8 | leyenda | chips | — | content | ambos | hidden_in_states: loading, error de sistema | Leyenda de pistas |
| 9 | teclado | image | — | content | ambos | hidden_in_states: loading, error de sistema | Teclado en pantalla (también se acepta el físico) |
| 10 | link-reportar | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Abre O-01 para avisar que el desafío está mal |
| 11 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 12 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 13 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 14 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- nav-movil
- titulo
- loader
- alerta-sistema
- btn-reintentar
- consigna
- grilla-intentos
- alerta-palabra
- pista-categorias
- leyenda
- teclado
- link-reportar

### desktop · 1200px
- titulo
- loader
- alerta-sistema
- btn-reintentar
- row `juego`
  - col 7/12: consigna, alerta-palabra, grilla-intentos
  - col 5/12: pista-categorias, leyenda, teclado, link-reportar

## Contenido

### header
- Texto/label: > nerdose / Devdle · #8 · ES|EN
- Icono: nada
- Override desktop: content="> nerdose / Devdle     ./juegos   ./stats   ./about     #8     ES | EN"
- Annotation: #número = número de desafío del día, igual para los 5 juegos; ES|EN es un control inline

### nav-movil
- Texto/label: —
- Etiquetas: ./juegos · ./stats · ./about
- Icono: nada
- Annotation: nada

### titulo
- Texto/label: Devdle
- Icono: nada
- Annotation: nada

### consigna
- Texto/label: Adiviná el término de 5 letras. Intento 2 de 6.
- Icono: nada
- Annotation: nada

### grilla-intentos
- Texto/label: Grilla de 6 intentos × 5 letras · feedback por letra (color + símbolo)
- Asset: placeholder 5:6
- Icono: nada
- Annotation: el feedback usa color + ícono/patrón (NFR-U04)

### alerta-palabra
- Texto/label: No está en la lista. Probá con otro término.
- Icono: nada
- Annotation: nada

### pista-categorias
- Texto/label: Categorías posibles
- Texto secundario: Lenguaje · Framework · Herramienta · Protocolo · Concepto
- Icono: nada
- Annotation: nada

### leyenda
- Texto/label: —
- Etiquetas: ✓ en su lugar · ~ en otro lugar · ✗ no está
- Icono: nada
- Annotation: nada

### teclado
- Texto/label: Teclado en pantalla · letras, Enter y Borrar
- Asset: placeholder 10:4
- Icono: nada
- Annotation: en desktop se juega también con el teclado físico

### link-reportar
- Texto/label: Reportar un problema
- Icono: warning
- Annotation: si ya reportó este desafío muestra «Ya reportado» y no abre O-01 (already_reported)

### loader
- Texto/label: Cargando tu partida de Devdle…
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
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. El aviso de privacidad vive en `acerca-de`. Es del shell e igual en todas las pantallas (REQ-002, C-07; REQ-003)

## Estados

### default
- Aplica: Sí
- Mensaje: Partida en curso: 6 intentos, teclado en pantalla y físico.
- Cambios: ninguno respecto de default.

### error de validación
- Aplica: Sí
- Mensaje: No está en la lista. Probá con otro término. (No consume intento.)
- Cambios:
  - alerta-palabra: solo visible en este estado (visible_only_in_states)

### loading
- Aplica: Sí
- Mensaje: Cargando tu partida de Devdle…
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - grilla-intentos: oculto en este estado (hidden_in_states)
  - pista-categorias: oculto en este estado (hidden_in_states)
  - leyenda: oculto en este estado (hidden_in_states)
  - teclado: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar tu partida. Revisá tu conexión e intentá de nuevo: retomás desde donde estabas.
- Cambios:
  - titulo: oculto en este estado (hidden_in_states)
  - consigna: oculto en este estado (hidden_in_states)
  - grilla-intentos: oculto en este estado (hidden_in_states)
  - pista-categorias: oculto en este estado (hidden_in_states)
  - leyenda: oculto en este estado (hidden_in_states)
  - teclado: oculto en este estado (hidden_in_states)
  - link-reportar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- teclado · tocar letra/Enter/Borrar → arma o envía el intento
- Enter con 5 letras → valida en el servidor y pinta el feedback
- link-reportar · on click → abre O-01 (bottom-sheet en mobile, modal en desktop)

**Validaciones:**
- intento · largo distinto de 5 → el front no lo envía y avisa «Faltan letras»
- intento · palabra fuera de la lista → mensaje «No está en la lista. Probá con otro término.»

**Feedback:**
- Las jugadas inválidas muestran un aviso sin consumir el intento (cuando corresponde).

## Accesibilidad

- **Orden de foco:** titulo → consigna → elementos del juego → acción de confirmar → link-reportar.
- **Landmarks y jerarquía:** `h1` con el nombre del juego; sin otros encabezados salvo la pregunta (`h2`) o el contador (`h2`). Landmarks: header, nav, main, footer.
- **Foco y teclado:** O-01/O-04 atrapan el foco y lo devuelven al disparador al cerrarse.
- **Propio de esta composición:** El feedback de cada jugada se anuncia en una región `aria-live=polite`; el estado nunca depende solo del color (NFR-U04).

## Decisiones y descartes

**Decisiones tomadas:**
- Una pantalla por fase por juego: la partida de Devdle difiere por completo de la de los otros.
- El acceso «Reportar un problema» está en todas las partidas (O-01), con el aviso de no incluir la respuesta.
- El `#número` del desafío está en el header, no en el cuerpo.

**Alternativas descartadas:**
- Modal de instrucciones dentro de la partida: queda en la fase de instrucciones.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- F-04, C-15, C-10, C-11, C-36 · flujo 1 de `user-flows.md`.
