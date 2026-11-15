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
version: "1.4"
date: 2026-11-14
overlay: true
overlay_type: drawer
triggered_by: reportes
---

# Pantalla: O-02 · Detalle del desafío

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Revisar un desafío (solución completa en ES y EN lado a lado, log de verificación) y actuar según el origen: resolver o descartar cada reporte y anular desde Reportes; desde Próximos, ver el desafío como lo ve el jugador con la solución superpuesta, su estado de regeneración y si usa un ítem rechazado, y regenerarlo (REQ-008).
- **Viewports:**
  - **desktop** — Drawer ancho (panel lateral) con ES y EN lado a lado (6/6); el contenido de acciones cambia según el origen. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- `reportes` · fila del grupo (trae el desafío y sus reportes del filtro activo)
- `proximos-desafios` · celda de juego/día con desafío (REQ-008)

**Salidas user-driven:**
- A `o-01-anular-desafio` · «Anular desafío» (solo `published`)
- A `o-03-regenerar-desafio` · «Regenerar» (desde Próximos)
- A `reportes` o `proximos-desafios` · cierre (ícono, Escape), según el origen

**Salidas automáticas:**
- A `login` · `401 unauthorized` (borra el token).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Título del drawer y cierre |
| 2 | estado | chips | — | content | desktop | state_overrides: anulado, desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado | Juego, número, fecha, estado y alerta del desafío |
| 3 | motivo-anulacion | paragraph | body | content | desktop | visible_only_in_states: anulado | Motivo y fecha de una anulación ya hecha |
| 4 | alerta-desactualizado | alert | warning | feedback | desktop | visible_only_in_states: reporte ya cerrado | El reporte cambió en otra pestaña |
| 4a | alerta-item-rechazado | alert | warning | feedback | desktop | visible_only_in_states: ítem rechazado | El desafío usa un término o hecho que hoy está rechazado |
| 4b | alerta-regen-pendiente | alert | info | feedback | desktop | visible_only_in_states: regeneración pendiente | Hay una regeneración en curso para este desafío |
| 4c | alerta-regen-fallida | alert | error | feedback | desktop | visible_only_in_states: regeneración fallida | La última regeneración falló; queda el actual |
| 4d | datos-generacion | paragraph | caption | content | desktop | visible_only_in_states: desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado | Intento y versión del generador (el seed nunca se muestra) |
| 4e | preview-es | card | — | content | desktop | visible_only_in_states: desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado | Preview del juego en modo solución, en español |
| 4f | preview-en | card | — | content | desktop | visible_only_in_states: desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado | Preview del juego en modo solución, en inglés |
| 5 | payload-es | list | — | content | desktop | hidden_in_states: loading, error de sistema, desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado | Textos y solución en español |
| 6 | payload-en | list | — | content | desktop | hidden_in_states: loading, error de sistema, desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado | Textos y solución en inglés |
| 7 | payload-comun | list | — | content | desktop | hidden_in_states: loading, error de sistema | Datos del desafío que no dependen del idioma (clave · valor) |
| 8 | log-verificacion | list | — | content | desktop | hidden_in_states: loading, error de sistema | Log de verificación |
| 9 | lista-reportes | list | — | content | desktop | hidden_in_states: desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado, loading, error de sistema | Cada reporte con motivo, mensaje, idioma, contexto, jugador y fecha |
| 10 | btn-resolver | button | variant=secondary | input | desktop | hidden_in_states: desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado, loading, error de sistema; state_overrides: resolviendo | Pasa un reporte `open` a `resolved` (por reporte) |
| 11 | btn-descartar | button | variant=tertiary | input | desktop | hidden_in_states: desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado, loading, error de sistema | Pasa un reporte `open` a `dismissed` (por reporte) |
| 12 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga del detalle |
| 13 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla al cargar el detalle o al cambiar un reporte |
| 14 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 15 | btn-anular | button | variant=error | input | desktop | hidden_in_states: desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado, loading, error de sistema; state_overrides: anulado | Abre O-01 (solo `published`) |
| 16 | btn-regenerar | button | variant=primary | input | desktop | visible_only_in_states: desde próximos, regeneración pendiente, regeneración fallida, ítem rechazado; state_overrides: regeneración pendiente | Abre O-03 (solo `approved` con fecha futura y sin pedido pendiente) |

## Layout por viewport

### desktop · 1200px
- row `cabecera`
  - col 12/12:
    - estado
    - motivo-anulacion
    - alerta-desactualizado
    - alerta-item-rechazado
    - alerta-regen-pendiente
    - alerta-regen-fallida
    - datos-generacion
    - cargando
    - alerta-sistema
    - btn-reintentar
- row `solucion`
  - col 6/12 (card, título «ES»):
    - preview-es
    - payload-es
  - col 6/12 (card, título «EN»):
    - preview-en
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
- Annotation: «alertado» solo si el desafío alcanzó el umbral (`alerted_at`), con la fecha en el `title`; en `anulado` el chip de estado dice «anulado». Desde Próximos: «Grep Grid, #35, 2026-12-05, aprobado» (más «regenerando…», «regeneración fallida» o «usa un ítem rechazado» según el caso)

### motivo-anulacion
- Texto/label: Anulado el 2026-11-08 14:32 · definición incorrecta
- Icono: warning
- Annotation: `voided_at` y `void_reason`

### alerta-desactualizado
- Texto/label: Este reporte ya estaba cerrado. Actualizamos la lista.
- Icono: nada
- Annotation: respuesta `409 report_not_open` o `404 not_found`; la lista se recarga

### alerta-item-rechazado
- Texto/label: Este desafío usa un ítem rechazado: CAP theorem (definición incorrecta). No se regenera solo: regeneralo si no querés publicarlo.
- Icono: warning
- Annotation: `rejected_items` del desafío; un ítem por línea si hay varios

### alerta-regen-pendiente
- Texto/label: Regeneración pendiente desde las 14:02. Mientras tanto este desafío sigue aprobado y se publica tal cual si llega su fecha.
- Icono: nada
- Annotation: el drawer se actualiza con el polling de Próximos; si el reemplazo pasa la verificación, muestra el desafío nuevo

### alerta-regen-fallida
- Texto/label: La última regeneración falló a las 14:05: ningún reemplazo pasó la verificación (overlap_conflict). Queda este desafío.
- Icono: nada
- Annotation: `regeneration.error` y `processed_at`; se puede volver a regenerar

### datos-generacion
- Texto/label: Intento 3 · generator 1.4.0
- Icono: nada
- Annotation: `attempt` y `generator_version`; el seed derivado nunca se muestra

### preview-es
- Texto/label: Grilla 12 × 12 con las 8 palabras resaltadas · Lista: REDIS — almacén de datos en memoria…
- Icono: nada
- Annotation: `Preview` del `client` del juego en modo solución, solo lectura (no se juega ni se crea una partida). Devdle: la palabra con su categoría, definición y resumen. Grep Grid: la grilla con las 8 palabras resaltadas y la lista con definiciones. Tech Timeline: la consigna y los 5 hechos en el orden correcto con fecha y nota. Big O (REQ-009): la pregunta, el código con pestañas JavaScript / Go / Java (`code-block` `readonly` **en texto plano, sin resaltado**) con las líneas de `line_notes` resaltadas y su nota, la grilla de 8 opciones con la respuesta marcada («✓ correcta») y la `trap_option` marcada como «trampa» (borde punteado, sin relleno), y el panel con los pasos, «en números» y el consejo en el idioma de la columna; el código es el mismo en las dos columnas y lo que cambia es la explicación. Bug Hunt (REQ-010): la especificación, el código con pestañas JavaScript / Go / Java (`code-block` en texto plano, sin resaltado, como Big O) con las líneas no elegibles atenuadas y la línea del bug marcada «🐛 línea del bug», los chips «tipo: comparación» y «mutación: > → >=» (`mutation.from` → `to`; en el admin sí se muestra, porque es lo que se revisa ante un reporte), los tests visibles como llamadas, el test que falla (llamada, esperado y obtenido), el fix como diff de una línea del lenguaje de la pestaña y los pasos de «Por qué falla» en el idioma de la columna; el código, los tests y el fix son iguales en las dos columnas y cambian la especificación, el tipo y la explicación. Si el juego no tiene `Preview` en el admin, cae a la vista genérica del `payload`

### preview-en
- Texto/label: 12 × 12 grid with the 8 words highlighted · List: REDIS — in-memory data store…
- Icono: nada
- Annotation: misma preview con los textos en inglés, al lado de la española para comparar la traducción

### payload-es
- Texto/label: Palabra: REDIS · Categoría: bases de datos · Definición: Almacén de datos en memoria… · Resumen: …
- Icono: nada
- Annotation: vista genérica del `payload` (`PayloadView`): cada campo `{ es, en }` se muestra en su columna, como texto plano. Desde Próximos la reemplaza la preview del `client` (REQ-008); desde Reportes se mantiene

### payload-en
- Texto/label: Word: REDIS · Category: databases · Definition: In-memory data store… · Summary: …
- Icono: nada
- Annotation: misma estructura que la columna ES, alineada fila a fila para comparar la traducción

### payload-comun
- Texto/label: term_id: 3f2a… · length: 5 · categoría: databases
- Icono: nada
- Annotation: el resto del `payload` como lista clave · valor; los culpables posibles (`culprits`) se muestran con su nombre («Término · REDIS»)

### log-verificacion
- Texto/label: Solución verificada, Traducción ES/EN consistente
- Icono: check
- Annotation: `verification` del desafío, legible: cada verificación con su resultado; el seed derivado no se muestra. Big O (REQ-009) trae más checks y su `detail`: textos bilingües, forma del código, variedad de receta y de respuesta, ejecución en JavaScript, Go y Java (duración, o el motivo: `timeout`, `compile_error`, `runtime_error`, `toolchain_missing`, `output_too_large`), conteos que concuerdan y en rango, «en números» comprobado y el ajuste (escala de n, conteos y CV de cada modelo). El log genérico los muestra tal cual, en orden; el `detail` largo del ajuste se lee como texto plano monoespaciado, sin gráfico. Bug Hunt (REQ-010) lista sus checks con nombre estable y en orden: `texts_bilingual`, `code_shape`, `lines_consistent`, `tests_consistent`, `variety_combo`, `run_correct_{js,go,java}`, `run_mutant_{js,go,java}` (duración, o `kind (duración): primera línea de stderr`), `correct_agrees` y `mutant_agrees`; los que no corrieron porque falló uno anterior muestran `skipped` (CA 18, 19)

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
- Annotation: solo `approved` con fecha posterior a hoy y sin pedido pendiente; en `regeneración pendiente`, deshabilitado con «Regenerando…»

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
- Mensaje: Detalle desde Próximos: preview en modo solución ES/EN, datos, intento y log, con la acción regenerar.
- Cambios:
  - estado: content="Grep Grid, #35, 2026-12-05, aprobado"
  - header: content="Grep Grid #35"
  - preview-es, preview-en y datos-generacion: visibles (reemplazan a payload-es y payload-en).
  - lista-reportes, btn-resolver, btn-descartar y btn-anular: ocultos.
  - btn-regenerar: visible.

### regeneración pendiente
- Aplica: Sí (sub-estado de desde próximos)
- Mensaje: Regeneración pendiente desde las 14:02. Mientras tanto este desafío sigue aprobado y se publica tal cual si llega su fecha.
- Cambios:
  - estado: content="Grep Grid, #35, 2026-12-05, aprobado, regenerando…"
  - alerta-regen-pendiente: visible solo acá.
  - btn-regenerar: variant="disabled", content="Regenerando…".

### regeneración fallida
- Aplica: Sí (sub-estado de desde próximos)
- Mensaje: La última regeneración falló a las 14:05: ningún reemplazo pasó la verificación (overlap_conflict). Queda este desafío.
- Cambios:
  - estado: content="Grep Grid, #35, 2026-12-05, aprobado, regeneración fallida"
  - alerta-regen-fallida: visible solo acá.
  - btn-regenerar: habilitado (se puede volver a pedir).

### ítem rechazado
- Aplica: Sí (sub-estado de desde próximos)
- Mensaje: Este desafío usa un ítem rechazado: CAP theorem (definición incorrecta). No se regenera solo: regeneralo si no querés publicarlo.
- Cambios:
  - estado: content="Devdle, #35, 2026-12-05, aprobado, usa un ítem rechazado"
  - alerta-item-rechazado: visible solo acá.

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
- btn-regenerar · on click → abre `o-03-regenerar-desafio`; al confirmar, el drawer pasa a `regeneración pendiente`
- con una regeneración pendiente, el drawer se refresca con el polling de Próximos (5 s): si el reemplazo pasa, muestra el desafío nuevo; si falla, pasa a `regeneración fallida`; si el desafío dejó de estar en la ventana (llegó su fecha), se cierra y vuelve a Próximos

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

- REQ-008: desde Próximos, la solución se muestra con el `Preview` de cada juego (como lo ve el jugador, con la solución superpuesta) en ES y EN lado a lado, en lugar de `PayloadView` (decisión 10 del diseño técnico). Un juego sin `Preview` en el admin cae a `PayloadView`.
- REQ-008: se muestran el intento y la versión del generador, nunca el seed (CA 2).
- REQ-008: el estado de la regeneración (pendiente o fallida con su motivo) y el aviso de ítem rechazado viven en la cabecera del drawer, además de la celda.
- REQ-009: el `Preview` de Big O reutiliza el `code-block` del juego **en texto plano, sin resaltado de sintaxis** (decisión 13 del diseño técnico lo dejaba a la revisión UX): el responsable revisa el código y la explicación, no lo juega, y así el admin no carga Shiki. Marca la respuesta y también la `trap_option` como «trampa», porque es lo que el jugador va a confundir y lo que hay que revisar ante un reporte `ambiguous`. No se agregan bloques: es el mismo `preview-es` / `preview-en`.
- REQ-009: el log de verificación de Big O no tiene vista propia; el `VerificationLog` genérico ya lista cada check con su `detail` (CA 19). Si el detalle del ajuste resulta ilegible en uso real, se diseña una vista con `/product-ux-wireframes`.
- REQ-010: el `Preview` de Bug Hunt sigue el criterio de Big O (código en texto plano, sin Shiki) y muestra todo lo que el jugador ve al terminar más la mutación (`from` → `to`), que el jugador no ve: ante un reporte `wrong_answer` o `ambiguous` el responsable necesita la línea, el cambio aplicado, el test que falla y la especificación juntos para decidir si el bug es real o si la especificación es ambigua. No se agregan bloques: es el mismo `preview-es` / `preview-en`, y el log de verificación es el `VerificationLog` genérico (CA 19).

**Alternativas descartadas:**
- Pestañas ES/EN: obligan a recordar lo que se vio en la otra (relevante solo si hubiera mobile).
- Resolver/descartar en bloque por grupo: C-40 es por reporte y anular ya resuelve todos los abiertos.
- Preview del `client` en REQ-007: su contrato no estaba cerrado y era parte de FG-7.
- REQ-008: extender la preview a Reportes. El diseño técnico la carga solo en el módulo de Próximos; desde Reportes sigue `PayloadView` (ver pregunta abierta).

**Preguntas abiertas:**
- ¿La preview en modo solución debería reemplazar también a `PayloadView` desde Reportes? REQ-008 la limita a Próximos.

## Trazabilidad

- C-39, C-40, C-41, C-43, C-44 · REQ-007 (RF 6, 7; CA 14-16) · REQ-008 (RF 1-3; CA 2, 3, 6, 10) · REQ-009 (RF 14; CA 19) · REQ-010 (RF 14; CA 19, 20) · flujos 2, 3 y 4 de `user-flows.md`.
