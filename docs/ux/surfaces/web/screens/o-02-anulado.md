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
version: "1.0"
date: 2026-11-03
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
- `*-instrucciones` · estado «anulado»

**Salidas user-driven:**
- A `{juego}-resultado` (estado anulado) · «Marcar como completado»
- Cierra y vuelve a la pantalla de origen · «Cerrar»

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Título del overlay y cierre |
| 2 | texto | paragraph | body | content | ambos | — | Mensaje de anulación |
| 3 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Falla al crear la Play voided |
| 4 | btn-marcar | button | primary | input | ambos | state_overrides: loading | Crea la Play voided y suma la racha (C-42) |
| 5 | btn-cerrar | button | tertiary | input | ambos | — | Cierra sin marcar |

## Layout por viewport

### mobile · 400px
- texto
- alerta-sistema
- btn-marcar
- btn-cerrar

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía, margen)
  - col 6/12: texto, alerta-sistema, btn-marcar, btn-cerrar
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

### alerta-sistema
- Texto/label: No pudimos marcar el desafío como completado. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-marcar
- Texto/label: Marcar como completado
- Icono: check
- Annotation: nada

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
- btn-marcar · on click → crea la Play `voided` (idempotente) y navega al resultado
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

**Alternativas descartadas:**
- Marcar automáticamente al abrir: el jugador debe decidir (C-42).

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-41, C-42, C-05 · flujo 3 de `user-flows.md`.
