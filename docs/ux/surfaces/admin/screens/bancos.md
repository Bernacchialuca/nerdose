---
name: bancos
surface: admin
route: /banks
viewports:
  - desktop
audiences:
  - responsable
fidelity: mid
status: diseñada
version: "1.0"
date: 2026-11-25
---

# Pantalla: P-06 · Bancos de contenido

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Consultar uno por uno los ítems de los bancos (términos para Devdle y Grep Grid, hechos para Tech Timeline): buscar un término o un hecho, ver si está aprobado o rechazado y por qué, cuándo lo usó cada juego y si Devdle lo excluye. Solo lectura: los bancos se cargan del dataset versionado (ADR-016).
- **Viewports:**
  - **desktop** — Título, pestañas por banco y un panel de filtros (búsqueda en 2/4, estado y categoría en 1/4 cada uno) sobre una tabla a todo el ancho con paginado al pie. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- Encabezado · «Bancos»
- `stock-contenido` · «Ver en Bancos →» del resumen de rechazados (`/banks?bank=<banco>&status=rejected`)
- URL directa con filtros (`/banks?bank=…&q=…&status=…&category=…&page=…`)

**Salidas user-driven:**
- A `reportes`, `proximos-desafios`, `stock-contenido`, `metricas` · encabezado
- A `login` · «Cerrar sesión»

**Salidas automáticas:**
- A `login` · sin sesión o `401` por token vencido (borra el token).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Marca del panel |
| 2 | nav-reportes | link | — | navigation | desktop | — | Navegación a Reportes, con el contador de grupos abiertos |
| 3 | nav-proximos | link | — | navigation | desktop | — | Navegación a Próximos, con el contador de fallas de generación activas |
| 4 | nav-bancos | link | — | navigation | desktop | — | Navegación a Bancos (sección actual) |
| 5 | nav-stock | link | — | navigation | desktop | — | Navegación a Stock |
| 6 | nav-metricas | link | — | navigation | desktop | — | Navegación a Métricas |
| 7 | nav-cerrar-sesion | link | — | navigation | desktop | — | Cierra la sesión: borra el token y va a Login |
| 8 | titulo | heading | h1 | content | desktop | — | Título |
| 9 | subtitulo | paragraph | caption | content | desktop | — | Qué juego usa cada banco y que es solo consulta |
| 10 | tabs-banco | tabs | active=0 | navigation | desktop | state_overrides: hechos | Términos / Hechos (Timeline) |
| 11 | campo-buscar | input | type=search | input | desktop | — | Búsqueda por texto del ítem (máx. 50) |
| 12 | select-estado | select | — | input | desktop | — | Todos / Aprobados / Rechazados |
| 13 | select-categoria | select | — | input | desktop | state_overrides: hechos | Todas o una categoría del banco activo |
| 14 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Primera carga |
| 15 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de carga |
| 16 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 17 | vacio | paragraph | body | feedback | desktop | visible_only_in_states: sin resultados | Ningún ítem cumple los filtros |
| 18 | tabla-items | table | — | content | desktop | hidden_in_states: loading, error de sistema, sin resultados; state_overrides: hechos, rechazados | Página de ítems del banco |
| 19 | paginado | pagination | — | navigation | desktop | hidden_in_states: loading, error de sistema, sin resultados | «‹ Anterior · 1–25 de 4.863 términos · página 1 de 195 · Siguiente ›» |

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
    - subtitulo
- row `pestanas`
  - col 12/12:
    - tabs-banco
- row `filtros` (card)
  - col 6/12:
    - campo-buscar
  - col 3/12:
    - select-estado
  - col 3/12:
    - select-categoria
- row `resultados`
  - col 12/12:
    - cargando
    - alerta-sistema
    - btn-reintentar
    - vacio
    - tabla-items
    - paginado

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

### nav-bancos
- Texto/label: Bancos
- Icono: nada
- Annotation: sección actual (`aria-current="page"`); entre Próximos y Stock

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
- Texto/label: Bancos de contenido
- Icono: nada
- Annotation: `<title>` «Bancos · Admin · nerdose»; recibe el foco al entrar

### subtitulo
- Texto/label: Los términos alimentan Devdle y Grep Grid; los hechos, Tech Timeline. Se cargan del dataset versionado: acá solo se consultan.
- Icono: nada
- Annotation: nada

### tabs-banco
- Texto/label: Términos · Hechos (Timeline)
- Icono: nada
- Annotation: componente `Tabs` del admin con etiqueta «Banco». Cambiar de pestaña limpia la búsqueda, el estado, la categoría y la página

### campo-buscar
- Texto/label: Buscar · placeholder «p. ej. kernel» (términos) / «p. ej. linux» (hechos)
- Icono: nada
- Annotation: busca «contiene», sin distinguir mayúsculas, sobre el término o el nombre del hecho (`ILIKE` con los comodines escapados en la API). Se aplica solo 300 ms después de dejar de tipear, o al instante con Enter; un texto vacío no filtra. Máximo 50 caracteres. Va dentro de un `form` con `role="search"` «Filtros del banco»

### select-estado
- Texto/label: Estado · Todos / Aprobados / Rechazados
- Icono: nada
- Annotation: nada

### select-categoria
- Texto/label: Categoría · Todas / Lenguajes / Git y wikis / Bases de datos / Redes / Linux y SO / APIs / Seguridad / Ingeniería de software
- Icono: nada
- Annotation: las categorías del banco activo; en `hechos`: Lenguajes / Frameworks / Empresas / Sistemas operativos / Hardware / Videojuegos / Bases de datos / Herramientas

### cargando
- Texto/label: Cargando…
- Icono: nada
- Annotation: solo en la primera carga; al paginar o filtrar se sigue viendo la página anterior (marcada `aria-busy`) hasta que llega la nueva, sin parpadeo

### alerta-sistema
- Texto/label: No pudimos cargar el banco. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### vacio
- Texto/label: Ningún ítem coincide con los filtros.
- Icono: nada
- Annotation: distinto de un error de carga; una página más allá del final también cae acá

### tabla-items
- Texto/label: ver columnas
- Icono: nada
- Annotation: una fila por ítem, en orden alfabético (`term`, o `label` y luego `id`). La primera celda (encabezado de fila) tiene el ítem en Mono, debajo su descripción (`definition.es` o `note.es`) y, si un juego lo excluye, la etiqueta «fuera de Devdle» (`excluded_from`, los 115 términos de nicho de REQ-012). «Estado»: «aprobado» o «rechazado» en texto (badge) y, si está rechazado, el motivo legible («poco conocido (sitelinks)», «excluido a mano», «fecha imprecisa»…; un motivo desconocido se muestra tal cual). «Último uso»: una línea por juego que consume el banco («Devdle: 20/11/2026 · Grep Grid: nunca»). Tabla dentro de una región con scroll alcanzable con teclado
- Columnas: Término, Categoría, Estado, Último uso, Sitelinks (en `hechos`: Hecho, Categoría, Fecha, Estado, Último uso, Sitelinks)
- Filas de ejemplo (ilustrativas): «KERNEL — núcleo de un sistema operativo… · Linux y SO · aprobado · Devdle: 02/11/2026, Grep Grid: nunca · 142» / «MALBOLGE — lenguaje esotérico… · fuera de Devdle · Lenguajes · aprobado · Devdle: nunca, Grep Grid: 15/10/2026 · 38» / «CACHE · Ingeniería de software · rechazado — poco conocido (sitelinks) · Devdle: nunca, Grep Grid: nunca · 9»

### paginado
- Texto/label: ‹ Anterior · 1–25 de 4.863 términos · página 1 de 195 · Siguiente ›
- Icono: nada
- Annotation: componente común `Pagination` del admin («Paginado del banco», resumen `aria-live="polite"`, `aria-disabled` en los extremos). Paginado en el servidor de a 25 (`page_size=25`); la página va en la URL. No se dibuja si todo entra en una página

## Estados

### default
- Aplica: Sí
- Mensaje: Primera página de términos, sin filtros.
- Cambios:
  - ninguno respecto de default.

### hechos
- Aplica: Sí
- Mensaje: Pestaña «Hechos (Timeline)».
- Cambios:
  - tabs-banco: active=1.
  - select-categoria: categorías de Tech Timeline.
  - tabla-items: suma la columna «Fecha» (`event_date`) y «Último uso» solo tiene Tech Timeline.

### rechazados
- Aplica: Sí
- Mensaje: Filtrado por rechazados (entrada desde «Ver en Bancos →» de Stock).
- Cambios:
  - select-estado: «Rechazados».
  - tabla-items: todas las filas con «rechazado» y su motivo.

### sin resultados
- Aplica: Sí
- Mensaje: Ningún ítem coincide con los filtros.
- Cambios:
  - vacio: visible solo acá; tabla-items y paginado ocultos.

### loading
- Aplica: Sí
- Mensaje: Cargando…
- Cambios:
  - cargando: visible solo acá; tabla y paginado ocultos.

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar el banco. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá; tabla y paginado ocultos.

## Interacciones

**Eventos:**
- tabs-banco · on change → `GET /api/admin/content/items?bank=<banco>&page=1&page_size=25`, sin filtros
- campo-buscar · on input → tras 300 ms sin tipear (o con Enter) escribe `q` en la URL, vuelve a la página 1 y consulta
- select-estado, select-categoria · on change → escriben el filtro en la URL, vuelven a la página 1 y consultan
- paginado · Anterior / Siguiente → escribe `page` en la URL y pide esa página
- btn-reintentar · on click → reconsulta

**Validaciones:**
- Filtros desde la URL: un `bank`, `status`, `category` (que no sea del banco activo) o `page` inválido cae al valor por defecto en lugar de romper la pantalla; `q` se recorta a 50 caracteres.
- La API responde `422 validation_error` ante un parámetro inválido (por ejemplo, una categoría de otro banco); la pantalla nunca lo pide porque normaliza antes.

**Feedback:**
- La búsqueda, el estado y la categoría cambian la URL con `replace` (no llenan el historial); cambiar de página o de pestaña sí agrega una entrada.
- Solo lectura: no hay acción de editar, aprobar ni rechazar.

## Accesibilidad

- **Orden de foco:** encabezado → pestañas → buscar → estado → categoría → tabla → paginado.
- **Landmarks y jerarquía:** `main` con un h1; los filtros son un `form` `role="search"` con `label` en cada control; la tabla tiene `caption` («Términos del banco» / «Hechos del banco») y el ítem como encabezado de fila.
- **Propio de esta composición:** «aprobado», «rechazado» y «fuera de Devdle» son texto además de color; el resumen del paginado se anuncia con `aria-live="polite"`.

## Decisiones y descartes

**Decisiones tomadas:**
- REQ-012 (S-067 y S-068, implementado fuera del workflow): pantalla nueva. La tabla de rechazados de Stock llegaba a cientos de filas y no se podía buscar; acá se ve todo el banco, con búsqueda y paginado en el servidor.
- Los filtros viven en la URL: Stock puede abrir la pantalla ya filtrada y recargar conserva lo consultado.
- Búsqueda con espera de 300 ms: no se pide una página por tecla.
- La pestaña cambia de banco y limpia los filtros, porque las categorías de un banco no existen en el otro.
- Se muestra «fuera de Devdle» para que el responsable entienda por qué un término aprobado nunca sale en Devdle (y por qué el stock de Devdle no lo cuenta).
- Mientras llega la página nueva se mantiene la anterior (`keepPreviousData`): la tabla no parpadea al paginar.

**Alternativas descartadas:**
- Mantener la tabla de rechazados en Stock con paginado: seguía sin búsqueda y solo mostraba los rechazados.
- Edición o aprobación manual desde acá: el contenido sale del dataset versionado (ADR-016); el admin no edita bancos.
- Paginado en el cliente: el banco de términos tiene miles de ítems.

**Preguntas abiertas:**
- ¿Hace falta ordenar por columna (por ejemplo, por sitelinks o por último uso)? Hoy el orden es alfabético fijo.

## Trazabilidad

- C-45 · ADR-016 · REQ-012 (S-067: `GET /api/admin/content/items` y `excluded_from`; S-068: pantalla y `Pagination`) · flujo 5 de `user-flows.md`.
