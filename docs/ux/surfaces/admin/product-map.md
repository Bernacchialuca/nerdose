---
document: UX Product Map
surface: admin
version: "1.0"
date: 2026-11-03
status: Draft - Punto de partida para discusión
audiences: [responsable]
---

# Product Map — admin

> Inventario estructural de la superficie. Define qué pantallas existen,
> cómo se agrupan y cómo se navega entre ellas. **No define flujos** —
> eso vive en `user-flows.md`. Si el equipo lee esto y no hay objeciones,
> el documento falló: debería generar fricción para provocar decisiones.

## Audiencias en esta Superficie

- **responsable** ([research-context](../../audiences/responsable/research-context.md)) — Única persona que opera la plataforma (U-02): revisa reportes, anula desafíos, mira próximos desafíos y stock, consulta métricas. Audiencia única y primaria.

Viewport: `desktop` (único). No hay caso mobile relevado (ver pregunta abierta 4). UI solo en español; el contenido de los desafíos se muestra en ES y EN lado a lado. Identidad visual: extiende el lenguaje oscuro/terminal de `docs/nerdose.html` (acento `#3DDC84`); el prototipo no tiene pantallas de admin, así que el layout es nuevo.

## Inventario de Pantallas

| # | Pantalla | Slug / ruta | Propósito | Audiencia primaria | Viewports | Referencia PRD |
|---|----------|-------------|-----------|---------------------|-----------|----------------|
| P-01 | Login | `login` · `/login` | Ingresar con la contraseña única; muestra el motivo si volvió por sesión vencida o por límite de intentos | responsable | solo desktop | C-38, NFR-S07 |
| P-02 | Reportes | `reportes` · `/reports` | Cola de reportes agrupados por desafío (más reportado primero), filtro por estado (default `open`), resolver, descartar y acceder a anular | responsable | solo desktop | C-39, C-40, C-41 |
| P-03 | Próximos desafíos | `proximos-desafios` · `/upcoming` | Grilla de 14 días × 5 juegos con estado por celda (aprobado, sin desafío, regeneración pendiente) y acceso a regenerar | responsable | solo desktop | C-43, C-44 |
| P-04 | Stock de contenido | `stock-contenido` · `/content` | Salud de los bancos (términos y hechos), última carga del dataset y top 50 de palabras rechazadas en Devdle; solo lectura | responsable | solo desktop | C-45 |
| P-05 | Métricas | `metricas` · `/metrics` | Rango de fechas, cifras resumen y tablas: jugadores únicos, retención D1/D7, distribución de rachas, calidad por desafío | responsable | solo desktop | C-46 |

> `/` redirige a `/reports` (P-02). Cualquier ruta sin sesión redirige a `/login`.
>
> Viewport restringido: todas las pantallas son solo desktop por decisión de `product-overview.md` (herramienta interna con tablas y previews en paralelo). Es una decisión de producto, no un detalle de layout; ver pregunta abierta 4.
>
> Fuera de alcance deliberado (el PRD no lo pide): dashboard de inicio, ajustes, perfil, gestión de usuarios, edición manual de contenido. Cerrar sesión es una acción del encabezado, no una pantalla.

## Inventario de Overlays

| # | Overlay | Slug | Tipo | Trigger | Propósito |
|---|---------|------|------|---------|-----------|
| O-01 | Anular desafío | `anular-desafio` | modal | P-02 · acción "Anular" del grupo de reportes y de O-02 | Formulario `void_reason` (req) + culpable `kind` (term / timeline_fact / template / none) y `id` (req si term o timeline_fact), con resumen de consecuencias irreversibles antes de confirmar. Solo si el desafío está `published` (C-41) |
| O-02 | Detalle del desafío | `detalle-desafio` | drawer ancho (panel lateral) | P-02 · fila del grupo de reportes; P-03 · celda de juego/día | Preview del `client` del juego en modo solución, ES y EN lado a lado, log de verificación; desde P-02 suma motivos, mensajes y contexto de cada reporte y las acciones resolver/descartar/anular; desde P-03 suma la acción regenerar |
| O-03 | Regenerar desafío | `regenerar-desafio` | modal | P-03 · acción "Regenerar" de la celda y de O-02 | Confirma el pedido de regeneración (solo `approved` con fecha > hoy); al confirmar, la celda pasa a "regeneración pendiente" y P-03 inicia polling hasta que el reemplazo pasa la verificación o falla (queda el actual) |

> **Sesión vencida: no es un overlay.** NFR-S07 y C-38 definen que un token vencido devuelve al login. Se resuelve como estado global (ver abajo) con aviso en P-01, no como modal sobre la pantalla vigente.
>
> **Regeneración pendiente** también existe como estado inline de la celda en P-03 (sin overlay); O-03 solo cubre la confirmación del pedido.

## Estructura de Navegación

### Navegación principal

Barra superior fija (encabezado único, sin sidebar), visible en P-02 a P-05:

- **Reportes** → P-02 (destino de `/`)
- **Próximos** → P-03
- **Stock** → P-04
- **Métricas** → P-05
- **Cerrar sesión** (acción) → borra el token y va a P-01

Las etiquetas del encabezado y de los títulos de pantalla son idénticas (uso esporádico, consistencia entre secciones). Reportes lleva un contador de grupos abiertos (hipótesis: apoya la entrada por alerta de mail; a validar).

### Navegación secundaria

Dentro de **Reportes**: filtro de estado (abiertos / resueltos / descartados).
Dentro de **Métricas**: selector de rango de fechas (`from`, `to`) que aplica a todas las tablas.
Dentro de **Próximos** y **Stock**: sin navegación secundaria.

## Information Architecture

### Agrupación: Intervención (reaccionar a un problema)

Pantallas: Reportes (P-02); overlays Anular (O-01) y Detalle (O-02).

**Por qué se agrupan:** es el JTBD 1 y el flujo de entrada esperado (alerta por mail). Es la pantalla de aterrizaje de `/`.

### Agrupación: Anticipación (mirar lo que viene)

Pantallas: Próximos desafíos (P-03), Stock de contenido (P-04); overlays Detalle (O-02) y Regenerar (O-03).

**Por qué se agrupan:** JTBD 2. Un hueco en la grilla y un banco por agotarse son el mismo problema (días sin desafío) visto desde dos ángulos; se mantienen como pantallas separadas porque P-03 es por desafío y P-04 es por banco.

### Agrupación: Medición

Pantallas: Métricas (P-05).

**Por qué se agrupan:** JTBD 3, solo lectura, tablas simples sin gráficos (decisión de arquitectura de `admin`).

### Reutilización

O-02 es un solo componente con dos orígenes (P-02 y P-03): misma vista del desafío, acciones distintas según el contexto y el estado del desafío (`published` permite anular; `approved` con fecha futura permite regenerar).

## Estados Globales

- **Autenticado vs no autenticado** — Todo salvo P-01 requiere sesión. Sin token, o ante un `401`, se borra el token de `sessionStorage` y se redirige a P-01.
- **Sesión vencida** — Token de 8 h expirado: vuelve a P-01 con aviso "La sesión venció, ingresá de nuevo". Se pierde el contexto de la pantalla y cualquier formulario abierto (ver pregunta abierta 3).
- **Login bloqueado** — 5 intentos por IP cada 15 min: P-01 informa el bloqueo temporal y deshabilita el envío.
- **Regeneración pendiente** — Mientras exista algún `pending_request` en P-03, la pantalla hace polling (5 s sugerido, a confirmar) y marca la celda; el resultado reemplaza el desafío o deja el actual si falla.
- **Sin datos / vacío** — Reportes sin abiertos, rango de métricas sin Play, celdas sin desafío en P-03: cada pantalla distingue "no hay nada" de "error de carga".

## Mapa Visual

```mermaid
flowchart TD
    Root[admin.nerdose.dev]
    Root --> P01[P-01 Login /login]
    Root -->|"/ redirige"| P02[P-02 Reportes /reports]
    Root --> P03[P-03 Próximos desafíos /upcoming]
    Root --> P04[P-04 Stock de contenido /content]
    Root --> P05[P-05 Métricas /metrics]
    P01 -.sesión válida.-> P02
    P02 --> O02[O-02 Detalle del desafío]
    P02 --> O01[O-01 Anular desafío]
    O02 --> O01
    P03 --> O02
    P03 --> O03[O-03 Regenerar desafío]
    O02 --> O03
    P02 -.401.-> P01
    P03 -.401.-> P01
    P04 -.401.-> P01
    P05 -.401.-> P01
```

## Preguntas Abiertas

1. **¿El responsable necesita saber que hay reportes o fallas sin abrir Reportes (contador en el encabezado, aviso de generación fallida, días sin desafío)?**
   - Si sí: agregar indicadores globales en el encabezado (reportes abiertos, alerta de huecos en los próximos 14 días) y estado global "alerta activa"; el PRD solo cubre alertas por mail (C-49).
   - Si no: el encabezado es solo navegación y el contador de Reportes se elimina; la entrada es siempre por mail.

2. **¿Hace falta ver el log de verificación y el detalle de culpables desde Reportes, o alcanza con solución y textos ES/EN?**
   - Si hace falta el log en P-02: O-02 muestra el mismo bloque de log en ambos orígenes y el selector de culpable de O-01 se alimenta desde el desafío (term o hecho ya identificado).
   - Si no: O-02 desde Reportes se reduce a solución, ES/EN y reportes; el log solo vive en el origen P-03.

3. **¿Qué pasa con una anulación o regeneración en curso cuando la sesión vence (401)?**
   - Si se conserva el borrador (motivo y culpable): agregar estado "sesión vencida con retorno" y volver a la misma ruta tras el login.
   - Si se descarta: el login siempre lleva a P-02; más simple, pero el motivo escrito se pierde (la anulación es irreversible, el riesgo es el reintento, no el dato).

4. **¿Hay uso del admin desde el teléfono ante una alerta de mail?**
   - Si sí: aparece un viewport mobile; como mínimo P-02, O-01 y O-02 necesitarían variante (O-02 pasaría de drawer ancho a pantalla completa y ES/EN a pestañas en lugar de lado a lado). P-03 a P-05 podrían quedar solo desktop.
   - Si no: se mantiene desktop único, sin variantes.

5. **¿P-03 es una grilla 14 × 5 con las 70 previews cargables, o una lista por día que expande la preview bajo demanda?**
   - Si grilla de celdas con estado y preview en O-02: se ven los huecos de un vistazo, pero se renderizan los `client` solo al abrir el detalle (menos costo, coherente con el contrato de props aún sin cerrar).
   - Si lista por día con preview inline: sin O-02 en P-03; la página es larga y ES/EN lado a lado se repite 70 veces.

6. **¿Las métricas de calidad por desafío necesitan llevar a Reportes o al desafío (enlace desde la fila)?**
   - Si sí: la fila de calidad abre O-02 o filtra P-02 por ese desafío; agrega una relación P-05 → P-02.
   - Si no: P-05 queda aislada, sin overlays ni enlaces salientes.

---

**Próximo artefacto:** `user-flows.md` de esta misma superficie define los 3-5 flujos críticos sobre las pantallas inventariadas acá.
