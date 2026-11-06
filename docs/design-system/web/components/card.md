---
component: card
version: 1.2.0
status: active
last_updated: 2026-11-06
source: docs/nerdose.html
related: [panel, button, chip, streak-pill, streak-number, progress-bar]
---

# Card

## Propósito

**Descripción:** contenedor autónomo que representa **una cosa**: un juego, un paso, un dato. Las tarjetas destacadas de Home llevan radio 16px; las de datos y pasos, 14px; las celdas de stat internas, 10-12px.

**Cuándo usar:**
- Tarjeta de cada juego en el catálogo (Home) y su placeholder "próximo juego".
- Paso de "Cómo funciona".
- Un dato numérico (mini-stat, stat-card, métrica, contador) y la tarjeta por juego de Stats.

**Cuándo NO usar:**
- Bloque con título `//` y contenido variado → [panel](./panel.md).
- Mensaje de resultado o aviso → [banner](./banner.md) / [alert](./alert.md).
- Racha global grande → [streak-number](./streak-number.md) (variant `card`).

## Anatomía (tarjeta de juego)

1. **Container** — `<article>`, `bg.surface`, borde `border.default`, `radius.feature` (16), `overflow: hidden`, columna (L84).
2. **Miniatura** — 150px de alto, fondo `game.{j}.tint`, `border-bottom` `game.{j}.tint-border`, `aria-hidden`: mini-maqueta del juego en divs (detalle en [`patterns/game-boards.md`](../patterns/game-boards.md#miniaturas-de-tarjeta)).
3. **Cuerpo** — padding 20, columna, gap 12, `flex-grow: 1` (L91).
4. **Fila de título** — `h3` en `type.title.card` con el acento del juego + [badge](./chip.md) de estado a la derecha (`justify-content: space-between`, gap 8, L92).
5. **Descripción** — `type.body` (Inter 15/1.5), `text.lede` (L96).
6. **Metadatos** — `type.meta`, `text.dim`, gap 14, `margin-top: auto; padding-top: 8px`; el último ítem "▲ racha N" en `streak.text` (L97-98).
7. **CTA** — [button](./button.md) `md` de ancho completo: `accent` "Jugar →" si está pendiente, `secondary` "Ver resultado" si está resuelto (L100, L142).

## Variants

| Variant | Propósito | Tokens | Ejemplo | Fuente |
|---|---|---|---|---|
| `game` | Tarjeta de un juego del catálogo | `card.game.*` | Devdle, Bug Hunt… | L84-188 |
| `game` + `next` | El próximo juego a jugar: borde de acento + anillo de 1px + glow | `card.next.*` | Big O | L125 |
| `placeholder` | "Próximo juego / próximamente": borde punteado, sin fondo (deja ver los puntos) | `card.placeholder.*` | `$ git checkout -b próximo-juego` | L192-196 |
| `step` | Paso de "Cómo funciona": sin fondo, borde sutil | `card.step.*` | "01 · todos los días" | L248-251 |
| `mini-stat` | Dato chico dentro de un panel, sin borde | `card.mini-stat.*` | "31 récord de racha" | L225-227 |
| `stat` | Dato destacado en Stats | `card.stat.*` | "178 desafíos completados" | L314-317 |
| `metric` | Dato dentro de la tarjeta por juego (grilla 2×2) | `card.metric.*` | "96% victorias" | L344-346 |
| `counter` | Contador de partida; valor en acento si es puntaje | `card.counter.*` | "3/8 encontradas", "02:14 tiempo" | L1109-1110 |
| `game-stats` | Tarjeta por juego en Stats, con barra superior de 4px del acento | `card.game-stats.*` | "Devdle · racha 12 · máx 21" | L335-352 |

**Decisión (prototipo incompleto):** la variant `next` solo está definida para Big O (`#2E4C6E` + `0 0 0 1px #5EB1FF33, 0 18px 40px rgba(20,60,110,0.25)`). Para los otros cuatro juegos se **derivan (S-011)** con el patrón de Big O: borde = un tono existente de la misma escala entre el borde del tinte y el acento; anillo = acento al 20% (`…33`); glow = el matiz del acento oscurecido, al 25% de opacidad.

| Juego | Borde | Sombra | Contraste del borde sobre `#0F1318` |
|---|---|---|---|
| Devdle | `#1E4A30` (`green.800`) | `0 0 0 1px #3DDC8433, 0 18px 40px rgba(20,110,60,0.25)` | 1,8 (decorativo) |
| Bug Hunt | `#5C4419` (`amber.800`) | `0 0 0 1px #FFB54733, 0 18px 40px rgba(110,70,20,0.25)` | 2,0 (decorativo) |
| Big O | `#2E4C6E` | `0 0 0 1px #5EB1FF33, 0 18px 40px rgba(20,60,110,0.25)` | definido |
| Tech Timeline | `#3C2E60` (`purple.850`) | `0 0 0 1px #C39BFF33, 0 18px 40px rgba(70,40,110,0.25)` | 1,6 (decorativo) |
| Grep Grid | `#5B2147` (`pink.850`) | `0 0 0 1px #F472B633, 0 18px 40px rgba(110,20,70,0.25)` | 1,6 (decorativo) |

La señal de `next` no es el color: es el CTA relleno y ser el destino de "Seguir jugando".

**Implementación (S-011):** `Card` de `@nerdose/ui` con `variant` `game` (+ `next`, `thumbnail`), `placeholder`, `step` y `mini-stat`; las miniaturas son `GameThumbnail`. `stat`, `metric`, `counter` y `game-stats` quedan para las stories que las consuman.

## Sizes

| Variant | Radio | Padding | Gap | Extra |
|---|---|---|---|---|
| `game` | 16 | 20 (cuerpo) | 12 | Miniatura 150px |
| `placeholder` | 16 | 28 | 12 | `min-height: 300px` |
| `step` | 14 | 22 | 8 | Kicker Mono 14 con color por paso: 01 `#3DDC84`, 02 `#FFB547`, 03 `#5EB1FF`, 04 `#C39BFF` (L248-251); texto `type.body` `text.body` |
| `mini-stat` | 12 | 14 16 | 4 | Valor `type.numeric.md`; etiqueta Inter 13 `text.muted` |
| `stat` | 14 | 20 | 6 | Valor `type.numeric.xl`; etiqueta Inter 14 `text.muted` |
| `metric` | 10 | 12 | 2 | Valor `type.numeric.sm`; etiqueta Inter 12 `text.muted` |
| `counter` | 12 | 12 18 | 2 | Valor `type.numeric.lg`; etiqueta Mono 12 `text.muted` |
| `game-stats` | 14 | 20 | 16 | Barra 4px; `h3` `type.title.card.compact` en acento; "racha N · máx M" Mono 12 `streak.text`; métricas 2×2 gap 10; [link](./link.md) `subtle` al pie |

## States

| State | Descripción |
|---|---|
| default | Estado base |
| pendiente / resuelto (`game`) | Cambia el badge (`pending` / `success`) y el CTA (`accent` / `secondary`) |
| hover / focus / active | No aplica al contenedor: no es interactivo. El foco lo recibe el CTA. La tarjeta no cambia en hover. |
| disabled | Sin sesión o sin desafío (estados de producto): la tarjeta se ve igual y el CTA pasa a deshabilitado neutro (ver [button](./button.md)). |

## Spacing & sizing rules

- Grilla del catálogo: `repeat(auto-fit, minmax(300px, 1fr))`, gap 20 (L82); 3 columnas en desktop (5 juegos + placeholder = 2 filas). Adaptación 320px en `foundations/grid.md`.
- "Cómo funciona": `minmax(240px, 1fr)`, gap 16. Mini-stats: `minmax(140px, 1fr)`, gap 12. Stat-cards: `minmax(160px, 1fr)`, gap 12. Stats por juego: `minmax(220px, 1fr)`, gap 16.
- Las tarjetas de una fila igualan alto (`grid` + columna con `flex-grow`) y alinean el CTA al pie.

## Accesibilidad

- **ARIA:** `game` y `game-stats` son `<article>` con `aria-labelledby` a su título. La miniatura es `aria-hidden`.
- **Jerarquía:** el título de tarjeta es `h3` bajo el `h2` de la sección ("Los desafíos de hoy").
- **Teclado:** no focusable; el CTA sí.
- **Estado no solo por color:** el badge lleva texto ("✓ resuelto 4/6", "pendiente"); `next` se reconoce también por ser el destino de "Seguir jugando" (L42).
- **Contraste:** descripción `#A9B4BF`/`#0F1318` 8,9:1; metadatos `#8D99A6`/`#0F1318` 6,4:1; racha ámbar 10,6:1; títulos en acento ≥ 7,0:1. El borde de la tarjeta (1,4:1) es decorativo.

## Guidelines de contenido

- Descripción: una o dos frases en voseo ("Adiviná el término técnico del día. Seis intentos, feedback por letra.").
- Metadatos: 3 ítems cortos, el último la racha ("6 intentos", "~2 min", "▲ racha 12").
- Placeholder: prompt git + una frase + chip "próximamente".
- Stat: valor + etiqueta en minúscula ("desafíos completados").

## Do's & don'ts

**Do:**
- Usar radio 16 en tarjetas de juego y paneles destacados de Home; 14 en el resto.
- Teñir miniatura, título y CTA pendiente con el acento del juego.
- Mostrar la racha del juego en ámbar aunque la tarjeta sea de otro color.

**Don't:**
- No agregar sombra salvo en `next`.
- No anidar tarjetas `game`.
- No poner fondo a `placeholder` ni a `step`: dejan ver la textura.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'game' \| 'placeholder' \| 'step' \| 'mini-stat' \| 'stat' \| 'metric' \| 'counter' \| 'game-stats'` | `'game'` | Variant |
| `game` | `GameId` | — | Acento (`game`, `game-stats`, `counter` de puntaje) |
| `next` | `boolean` | `false` | Tarjeta destacada (solo Big O definido) |
| `status` | `'pending' \| 'done'` | — | Badge y CTA de `game` |
| `thumbnail` | nodo | — | Miniatura del juego |
| `value` / `label` | contenido | — | Variants de dato |
| `children` | contenido | — | Cuerpo libre |

## Componentes y patterns relacionados

- [panel](./panel.md), [button](./button.md), [chip](./chip.md) (badge), [streak-pill](./streak-pill.md) (racha inline), [link](./link.md), [`patterns/game-boards.md`](../patterns/game-boards.md) (miniaturas).

## Historial

- 2026-11-05 v0.2.0 — Creación del spec desde `@nerdose/ui` (radio 16, padding 16, sin sombra).
- 2026-11-05 v1.0.0 — Reescrito desde el prototipo: tarjeta de juego con miniatura de 150px, padding 20, badge, metadatos y CTA de ancho completo; variants `next` (anillo + glow, solo Big O), `placeholder`, `step`, `mini-stat`, `stat`, `metric`, `counter` y `game-stats`.
- 2026-11-06 v1.2.0 — Variant `next` derivada para Devdle, Bug Hunt, Tech Timeline y Grep Grid; implementación en `@nerdose/ui`.
- 2026-11-06 v1.2.1 — S-013: tarjeta de juego con `h3`, badge y metadatos en lista; `placeholder` como `li` de la grilla.
