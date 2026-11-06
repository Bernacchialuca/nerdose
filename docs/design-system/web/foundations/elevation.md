---
foundation: elevation
version: 1.2.0
last_updated: 2026-11-06
status: defined
source: docs/nerdose.html
---

# Elevación

## Propósito

Define cómo se separan las capas en `web`. El prototipo `docs/nerdose.html` resuelve la elevación casi siempre con **color de superficie + borde de 1px**, y declara solo cinco sombras: una de caída (ventana terminal), un anillo con glow (tarjeta destacada) y tres barras laterales `inset`. No hay z-index ni capas flotantes (no hay modales, toasts ni menús en el prototipo).

## Inventario

### Jerarquía de superficies (sin sombra)

| Nivel | Superficie | Borde | Uso | Fuente |
|---|---|---|---|---|
| Página | `#0A0C0F` (+ textura de puntos solo en Home) | — | Fondo | L16 |
| Hundida | `#0D1116` | `#222A33` | Bloque de código, tablero de Grep, diff | L651, L720, L1117 |
| Superficie | `#0F1318` | `#222A33` | Tarjetas y paneles | L84, L481 |
| Control | `#11151A` | `#2A323C` | Botón-ícono, selector de idioma | L30, L443 |
| Interna | `#141920` | sin borde | Mini-stat, métrica, fila de test, celda de Grep | L225, L344, L683 |

### Sombras

| Token | Valor | Uso | Fuente |
|---|---|---|---|
| `shadow.window` | `0 24px 60px rgba(0,0,0,0.45)` | Ventana terminal del hero de Home. Única sombra de caída neutra. | L47 |
| `shadow.featured.big-o` | `0 0 0 1px #5EB1FF33, 0 18px 40px rgba(20,60,110,0.25)` | Tarjeta de juego destacada (próximo a jugar): anillo de 1px del acento al 20% + glow del mismo matiz. Va con borde `#2E4C6E`. | L125 |
| `shadow.bar.{color}` | `inset 3px 0 0 <color>` | Barra lateral izquierda de 3px. No desplaza el texto (por eso no es `border-left`). | L108, L807, L952 |

Valores de `shadow.bar` en el prototipo:

| Contexto | Color de la barra | Fuente |
|---|---|---|
| Línea con bug en miniatura de Bug Hunt | `#FFB547` | L108 |
| Línea de código normal | `transparent` | L786 |
| Línea elegida / bug no encontrado (Bug Hunt) | `#FFB547` | L788, L792 |
| Línea acertada (Bug Hunt) | `#3DDC84` | L790 |
| Línea elegida errónea (Bug Hunt) | `#FF7B72` | L794 |
| Línea resaltada (Big O) | `#5EB1FF` | L952 |

### Tarjeta destacada por juego

El prototipo solo muestra la tarjeta destacada de **Big O** (azul). Para los demás juegos el anillo y el glow **no están definidos**: `shadow.featured.{devdle,bug-hunt,timeline,grep-grid}` se **derivan en S-011** con el patrón de Big O (anillo de 1px del acento al 20% + glow de 18px/40px con el matiz del acento oscurecido al 25%): devdle `0 0 0 1px #3DDC8433, 0 18px 40px rgba(20,110,60,0.25)`, bug-hunt `0 0 0 1px #FFB54733, 0 18px 40px rgba(110,70,20,0.25)`, timeline `0 0 0 1px #C39BFF33, 0 18px 40px rgba(70,40,110,0.25)`, grep-grid `0 0 0 1px #F472B633, 0 18px 40px rgba(110,20,70,0.25)`.

### Capas (z-index)

**Pendiente — el prototipo no define** capas superpuestas. El header no es sticky (no declara `position`, L18). El overlay O-01 (formulario de feedback, modal en desktop según el product-map) necesitará una capa; su estética queda pendiente.

## Tokens

| Token semántico | Valor |
|---|---|
| `elevation.flat` | Sin sombra; superficie + borde |
| `elevation.window` | `shadow.window` |
| `elevation.featured.{juego}` | `shadow.featured.{juego}` (Big O del prototipo; los otros 4 derivados en S-011) |
| `bar.{estado}` | `shadow.bar` con el color del estado |

De componente: `terminal-window.shadow → elevation.window`, `card.game.next.shadow → elevation.featured.{juego}`, `code-block.line.highlight.bar → bar.*`.

## Guidelines

**Do:**
- Separar capas con superficie + borde; reservar la sombra de caída para la ventana terminal.
- Usar `inset 3px 0 0` para cualquier barra lateral de estado.
- Combinar la tarjeta destacada con su borde de acento (`#2E4C6E` en Big O).

**Don't:**
- No agregar sombras a tarjetas, paneles ni botones.
- No usar `border-left` para barras de estado (corre el contenido).
- No usar la sombra de la terminal en otras superficies.

## Accesibilidad

- La barra lateral nunca es la única señal: en Bug Hunt cada línea con barra lleva además un tag de texto (`◀ tu elección`, `✓ acá estaba el bug`, `✗ tu elección`, L788-795).
- La tarjeta destacada se reconoce también por su CTA relleno "Jugar →" y por ser el destino de "Seguir jugando" (L42); el anillo no es la única señal.

## Ejemplos

- `components/terminal-window.md`, `components/card.md` (variant `next`), `components/code-block.md`.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-05 v1.0.0 — Las cinco sombras reales del prototipo, jerarquía de superficies sin sombra y barras laterales `inset 3px 0 0`. Se eliminan los niveles placeholder `elevation.0`…`elevation.N`.
- 2026-11-06 v1.2.0 — `shadow.featured.*` derivadas para los cuatro juegos restantes.
