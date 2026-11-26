---
date: 2026-11-25
type: technical-change
service: admin, api, core, games, web (+ PRD, ADR-006, flujos, UX admin)
---

# Cambio Técnico: admin, api, core, games, web — documentar `feature/admin-ux` en REQ-012

## Requerimiento Original

> Sumar a REQ-012 lo que se hizo la misma noche en la rama `feature/admin-ux` (todavía sin mergear a `dev`): `GET /api/admin/content/items` y el stock sin los términos excluidos de Devdle vía `BankUsage.excludedItems` (`940a1f0`), `optimizeDeps.entries` con los clients de los juegos en `web` y `admin` (`30c0c2d`), y la pantalla «Bancos», Próximos con tarjeta por celda y Regenerar en el detalle, Stock con resumen de rechazados, paginado de Reportes, Métricas y rechazadas, `Pagination` común y admin solo en español (`462f2f9`). Actualizar los docs vivos sin tocar `docs/apis/api.yaml`, que ya actualizó esa rama.

## Resumen

Solo cambia la documentación. REQ-012 pasa a `status: formalized` (como REQ-009 a REQ-011) y suma tres stories `Completed` sin story plan: S-067 (api, contrato y stock), S-068 (UI del admin) y S-069 (fix de Vite). La inconsistencia del primer pase, el stock de Devdle contando los términos excluidos, queda resuelta en S-067; S-065 y REQ-012 lo dicen.

El contrato `BankUsage` suma `excludedItems?` en ADR-006, en las tres copias de `game-registry` y en el catálogo de `core`. El PRD suma C-56 (explorar los bancos) y ajusta C-39, C-43 y C-45: stock sin excluidos, rechazados resumidos, paginado y admin solo en español. La arquitectura del admin registra el módulo `banks`, `Pagination` y las previews en español. La regla de `optimizeDeps.entries` queda en `_base` (web, admin, ui). La UX del admin suma P-06 «Bancos». Los wireframes del admin no se regeneraron.

## Documentos Modificados

| Documento | Cambio |
|-----------|--------|
| `docs/requests/REQ-012.ajustes-post-v1.md` | `status: formalized`. Suma `feature/admin-ux` en la nota, la tabla de commits, las decisiones (exclusiones en el contrato, paginado, Regenerar en el detalle, solo español, Vite), los RF 11-14, los CA 15-18, los servicios, los cambios de API (sin editar `api.yaml`), el split (S-067 a S-069), la revisión UX del admin con sus wireframes desactualizados y las inconsistencias nuevas. |
| `docs/stories/S-067`, `S-068`, `S-069` | **Nuevas**, `Completed`, «implementado fuera del workflow, sin story plan». |
| `docs/stories/S-065` | La lista se movió a `src/shared/excluded.ts`; el pendiente del stock queda resuelto en S-067. |
| `docs/prd/requirements.md`, `feature-groups.md`, `architecture.md` | C-39 (paginado de 20, solo español), C-43 (tarjeta y Regenerar en el detalle), C-45 (stock sin excluidos, resumen de rechazados, top paginado), **C-56 nueva**, CA de F-12, C-56 en FG-7 y el admin con Bancos y textos solo en español. |
| `docs/adrs/ADR-006-contrato-gamedefinition.md` | `BankUsage.excludedItems?` y la regla: tiene que ser el mismo `Set` que usa el generator. |
| `docs/architectures/{api,core,games}/conventions/game-registry.md`, `docs/reusable-code/core/game-contract.md` | `excludedItems` en `BankUsage`: cómo lo usa el stock y `excluded_from`, y que vive en `src/shared/`. |
| `docs/architectures/admin/` (`overview.md`, `manifest.yaml`, `conventions/{routing,game-clients}.md`) | Módulo `banks` (`/banks`), `Pagination`/`usePagination`, Próximos con tarjeta, Stock con resumen, preview y `PayloadTexts` solo en español, nav. |
| `docs/architectures/{web,admin,ui}/conventions/_base.md` | Regla de `optimizeDeps.entries` con `packages/games/*/src/client/index.ts`. |
| `docs/flows/admin-login-y-consultas.md`, `regenerar-desafio.md`, `generacion-diaria.md` | Stock sin excluidos y paso 4b de Bancos; Regenerar solo desde el detalle; ruta nueva de la lista de exclusión. |
| `docs/reusable-code/admin/{index,components,content-stock,upcoming}.md`, `admin/banks.md` (nuevo), `api/{http,index}.md`, `games/{devdle,index}.md` | `Pagination`, módulo `banks`, `BankRejectionsLink`, `PayloadTexts`, `AdminContentService.items`, `bank-items.ts`, `approvedEligible`, `DEVDLE_EXCLUDED_TERMS` en `src/shared`. |
| `docs/ux/surfaces/admin/` | `product-map.md` 1.6 (P-06, nav, IA, mapa), `user-flows.md` 1.4; `screens/bancos.md` (nuevo) y `reportes`, `proximos-desafios`, `stock-contenido`, `metricas`, `o-02-detalle-desafio` y `o-03-regenerar-desafio` actualizados. |

## Pendientes

- Regenerar los wireframes del admin con `/product-ux-wireframes admin` (y los de web con `/product-ux-wireframes web`, del primer pase).
- En `feature/admin-ux`, la descripción de `GET /api/admin/content/items` en `api.yaml` dice «Pantalla Contenido»; la pantalla es «Bancos».
