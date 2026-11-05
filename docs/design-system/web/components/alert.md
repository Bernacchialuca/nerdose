---
component: alert
version: 1.0.0
status: active
last_updated: 2026-11-05
source: docs/nerdose.html (adaptación del banner de fallo, L626-635)
related: [banner, button]
---

# Alert

## Propósito

**Descripción:** mensaje de **error del sistema** que se anuncia de inmediato, con acción de recuperación opcional. **Es una adaptación de producto:** el prototipo no tiene errores de sistema. Su estética sale del [banner](./banner.md) `failure` (L626-635): mismo tinte rojo, ícono `x` en círculo y acción `outline-tinted`.

**Cuándo usar:**
- Falla al cargar el estado del día en Home (alerta-sistema), con "Reintentar".
- Cualquier error que deja la vista sin su contenido principal.

**Cuándo NO usar:**
- Partida perdida → [banner](./banner.md) `failure`.
- Advertencia que no es error (cookies bloqueadas) → [banner](./banner.md) `warning`.
- Error de una jugada → hint del juego (ver [`patterns/game-boards.md`](../patterns/game-boards.md)).

## Anatomía

1. **Container** — `status.error.bg` (`#1C0F0E`), borde 1px `status.error.border` (`#4A2220`), `radius.panel` (14), padding 18 22, `flex-wrap`, gap 16.
2. **Ícono** — círculo 40×40 `status.error` (`#FF7B72`) con `x` 20px stroke 3 en `status.error.on` (`#1C0605`).
3. **Título** — qué pasó, `type.title.banner` (Mono 700 18), `text.primary`.
4. **Detalle (opcional)** — `type.body.sm.tight` (Inter 14), `status.error.text-soft` (`#D9B3AF`).
5. **Acción (opcional)** — [button](./button.md) `outline-tinted` `md` con borde `status.error.border`.

## Variants

| Variant | Propósito | Tokens | Ejemplo |
|---|---|---|---|
| `error` (único) | Error del sistema | `alert.*` | "No pudimos cargar los juegos de hoy" |

## Sizes

| Size | Padding | Uso |
|---|---|---|
| `default` (único) | 18px 22px | Todos los casos |

## States

| State | Descripción |
|---|---|
| default | Visible al ocurrir el error |
| hover / focus / active / disabled | No aplica al contenedor; el foco lo recibe la acción |

## Spacing & sizing rules

- Ocupa el ancho del contenedor de página (no de borde a borde).
- Va en el lugar del contenido que falló; el resto de la vista sigue visible.

## Accesibilidad

- **ARIA:** `role="alert"`: se anuncia en cuanto aparece. Solo para errores.
- **Teclado:** la acción es alcanzable con `Tab`.
- **Foco:** no se mueve automáticamente.
- **Sin depender del color:** ícono `x` + título con texto.
- **Contraste:** título 15,8:1; detalle 9,8:1; ícono 7,7:1.

## Guidelines de contenido

- Qué pasó + qué hacer, en lenguaje llano: "No pudimos cargar los juegos de hoy." + "Reintentar".
- Sin códigos técnicos ni culpa al jugador.
- Todo texto pasa por i18n (ES/EN).

## Do's & don'ts

**Do:**
- Ofrecer siempre una acción de recuperación cuando existe.
- Mantener visible el contenido que no falló.

**Don't:**
- No mostrar más de una Alert a la vez.
- No usar la Alert para advertencias o resultados de partida.
- No usar la barra lateral de 4px (estética previa, sin base en el prototipo).

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `title` | contenido | — | Qué pasó |
| `children` | contenido (opcional) | — | Detalle |
| `action` | nodo (opcional) | — | Button `outline-tinted` |

## Componentes y patterns relacionados

- [banner](./banner.md) — misma anatomía; `failure` para partidas, `warning` para avisos.
- [button](./button.md) — acción.

## Historial

- 2026-11-05 v0.2.0 — Creación del spec desde `@nerdose/ui` (barra lateral de 4px, `role="alert"`).
- 2026-11-05 v1.0.0 — Se declara adaptación de producto y se alinea con el banner de fallo del prototipo: tinte `#1C0F0E` / `#4A2220`, radio 14, padding 18 22, ícono `x` en círculo, título + detalle y acción `outline-tinted`.
