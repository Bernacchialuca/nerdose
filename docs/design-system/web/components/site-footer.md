---
component: site-footer
version: 1.4.1
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

**Contenido de producto:** ninguno. Desde la v1.4.1 el footer es exactamente el del prototipo; el aviso de privacidad vive en "Acerca de" (C-07, NFR-PR04), que se alcanza desde `./about` del header.

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
| — | — | — | Sin props: lema y `exit 0` salen del diccionario i18n |

## Componentes y patterns relacionados

- [app-header](./app-header.md), [link](./link.md).

## Ubicación del contenido

Una sola fila, como el prototipo (L256): `flex-wrap`, `justify-content: space-between`, gap 12, padding 24/32, borde superior `border.subtle`, Mono 13 `text.dim`. Lema `> nerdose — una plataforma, múltiples desafíos.` a la izquierda (el `>` es decorativo, `aria-hidden`) y `exit 0` a la derecha. Sin aviso de privacidad, sin link a "Acerca de" y sin dominio.

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: borde superior sutil, padding 24 32, Mono 13 gris, lema + `exit 0`; contenido de privacidad del PRD como agregado de producto.
- 2026-11-06 v1.3.0 — S-012: ubicación del aviso de privacidad y de "Acerca de" resuelta; se quita el dominio.
- 2026-11-06 v1.4.1 — Pedido del usuario: el footer vuelve a ser de una sola línea como el prototipo; el aviso de privacidad y el link a "Acerca de" salen del footer (la privacidad queda en "Acerca de").
