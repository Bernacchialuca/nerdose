---
name: stock-contenido
surface: admin
route: /content
viewports:
  - desktop
audiences:
  - responsable
fidelity: mid
status: diseñada
version: "1.0"
date: 2026-11-03
---

# Pantalla: P-04 · Stock de contenido

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Ver la salud de los bancos de términos y hechos, la última carga del dataset y el top 50 de palabras rechazadas en Devdle; solo lectura.
- **Viewports:**
  - **desktop** — Dos paneles lado a lado (6/6) para los bancos y, debajo, el top 50 a todo el ancho. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- Encabezado · «Stock»

**Salidas user-driven:**
- A `reportes`, `proximos-desafios`, `metricas` · encabezado
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
| 8 | carga-dataset | paragraph | caption | content | desktop | — | Última carga del dataset |
| 9 | alerta-stock | alert | warning | feedback | desktop | visible_only_in_states: stock bajo | Banco que no alcanza para ciclar |
| 10 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de carga |
| 11 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 12 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga |
| 13 | tabla-terminos | table | — | content | desktop | hidden_in_states: loading, error de sistema | Salud del banco de términos |
| 14 | tabla-hechos | table | — | content | desktop | hidden_in_states: loading, error de sistema; state_overrides: stock bajo | Salud del banco de hechos |
| 15 | tabla-rechazadas | table | — | content | desktop | hidden_in_states: loading, error de sistema | Top 50 de palabras rechazadas en Devdle |
| 16 | paginacion | pagination | — | navigation | desktop | hidden_in_states: loading, error de sistema | Paginación del top 50 |

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
    - carga-dataset
- row `avisos`
  - col 12/12:
    - alerta-stock
    - alerta-sistema
    - btn-reintentar
    - cargando
- row `bancos`
  - col 6/12 (card):
    - tabla-terminos
  - col 6/12 (card):
    - tabla-hechos
- row `panel-rechazadas` (card, título «Top 50 de palabras rechazadas en Devdle»)
  - col 12/12:
    - tabla-rechazadas
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
- Annotation: nada

### nav-proximos
- Texto/label: Próximos
- Icono: nada
- Annotation: nada

### nav-stock
- Texto/label: Stock
- Icono: nada
- Annotation: sección actual

### nav-metricas
- Texto/label: Métricas
- Icono: nada
- Annotation: nada

### nav-cerrar-sesion
- Texto/label: Cerrar sesión
- Icono: lock
- Annotation: nada

### titulo
- Texto/label: Stock de contenido
- Icono: nada
- Annotation: nada

### carga-dataset
- Texto/label: Última carga del dataset: 2026-10-28 03:12 UTC
- Icono: nada
- Annotation: nada

### alerta-stock
- Texto/label: El banco de hechos no alcanza para ciclar con la ventana anti-repetición.
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar el stock. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### cargando
- Texto/label: Cargando stock…
- Icono: nada
- Annotation: nada

### tabla-terminos
- Texto/label: ver columnas
- Icono: nada
- Annotation: nada
- Columnas: Banco de términos, Valor

### tabla-hechos
- Texto/label: ver columnas
- Icono: nada
- Annotation: nada
- Columnas: Banco de hechos, Valor

### tabla-rechazadas
- Texto/label: ver columnas
- Icono: nada
- Annotation: nada
- Columnas: #, Palabra, Veces rechazada, Último intento

### paginacion
- Texto/label: ver columnas
- Icono: nada
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Dos bancos sanos y el top 50 de rechazadas.
- Cambios:
  - ninguno respecto de default.

### stock bajo
- Aplica: Sí
- Mensaje: El banco de hechos no alcanza para ciclar con la ventana anti-repetición.
- Cambios:
  - alerta-stock: visible solo acá.
  - tabla-hechos: días de stock bajos y «Alcanza para ciclar: No».

### loading
- Aplica: Sí
- Mensaje: Cargando stock…
- Cambios:
  - cargando: visible solo acá; tablas y paginación ocultas.

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar el stock. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá; tablas ocultas.

## Interacciones

**Eventos:**
- paginacion · on change → pide la página del top 50
- btn-reintentar · on click → reconsulta

**Validaciones:**
- Ninguna: solo lectura (C-45).

**Feedback:**
- Un banco por agotarse solo se informa: la acción es externa a la superficie.

## Accesibilidad

- **Orden de foco:** encabezado → bancos → top 50 → paginacion.
- **Landmarks y jerarquía:** `main` con un h1 y un h2 por panel.

## Decisiones y descartes

**Decisiones tomadas:**
- Tablas clave/valor en vez de gráficos: la lectura es por cifra (decisión de arquitectura de `admin`).
- Los dos bancos van lado a lado para compararlos sin scroll.

**Alternativas descartadas:**
- Gráficos de evolución del stock: el PRD no los pide.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-45 · flujo 5 de `user-flows.md`.
