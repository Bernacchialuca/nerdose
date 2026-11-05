---
component: button
version: 0.2.0
status: experimental
last_updated: 2026-11-05
related: [card, alert]
---

# Button

## Propósito

**Descripción:** acción o navegación principal de una pantalla, con estética terminal (sin radio, JetBrains Mono). Hoy vive como clases compartidas en `web` (`apps/web/src/components/cta.ts`), no como componente de `@nerdose/ui`: la mayoría de los CTA son enlaces de React Router, que `ui` no puede importar.

**Cuándo usar:**
- CTA de una tarjeta de juego ("Jugar", "Seguir jugando", "Ver resultado").
- Acción de recuperación ("Reintentar" en un error, "Volver a los juegos" en la 404).
- Cualquier acción que deba verse como botón aunque navegue (renderizado como `<a>`).

**Cuándo NO usar:**
- Para enlaces dentro de un párrafo o de la navegación del header: usar un link de texto.
- Para alternar idioma u opciones: usar el selector de idioma (control segmentado).
- Para más de una acción `primary` en la misma vista de foco (ver Do's & don'ts).

## Anatomía

1. **Container** — caja de 44px de alto mínimo, sin radio.
2. **Label** — texto de la acción, en el idioma activo.
3. **Icono (opcional)** — flecha `→` o `←`, decorativa (`aria-hidden`), después o antes del label.

## Variants

| Variant | Propósito | Tokens / Foundations | Ejemplo de uso |
|---------|-----------|----------------------|----------------|
| `primary` | Acción principal de la vista | `button.primary.*` | "Jugar →", "← Volver a los juegos" |
| `secondary` | Acción alternativa o de recuperación | `button.secondary.*` | "Ver resultado", "Reintentar" |
| `disabled` | Acción visible pero no disponible (sin desafío, sin sesión) | `button.disabled.*` | "Sin desafío hoy" |

`destructive` no existe todavía en `web` (no hay acciones destructivas del jugador). Los tokens `button.destructive.*` quedan reservados.

## Sizes

| Size | Alto | Padding horizontal | Uso |
|------|------|--------------------|-----|
| `md` (único) | 44px mínimo (`min-h-11`) | `space.4` (16px) | Todos los CTA; cumple el área táctil de 44px |

En mobile el CTA principal de una vista centrada puede ocupar el ancho completo (`w-full`) y volver a ancho automático desde `lg`.

## States

| State | Descripción | Tokens afectados |
|-------|-------------|------------------|
| default | Estado base | `button.{variant}.bg`, `.text`, `.border` |
| hover | **Pendiente** — no hay estilo de hover implementado; candidato: `button.primary.bg.hover` (`bg.action.primary.hover`) | — |
| focus | Contorno de 2px con 2px de separación en el acento | `button.focus.outline` |
| active | **Pendiente** | — |
| disabled | Variant propia: no es interactivo pero sigue en el orden de tabulación | `button.disabled.*` |
| loading | **Pendiente** — no se usa en v1 | — |

## Spacing & sizing rules

- **Padding interno:** horizontal `space.4` (16px); el alto lo fija `min-h` de 44px.
- **Separación label–icono:** `space.2` (8px).
- **Margen externo:** el contenedor decide; en una Card el CTA va al pie (`mt-auto`), en una Alert dentro del slot de acción (`space.3` arriba).
- **Min/max:** alto mínimo 44px. Sin ancho máximo; el texto no se corta (sin `whitespace-nowrap`).

## Accesibilidad

- **ARIA:** la variant `disabled` se implementa como `<button type="button" aria-disabled="true">`, no con `disabled`, para que siga siendo alcanzable con el teclado y el lector anuncie por qué no se puede jugar.
- **Teclado:** `Enter` activa (`<a>` y `<button>`), `Space` activa (`<button>`). `Tab` recorre en el orden del DOM.
- **Foco:** `outline` de 2px en `color.brand.primary` con 2px de offset (contraste 11:1 sobre el fondo de página), solo con `:focus-visible`.
- **Screen reader:** los iconos de flecha llevan `aria-hidden="true"`; el label tiene que describir la acción sin ellos.
- **Contraste:** texto `primary` (`#06120B` sobre `#3DDC84`) 10,7:1; texto `secondary` (acento sobre `bg.surface`) 10,4:1; texto `disabled` (`text.dim` sobre `bg.surface`) 6,4:1.

## Guidelines de contenido

- Verbo en infinitivo o imperativo corto: "Jugar", "Reintentar", "Ver resultado".
- Sin punto final ni emojis.
- La variant `disabled` dice el motivo, no la acción: "Sin desafío hoy", no "Jugar".
- Todo label pasa por i18n (ES/EN).

## Do's & don'ts

**Do:**
- Una sola acción `primary` por tarjeta o por vista de foco.
- Usar `<a>` (Link) cuando la acción navega y `<button>` cuando ejecuta algo en el lugar.
- Mantener la estética sin radio: el radio queda reservado a Card.

**Don't:**
- No usar `disabled` HTML: saca el control del foco y el jugador no se entera del motivo.
- No pintar el borde de un control interactivo con `border.strong` ni más oscuro (1,5:1): usar `border.interactive` (≥3:1).
- No depender solo del color para distinguir `primary` de `secondary`: el `primary` también va en negrita.

## API

Clases compartidas en `web` (`cta.ts`), framework-agnóstico en concepto:

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'disabled'` | `'primary'` | Variant visual y semántica |
| `as` | `'a' \| 'button'` | `'button'` | Elemento: link de navegación o botón |
| `fullWidthMobile` | `boolean` | `false` | `w-full` en mobile, ancho automático desde `lg` |
| `children` | contenido | — | Label (y icono opcional) |

**Implementación actual:** `CTA_PRIMARY`, `CTA_SECONDARY`, `CTA_DISABLED` y `FOCUS` en `apps/web/src/components/cta.ts`. Los consumen la home (`catalog`), la 404 (`not-found.tsx`) y la pantalla de error de ruta (`route-error.tsx`). El borde de `secondary` es `border-border-interactive` (`--color-border-interactive`, `#8D99A6`).

## Componentes y patterns relacionados

- **card** — el CTA de una tarjeta de juego va al pie de la Card.
- **alert** — "Reintentar" va en el slot `action` de la Alert.

## Historial

- 2026-11-05 v0.2.0 — Creación del spec a partir de la implementación de REQ-002 (`cta.ts`). Variants `primary`, `secondary`, `disabled`; hover, active y loading quedan pendientes.
- 2026-11-05 v0.2.0 — El código queda alineado con el spec: `secondary` usa `border.interactive` y la 404 y el error de ruta importan `cta.ts`.
