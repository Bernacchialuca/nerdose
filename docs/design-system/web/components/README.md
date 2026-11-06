---
version: 1.2.0
last_updated: 2026-11-06
status: defined
source: docs/nerdose.html
---

# Componentes del Design System — `web`

Specs escritos desde el prototipo `docs/nerdose.html` (fuente de verdad visual). Cada spec sigue las 12 secciones de `.claude/templates/ds-component-tmpl.yaml`. Las piezas propias de un solo juego están en [`../patterns/game-boards.md`](../patterns/game-boards.md).

> **`@nerdose/ui` está alineado con estos specs desde S-011 (v1.2.0).** Lo que sigue pendiente de alinear en `apps/web` (header, tarjeta de juego, catálogo, acerca de, footer) lo corrigen S-012 y S-013; ver `../CHANGELOG.md` → "Desalineaciones conocidas en código".

## Inventario

| Componente | Estado del spec | Implementado en código | Alineado con v1.0.0 |
|---|---|---|---|
| [button](button.md) | active | Sí — helper `buttonClass` en `packages/ui/src/components/button-class.ts` (`primary`, `secondary`, `accent`; `lg`/`md`) | **Sí (ui)**; `apps/web` migra en el plan `web` de S-011 |
| [link](link.md) | active | Sí — helper `linkClass` en `packages/ui/src/components/link-class.ts` | **Sí (ui)**; las pantallas lo adoptan en S-012/S-013 |
| [card](card.md) | active | Sí — `packages/ui/src/components/card.tsx` (`game`, `next`, `placeholder`, `step`, `mini-stat`) + `game-thumbnail.tsx` (+ `game-card.tsx`, `progress-summary.tsx` en `catalog`) | **Sí (ui)**; `game-card.tsx` lo alinea S-013 |
| [panel](panel.md) | active | Sí — `packages/ui/src/components/panel.tsx` (`default`, `feature`) | **Sí (ui)** |
| [alert](alert.md) | active (adaptación de producto) | Sí — `packages/ui/src/components/alert.tsx` | **Sí (ui)** |
| [banner](banner.md) | active (`warning` es adaptación de producto) | Sí — `packages/ui/src/components/banner.tsx` (solo `warning`) | **Sí (ui)** |
| [app-header](app-header.md) | active | Sí — `packages/ui/src/components/app-header.tsx` + `brand-mark.tsx` + helper `nav-item-class.ts` (+ `apps/web/src/components/main-nav.tsx`) | **Sí (ui)**; el shell de `web` lo compone S-012 |
| [game-header](game-header.md) | active | No | — |
| [site-footer](site-footer.md) | active | Sí — `apps/web/src/components/site-footer.tsx` | **No** |
| [language-selector](language-selector.md) | active | Sí — `SegmentedControl` en `packages/ui/src/components/segmented-control.tsx` (+ `apps/web/src/modules/session/components/language-selector.tsx`) | **Sí (ui)**; `web` lo adopta en S-012 |
| [streak-pill](streak-pill.md) | active | Sí — `packages/ui/src/components/streak-pill.tsx` (el header de `web` aún muestra el número de desafío; S-012) | **Sí (ui)** |
| [chip](chip.md) (chip + badge) | active | Sí — `packages/ui/src/components/badge.tsx` (`success`, `pending`, `neutral`, chip) | **Sí (ui)** |
| [streak-number](streak-number.md) | active | Sí — `packages/ui/src/components/streak-number.tsx` (`compact`) | **Sí (ui)** |
| [heatmap](heatmap.md) | active | No | — |
| [progress-bar](progress-bar.md) | active | Sí — `packages/ui/src/components/progress-bar.tsx` (`segmented`); `day-status.tsx` lo adopta en S-013 | **Sí (ui)** |
| [terminal-window](terminal-window.md) | active | Sí — `packages/ui/src/components/terminal-window.tsx` | **Sí (ui)** |
| [code-block](code-block.md) | active | No | — |
| [data-table](data-table.md) | active | No | — |
| [`patterns/game-boards`](../patterns/game-boards.md) | active | No | — |

`BrandMark` (`packages/ui/src/components/brand-mark.tsx`) es el logo del [app-header](app-header.md); no tiene spec propio. Las miniaturas de tarjeta ([`patterns/game-boards`](../patterns/game-boards.md)) son `GameThumbnail` (`packages/ui/src/components/game-thumbnail.tsx`).

## Componentes que el prototipo no define

Inputs de texto, modales (overlay O-01), toasts, tooltips, spinners/skeletons y menús: **Pendiente — el prototipo no los define**. Se especifican cuando una story los necesite.

## Secciones obligatorias de un spec

1. Propósito · 2. Anatomía · 3. Variants · 4. Sizes · 5. States · 6. Spacing & sizing rules · 7. Accesibilidad · 8. Guidelines de contenido · 9. Do's & don'ts · 10. API · 11. Relacionados · 12. Historial.

## Historial

- 2026-11-05 v0.2.0 — Button, Card, Alert y Banner documentados desde el código.
- 2026-11-05 v1.0.0 — Inventario reescrito desde el prototipo: 18 specs + pattern `game-boards`, con estado de implementación y marca de desalineación del código.
- 2026-11-06 v1.2.0 — Inventario con la implementación de `@nerdose/ui` (S-011): `buttonClass`, `linkClass`, `navItemClass`, `Card`, `Panel`, `Alert`, `Banner`, `AppHeader`, `SegmentedControl`, `StreakPill`, `Badge`, `StreakNumber`, `ProgressBar`, `TerminalWindow` y `GameThumbnail`.
