---
name: o-02-detalle-desafio
surface: admin
route: (overlay de `reportes` y `proximos-desafios`)
viewports:
  - desktop
audiences:
  - responsable
fidelity: mid
status: diseñada
version: "1.1"
date: 2026-11-11
overlay: true
overlay_type: drawer
triggered_by: reportes
---

# Pantalla: O-02 · Detalle del desafío

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Revisar un desafío (solución completa en ES y EN lado a lado, log de verificación) y actuar según el origen: resolver o descartar cada reporte y anular desde Reportes; regenerar desde Próximos (FG-7).
- **Viewports:**
  - **desktop** — Drawer ancho (panel lateral) con ES y EN lado a lado (6/6); el contenido de acciones cambia según el origen. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- `reportes` · fila del grupo (trae el desafío y sus reportes del filtro activo)
- `proximos-desafios` · celda de juego/día (FG-7)

**Salidas user-driven:**
- A `o-01-anular-desafio` · «Anular desafío» (solo `published`)
- A `o-03-regenerar-desafio` · «Regenerar» (desde Próximos, FG-7)
- A `reportes` · cierre (ícono, Escape)

**Salidas automáticas:**
- A `login` · `401 unauthorized` (borra el token).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Título del drawer y cierre |
| 2 | estado | chips | — | content | desktop | state_overrides: anulado | Juego, número, fecha, estado y alerta del desafío |
| 3 | motivo-anulacion | paragraph | body | content | desktop | visible_only_in_states: anulado | Motivo y fecha de una anulación ya hecha |
| 4 | alerta-desactualizado | alert | warning | feedback | desktop | visible_only_in_states: reporte ya cerrado | El reporte cambió en otra pestaña |
| 5 | payload-es | list | — | content | desktop | hidden_in_states: loading, error de sistema | Textos y solución en español |
| 6 | payload-en | list | — | content | desktop | hidden_in_states: loading, error de sistema | Textos y solución en inglés |
| 7 | payload-comun | list | — | content | desktop | hidden_in_states: loading, error de sistema | Datos del desafío que no dependen del idioma (clave · valor) |
| 8 | log-verificacion | list | — | content | desktop | hidden_in_states: loading, error de sistema | Log de verificación |
| 9 | lista-reportes | list | — | content | desktop | hidden_in_states: desde próximos, loading, error de sistema | Cada reporte con motivo, mensaje, idioma, contexto, jugador y fecha |
| 10 | btn-resolver | button | variant=secondary | input | desktop | hidden_in_states: desde próximos, loading, error de sistema; state_overrides: resolviendo | Pasa un reporte `open` a `resolved` (por reporte) |
| 11 | btn-descartar | button | variant=tertiary | input | desktop | hidden_in_states: desde próximos, loading, error de sistema | Pasa un reporte `open` a `dismissed` (por reporte) |
| 12 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga del detalle |
| 13 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla al cargar el detalle o al cambiar un reporte |
| 14 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 15 | btn-anular | button | variant=error | input | desktop | hidden_in_states: desde próximos, loading, error de sistema; state_overrides: anulado | Abre O-01 (solo `published`) |
| 16 | btn-regenerar | button | variant=primary | input | desktop | visible_only_in_states: desde próximos | Abre O-03 (solo `approved` con fecha futura; FG-7) |

## Layout por viewport

### desktop · 1200px
- row `cabecera`
  - col 12/12:
    - estado
    - motivo-anulacion
    - alerta-desactualizado
    - cargando
    - alerta-sistema
    - btn-reintentar
- row `solucion`
  - col 6/12 (card, título «ES»):
    - payload-es
  - col 6/12 (card, título «EN»):
    - payload-en
- row `datos` (card, título «Datos del desafío»)
  - col 12/12:
    - payload-comun
- row `verificacion` (card, título «Log de verificación»)
  - col 12/12:
    - log-verificacion
- row `reportes` (card, título «Reportes (3)»)
  - col 8/12:
    - lista-reportes
  - col 2/12:
    - btn-resolver
  - col 2/12:
    - btn-descartar
- row `acciones`
  - col 9/12: (vacía)
  - col 3/12:
    - btn-anular
    - btn-regenerar

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: Devdle #8
- Icono: close
- Annotation: `h2` del drawer

### estado
- Texto/label: Devdle, #8, 2026-11-08, publicado, alertado
- Icono: nada
- Annotation: «alertado» solo si el desafío alcanzó el umbral (`alerted_at`), con la fecha en el `title`; en `anulado` el chip de estado dice «anulado»

### motivo-anulacion
- Texto/label: Anulado el 2026-11-08 14:32 · definición incorrecta
- Icono: warning
- Annotation: `voided_at` y `void_reason`

### alerta-desactualizado
- Texto/label: Este reporte ya estaba cerrado. Actualizamos la lista.
- Icono: nada
- Annotation: respuesta `409 report_not_open` o `404 not_found`; la lista se recarga

### payload-es
- Texto/label: Palabra: REDIS · Categoría: bases de datos · Definición: Almacén de datos en memoria… · Resumen: …
- Icono: nada
- Annotation: vista genérica del `payload` (`PayloadView`): cada campo `{ es, en }` se muestra en su columna, como texto plano. La preview del `client` del juego en modo solución reemplaza esta vista en FG-7

### payload-en
- Texto/label: Word: REDIS · Category: databases · Definition: In-memory data store… · Summary: …
- Icono: nada
- Annotation: misma estructura que la columna ES, alineada fila a fila para comparar la traducción

### payload-comun
- Texto/label: term_id: 3f2a… · length: 5 · seed: 8812…
- Icono: nada
- Annotation: el resto del `payload` como lista clave · valor; los culpables posibles (`culprits`) se muestran con su nombre («Término · REDIS»)

### log-verificacion
- Texto/label: Solución verificada, Traducción ES/EN consistente
- Icono: check
- Annotation: `verification` del desafío

### lista-reportes
- Texto/label: Respuesta incorrecta · es · hace 2 h · jugador a1b2c3d4 · «dos palabras posibles» · partida en curso, Chrome 130 / Ambiguo · en · hace 5 h · jugador 9f0e1d2c · (sin mensaje) · partida terminada, Safari 18 / Traducción · es · ayer · jugador 77aa01bc · «la definición en inglés dice otra cosa» · partida terminada, Firefox 132
- Icono: nada
- Annotation: por reporte: motivo traducido, idioma, fecha, `player_ref` (8 caracteres, nunca el id del jugador), mensaje como texto plano (sin HTML) y contexto (estado de la partida, lenguaje de código si aplica, navegador). Los reportes ya cerrados muestran su estado («resuelto», «descartado») en lugar de las acciones

### btn-resolver
- Texto/label: Resolver
- Icono: check
- Annotation: una por reporte `open`; `PATCH /api/admin/reports/{id}` con `resolved`

### btn-descartar
- Texto/label: Descartar
- Icono: x
- Annotation: una por reporte `open`; `PATCH /api/admin/reports/{id}` con `dismissed`

### cargando
- Texto/label: Cargando desafío…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar el desafío. Probá de nuevo.
- Icono: nada
- Annotation: al fallar un cambio de reporte: «No pudimos actualizar el reporte. Probá de nuevo.» (la fila conserva su estado)

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### btn-anular
- Texto/label: Anular desafío
- Icono: warning
- Annotation: solo con el desafío `published`; deshabilitado en otro estado, con el motivo al lado

### btn-regenerar
- Texto/label: Regenerar
- Icono: refresh
- Annotation: solo `approved` con fecha posterior a hoy (FG-7)

## Estados

### default
- Aplica: Sí
- Mensaje: Detalle desde Reportes: solución ES/EN, datos, log, reportes con resolver/descartar y «Anular desafío».
- Cambios:
  - ninguno respecto de default.

### resolviendo
- Aplica: Sí (sub-estado de default)
- Mensaje: Resolviendo…
- Cambios:
  - btn-resolver: variant="disabled", content="Resolviendo…" (solo en la fila que se está cambiando)

### reporte ya cerrado
- Aplica: Sí (sub-estado de default)
- Mensaje: Este reporte ya estaba cerrado. Actualizamos la lista.
- Cambios:
  - alerta-desactualizado: visible solo acá.

### anulado
- Aplica: Sí
- Mensaje: Desafío anulado: solo lectura.
- Cambios:
  - estado: content="Devdle, #8, 2026-11-08, anulado"
  - motivo-anulacion: visible solo acá.
  - btn-anular: variant="disabled", annotation="Solo se anulan desafíos publicados."
  - lista-reportes: los reportes quedaron resueltos por la anulación y se muestran como «resuelto».

### desde próximos
- Aplica: Sí
- Mensaje: Detalle desde Próximos: solución ES/EN, datos y log, con la acción regenerar (FG-7).
- Cambios:
  - lista-reportes, btn-resolver, btn-descartar y btn-anular: ocultos.
  - btn-regenerar: visible solo acá.

### loading
- Aplica: Sí
- Mensaje: Cargando desafío…
- Cambios:
  - cargando: visible solo acá.
  - contenido y acciones: ocultos.

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar el desafío. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá.
  - contenido y acciones: ocultos (no se anula sin ver el desafío).

## Interacciones

**Eventos:**
- btn-resolver / btn-descartar · on click → cambia ese reporte (`open` → `resolved`/`dismissed`), recarga la cola y el contador; el drawer sigue abierto. Cuando no quedan reportes en el estado filtrado, el grupo sale de la cola y el drawer muestra los reportes con su nuevo estado
- respuesta `409 report_not_open` o `404 not_found` → estado `reporte ya cerrado` y recarga
- btn-anular · on click → abre `o-01-anular-desafio` con el desafío y sus `culprits`
- btn-regenerar · on click → abre `o-03-regenerar-desafio` (FG-7)

**Validaciones:**
- Resolver y descartar solo sobre reportes `open`; los estados son terminales y no se reabren.

**Feedback:**
- Resolver y descartar no piden confirmación: no tocan el desafío ni las partidas (CA 15). El estado nuevo se ve en la fila.

## Accesibilidad

- **Orden de foco:** cierre → solución ES → solución EN → datos → log → reportes (por reporte: Resolver → Descartar) → Anular desafío.
- **Landmarks y jerarquía:** rol `dialog` con título «Devdle #8»; cada reporte es un `article` con su motivo como encabezado.
- **Foco y teclado:** Esc cierra y devuelve el foco a la fila de la cola; tras resolver o descartar, el foco pasa al siguiente reporte abierto.
- **Propio de esta composición:** el mensaje del jugador se muestra como texto plano: nunca se interpreta como HTML.

## Decisiones y descartes

**Decisiones tomadas:**
- Un solo componente con dos orígenes: lo que cambia es el conjunto de acciones.
- ES y EN lado a lado para comparar traducciones sin alternar pestañas.
- REQ-007: en lugar de la preview del `client` del juego se muestra `PayloadView`, una vista genérica del `payload` con los campos `{ es, en }` en dos columnas y el resto como clave · valor. El contrato de props del `client` en modo solución es de FG-7 y C-39 se cumple con la solución completa en ES y EN (decisión 12 del diseño técnico).
- REQ-007: resolver y descartar son por reporte (C-40), no por grupo: cada reporte puede tener un veredicto distinto.
- REQ-007: el log de verificación también se muestra desde Reportes (resuelve la pregunta 2 del product-map): ayuda a decidir si el error es del generador.
- REQ-007: el jugador se identifica con `player_ref` (8 caracteres), suficiente para ver si dos reportes son de la misma persona sin exponer su id.

**Alternativas descartadas:**
- Pestañas ES/EN: obligan a recordar lo que se vio en la otra (relevante solo si hubiera mobile).
- Resolver/descartar en bloque por grupo: C-40 es por reporte y anular ya resuelve todos los abiertos.
- Preview del `client` en este request: su contrato no está cerrado y es parte de FG-7.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-39, C-40, C-41, C-43, C-44 · REQ-007 (RF 6, 7; CA 14-16) · flujos 2, 3 y 4 de `user-flows.md`.
