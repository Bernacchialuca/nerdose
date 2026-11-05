---
foundation: motion
version: 1.0.0
last_updated: 2026-11-05
status: defined
source: docs/nerdose.html
---

# Motion

## Propósito

Define el movimiento de `web`. El prototipo `docs/nerdose.html` tiene **solo dos movimientos**: el cursor que parpadea y el scroll suave. No hay `transition`, `transform` ni animaciones de entrada, flip o shake: los cambios de estado (hover, selección, resultado) son **instantáneos**. Esa quietud es parte de la estética de terminal.

## Inventario

| Token | Valor | Uso | Fuente |
|---|---|---|---|
| `motion.blink` | `@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}` + `animation: blink 1.1s steps(1) infinite` | Cursor `_` del logo de Home y `▌` de la terminal. Encendido/apagado seco, sin fade, período 1.1s. | L19, L62, L265-266 |
| `motion.scroll` | `scroll-behavior: smooth`; `scrollIntoView({behavior: 'smooth'})` | Anclas internas (p. ej. "¿Cómo funciona?") | L9, L1624, L1630 |
| `motion.transition` | **ninguna** | Hover, selección, cambio de estado | — |

El cursor solo parpadea en Home: en Stats el `_` existe estático (L290) y en los headers de juego no hay cursor.

## Tokens

| Semántico | Valor |
|---|---|
| `motion.cursor` | `motion.blink` |
| `motion.state-change` | instantáneo (sin transición) |
| `motion.anchor-scroll` | `motion.scroll` |

De componente: `app-header.logo.cursor → motion.cursor`, `terminal-window.cursor → motion.cursor`.

## Guidelines

**Do:**
- Cambiar estados sin animación.
- Usar `steps(1)` para cualquier parpadeo: nunca un fade.

**Don't:**
- No agregar transiciones de color, sombra o tamaño "para suavizar".
- No animar las celdas de juego (no hay flip de Devdle ni shake de error en el prototipo).
- Animaciones nuevas: **Pendiente — el prototipo no las define**; requieren pasar por `/product-design-system-update`.

## Accesibilidad

- **`prefers-reduced-motion: reduce` (requisito):** el scroll vuelve a ser instantáneo y el cursor no parpadea (queda visible, encendido).
- **WCAG 2.2.2 Pausar, detener, ocultar (nivel A) — adaptación requerida:** el cursor parpadea de forma automática, indefinida y junto a otro contenido. El prototipo lo deja infinito; el requisito es que el parpadeo no dure más de 5 segundos o que exista un mecanismo para detenerlo. **Pendiente** la solución (cantidad de ciclos y estado final); el estado final visible es el cursor encendido.
- **Destellos (WCAG 2.3.1):** 1.1s de período = menos de 1 destello por segundo; pasa.

## Ejemplos

- `components/app-header.md` (cursor del logo), `components/terminal-window.md` (cursor `▌`).

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-05 v1.0.0 — Solo dos movimientos reales (parpadeo 1.1s `steps(1)` y scroll suave), sin transiciones. Requisitos de `prefers-reduced-motion` y WCAG 2.2.2. Se eliminan las duraciones y easings placeholder.
