---
name: o-03-regenerar-desafio
surface: admin
route: (overlay de `proximos-desafios` y `o-02-detalle-desafio`)
viewports:
  - desktop
audiences:
  - responsable
fidelity: mid
status: diseñada
version: "1.0"
date: 2026-11-03
overlay: true
overlay_type: modal
triggered_by: proximos-desafios
---

# Pantalla: O-03 · Regenerar desafío

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Confirmar el pedido de regeneración de un desafío aprobado con fecha futura.
- **Viewports:**
  - **desktop** — Modal centrado (6/12). (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- `proximos-desafios` · acción «Regenerar» de la celda
- `o-02-detalle-desafio` · «Regenerar»

**Salidas user-driven:**
- A `proximos-desafios` · «Regenerar» (la celda pasa a «regeneración pendiente») o «Cancelar»

**Salidas automáticas:**
- A `login` · `401` por token vencido (borra el token).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Título del overlay |
| 2 | texto | paragraph | body | content | desktop | — | Qué se pide |
| 3 | alerta-no-disponible | alert | warning | feedback | desktop | visible_only_in_states: no disponible | El desafío ya no admite regeneración |
| 4 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla al pedir la regeneración |
| 5 | btn-regenerar | button | variant=primary | input | desktop | state_overrides: loading, no disponible | Confirma el pedido |
| 6 | btn-cancelar | button | variant=tertiary | input | desktop | — | Cierra sin regenerar |

## Layout por viewport

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía)
  - col 6/12:
    - texto
    - alerta-no-disponible
    - alerta-sistema
    - btn-regenerar
    - btn-cancelar
  - col 3/12: (vacía)

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: Regenerar desafío
- Icono: close
- Annotation: nada

### texto
- Texto/label: Se generará un reemplazo para Tech Timeline #134 (2026-11-07). Si pasa la verificación, el actual se rechaza; si falla, queda el actual.
- Icono: nada
- Annotation: nada

### alerta-no-disponible
- Texto/label: Este desafío ya no se puede regenerar: dejó de estar aprobado o su fecha ya no es futura. Refrescá Próximos.
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos pedir la regeneración. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-regenerar
- Texto/label: Regenerar
- Icono: refresh
- Annotation: nada

### btn-cancelar
- Texto/label: Cancelar
- Icono: nada
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Confirmación del pedido de regeneración.
- Cambios:
  - ninguno respecto de default.

### loading
- Aplica: Sí
- Mensaje: Pidiendo…
- Cambios:
  - btn-regenerar: variant="disabled", content="Pidiendo…".

### no disponible
- Aplica: Sí
- Mensaje: Este desafío ya no se puede regenerar: dejó de estar aprobado o su fecha ya no es futura. Refrescá Próximos.
- Cambios:
  - alerta-no-disponible: visible solo acá.
  - btn-regenerar: variant="disabled".

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos pedir la regeneración. Probá de nuevo.
- Cambios:
  - alerta-sistema: visible solo acá.

## Interacciones

**Eventos:**
- btn-regenerar · on click → `POST /api/admin/challenges/{id}/regenerate`; cierra y marca la celda como pendiente
- btn-cancelar · on click → cierra sin cambios

**Validaciones:**
- Solo `approved` con fecha posterior a hoy (C-44); si no se cumple, no se confirma y se explica por qué.

**Feedback:**
- Al confirmar, `proximos-desafios` inicia el polling hasta que el reemplazo pasa la verificación o falla.

## Accesibilidad

- **Orden de foco:** texto → btn-regenerar → btn-cancelar.
- **Foco y teclado:** rol `dialog`; atrapa el foco, Esc cierra.

## Decisiones y descartes

**Decisiones tomadas:**
- La acción no es destructiva (el actual queda si el reemplazo falla), por eso el botón es primario y no `error`.

**Alternativas descartadas:**
- Regenerar sin confirmar: consume generación (costo), se confirma siempre.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-44 · flujo 4 de `user-flows.md`.
