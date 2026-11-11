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
version: "1.1"
date: 2026-11-11
---

# Pantalla: P-02 · Reportes

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Cola de reportes agrupados por desafío (alertados primero, luego los más reportados), filtro por estado, acceso al detalle y a anular. Como no hay mail (ADR-017), esta pantalla es el único aviso de un desafío alertado.
- **Viewports:**
  - **desktop** — Encabezado fijo de una fila y un panel único con filtro y tabla de grupos a todo el ancho, sin paginación; es la pantalla de aterrizaje de `/`. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- `/` (redirección)
- `login` · «Ingresar»
- Encabezado · «Reportes»
- `o-01-anular-desafio` · confirmación (con el aviso de anulación confirmada)
- `o-02-detalle-desafio` · cierre

**Salidas user-driven:**
- A `o-02-detalle-desafio` · clic en la fila del grupo
- A `o-01-anular-desafio` · acción «Anular» de la fila (solo desafío `published`; el recorrido recomendado pasa por el detalle)
- A `proximos-desafios`, `stock-contenido`, `metricas` · encabezado (cuando existan: FG-7 y FG-10)
- A `login` · «Cerrar sesión»

**Salidas automáticas:**
- A `login` · `401 unauthorized` en cualquier petición (borra el token, limpia los datos en memoria y muestra «La sesión venció, ingresá de nuevo»).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Marca del panel |
| 2 | nav-reportes | link | — | navigation | desktop | — | Navegación a Reportes, con el contador de grupos abiertos |
| 3 | nav-proximos | link | — | navigation | desktop | — | Navegación a Próximos (FG-7) |
| 4 | nav-stock | link | — | navigation | desktop | — | Navegación a Stock (FG-7) |
| 5 | nav-metricas | link | — | navigation | desktop | — | Navegación a Métricas (FG-10) |
| 6 | nav-cerrar-sesion | link | — | navigation | desktop | — | Cierra la sesión: borra el token y va a Login |
| 7 | titulo | heading | h1 | content | desktop | — | Título |
| 8 | subtitulo | paragraph | caption | content | desktop | — | Criterio de orden de la cola |
| 9 | alerta-anulado | alert | success | feedback | desktop | visible_only_in_states: anulación confirmada | Confirma la anulación recién hecha y cuántas partidas afectó |
| 10 | tabs-estado | tabs | active=0 | navigation | desktop | state_overrides: resueltos, descartados | Filtro de estado (default `open`) |
| 11 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de carga distinta de «sin datos» |
| 12 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 13 | estado-vacio | empty-state | — | feedback | desktop | visible_only_in_states: empty | Cola sin reportes en el estado filtrado |
| 14 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga de la cola |
| 15 | tabla-grupos | table | — | content | desktop | hidden_in_states: empty, loading, error de sistema; state_overrides: resueltos, descartados | Un grupo por desafío; la fila abre el detalle |

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
  - col 2/12: (vacía)
  - col 2/12:
    - nav-cerrar-sesion
- row `titulos`
  - col 12/12:
    - titulo
    - subtitulo
    - alerta-anulado
- row `panel-reportes` (card, título «Grupos de reportes»)
  - col 12/12:
    - tabs-estado
    - alerta-sistema
    - btn-reintentar
    - estado-vacio
    - cargando
    - tabla-grupos

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: > nerdose admin
- Icono: settings
- Annotation: nada

### nav-reportes
- Texto/label: Reportes (3)
- Icono: nada
- Annotation: sección actual; el número es la cantidad de grupos con reportes abiertos (se refresca al resolver, descartar o anular)

### nav-proximos
- Texto/label: Próximos
- Icono: nada
- Annotation: no se renderiza en REQ-007; se suma con FG-7

### nav-stock
- Texto/label: Stock
- Icono: nada
- Annotation: no se renderiza en REQ-007; se suma con FG-7

### nav-metricas
- Texto/label: Métricas
- Icono: nada
- Annotation: no se renderiza en REQ-007; se suma con FG-10

### nav-cerrar-sesion
- Texto/label: Cerrar sesión
- Icono: lock
- Annotation: descarta el token en el navegador (sin llamada al servidor)

### titulo
- Texto/label: Reportes
- Icono: nada
- Annotation: nada

### subtitulo
- Texto/label: Agrupados por desafío · alertados primero, después los más reportados y los más recientes
- Icono: nada
- Annotation: nada

### alerta-anulado
- Texto/label: Devdle #8 anulado · 15 partidas afectadas. Los reportes abiertos quedaron resueltos.
- Icono: check
- Annotation: `role=status`; usa `affected_plays` de la respuesta; se descarta al cambiar de filtro o al cerrar

### tabs-estado
- Texto/label: Abiertos, Resueltos, Descartados
- Icono: nada
- Annotation: default: Abiertos (`open`). Cada pestaña muestra los grupos con al menos un reporte en ese estado; el conteo y los motivos cuentan solo los de ese estado

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
- Icono: check
- Annotation: en Resueltos: «Todavía no hay reportes resueltos.»; en Descartados: «Todavía no hay reportes descartados.»

### cargando
- Texto/label: Cargando reportes…
- Icono: nada
- Annotation: nada

### tabla-grupos
- Texto/label: ver columnas
- Icono: nada
- Annotation: orden fijo: alertados primero, luego cantidad de reportes descendente, luego fecha del desafío más reciente (sin orden por columna ni paginación en v1). La fila alertada lleva la etiqueta «alertado» (texto + color ámbar, no solo color). Clic o Enter en la fila → detalle; acción «Anular» al final de la fila solo con el desafío `published`
- Columnas: Alerta, Desafío, Fecha, Reportes, Motivos, Último reporte, Estado del desafío, Acción
- Filas de ejemplo: «alertado · Grep Grid #8 · 2026-11-08 · 3 · Respuesta incorrecta ×3 · hace 2 h · publicado · Anular» / «— · Devdle #7 · 2026-11-07 · 5 · Ambiguo ×3, Traducción ×2 · hace 1 día · publicado · Anular» / «— · Tech Timeline #6 · 2026-11-06 · 1 · Error de visualización ×1 · hace 3 días · anulado · —»

## Estados

### default
- Aplica: Sí
- Mensaje: Cola de grupos con filtro «Abiertos».
- Cambios:
  - ninguno respecto de default.

### anulación confirmada
- Aplica: Sí (sub-estado de default)
- Mensaje: Devdle #8 anulado · 15 partidas afectadas. Los reportes abiertos quedaron resueltos.
- Cambios:
  - alerta-anulado: visible solo acá.
  - tabla-grupos: el grupo anulado ya no figura en «Abiertos».

### empty
- Aplica: Sí
- Mensaje: No hay reportes abiertos. Todo al día.
- Cambios:
  - estado-vacio: visible solo acá.
  - tabla-grupos: oculta.

### loading
- Aplica: Sí
- Mensaje: Cargando reportes…
- Cambios:
  - cargando: visible solo acá.
  - tabla-grupos: oculta.

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar los reportes. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá.
  - tabla-grupos: oculta (no se muestran cifras viejas como actuales).

### resueltos
- Aplica: Sí
- Mensaje: Grupos con reportes resueltos, solo lectura.
- Cambios:
  - tabs-estado: active=1 (Resueltos).
  - tabla-grupos: grupos con reportes resueltos (incluye los resueltos por una anulación); la acción «Anular» solo aparece si el desafío sigue `published`.

### descartados
- Aplica: Sí
- Mensaje: Grupos con reportes descartados, solo lectura.
- Cambios:
  - tabs-estado: active=2 (Descartados).
  - tabla-grupos: grupos con reportes descartados.

## Interacciones

**Eventos:**
- tabs-estado · on change → `GET /api/admin/reports?status=…` con el estado elegido
- tabla-grupos · on click fila → abre `o-02-detalle-desafio` con el grupo
- tabla-grupos · acción «Anular» de la fila → abre `o-01-anular-desafio` (solo `published`)
- btn-reintentar · on click → reconsulta
- nav-cerrar-sesion · on click → borra el token y va a `login`
- al confirmar una anulación o resolver/descartar en el detalle → se recarga la cola y el contador del encabezado

**Validaciones:**
- Ninguna: no hay campos de entrada.

**Feedback:**
- Un `401` en cualquier petición borra el token y redirige a `login` con «La sesión venció, ingresá de nuevo».
- El contador del encabezado («Reportes (3)») refleja los grupos con reportes abiertos.

## Accesibilidad

- **Orden de foco:** encabezado → tabs-estado → tabla-grupos (fila → acción «Anular»).
- **Landmarks y jerarquía:** `nav` para el encabezado, `main` con un h1; la tabla tiene `caption` y encabezados de columna; la fila abre el detalle con Enter.
- **Foco y teclado:** al cerrar el detalle o el modal, el foco vuelve a la fila; tras anular, el foco va al aviso de anulación confirmada.
- **Propio de esta composición:** «alertado» es texto además de color; el contador del encabezado tiene `aria-label` «3 grupos de reportes abiertos».

## Decisiones y descartes

**Decisiones tomadas:**
- Un grupo por desafío. Los alertados van primero, después la cantidad de reportes y después la fecha: la primera fila es la más urgente (REQ-007, CA 14).
- Las etiquetas del encabezado coinciden con los títulos de pantalla.
- La anulación queda a una fila de distancia, pero el recorrido recomendado pasa por el detalle para ver la solución primero.
- REQ-007: sin paginación en v1 (volumen bajo, supuesto del request); se quita `paginacion`.
- REQ-007: el encabezado solo muestra Reportes (con el contador de grupos abiertos) y Cerrar sesión. Próximos, Stock y Métricas siguen en el diseño y se renderizan con FG-7 y FG-10. Esto resuelve la pregunta 1 del product-map para reportes: el contador es el aviso, porque no hay mail.
- REQ-007: tras anular, un aviso confirma la anulación con la cantidad de partidas afectadas. El grupo desaparece de «Abiertos», y sin el aviso no quedaría rastro visible de que la acción ocurrió.
- REQ-007: se suma la pestaña «Descartados» como estado propio (antes solo estaba «resueltos»).

**Alternativas descartadas:**
- Cola estilo bandeja con vista previa inline: se descartó (benchmark: Modqueue de Reddit, a evitar).
- Orden configurable por columna: el orden fijo ya pone primero lo urgente y no hay volumen que lo justifique.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla. Resolver o descartar en bloque quedó descartado: C-40 es por reporte (REQ-007).

## Trazabilidad

- C-37, C-39, C-40, C-41 · REQ-007 (RF 6, 7, 12; CA 13-16) · flujos 2 y 3 de `user-flows.md`.
