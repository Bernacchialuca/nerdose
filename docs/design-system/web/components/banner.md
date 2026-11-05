---
component: banner
version: 0.2.0
status: active
last_updated: 2026-11-05
related: [alert, card]
---

# Banner

## Propósito

**Descripción:** aviso de advertencia persistente que ocupa el ancho de la página y no interrumpe al lector de pantalla. Implementado en `@nerdose/ui` (`packages/ui/src/components/banner.tsx`); hoy lo usa el aviso de cookies bloqueadas (overlay O-03) en el shell de `web`.

**Cuándo usar:**
- Una condición que limita lo que el jugador puede hacer, sin ser un error del sistema (cookies bloqueadas: "Activá las cookies para poder jugar").
- Avisos que deben quedar visibles mientras dure la condición.

**Cuándo NO usar:**
- Para errores que bloquean el contenido: usar `alert` (`role="alert"`, color `error`).
- Para confirmaciones o mensajes temporales.
- Para avisos que se pueden cerrar: el Banner no tiene botón de cierre.

## Anatomía

1. **Container** — bloque de ancho completo con barra lateral izquierda de 4px.
2. **Título** — texto principal en negrita, color de advertencia.
3. **Detalle (opcional)** — explicación breve en texto secundario.

## Variants

| Variant | Propósito | Tokens / Foundations | Ejemplo de uso |
|---------|-----------|----------------------|----------------|
| `warning` (único) | Advertencia no urgente | `banner.*` | "Activá las cookies para poder jugar" |

## Sizes

| Size | Padding | Uso |
|------|---------|-----|
| `default` (único) | vertical `space.3` (12px); horizontal `space.4` (16px) en mobile y `space.8` (48px) desde `lg` | Todos los casos |

## States

| State | Descripción | Tokens afectados |
|-------|-------------|------------------|
| default | Visible mientras dura la condición | `banner.bg`, `banner.border`, `banner.title`, `banner.detail` |
| hover / focus / active / disabled | No aplica: el Banner no es interactivo ni toma el foco | — |

## Spacing & sizing rules

- **Padding interno:** ver Sizes.
- **Separación título–detalle:** `space.1` (4px).
- **Barra lateral:** 4px en `border.warning`; sin borde en los otros lados.
- **Min/max:** ancho completo (`w-full`). Va entre el header y el contenido de la página.

## Accesibilidad

- **ARIA:** `role="status"` (región viva educada): el lector lo anuncia sin cortar lo que está leyendo.
- **Teclado:** no es focusable y no se puede cerrar.
- **Foco:** no mueve el foco al aparecer.
- **Screen reader:** el título se tiene que entender solo; el detalle lo complementa.
- **Contraste:** título `text.warning` sobre `bg.surface` 10,6:1; detalle `text.muted` sobre `bg.surface` 7,5:1.

## Guidelines de contenido

- Título: qué tiene que hacer el jugador, en imperativo ("Activá las cookies para poder jugar").
- Detalle: por qué, en una frase.
- Sin emojis ni signos de exclamación.
- Todo texto entra por props y pasa por i18n (ES/EN).

## Do's & don'ts

**Do:**
- Mostrarlo solo mientras la condición siga activa (en O-03: la sesión respondió 200 y el estado del día sigue sin sesión).
- Mantener visible el contenido que sí funciona (el catálogo).

**Don't:**
- No usarlo para errores del sistema ni para un 429: eso es una Alert o un estado de la vista.
- No apilar más de un Banner.
- No poner texto fijo dentro del componente (rompe i18n).

## API

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | contenido | — | Título del aviso |
| `children` | contenido (opcional) | — | Detalle |
| `className` | `string` | — | Clases extra |

## Componentes y patterns relacionados

- **alert** — errores urgentes con `role="alert"`.
- Overlay **O-03** (`docs/ux/surfaces/web/screens/o-03-cookies.md`) — único uso actual.

## Historial

- 2026-11-05 v0.2.0 — Creación del spec a partir de la implementación de S-009 (`@nerdose/ui`).
