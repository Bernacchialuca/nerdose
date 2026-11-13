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
version: "1.1"
date: 2026-11-13
---

# Pantalla: P-04 · Stock de contenido

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Ver la salud de cada banco (términos, desglosado por Devdle y Grep Grid, y hechos): disponibles, totales, rechazados con su motivo, días de stock y si alcanza para ciclar; la última carga del dataset y las 50 palabras más rechazadas en Devdle. Solo lectura.
- **Viewports:**
  - **desktop** — Última carga arriba; los dos bancos lado a lado (6/6) con su desglose por juego; debajo, rechazados con motivo y el top 50 a todo el ancho. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- Encabezado · «Stock»

**Salidas user-driven:**
- A `reportes`, `proximos-desafios`, `metricas` · encabezado
- A `login` · «Cerrar sesión»

**Salidas automáticas:**
- A `login` · `401` por token vencido (borra el token).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Marca del panel |
| 2 | nav-reportes | link | — | navigation | desktop | — | Navegación a Reportes, con el contador de grupos abiertos |
| 3 | nav-proximos | link | — | navigation | desktop | — | Navegación a Próximos, con el contador de fallas de generación activas |
| 4 | nav-stock | link | — | navigation | desktop | — | Navegación a Stock |
| 5 | nav-metricas | link | — | navigation | desktop | — | Navegación a Métricas (FG-10) |
| 6 | nav-cerrar-sesion | link | — | navigation | desktop | — | Cierra la sesión: borra el token y va a Login |
| 7 | titulo | heading | h1 | content | desktop | — | Título |
| 8 | carga-dataset | list | — | content | desktop | hidden_in_states: loading, error de sistema; state_overrides: sin datos | Última carga del dataset: fecha, versión, insertados, actualizados, sin cambios, rechazados conservados |
| 9 | alerta-stock | alert | warning | feedback | desktop | visible_only_in_states: stock bajo | Banco o juego que no alcanza para ciclar |
| 10 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de carga |
| 11 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 12 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga |
| 13 | resumen-terminos | list | — | content | desktop | hidden_in_states: loading, error de sistema | Totales del banco de términos |
| 14 | tabla-terminos | table | — | content | desktop | hidden_in_states: loading, error de sistema | Términos por juego consumidor (Devdle, Grep Grid) |
| 15 | resumen-hechos | list | — | content | desktop | hidden_in_states: loading, error de sistema; state_overrides: stock bajo | Totales del banco de hechos |
| 16 | tabla-hechos | table | — | content | desktop | hidden_in_states: loading, error de sistema; state_overrides: stock bajo | Hechos por juego consumidor (Tech Timeline) |
| 17 | tabla-rechazos-banco | table | — | content | desktop | hidden_in_states: loading, error de sistema | Ítems rechazados de los bancos con su motivo |
| 18 | tabla-rechazadas | table | — | content | desktop | hidden_in_states: loading, error de sistema, sin datos | Top 50 de palabras rechazadas en Devdle por jugadores distintos |
| 19 | vacio-rechazadas | empty-state | — | feedback | desktop | visible_only_in_states: sin datos | Ningún jugador tuvo palabras rechazadas |

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
- row `avisos`
  - col 12/12:
    - alerta-stock
    - alerta-sistema
    - btn-reintentar
    - cargando
- row `panel-carga` (card, título «Última carga del dataset»)
  - col 12/12:
    - carga-dataset
- row `bancos`
  - col 6/12 (card, título «Banco de términos»):
    - resumen-terminos
    - tabla-terminos
  - col 6/12 (card, título «Banco de hechos»):
    - resumen-hechos
    - tabla-hechos
- row `panel-rechazos` (card, título «Ítems rechazados»)
  - col 12/12:
    - tabla-rechazos-banco
- row `panel-rechazadas` (card, título «Top 50 de palabras rechazadas en Devdle»)
  - col 12/12:
    - tabla-rechazadas
    - vacio-rechazadas

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
- Texto/label: Próximos (1)
- Icono: nada
- Annotation: el número son las fallas de generación activas; sin fallas, sin número

### nav-stock
- Texto/label: Stock
- Icono: nada
- Annotation: sección actual

### nav-metricas
- Texto/label: Métricas
- Icono: nada
- Annotation: no se renderiza hasta FG-10

### nav-cerrar-sesion
- Texto/label: Cerrar sesión
- Icono: lock
- Annotation: nada

### titulo
- Texto/label: Stock de contenido
- Icono: nada
- Annotation: nada

### carga-dataset
- Texto/label: Fecha: 2026-11-28 03:12 UTC · Versión: 2026.11.2 · Insertados: 40 · Actualizados: 12 · Sin cambios: 1.284 · Rechazados conservados: 9
- Icono: nada
- Annotation: última corrida exitosa de la carga de bancos; «Sin datos de carga» si nunca hubo una

### alerta-stock
- Texto/label: El banco de hechos no alcanza para ciclar: Tech Timeline necesita 450 hechos aprobados para su ventana de 90 días y hay 380.
- Icono: warning
- Annotation: uno por banco o juego con «Alcanza para ciclar: No»

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

### resumen-terminos
- Texto/label: Aprobados disponibles: 1.050 · Aprobados totales: 1.320 · Rechazados: 14 · Días de stock: 131 · Alcanza para ciclar: Sí
- Icono: nada
- Annotation: a nivel banco, «disponibles» son los que sirven a todos sus juegos, «días de stock» es el menor de sus juegos y «alcanza para ciclar» es Sí solo si todos alcanzan

### tabla-terminos
- Texto/label: ver columnas
- Icono: nada
- Annotation: una fila por juego que usa el banco; la ventana y los ítems por desafío salen del contrato del juego
- Columnas: Juego, Ventana, Por desafío, Disponibles, Días de stock, Alcanza para ciclar
- Filas de ejemplo: «Devdle · 365 días · 1 · 1.050 · 1.050 · Sí» / «Grep Grid · 30 días · 8 · 1.120 · 140 · Sí»

### resumen-hechos
- Texto/label: Aprobados disponibles: 310 · Aprobados totales: 520 · Rechazados: 3 · Días de stock: 62 · Alcanza para ciclar: Sí
- Icono: nada
- Annotation: en `stock bajo`: «Aprobados totales: 380 · Alcanza para ciclar: No»

### tabla-hechos
- Texto/label: ver columnas
- Icono: nada
- Annotation: una fila por juego que usa el banco
- Columnas: Juego, Ventana, Por desafío, Disponibles, Días de stock, Alcanza para ciclar
- Filas de ejemplo: «Tech Timeline · 90 días · 5 · 310 · 62 · Sí»

### tabla-rechazos-banco
- Texto/label: ver columnas
- Icono: nada
- Annotation: los rechazados de ambos bancos, más recientes primero (hasta 200); «Ningún ítem rechazado» si no hay
- Columnas: Banco, Ítem, Motivo
- Filas de ejemplo: «Términos · CAP theorem · definición incorrecta (anulación Devdle #8)» / «Hechos · Lanzamiento de Java 1.0 · fecha incorrecta»

### tabla-rechazadas
- Texto/label: ver columnas
- Icono: nada
- Annotation: las 50 palabras que Devdle no aceptó, ordenadas por cantidad de jugadores distintos (empate: orden alfabético). Solo lectura: sumar una palabra a la lista base es un cambio de código, no hay acción desde acá
- Columnas: #, Palabra, Jugadores distintos
- Filas de ejemplo: «1 · KAFKA · 41» / «2 · REACT · 37» / «3 · CRONS · 22»

### vacio-rechazadas
- Texto/label: Sin rechazos: ningún jugador intentó una palabra que Devdle no acepte.
- Icono: check
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Bancos sanos, última carga, rechazados con motivo y el top 50 de palabras rechazadas.
- Cambios:
  - ninguno respecto de default.

### stock bajo
- Aplica: Sí
- Mensaje: El banco de hechos no alcanza para ciclar: Tech Timeline necesita 450 hechos aprobados para su ventana de 90 días y hay 380.
- Cambios:
  - alerta-stock: visible solo acá.
  - resumen-hechos: content="Aprobados disponibles: 170 · Aprobados totales: 380 · Rechazados: 3 · Días de stock: 34 · Alcanza para ciclar: No".
  - tabla-hechos: fila «Tech Timeline · 90 días · 5 · 170 · 34 · No».

### sin datos
- Aplica: Sí
- Mensaje: Sin datos de carga · Sin rechazos.
- Cambios:
  - carga-dataset: content="Sin datos de carga: el dataset todavía no se cargó."
  - tabla-rechazadas: oculta.
  - vacio-rechazadas: visible solo acá.

### loading
- Aplica: Sí
- Mensaje: Cargando stock…
- Cambios:
  - cargando: visible solo acá; carga y tablas ocultas.

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar el stock. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá; carga y tablas ocultas.

## Interacciones

**Eventos:**
- btn-reintentar · on click → reconsulta `GET /api/admin/content/stock`

**Validaciones:**
- Ninguna: solo lectura (C-45).

**Feedback:**
- Un banco por agotarse solo se informa: la acción (cargar más contenido) es externa a la superficie.
- «Sin datos de carga» y «Sin rechazos» son estados vacíos, distintos de un error de carga (CA 14).

## Accesibilidad

- **Orden de foco:** encabezado → avisos → última carga → banco de términos → banco de hechos → ítems rechazados → top 50.
- **Landmarks y jerarquía:** `main` con un h1 y un h2 por panel.
- **Propio de esta composición:** «Alcanza para ciclar: No» es texto además de color.

## Decisiones y descartes

**Decisiones tomadas:**
- Tablas y listas clave/valor en vez de gráficos: la lectura es por cifra (decisión de arquitectura de `admin`).
- Los dos bancos van lado a lado para compararlos sin scroll.
- REQ-008: el banco de términos se desglosa por juego (Devdle y Grep Grid) porque cada uno tiene su ventana anti-repetición y su consumo por desafío; el total del banco toma el peor caso (CA 11, decisión 12 del diseño técnico).
- REQ-008: la última carga muestra fecha, versión, insertados y actualizados (y sin cambios / rechazados conservados) en un panel propio, no en una línea de subtítulo (CA 12).
- REQ-008: el top 50 se ordena por jugadores distintos y no lleva paginación: son 50 filas fijas (CA 13). Se quitan «Veces rechazada» y «Último intento», que el diseño técnico no expone.
- REQ-008: los rechazados de los bancos se listan con su motivo en una tabla propia (RF 7).

**Alternativas descartadas:**
- Gráficos de evolución del stock: el PRD no los pide.
- Acción «Agregar a la lista base» en el top 50: sumar una palabra es un cambio de código (F-15).
- Paginación del top 50: con 50 filas fijas no hace falta.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-45 · REQ-008 (RF 7, 8; CA 11-14) · flujo 5 de `user-flows.md`.
