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
version: "1.3"
date: 2026-11-25
---

# Pantalla: P-05 · Métricas

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Elegir un rango de fechas (por defecto, los últimos 30 días UTC) y ver cuatro cifras resumen y cuatro tablas: jugadores diarios por juego, retención D1/D7 por cohorte, distribución de rachas vivas y calidad por desafío. Solo lectura, sin gráficos y sin identificar jugadores.
- **Viewports:**
  - **desktop** — barra de rango arriba, cuatro cifras resumen en una fila (3/12 c/u) y las tablas debajo en paneles: jugadores diarios a todo el ancho, retención y rachas lado a lado, y calidad a todo el ancho. (Único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- Encabezado · «Métricas»
- URL directa con el rango (`/metrics?from=AAAA-MM-DD&to=AAAA-MM-DD`)

**Salidas user-driven:**
- A `reportes`, `proximos-desafios`, `bancos`, `stock-contenido` · encabezado
- A `login` · «Cerrar sesión»

**Salidas automáticas:**
- A `login` · sin sesión o `401` por token vencido (borra el token y no muestra ninguna cifra).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Marca del panel |
| 2 | nav-reportes | link | — | navigation | desktop | — | Navegación del encabezado a Reportes |
| 3 | nav-proximos | link | — | navigation | desktop | — | Navegación del encabezado a Próximos |
| 3b | nav-bancos | link | — | navigation | desktop | — | Navegación del encabezado a Bancos (REQ-012) |
| 4 | nav-stock | link | — | navigation | desktop | — | Navegación del encabezado a Stock |
| 5 | nav-metricas | link | — | navigation | desktop | — | Navegación del encabezado a Métricas |
| 6 | nav-cerrar-sesion | link | — | navigation | desktop | — | Cierra la sesión: borra el token y va a Login |
| 7 | titulo | heading | h1 | content | desktop | — | Título |
| 8 | fecha-desde | date-picker | — | input | desktop | state_overrides: error de validación→error | Inicio del rango (`from`) |
| 9 | fecha-hasta | date-picker | — | input | desktop | state_overrides: error de validación→error | Fin del rango (`to`) |
| 10 | btn-consultar | button | variant=primary | input | desktop | state_overrides: loading, error de validación | Consulta el rango |
| 11 | nota-rango | paragraph | caption | content | desktop | — | Reglas del rango a la vista |
| 12 | alerta-rango | alert | error | feedback | desktop | visible_only_in_states: error de validación | Rango inválido, con el motivo |
| 13 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de carga |
| 14 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 15 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga |
| 16 | cifra-unicos | card | — | content | desktop | hidden_in_states: loading, error de validación, error de sistema; state_overrides: empty | Jugadores únicos del rango |
| 17 | cifra-d1 | card | — | content | desktop | hidden_in_states: loading, error de validación, error de sistema; state_overrides: empty | Retención D1 del rango |
| 18 | cifra-d7 | card | — | content | desktop | hidden_in_states: loading, error de validación, error de sistema; state_overrides: empty | Retención D7 del rango |
| 19 | cifra-completados | card | — | content | desktop | hidden_in_states: loading, error de validación, error de sistema; state_overrides: empty | Partidas completadas del rango |
| 20 | tabla-diarios | table | — | content | desktop | hidden_in_states: loading, error de validación, error de sistema; state_overrides: empty | Jugadores únicos por día, total y por juego, de a 15 días por página |
| 20b | paginado-diarios | pagination | — | navigation | desktop | hidden_in_states: loading, error de validación, error de sistema, empty | «‹ Anterior · 1–15 de 30 días · página 1 de 2 · Siguiente ›» (REQ-012) |
| 21 | tabla-retencion | table | — | content | desktop | hidden_in_states: loading, error de validación, error de sistema; state_overrides: empty | Retención D1/D7 por cohorte |
| 22 | tabla-rachas | table | — | content | desktop | hidden_in_states: loading, error de validación, error de sistema | Distribución de rachas globales vivas a hoy |
| 23 | tabla-calidad | table | — | content | desktop | hidden_in_states: loading, error de validación, error de sistema; state_overrides: empty | Calidad por desafío, ordenable por columna, de a 15 filas por página |
| 24 | paginado-calidad | pagination | — | navigation | desktop | hidden_in_states: loading, error de validación, error de sistema, empty | «‹ Anterior · 1–15 de 150 desafíos · página 1 de 10 · Siguiente ›» (REQ-012) |

## Layout por viewport

### desktop · 1200px
- row `encabezado`
  - col 2/12:
    - nav-reportes
  - col 2/12:
    - nav-proximos
  - col 2/12:
    - nav-bancos
  - col 2/12:
    - nav-stock
  - col 2/12:
    - nav-metricas
  - col 2/12:
    - nav-cerrar-sesion
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
  - col 4/12:
    - nota-rango
- row `avisos`
  - col 12/12:
    - alerta-rango
    - alerta-sistema
    - btn-reintentar
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
- row `panel-diarios` (card, título «Jugadores diarios»)
  - col 12/12:
    - tabla-diarios
    - paginado-diarios
- row `tablas-1`
  - col 7/12 (card, título «Retención por cohorte»):
    - tabla-retencion
  - col 5/12 (card, título «Distribución de rachas»):
    - tabla-rachas
- row `panel-calidad` (card, título «Calidad por desafío»)
  - col 12/12:
    - tabla-calidad
    - paginado-calidad

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: > nerdose admin
- Icono: settings
- Annotation: no carga ningún script de analítica (ADR-014)

### nav-reportes
- Texto/label: Reportes (3)
- Icono: nada
- Annotation: nada

### nav-proximos
- Texto/label: Próximos (1)
- Icono: nada
- Annotation: el número son las fallas de generación activas (REQ-008); sin fallas, sin número

### nav-bancos
- Texto/label: Bancos
- Icono: nada
- Annotation: se renderiza desde REQ-012

### nav-stock
- Texto/label: Stock
- Icono: nada
- Annotation: nada

### nav-metricas
- Texto/label: Métricas
- Icono: nada
- Annotation: sección actual (`aria-current="page"`); se renderiza desde REQ-011

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
- Icono: calendar
- Annotation: fecha UTC; por defecto, hoy − 29 días. El rango vive en la URL: recargar o volver atrás conserva lo consultado

### fecha-hasta
- Texto/label: Hasta
- Icono: calendar
- Annotation: fecha UTC; por defecto, hoy (UTC)

### btn-consultar
- Texto/label: Consultar
- Icono: search
- Annotation: valida el rango antes de consultar; con un rango inválido no pide datos

### nota-rango
- Texto/label: Fechas en UTC · hasta 366 días · sin fechas futuras
- Icono: nada
- Annotation: nada

### alerta-rango
- Texto/label: La fecha inicial no puede ser posterior a la final.
- Icono: error
- Annotation: el texto depende del motivo: «Elegí las dos fechas del rango.» (vacío) · «La fecha inicial no puede ser posterior a la final.» · «El rango no puede incluir fechas futuras. Hoy es {dd/mm/aaaa} (UTC).» · «El rango no puede superar los 366 días.» Si el servidor rechaza un rango que el navegador aceptó (reloj desfasado), muestra el mensaje del servidor. `role="alert"`

### alerta-sistema
- Texto/label: No pudimos cargar las métricas. Probá de nuevo.
- Icono: error
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### cargando
- Texto/label: Consultando métricas…
- Icono: nada
- Annotation: nada

### cifra-unicos
- Texto/label: Jugadores únicos · 1.284
- Icono: nada
- Annotation: jugadores distintos con alguna partida iniciada en el rango; cada uno cuenta una vez (no es la suma de los días)

### cifra-d1
- Texto/label: Retención D1 · 41,3 %
- Icono: nada
- Annotation: promedio de las cohortes del rango con D1 ya ocurrido, ponderado por su cantidad de jugadores; «—» si ninguna lo tiene todavía. Porcentaje con un decimal

### cifra-d7
- Texto/label: Retención D7 · 18,2 %
- Icono: nada
- Annotation: igual que D1, con el día +7

### cifra-completados
- Texto/label: Partidas completadas · 9.730
- Icono: nada
- Annotation: ganadas, perdidas y anuladas del rango

### tabla-diarios
- Texto/label: Jugadores diarios
- Columnas: Fecha / Total / Devdle / Grep Grid / Tech Timeline / Big O / Bug Hunt
- Icono: nada
- Annotation: una fila por día del rango, del más reciente al más antiguo; los días sin partidas van en 0. Columnas de juego en el orden del catálogo. Desde REQ-012 se muestran 15 días por página (paginado en el cliente con el `Pagination` común; no se dibuja si el rango entra en una página). Pie de tabla: «El total cuenta a cada jugador una vez por día: no es la suma de las columnas.»

### tabla-retencion
- Texto/label: Retención por cohorte
- Columnas: Cohorte (primer día) / Jugadores / D1 / D7
- Icono: nada
- Annotation: una fila por cohorte del rango, de la más reciente a la más antigua; las cohortes vacías no se listan. «—» si el día +1 o +7 todavía no terminó. Pie de tabla: «Cohorte: jugadores cuya primera partida completada fue ese día. D1 y D7: porcentaje que completó alguna partida exactamente 1 y 7 días después. Las partidas anuladas cuentan como completadas.»

### tabla-rachas
- Texto/label: Distribución de rachas
- Columnas: Tramo de racha / Jugadores / % del total
- Icono: nada
- Annotation: siempre los 5 tramos, en orden: 0, 1, 2–6, 7–29, 30+, aunque tengan 0. Pie de tabla: «Racha global viva a hoy: no depende del rango elegido. El tramo 0 incluye a quienes nunca completaron una partida.»

### tabla-calidad
- Texto/label: Calidad por desafío
- Columnas: Desafío / Juego / Iniciadas / Terminadas / Completado / Victorias / Reportes / Estado
- Icono: nada
- Annotation: una fila por desafío publicado o anulado del rango, por defecto de la fecha más reciente a la más antigua. «Desafío» = «#N · dd/mm». Cada encabezado es un botón que ordena por esa columna (ascendente y descendente, con `aria-sort`), sin recargar. «Completado» = terminadas / iniciadas y «Victorias» = ganadas / terminadas, con un decimal; «—» si el divisor es 0. «Estado» en texto: «publicado» o «anulado». Sin enlace desde la fila (pregunta 6 del product-map, resuelta por REQ-011). Desde REQ-012 se muestran 15 filas por página; ordenar por una columna vuelve a la página 1. Pie de tabla: «Las partidas anuladas no cuentan en terminadas ni en victorias.»

## Estados

### default
- Aplica: Sí
- Mensaje: Rango de los últimos 30 días (UTC) con las cifras resumen y las cuatro tablas.
- Cambios:
  - ninguno respecto de default.

### empty
- Aplica: Sí
- Mensaje: Sin datos en el rango.
- Cambios:
  - cifra-unicos: content="Jugadores únicos · 0" (state_override)
  - cifra-d1: content="Retención D1 · —" (state_override)
  - cifra-d7: content="Retención D7 · —" (state_override)
  - cifra-completados: content="Partidas completadas · 0" (state_override)
  - tabla-diarios: content="Sin datos en el rango." (state_override; una fila de mensaje en lugar de días en 0)
  - tabla-retencion: content="Sin datos en el rango." (state_override)
  - tabla-calidad: content="Sin datos en el rango." (state_override)
  - tabla-rachas: sin cambios (no depende del rango)

### loading
- Aplica: Sí
- Mensaje: Consultando métricas…
- Cambios:
  - cargando: visible solo acá.
  - btn-consultar: variant="disabled", content="Consultando…".
  - cifras y tablas: ocultas.

### error de validación
- Aplica: Sí
- Mensaje: La fecha inicial no puede ser posterior a la final.
- Cambios:
  - alerta-rango: visible solo acá, con el texto del motivo.
  - fecha-desde, fecha-hasta: state=error en el campo que corresponde al motivo (los dos si `from` > `to`).
  - btn-consultar: variant="disabled" hasta que el rango sea válido.
  - cifras y tablas: ocultas; no se muestran datos de ese rango.

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar las métricas. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá; no se muestran cifras viejas.
  - cifras y tablas: ocultas.

## Interacciones

**Eventos:**
- btn-consultar · on click → valida el rango; si es válido, lo escribe en la URL y consulta; todas las cifras y tablas se actualizan juntas
- fecha-desde, fecha-hasta · on change → revalida el rango; con un rango válido se habilita «Consultar»
- btn-reintentar · on click → reconsulta el mismo rango
- tabla-calidad · encabezado on click → ordena por esa columna; un segundo click invierte el orden; vuelve a la página 1
- paginado-diarios, paginado-calidad · Anterior / Siguiente → cambian de página sin pedir nada al servidor (REQ-012)

**Validaciones:**
- `from` o `to` vacío → mensaje «Elegí las dos fechas del rango.»
- `from` > `to` → mensaje «La fecha inicial no puede ser posterior a la final.»
- `to` posterior a hoy (UTC) → mensaje «El rango no puede incluir fechas futuras. Hoy es {dd/mm/aaaa} (UTC).»
- `to − from` mayor a 365 días → mensaje «El rango no puede superar los 366 días.»

**Feedback:**
- Un rango sin partidas muestra «Sin datos en el rango.» en cada tabla, distinto del error de carga.
- Tras un `401` el rango elegido se pierde (el login lleva a `reportes`).

## Accesibilidad

- **Orden de foco:** encabezado → fecha-desde → fecha-hasta → btn-consultar → cifras → tablas (en la de calidad, los botones de los encabezados), cada una seguida de su paginado si lo tiene.
- **Landmarks y jerarquía:** `main` con `h1` «Métricas» y un `h2` por panel («Jugadores diarios», «Retención por cohorte», «Distribución de rachas», «Calidad por desafío»); los errores del rango son `role="alert"`.
- **Propio de esta composición:** cada tabla es `<table>` con `<caption>` y su pie de definición asociado. El orden activo de la tabla de calidad se anuncia con `aria-sort`. Ninguna celda depende del color: «—», «publicado» y «anulado» van en texto.

## Decisiones y descartes

**Decisiones tomadas:**
- Cifras resumen antes del detalle (benchmark: Plausible Analytics).
- Solo tablas, sin gráficos (decisión de arquitectura de `admin`, ADR-014).
- REQ-008: «Próximos» del encabezado lleva el contador de fallas de generación activas, igual que en el resto de las pantallas.
- REQ-011: se agrega `tabla-diarios`. C-46 pide los jugadores diarios por juego y la pantalla no los tenía. Va primera y a todo el ancho porque tiene 7 columnas.
- REQ-011: el rango por defecto son los últimos 30 días UTC, el tope es 366 días y no se aceptan fechas futuras. Las reglas están a la vista en `nota-rango` y cada motivo tiene su propio mensaje.
- REQ-011: el rango va en la URL para poder volver al mismo corte o compartirlo con uno mismo.
- REQ-011: el estado vacío deja de ocultar las tablas. Cada tabla dependiente del rango muestra «Sin datos en el rango.» (CA 19) y la de rachas sigue con datos, porque es una foto a hoy. Por eso desaparece `estado-vacio`, que tapaba una tabla con datos.
- REQ-011: cada tabla define su métrica en un pie de tabla (cohorte, tramos, anuladas, total no sumable), porque el flujo 5 deja como riesgo una cifra que no cuadra sin otra fuente dentro del admin.
- REQ-011: porcentajes con un decimal («96,7 %») y «—» cuando el divisor es 0 o el día todavía no terminó (CA 15, 16).
- REQ-011: la calidad por desafío se ordena por columna con botones en los encabezados, sin una librería de tablas. Suma «Iniciadas», «Terminadas» y «Estado» (publicado / anulado), que el diseño técnico expone.
- REQ-012 (S-068, implementado fuera del workflow): jugadores diarios y calidad se paginan de a 15 filas en el cliente (`Pagination` / `usePagination` comunes del admin), porque un rango de 366 días daba cientos de filas seguidas. Retención y rachas no se paginan. El encabezado suma «Bancos».

**Alternativas descartadas:**
- Selector de rangos predefinidos (7/30/90 días): el PRD define `from` y `to` libres.
- Un único mensaje «Sin datos en el rango» en lugar de las tablas: ocultaba la distribución de rachas, que no depende del rango.
- Enlace desde la fila de calidad a Reportes o al desafío: REQ-011 no lo pide y suma una relación P-05 → P-02 sin un caso de uso relevado.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-46 · flujo 5 de `user-flows.md`.
- REQ-011: RF 11-16 · CA 13-21, 26, 30 · decisiones 1-5 del diseño técnico.
- REQ-012: S-068 (paginado y nav).
