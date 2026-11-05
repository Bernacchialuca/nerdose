---
component: progress-bar
version: 1.0.0
status: active
last_updated: 2026-11-05
source: docs/nerdose.html
related: [panel, streak-pill, heatmap]
---

# Progress bar

## Propósito

**Descripción:** barras redondeadas (`radius.pill`) que muestran avance. Dos formas en el prototipo: **segmentada** (progreso del día, L73-79) y **barra de racha por juego** (L233-241, L276-280). La barra de distribución de intentos de Devdle es propia del juego (ver [`patterns/game-boards.md`](../patterns/game-boards.md)).

**Cuándo usar:**
- `segmented`: juegos completados hoy sobre el total.
- `streak`: racha de cada juego comparada con la racha global.

**Cuándo NO usar:** progreso de carga (no existe en el prototipo).

## Anatomía

### `segmented`
1. **Contenedor** — `display: flex; gap: 6px`.
2. **Segmentos** — uno por juego, 36×6, `radius.pill`: completado `accent.brand` (`#3DDC84`), pendiente `bg.control.selected` (`#2A323C`).

### `streak`
1. **Fila** — `flex; justify-content: space-between`, `type.mono.body` (Mono 14): nombre del juego (`text.primary`) / "{n} días" (`text.lede`).
2. **Track** — alto 8, `bg.track` (`#1A2028`), `radius.pill`, `overflow: hidden`.
3. **Fill** — alto 100%, `radius.pill`, ancho `round(días / racha global × 100)%`, color `game.{j}.accent`.

## Variants

| Variant | Uso | Fuente |
|---|---|---|
| `segmented` | Cabecera de "Los desafíos de hoy", a la derecha | L73-79 |
| `streak` | Panel "// rachas por juego"; lista columna gap 14, ítem gap 6 | L231-241 |

## Sizes

| Variant | Medidas |
|---|---|
| `segmented` | Segmento 36×6, gap 6 |
| `streak` | Track de 8px de alto, ancho completo |

## States

| Variant | State | Estilo |
|---|---|---|
| `segmented` | completado / pendiente | verde / `#2A323C` |
| `streak` | 0 días | **Pendiente — el prototipo no lo define** (todos los ejemplos tienen > 0) |

## Spacing & sizing rules

- `streak` escala relativa a la racha global (17 en el ejemplo, L279), no a un máximo fijo.
- Nota al pie del panel: Inter 13/1.5 `text.muted`, `margin-top: 6px` (L241).

## Accesibilidad

- **`segmented`:** `aria-label="Progreso del día: 2 de 5"` (L73) o `role="progressbar"` con `aria-valuenow`/`aria-valuemax`. El dato también está en texto al lado ("// 5 juegos · 2 completados", L70), por eso el contraste bajo del segmento pendiente (1,4:1) no bloquea.
- **`streak`:** el valor está en texto ("12 días"); la barra es redundante y puede ir `aria-hidden`.
- **Contraste:** "{n} días" `#A9B4BF`/`#0F1318` 8,9:1.

## Guidelines de contenido

- `streak`: "{nombre del juego}" / "{n} días".

## Do's & don'ts

**Do:** pintar cada barra de racha con el acento de su juego. **Don't:** usar barras sin el dato en texto.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'segmented' \| 'streak'` | — | Variant |
| `value` / `total` | `number` | — | Completados / total (`segmented`) |
| `days` / `reference` | `number` | — | Racha del juego / racha global (`streak`) |
| `game` | `GameId` | — | Acento (`streak`) |
| `label` | `string` | — | Nombre accesible |

## Componentes y patterns relacionados

- [panel](./panel.md) `feature`, [streak-pill](./streak-pill.md), [heatmap](./heatmap.md).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: barra segmentada del día (36×6, gap 6) y barra de racha por juego (track 8px relativo a la racha global).
