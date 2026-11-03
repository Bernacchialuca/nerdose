---
name: o-04-rendirse
surface: web
route: (overlay de `grep-grid-partida`)
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
triggered_by: grep-grid-partida
---

# Pantalla: O-04 · Confirmar «Rendirse»

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Confirmar que se cierra la partida como perdida con N/8, para evitar un toque accidental.
- **Viewports:**
  - **mobile** — modal a ancho casi completo.
  - **desktop** — modal centrado (6/12).

## Entrada y salida

**Entradas:**
- `grep-grid-partida` · btn-rendirse

**Salidas user-driven:**
- A `grep-grid-resultado` · «Sí, rendirme»
- Cierra y vuelve a la partida · «Seguir jugando»

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Título del overlay |
| 2 | texto | paragraph | body | content | ambos | — | Consecuencias de rendirse |
| 3 | btn-rendirme | button | error | input | ambos | — | Cierra la Play como perdida (C-20) |
| 4 | btn-seguir | button | secondary | input | ambos | — | Cierra el modal |

## Layout por viewport

### mobile · 400px
- texto
- btn-rendirme
- btn-seguir

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía, margen)
  - col 6/12: texto, btn-rendirme, btn-seguir
  - col 3/12: (vacía, margen)

## Contenido

### header
- Texto/label: ¿Rendirte?
- Icono: close
- Annotation: nada

### texto
- Texto/label: Vas a cerrar la partida con 3/8. Cuenta para tu racha y te mostramos las palabras que faltan. No se puede deshacer.
- Icono: nada
- Annotation: sugerencia fuera de PRD: a validar (pregunta 6 del product-map)

### btn-rendirme
- Texto/label: Sí, rendirme
- Icono: nada
- Annotation: nada

### btn-seguir
- Texto/label: Seguir jugando
- Icono: nada
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Vas a cerrar la partida con 3/8. Cuenta para tu racha y te mostramos las palabras que faltan. No se puede deshacer.
- Cambios: ninguno respecto de default.

## Interacciones

**Eventos:**
- btn-rendirme · on click → cierra la Play como `lost` con N/8
- btn-seguir · on click → cierra el modal

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Sin feedback propio más allá de la navegación.

## Accesibilidad

- **Orden de foco:** texto → btn-seguir → btn-rendirme (el destructivo al final).
- **Landmarks y jerarquía:** Rol `alertdialog`.
- **Foco y teclado:** Atrapa el foco; Esc equivale a «Seguir jugando».
- **Propio de esta composición:** El foco inicial va a «Seguir jugando».

## Decisiones y descartes

**Decisiones tomadas:**
- La acción destructiva no es el foco inicial.

**Alternativas descartadas:**
- Sin confirmación (botón directo): el riesgo recae en el diseño del botón.

**Preguntas abiertas:**
- Pregunta 6 del product-map: mantener o eliminar O-04.

## Trazabilidad

- C-20, decisiones #7 y #26 · sugerencia a validar.
