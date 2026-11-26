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
version: "1.2"
date: 2026-11-25
overlay: true
overlay_type: modal
triggered_by: o-02-detalle-desafio
---

# Pantalla: O-03 · Regenerar desafío

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Confirmar el pedido de regeneración de un desafío aprobado con fecha futura, sabiendo que se atiende en segundo plano y que el actual sigue vigente hasta el reemplazo.
- **Viewports:**
  - **desktop** — Modal centrado (6/12). (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- `o-02-detalle-desafio` · «Regenerar» (abierto desde una celda de `proximos-desafios`). Desde REQ-012 la celda ya no tiene «Regenerar»: este es el único camino

**Salidas user-driven:**
- A `o-02-detalle-desafio`, que sigue abierto · «Regenerar» (el detalle y la celda pasan a «regeneración pendiente») o «Cancelar»; el foco vuelve a «Regenerar» / «Regenerando…» del detalle

**Salidas automáticas:**
- A `login` · `401` por token vencido (borra el token).
- A `proximos-desafios` · `404 not_found` (el desafío ya no existe): cierra y refresca la grilla.

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
- Texto/label: Se pedirá un reemplazo para Grep Grid #35 (2026-12-05). El generador lo prepara en segundo plano: si pasa la verificación reemplaza al actual; si no, queda el actual. Si llega la fecha antes, se publica el actual sin cambios.
- Icono: nada
- Annotation: nada

### alerta-no-disponible
- Texto/label: Solo se puede regenerar un desafío aprobado de una fecha futura. Refrescá Próximos.
- Icono: nada
- Annotation: respuesta `409 not_regenerable` (el desafío se publicó, se anuló, se rechazó o su fecha ya no es futura)

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
- Mensaje: Solo se puede regenerar un desafío aprobado de una fecha futura. Refrescá Próximos.
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
- btn-regenerar · on click → `POST /api/admin/challenges/{id}/regenerate`; con `202` cierra, el detalle (que sigue abierto) y la celda pasan a pendiente y Próximos inicia el polling. Si ya había un pedido pendiente, la respuesta es ese mismo pedido: no se crea otro (idempotente)
- respuesta `409 not_regenerable` → estado `no disponible`
- respuesta `404 not_found` → cierra el modal y el detalle, sin mensaje, y refresca Próximos
- btn-cancelar · on click (o Esc) → cierra sin cambios y devuelve el foco al «Regenerar» del detalle

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
- REQ-008: el texto avisa que el pedido es asíncrono y que, si llega la fecha antes del reemplazo, se publica el actual (CA 7).
- REQ-008: repetir el pedido no duplica nada (CA 4), por eso no hace falta un estado propio para «ya pendiente»: el detalle muestra «Regenerando…» deshabilitado y, si se cuela un doble clic, la API devuelve el pedido existente.
- REQ-012 (S-068, implementado fuera del workflow): O-03 solo se abre desde el detalle; al cerrarse, el foco vuelve al detalle y no a la grilla.
- REQ-008: el mensaje de `not_regenerable` es el del diseño técnico («solo se puede regenerar un desafío aprobado de una fecha futura»).

**Alternativas descartadas:**
- Regenerar sin confirmar: consume generación (costo), se confirma siempre.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-44 · REQ-008 (RF 3, 5; CA 3-5, 7) · REQ-012 (S-068) · flujo 4 de `user-flows.md`.
