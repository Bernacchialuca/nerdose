---
name: o-02-anulado
surface: web
route: (overlay de `home` y `*-instrucciones`)
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.1"
date: 2026-11-11
overlay: true
overlay_type: modal
triggered_by: home
---

# Pantalla: O-02 · Aviso de desafío anulado

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Avisar que el desafío fue anulado y permitir «Marcar como completado» para sostener la racha.
- **Viewports:**
  - **mobile** — modal a ancho casi completo con el CTA principal arriba del secundario.
  - **desktop** — modal centrado (6/12).

## Entrada y salida

**Entradas:**
- `home` · tarjeta «anulado» (btn-aviso-anulado)
- `*-instrucciones` · estado «anulado» (sin Play: quien ya tiene una Play `voided` va directo a `*-resultado` en estado `anulado`)

**Salidas user-driven:**
- A `{juego}-resultado` (estado anulado) · «Marcar como completado»
- Cierra y vuelve a la pantalla de origen · «Cerrar»

**Salidas automáticas:**
- A `{juego}-instrucciones` del desafío de hoy · `409 challenge_expired` (el desafío anulado era de ayer: cambió el día con el overlay abierto); sin cambios de racha
- Cierra y refresca la pantalla de origen · `409 not_voided` (el desafío no está anulado); no se crea ninguna Play

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Título del overlay y cierre |
| 2 | texto | paragraph | body | content | ambos | — | Mensaje de anulación |
| 3 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Falla al crear la Play voided |
| 4 | aviso-racha | paragraph | caption | content | ambos | — | Qué suma marcar como completado |
| 5 | btn-marcar | button | primary | input | ambos | state_overrides: loading | Crea la Play voided y suma la racha (C-42) |
| 6 | btn-cerrar | button | tertiary | input | ambos | — | Cierra sin marcar |

## Layout por viewport

### mobile · 400px
- texto
- aviso-racha
- alerta-sistema
- btn-marcar
- btn-cerrar

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía, margen)
  - col 6/12: texto, aviso-racha, alerta-sistema, row `acciones` (col 6/12: btn-cerrar · col 6/12: btn-marcar)
  - col 3/12: (vacía, margen)

## Contenido

### header
- Texto/label: Desafío anulado
- Icono: close
- Annotation: nada

### texto
- Texto/label: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Icono: nada
- Annotation: nada

### aviso-racha
- Texto/label: Marcarlo suma el día a tu racha de este juego y a la global, sin contar como partida jugada.
- Icono: nada
- Annotation: C-42: suma a las rachas y a `total_completed`, no a `played`, `wins` ni stats propias

### alerta-sistema
- Texto/label: No pudimos marcar el desafío como completado. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-marcar
- Texto/label: Marcar como completado
- Icono: check
- Annotation: `button` `primary` del DS. Idempotente: si ya existe la Play, devuelve la misma sin sumar dos veces

### btn-cerrar
- Texto/label: Cerrar
- Icono: nada
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.
- Cambios: ninguno respecto de default.

### loading
- Aplica: Sí
- Mensaje: Marcando…
- Cambios:
  - btn-marcar: variant="disabled", content="Marcando…" (state_override)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos marcar el desafío como completado. Probá de nuevo.
- Cambios:
  - alerta-sistema: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- btn-marcar · on click → `POST /api/games/{juego}/today/acknowledge-void` con `challenge_number`; con `200` crea la Play `voided` (idempotente), actualiza las rachas del header y navega a `{juego}-resultado` en estado `anulado`
- respuesta `409 challenge_expired` → recarga el desafío de hoy; `409 not_voided` → cierra y refresca; red o 5xx → `error de sistema`; `401 no_session` → recrea la sesión y reintenta una vez
- btn-cerrar · on click → cierra; la tarjeta sigue «anulado»

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Sin feedback propio más allá de la navegación.

## Accesibilidad

- **Orden de foco:** texto → btn-marcar → btn-cerrar.
- **Landmarks y jerarquía:** Rol `alertdialog`.
- **Foco y teclado:** Atrapa el foco; Esc cierra; devuelve el foco al disparador.
- **Propio de esta composición:** El texto de racha protegida se lee primero.

## Decisiones y descartes

**Decisiones tomadas:**
- Una sola acción primaria: marcar; cerrar es secundaria y no pierde nada porque se puede marcar luego, el mismo día.
- El doble toque no duplica la Play (C-42).
- REQ-007: «Marcar como completado» solo se ofrece a quien no tiene Play; quien ya jugó (Play `voided` al anular) ve directamente el resultado anulado, porque `GameToday` devuelve su Play (decisión 5 del diseño técnico).
- REQ-007: se suma `aviso-racha` para explicar qué cuenta y qué no (el jugador decide marcar sabiendo que no suma partidas ganadas).
- REQ-007, Design System: el modal se compone con `panel` + `button` igual que O-04 (`grep-grid.surrender-dialog`); el DS no tiene componente de modal.

**Alternativas descartadas:**
- Marcar automáticamente al abrir: el jugador debe decidir (C-42).

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-41, C-42, C-05 · REQ-007 (RF 9, 10; CA 24-28) · flujo 3 de `user-flows.md`.
