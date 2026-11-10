---
name: grep-grid-instrucciones
surface: web
route: /grep-grid
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.1"
date: 2026-11-10
---

# Pantalla: Grep Grid · Instrucciones

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Entender las reglas de Grep Grid antes de empezar (8 palabras, 4 direcciones solo hacia adelante, dos toques, sin tiempo, se puede rendir); «Empezar» crea la Play del día. Cubre también «sin desafío hoy», «anulado y sin Play», «sin sesión» y el aviso de «día nuevo» tras `challenge_expired`.
- **Viewports:**
  - **mobile** — reglas apiladas en 3 pasos y CTA al final, alcanzable con el pulgar.
  - **desktop** — columna centrada (10/12) con los 3 pasos en fila y el CTA a la vista sin scroll.

## Entrada y salida

**Entradas:**
- `home` · tarjeta «sin jugar» (CTA «Jugar →»)
- URL directa `/grep-grid` sin Play de hoy
- `grep-grid-partida` · `challenge_expired` (cambio de día, vuelve con el `#número` nuevo y el aviso «día nuevo»)
- `*-resultado` · «Siguiente juego»

**Salidas user-driven:**
- A `grep-grid-partida` · «Empezar»
- A `home` · «Volver a los juegos» o marca `> nerdose` del header
- A `estadisticas` · botón «Estadísticas» del header
- A O-02 · estado «anulado» (aviso de desafío anulado)

**Salidas automáticas:**
- Si el día cambió con la pantalla abierta, se carga el desafío nuevo y esta pantalla se refresca con el nuevo `#número` (o pasa a «sin desafío hoy»).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · playing | layout | ambos | — | Breadcrumb `> nerdose / grep-grid`, «desafío del dd/mm», acciones de juego, idioma y racha |
| 2 | titulo | heading | h1 | content | ambos | — | Nombre del juego (con su acento propio) |
| 3 | meta | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Duración y regla de una partida diaria |
| 4 | aviso-dia-nuevo | alert | info | feedback | ambos | visible_only_in_states: día nuevo | Explica que empezó un desafío nuevo y que la partida de ayer no cuenta |
| 5 | alerta-sin-desafio | alert | info | feedback | ambos | visible_only_in_states: sin desafío hoy | Estado sin desafío hoy |
| 6 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de desafío anulado; abre O-02 |
| 7 | reglas-titulo | heading | h2 | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Título del patrón «cómo se juega» |
| 8 | paso-1 | card | step | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Paso 1 de las reglas |
| 9 | paso-2 | card | step | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Paso 2 de las reglas |
| 10 | paso-3 | card | step | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Paso 3 de las reglas |
| 11 | aviso-conteo | paragraph | caption | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Aviso de que la Play no suma hasta completarse |
| 12 | btn-empezar | button | primary | input | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema; state_overrides: sin sesión | Crea la Play y abre la partida |
| 13 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Explica que hace falta la cookie funcional para jugar (O-03, `no_session`) |
| 14 | link-volver | link | — | navigation | ambos | — | Salida a la home |
| 15 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 16 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 17 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema, sin sesión; state_overrides: sin sesión | Reintentar la carga, o recrear la sesión y reintentar «Empezar» |
| 18 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- banner-cookies
- titulo
- meta
- aviso-dia-nuevo
- alerta-sin-desafio
- alerta-anulado
- loader
- alerta-sistema
- reglas-titulo
- paso-1
- paso-2
- paso-3
- aviso-conteo
- btn-empezar
- btn-reintentar
- link-volver

### desktop · 1200px
- banner-cookies
- row `centrado`
  - col 1/12: (vacía, margen)
  - col 10/12:
    - titulo
    - meta
    - aviso-dia-nuevo
    - alerta-sin-desafio
    - alerta-anulado
    - loader
    - alerta-sistema
    - reglas-titulo
    - row `pasos`
      - col 4/12: paso-1
      - col 4/12: paso-2
      - col 4/12: paso-3
    - aviso-conteo
    - row `acciones`
      - col 6/12: btn-empezar, btn-reintentar
      - col 6/12: link-volver
  - col 1/12: (vacía, margen)

## Contenido

### header
- Texto/label: > nerdose / grep-grid · desafío del 30/10 · [?] [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `playing` (REQ-005, como Devdle en REQ-004): breadcrumb con `grep-grid` en el acento del juego (`#F472B6`) y metadato «desafío del dd/mm» (se oculta si el servidor no lo informa). Acciones: «Cómo se juega» (lleva a «Cómo se juega» de esta misma pantalla), «Estadísticas» → `estadisticas`, Compartir deshabilitado («disponible al terminar la partida»), ES|EN inline y píldora con la racha global. Sin nav global ni tira `nav-movil`: en mobile las acciones envuelven a su propia fila

### titulo
- Texto/label: Grep Grid
- Icono: nada
- Annotation: nada

### meta
- Texto/label: Desafío #8 · ~3 min · una partida por día
- Icono: nada
- Annotation: la duración es orientativa: no hay límite de tiempo (RF 8)

### aviso-dia-nuevo
- Texto/label: Empezó el desafío #9. La partida de ayer quedó sin terminar y no cuenta para tu racha.
- Icono: info
- Annotation: aparece al llegar desde `grep-grid-partida` por `challenge_expired` (o al detectar el cambio de día con la pantalla abierta); se descarta al tocar «Empezar» o al salir. Si el día nuevo no tiene desafío, se muestra junto a `alerta-sin-desafio` (CA 20)

### alerta-sin-desafio
- Texto/label: Hoy no hay desafío de Grep Grid. Es un día neutro: no suma ni corta tu racha.
- Icono: nada
- Annotation: también es el estado del día en que se despliega el juego (supuesto «Primera puesta en marcha»): Grep Grid se juega desde el día siguiente

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: nada
- Annotation: el modal O-02 se abre solo al entrar en este estado. También se llega acá si «Empezar» responde `challenge_voided`

### reglas-titulo
- Texto/label: // cómo se juega
- Icono: nada
- Annotation: nada

### paso-1
- Texto/label: 1 · Buscá las 8 palabras
- Texto secundario: Son términos de tecnología escondidos en una grilla de 12×12 letras. La lista de palabras está a la vista: lo que tenés que encontrar es dónde están.
- Icono: nada
- Annotation: las 8 palabras salen del mismo banco de términos que Devdle, sin tema común; la grilla y las palabras son iguales en ES y EN (supuesto «Idioma»)

### paso-2
- Texto/label: 2 · Tocá la primera y la última letra
- Texto secundario: Las palabras van en 4 direcciones, siempre hacia adelante: → horizontal, ↓ vertical, ↘ y ↗ en diagonal. Nunca al revés. El primer toque marca el inicio y el segundo envía la selección; tocar de nuevo el inicio la cancela. Si la selección no es una palabra de la lista, no pasa nada: probás de nuevo.
- Icono: nada
- Annotation: las 4 direcciones y la mecánica de dos toques son supuestos de REQ-005 («Direcciones permitidas», «Interacción táctil»); con teclado se recorre la grilla con las flechas y se marca con Enter o Espacio (CA 35)

### paso-3
- Texto/label: 3 · Sin tiempo
- Texto secundario: No hay reloj: el contador N/8 lleva la cuenta. Podés rendirte cuando quieras; la partida cierra con las palabras que encontraste y te mostramos las que faltaban, con su definición.
- Icono: nada
- Annotation: sin cronómetro en ningún punto (RF 8, decisión #6 del PRD); «Rendirse» pide confirmación (O-04)

### aviso-conteo
- Texto/label: La partida no cuenta hasta que la completes. Encontrar las 8 o rendirte suma a tu racha.
- Icono: nada
- Annotation: rendirse cierra la partida como perdida y también cuenta como completada (decisión #3 del PRD; CA 10, 12)

### btn-empezar
- Texto/label: Empezar
- Icono: arrow-right
- Annotation: crea la Play con 0/8 (idempotente: tocar dos veces no crea otra, CA 2)

### banner-cookies
- Texto/label: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Icono: warning
- Annotation: banner `warning` del shell (O-03). También aparece si «Empezar» responde `no_session` (CA 23)

### link-volver
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: nada

### loader
- Texto/label: $ cargando grep-grid…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar el desafío de Grep Grid. Revisá tu conexión e intentá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: en `error de sistema` recarga el desafío; en `sin sesión` recrea la sesión y vuelve a intentar «Empezar»

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. El aviso de privacidad vive en `acerca-de`. Es del shell e igual en todas las pantallas (REQ-002, C-07; REQ-003)

## Estados

### default
- Aplica: Sí
- Mensaje: Reglas en 3 pasos y CTA «Empezar».
- Cambios: ninguno respecto de default.

### día nuevo
- Aplica: Sí (sub-estado de default)
- Mensaje: Empezó el desafío #9. La partida de ayer quedó sin terminar y no cuenta para tu racha.
- Cambios:
  - aviso-dia-nuevo: solo visible en este estado (visible_only_in_states)

### sin desafío hoy
- Aplica: Sí (sub-estado de default)
- Mensaje: Hoy no hay desafío de Grep Grid. Es un día neutro: no suma ni corta tu racha.
- Cambios:
  - alerta-sin-desafio: solo visible en este estado (visible_only_in_states)
  - reglas-titulo: oculto en este estado (hidden_in_states)
  - paso-1: oculto en este estado (hidden_in_states)
  - paso-2: oculto en este estado (hidden_in_states)
  - paso-3: oculto en este estado (hidden_in_states)
  - aviso-conteo: oculto en este estado (hidden_in_states)
  - btn-empezar: oculto en este estado (hidden_in_states)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada. (Abre O-02; no se puede empezar.)
- Cambios:
  - alerta-anulado: solo visible en este estado (visible_only_in_states)
  - reglas-titulo: oculto en este estado (hidden_in_states)
  - paso-1: oculto en este estado (hidden_in_states)
  - paso-2: oculto en este estado (hidden_in_states)
  - paso-3: oculto en este estado (hidden_in_states)
  - aviso-conteo: oculto en este estado (hidden_in_states)
  - btn-empezar: oculto en este estado (hidden_in_states)

### sin sesión
- Aplica: Sí (sub-estado de default)
- Mensaje: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Cambios:
  - btn-empezar: variant="disabled", annotation="deshabilitado mientras no hay sesión (O-03, `no_session`); no se crea ninguna Play" (state_override)
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: visible en este estado, annotation="recrea la sesión y reintenta «Empezar»" (state_override)

### loading
- Aplica: Sí
- Mensaje: $ cargando grep-grid…
- Cambios:
  - meta: oculto en este estado (hidden_in_states)
  - reglas-titulo: oculto en este estado (hidden_in_states)
  - paso-1: oculto en este estado (hidden_in_states)
  - paso-2: oculto en este estado (hidden_in_states)
  - paso-3: oculto en este estado (hidden_in_states)
  - aviso-conteo: oculto en este estado (hidden_in_states)
  - btn-empezar: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar el desafío de Grep Grid. Revisá tu conexión e intentá de nuevo.
- Cambios:
  - meta: oculto en este estado (hidden_in_states)
  - reglas-titulo: oculto en este estado (hidden_in_states)
  - paso-1: oculto en este estado (hidden_in_states)
  - paso-2: oculto en este estado (hidden_in_states)
  - paso-3: oculto en este estado (hidden_in_states)
  - aviso-conteo: oculto en este estado (hidden_in_states)
  - btn-empezar: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- btn-empezar · on click → crea la Play (C-09) con `found_words: []` y navega a `grep-grid-partida`
- btn-empezar · respuesta `no_session` → estado `sin sesión`; `challenge_voided` → estado `anulado`; `challenge_expired` → recarga el desafío nuevo y pasa a `día nuevo`
- btn-reintentar · on click → recarga (error de sistema) o recrea la sesión y reintenta (sin sesión)
- link-volver · on click → navega a `home`
- alerta-anulado · al entrar → abre O-02
- ES|EN del header → cambia el idioma de las instrucciones sin recargar

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Mientras se crea la Play, «Empezar» queda deshabilitado.

## Accesibilidad

- **Orden de foco:** header (breadcrumb → acciones) → titulo → pasos (lectura) → btn-empezar → link-volver.
- **Landmarks y jerarquía:** `h1` con el nombre del juego; «Cómo se juega» es `h2`; los pasos son `h3`. Landmarks: header (con el breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** O-02 (modal) atrapa el foco hasta que se cierra y lo devuelve a `alerta-anulado`.
- **Propio de esta composición:** Los avisos de estado (`día nuevo`, `sin desafío hoy`, `anulado`, `sin sesión`) se anuncian con `role=status`. Las flechas de dirección del paso 2 (→ ↓ ↘ ↗) van acompañadas de su nombre en texto, no solas.

## Decisiones y descartes

**Decisiones tomadas:**
- Las instrucciones se muestran siempre (pregunta abierta 1 del product-map): es el único punto de entrada de la Play.
- «Sin desafío hoy» y «anulado» son estados de esta pantalla, no pantallas aparte (C-14, C-42).
- El aviso «no cuenta hasta que la completes» se mantiene porque aclara que salir antes no rompe la racha; REQ-005 suma que rendirse también completa.
- REQ-005: el header pasa al `game-header` del DS (variant `playing`) y desaparece la tira `nav-movil`, como en Devdle (REQ-004); el layout es el mismo en ambos viewports salvo la fila de pasos (supuesto «Cabecera de las pantallas»).
- REQ-005: el paso 2 dice 4 direcciones hacia adelante (→ ↓ ↘ ↗), no 3, y explica los dos toques y la cancelación (supuestos «Direcciones permitidas» e «Interacción táctil»). Decir «3 direcciones» dejaba fuera una diagonal.
- REQ-005: estado `día nuevo` con aviso explícito tras `challenge_expired` (CA 20), igual que Devdle.
- REQ-005: `sin sesión` explica la cookie funcional y ofrece «Reintentar» (CA 23), en lugar de dejar solo el CTA deshabilitado.
- REQ-005: los avisos informativos (`aviso-dia-nuevo`, `alerta-sin-desafio`) se implementan con `banner` del DS, porque `alert` del DS es solo para errores del sistema; `aviso-conteo` pasa de `alert` a párrafo `caption` por la misma razón.
- REQ-005: los pasos usan la variant `step` de `card` del DS.

**Alternativas descartadas:**
- Mostrar las instrucciones solo la primera vez: requiere preferencia en el navegador y un acceso «¿Cómo se juega?» desde la partida.
- Dibujar una mini grilla de ejemplo en el paso 2: no está en el prototipo ni en el PRD; las flechas con nombre alcanzan para explicar las direcciones.

**Preguntas abiertas:**
- Pregunta 1 del product-map: instrucciones diarias o solo la primera vez.

## Trazabilidad

- F-05, C-08, C-09, C-14, C-41, C-42, C-02, C-11 · REQ-005 (RF 1, 19, 22; CA 1, 2, 20, 21, 22, 23) · flujos 1, 2 y 3 de `user-flows.md`.
