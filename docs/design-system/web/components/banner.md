---
component: banner
version: 1.4.0
status: active
last_updated: 2026-11-09
source: docs/nerdose.html
related: [alert, button, panel]
---

# Banner

## Propósito

**Descripción:** franja de mensaje con ícono en círculo, título, subtítulo y acción. En el prototipo existe como **banner de resultado** de partida (éxito, fallo y barra neutra de cierre, L614, L626, L868, L1041). La variant `warning` (aviso de cookies bloqueadas, overlay O-03) **es una adaptación de producto**: el prototipo no tiene avisos de sistema, así que toma el layout del banner de resultado y los tintes del panel ámbar "contexto" (L646-647).

**Cuándo usar:**
- Resultado de la partida, arriba de la pantalla de juego terminado.
- Barra de cierre con la racha del juego y la salida.
- Condición persistente que limita lo que el jugador puede hacer sin ser un error (cookies bloqueadas, O-03).

**Cuándo NO usar:**
- Error del sistema que bloquea el contenido → [alert](./alert.md).
- Explicación larga del resultado → [panel](./panel.md) `explain`.

## Anatomía

1. **Container** — `flex-wrap`, `align-items: center`, `justify-content: space-between`, gap 16, padding 18 22, `radius.panel` (14), fondo tintado + borde de 1px del mismo matiz.
2. **Ícono** — círculo de 40×40 (`radius.pill`) relleno del color de estado, con `check` o `x` de 20px y stroke 3 en el `on` del estado (L616, L628).
3. **Textos** — columna, gap 2: **título** `type.title.banner` (Mono 700 18, `text.primary`) y **subtítulo** `type.body.sm.tight` (Inter 14) en el texto suave del estado.
4. **Acción** — [button](./button.md) `md` (grupo con gap 10 y `flex-wrap`).

El grupo ícono + textos va con gap 14 (L615).

## Variants

| Variant | Propósito | Fondo / borde | Ícono | Subtítulo | Acción | Fuente |
|---|---|---|---|---|---|---|
| `success` | Ganaste | `#0C1A12` / `#1E4A30` | `check` sobre `#3DDC84`, color `#06120B` | `#A9C9B5` | `primary` "Siguiente juego →" | L614-623, L868-879 |
| `failure` | Perdiste (sin drama) | `#1C0F0E` / `#4A2220` | `x` sobre `#FF7B72`, color `#1C0605` | `#D9B3AF` | `outline-tinted` con borde `#4A2220` | L626-635 |
| `neutral` | Barra de cierre: racha del juego + countdown | `#0F1318` / `#222A33` | sin ícono | Texto único Mono 14 `#9AA6B2` con `<b>` ámbar y countdown `#E6EDF3` | `outline-tinted` con el borde del juego ("Volver a los juegos", `#3C2E60`) | L1041-1043 |
| `warning` *(adaptación)* | Condición persistente (O-03) | `#140F07` / `#3A2A12` (`status.warning.*`) | *Derivado (S-011):* círculo 40×40 `status.warning` con `!` Lucide de 20px, stroke 3, en `status.warning.on` (`#1A1206`/`#FFB547` 10,5:1) | `#C9A46A` | Opcional | L646-647 (tintes) |

## Sizes

| Size | Padding | Uso |
|---|---|---|
| `default` (único) | 18px 22px | Todas las variants |

## States

| State | Descripción |
|---|---|
| default | Visible mientras dura el resultado o la condición |
| hover / focus / active / disabled | No aplica al contenedor; el foco lo recibe la acción |

## Spacing & sizing rules

- Primer bloque de `main` en la pantalla de juego terminado; `gap` de sección 28 (L611).
- La acción baja debajo del texto cuando no entra (`flex-wrap`).
- `warning`: **decisión** — va bajo el header, alineado al contenedor de página (`max-width: 1240px`, gutter 32), no de borde a borde. El product-map lo ubica "fijo bajo el header" (O-03); el prototipo no define la posición.

## Accesibilidad

- **ARIA:** `role="status"` para `success`, `failure` y `warning` (se anuncian sin interrumpir). `neutral` no necesita rol vivo.
- **Teclado:** el contenedor no es focusable; la acción sí.
- **Foco:** al terminar una partida, el foco no se mueve solo al banner; **Pendiente** definir el manejo de foco del fin de partida.
- **Sin depender del color (NFR-U04):** el ícono (`check` / `x`) y el título ("Bug encontrado en la línea 4", "El bug estaba en la línea 4, no en la 7") dicen el resultado.
- **Contraste:** título `#E6EDF3` sobre `#0C1A12` 15,2:1 y sobre `#1C0F0E` 15,8:1; subtítulos 10,0:1 (`#A9C9B5`) y 9,8:1 (`#D9B3AF`); `neutral` 7,5:1; `warning` 8,2:1 (`#C9A46A`/`#140F07`). Íconos en círculo: 10,7:1 y 7,7:1.

## Guidelines de contenido

- Título con el dato: "Correcto: O(n log n)", "Bug encontrado en la línea 4".
- Subtítulo con las rachas: "Racha de Big O: 9 días · racha global: 17 días".
- Fallo sin culpa: "Desafío completado: tus rachas siguen en pie (Bug Hunt 6 · global 17)".
- `neutral`: "racha de Timeline: **4 días** · próximo desafío en 08:12:45".
- `warning`: qué limita y qué sigue funcionando: "Activá las cookies para poder jugar" + detalle.

## Do's & don'ts

**Do:**
- Mantener el CTA de avanzar en verde (`primary`) aunque el juego sea de otro color.
- Usar `outline-tinted` (no rojo relleno) como acción del banner de fallo.

**Don't:**
- No usar `failure` para errores del sistema: es una partida perdida.
- No usar para `warning` un ícono distinto del `!` documentado.
- No poner más de un banner a la vez.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'success' \| 'failure' \| 'neutral' \| 'warning'` | — | Variant |
| `title` | contenido | — | Título (no en `neutral`) |
| `children` | contenido | — | Subtítulo / texto |
| `action` | nodo | — | Slot para un Button `md` |
| `game` | `GameId` | — | Borde de la acción en `neutral` |

## Componentes y patterns relacionados

- [alert](./alert.md) — error del sistema, misma estética que `failure`.
- [button](./button.md) — acción.
- [panel](./panel.md) — explicación del resultado.

## Separación del banner `warning` (S-012)

El banner O-03 va dentro del contenedor de página (`max-width` 1240, gutter 32) con 24px de separación bajo el header, entre el header y `main`.

## Historial

- 2026-11-05 v0.2.0 — Creación del spec desde `@nerdose/ui`: aviso de advertencia de ancho completo con barra lateral de 4px (O-03).
- 2026-11-05 v1.0.0 — Reescrito como banner de resultado del prototipo (`success`, `failure`, `neutral`: radio 14, borde 1px, ícono en círculo de 40px, padding 18 22) más `warning` como adaptación de producto con los tintes ámbar del panel "contexto". Se elimina la barra lateral de 4px.
- 2026-11-06 v1.2.0 — Ícono de `warning` derivado (`!` en círculo de 40px); `Banner` de `@nerdose/ui` alineado.
- 2026-11-06 v1.3.0 — S-012: separación de 24px bajo el header para `warning`.
- 2026-11-09 v1.4.0 — S-021: `success`, `failure` y `neutral` implementados en `Banner` de `@nerdose/ui`. `neutral` es informativo, con título opcional y sin ícono (REQ-004); `titleAs` (`p` | `h1` | `h2`) para el veredicto como `h1`; `announce` (por defecto `true`, salvo `neutral`) controla `role="status"`; slot `action` con `flex flex-wrap gap-2.5`.
