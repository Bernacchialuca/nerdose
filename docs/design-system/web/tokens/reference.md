---
tokens: reference
version: 0.1.1
last_updated: 2026-11-03
status: placeholder
---

# Tokens — Reference (primitivos)

> **Placeholder inicial** — Tier 1: tokens primitivos. NO se consumen
> directamente por componentes; siempre vía tokens semánticos.

## Propósito

Tier 1 de la jerarquía de tokens (Nathan Curtis):

```
Reference (primitivos)  ←  ESTE NIVEL
        ↓
Semantic (alias)
        ↓
Component (por componente)
```

Los tokens reference son **el inventario crudo** de valores: paleta de
colores raw, escala de espaciado raw, type scale raw.

## Color

Paleta oscura del prototipo (`docs/nerdose.html`).

```
color.neutral.950 : #0A0C0F
color.neutral.900 : #0F1318
color.neutral.850 : #11151A
color.neutral.800 : #141920
color.neutral.750 : #1E252E
color.neutral.700 : #222A33
color.neutral.650 : #2A323C
color.neutral.400 : #8D99A6
color.neutral.300 : #9AA6B2
color.neutral.100 : #E6EDF3

color.green.500 : #3DDC84
color.green.300 : #7CF0B0
color.green.950 : #06120B
color.amber.500 : #FFB547
color.blue.500  : #5EB1FF
color.purple.500: #C39BFF
color.pink.500  : #F472B6
color.red.500   : #FF7B72
```

## Spacing (placeholder)

```
space.0  : 0px
space.1  : 4px
space.2  : 8px
space.3  : 12px
space.4  : 16px
space.5  : 24px
space.6  : 32px
space.8  : 48px
space.10 : 64px
```

## Typography (placeholder)

```
font.size.xs  : 12px
font.size.sm  : 14px
font.size.md  : 16px
font.size.lg  : 18px
font.size.xl  : 24px
font.size.2xl : 32px
font.size.3xl : 48px

font.weight.regular : 400
font.weight.medium  : 500
font.weight.semibold: 600
font.weight.bold    : 700

font.lineHeight.tight : 1.2
font.lineHeight.base  : 1.5
font.lineHeight.loose : 1.75
```

## Radius (placeholder)

```
radius.none : 0px
radius.sm   : 4px
radius.md   : 8px
radius.lg   : 12px
radius.full : 9999px
```

## Reglas

- **No consumir desde componentes directamente.** Usar siempre via tokens semánticos.
- **No agregar valores arbitrarios** sin justificación.
- **Cambios aquí afectan TODO** — bumpear MAJOR si se modifica un valor existente.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-03 v0.1.1 — Paleta de color oscura del prototipo en lugar de la clara de relleno.
