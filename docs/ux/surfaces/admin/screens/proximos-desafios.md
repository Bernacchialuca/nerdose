---
name: proximos-desafios
surface: admin
route: /upcoming
viewports:
  - desktop
audiences:
  - responsable
fidelity: mid
status: diseñada
version: "1.0"
date: 2026-11-03
---

# Pantalla: P-03 · Próximos desafíos

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Ver de un vistazo la grilla de 14 días × 5 juegos con el estado de cada celda y acceder a regenerar.
- **Viewports:**
  - **desktop** — Panel único a todo el ancho con la grilla 14 × 5 como tabla; cada celda abre el detalle. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- Encabezado · «Próximos»
- `o-03-regenerar-desafio` · confirmar o cancelar

**Salidas user-driven:**
- A `o-02-detalle-desafio` · clic en una celda con desafío
- A `o-03-regenerar-desafio` · acción «Regenerar» de la celda (solo `approved` con fecha futura)
- A `reportes`, `stock-contenido`, `metricas` · encabezado
- A `login` · «Cerrar sesión» o `401`

**Salidas automáticas:**
- A `login` · `401` por token vencido (borra el token).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Marca del panel |
| 2 | nav-reportes | link | — | navigation | desktop | — | Navegación del encabezado a Reportes |
| 3 | nav-proximos | link | — | navigation | desktop | — | Navegación del encabezado a Próximos |
| 4 | nav-stock | link | — | navigation | desktop | — | Navegación del encabezado a Stock |
| 5 | nav-metricas | link | — | navigation | desktop | — | Navegación del encabezado a Métricas |
| 6 | nav-cerrar-sesion | link | — | navigation | desktop | — | Cierra la sesión: borra el token y va a Login |
| 7 | titulo | heading | h1 | content | desktop | — | Título |
| 8 | subtitulo | paragraph | caption | content | desktop | — | Horizonte y zona horaria |
| 9 | leyenda | chips | — | content | desktop | — | Estados posibles de una celda |
| 10 | alerta-regeneracion | alert | error | feedback | desktop | visible_only_in_states: error de regeneración | Falla de una regeneración |
| 11 | alerta-pendiente | alert | info | feedback | desktop | visible_only_in_states: regeneración pendiente | Hay una regeneración en curso |
| 12 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de carga |
| 13 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 14 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga de la grilla |
| 15 | grilla | table | — | content | desktop | hidden_in_states: loading, error de sistema; state_overrides: regeneración pendiente | Grilla 14 días × 5 juegos; la celda abre el detalle |

## Layout por viewport

### desktop · 1200px
- row `encabezado`
  - col 2/12:
    - nav-reportes
  - col 2/12:
    - nav-proximos
  - col 2/12:
    - nav-stock
  - col 2/12:
    - nav-metricas
  - col 2/12:
    - nav-cerrar-sesion
  - col 2/12: (vacía)
- row `titulos`
  - col 12/12:
    - titulo
    - subtitulo
- row `panel-grilla` (card, título «Grilla de 14 días»)
  - col 12/12:
    - leyenda
    - alerta-pendiente
    - alerta-regeneracion
    - alerta-sistema
    - btn-reintentar
    - cargando
    - grilla

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: > nerdose admin
- Icono: settings
- Annotation: nada

### nav-reportes
- Texto/label: Reportes (3)
- Icono: nada
- Annotation: nada

### nav-proximos
- Texto/label: Próximos
- Icono: nada
- Annotation: sección actual

### nav-stock
- Texto/label: Stock
- Icono: nada
- Annotation: nada

### nav-metricas
- Texto/label: Métricas
- Icono: nada
- Annotation: nada

### nav-cerrar-sesion
- Texto/label: Cerrar sesión
- Icono: lock
- Annotation: nada

### titulo
- Texto/label: Próximos desafíos
- Icono: nada
- Annotation: nada

### subtitulo
- Texto/label: Próximos 14 días (UTC) · 5 juegos
- Icono: nada
- Annotation: nada

### leyenda
- Texto/label: Aprobado, Sin desafío, Regenerando…
- Icono: nada
- Annotation: nada

### alerta-regeneracion
- Texto/label: No se pudo regenerar el desafío. Queda el actual.
- Icono: nada
- Annotation: nada

### alerta-pendiente
- Texto/label: Hay una regeneración en curso. La grilla se actualiza sola.
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar los próximos desafíos. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### cargando
- Texto/label: Cargando grilla…
- Icono: nada
- Annotation: nada

### grilla
- Texto/label: ver columnas
- Icono: nada
- Annotation: clic en celda con desafío → detalle; «Regenerar» solo en `approved` con fecha futura; polling 5 s mientras haya pendientes (a confirmar)
- Columnas: Día, Devdle, Bug Hunt, Big O, Tech Timeline, Grep Grid

## Estados

### default
- Aplica: Sí
- Mensaje: Grilla 14 × 5 con celdas aprobadas y los huecos «Sin desafío».
- Cambios:
  - ninguno respecto de default.

### regeneración pendiente
- Aplica: Sí
- Mensaje: Hay una regeneración en curso. La grilla se actualiza sola.
- Cambios:
  - alerta-pendiente: visible solo acá.
  - grilla: la celda afectada muestra «Regenerando…» y no admite «Regenerar».

### error de regeneración
- Aplica: Sí
- Mensaje: No se pudo regenerar el desafío. Queda el actual.
- Cambios:
  - alerta-regeneracion: visible solo acá; la celda vuelve a «Aprobado».

### loading
- Aplica: Sí
- Mensaje: Cargando grilla…
- Cambios:
  - cargando: visible solo acá.
  - grilla: oculta.

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar los próximos desafíos. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá; grilla oculta.

## Interacciones

**Eventos:**
- grilla · on click celda → abre `o-02-detalle-desafio`
- grilla · acción «Regenerar» de la celda → abre `o-03-regenerar-desafio`
- polling 5 s (a confirmar) mientras haya `pending_request`

**Validaciones:**
- Ninguna: no hay campos de entrada.

**Feedback:**
- Una regeneración fallida nunca deja una celda sin desafío: se quita el estado pendiente y se informa.
- La celda «Sin desafío» no ofrece acción: el PRD no define cómo completar un hueco desde el admin (riesgo abierto del flujo 4).

## Accesibilidad

- **Orden de foco:** encabezado → leyenda → grilla (fila por fila, celda por celda).
- **Landmarks y jerarquía:** `main` con un h1; la grilla es una tabla con encabezados de columna.
- **Propio de esta composición:** el estado de la celda se comunica con texto, no solo con color; los cambios por polling se anuncian con `aria-live="polite"`.

## Decisiones y descartes

**Decisiones tomadas:**
- Grilla de celdas con estado y preview solo al abrir el detalle (pregunta 5 del product-map): los huecos se ven de un vistazo.

**Alternativas descartadas:**
- Lista por día con preview inline: repetiría ES/EN 70 veces.

**Preguntas abiertas:**
- ¿Grilla o lista por día? (pregunta 5 del product-map).

## Trazabilidad

- C-43, C-44 · flujo 4 de `user-flows.md`.
