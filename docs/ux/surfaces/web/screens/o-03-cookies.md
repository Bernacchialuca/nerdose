---
name: o-03-cookies
surface: web
route: (banner del shell)
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.2"
date: 2026-11-06
overlay: true
overlay_type: banner
triggered_by: home
---

# Pantalla: O-03 · Aviso de cookies bloqueadas

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Avisar que sin cookies no hay sesión y por lo tanto no se puede jugar; el resto del sitio sigue visible.
- **Viewports:**
  - **mobile** — banner bajo el header, al ancho del contenedor de página (con el gutter de 32 px).
  - **desktop** — mismo banner, alineado al contenedor de página de 1240 px (no de borde a borde), bajo el header.

## Entrada y salida

**Entradas:**
- Shell · detección: la creación de la sesión respondió bien y el estado del día pedido después sigue sin sesión (REQ-002)

**Salidas user-driven:**
- Ninguna.

**Salidas automáticas:**
- Se oculta solo cuando la sesión se crea.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Banner fijo bajo el header |
| 2 | alerta | alert | warning | feedback | ambos | — | Aviso persistente |
| 3 | detalle | paragraph | caption | content | ambos | — | Aclaración de qué sigue funcionando |

## Layout por viewport

### mobile · 400px
- alerta
- detalle

### desktop · 1200px
- alerta
- detalle

## Contenido

### header
- Texto/label: Cookies bloqueadas
- Icono: nada
- Annotation: nada

### alerta
- Texto/label: Activá las cookies para poder jugar
- Icono: warning
- Annotation: `banner` variant `warning` del DS: tinte de advertencia, borde de 1 px, radio 14, padding 18/22, ícono de advertencia; `role="status"`

### detalle
- Texto/label: Sin cookies no podemos guardar tu partida. El catálogo, las estadísticas y «Acerca de» siguen disponibles.
- Icono: nada
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Activá las cookies para poder jugar. Persiste hasta que la sesión se crea.
- Cambios: ninguno respecto de default.

## Interacciones

**Eventos:**
- Sin eventos: el banner no se puede cerrar a mano.

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Sin feedback propio más allá de la navegación.

## Accesibilidad

- **Orden de foco:** No entra en el orden de foco (no hay controles).
- **Landmarks y jerarquía:** `role=status`, se anuncia una sola vez.
- **Foco y teclado:** No atrapa el foco.
- **Propio de esta composición:** No tapa el header ni los CTA.

## Decisiones y descartes

**Decisiones tomadas:**
- Banner, no modal: no bloquea la lectura del catálogo (C-02).
- REQ-002: solo se muestra si la creación de la sesión respondió 200 y el estado del día siguiente sigue con `has_session = false`. Si la creación fue rechazada por límite (429), no se muestra: la home pasa a «sesión no disponible», para no culpar al navegador de un límite del servidor.
- REQ-002: con el banner visible, el selector ES/EN sigue funcionando, pero el cambio queda solo en este navegador (no hay Player donde guardarlo).

- REQ-003: el banner es el `banner` `warning` del DS 1.0.0 y se alinea al contenedor de página (1240 px, gutter 32) en lugar de ir de borde a borde, para quedar en la misma columna que el contenido de la home (CA 9). Sin cambios de lógica ni de texto.

**Alternativas descartadas:**
- Modal que bloquea todo: impide ver estadísticas y «Acerca de», que sí funcionan.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-02, C-01 · flujo 1 (errores).
- REQ-002: RF 5 · CA 5, CA 13.
- REQ-003: RF 12 · CA 9.
