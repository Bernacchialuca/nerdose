---
name: timeline-instrucciones
surface: web
route: /timeline
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

# Pantalla: Tech Timeline · Instrucciones

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Entender las reglas de Tech Timeline antes de empezar (5 hitos de una misma categoría, del más antiguo al más reciente, un solo intento, tres formas de mover: arrastrar desde el asa, teclado o botones ↑ ↓); «Empezar» crea la Play del día. Cubre también «sin desafío hoy», «anulado y sin Play», «sin sesión» y el aviso de «día nuevo» tras `challenge_expired`.
- **Viewports:**
  - **mobile** — reglas apiladas en 3 pasos y CTA al final, alcanzable con el pulgar.
  - **desktop** — columna centrada (10/12) con los 3 pasos en fila y el CTA a la vista sin scroll.

## Entrada y salida

**Entradas:**
- `home` · tarjeta «sin jugar» (CTA «Jugar →»)
- URL directa `/timeline` sin Play de hoy
- `timeline-partida` · `challenge_expired` (cambio de día, vuelve con el `#número` nuevo y el aviso «día nuevo»)
- `*-resultado` · «Siguiente juego»

**Salidas user-driven:**
- A `timeline-partida` · «Empezar»
- A `home` · «Volver a los juegos» o marca `> nerdose` del header
- A `estadisticas` · botón «Estadísticas» del header
- A O-02 · estado «anulado» (aviso de desafío anulado)

**Salidas automáticas:**
- Si el día cambió con la pantalla abierta, se carga el desafío nuevo y esta pantalla se refresca con el nuevo `#número` (o pasa a «sin desafío hoy»).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | game-header · playing | layout | ambos | — | Breadcrumb `> nerdose / tech-timeline`, «desafío del dd/mm», acciones de juego, idioma y racha |
| 2 | titulo | heading | h1 | content | ambos | — | Nombre del juego (con su acento propio) |
| 3 | meta | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Duración y regla de una partida diaria |
| 4 | aviso-dia-nuevo | alert | info | feedback | ambos | visible_only_in_states: día nuevo | Explica que empezó un desafío nuevo y que la partida de ayer no cuenta |
| 5 | alerta-sin-desafio | alert | info | feedback | ambos | visible_only_in_states: sin desafío hoy | Estado sin desafío hoy |
| 6 | alerta-anulado | alert | warning | feedback | ambos | visible_only_in_states: anulado | Aviso de desafío anulado; abre O-02 |
| 7 | reglas-titulo | heading | h2 | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Título del patrón «cómo se juega» |
| 8 | paso-1 | card | step | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Paso 1 de las reglas |
| 9 | paso-2 | card | step | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Paso 2 de las reglas |
| 10 | paso-3 | card | step | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Paso 3 de las reglas |
| 11 | aviso-conteo | paragraph | caption | content | ambos | hidden_in_states: sin desafío hoy, anulado, loading, error de sistema | Aviso de que la Play no suma hasta confirmar y de que el orden armado no se guarda |
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
- Texto/label: > nerdose / tech-timeline · desafío del 30/10 · [?] [stats] [Compartir] ES|EN · 🔥 4
- Icono: nada
- Annotation: `game-header` variant `playing` (REQ-006, como Devdle y Grep Grid): breadcrumb con `tech-timeline` en el acento del juego (`#C39BFF`) y metadato «desafío del dd/mm» (se oculta si el servidor no lo informa). Acciones: «Cómo se juega» (lleva a «Cómo se juega» de esta misma pantalla), «Estadísticas» → `estadisticas`, Compartir deshabilitado («disponible al terminar la partida»), ES|EN inline y píldora con la racha global. Sin nav global ni tira `nav-movil`: en mobile las acciones envuelven a su propia fila

### titulo
- Texto/label: Tech Timeline
- Icono: nada
- Annotation: nada

### meta
- Texto/label: Desafío #8 · ~1 min · una partida por día
- Icono: nada
- Annotation: nada

### aviso-dia-nuevo
- Texto/label: Empezó el desafío #9. La partida de ayer quedó sin confirmar y no cuenta para tu racha.
- Icono: info
- Annotation: aparece al llegar desde `timeline-partida` por `challenge_expired` (CA 13) o al detectar el cambio de día con la pantalla abierta; se descarta al tocar «Empezar» o al salir. Si el día nuevo no tiene desafío, se muestra junto a `alerta-sin-desafio`

### alerta-sin-desafio
- Texto/label: Hoy no hay desafío de Tech Timeline. Es un día neutro: no suma ni corta tu racha.
- Icono: nada
- Annotation: también es el estado del día en que se despliega el juego (supuesto «Primera puesta en marcha»): Tech Timeline se juega desde el día siguiente (CA 15)

### alerta-anulado
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: nada
- Annotation: el modal O-02 se abre solo al entrar en este estado. También se llega acá si «Empezar» responde `challenge_voided` (CA 14)

### reglas-titulo
- Texto/label: // cómo se juega
- Icono: nada
- Annotation: nada

### paso-1
- Texto/label: 1 · Mirá los 5 hitos
- Texto secundario: Son hechos de una misma categoría de la historia de la tecnología (lenguajes, frameworks, empresas…), mezclados y sin fecha.
- Icono: nada
- Annotation: la categoría del día y la consigna aparecen recién en la partida; los nombres de los hitos no se traducen (supuesto «Etiqueta del hecho»)

### paso-2
- Texto/label: 2 · Ordenalos
- Texto secundario: Del más antiguo al más reciente. Arrastrá cada fila desde su asa ⠿, usá los botones ↑ ↓, o con el teclado: Espacio para tomar un hito, flechas para moverlo, Espacio para soltarlo y Escape para cancelar.
- Icono: nada
- Annotation: las tres formas son equivalentes y llegan al mismo orden (RF 3, supuesto «Interacción: ordenar»); el asa existe para que el resto de la fila deje hacer scroll en el teléfono (CA 11)

### paso-3
- Texto/label: 3 · Confirmá
- Texto secundario: Tenés un solo intento. Cuando el orden te convenza, tocá «Confirmar orden»: vas a ver las fechas, una nota de cada hito y cuántas posiciones acertaste.
- Icono: nada
- Annotation: tras confirmar no hay reintento (RF 4); victoria solo con 5/5, pero cualquier resultado suma a la racha (RF 6)

### aviso-conteo
- Texto/label: La partida no cuenta hasta que confirmes. Si salís antes, al volver los hitos arrancan otra vez mezclados.
- Icono: nada
- Annotation: el orden en construcción vive solo en la pantalla; no se guarda (supuesto «Estado de la partida y retomar», CA 12)

### btn-empezar
- Texto/label: Empezar
- Icono: arrow-right
- Annotation: crea la Play (idempotente: tocar dos veces no crea otra, CA 2)

### banner-cookies
- Texto/label: Para jugar necesitamos una única cookie funcional, sin datos personales. Activá las cookies y tocá «Reintentar».
- Icono: warning
- Annotation: banner `warning` del shell (O-03). También aparece si «Empezar» responde `no_session` (CA 16)

### link-volver
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: nada

### loader
- Texto/label: $ cargando tech-timeline…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar el desafío de Tech Timeline. Revisá tu conexión e intentá de nuevo.
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
- Mensaje: Empezó el desafío #9. La partida de ayer quedó sin confirmar y no cuenta para tu racha.
- Cambios:
  - aviso-dia-nuevo: solo visible en este estado (visible_only_in_states)

### sin desafío hoy
- Aplica: Sí (sub-estado de default)
- Mensaje: Hoy no hay desafío de Tech Timeline. Es un día neutro: no suma ni corta tu racha.
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
- Mensaje: $ cargando tech-timeline…
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
- Mensaje: No pudimos cargar el desafío de Tech Timeline. Revisá tu conexión e intentá de nuevo.
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
- btn-empezar · on click → crea la Play (C-09) con `state = {}` y navega a `timeline-partida`
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
- **Landmarks y jerarquía:** `h1` con el nombre del juego; «Cómo se juega» es `h2`; el kicker de cada paso es texto de la `card` `step` (como en Devdle y Grep Grid). Landmarks: header (con el breadcrumb como `nav` con nombre), main, footer.
- **Foco y teclado:** O-02 (modal) atrapa el foco hasta que se cierra y lo devuelve a `alerta-anulado`.
- **Propio de esta composición:** Los avisos de estado (`día nuevo`, `sin desafío hoy`, `anulado`, `sin sesión`) se anuncian con `role=status`. El paso 2 nombra las teclas con texto («Espacio», «Escape», «flechas»), no solo con glifos; el asa ⠿ y las flechas ↑ ↓ van acompañadas de su nombre.

## Decisiones y descartes

**Decisiones tomadas:**
- Las instrucciones se muestran siempre (pregunta abierta 1 del product-map): es el único punto de entrada de la Play.
- «Sin desafío hoy» y «anulado» son estados de esta pantalla, no pantallas aparte (C-14, C-42).
- REQ-006: el header pasa al `game-header` del DS (variant `playing`) y desaparece la tira `nav-movil`, como Devdle (REQ-004) y Grep Grid (REQ-005) (supuesto «Cabecera de las pantallas»). El layout por viewport no cambia.
- REQ-006: el paso 2 enseña las tres formas de mover (asa, ↑ ↓ y teclado con Espacio/flechas/Escape), porque el teclado de dnd-kit no es descubrible sin explicación (RF 3, CA 10; NFR-U03).
- REQ-006: el paso 3 anticipa lo que se ve al confirmar (fechas, notas y posiciones acertadas), para que el único intento no se sienta como un salto al vacío.
- REQ-006: `aviso-conteo` avisa que el orden armado no se guarda si se sale antes de confirmar (supuesto «Estado de la partida y retomar», CA 12); es la única regla del juego que puede sorprender al volver.
- REQ-006: estado `día nuevo` con aviso explícito tras `challenge_expired` (CA 13), y `sin sesión` explica la cookie funcional con «Reintentar» (CA 16), como en Devdle y Grep Grid.
- REQ-006: los avisos informativos (`aviso-dia-nuevo`, `alerta-sin-desafio`) y de advertencia (`alerta-anulado`, `banner-cookies`) se implementan con `banner` del DS, porque `alert` del DS es solo para errores del sistema; `aviso-conteo` pasa de `alert` a párrafo `caption` por la misma razón. Los pasos usan la variant `step` de `card`.

**Alternativas descartadas:**
- Mostrar las instrucciones solo la primera vez: requiere preferencia en el navegador y un acceso «¿Cómo se juega?» desde la partida.
- Mostrar un ejemplo de 5 hitos ordenados en el paso 1: no está en el prototipo y adelanta hechos que podrían salir en desafíos reales.

**Preguntas abiertas:**
- Pregunta 1 del product-map: instrucciones diarias o solo la primera vez.

## Trazabilidad

- F-06, C-08, C-09, C-14, C-41, C-42, C-02, C-11 · REQ-006 (RF 1, 3, 4, 10, 18, 21; CA 1, 2, 12-16) · flujos 1, 2 y 3 de `user-flows.md`.
