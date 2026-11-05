---
component: language-selector
version: 1.0.0
status: active
last_updated: 2026-11-05
source: docs/nerdose.html
related: [app-header, game-header]
---

# Language selector

## Propósito

**Descripción:** control segmentado ES/EN, idéntico en las 7 pantallas (L30, L297, L446, L606, L861, L992, L1096). Cambia el idioma de la interfaz y se recuerda en el navegador.

**Cuándo usar:** en el header (global y de juego).

**Cuándo NO usar:** para otras opciones de dos estados (pestañas de lenguaje de código → [code-block](./code-block.md)).

## Anatomía

1. **Grupo** — `role="group" aria-label="Idioma"`: `display: flex`, padding 3, gap 2, borde 1px `border.control`, `radius.control` (10), fondo `bg.control` (`#11151A`).
2. **Segmentos** — `<button aria-pressed>` "ES" y "EN": `min-width: 40px; height: 36px`, sin borde, `radius.segment` (7 = 10 − 3, radios concéntricos), `type.meta.strong` (Mono 700 12). Mayúsculas literales.

Alto total: 36 + 3×2 + 1×2 = **44px** (iguala a los botones-ícono).

## Variants

| Variant | Uso |
|---|---|
| `default` (único) | Headers |

## Sizes

Único (44px de alto total; segmento 40×36).

## States

| State | Fondo | Texto | Fuente |
|---|---|---|---|
| activo (`aria-pressed="true"`) | `bg.control.selected` (`#2A323C`) | `text.primary` | L30, L1598-1603 |
| inactivo | transparente | `text.muted` (`#9AA6B2`) | L30 |
| hover | **Pendiente — el prototipo no lo define** | | |
| focus | **Requisito:** foco visible ≥ 3:1; estética **Pendiente** | | |
| deshabilitado (sesión cargando) | **Pendiente — el prototipo no lo define** | | |

## Spacing & sizing rules

- Último elemento del header global (gap 10 tras la píldora); en el header de juego va entre Compartir y la píldora (gap 8).
- **Área táctil:** cada segmento mide 40×36. **Adaptación requerida:** 44×44 por segmento o un área táctil ampliada; forma **Pendiente** (el grupo completo mide 44 de alto, pero cada objetivo es de 36).

## Accesibilidad

- **ARIA:** `role="group"` con `aria-label` traducido; botones con `aria-pressed`; `lang="es"` / `lang="en"` en cada segmento.
- **Teclado:** `Tab` a cada segmento; `Enter`/`Space` activa.
- **Estado no solo por color (WCAG 1.4.11) — adaptación requerida:** el segmento activo se distingue por su fondo `#2A323C` contra `#11151A` (1,4:1) y por el texto más claro (2,1:1 entre `#E6EDF3` y `#9AA6B2`). Ninguno llega a 3:1. Hace falta una señal adicional para el estado seleccionado; **Pendiente** cuál.
- **Contraste de texto:** activo 11,0:1; inactivo 7,4:1.
- **Persistencia:** el prototipo guarda la elección en `localStorage['nerdose-lang']` con fallback a `navigator.language` (L1586); el producto la guarda según el PRD.

## Guidelines de contenido

- Etiquetas `ES` y `EN` literales; el nombre accesible del grupo pasa por i18n ("Idioma" / "Language").

## Do's & don'ts

**Do:** mantener radios concéntricos (10 / 7). **Don't:** usar bordes por segmento ni el acento verde para el activo.

## API

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `value` | `'es' \| 'en'` | — | Idioma activo |
| `onChange` | `(locale) => void` | — | Cambio |
| `disabled` | `boolean` | `false` | Mientras se inicia la sesión (estética Pendiente) |

## Componentes y patterns relacionados

- [app-header](./app-header.md), [game-header](./game-header.md).

## Historial

- 2026-11-05 v1.0.0 — Creación desde el prototipo: grupo de 44px con padding 3, segmentos 40×36 de radio 7, activo `#2A323C` / `#E6EDF3`; adaptaciones de estado (1.4.11) y área táctil.
