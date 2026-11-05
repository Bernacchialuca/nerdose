---
version: 1.0.0
last_updated: 2026-11-05
status: defined
source: docs/nerdose.html
---

# Componentes del Design System — `web`

Specs escritos desde el prototipo `docs/nerdose.html` (fuente de verdad visual). Cada spec sigue las 12 secciones de `.claude/templates/ds-component-tmpl.yaml`. Las piezas propias de un solo juego están en [`../patterns/game-boards.md`](../patterns/game-boards.md).

> **La implementación actual (DS v0.2.0) NO está alineada con estos specs.** La alineación del código la hace una request posterior; mientras tanto, la lista de diferencias está en `../CHANGELOG.md` → "Desalineaciones conocidas en código".

## Inventario

| Componente | Estado del spec | Implementado en código | Alineado con v1.0.0 |
|---|---|---|---|
| [button](button.md) | active | Sí — clases en `apps/web/src/components/cta.ts` | **No** |
| [link](link.md) | active | Parcial — clases ad hoc en `home.tsx`, `progress-summary.tsx`, `about.tsx` | **No** |
| [card](card.md) | active | Sí — `packages/ui/src/components/card.tsx` (+ `game-card.tsx`, `progress-summary.tsx` en `catalog`) | **No** |
| [panel](panel.md) | active | No | — |
| [alert](alert.md) | active (adaptación de producto) | Sí — `packages/ui/src/components/alert.tsx` | **No** |
| [banner](banner.md) | active (`warning` es adaptación de producto) | Sí — `packages/ui/src/components/banner.tsx` (solo `warning`) | **No** |
| [app-header](app-header.md) | active | Sí — `packages/ui/src/components/app-header.tsx` + `brand-mark.tsx` + `apps/web/src/components/main-nav.tsx` | **No** |
| [game-header](game-header.md) | active | No | — |
| [site-footer](site-footer.md) | active | Sí — `apps/web/src/components/site-footer.tsx` | **No** |
| [language-selector](language-selector.md) | active | Sí — `apps/web/src/modules/session/components/language-selector.tsx` | **No** |
| [streak-pill](streak-pill.md) | active | No (el header muestra el número de desafío en su lugar) | — |
| [chip](chip.md) (chip + badge) | active | No (el estado de la tarjeta es texto plano) | — |
| [streak-number](streak-number.md) | active | No (la racha se muestra como texto en `day-status.tsx`) | — |
| [heatmap](heatmap.md) | active | No | — |
| [progress-bar](progress-bar.md) | active | Parcial — barra continua en `apps/web/src/modules/catalog/components/day-status.tsx` | **No** |
| [terminal-window](terminal-window.md) | active | No | — |
| [code-block](code-block.md) | active | No | — |
| [data-table](data-table.md) | active | No | — |
| [`patterns/game-boards`](../patterns/game-boards.md) | active | No | — |

`BrandMark` (`packages/ui/src/components/brand-mark.tsx`) es el logo del [app-header](app-header.md); no tiene spec propio.

## Componentes que el prototipo no define

Inputs de texto, modales (overlay O-01), toasts, tooltips, spinners/skeletons y menús: **Pendiente — el prototipo no los define**. Se especifican cuando una story los necesite.

## Secciones obligatorias de un spec

1. Propósito · 2. Anatomía · 3. Variants · 4. Sizes · 5. States · 6. Spacing & sizing rules · 7. Accesibilidad · 8. Guidelines de contenido · 9. Do's & don'ts · 10. API · 11. Relacionados · 12. Historial.

## Historial

- 2026-11-05 v0.2.0 — Button, Card, Alert y Banner documentados desde el código.
- 2026-11-05 v1.0.0 — Inventario reescrito desde el prototipo: 18 specs + pattern `game-boards`, con estado de implementación y marca de desalineación del código.
