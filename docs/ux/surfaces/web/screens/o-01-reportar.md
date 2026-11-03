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
version: "1.0"
date: 2026-11-03
overlay: true
overlay_type: bottom-sheet
triggered_by: devdle-partida
---

# Pantalla: O-01 · Reportar un problema

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Avisar que un desafío está mal (motivo + mensaje opcional) sin revelar la respuesta; un reporte por jugador y desafío.
- **Viewports:**
  - **mobile** — bottom-sheet desde el borde inferior, con el pulgar sobre «Enviar reporte».
  - **desktop** — modal centrado (6/12): no hay espacio fijo para un formulario en las pantallas de partida.

## Entrada y salida

**Entradas:**
- `*-partida` · link-reportar
- `*-resultado` · link-reportar

**Salidas user-driven:**
- Cierra y vuelve a la pantalla de origen · «Cancelar», cierre o éxito

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Título del overlay y cierre |
| 2 | aviso-partida | alert | warning | feedback | ambos | visible_only_in_states: desde partida | Aviso de spoilers, solo desde una partida |
| 3 | dd-motivo | dropdown | closed | input | ambos | state_overrides: motivo abierto | Motivo (6 valores de reason) |
| 4 | txt-mensaje | textarea | — | input | ambos | — | Mensaje opcional |
| 5 | alerta-validacion | alert | error | feedback | ambos | visible_only_in_states: error de validación | Falta el motivo |
| 6 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Falla de red o servidor |
| 7 | alerta-exito | alert | success | feedback | ambos | visible_only_in_states: success | Confirmación del envío |
| 8 | btn-enviar | button | primary | input | ambos | hidden_in_states: success; state_overrides: loading | Envía el reporte |
| 9 | btn-cancelar | button | tertiary | input | ambos | — | Cierra sin enviar |
| 10 | footer | footer | — | layout | ambos | — | Regla de un reporte por desafío |

## Layout por viewport

### mobile · 400px
- aviso-partida
- dd-motivo
- txt-mensaje
- alerta-validacion
- alerta-sistema
- alerta-exito
- btn-enviar
- btn-cancelar

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía, margen)
  - col 6/12: aviso-partida, dd-motivo, txt-mensaje, alerta-validacion, alerta-sistema, alerta-exito, btn-enviar, btn-cancelar
  - col 3/12: (vacía, margen)

## Contenido

### header
- Texto/label: Reportar un problema
- Icono: close
- Annotation: nada

### aviso-partida
- Texto/label: No incluyas la respuesta si todavía estás jugando.
- Icono: nada
- Annotation: nada

### dd-motivo
- Texto/label: Elegí un motivo
- Opciones: La respuesta es incorrecta · Es ambiguo · La explicación es incorrecta · Problema de traducción · Error de visualización · Otro
- Icono: nada
- Annotation: nada

### txt-mensaje
- Texto/label: Contanos qué pasa (opcional, máx. 1000 caracteres)
- Icono: nada
- Annotation: nada

### alerta-validacion
- Texto/label: Elegí un motivo para enviar el reporte.
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos enviar el reporte. Probá de nuevo.
- Icono: nada
- Annotation: nada

### alerta-exito
- Texto/label: Gracias, recibimos tu reporte.
- Icono: nada
- Annotation: nada

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

### loading
- Aplica: Sí
- Mensaje: Enviando…
- Cambios:
  - btn-enviar: variant="disabled", content="Enviando…" (state_override)

### error de validación
- Aplica: Sí
- Mensaje: Elegí un motivo para enviar el reporte.
- Cambios:
  - alerta-validacion: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos enviar el reporte. Probá de nuevo.
- Cambios:
  - alerta-sistema: solo visible en este estado (visible_only_in_states)

### success
- Aplica: Sí
- Mensaje: Gracias, recibimos tu reporte.
- Cambios:
  - alerta-exito: solo visible en este estado (visible_only_in_states)
  - btn-enviar: oculto en este estado (hidden_in_states)

## Interacciones

**Eventos:**
- dd-motivo · on click → abre/cierra la lista de motivos
- btn-enviar · on click → POST del reporte
- btn-cancelar · on click → cierra

**Validaciones:**
- dd-motivo · vacío al enviar → «Elegí un motivo para enviar el reporte.»
- txt-mensaje · más de 1000 caracteres → se corta y el contador lo muestra

**Feedback:**
- Éxito: «Gracias, recibimos tu reporte.» y se cierra; el disparador pasa a «Ya reportado».

## Accesibilidad

- **Orden de foco:** dd-motivo → txt-mensaje → btn-enviar → btn-cancelar.
- **Landmarks y jerarquía:** Rol `dialog` con título «Reportar un problema».
- **Foco y teclado:** Atrapa el foco; Esc cierra; al cerrar devuelve el foco a `link-reportar`.
- **Propio de esta composición:** El aviso de spoilers se lee antes del formulario.

## Decisiones y descartes

**Decisiones tomadas:**
- bottom-sheet en mobile y modal en desktop (mismo contenido): el overlay no se vuelve inline en desktop.
- Disponible solo con Challenge `published` o `voided`.

**Alternativas descartadas:**
- Reporte en pantalla propia: interrumpe la partida.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-37, F-10 · flujo 4 de `user-flows.md`.
