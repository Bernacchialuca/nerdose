---
date: 2026-11-26
type: technical-change
service: games, web (+ PRD, ADR-006, flujos, UX web)
---

# Cambio Técnico: games, web — el share no tiene dominio fijo

## Requerimiento Original

> El texto de compartir de los 5 juegos terminaba en `nerdose.dev` fijo. Fue un ejemplo que se tomó literal: el sitio tiene que salir de configuración, sin dominio en el código.

## Resumen

Los `share()` de los juegos devuelven solo el resultado. `web` agrega la última línea con el host de la dirección abierta (`withSite` en `share-button.tsx`, `window.location.host`). No hace falta variable de entorno: el jugador siempre comparte desde el sitio donde está, así que el host abierto es el correcto en cada ambiente (local, preview o producción) y no se puede configurar mal. Si algún día se quiere forzar otro host, `withSite` ya recibe el host como parámetro.

## Documentos Modificados

| Documento | Cambio |
|-----------|--------|
| `docs/adrs/ADR-006-contrato-gamedefinition.md` | `share` no incluye la solución ni el sitio; el host de `web` agrega la línea del sitio. |
| `docs/architectures/games/conventions/game-package.md`, `game-clients.md` | Ídem en las convenciones de los juegos. |
| `docs/architectures/web/conventions/game-clients.md` | `ClientShareButton` agrega la línea del sitio. |
| `docs/flows/preferencias-y-share.md` | Paso nuevo: `web` agrega el sitio; los ejemplos usan `<sitio>`. |
| `docs/reusable-code/games/*`, `docs/reusable-code/web/*` | Formatos de share sin `nerdose.dev`; `withSite` documentado. |
| `docs/prd/goals-and-context.md`, `docs/prd/requirements.md` (C-13) | «la dirección del sitio» en vez de `nerdose.dev`. |
| `docs/ux/product-overview.md`, `docs/ux/surfaces/web/user-flows.md` | Ídem. |

## Sin cambiar

- Requests, stories, story plans, changelogs anteriores, discovery y el prototipo `docs/nerdose.html`: son históricos.
- Las anotaciones de pantallas y los wireframes de `docs/ux/surfaces/web/` (`screens/*-resultado.md`, `screens.json`, `wireframes.html`) siguen mostrando `nerdose.dev` como texto de ejemplo; se corrigen en la próxima regeneración de wireframes.
- Las menciones de `nerdose.dev` / `admin.nerdose.dev` como dominio del producto (ADR-001, ADR-003, ADR-009, ADR-010, ADR-013, `ARCHITECTURE.md`, `api.yaml`, overviews y convenciones de `data-fetching`): el dominio de producción todavía no está decidido.
