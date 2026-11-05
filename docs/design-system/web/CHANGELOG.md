# Design System — Changelog

Sigue el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y el versionado [Semantic Versioning](https://semver.org/lang/es/).

## [0.2.0] - 2026-11-05

### Agregado
- `components/button.md`: variants `primary`, `secondary` y `disabled` (con `aria-disabled`, sigue siendo focusable), alto mínimo de 44px y sin radio. Queda `experimental`: hover, active y loading están pendientes y la implementación son clases en `web` (`cta.ts`), no un componente de `@nerdose/ui`.
- `components/card.md`: contenedor `<article>` de `@nerdose/ui`, con radio de 16px, padding de 16px y sin sombra.
- `components/alert.md`: error con `role="alert"`, barra lateral en `color.error` y slot de acción.
- `components/banner.md`: advertencia persistente con `role="status"`, barra lateral en `color.warning`, título y detalle opcional (aviso de cookies bloqueadas, O-03).
- `tokens/reference.md`: `radius.xl` (16px).
- `tokens/semantic.md`: `text.warning` y `border.warning` (Banner O-03).
- `tokens/component.md`: `button.disabled.*`, `button.focus.outline`, `button.radius`, `button.height.min`, `button.padding.x`, `button.gap`, `alert.*` y `banner.*`.

### Cambiado
- `tokens/component.md`: Card alineada con la implementación: `card.radius` pasa de `radius.md` a `radius.xl`, `card.padding` de `space.padding.default` a `space.padding.spacious` y `card.elevation` de `elevation.1` a `elevation.0`. Se agrega `card.gap`.
- `tokens/component.md`: `button.secondary.border` pasa de `border.focus` a `border.interactive`, según la regla de contraste ≥3:1 de `foundations/color.md`.
- `foundations/color.md`: se documentan los consumidores de `color.warning` y `color.error` y su contraste sobre `bg.surface` (10,6:1 y 7,4:1).

### Código alineado con el spec
- `@nerdose/ui/tokens.css` suma `--color-border-interactive: #8D99A6` (`border.interactive`).
- El CTA `secondary` usa `border-border-interactive` en lugar de `border-border-strong` (1,5:1 → 6,8:1 sobre el fondo de página).
- `cta.ts` pasa a `apps/web/src/components/` y lo importan también `not-found.tsx` y `route-error.tsx`, en lugar de repetir las clases.

---

## [0.1.1] - 2026-11-03

### Cambiado
- `foundations/color.md`, `tokens/reference.md`, `tokens/semantic.md` y `tokens/component.md`: la paleta clara de relleno (por ejemplo `#ffffff`) se reemplaza por la paleta oscura del prototipo `docs/nerdose.html` (fondo `#0A0C0F`, texto `#E6EDF3`, acento `#3DDC84`), alineada con `@nerdose/ui/tokens.css`.
- Se mantienen los acentos por juego.
- Se agrega el semántico `border.interactive` para bordes de controles con contraste ≥3:1.

## [0.1.0] - 2026-11-03

### Agregado
- Estructura inicial del Design System (bootstrap automático).
- Archivos placeholder en foundations/, tokens/, guidelines/.
- Carpetas vacías components/ y patterns/.

> **Nota:** esta versión `0.1.0` es solo la estructura inicial. El primer DS
> "real" se versiona como `0.2.0` o superior cuando el equipo de diseño
> reemplace los placeholders con valores definitivos.

---

## Cómo registrar cambios

Cada vez que se ejecuta `/product-design-system-update`, el agente:

1. Aplica el cambio pedido.
2. Bumpea versión semver según naturaleza:
   - **MAJOR**: breaking (remover variant, renombrar componente)
   - **MINOR**: agregar (componente, variant, foundation)
   - **PATCH**: corrección, ajuste de spec
3. Agrega entrada en este CHANGELOG con formato:

```
## [X.Y.Z] - YYYY-MM-DD

### Agregado / Cambiado / Eliminado / Corregido / Deprecado
- {descripción concisa del cambio}
```
