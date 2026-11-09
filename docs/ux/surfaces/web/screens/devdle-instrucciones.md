---
name: devdle-instrucciones
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

# Pantalla: Devdle · Instrucciones

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Entender las reglas de Devdle antes de empezar; «Empezar» crea la Play del día. Cubre también «sin desafío hoy», «anulado y sin Play», «sin sesión» y el aviso de «día nuevo» tras `challenge_expired`.
- **Viewports:**
  - **mobile** — reglas apiladas en 3 pasos y CTA al final, alcanzable con el pulgar.
  - **desktop** — columna centrada (10/12) con los 3 pasos en fila y el CTA a la vista sin scroll.

## Entrada y salida

**Entradas:**
- `home` · tarjeta «sin jugar» (CTA «Jugar →»)
- URL directa `/devdle` sin Play de hoy
- `devdle-partida` · `challenge_expired` (cambio de día, vuelve con el `#número` nuevo y el aviso «día nuevo»)
- `*-resultado` · «Siguiente juego»

**Salidas user-driven:**
- A `devdle-partida` · «Empezar»
- A `home` · «Volver a los juegos» o marca `> nerdose` del header
- A `estadisticas` · botón «Estadísticas» del header
- A O-02 · estado «anulado» (aviso de desafío anulado)

**Salidas automáticas:**
- Si el día cambió con la pantalla abierta, se carga el desafío nuevo y esta pantalla se refresca con el nuevo `#número` (o pasa a «sin desafío hoy»).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · playing | layout | ambos | — | Breadcrumb `> nerdose / devdle`, «desafío del dd/mm», acciones de juego, idioma y racha |
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
- Texto/label: > nerdose / devdle · desafío del 30/10 · [?] [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `playing` (REQ-004): breadcrumb con `devdle` en el acento del juego y metadato «desafío del dd/mm» (decisión #12; se oculta si el servidor no lo informa). Acciones: «Cómo se juega» (lleva a «Cómo se juega» de esta misma pantalla), «Estadísticas» → `estadisticas`, Compartir deshabilitado («disponible al terminar la partida»), ES|EN inline y píldora con la racha global. Sin nav global ni tira `nav-movil`: en mobile las acciones envuelven a su propia fila

### titulo
- Texto/label: Devdle
- Icono: nada
- Annotation: nada

### meta
- Texto/label: Desafío #8 · ~2 min · una partida por día
- Icono: nada
- Annotation: nada

### aviso-dia-nuevo
- Texto/label: Empezó el desafío #9. La partida de ayer quedó sin terminar y no cuenta para tu racha.
- Icono: info
- Annotation: aparece al llegar desde `devdle-partida` por `challenge_expired` (o al detectar el cambio de día con la pantalla abierta); se descarta al tocar «Empezar» o al salir. Si el día nuevo no tiene desafío, se muestra junto a `alerta-sin-desafio`

### alerta-sin-desafio
- Texto/label: Hoy no hay desafío de Devdle. Es un día neutro: no suma ni corta tu racha.
- Icono: nada
- Annotation: nada

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: nada
- Annotation: el modal O-02 se abre solo al entrar en este estado. También se llega acá si «Empezar» responde `challenge_voided`

### reglas-titulo
- Texto/label: // cómo se juega
- Icono: nada
- Annotation: nada

### paso-1
- Texto/label: 1 · Adiviná el término
- Texto secundario: Es un término de tecnología de 4 a 12 letras, el mismo para todos hoy. Tenés 6 intentos para encontrarlo.
- Icono: nada
- Annotation: el largo exacto se ve en el tablero al empezar (vista pública `length`)

### paso-2
- Texto/label: 2 · Leé las pistas
- Texto secundario: Cada letra te dice si está en su lugar (✓), en otro lugar (~) o no está (✗). Además del color, cada pista lleva su símbolo. Solo valen términos de la lista: si no está, no gastás intento.
- Icono: nada
- Annotation: nada

### paso-3
- Texto/label: 3 · Mirá las categorías
- Texto secundario: Te mostramos las 8 categorías del banco —son siempre las mismas— para orientarte. La del día, la definición y un resumen se revelan al terminar.
- Icono: nada
- Annotation: la lista es fija y no filtra la categoría del día (REQ-004, supuesto «Vista pública»)

### aviso-conteo
- Texto/label: La partida no cuenta hasta que la completes. Ganar o perder suma a tu racha.
- Icono: nada
- Annotation: nada

### btn-empezar
- Texto/label: Empezar
- Icono: arrow-right
- Annotation: crea la Play (idempotente: tocar dos veces no crea otra)

### banner-cookies
- Texto/label: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Icono: warning
- Annotation: banner `warning` del shell (O-03). También aparece si «Empezar» responde `no_session`

### link-volver
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: nada

### loader
- Texto/label: $ cargando devdle…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar el desafío de Devdle. Revisá tu conexión e intentá de nuevo.
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
- Mensaje: Hoy no hay desafío de Devdle. Es un día neutro: no suma ni corta tu racha.
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
- Mensaje: $ cargando devdle…
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
- Mensaje: No pudimos cargar el desafío de Devdle. Revisá tu conexión e intentá de nuevo.
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
- btn-empezar · on click → crea la Play (C-09) y navega a `devdle-partida`
- btn-empezar · respuesta `no_session` → estado `sin sesión`; `challenge_voided` → estado `anulado`; `challenge_expired` → recarga el desafío nuevo y pasa a `día nuevo`
- btn-reintentar · on click → recarga (error de sistema) o recrea la sesión y reintenta (sin sesión)
- link-volver · on click → navega a `home`
- alerta-anulado · al entrar → abre O-02

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Mientras se crea la Play, «Empezar» queda deshabilitado.

## Accesibilidad

- **Orden de foco:** header (breadcrumb → acciones) → titulo → pasos (lectura) → btn-empezar → link-volver.
- **Landmarks y jerarquía:** `h1` con el nombre del juego; «Cómo se juega» es `h2`; los pasos son `h3`. Landmarks: header (con el breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** O-02 (modal) atrapa el foco hasta que se cierra y lo devuelve a `alerta-anulado`.
- **Propio de esta composición:** Los avisos de estado (`día nuevo`, `sin desafío hoy`, `anulado`, `sin sesión`) se anuncian con `role=status`.

## Decisiones y descartes

**Decisiones tomadas:**
- Las instrucciones se muestran siempre (pregunta abierta 1 del product-map): es el único punto de entrada de la Play.
- «Sin desafío hoy» y «anulado» son estados de esta pantalla, no pantallas aparte (C-14, C-42).
- El aviso «no cuenta hasta que la completes» se mantiene porque aclara que salir antes no rompe la racha.
- REQ-004: el header pasa al `game-header` del DS (variant `playing`) y desaparece la tira `nav-movil`; el layout es el mismo en ambos viewports salvo la fila de pasos.
- REQ-004: el paso 3 dice que las 8 categorías son fijas (supuesto «Vista pública»): prometer «sin la del día» era falso y daba una pista que no existe.
- REQ-004: estado `día nuevo` con aviso explícito tras `challenge_expired` (supuesto «Jugada tardía»: «la interfaz carga el desafío nuevo y avisa»). Resuelve la decisión pendiente del flujo 2 de `user-flows.md`.
- REQ-004: `sin sesión` explica la cookie funcional y ofrece «Reintentar» (CA 19), en lugar de dejar solo el CTA deshabilitado.
- REQ-004: los avisos informativos (`aviso-dia-nuevo`, `alerta-sin-desafio`) se implementan con `banner` del DS, porque `alert` del DS es solo para errores del sistema.

**Alternativas descartadas:**
- Mostrar las instrucciones solo la primera vez: requiere preferencia en el navegador y un acceso «¿Cómo se juega?» desde la partida.
- Volver a instrucciones tras `challenge_expired` sin aviso: el jugador perdería su partida sin entender por qué.

**Preguntas abiertas:**
- Pregunta 1 del product-map: instrucciones diarias o solo la primera vez.

## Trazabilidad

- F-04, C-08, C-09, C-14, C-41, C-42, C-02, C-11 · REQ-004 (RF 1, 3, 17; CA 1, 2, 16, 17, 18, 19) · flujos 1, 2 y 3 de `user-flows.md`.
