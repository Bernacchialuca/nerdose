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
version: "1.1"
date: 2026-11-10
overlay: true
overlay_type: modal
triggered_by: grep-grid-partida
---

# Pantalla: O-04 · Confirmar «Rendirse»

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Confirmar que se cierra la partida como perdida con `N/8` (irreversible), para evitar rendirse por un toque accidental. Confirmado por REQ-005: deja de ser una sugerencia a validar.
- **Viewports:**
  - **mobile** — modal a ancho casi completo, con las dos acciones apiladas y «Seguir jugando» primero.
  - **desktop** — modal centrado (6/12), mismas acciones en fila.

## Entrada y salida

**Entradas:**
- `grep-grid-partida` · btn-rendirse

**Salidas user-driven:**
- A `grep-grid-resultado` · «Sí, rendirme» (la Play cierra `lost` con `N/8`)
- Cierra y vuelve a la partida · «Seguir jugando», Escape o clic fuera del modal (sin request)

**Salidas automáticas:**
- Si la rendición responde `game_finished` (la Play ya cerró desde otra pestaña), `challenge_expired`, `challenge_voided`, `no_session` o 429, el modal se cierra y `grep-grid-partida` aplica la respuesta como con cualquier jugada.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Título del overlay |
| 2 | texto | paragraph | body | content | ambos | state_overrides: sin palabras | Consecuencias de rendirse |
| 3 | btn-seguir | button | primary | input | ambos | state_overrides: loading | Cierra el modal sin cambios (acción segura, foco inicial) |
| 4 | btn-rendirme | button | error | input | ambos | state_overrides: loading | Cierra la Play como perdida (C-20) |

## Layout por viewport

### mobile · 400px
- texto
- btn-seguir
- btn-rendirme

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía, margen)
  - col 6/12: texto, row `acciones` (col 6/12: btn-seguir · col 6/12: btn-rendirme)
  - col 3/12: (vacía, margen)

## Contenido

### header
- Texto/label: ¿Rendirte?
- Icono: close
- Annotation: `h2` del `alertdialog`; el ícono cierra como «Seguir jugando»

### texto
- Texto/label: Vas a cerrar la partida con 3/8. Cuenta para tu racha y te mostramos las palabras que faltan. No se puede deshacer.
- Icono: nada
- Annotation: `N` es el valor real del contador al abrir el modal. Confirmado por REQ-005 (supuesto «Confirmación de "Rendirse"», decisión #26 del PRD): rendirse es irreversible y el PRD pide confirmar lo irreversible

### btn-seguir
- Texto/label: Seguir jugando
- Icono: nada
- Annotation: `button` `primary` del DS (avanzar = verde), `md`; es el foco inicial y la salida por defecto (Escape). No envía nada

### btn-rendirme
- Texto/label: Sí, rendirme
- Icono: nada
- Annotation: `button` `outline-tinted` con tinte de error del DS, `md`; envía `{ type: give_up }`. Mientras responde el servidor queda deshabilitado para no enviar dos veces

## Estados

### default
- Aplica: Sí
- Mensaje: Vas a cerrar la partida con 3/8. Cuenta para tu racha y te mostramos las palabras que faltan. No se puede deshacer.
- Cambios: ninguno respecto de default.

### sin palabras
- Aplica: Sí (sub-estado de default)
- Mensaje: Vas a cerrar la partida con 0/8. Cuenta para tu racha igual y te mostramos las 8 palabras. No se puede deshacer.
- Cambios:
  - texto: content="Vas a cerrar la partida con 0/8. Cuenta para tu racha igual y te mostramos las 8 palabras. No se puede deshacer.", annotation="rendirse con 0/8 está permitido y también completa el día (CA 12)" (state_override)

### loading
- Aplica: Sí
- Mensaje: Cerrando la partida…
- Cambios:
  - btn-rendirme: variant="disabled", content="Cerrando…", annotation="la rendición está en vuelo; el modal no se puede cerrar hasta que responda" (state_override)
  - btn-seguir: variant="disabled" (state_override)

## Interacciones

**Eventos:**
- btn-rendirme · on click → estado `loading`; envía `{ type: give_up }`; la respuesta `lost` cierra el modal y navega a `grep-grid-resultado` con `N/8`, las faltantes reveladas y las rachas (CA 10, 12)
- btn-seguir · on click → cierra el modal sin request; la Play sigue `in_progress` con el mismo `N/8` y el foco vuelve a `btn-rendirse` (CA 11)
- Escape o clic fuera · → igual que «Seguir jugando»
- respuesta `game_finished` / `challenge_expired` / `challenge_voided` / `no_session` / 429 → el modal se cierra y `grep-grid-partida` muestra el estado correspondiente

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Sin feedback propio más allá de la navegación; si la rendición falla por red o 500, el modal se cierra y `grep-grid-partida` muestra `alerta-sistema`: la Play no cambió.

## Accesibilidad

- **Orden de foco:** header (cerrar) → texto → btn-seguir → btn-rendirme (el destructivo al final).
- **Landmarks y jerarquía:** Rol `alertdialog` con `aria-labelledby` al título y `aria-describedby` al texto.
- **Foco y teclado:** Atrapa el foco; Escape equivale a «Seguir jugando» (salvo en `loading`, mientras la rendición está en vuelo); al cerrarse, por cualquier vía, devuelve el foco a `btn-rendirse` (CA 11).
- **Propio de esta composición:** El foco inicial va a «Seguir jugando», nunca a la acción destructiva. El fondo de la partida queda inerte (`inert` / `aria-hidden`) mientras el modal está abierto.

## Decisiones y descartes

**Decisiones tomadas:**
- La acción destructiva no es el foco inicial.
- REQ-005: O-04 se confirma (supuesto «Confirmación de "Rendirse"»; CA 10, 11, 12): rendirse es irreversible y el PRD establece el principio de confirmar para no perder por un toque accidental (decisión #26). Se cierra la pregunta 6 del product-map.
- REQ-005: «Seguir jugando» es `primary` (acción segura, verde de «avanzar» del DS) y «Sí, rendirme» es `outline-tinted` de error (destructiva suave); el orden visual pone primero la acción segura.
- REQ-005: sub-estado `sin palabras` (0/8) con texto propio, porque el caso está permitido y el mensaje genérico («las palabras que faltan») sería ambiguo cuando faltan las 8.
- REQ-005: el DS de `web` no tiene componente modal (los marca «Pendiente — el prototipo no los define»). Se deriva según la guía del README del DS (panel + botones) y se documenta en la story que lo implemente; queda anotado en la revisión UX de REQ-005.

**Alternativas descartadas:**
- Sin confirmación (botón directo): el riesgo recae en el diseño del botón y la acción no se puede deshacer.
- Confirmación inline (banner bajo el botón) en lugar de modal: el diseño técnico de REQ-005 (decisión 11) y CA 11 fijan el modal con Escape y devolución del foco.

**Preguntas abiertas:**
- Ninguna.

## Trazabilidad

- C-20, decisiones #7 y #26 del PRD · REQ-005 (RF 10; CA 10, 11, 12) · flujo 1 de `user-flows.md` (camino alternativo «Rendirse en Grep Grid»).
