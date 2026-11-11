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
version: "1.1"
date: 2026-11-11
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
- `o-02-detalle-desafio` · «Anular desafío»

**Salidas user-driven:**
- A `reportes` · «Anular desafío» con éxito (el grupo sale de la cola de abiertos y aparece el aviso de anulación confirmada)
- A la pantalla de origen · «Cancelar», ícono de cierre o Escape

**Salidas automáticas:**
- A `login` · `401 unauthorized` (borra el token; el motivo escrito se pierde).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Título del overlay |
| 2 | desafio | paragraph | body | content | desktop | — | Desafío afectado |
| 3 | campo-motivo | textarea | — | input | desktop | state_overrides: error de validación | `void_reason` (obligatorio) |
| 4 | campo-culpable | dropdown | state=closed | input | desktop | state_overrides: culpable abierto, error de validación | Culpable: un ítem del desafío, la plantilla o ninguno |
| 5 | resumen | alert | warning | feedback | desktop | state_overrides: culpable sin ítem | Consecuencias irreversibles previas a confirmar |
| 6 | alerta-conflicto | alert | warning | feedback | desktop | visible_only_in_states: no anulable, culpable inválido; state_overrides: culpable inválido | El desafío ya no se puede anular o el culpable no corresponde |
| 7 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla al confirmar |
| 8 | btn-cancelar | button | variant=tertiary | input | desktop | — | Cierra sin anular |
| 9 | btn-anular | button | variant=error | input | desktop | state_overrides: loading, no anulable | Confirma la anulación |

## Layout por viewport

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía)
  - col 6/12:
    - desafio
    - campo-motivo
    - campo-culpable
    - resumen
    - alerta-conflicto
    - alerta-sistema
    - row `acciones` (col 6/12: btn-cancelar · col 6/12: btn-anular)
  - col 3/12: (vacía)

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: Anular desafío
- Icono: close
- Annotation: `h2` del `dialog`

### desafio
- Texto/label: Devdle #8 · 2026-11-08 · publicado
- Icono: nada
- Annotation: nada

### campo-motivo
- Texto/label: Motivo de la anulación
- Icono: nada
- Annotation: obligatorio, hasta 500 caracteres; se guarda en el desafío y como motivo de rechazo del término o hecho culpable. Placeholder: «Ej.: definición incorrecta»
- Mensaje de error: Contá por qué se anula el desafío.

### campo-culpable
- Texto/label: Culpable del error
- Opciones: Término · REDIS · La plantilla del juego · Ninguno (no se identifica un culpable)
- Icono: nada
- Annotation: obligatorio, sin opción preseleccionada. Los ítems salen de `culprits` del desafío, con su nombre: Devdle ofrece 1 término, Grep Grid sus 8 términos y Tech Timeline sus 5 hechos («Hecho · Lanzamiento de Docker»). No se tipea ningún id
- Mensaje de error: Elegí el culpable del error.

### resumen
- Texto/label: Esto no se puede deshacer. Devdle #8 deja de aceptar jugadas y todas sus partidas pasan a anuladas (las terminadas conservan su resultado); los jugadores conservan su racha. Los reportes abiertos se resuelven. El término REDIS queda rechazado y no vuelve a usarse. Se recalculan las estadísticas de los jugadores afectados.
- Icono: warning
- Annotation: la frase del culpable cambia con la opción elegida. Nota al pie: «Los desafíos ya generados de los próximos días que usen REDIS no cambian.» (riesgo aceptado, se revisan en Próximos con FG-7)

### alerta-conflicto
- Texto/label: Este desafío ya no se puede anular: ya está anulado o no está publicado. Cerrá y revisá su estado en Reportes.
- Icono: nada
- Annotation: `409 not_voidable`. Con `422 invalid_culprit`: «El culpable elegido no corresponde a este desafío. Elegí otro.»

### alerta-sistema
- Texto/label: No pudimos anular el desafío. No se aplicó ningún cambio: recargá Reportes y verificá su estado antes de reintentar.
- Icono: nada
- Annotation: la anulación es atómica (CA 23): ante un error, el desafío sigue publicado

### btn-cancelar
- Texto/label: Cancelar
- Icono: nada
- Annotation: nada

### btn-anular
- Texto/label: Anular desafío
- Icono: warning
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Formulario con resumen de consecuencias.
- Cambios:
  - ninguno respecto de default.

### culpable abierto
- Aplica: Sí (sub-estado de default)
- Mensaje: Lista de culpables desplegada.
- Cambios:
  - campo-culpable: state="open".

### culpable sin ítem
- Aplica: Sí (sub-estado de default)
- Mensaje: Culpable «La plantilla del juego» o «Ninguno».
- Cambios:
  - resumen: content="Esto no se puede deshacer. Devdle #8 deja de aceptar jugadas y todas sus partidas pasan a anuladas (las terminadas conservan su resultado); los jugadores conservan su racha. Los reportes abiertos se resuelven. Ningún término ni hecho cambia de estado. Se recalculan las estadísticas de los jugadores afectados."

### error de validación
- Aplica: Sí
- Mensaje: Contá por qué se anula el desafío. / Elegí el culpable del error.
- Cambios:
  - campo-motivo: state="error", error_msg="Contá por qué se anula el desafío."
  - campo-culpable: state="error", error_msg="Elegí el culpable del error."

### loading
- Aplica: Sí
- Mensaje: Anulando…
- Cambios:
  - btn-anular: variant="disabled", content="Anulando…".
  - btn-cancelar: deshabilitado; Escape no cierra mientras se anula.

### no anulable
- Aplica: Sí
- Mensaje: Este desafío ya no se puede anular: ya está anulado o no está publicado.
- Cambios:
  - alerta-conflicto: visible solo acá.
  - btn-anular: variant="disabled".

### culpable inválido
- Aplica: Sí
- Mensaje: El culpable elegido no corresponde a este desafío. Elegí otro.
- Cambios:
  - alerta-conflicto: content="El culpable elegido no corresponde a este desafío. Elegí otro."

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos anular el desafío. No se aplicó ningún cambio: recargá Reportes y verificá su estado antes de reintentar.
- Cambios:
  - alerta-sistema: visible solo acá; no se reenvía solo.

## Interacciones

**Eventos:**
- campo-culpable · on change → actualiza la frase del culpable en el resumen
- btn-anular · on click → `POST /api/admin/challenges/{id}/void` con `void_reason` y `culprit` (`{ kind: term | timeline_fact, id }`, `template` o `none`); con `200` cierra, recarga `reportes` y muestra «Devdle #8 anulado · N partidas afectadas»
- respuesta `409 not_voidable` → estado `no anulable`; `422 invalid_culprit` → `culpable inválido`; `422 validation_error` → `error de validación`; red o 5xx → `error de sistema`; `404 not_found` → cierra y recarga
- btn-cancelar · on click → vuelve a la pantalla de origen

**Validaciones:**
- `void_reason` obligatorio (sin contar espacios), hasta 500 caracteres.
- Culpable obligatorio; solo se ofrecen los ítems del propio desafío.
- Solo se abre si el desafío está `published` (C-41).

**Feedback:**
- El resumen de consecuencias es parte obligatoria antes de confirmar (benchmark: Django admin, a evitar).
- Ante falla de red no reintenta solo.

## Accesibilidad

- **Orden de foco:** campo-motivo → campo-culpable → btn-cancelar → btn-anular.
- **Landmarks y jerarquía:** rol `dialog` con `aria-modal="true"`; el resumen está referenciado por `aria-describedby` del botón destructivo.
- **Foco y teclado:** atrapa el foco; Esc cierra (salvo en `loading`) y devuelve el foco al disparador.

## Decisiones y descartes

**Decisiones tomadas:**
- El botón destructivo usa variante `error` y el resumen de consecuencias va justo encima.
- El foco inicial cae en el motivo, no en el botón destructivo.
- REQ-007: el culpable se elige de una lista con los ítems del propio desafío (`culprits`, decisión 3 del diseño técnico) en lugar de tipear un id: un id mal tipeado rechazaría un término equivocado sin vuelta atrás. Se quita `campo-id`.
- REQ-007: el resumen nombra el ítem que se va a rechazar y avisa que los desafíos ya generados que lo usen no cambian (riesgo aceptado del request).
- REQ-007: `not_voidable` e `invalid_culprit` tienen su propio aviso, distinto del error de sistema, porque piden acciones distintas (revisar el estado o elegir otro culpable).

**Alternativas descartadas:**
- Casilla «Entiendo que es irreversible»: el resumen explícito alcanza; el PRD no pide confirmación extra.
- Campo de texto para el id del culpable: propenso a error y obliga a buscar el id fuera del admin.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla. Si la sesión vence con el formulario abierto, el motivo se pierde (pregunta 3 del product-map, resuelta por REQ-007).

## Trazabilidad

- C-41 · REQ-007 (RF 8; CA 17, 19-23) · flujo 2 de `user-flows.md`.
