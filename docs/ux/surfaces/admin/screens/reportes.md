---
name: reportes
surface: admin
route: /reports
viewports:
  - desktop
audiences:
  - responsable
fidelity: mid
status: diseñada
version: "1.0"
date: 2026-11-03
---

# Pantalla: P-02 · Reportes

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Cola de reportes agrupados por desafío (el más reportado primero), filtro por estado, acceso al detalle y a anular.
- **Viewports:**
  - **desktop** — Encabezado fijo de una fila y un panel único con filtro, tabla de grupos y paginación a todo el ancho; es la pantalla de aterrizaje de `/`. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- `/` (redirección)
- `login` · «Ingresar»
- Encabezado · «Reportes»
- `o-01-anular-desafio` · confirmación
- `o-02-detalle-desafio` · «Resolver» / «Descartar»

**Salidas user-driven:**
- A `o-02-detalle-desafio` · clic en la fila del grupo
- A `o-01-anular-desafio` · acción «Anular» de la fila (gesto de la fila; el recorrido recomendado pasa por el detalle)
- A `proximos-desafios`, `stock-contenido`, `metricas` · encabezado
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
| 8 | subtitulo | paragraph | caption | content | desktop | — | Contexto |
| 9 | tabs-estado | tabs | active=0 | navigation | desktop | state_overrides: resueltos | Filtro de estado (default `open`) |
| 10 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de carga distinta de «sin datos» |
| 11 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 12 | estado-vacio | empty-state | — | feedback | desktop | visible_only_in_states: empty | Cola sin reportes abiertos |
| 13 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga de la cola |
| 14 | tabla-grupos | table | — | content | desktop | hidden_in_states: empty, loading, error de sistema; state_overrides: resueltos | Un grupo por desafío; la fila abre el detalle |
| 15 | paginacion | pagination | — | navigation | desktop | hidden_in_states: empty, loading, error de sistema | Paginación de grupos |

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
- row `panel-reportes` (card, título «Grupos de reportes»)
  - col 12/12:
    - tabs-estado
    - alerta-sistema
    - btn-reintentar
    - estado-vacio
    - cargando
    - tabla-grupos
    - paginacion

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: > nerdose admin
- Icono: settings
- Annotation: nada

### nav-reportes
- Texto/label: Reportes (3)
- Icono: nada
- Annotation: sección actual

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
- Annotation: nada

### nav-cerrar-sesion
- Texto/label: Cerrar sesión
- Icono: lock
- Annotation: nada

### titulo
- Texto/label: Reportes
- Icono: nada
- Annotation: nada

### subtitulo
- Texto/label: Agrupados por desafío · el más reportado primero
- Icono: nada
- Annotation: nada

### tabs-estado
- Texto/label: Abiertos, Resueltos, Descartados
- Icono: nada
- Annotation: default: Abiertos (`open`)

### alerta-sistema
- Texto/label: No pudimos cargar los reportes. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### estado-vacio
- Texto/label: No hay reportes abiertos. Todo al día.
- Icono: nada
- Annotation: nada

### cargando
- Texto/label: Cargando reportes…
- Icono: nada
- Annotation: nada

### tabla-grupos
- Texto/label: ver columnas
- Icono: nada
- Annotation: clic en la fila → detalle; acción «Anular» por fila solo si el desafío está `published`
- Columnas: Desafío, Reportes, Motivos, Último, Desafío (estado)

### paginacion
- Texto/label: ver columnas
- Icono: nada
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Cola de grupos con filtro «Abiertos».
- Cambios:
  - ninguno respecto de default.

### empty
- Aplica: Sí
- Mensaje: No hay reportes abiertos. Todo al día.
- Cambios:
  - estado-vacio: visible solo acá.
  - tabla-grupos y paginacion: ocultos.

### loading
- Aplica: Sí
- Mensaje: Cargando reportes…
- Cambios:
  - cargando: visible solo acá.
  - tabla-grupos y paginacion: ocultos.

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar los reportes. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá.
  - tabla-grupos y paginacion: ocultos (no se muestran cifras viejas como actuales).

### resueltos
- Aplica: Sí
- Mensaje: Grupos con reportes cerrados, solo lectura.
- Cambios:
  - tabs-estado: active=1 (Resueltos).
  - tabla-grupos: filas de grupos resueltos/descartados.

## Interacciones

**Eventos:**
- tabs-estado · on change → recarga con el estado elegido (`status`)
- tabla-grupos · on click fila → abre `o-02-detalle-desafio`
- tabla-grupos · acción «Anular» de la fila → abre `o-01-anular-desafio` (solo `published`)
- btn-reintentar · on click → reconsulta
- nav-cerrar-sesion · on click → borra el token y va a `login`

**Validaciones:**
- Ninguna: no hay campos de entrada.

**Feedback:**
- Un `401` en cualquier petición borra el token y redirige a `login` con «La sesión venció, ingresá de nuevo».
- El contador del encabezado («Reportes (3)») refleja grupos abiertos; hipótesis a validar (pregunta abierta 1).

## Accesibilidad

- **Orden de foco:** encabezado → tabs-estado → tabla-grupos → paginacion.
- **Landmarks y jerarquía:** `nav` para el encabezado, `main` con un h1; la tabla es navegable por teclado y la fila abre el detalle con Enter.
- **Foco y teclado:** al cerrar el detalle el foco vuelve a la fila.

## Decisiones y descartes

**Decisiones tomadas:**
- Un grupo por desafío, ordenado por cantidad de reportes: la primera fila es la más urgente.
- Las etiquetas del encabezado coinciden con los títulos de pantalla.
- La anulación dura una fila de distancia, pero el recorrido recomendado pasa por el detalle para ver la solución primero.

**Alternativas descartadas:**
- Cola estilo bandeja con vista previa inline: se descartó (benchmark: Modqueue de Reddit, a evitar).

**Preguntas abiertas:**
- ¿Contador de grupos abiertos en el encabezado? (pregunta 1 del product-map).
- ¿Resolver/descartar en bloque por grupo? C-40 es por reporte.

## Trazabilidad

- C-39, C-40, C-41 · flujos 2 y 3 de `user-flows.md`.
