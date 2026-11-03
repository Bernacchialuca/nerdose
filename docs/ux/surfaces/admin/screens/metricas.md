---
name: metricas
surface: admin
route: /metrics
viewports:
  - desktop
audiences:
  - responsable
fidelity: mid
status: diseñada
version: "1.0"
date: 2026-11-03
---

# Pantalla: P-05 · Métricas

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Elegir un rango de fechas y ver cifras resumen y tablas de jugadores únicos, retención D1/D7, distribución de rachas y calidad por desafío.
- **Viewports:**
  - **desktop** — Barra de rango arriba, cuatro cifras resumen en una fila (3/12 c/u) y tablas debajo en paneles. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- Encabezado · «Métricas»

**Salidas user-driven:**
- A `reportes`, `proximos-desafios`, `stock-contenido` · encabezado
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
| 8 | fecha-desde | date-picker | — | input | desktop | — | Inicio del rango (`from`) |
| 9 | fecha-hasta | date-picker | — | input | desktop | — | Fin del rango (`to`) |
| 10 | btn-consultar | button | variant=primary | input | desktop | state_overrides: loading, error de validación | Consulta el rango |
| 11 | alerta-rango | alert | error | feedback | desktop | visible_only_in_states: error de validación | Rango inválido |
| 12 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de carga |
| 13 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 14 | estado-vacio | empty-state | — | feedback | desktop | visible_only_in_states: empty | Rango sin Play |
| 15 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga |
| 16 | cifra-unicos | card | — | content | desktop | hidden_in_states: empty, loading, error de sistema | Jugadores únicos |
| 17 | cifra-d1 | card | — | content | desktop | hidden_in_states: empty, loading, error de sistema | Retención D1 |
| 18 | cifra-d7 | card | — | content | desktop | hidden_in_states: empty, loading, error de sistema | Retención D7 |
| 19 | cifra-completados | card | — | content | desktop | hidden_in_states: empty, loading, error de sistema | Partidas completadas |
| 20 | tabla-retencion | table | — | content | desktop | hidden_in_states: empty, loading, error de sistema | Retención por cohorte |
| 21 | tabla-rachas | table | — | content | desktop | hidden_in_states: empty, loading, error de sistema | Distribución de rachas |
| 22 | tabla-calidad | table | — | content | desktop | hidden_in_states: empty, loading, error de sistema | Calidad por desafío |

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
- row `rango`
  - col 3/12:
    - fecha-desde
  - col 3/12:
    - fecha-hasta
  - col 2/12:
    - btn-consultar
  - col 4/12: (vacía)
- row `avisos`
  - col 12/12:
    - alerta-rango
    - alerta-sistema
    - btn-reintentar
    - estado-vacio
    - cargando
- row `cifras`
  - col 3/12:
    - cifra-unicos
  - col 3/12:
    - cifra-d1
  - col 3/12:
    - cifra-d7
  - col 3/12:
    - cifra-completados
- row `tablas-1`
  - col 7/12 (card):
    - tabla-retencion
  - col 5/12 (card):
    - tabla-rachas
- row `panel-calidad` (card, título «Calidad por desafío»)
  - col 12/12:
    - tabla-calidad

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
- Annotation: nada

### nav-stock
- Texto/label: Stock
- Icono: nada
- Annotation: nada

### nav-metricas
- Texto/label: Métricas
- Icono: nada
- Annotation: sección actual

### nav-cerrar-sesion
- Texto/label: Cerrar sesión
- Icono: lock
- Annotation: nada

### titulo
- Texto/label: Métricas
- Icono: nada
- Annotation: nada

### fecha-desde
- Texto/label: Desde
- Icono: nada
- Annotation: nada

### fecha-hasta
- Texto/label: Hasta
- Icono: nada
- Annotation: nada

### btn-consultar
- Texto/label: Consultar
- Icono: search
- Annotation: nada

### alerta-rango
- Texto/label: La fecha inicial no puede ser posterior a la final.
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar las métricas. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### estado-vacio
- Texto/label: Sin datos en el rango. Probá con un rango más amplio.
- Icono: nada
- Annotation: nada

### cargando
- Texto/label: Consultando métricas…
- Icono: nada
- Annotation: nada

### cifra-unicos
- Texto/label: Jugadores únicos · 1.284
- Icono: nada
- Annotation: nada

### cifra-d1
- Texto/label: Retención D1 · 41 %
- Icono: nada
- Annotation: nada

### cifra-d7
- Texto/label: Retención D7 · 18 %
- Icono: nada
- Annotation: nada

### cifra-completados
- Texto/label: Partidas completadas · 9.730
- Icono: nada
- Annotation: nada

### tabla-retencion
- Texto/label: ver columnas
- Icono: nada
- Annotation: la definición de cohorte es visible al pie de la tabla
- Columnas: Cohorte (primer día), Jugadores, D1, D7

### tabla-rachas
- Texto/label: ver columnas
- Icono: nada
- Annotation: nada
- Columnas: Tramo de racha, Jugadores, % del total

### tabla-calidad
- Texto/label: ver columnas
- Icono: nada
- Annotation: sin enlace a Reportes desde la fila (pregunta abierta 6)
- Columnas: Desafío, Jugadas, Completado, Victorias, Reportes

## Estados

### default
- Aplica: Sí
- Mensaje: Rango de los últimos 30 días con cifras y tablas.
- Cambios:
  - ninguno respecto de default.

### empty
- Aplica: Sí
- Mensaje: Sin datos en el rango. Probá con un rango más amplio.
- Cambios:
  - estado-vacio: visible solo acá.
  - cifras y tablas: ocultas.

### loading
- Aplica: Sí
- Mensaje: Consultando métricas…
- Cambios:
  - cargando: visible solo acá.
  - btn-consultar: variant="disabled", content="Consultando…".

### error de validación
- Aplica: Sí
- Mensaje: La fecha inicial no puede ser posterior a la final.
- Cambios:
  - alerta-rango: visible solo acá.
  - btn-consultar: variant="disabled".

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar las métricas. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá; no se muestran cifras viejas.

## Interacciones

**Eventos:**
- btn-consultar · on click → consulta `from`/`to` y aplica a todas las tablas
- btn-reintentar · on click → reconsulta

**Validaciones:**
- `from` > `to` o vacío: marca el rango y no consulta.

**Feedback:**
- Rango sin Play muestra «Sin datos en el rango», distinto de error de carga.
- Tras un `401` el rango elegido se pierde (el login lleva a `reportes`).

## Accesibilidad

- **Orden de foco:** encabezado → fecha-desde → fecha-hasta → btn-consultar → cifras → tablas.
- **Landmarks y jerarquía:** `main` con h1 y h2 por panel; los errores del rango son `role="alert"`.

## Decisiones y descartes

**Decisiones tomadas:**
- Cifras resumen antes del detalle (benchmark: Plausible Analytics).
- Solo tablas, sin gráficos (decisión de arquitectura de `admin`).

**Alternativas descartadas:**
- Selector de rangos predefinidos (7/30/90 días): el PRD define `from` y `to` libres.

**Preguntas abiertas:**
- ¿La fila de calidad debe enlazar a Reportes o al desafío? (pregunta 6 del product-map).

## Trazabilidad

- C-46 · flujo 5 de `user-flows.md`.
