---
tokens: component
version: 0.2.0
last_updated: 2026-11-05
status: placeholder
---

# Tokens — Component-level

> **Placeholder inicial** — Tier 3: tokens por componente. Mapean roles
> semánticos a propiedades específicas de cada componente.

## Propósito

Tier 3 de la jerarquía de tokens. Cada token nombra **una propiedad de un
componente específico**. Permite ajustar un componente sin afectar otros que
comparten el mismo semántico.

Formato: `{componente}.{variant}.{propiedad}.{estado}`

## Button

Implementado como clases en `apps/web/src/components/cta.ts` (spec: `components/button.md`).

```
button.primary.bg          : bg.action.primary
button.primary.bg.hover    : bg.action.primary.hover   # pendiente de implementar
button.primary.text        : text.inverse
button.primary.border      : transparent

button.secondary.bg        : transparent
button.secondary.text      : text.action.primary
button.secondary.border    : border.interactive        # --color-border-interactive

button.disabled.bg         : transparent
button.disabled.text       : text.dim
button.disabled.border     : border.default

button.focus.outline       : border.focus              # 2px, offset 2px
button.radius              : radius.none
button.height.min          : 44px
button.padding.x           : space.4
button.gap                 : space.2

button.destructive.bg      : bg.error                  # reservado, sin uso en v1
button.destructive.text    : text.inverse              # reservado, sin uso en v1
```

## TextInput (placeholder)

```
input.bg           : bg.surface
input.text         : text.primary
input.placeholder  : text.dim
input.border       : border.interactive
input.border.focus : border.focus
input.border.error : border.error
input.height.md    : 44px
```

## Card

Implementado en `@nerdose/ui` (spec: `components/card.md`).

```
card.bg            : bg.surface
card.border        : border.default
card.padding       : space.padding.spacious   # 16px
card.gap           : space.stack.sm           # 12px
card.radius        : radius.xl                # 16px
card.elevation     : elevation.0              # sin sombra
```

## Alert

Implementado en `@nerdose/ui` (spec: `components/alert.md`).

```
alert.bg           : bg.surface
alert.border       : border.error             # solo lateral izquierdo, 4px
alert.text         : text.error
alert.padding      : space.padding.spacious   # 16px
alert.gap          : space.stack.sm           # 12px entre mensaje y acción
```

## Banner

Implementado en `@nerdose/ui` (spec: `components/banner.md`).

```
banner.bg          : bg.surface
banner.border      : border.warning           # solo lateral izquierdo, 4px
banner.title       : text.warning             # negrita
banner.detail      : text.secondary
banner.padding.y   : space.3
banner.padding.x   : space.4                  # space.8 desde lg
```

## Reglas

- **Cada componente declara sus tokens al crearse** (via `/product-design-system-update`).
- **Componentes consumen estos tokens** en su implementación de código.
- **Cambiar valor de un component token** = PATCH si es ajuste fino;
  MINOR si introduce nuevo subtoken.
- **Renombrar/remover un component token** = MAJOR.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-03 v0.1.1 — Referencias a colores ajustadas a la paleta oscura.
- 2026-11-05 v0.2.0 — Button, Card y Alert alineados con la implementación de REQ-002: `button.disabled.*`, `button.focus.outline`, `card.radius = radius.xl`, `card.padding = space.padding.spacious`, `card.elevation = elevation.0`, y tokens nuevos de `alert.*` y `banner.*`.
