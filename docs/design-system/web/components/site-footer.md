---
component: site-footer
version: 1.3.0
status: active
last_updated: 2026-11-06
source: docs/nerdose.html
related: [app-header]
---

# Site footer

## Propósito

**Descripción:** pie del sitio con voz de terminal. En el prototipo **solo existe en Home** (L256-259): `> nerdose — una plataforma, múltiples desafíos.` a la izquierda y `exit 0` a la derecha. Stats y los juegos no tienen footer.

**Cuándo usar:** al pie de las pantallas de plataforma.

**Cuándo NO usar:** pantallas de juego (el prototipo no lo muestra).

## Anatomía

1. **Container** — `<footer>`, `border-top: 1px solid #1E252E`, padding 24 32, `flex-wrap`, `justify-content: space-between`, gap 12.
2. **Lema** — `> nerdose — una plataforma, múltiples desafíos.`
3. **Cierre** — `exit 0`.

Todo en `type.label.comment` (Mono 13), `text.dim`.

## Variants

| Variant | Uso |
|---|---|
| `default` (único) | Pantallas de plataforma |

**Contenido de producto:** el PRD pide además el aviso de privacidad (una sola cookie funcional) y el link a "Acerca de" (hoy en el footer del código). Es contenido que el prototipo no tiene; va dentro del mismo footer, con el mismo estilo. **Pendiente** su ubicación exacta respecto del lema y `exit 0`.

## Sizes

Único.

## States

| State | Descripción |
|---|---|
| default | Estático |
| Link interno hover / focus | Ver [link](./link.md); foco como requisito |

## Spacing & sizing rules

- Padding 24 32; gap 12; envuelve con `flex-wrap`.

## Accesibilidad

- **ARIA:** `<footer>` (contentinfo).
- `>` decorativo puede quedar como texto; no lleva significado.
- **Contraste:** `#8D99A6`/`#0A0C0F` 6,8:1.
- Links internos con área táctil de 44px.

## Guidelines de contenido

- Lema y `exit 0` literales; EN: "> nerdose — one platform, many challenges." según el diccionario i18n.

## Do's & don'ts

**Do:** mantener el `exit 0` como cierre. **Don't:** usar texto de más de 13px.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `children` | contenido | — | Contenido de producto adicional (privacidad, Acerca de) |

## Componentes y patterns relacionados

- [app-header](./app-header.md), [link](./link.md).

## Ubicación del contenido (resuelto en S-012)

Antes **Pendiente**. Dos filas, `flex-direction: column`, gap 12, padding 24/32, borde superior `border.subtle`, Mono 13 `text.dim` (L256):

- **Fila 1** (`space-between`, wrap): lema `> nerdose — una plataforma, múltiples desafíos.` a la izquierda y `exit 0` a la derecha. El `>` es decorativo (`aria-hidden`).
- **Fila 2** (wrap): aviso de privacidad (producto) y el link "Acerca de →" con `link` `subtle`.

El dominio `nerdose.dev` ya no se muestra: no está en el prototipo ni en los screen.md. Origen: story S-012, decisión 7.

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: borde superior sutil, padding 24 32, Mono 13 gris, lema + `exit 0`; contenido de privacidad del PRD como agregado de producto.
- 2026-11-06 v1.3.0 — S-012: ubicación del aviso de privacidad y de "Acerca de" resuelta; se quita el dominio.
