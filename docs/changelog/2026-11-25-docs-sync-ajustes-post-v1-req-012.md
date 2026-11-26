---
date: 2026-11-25
type: technical-change
service: api, games, ui, web (+ PRD, API, ADR-009, ADR-012, flujos, UX web, DS web)
---

# Cambio Técnico: api, games, ui, web — documentar los ajustes posteriores a v1 (REQ-012)

## Requerimiento Original

> El 2026-11-25 se implementó una tanda de cambios directamente, fuera del workflow (sin new-request, design ni stories): páginas de error con la ventana de terminal, IP del rate limit no falsificable y logs sin `player_id`, seis plantillas nuevas de Bug Hunt, pista y «Rendirse» en Devdle, patrón común de partida y resultado en los 5 juegos, términos excluidos y rotación flexible en Devdle, y ajustes sueltos (código sin scroll horizontal, resultado de Bug Hunt sin tipo de bug, cursor de mano, variant `error-outline`). Pedido: (1) trazabilidad con un request y stories retroactivos marcados como completados; (2) docs vivos (PRD, API, flujos, convenciones, UX, DS, código reutilizable, ADRs) que describan el comportamiento actual, para que los próximos skills del workflow partan del estado real. El admin queda fuera (se documenta aparte).

## Resumen

Solo cambia la documentación. El código de `dev` (`27c1e2d`, merges `3fc0654` a `27c1e2d`) es la fuente de verdad. Se crea REQ-012 con su diseño y sus 7 stories (S-060 a S-066), todas `Completed` y sin story plan. Los docs vivos quedan alineados con el código: Devdle tiene dos capabilities nuevas en el PRD (C-54 pista, C-55 rendirse), una NFR nueva de logs (NFR-S09), la regla de rotación como preferencia y la lista de exclusión; la API documenta el feedback de pista y rendición; las convenciones describen el patrón común de los juegos, `CodeText`, `error-outline`, el cursor, `RouteError`/`ErrorTerminal` y el `clientIp` real; el DS suma el pattern `game-screens`; la UX de `web` suma la pantalla `error-inesperado` y alinea las 10 pantallas de partida y resultado.

Se corrigen de paso tres desvíos que encontró la revisión: `api.yaml` era YAML inválido desde `feature/ajustes-juegos` (un `description` sin comillas), `DevdleFeedback` no incluía `{ hint }` ni `{ gave_up }`, y el ejemplo de `clientIp` en `api/security` seguía con la versión vieja. Los wireframes (`screens.json`, `wireframes.html`) no se regeneraron: REQ-012 lista cuáles quedaron viejos.

## Documentos Modificados

| Documento | Cambio |
|-----------|--------|
| `docs/requests/REQ-012.ajustes-post-v1.md` | **Nuevo.** Request retroactivo: decisiones (pista y rendirse como jugadas, exclusiones solo en Devdle, rotación de 3 niveles, IP desde la derecha, `player_ref`), servicios, cambios de API, story split 1:1 con las ramas, revisión UX, wireframes desactualizados e inconsistencias. |
| `docs/stories/S-060` a `S-066` | **Nuevas.** Una por rama, `Completed`, con criterios escritos como lo que hoy es cierto y evidencia de tests. |
| `docs/prd/requirements.md` | Estado de Devdle en Play (`hint`, `gave_up`), C-15, C-17 (rotación como preferencia y exclusión), C-18, C-31 (18 plantillas), **C-54 y C-55**, CA nuevos, nota de Term, NFR-S08 (origen de la IP) y **NFR-S09** (logs sin credenciales). |
| `docs/prd/feature-groups.md`, `architecture.md`, `goals-and-context.md` | C-54/C-55 en FG-3; IP del rate limit, logs con `player_ref` y pantalla de error en arquitectura; decisiones #33 y #34. |
| `docs/apis/api.yaml` | `DevdleFeedback` como `oneOf` (intento, pista, rendición), descripción de `makeMove`, ejemplo `devdle_pista`, `Feedback` y la comilla que faltaba en `DevdleMove`. |
| `docs/adrs/ADR-009-identidad-del-jugador-anonimo.md`, `ADR-012-caches-y-rate-limit-en-memoria.md` | Regla nueva: el `player_id` nunca se loguea crudo. Referencia a REQ-012 en ADR-012 (la regla de IP ya estaba corregida). |
| `docs/architectures/api/conventions/{security,http-server,env-config}.md`, `db` y `generator` `env-config.md` | Ejemplo real de `clientIp`, `warn` de arranque, `player_ref` en el logger, `TRUST_PROXY_HOPS` en las integraciones. |
| `docs/architectures/web/conventions/error-handling.md` | `RouteError` con header y footer propios, `ErrorTerminal` compartido con la 404, mensaje real solo en `vite dev`. |
| `docs/architectures/games/conventions/game-clients.md` y copia de `web` | Sección «Update (REQ-012)»: patrón común de `Game`/`Result`, `CodeText`, pista y rendirse como jugadas, `error-outline`, Bug Hunt sin chip. |
| `docs/architectures/{games,web,ui}/conventions/styling.md` | `error-outline` y regla base de cursor (las 3 copias iguales). |
| `docs/flows/jugada-y-cierre-de-partida.md` | Jugadas `hint` y `give_up`, cierre por rendición, `result.hint`/`gave_up`, feedback y error de segunda pista. |
| `docs/flows/generacion-diaria.md` | Elegibilidad de Devdle (exclusiones, rotación de 3 niveles), checks con `not_excluded`, Bug Hunt con 18 plantillas. |
| `docs/flows/abrir-y-retomar-juego.md`, `preferencias-y-share.md`, `primera-visita-y-sesion.md` | Pista retomada desde `state.hint`; share real de Devdle con 💡; origen de la IP del límite de sesiones; eventos con `player_ref`. |
| `docs/reusable-code/api/http.md`, `games/{devdle,big-o,bug-hunt,index}.md`, `ui/helpers.md`, `web/{components,index}.md` | `clientIp(config)`, `playerRef` compartido, jugadas y componentes nuevos de Devdle, `eligibility`/`excluded`, `CodeText`, `error-outline`, `ErrorTerminal`/`RouteError`. |
| `docs/design-system/web/` (1.14.0) | **Nuevo** `patterns/game-screens.md`; `button` 1.4.0 (frontmatter y cursor), `code-block` 1.4.0 (sangría colgante), `game-boards` 1.9.0 (pista y Rendirse de Devdle, `error-outline`, confirmación `error`, Bug Hunt sin chips), `patterns/README`, `README` y `CHANGELOG`. |
| `docs/ux/surfaces/web/product-map.md`, `user-flows.md` | Pantalla #20 `error-inesperado`, nota del patrón común, bloques de Devdle, Big O y Bug Hunt, O-04 en Devdle, estado global «Error de render»; flujos de pista, rendirse, CTA, banner y error. |
| `docs/ux/surfaces/web/screens/` | **Nuevo** `error-inesperado.md`; actualizados `no-encontrado`, `o-04-rendirse`, `devdle-{instrucciones,partida,resultado}`, `grep-grid-{partida,resultado}`, `timeline-{partida,resultado}`, `big-o-{partida,resultado}`, `bug-hunt-{partida,resultado}`. |

## Pendientes

- Regenerar los wireframes con `/product-ux-wireframes web` (lista en REQ-012, «Wireframes desactualizados»).
- El stock de Devdle del admin (`bankUsage`) sigue contando los 115 términos excluidos como disponibles; va con la documentación del admin.
