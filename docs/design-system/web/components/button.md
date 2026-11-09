---
component: button
version: 1.3.0
status: active
last_updated: 2026-11-09
source: docs/nerdose.html
related: [link, card, banner, alert, game-header]
---

# Button

## Propósito

**Descripción:** dispara una acción o lleva a la siguiente pantalla con aspecto de botón. En `web` es una familia de botones en JetBrains Mono con **radio de 10px** (L42, L43, L100, L142, L443, L622, L836, L1043), en dos tamaños (48 y 44px) y con el acento del contexto.

**Cuándo usar:**
- CTA del hero ("Seguir jugando →", "¿Cómo funciona?").
- CTA de una tarjeta de juego ("Jugar →", "Ver resultado").
- Acción del banner de resultado ("Siguiente juego →", "Volver a los juegos").
- Acciones del header de juego (ayuda, estadísticas, Compartir).
- Confirmar la jugada ("Confirmar línea 4 →").

**Cuándo NO usar:**
- Navegación de texto ("ver estadísticas →") → [link](./link.md).
- Elegir idioma → [language-selector](./language-selector.md).
- Piezas de juego (teclas, celdas, opciones de Big O) → [`patterns/game-boards.md`](../patterns/game-boards.md).

## Anatomía

1. **Container** — caja con `radius.control` (10px); relleno, borde de 1px o borde punteado según la variant.
2. **Label** — texto Mono; peso 700 en rellenos, 500 en outline.
3. **Ícono (opcional)** — SVG Lucide de 16px antes del label (Compartir), o `→` decorativo (`aria-hidden`) después del label en CTA de avance.

## Variants

| Variant | Propósito | Tokens | Ejemplo | Fuente |
|---|---|---|---|---|
| `primary` | Acción principal de la plataforma; avanzar | `button.primary.*` (`accent.brand` / `accent.brand.on`) | "Seguir jugando →", "Siguiente juego →" | L42, L622, L877 |
| `secondary` | Alternativa neutra (outline) | `button.secondary.*` (`border.control`, `text.primary`, 500) | "¿Cómo funciona?", "Ver resultado" | L43, L100, L121 |
| `accent` | Acción principal **dentro del contexto de un juego**: relleno con el acento del juego | `button.accent.*` (`game.{j}.accent` / `game.{j}.on`) | "Jugar →" en la tarjeta de Big O; Compartir activo; Confirmar | L142, L166, L188, L604, L836, L860, L991 |
| `outline-tinted` | Salida o alternativa con el borde tintado del contexto | `button.outline-tinted.*` | "Volver a los juegos" (violeta), acción del banner de fallo (rojo) | L634, L1043 |
| `ghost` | Acción menor, provisional (borde punteado) | `button.ghost.*` | "↺ reiniciar demo" | L745 |
| `icon` | Acción solo-ícono de 44×44 | `button.icon.*` | "Cómo se juega" (`circle-help`), "Estadísticas" (`chart`) | L443, L444 |

**Compartir** es `accent` (tamaño `share`) con ícono `share`: activo al terminar la partida, deshabilitado durante el juego (L445, L601, L604).

**Decisión (prototipo ambiguo):** el outline mediano aparece con tres pesos: 500 ("Ver resultado", L100), 700 (acción del banner de fallo, L634) y 400 ("Volver a los juegos", L1043). El DS fija **500** para `secondary` y `outline-tinted` (el uso más frecuente); los otros dos se registran como variación del prototipo.

## Sizes

| Size | Alto mínimo | Padding horizontal | Gap | Tipografía | Uso | Fuente |
|---|---|---|---|---|---|---|
| `lg` | 48px | 22px | 10px | `type.button.lg` (15) | Hero, Confirmar | L42, L43, L836 |
| `md` | 44px | 16px | 8px | `type.button.md` (14) | Banner, salida | L622, L1043 |
| `md` full-width | 44px | — (centrado) | — | `type.button.md` | CTA de tarjeta de juego | L100, L142 |
| `share` | 44px (alto fijo) | 14px | 8px | `type.button.md` | Compartir | L445 |
| `sm` (solo `ghost`) | 40px | 14px | — | `type.label.comment` (13/400) | Reiniciar | L745 |
| `icon` | 44×44 | — | — | ícono 18px | Header de juego | L443 |

## States

| State | Descripción | Tokens |
|---|---|---|
| default | Estado base de cada variant | `button.{variant}.*` |
| hover | **Derivado (S-011).** `primary`: fondo `accent.brand` → `accent.brand.hover` (`#7CF0B0`), texto `#06120B` (13,6:1). `accent`: fondo `game.{j}.accent` → `game.{j}.hover` con su on-accent (devdle 13,6 · bug-hunt 12,9 · big-o 11,4 · timeline 11,9 · grep-grid 10,3). `secondary`: borde `border.control` (`#2A323C`) → `border.control.hover` (`#3A424C`, `neutral.600`); el texto no cambia. Sin transición. Deshabilitado: sin hover. | `button.*.hover` |
| focus | **Requisito** de accesibilidad: foco visible con ≥ 3:1. Único precedente del prototipo: `outline 2px solid <acento>; outline-offset: -2px` (L756). Estética global **Pendiente**. | `button.focus.outline` |
| active | **Pendiente — el prototipo no lo define.** | — |
| disabled (neutro) | Fondo `bg.control`, borde `border.control`, texto `text.disabled`, `cursor: not-allowed` (Compartir, L445) | `button.disabled.*` |
| disabled (`accent` de Bug Hunt) | Fondo `#2A2416`, texto `#8A7856`, label que explica qué falta ("Elegí una línea") (L836) | `button.accent.disabled.*` |
| loading | **Pendiente — el prototipo no lo define.** | — |

**Implementación:** `buttonClass({ variant, size, game?, fullWidth?, disabled? })` de `@nerdose/ui` (`packages/ui/src/components/button-class.ts`) devuelve las clases para `<button>` y `<Link>`; el consumidor pone `aria-disabled="true"` y bloquea la acción. Se implementan `primary`, `secondary` y `accent` en `lg`/`md`; el resto de las variants queda para las stories que las consuman.

**Decisión:** el prototipo solo define deshabilitado para Compartir (neutro) y Confirmar (ámbar). El estado deshabilitado de `primary`, `secondary` y `accent` fuera de Bug Hunt usa el **neutro** de Compartir. El deshabilitado tintado de otros juegos queda Pendiente.

## Spacing & sizing rules

- **Padding interno:** según size (22 / 16 / 14); el alto lo fija `min-height`.
- **Separación label–ícono:** 10px (`lg`), 8px (`md`, `share`).
- **Grupo de botones:** `gap: 12px` y `flex-wrap` en el hero (L41, con `padding-top: 6px`); `gap: 10px` en la acción del banner (L876); 8px entre acciones del header de juego (L442).
- **En tarjeta:** el CTA ocupa el ancho completo y va al pie (después de la fila de metadatos con `margin-top: auto`).
- **Min/max:** sin ancho máximo; el texto no se corta.

## Accesibilidad

- **ARIA:**
  - Deshabilitado: usar `aria-disabled="true"` (no el atributo `disabled`) para que siga en el orden de tabulación y el lector anuncie el motivo. **Adaptación:** el prototipo usa `disabled` + `title="Disponible al terminar la partida"` (L445); `title` no lo ven teclado ni táctil, así que el motivo va en el nombre accesible ("Compartir resultado (disponible al terminar)", como ya hace su `aria-label`) o en un texto visible.
  - `icon`: `aria-label` obligatorio ("Cómo se juega", "Estadísticas", L443-444); el SVG `aria-hidden`.
  - `→` decorativo con `aria-hidden` (L42).
- **Teclado:** `Enter` activa (`<a>` y `<button>`); `Space` activa `<button>`. `Tab` en orden del DOM.
- **Foco:** requisito, ver States.
- **Screen reader:** el label se entiende sin el ícono. Para `<a>` que se ve como botón, el rol sigue siendo link.
- **Contraste:** `primary` 10,7:1; `secondary` `#E6EDF3`/`#0A0C0F` 16,6:1; `accent` on/acento ≥ 7,1:1 en los 5 juegos; `icon` `#C3CCD5`/`#11151A` 11,3:1; `ghost` `#9AA6B2` 7,9:1. Deshabilitados exentos (4,0 y 3,6). El borde `border.control` (1,5:1) no es requisito porque la etiqueta identifica al control (WCAG 1.4.11).
- **Área táctil:** `ghost` (40px) necesita área de 44px: **adaptación requerida**, forma **Pendiente**.

## Guidelines de contenido

- Verbo en imperativo con voseo o sustantivo de acción: "Jugar", "Confirmar línea 4", "Ver resultado", "Seguir jugando".
- `→` al final de todo CTA de avance.
- El deshabilitado dice qué falta: "Elegí una línea" (L836), no "Confirmar".
- Frase normal (mayúscula inicial) en botones; sin punto final.
- Todo label pasa por i18n (ES/EN): "Seguir jugando →" / "Keep playing →".

## Do's & don'ts

**Do:**
- Usar `radius.control` (10px) en todos los botones.
- Un solo relleno principal por vista de foco (hero, tarjeta, banner).
- Usar `accent` con el acento del juego en su pantalla y en su tarjeta; `primary` (verde) para avanzar de juego.
- Cambiar el CTA de tarjeta según estado: pendiente → `accent` "Jugar →"; resuelto → `secondary` "Ver resultado" (L100 vs L142).

**Don't:**
- No dejar botones sin radio.
- No usar `#06120B` sobre un acento que no sea verde: cada acento tiene su `on`.
- No usar `disabled` HTML sin explicar el motivo de forma accesible.
- No usar `ghost` para acciones principales.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'accent' \| 'outline-tinted' \| 'ghost' \| 'icon'` | `'primary'` | Variant visual |
| `size` | `'lg' \| 'md' \| 'share' \| 'sm'` | `'md'` | Tamaño (`sm` solo con `ghost`) |
| `game` | `GameId` | — | Acento para `accent` y `outline-tinted` |
| `tint` | `'error' \| 'game'` | `'game'` | Origen del borde de `outline-tinted` |
| `fullWidth` | `boolean` | `false` | Ancho completo (CTA de tarjeta) |
| `disabled` | `boolean` | `false` | Se renderiza con `aria-disabled` |
| `as` | `'a' \| 'button'` | `'button'` | Link de navegación o botón |
| `icon` | nodo | — | Ícono previo (16px) |
| `trailingArrow` | `boolean` | `false` | Agrega `→` decorativo |
| `aria-label` | `string` | — | Obligatorio en `icon` |

**Slots:** `children` (label), `icon`. **Eventos:** `onClick`.

## Componentes y patterns relacionados

- [link](./link.md) — navegación de texto con flecha.
- [card](./card.md) — CTA al pie de la tarjeta de juego.
- [banner](./banner.md) / [alert](./alert.md) — acción del banner.
- [game-header](./game-header.md) — botones `icon` y Compartir.

## Historial

- 2026-11-05 v0.2.0 — Creación del spec a partir de `cta.ts` (sin radio, variants `primary`/`secondary`/`disabled`).
- 2026-11-05 v1.0.0 — Reescrito desde el prototipo: radio 10px, tamaños `lg` (48) / `md` (44) / `share` / `sm` / `icon` (44×44), variants `accent`, `outline-tinted`, `ghost` e `icon`; `secondary` pasa a texto `text.primary` con borde `border.control` y peso 500; deshabilitado neutro y tintado. Se elimina la variant `disabled` (pasa a ser estado) y los tokens reservados `destructive`.
- 2026-11-06 v1.2.0 — Hover derivado de `primary`, `accent` y `secondary` (con contraste medido) y helper `buttonClass` en `@nerdose/ui`.
- 2026-11-09 v1.3.0 — S-021: `icon` (44×44) y tamaño `share` implementados en `buttonClass` de `@nerdose/ui`. Hover de `icon` derivado (`border.control` a `border.control.hover`). `outline-tinted` y `ghost` siguen pendientes de implementación.
