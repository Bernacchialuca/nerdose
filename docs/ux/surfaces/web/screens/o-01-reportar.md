---
name: o-01-reportar
surface: web
route: (overlay de `*-partida` y `*-resultado`)
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
overlay_type: bottom-sheet
triggered_by: devdle-partida
---

# Pantalla: O-01 · Reportar un problema

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Avisar que un desafío está mal (motivo + mensaje opcional) sin revelar la respuesta; un reporte por jugador y desafío. El jugador no necesita terminar la partida para reportar.
- **Viewports:**
  - **mobile** — bottom-sheet desde el borde inferior, con el pulgar sobre «Enviar reporte».
  - **desktop** — modal centrado (6/12): no hay espacio fijo para un formulario en las pantallas de partida.

## Entrada y salida

**Entradas:**
- `*-partida` · link-reportar (estado «desde partida», con el aviso de spoilers)
- `*-resultado` · link-reportar, también en el estado `anulado` (C-36 acepta desafíos `voided`)

**Salidas user-driven:**
- Cierra y vuelve a la pantalla de origen · «Cancelar», ícono de cierre, Escape o «Cerrar» tras el éxito. La partida sigue exactamente donde estaba

**Salidas automáticas:**
- Ninguna: tras el envío el overlay queda abierto con la confirmación hasta que el jugador lo cierra. Al cerrarse, el disparador de la pantalla de origen pasa a «Ya reportaste este desafío».

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Título del overlay y cierre |
| 2 | aviso-partida | alert | warning | feedback | ambos | visible_only_in_states: desde partida | Aviso de spoilers, solo desde una partida |
| 3 | dd-motivo | dropdown | closed | input | ambos | hidden_in_states: success, ya reportado; state_overrides: motivo abierto, error de validación | Motivo (6 valores de `reason`) |
| 4 | txt-mensaje | textarea | — | input | ambos | hidden_in_states: success, ya reportado; state_overrides: mensaje largo | Mensaje opcional, hasta 1000 caracteres |
| 5 | contador | paragraph | caption | feedback | ambos | hidden_in_states: success, ya reportado; state_overrides: mensaje largo | Caracteres usados sobre 1000 |
| 6 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema, límite de reportes; state_overrides: límite de reportes | Falla de red, servidor o límite de envíos |
| 7 | alerta-exito | alert | success | feedback | ambos | visible_only_in_states: success, ya reportado; state_overrides: ya reportado | Confirmación del envío |
| 8 | btn-enviar | button | primary | input | ambos | hidden_in_states: success, ya reportado; state_overrides: loading | Envía el reporte |
| 9 | btn-cancelar | button | tertiary | input | ambos | state_overrides: success, ya reportado | Cierra sin enviar; tras el envío pasa a «Cerrar» |
| 10 | footer | footer | — | layout | ambos | — | Regla de un reporte por desafío |

## Layout por viewport

### mobile · 400px
- aviso-partida
- dd-motivo
- txt-mensaje
- contador
- alerta-sistema
- alerta-exito
- btn-enviar
- btn-cancelar

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía, margen)
  - col 6/12: aviso-partida, dd-motivo, txt-mensaje, contador, alerta-sistema, alerta-exito, row `acciones` (col 6/12: btn-cancelar · col 6/12: btn-enviar)
  - col 3/12: (vacía, margen)

## Contenido

### header
- Texto/label: Reportar un problema
- Icono: close
- Annotation: `h2` del `dialog`; muestra debajo «Devdle #8» (juego y número del desafío que se reporta)

### aviso-partida
- Texto/label: No incluyas la respuesta si todavía estás jugando.
- Icono: warning
- Annotation: `banner` `warning` del DS (el `alert` del DS es solo de error)

### dd-motivo
- Texto/label: Elegí un motivo
- Opciones: La respuesta es incorrecta · Es ambiguo · La explicación es incorrecta · Problema de traducción · Error de visualización · Otro
- Icono: nada
- Annotation: `select` nativo con label visible (decisión 13 del diseño técnico), sin opción preseleccionada. Se envía `wrong_answer`, `ambiguous`, `wrong_explanation`, `translation`, `display_bug` u `other`
- Mensaje de error: Elegí un motivo para enviar el reporte.

### txt-mensaje
- Texto/label: Contanos qué pasa (opcional)
- Icono: nada
- Annotation: `maxlength=1000`; el texto se envía tal cual (sin formato). Placeholder: «Ej.: la definición no corresponde a la palabra»
- Mensaje de error: El mensaje puede tener hasta 1000 caracteres.

### contador
- Texto/label: 0 / 1000
- Icono: nada
- Annotation: se actualiza al escribir; se anuncia con `aria-live="polite"` solo al pasar de 900

### alerta-sistema
- Texto/label: No pudimos enviar el reporte. Probá de nuevo.
- Icono: nada
- Annotation: `alert` `error` del DS. El formulario conserva el motivo y el mensaje para reintentar

### alerta-exito
- Texto/label: Gracias, recibimos tu reporte.
- Icono: check
- Annotation: `banner` `success` del DS sin acción. Subtítulo: «Lo vamos a revisar. Si el desafío tenía un error, se anula y tu racha no se ve afectada.»

### btn-enviar
- Texto/label: Enviar reporte
- Icono: check
- Annotation: nada

### btn-cancelar
- Texto/label: Cancelar
- Icono: nada
- Annotation: nada

### footer
- Texto/label: Un reporte por jugador y desafío
- Icono: nada
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Formulario desde un resultado: motivo y mensaje opcional.
- Cambios: ninguno respecto de default.

### desde partida
- Aplica: Sí (sub-estado de default)
- Mensaje: No incluyas la respuesta si todavía estás jugando.
- Cambios:
  - aviso-partida: solo visible en este estado (visible_only_in_states)

### motivo abierto
- Aplica: Sí (sub-estado de default)
- Mensaje: Se despliegan los 6 motivos.
- Cambios:
  - dd-motivo: state="open" (state_override)

### mensaje largo
- Aplica: Sí (sub-estado de default)
- Mensaje: El mensaje puede tener hasta 1000 caracteres.
- Cambios:
  - contador: content="1000 / 1000" (state_override)
  - txt-mensaje: state="error", error_msg="El mensaje puede tener hasta 1000 caracteres." (state_override; también ante `422 invalid_report`)

### loading
- Aplica: Sí
- Mensaje: Enviando…
- Cambios:
  - btn-enviar: variant="disabled", content="Enviando…" (state_override)

### error de validación
- Aplica: Sí
- Mensaje: Elegí un motivo para enviar el reporte.
- Cambios:
  - dd-motivo: state="error", error_msg="Elegí un motivo para enviar el reporte." (state_override)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos enviar el reporte. Probá de nuevo.
- Cambios:
  - alerta-sistema: solo visible en este estado (visible_only_in_states)

### límite de reportes
- Aplica: Sí
- Mensaje: Se enviaron muchos reportes desde esta conexión. Probá de nuevo más tarde.
- Cambios:
  - alerta-sistema: content="Se enviaron muchos reportes desde esta conexión. Probá de nuevo más tarde." (state_override; `429`, 10 por IP por hora)

### success
- Aplica: Sí
- Mensaje: Gracias, recibimos tu reporte.
- Cambios:
  - alerta-exito: solo visible en este estado (visible_only_in_states)
  - dd-motivo, txt-mensaje, contador y btn-enviar: ocultos en este estado (hidden_in_states)
  - btn-cancelar: content="Cerrar" (state_override)

### ya reportado
- Aplica: Sí
- Mensaje: Ya reportaste este desafío. Lo vamos a revisar.
- Cambios:
  - alerta-exito: content="Ya reportaste este desafío. Lo vamos a revisar." (state_override; respuesta `409 already_reported`, por ejemplo desde otra pestaña)
  - dd-motivo, txt-mensaje, contador y btn-enviar: ocultos en este estado (hidden_in_states)
  - btn-cancelar: content="Cerrar" (state_override)

## Interacciones

**Eventos:**
- dd-motivo · on change → elige el motivo y limpia el error de validación
- txt-mensaje · on input → actualiza el contador
- btn-enviar · on click → `POST /api/games/{juego}/today/report` con `challenge_number`, `reason` y `message`; el contexto (idioma, estado de la partida, user agent) lo arma el servidor
- respuesta `201` → estado `success`; `409 already_reported` → estado `ya reportado`; `422 invalid_report` → marca el campo; `429` → `límite de reportes`; red o 5xx → `error de sistema`; `401 no_session` → recrea la sesión y reintenta una vez sin intervención
- btn-cancelar · on click → cierra; tras `success` o `ya reportado` el disparador queda en «Ya reportaste este desafío»

**Validaciones:**
- dd-motivo · vacío al enviar → «Elegí un motivo para enviar el reporte.»
- txt-mensaje · el campo no acepta más de 1000 caracteres; el contador lo muestra

**Feedback:**
- Éxito: «Gracias, recibimos tu reporte.» dentro del overlay. Al cerrarlo, el disparador pasa a «Ya reportaste este desafío». La partida y las rachas no cambian (CA 3).

## Accesibilidad

- **Orden de foco:** dd-motivo → txt-mensaje → btn-cancelar → btn-enviar (desktop) · btn-enviar → btn-cancelar (mobile, en orden visual).
- **Landmarks y jerarquía:** Rol `dialog` con `aria-modal="true"` y título «Reportar un problema»; el aviso de spoilers está referenciado por `aria-describedby`.
- **Foco y teclado:** El foco inicial cae en el motivo; atrapa el foco; Esc cierra salvo en `loading`; al cerrar devuelve el foco a `link-reportar`. El contenido de la pantalla de origen queda `inert`.
- **Propio de esta composición:** El aviso de spoilers se lee antes del formulario. La confirmación se anuncia con `role=status`.

## Decisiones y descartes

**Decisiones tomadas:**
- bottom-sheet en mobile y modal en desktop (mismo contenido): el overlay no se vuelve inline en desktop.
- Disponible solo con Challenge `published` o `voided`.
- REQ-007: el motivo es un `select` nativo (decisión 13 del diseño técnico): accesible en mobile sin un componente de lista propio. El mensaje es opcional y el contador está siempre visible, para que el límite no aparezca recién como error.
- REQ-007: la confirmación queda dentro del overlay hasta que el jugador lo cierra, en vez de cerrarse sola: así se lee el «gracias» y el jugador sabe qué pasa con su racha. `already_reported` se trata como confirmación, no como error, porque el reporte existe.
- REQ-007: el jugador puede reportar el desafío del día anterior si sigue en el resultado después de las 00:00 UTC (resuelve el «cambio de día con O-01 abierto» de `user-flows.md`): el reporte lleva `challenge_number` y la API acepta desafíos pasados `published` o `voided`.
- REQ-007, Design System: el overlay se compone con `panel` + `button`, igual que O-04 (`grep-grid.surrender-dialog`), y en mobile el mismo panel se ancla al borde inferior. El aviso de spoilers y la confirmación usan `banner` (`warning` / `success`), porque el `alert` del DS es solo de error. El `select` y el `textarea` no tienen componente en el DS y se resuelven con los tokens de control (gap anotado en REQ-007).

**Alternativas descartadas:**
- Reporte en pantalla propia: interrumpe la partida.
- Motivos como 6 botones de radio a la vista: ocupan media pantalla en mobile sobre la partida, y el diseño técnico fija un `select`.
- Cerrar el overlay solo tras el éxito: el «gracias» se pierde y el cambio del disparador pasa desapercibido.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-36, C-37, F-10 · REQ-007 (RF 1-3; CA 1-3, 7, 9, 30) · flujo 4 de `user-flows.md`.
