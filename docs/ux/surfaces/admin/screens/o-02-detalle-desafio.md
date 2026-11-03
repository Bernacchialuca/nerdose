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
version: "1.0"
date: 2026-11-03
overlay: true
overlay_type: drawer
triggered_by: reportes
---

# Pantalla: O-02 · Detalle del desafío

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Revisar un desafío (solución, ES y EN lado a lado, log de verificación) y actuar según el origen: resolver/descartar/anular desde Reportes, regenerar desde Próximos.
- **Viewports:**
  - **desktop** — Drawer ancho (panel lateral) con ES y EN lado a lado (6/6); el contenido de acciones cambia según el origen. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- `reportes` · fila del grupo
- `proximos-desafios` · celda de juego/día

**Salidas user-driven:**
- A `o-01-anular-desafio` · «Anular»
- A `o-03-regenerar-desafio` · «Regenerar»
- A `reportes` · «Resolver», «Descartar» o cerrar

**Salidas automáticas:**
- A `login` · `401` por token vencido (borra el token).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Título del drawer |
| 2 | estado | chips | — | content | desktop | — | Estado y fecha del desafío |
| 3 | preview-es | image | — | content | desktop | — | Preview del `client` en modo solución (ES) |
| 4 | preview-en | image | — | content | desktop | — | Preview del `client` en modo solución (EN) |
| 5 | log-verificacion | list | — | content | desktop | — | Log de verificación |
| 6 | lista-reportes | list | — | content | desktop | visible_only_in_states: default, terminal, loading, error de sistema | Motivos, mensajes y contexto de cada reporte |
| 7 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga del detalle |
| 8 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla al cargar el detalle |
| 9 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 10 | btn-resolver | button | variant=secondary | input | desktop | visible_only_in_states: default, terminal, loading, error de sistema; state_overrides: terminal, loading, error de sistema | Pasa los reportes a `resolved` |
| 11 | btn-descartar | button | variant=secondary | input | desktop | visible_only_in_states: default, terminal, loading, error de sistema; state_overrides: terminal, loading, error de sistema | Pasa los reportes a `dismissed` |
| 12 | btn-anular | button | variant=error | input | desktop | visible_only_in_states: default, terminal, loading, error de sistema; state_overrides: terminal, loading, error de sistema | Abre O-01 (solo `published`) |
| 13 | btn-regenerar | button | variant=primary | input | desktop | visible_only_in_states: desde próximos | Abre O-03 (solo `approved` con fecha futura) |

## Layout por viewport

### desktop · 1200px
- row `cabecera`
  - col 12/12:
    - estado
    - cargando
    - alerta-sistema
    - btn-reintentar
- row `previews`
  - col 6/12 (card):
    - preview-es
  - col 6/12 (card):
    - preview-en
- row `verificacion` (card, título «Log de verificación»)
  - col 12/12:
    - log-verificacion
- row `reportes` (card, título «Reportes del desafío»)
  - col 12/12:
    - lista-reportes
- row `acciones`
  - col 3/12:
    - btn-resolver
  - col 3/12:
    - btn-descartar
  - col 3/12:
    - btn-anular
  - col 3/12:
    - btn-regenerar

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: Devdle #128
- Icono: close
- Annotation: nada

### estado
- Texto/label: Publicado, 2026-11-03
- Icono: nada
- Annotation: nada

### preview-es
- Texto/label: Preview ES · solución
- Icono: nada
- Annotation: nada

### preview-en
- Texto/label: Preview EN · solución
- Icono: nada
- Annotation: nada

### log-verificacion
- Texto/label: Solución verificada, Traducción ES/EN consistente
- Icono: nada
- Annotation: nada

### lista-reportes
- Texto/label: wrong_answer · es, ambiguous · en, wrong_answer · es
- Icono: nada
- Annotation: nada

### cargando
- Texto/label: Cargando desafío…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar el desafío. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### btn-resolver
- Texto/label: Resolver
- Icono: check
- Annotation: nada

### btn-descartar
- Texto/label: Descartar
- Icono: x
- Annotation: nada

### btn-anular
- Texto/label: Anular
- Icono: warning
- Annotation: nada

### btn-regenerar
- Texto/label: Regenerar
- Icono: refresh
- Annotation: solo `approved` con fecha posterior a hoy

## Estados

### default
- Aplica: Sí
- Mensaje: Detalle desde Reportes: solución, ES/EN, log, reportes y acciones resolver/descartar/anular.
- Cambios:
  - ninguno respecto de default.

### desde próximos
- Aplica: Sí
- Mensaje: Detalle desde Próximos: solución, ES/EN y log, con la acción regenerar.
- Cambios:
  - lista-reportes y acciones de reportes: ocultas.
  - btn-regenerar: visible solo acá.

### loading
- Aplica: Sí
- Mensaje: Cargando desafío…
- Cambios:
  - cargando: visible solo acá.
  - acciones: variant="disabled".

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar el desafío. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá.
  - acciones deshabilitadas: no se anula sin ver el desafío (hipótesis).

### terminal
- Aplica: Sí
- Mensaje: Desafío ya anulado o cerrado: solo lectura.
- Cambios:
  - btn-resolver, btn-descartar y btn-anular: variant="disabled"; btn-anular explica por qué.

## Interacciones

**Eventos:**
- btn-anular · on click → abre `o-01-anular-desafio`
- btn-regenerar · on click → abre `o-03-regenerar-desafio`
- btn-resolver / btn-descartar · on click → transición del reporte (`open` → `resolved`/`dismissed`) y vuelve a `reportes`

**Validaciones:**
- Resolver/descartar solo sobre reportes `open`; si ya no lo está, se refresca el estado.

**Feedback:**
- Los estados `resolved`/`dismissed` son terminales: no se pueden reabrir y la pantalla lo indica antes de actuar.

## Accesibilidad

- **Orden de foco:** previews → log → reportes → acciones.
- **Foco y teclado:** rol `dialog` no modal en panel lateral; Esc cierra y devuelve el foco a la fila o celda.

## Decisiones y descartes

**Decisiones tomadas:**
- Un solo componente con dos orígenes: lo que cambia es el conjunto de acciones.
- ES y EN lado a lado para comparar traducciones sin alternar pestañas.

**Alternativas descartadas:**
- Pestañas ES/EN: obligan a recordar lo que se vio en la otra (relevante solo si hubiera mobile).

**Preguntas abiertas:**
- ¿El log de verificación hace falta desde Reportes? (pregunta 2 del product-map).

## Trazabilidad

- C-39, C-40, C-41, C-43, C-44 · flujos 2, 3 y 4 de `user-flows.md`.
