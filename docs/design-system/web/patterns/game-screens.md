---
pattern: game-screens
version: 1.0.0
status: active
last_updated: 2026-11-25
source: docs/nerdose.html
related: [banner, button, panel, game-header, card]
---

# Pantallas de partida y resultado

## Propósito

Composición común de las pantallas de **partida** y **resultado** de los 5 juegos: cajas, botones, acciones, explicaciones y títulos van en los mismos lugares en todos, para que el jugador no tenga que reaprender dónde está cada cosa al cambiar de juego. Las piezas de cada tablero viven en [`game-boards`](game-boards.md); este pattern solo fija dónde van.

Fuera de alcance: las instrucciones (ya son idénticas entre juegos), el header (`game-header`), el share (solo en el header) y la card de cierre (`footer` del host, `ResultExits`): los pone el host y no cambian.

Implementado en REQ-012 (story S-064, 2026-11-25) en `packages/games/*/src/client/{game,result}.tsx`.

## Layout de referencia

- **Desktop:** grilla de 12 columnas con **columna principal 7 | lateral 5** (`lg:grid lg:grid-cols-12`, `lg:col-span-7` / `lg:col-span-5`).
- **Mobile:** una sola columna; primero la principal y después la lateral, **en el orden del DOM** (sin `order`).
- Un juego que ya usa `flex-wrap` con `basis` y funciona puede mantenerlo (Devdle: tablero `basis-140` + lateral `basis-75`, máx. `devdle-aside`; Tech Timeline: `grow-7` / `grow-5`), siempre que respete el orden y el reparto principal/lateral.

## Partida

### P1. Bloque de título

Arriba de todo, alineado a la izquierda y a ancho completo (12 columnas en desktop). Orden fijo:

1. Línea de comentario: `font-mono text-label-comment text-text-dim`, con el `// ` `aria-hidden`.
2. El `h1` del juego, con su tamaño (`title-game`).
3. Después, los `notices` del host (anulado, sin sesión, día nuevo).

### P2. Acción principal (CTA)

- Va en la **columna principal**, justo debajo del área de interacción y de su línea de aviso (`ConsoleHint`), si la tiene.
- Siempre a ancho completo, en todos los breakpoints: `buttonClass({ variant: 'accent', game, size: 'lg', fullWidth: true })`. Nunca `lg:w-auto`.
- Termina en `→` (`aria-hidden`).
- **Deshabilitada:** `aria-disabled="true"` y la etiqueta cambia a una instrucción de qué falta («Elegí una línea», «Elegí una opción»). Al habilitarse dice «Confirmar … →». Mientras se envía, «Confirmando…».
- Devdle (ENTER del teclado en pantalla) y Grep Grid (el segundo toque envía) no tienen CTA. Tech Timeline siempre se puede confirmar (cualquier orden es válido), así que su CTA no tiene estado deshabilitado por selección.

### P3. Columna lateral

De arriba hacia abajo:

1. **Panel de ayuda** con `id={HELP_TARGET_ID}` (destino del botón «?» del header) y título `// cómo se juega` (en: `// how to play`), en el `SectionPanel` del juego y con las reglas en `text-body-sm`. Sin `datum` de racha.
2. Los paneles propios del juego (pista de categoría y distribución en Devdle, lista de palabras en Grep Grid, tests en Bug Hunt…).
3. La acción secundaria o destructiva, si existe: en Devdle, «💡 Pista» (`secondary`) y «⚑ Rendirse»; en Grep Grid, «⚑ Rendirse». «Rendirse» usa `button` `error-outline` a ancho completo y abre O-04.
4. El slot `aside` del host («Reportar un problema»), **siempre último**.

Con la partida anulada (`locked`) cada juego oculta lo que ya ocultaba, pero lo que se ve respeta este orden (Tech Timeline oculta también el panel de ayuda; Grep Grid lo mantiene).

## Resultado

### R1. Veredicto siempre visible

Arriba, a ancho completo: [`banner`](../components/banner.md) con `titleAs="h1"`.

- `variant="success"` al ganar; `variant="failure"` al perder o rendirse.
- Título: el texto de win/lost del juego. Detalle: un texto corto y útil, también al ganar, en es y en, sin revelar nada nuevo.
- No hay `h1` `sr-only` en el caso ganador. El confeti del host sigue igual.
- Ningún detalle dice «abajo» ni «a la derecha»: la posición cambia según el viewport.

### R2. Avisos

Los `notices` van justo debajo del banner.

### R3. Dos columnas

- **Principal:** lo que jugó el jugador (tablero, grilla, tu orden, código y su respuesta) y, al final, la card de cierre del host.
- **Lateral:** el panel de explicación o solución; las stats propias del juego, si hay (solo Devdle: distribución); el slot `aside` (reporte), siempre último.

## Accesibilidad

- Un único `h1` por pantalla (el del bloque de título o el del banner). Los encabezados de panel son `h2` con `//` `aria-hidden`.
- Targets ≥ 44 px (`min-h-11`), foco visible y sin violaciones de axe.
- El orden del DOM es el orden de lectura en mobile y el orden de foco en todos los anchos.

## Do's & don'ts

**Do:**
- Reusar el `SectionPanel`, el `ConsoleHint` y los textos que ya tiene el paquete del juego.
- Mantener el mismo árbol de claves de i18n en `es` y `en`.

**Don't:**
- No poner la CTA en el lateral ni con ancho automático en desktop.
- No poner nada debajo de «Reportar un problema» en el lateral.
- No reordenar columnas con `order` para mobile.

## Historial

- 2026-11-25 v1.0.0 — Creación (REQ-012, S-064): patrón común de partida y resultado de los 5 juegos, implementado fuera del workflow y documentado retroactivamente.
