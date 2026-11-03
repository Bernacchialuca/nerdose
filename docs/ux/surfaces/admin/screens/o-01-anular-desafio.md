---
name: o-01-anular-desafio
surface: admin
route: (overlay de `reportes` y `o-02-detalle-desafio`)
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
triggered_by: reportes
---

# Pantalla: O-01 · Anular desafío

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Anular un desafío `published` con motivo y culpable, mostrando antes las consecuencias irreversibles.
- **Viewports:**
  - **desktop** — Modal centrado (6/12) sobre la pantalla de origen. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- `reportes` · acción «Anular» del grupo
- `o-02-detalle-desafio` · «Anular»

**Salidas user-driven:**
- A `reportes` · «Anular desafío» (el grupo sale de la cola de abiertos)
- A `o-02-detalle-desafio` · «Cancelar»

**Salidas automáticas:**
- A `login` · `401` por token vencido (borra el token).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Título del overlay |
| 2 | desafio | paragraph | body | content | desktop | — | Desafío afectado |
| 3 | campo-motivo | textarea | — | input | desktop | state_overrides: error de validación | `void_reason` (obligatorio) |
| 4 | error-motivo | alert | error | feedback | desktop | visible_only_in_states: error de validación | Falta `void_reason` |
| 5 | campo-culpable | dropdown | state=closed | input | desktop | state_overrides: culpable abierto | Culpable `kind` |
| 6 | campo-id | text-input | state=default | input | desktop | state_overrides: error de validación | `id` del culpable (obligatorio si es término o hecho) |
| 7 | resumen | alert | warning | feedback | desktop | — | Consecuencias irreversibles previas a confirmar |
| 8 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla al confirmar |
| 9 | btn-anular | button | variant=error | input | desktop | state_overrides: loading | Confirma la anulación |
| 10 | btn-cancelar | button | variant=tertiary | input | desktop | — | Cierra sin anular |

## Layout por viewport

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía)
  - col 6/12:
    - desafio
    - campo-motivo
    - error-motivo
    - campo-culpable
    - campo-id
    - resumen
    - alerta-sistema
    - btn-anular
    - btn-cancelar
  - col 3/12: (vacía)

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: Anular desafío
- Icono: close
- Annotation: nada

### desafio
- Texto/label: Devdle #128 · publicado
- Icono: nada
- Annotation: nada

### campo-motivo
- Texto/label: Motivo de la anulación
- Icono: nada
- Annotation: obligatorio

### error-motivo
- Texto/label: Contá por qué se anula el desafío.
- Icono: nada
- Annotation: nada

### campo-culpable
- Texto/label: Culpable del error
- Icono: nada
- Annotation: nada

### campo-id
- Texto/label: ID del término o del hecho
- Icono: nada
- Annotation: solo se pide si el culpable es Término o Hecho de timeline
- Mensaje de error: Indicá el ID del culpable.

### resumen
- Texto/label: Esto no se puede deshacer: el desafío deja de aceptar jugadas, las partidas pasan a anuladas, los reportes abiertos se resuelven, el término o hecho culpable se rechaza y se recalculan las rachas.
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos anular el desafío. Recargá Reportes y verificá su estado antes de reintentar.
- Icono: nada
- Annotation: nada

### btn-anular
- Texto/label: Anular desafío
- Icono: warning
- Annotation: nada

### btn-cancelar
- Texto/label: Cancelar
- Icono: nada
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Formulario con resumen de consecuencias.
- Cambios:
  - ninguno respecto de default.

### culpable abierto
- Aplica: Sí
- Mensaje: Lista de culpables desplegada.
- Cambios:
  - campo-culpable: state="open".

### error de validación
- Aplica: Sí
- Mensaje: Contá por qué se anula el desafío. / Indicá el ID del culpable.
- Cambios:
  - error-motivo: visible solo acá.
  - campo-id: state="error", error_msg="Indicá el ID del culpable."

### loading
- Aplica: Sí
- Mensaje: Anulando…
- Cambios:
  - btn-anular: variant="disabled", content="Anulando…".

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos anular el desafío. Recargá Reportes y verificá su estado antes de reintentar.
- Cambios:
  - alerta-sistema: visible solo acá; no se reenvía solo (la anulación es irreversible).

## Interacciones

**Eventos:**
- btn-anular · on click → `POST /api/admin/challenges/{id}/void`; con éxito cierra y refresca `reportes`
- btn-cancelar · on click → vuelve al detalle
- campo-culpable · on change → muestra u oculta campo-id

**Validaciones:**
- `void_reason` obligatorio.
- `id` obligatorio si el culpable es término o hecho.
- Solo se abre si el desafío está `published` (C-41).

**Feedback:**
- El resumen de consecuencias es parte obligatoria antes de confirmar (benchmark: Django admin, a evitar).
- Ante falla de red no reintenta solo.

## Accesibilidad

- **Orden de foco:** campo-motivo → campo-culpable → campo-id → btn-anular → btn-cancelar.
- **Foco y teclado:** rol `dialog`; atrapa el foco, Esc cierra y devuelve el foco al disparador.

## Decisiones y descartes

**Decisiones tomadas:**
- El botón destructivo usa variante `error` y el resumen de consecuencias va justo encima.
- El foco inicial cae en el motivo, no en el botón destructivo.

**Alternativas descartadas:**
- Casilla «Entiendo que es irreversible»: el resumen explícito alcanza; el PRD no pide confirmación extra.

**Preguntas abiertas:**
- ¿Qué se conserva si la sesión vence con el formulario abierto? (pregunta 3 del product-map).

## Trazabilidad

- C-41 · flujo 2 de `user-flows.md`.
