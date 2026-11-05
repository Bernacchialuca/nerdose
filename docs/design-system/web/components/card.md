---
component: card
version: 0.2.0
status: active
last_updated: 2026-11-05
related: [button, alert]
---

# Card

## Propósito

**Descripción:** contenedor de superficie para agrupar un bloque de contenido autónomo. Es el único elemento del DS con radio. Implementado en `@nerdose/ui` (`packages/ui/src/components/card.tsx`).

**Cuándo usar:**
- Tarjeta de cada juego en la home.
- Resumen "Tu progreso" y otros bloques autónomos de una pantalla.

**Cuándo NO usar:**
- Para avisos o errores: usar `alert` (error) o el banner de advertencia (O-03).
- Como envoltorio de toda la página o de un formulario completo.
- Anidada dentro de otra Card.

## Anatomía

1. **Container** — `<article>` con fondo de superficie, borde y radio.
2. **Heading** — título del bloque (`h2`), lo aporta quien consume la Card.
3. **Body** — contenido libre (descripción, metadatos, estado).
4. **Footer (opcional)** — CTA al pie, empujado con `mt-auto`.

La Card no tiene texto propio ni conoce los juegos: todo entra por `children`.

## Variants

| Variant | Propósito | Tokens / Foundations | Ejemplo de uso |
|---------|-----------|----------------------|----------------|
| `default` | Único variant: bloque autónomo | `card.*` | Tarjeta de Devdle |

El acento por juego no es una variant de la Card: se aplica al heading con `color.game.*`.

## Sizes

| Size | Padding | Separación interna | Uso |
|------|---------|--------------------|-----|
| `default` (único) | `space.4` (16px) | `space.3` (12px) | Todas las tarjetas |

El ancho lo decide la grilla que la contiene (1 columna en mobile, 3 por fila en desktop en la home).

## States

| State | Descripción | Tokens afectados |
|-------|-------------|------------------|
| default | Estado base | `card.bg`, `card.border` |
| hover / focus / active | No aplica: la Card no es interactiva. El foco lo reciben los controles de adentro | — |
| disabled / loading | No aplica | — |

## Spacing & sizing rules

- **Padding interno:** `space.4` (16px) en los cuatro lados.
- **Separación entre hijos:** `space.3` (12px), en columna.
- **Margen externo:** lo define la grilla (`gap`) del contenedor.
- **Min/max:** sin ancho fijo; en una fila de tarjetas usar `h-full` para igualar alturas.

## Accesibilidad

- **ARIA:** se renderiza como `<article>`. Asociarla a su heading con `aria-labelledby` para que el lector la anuncie por nombre.
- **Teclado:** no es focusable.
- **Foco:** no aplica al contenedor.
- **Screen reader:** el heading tiene que ser un `h2` (o el nivel que corresponda a la jerarquía de la página).
- **Contraste:** el borde (`border.default` sobre `bg.surface`, 1,3:1) es decorativo; la tarjeta no depende de él para identificarse.

## Guidelines de contenido

- El heading es el nombre del bloque, corto ("Devdle", "Tu progreso").
- Una sola acción principal por Card.

## Do's & don'ts

**Do:**
- Usar `h-full` cuando las tarjetas comparten fila.
- Poner el CTA al pie con `mt-auto` para alinear los botones entre tarjetas.

**Don't:**
- No anidar Cards.
- No agregar sombra: el DS de `web` no usa elevación en tarjetas (`elevation.0`).
- No poner texto fijo dentro del componente (rompe i18n).

## API

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `string` | — | Clases extra (por ejemplo `h-full`) |
| `children` | contenido | — | Heading, body y footer |
| `...props` | atributos de `<article>` | — | `aria-labelledby`, `id`, etc. |

## Componentes y patterns relacionados

- **button** — CTA al pie de la tarjeta.
- **alert** — para errores, en lugar de una Card con texto rojo.

## Historial

- 2026-11-05 v0.2.0 — Creación del spec a partir de la implementación de S-010 (`@nerdose/ui`). Radio `radius.xl` (16px), padding `space.4`, sin sombra.
