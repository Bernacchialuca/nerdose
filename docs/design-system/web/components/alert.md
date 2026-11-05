---
component: alert
version: 0.2.0
status: active
last_updated: 2026-11-05
related: [button, card]
---

# Alert

## Propósito

**Descripción:** mensaje de error que se anuncia de inmediato, con una acción opcional de recuperación. Implementado en `@nerdose/ui` (`packages/ui/src/components/alert.tsx`).

**Cuándo usar:**
- Falla al cargar el estado del día en la home ("alerta-sistema"), con "Reintentar".
- Cualquier error del sistema que bloquea el contenido de la vista.

**Cuándo NO usar:**
- Para advertencias que no son errores (cookies bloqueadas, O-03): usar el banner de advertencia (`Banner`, `role="status"`, color `warning`).
- Para errores de validación de un campo: el mensaje va junto al campo.
- Para confirmaciones de éxito.

## Anatomía

1. **Container** — bloque de ancho completo con barra lateral izquierda de 4px.
2. **Mensaje** — texto del error, en color de error.
3. **Action (opcional)** — slot debajo del mensaje para un Button (por ejemplo "Reintentar").

## Variants

| Variant | Propósito | Tokens / Foundations | Ejemplo de uso |
|---------|-----------|----------------------|----------------|
| `error` (único) | Error del sistema | `alert.*` | "No pudimos cargar los juegos de hoy" |

Advertencia e info no son variants de Alert: la advertencia es el `Banner` (no interrumpe al lector de pantalla).

## Sizes

| Size | Padding | Uso |
|------|---------|-----|
| `default` (único) | `space.4` (16px) | Todos los casos |

## States

| State | Descripción | Tokens afectados |
|-------|-------------|------------------|
| default | Visible al ocurrir el error | `alert.bg`, `alert.border`, `alert.text` |
| hover / focus / active / disabled | No aplica al contenedor; el foco lo recibe la acción del slot | — |

## Spacing & sizing rules

- **Padding interno:** `space.4` (16px).
- **Separación mensaje–acción:** `space.3` (12px).
- **Barra lateral:** 4px en `border.error`; sin borde en los otros lados.
- **Min/max:** ancho completo del contenedor (`w-full`).

## Accesibilidad

- **ARIA:** `role="alert"`, así el lector lo anuncia en cuanto aparece. No usarlo para mensajes que no son urgentes.
- **Teclado:** el contenedor no es focusable; la acción del slot sí.
- **Foco:** no se mueve el foco automáticamente a la Alert.
- **Screen reader:** el mensaje tiene que entenderse solo, sin depender del color.
- **Contraste:** texto `text.error` sobre `bg.surface` 7,4:1.

## Guidelines de contenido

- Decir qué pasó y qué puede hacer el jugador, en una frase ("No pudimos cargar los juegos de hoy.").
- Sin códigos técnicos ni culpas al jugador.
- La acción usa un Button `secondary` con verbo ("Reintentar").
- Todo texto pasa por i18n (ES/EN).

## Do's & don'ts

**Do:**
- Mantener visible el contenido estático que no falló (por ejemplo, las tarjetas del catálogo) junto a la Alert.
- Ofrecer siempre una acción de recuperación cuando existe.

**Don't:**
- No mostrar más de una Alert a la vez en la misma vista.
- No usar Alert para advertencias o avisos informativos.
- No poner texto fijo dentro del componente (rompe i18n).

## API

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `children` | contenido | — | Mensaje de error |
| `action` | contenido (opcional) | — | Slot para la acción (Button) |
| `className` | `string` | — | Clases extra |

## Componentes y patterns relacionados

- **button** — la acción del slot es un Button `secondary`.
- **banner** — advertencias no urgentes con `role="status"` y color `warning`.

## Historial

- 2026-11-05 v0.2.0 — Creación del spec a partir de la implementación de S-010 (`@nerdose/ui`).
