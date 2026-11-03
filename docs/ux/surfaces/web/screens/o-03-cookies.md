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
version: "1.0"
date: 2026-11-03
overlay: true
overlay_type: banner
triggered_by: home
---

# Pantalla: O-03 · Aviso de cookies bloqueadas

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Avisar que sin cookies no hay sesión y por lo tanto no se puede jugar; el resto del sitio sigue visible.
- **Viewports:**
  - **mobile** — banner de ancho completo fijo bajo el header.
  - **desktop** — mismo banner, de ancho completo, fijo bajo el header.

## Entrada y salida

**Entradas:**
- Shell · detección tras `POST /api/session`

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
- Icono: nada
- Annotation: nada

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

**Alternativas descartadas:**
- Modal que bloquea todo: impide ver estadísticas y «Acerca de», que sí funcionan.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-02, C-01 · flujo 1 (errores).
