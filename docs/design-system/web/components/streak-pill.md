---
component: streak-pill
version: 1.0.0
status: active
last_updated: 2026-11-05
source: docs/nerdose.html
related: [streak-number, app-header, game-header, card, panel]
---

# Streak pill (y racha inline)

## Propósito

**Descripción:** muestra la racha global en el header como píldora ámbar con llama (L26, L447, L607, L862, L993, L1097). Incluye las formas **inline** de la racha (texto ámbar sin fondo) que aparecen en tarjetas y paneles. **La racha siempre es ámbar**, sin importar el acento del juego.

**Cuándo usar:**
- `pill`: racha global en el header de Home (como link a Stats) y de cada juego.
- `inline`: racha de un juego dentro de un panel o tarjeta ("racha 12", "▲ racha 12", "racha 5 · máx 11").

**Cuándo NO usar:**
- Racha como dato protagonista → [streak-number](./streak-number.md).

## Anatomía (`pill`)

1. **Container** — `display: flex`, gap 8, padding 10 14, borde 1px `streak.border` (`#3A2A12`), fondo `streak.bg` (`#1A140A`), `radius.pill`.
2. **Ícono** — `flame` 16×16, stroke 2, `aria-hidden`.
3. **Valor** — `type.mono.strong` (Mono 700 14), `streak.text` (`#FFB547`).

## Variants

| Variant | Contenido | Elemento | Fuente |
|---|---|---|---|
| `pill` (header global) | "17 días" | `<a href>` a Stats con `aria-label="Racha global: 17 días"` | L26 |
| `pill` (header de juego) | "17" | `<span>` | L447, L607, L862, L993, L1097 |
| `inline` (panel) | "racha 12" | Mono 13, `streak.text`, sin fondo | L504, L701, L1130 |
| `inline` (metadato de tarjeta) | "▲ racha 12" | Mono 12, `streak.text` | L98 |
| `inline` (tarjeta de Stats) | "racha 12 · máx 21" | Mono 12, `streak.text` | L340 |
| `inline` (barra de cierre) | "**4 días**" en `<b>` | Mono 14 700 dentro del texto | L1042 |

Stats no muestra la píldora en el header.

## Sizes

| Variant | Alto aprox. | Tipografía |
|---|---|---|
| `pill` | ~40px (14 + 2×10 + borde) | `type.mono.strong` |
| `inline` | — | `type.label.comment` (13) o `type.meta` (12) |

## States

| State | Descripción |
|---|---|
| default | Valor actual |
| sin racha / desconocida | **Pendiente — el prototipo no lo define** (estado de producto: sin sesión o sin datos) |
| hover / focus (`pill` como link) | **Pendiente** / requisito de foco visible |

## Spacing & sizing rules

- En el header global va antes del selector (gap 10); en el de juego, al final (gap 8).
- **Área táctil:** la píldora-link mide ~40px de alto. **Adaptación requerida:** 44px de área táctil cuando es link (forma **Pendiente**).

## Accesibilidad

- **ARIA:** la píldora-link lleva `aria-label` completo ("Racha global: 17 días"). **Requisito:** la píldora `<span>` del header de juego, que solo dice "17", necesita un nombre accesible equivalente (texto oculto "racha global:" o `aria-label` en un elemento con rol).
- **Contraste:** `#FFB547`/`#1A140A` 10,4:1; sobre `#0F1318` 10,6:1.
- **No solo color:** la palabra "racha"/"días" o la llama acompañan siempre al número.

## Guidelines de contenido

- Global en Home: "{n} días"; en juego: "{n}".
- Inline: "racha {n}", "▲ racha {n}", "racha {n} · máx {m}".

## Do's & don'ts

**Do:** usar ámbar en todos los contextos. **Don't:** pintar la racha con el acento del juego.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'pill' \| 'inline'` | `'pill'` | Forma |
| `value` | `number` | — | Días |
| `max` | `number` | — | Récord (inline de Stats) |
| `href` | `string` | — | Si se pasa, la píldora es link |
| `withUnit` | `boolean` | `false` | Agrega "días" |

## Componentes y patterns relacionados

- [streak-number](./streak-number.md), [app-header](./app-header.md), [game-header](./game-header.md), [panel](./panel.md), [card](./card.md).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: píldora ámbar con llama (link en Home, span en juegos) y formas inline de la racha.
