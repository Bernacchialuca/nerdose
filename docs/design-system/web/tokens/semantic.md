---
tokens: semantic
version: 0.2.0
last_updated: 2026-11-05
status: placeholder
---

# Tokens — Semantic (alias)

> **Placeholder inicial** — Tier 2: tokens semánticos. Mapean primitivos a
> roles funcionales (qué hace, no qué es).

## Propósito

Tier 2 de la jerarquía de tokens. Cada semántico mapea a uno o más
primitivos (`tokens/reference.md`). Los componentes consumen estos
semánticos, NUNCA los primitivos directamente.

Los semánticos comunican **intención** (`bg.action.primary`), no apariencia
(`color.blue.500`). Esto permite cambiar la paleta sin tocar componentes.

## Color

### Background
| Token | Valor | Uso |
|-------|-------|-----|
| `bg.canvas` | `color.neutral.950` | Fondo general de la página |
| `bg.surface` | `color.neutral.900` | Fondo de cards, modales |
| `bg.surface.raised` | `color.neutral.850` | Superficies elevadas, inputs |
| `bg.action.primary` | `color.green.500` | Botón primario |
| `bg.action.primary.hover` | `color.green.300` | Hover de botón primario |
| `bg.success` | `color.green.500` | Estado de éxito |
| `bg.error` | `color.red.500` | Estado de error |

### Text
| Token | Valor | Uso |
|-------|-------|-----|
| `text.primary` | `color.neutral.100` | Texto principal |
| `text.secondary` | `color.neutral.300` | Texto secundario |
| `text.dim` | `color.neutral.400` | Texto terciario, etiquetas |
| `text.inverse` | `color.green.950` | Texto sobre fondo de acento |
| `text.action.primary` | `color.green.500` | Links, botón secondary |
| `text.error` | `color.red.500` | Mensaje de error (Alert) |
| `text.warning` | `color.amber.500` | Título de advertencia (Banner O-03) |

### Border
| Token | Valor | Uso |
|-------|-------|-----|
| `border.default` | `color.neutral.700` | Bordes decorativos |
| `border.strong` | `color.neutral.650` | Bordes fuertes, divisores |
| `border.interactive` | `color.neutral.400` | Borde de controles interactivos (≥3:1) |
| `border.focus` | `color.green.500` | Borde de elemento focused |
| `border.error` | `color.red.500` | Borde de elemento inválido, barra de la Alert |
| `border.warning` | `color.amber.500` | Barra lateral del Banner de advertencia |

## Spacing (placeholder)

| Token | Valor | Uso |
|-------|-------|-----|
| `space.inline.sm` | `space.2` | Gap inline pequeño |
| `space.inline.md` | `space.3` | Gap inline default |
| `space.stack.sm` | `space.3` | Gap vertical entre líneas |
| `space.stack.md` | `space.4` | Gap vertical entre párrafos |
| `space.stack.lg` | `space.5` | Gap vertical entre secciones |
| `space.padding.compact` | `space.2` | Padding interno compacto |
| `space.padding.default` | `space.3` | Padding interno default |
| `space.padding.spacious` | `space.4` | Padding interno holgado |

## Typography (placeholder)

| Token | Valor | Uso |
|-------|-------|-----|
| `text.heading.l` | `font.size.2xl` + `font.weight.bold` | h1 |
| `text.heading.m` | `font.size.xl` + `font.weight.semibold` | h2 |
| `text.heading.s` | `font.size.lg` + `font.weight.semibold` | h3 |
| `text.body` | `font.size.md` + `font.weight.regular` | Body |
| `text.caption` | `font.size.xs` + `font.weight.regular` | Caption |

## Reglas

- **Componentes consumen semánticos, NUNCA primitivos.**
- **Cambiar el mapeo de un semántico** = MAJOR (rompe consumidores).
- **Agregar nuevos semánticos** = MINOR.
- **Ajuste de valor primitivo subyacente** = patch en `reference.md`, no acá.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-03 v0.1.1 — Alias de color remapeados a la paleta oscura.
- 2026-11-05 v0.2.0 — Se agregan `text.warning` y `border.warning`; se documenta el uso de `text.error` y `border.error` en Alert.
