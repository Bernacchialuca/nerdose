---
foundation: color
version: 0.1.1
last_updated: 2026-11-03
status: placeholder
---

# Color

> **Paleta oscura del prototipo** — Los valores salen de `docs/nerdose.html` y de la convención
> `styling` (`@nerdose/ui/tokens.css`). El resto del DS sigue en placeholder.
> Para iterar, ejecutá `/product-design-system-update` y describí los cambios.

## Propósito

Define la paleta de colores del producto y su rol semántico (brand, neutral, semántico).
Consumido por diseñadores al componer pantallas y por desarrolladores al implementar
componentes vía tokens.

## Paleta

El producto es **oscuro**: fondo `#0A0C0F`, texto `#E6EDF3` y acento de marca `#3DDC84` (terminal, JetBrains Mono).

### Brand
| Token | Hex | Uso |
|-------|-----|-----|
| `color.brand.primary` | `#3DDC84` | Acciones primarias, links, foco |
| `color.brand.primary.hover` | `#7CF0B0` | Hover de acciones primarias |
| `color.brand.on-primary` | `#06120B` | Texto sobre fondo de acento |

### Acento por juego (del prototipo `docs/nerdose.html`)
Cada juego tiene un acento propio, usado en su tarjeta de la home, su barra de racha y sus acciones dentro del juego. `color.brand.primary` sigue siendo el de la plataforma.

| Token | Hex | Juego |
|-------|-----|-------|
| `color.game.devdle` | `#3DDC84` | Devdle |
| `color.game.bug-hunt` | `#FFB547` | Bug Hunt |
| `color.game.big-o` | `#5EB1FF` | Big O Challenge |
| `color.game.timeline` | `#C39BFF` | Tech Timeline |
| `color.game.grep-grid` | `#F472B6` | Grep Grid |

El feedback nunca depende solo del color (NFR-U04): suma ícono o patrón.

### Neutral (oscura)
| Token | Hex | Uso |
|-------|-----|-----|
| `color.neutral.950` | `#0A0C0F` | Fondo de página |
| `color.neutral.900` | `#0F1318` | Fondo de superficies (cards) |
| `color.neutral.850` | `#11151A` | Superficie elevada, inputs |
| `color.neutral.800` | `#141920` | Superficie de tercer nivel |
| `color.neutral.750` | `#1E252E` | Bordes sutiles |
| `color.neutral.700` | `#222A33` | Bordes |
| `color.neutral.650` | `#2A323C` | Bordes fuertes, divisores punteados |
| `color.neutral.400` | `#8D99A6` | Texto terciario, etiquetas |
| `color.neutral.300` | `#9AA6B2` | Texto secundario |
| `color.neutral.100` | `#E6EDF3` | Texto principal |

### Semántico
| Token | Hex | Uso |
|-------|-----|-----|
| `color.success` | `#3DDC84` | Estados de éxito (igual al acento de marca) |
| `color.warning` | `#FFB547` | Advertencia, rachas pendientes (igual al acento de Bug Hunt) |
| `color.error` | `#FF7B72` | Estados de error / destructivo |
| `color.info` | `#5EB1FF` | Estados informativos (igual al acento de Big O) |

## Tokens

### Semánticos
| Token | Valor | Uso |
|-------|-------|-----|
| `bg.canvas` | `color.neutral.950` | Fondo de página |
| `bg.surface` | `color.neutral.900` | Fondo de superficies |
| `bg.surface.raised` | `color.neutral.850` | Superficies elevadas e inputs |
| `bg.action.primary` | `color.brand.primary` | Fondo botón primario |
| `text.primary` | `color.neutral.100` | Texto principal |
| `text.muted` | `color.neutral.300` | Texto secundario |
| `text.dim` | `color.neutral.400` | Texto terciario, etiquetas |
| `text.on-action` | `color.brand.on-primary` | Texto sobre fondo de acento |
| `border.default` | `color.neutral.700` | Bordes decorativos de cards y divisores |
| `border.interactive` | `color.neutral.400` | Borde de controles interactivos (≥3:1) |

### De componente
A definir cuando se documenten componentes específicos (ver `components/`).

## Guidelines

**Do:**
- Usar tokens semánticos en componentes, NUNCA primitivos directos.
- Reservar `color.brand.primary` para acciones críticas (1 por pantalla).
- Aplicar el texto `color.brand.on-primary` sobre cualquier fondo de acento.
- Usar `color.error` solo para errores reales del usuario.

**Don't:**
- No usar más de 2 tonos del brand en una misma pantalla.
- No usar `color.neutral.700` ni más oscuros como único borde de un control interactivo (contraste bajo): usar `border.interactive`.
- No usar colores semánticos para decoración.
- No declarar hex hardcoded en componentes.

## Accesibilidad

- Contraste texto sobre fondo: **≥4.5:1** (WCAG AA para body ≥16pt). Medido sobre `#0A0C0F`: texto principal 16,6:1, secundario 7,9:1, terciario 6,8:1, acento 11,0:1, error 7,8:1; texto `#06120B` sobre el acento 10,7:1.
- Contraste texto grande (≥18pt o ≥14pt bold): **≥3:1**.
- Bordes interactivos visibles: **≥3:1** contra fondo adyacente.
- No comunicar estado solo con color (combinar con icono o texto).

## Ejemplos

A linkear cuando se documenten componentes que usen esta foundation.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial (bootstrap automático).
- 2026-11-03 v0.1.1 — Se reemplaza la paleta clara de relleno por la oscura del prototipo (`#0A0C0F`, `#3DDC84`).
- 2026-11-03 — `color.brand.primary` = `#3DDC84`, confirmado por el usuario en /product-ux-generate (acento del prototipo `docs/nerdose.html`).
