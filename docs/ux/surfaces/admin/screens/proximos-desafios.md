---
name: proximos-desafios
surface: admin
route: /upcoming
viewports:
  - desktop
audiences:
  - responsable
fidelity: mid
status: diseñada
version: "1.2"
date: 2026-11-14
---

# Pantalla: P-03 · Próximos desafíos

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Ver de un vistazo qué se publica desde mañana hasta los próximos 14 días en cada juego registrado: los días sin desafío (con su falla de generación), las regeneraciones pendientes o fallidas y los desafíos que usan un ítem rechazado; abrir el detalle y pedir una regeneración.
- **Viewports:**
  - **desktop** — Panel único a todo el ancho con la grilla día × juego como tabla; cada celda con desafío abre el detalle. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- Encabezado · «Próximos (n)»
- `o-03-regenerar-desafio` · confirmar o cancelar
- `o-02-detalle-desafio` · cierre

**Salidas user-driven:**
- A `o-02-detalle-desafio` · clic en una celda con desafío
- A `o-03-regenerar-desafio` · acción «Regenerar» de la celda (solo `approved` con fecha futura y sin regeneración pendiente)
- A `reportes`, `stock-contenido`, `metricas` · encabezado
- A `login` · «Cerrar sesión»

**Salidas automáticas:**
- A `login` · `401` por token vencido (borra el token).

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Marca del panel |
| 2 | nav-reportes | link | — | navigation | desktop | — | Navegación a Reportes, con el contador de grupos abiertos |
| 3 | nav-proximos | link | — | navigation | desktop | state_overrides: falla de generación | Navegación a Próximos, con el contador de fallas de generación activas |
| 4 | nav-stock | link | — | navigation | desktop | — | Navegación a Stock |
| 5 | nav-metricas | link | — | navigation | desktop | — | Navegación a Métricas (FG-10) |
| 6 | nav-cerrar-sesion | link | — | navigation | desktop | — | Cierra la sesión: borra el token y va a Login |
| 7 | titulo | heading | h1 | content | desktop | — | Título |
| 8 | subtitulo | paragraph | caption | content | desktop | — | Ventana (mañana a +14 días, UTC) y juegos registrados |
| 9 | leyenda | chips | — | content | desktop | — | Estados posibles de una celda |
| 10 | alerta-fallas | alert | warning | feedback | desktop | visible_only_in_states: falla de generación | Hay días sin desafío por una falla de generación |
| 11 | alerta-pendiente | alert | info | feedback | desktop | visible_only_in_states: regeneración pendiente | Hay una regeneración en curso |
| 12 | alerta-regeneracion | alert | error | feedback | desktop | visible_only_in_states: regeneración fallida | Una regeneración no pasó la verificación; queda el actual |
| 13 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de carga |
| 14 | btn-reintentar | button | variant=secondary | input | desktop | visible_only_in_states: error de sistema | Reintenta la carga |
| 15 | cargando | loader | — | feedback | desktop | visible_only_in_states: loading | Carga de la grilla |
| 16 | grilla | table | — | content | desktop | hidden_in_states: loading, error de sistema; state_overrides: falla de generación, regeneración pendiente, regeneración fallida | Grilla de 14 días × juegos registrados; la celda abre el detalle |

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
- row `panel-grilla` (card, título «Próximos 14 días»)
  - col 12/12:
    - leyenda
    - alerta-fallas
    - alerta-pendiente
    - alerta-regeneracion
    - alerta-sistema
    - btn-reintentar
    - cargando
    - grilla

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: > nerdose admin
- Icono: settings
- Annotation: nada

### nav-reportes
- Texto/label: Reportes (3)
- Icono: nada
- Annotation: cantidad de grupos con reportes abiertos (REQ-007)

### nav-proximos
- Texto/label: Próximos
- Icono: nada
- Annotation: sección actual. Con fallas de generación activas suma el contador: «Próximos (1)» (`GET /api/admin/generation-failures`, `aria-label` «1 falla de generación activa»). Sin fallas, sin número

### nav-stock
- Texto/label: Stock
- Icono: nada
- Annotation: nada

### nav-metricas
- Texto/label: Métricas
- Icono: nada
- Annotation: no se renderiza hasta FG-10

### nav-cerrar-sesion
- Texto/label: Cerrar sesión
- Icono: lock
- Annotation: nada

### titulo
- Texto/label: Próximos desafíos
- Icono: nada
- Annotation: nada

### subtitulo
- Texto/label: Del 2026-12-02 al 2026-12-15 (UTC) · 4 juegos · hoy no se muestra
- Icono: nada
- Annotation: la ventana va de mañana a hoy + 14; los juegos son los registrados (con REQ-009 se suma Big O; Bug Hunt se suma solo al registrarse)

### leyenda
- Texto/label: Aprobado, Sin desafío, Falla de generación, Regenerando…, Regeneración fallida, Usa un ítem rechazado
- Icono: nada
- Annotation: cada estado es texto además de color

### alerta-fallas
- Texto/label: 1 juego no tiene desafío para mañana: Devdle (2026-12-02), falla tras 20 intentos. Se reintenta en la próxima corrida.
- Icono: warning
- Annotation: fallas activas (fecha en la ventana y sin desafío aprobado). No hay mail (ADR-017): este aviso y el contador del encabezado son el único canal. Deja de mostrarse sola cuando una corrida posterior logra el desafío

### alerta-pendiente
- Texto/label: Hay una regeneración en curso. La grilla se actualiza sola cada 5 segundos.
- Icono: nada
- Annotation: el desafío actual sigue aprobado y se publica tal cual si llega su fecha antes del reemplazo

### alerta-regeneracion
- Texto/label: No se pudo regenerar Grep Grid del 2026-12-05: ningún reemplazo pasó la verificación (overlap_conflict). Queda el actual.
- Icono: nada
- Annotation: el motivo es el `error` del pedido fallido; se muestra también en la celda y en el detalle

### alerta-sistema
- Texto/label: No pudimos cargar los próximos desafíos. Probá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### cargando
- Texto/label: Cargando próximos desafíos…
- Icono: nada
- Annotation: nada

### grilla
- Texto/label: ver columnas
- Icono: nada
- Annotation: una fila por día (mañana a +14) con su número de desafío; una columna por juego registrado, en el orden del registry. Celda con desafío: estado + «Regenerar» (solo `approved`, fecha futura y sin pedido pendiente); clic → detalle. «Sin desafío» no tiene acción y, si hay falla registrada, muestra «20 intentos · <motivo>». «Usa un ítem rechazado: <término o hecho>» marca el desafío para regenerarlo a mano (nunca se regenera solo). Polling cada 5 s solo mientras haya alguna regeneración pendiente
- Columnas: Día, Devdle, Grep Grid, Tech Timeline, Big O
- Filas de ejemplo: «02/12 #32 · Aprobado · Aprobado · Aprobado · Aprobado» / «05/12 #35 · Usa un ítem rechazado: CAP theorem · Aprobado · Aprobado · Aprobado» / resto «Aprobado»

## Estados

### default
- Aplica: Sí
- Mensaje: Grilla de 14 días con los desafíos aprobados de cada juego.
- Cambios:
  - ninguno respecto de default.

### falla de generación
- Aplica: Sí
- Mensaje: 1 juego no tiene desafío para mañana: Devdle (2026-12-02), falla tras 20 intentos. Se reintenta en la próxima corrida.
- Cambios:
  - alerta-fallas: visible solo acá.
  - nav-proximos: content="Próximos (1)".
  - grilla: la celda Devdle del 02/12 muestra «Sin desafío · Falla de generación · 20 intentos · no_valid_term», destacada; sin acción.

### regeneración pendiente
- Aplica: Sí
- Mensaje: Hay una regeneración en curso. La grilla se actualiza sola cada 5 segundos.
- Cambios:
  - alerta-pendiente: visible solo acá.
  - grilla: la celda Grep Grid del 05/12 muestra «Regenerando…» y no admite «Regenerar».

### regeneración fallida
- Aplica: Sí
- Mensaje: No se pudo regenerar Grep Grid del 2026-12-05: ningún reemplazo pasó la verificación (overlap_conflict). Queda el actual.
- Cambios:
  - alerta-regeneracion: visible solo acá.
  - grilla: la celda Grep Grid del 05/12 muestra «Aprobado · Regeneración fallida» y vuelve a admitir «Regenerar».

### loading
- Aplica: Sí
- Mensaje: Cargando próximos desafíos…
- Cambios:
  - cargando: visible solo acá.
  - grilla: oculta.

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar los próximos desafíos. Probá de nuevo.
- Cambios:
  - alerta-sistema y btn-reintentar: visibles solo acá; grilla oculta.

## Interacciones

**Eventos:**
- grilla · on click celda con desafío → abre `o-02-detalle-desafio` (desde próximos)
- grilla · acción «Regenerar» de la celda → abre `o-03-regenerar-desafio`
- polling cada 5 s de `GET /api/admin/challenges/upcoming` solo mientras alguna celda tenga una regeneración pendiente; se corta cuando ninguna queda pendiente
- btn-reintentar · on click → reconsulta

**Validaciones:**
- Ninguna: no hay campos de entrada. «Regenerar» solo aparece en desafíos aprobados con fecha futura y sin pedido pendiente.

**Feedback:**
- Una regeneración fallida nunca deja una celda sin desafío: queda el actual y se muestra el motivo.
- Una regeneración que llega a su fecha sin atenderse se cancela: el día sale de la grilla (pasa a hoy) y el desafío original se publica sin cambios.
- La celda «Sin desafío» no ofrece acción: el admin no crea desafíos (fuera de alcance de REQ-008); la próxima corrida del generador lo reintenta.

## Accesibilidad

- **Orden de foco:** encabezado → leyenda → avisos → grilla (fila por fila, celda por celda; dentro de la celda, apertura del detalle → «Regenerar»).
- **Landmarks y jerarquía:** `main` con un h1; la grilla es una tabla con encabezados de fila (día) y de columna (juego).
- **Propio de esta composición:** el estado de la celda se comunica con texto, no solo con color; los cambios por polling y las fallas se anuncian con `aria-live="polite"`.

## Decisiones y descartes

**Decisiones tomadas:**
- Grilla de celdas con estado y preview solo al abrir el detalle (resuelve la pregunta 5 del product-map): los huecos se ven de un vistazo y los `client` se cargan solo al abrir O-02.
- REQ-008: las columnas salen del registry de juegos (hoy Devdle, Grep Grid y Tech Timeline); Big O y Bug Hunt aparecen solos cuando existan, sin rediseño.
- REQ-008: la ventana es de mañana a hoy + 14; hoy nunca se muestra porque ya está publicado y no se puede regenerar (CA 1).
- REQ-008: la falla de generación se ve en la celda, en un aviso de la sección y en el contador «Próximos (n)» del encabezado (resuelve la parte de fallas de la pregunta 1 del product-map). No hay mail (ADR-017).
- REQ-008: la regeneración fallida queda visible en la celda con su motivo hasta un nuevo pedido; la cancelada por cambio de día no se muestra (CA 6, 7).
- REQ-008: «Usa un ítem rechazado» es solo un aviso; el desafío no se regenera solo (CA 10).
- REQ-008: polling confirmado en 5 s, solo mientras hay pendientes (decisión 14 del diseño técnico).
- REQ-009: Big O aparece como cuarta columna sin rediseño. Es el primer juego cuya generación puede fallar por ejecución: el motivo de la falla o de la regeneración fallida se muestra como llega (`ambiguous_fit`, `run_go: timeout`, `variety_recipe`…), igual que en los otros juegos. Su regeneración tarda unos segundos más (ejecuta código en 3 lenguajes por candidato) y el polling de 5 s ya lo cubre: no se agrega un estado nuevo.

**Alternativas descartadas:**
- Lista por día con preview inline: repetiría ES/EN 42 veces (14 × 3) y crecería con cada juego.
- Columnas fijas para los 5 juegos: mostraría columnas vacías de juegos que todavía no existen.
- Botón para completar un día sin desafío: el admin no carga ni genera contenido (fuera de alcance).

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-43, C-44, C-49 · REQ-008 (RF 1-3, 6; CA 1, 3, 4, 6-10) · flujo 4 de `user-flows.md`.
