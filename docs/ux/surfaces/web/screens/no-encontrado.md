---
name: no-encontrado
surface: web
route: "*"
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.2"
date: 2026-11-25
---

# Pantalla: No encontrado (404)

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Avisar que la dirección no existe y devolver al jugador a los juegos en un toque, sin dejarlo en una página en blanco.
- **Viewports:**
  - **mobile** — una columna: mensaje corto y botón de ancho completo para volver a la home, dentro de un panel. El header es el mismo que en desktop, acomodado con `flex-wrap`.
  - **desktop** — mismo panel centrado en una columna angosta (6/12), para no estirar dos renglones a 1200 px.

## Entrada y salida

**Entradas:**
- Desde fuera · enlace roto o dirección mal escrita (cualquier ruta que no sea `/`, `/:game_id`, `/stats` o `/about`)
- Desde `/:game_id` con un `game_id` que no es uno de los 5 juegos

**Salidas user-driven:**
- A `home` · «Volver a los juegos»
- A cualquier pantalla · navegación del header y enlace «Acerca de» del footer

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Marca, nav, #número e idioma (`app-header` variant `default`) |
| 1b | terminal | code | — | content | ambos | — | Transcripción decorativa (`aria-hidden`): `$ cd <ruta>`, el error de bash en rojo y `exit 1`, con la barra de ventana de la terminal de la home |
| 2 | codigo | heading | h1 | content | ambos | — | Indica el error en el tono terminal de la marca |
| 3 | mensaje | paragraph | body | content | ambos | — | Explica qué pasó |
| 4 | btn-home | button | primary | input | ambos | — | Vuelve a la home |
| 5 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- row `panel` (card)
  - col 12/12: terminal, codigo, mensaje, btn-home

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía, margen)
  - col 6/12 (card): terminal, codigo, mensaje, btn-home
  - col 3/12: (vacía, margen)

## Contenido

### header
- Texto/label: > nerdose_   ./juegos   ./stats   ./about   #8   ES | EN
- Icono: nada
- Annotation: `app-header` variant `default` del shell (sin píldora de racha, cursor estático, ningún ítem de nav activo); el #número se oculta si el servidor no lo informa. En mobile se acomoda con `flex-wrap`

### terminal
- Texto/label: $ cd /ruta-pedida · bash: cd: /ruta-pedida: No existe el archivo o el directorio · exit 1▌
- Icono: nada
- Annotation: ventana de terminal (barra con tres puntos y `nerdose — bash`, sombra `window`), Mono `code-terminal`; la ruta es la real. Es decorativa: el `h1` y el mensaje dicen lo mismo en prosa. La misma ventana (componente `ErrorTerminal` de `web`) se usa en [`error-inesperado`](error-inesperado.md) (`$ nerdose --play`)

### codigo
- Texto/label: 404 · página no encontrada
- Icono: nada
- Annotation: título de página del DS (Mono 800, tracking negativo, sin peso 600), debajo de la transcripción, separado por una línea punteada, dentro de la misma ventana (radio 14)

### mensaje
- Texto/label: Esta dirección no existe en nerdose. Los desafíos de hoy te esperan en la home.
- Icono: nada
- Annotation: prosa en Inter

### btn-home
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: botón `primary` `md` del DS (radio 10); navega a `/`; ancho completo en mobile

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. El aviso de privacidad vive en `acerca-de`. Es del shell e igual en todas las pantallas (REQ-002, C-07)

## Estados

### default
- Aplica: Sí — es el estado fijo «not found»: la pantalla solo existe para ese caso y no tiene otros estados (contenido estático, sin datos de sesión ni de red).
- Mensaje: Esta dirección no existe en nerdose. Los desafíos de hoy te esperan en la home.
- Cambios: ninguno respecto de la estructura declarada.

## Interacciones

**Eventos:**
- btn-home · on click → navega a `home`

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Sin feedback propio más allá de la navegación.

## Accesibilidad

- **Orden de foco:** header → «Volver a los juegos» → footer.
- **Landmarks y jerarquía:** `h1` único «404 · página no encontrada». Landmarks: header, nav, main, footer. El `<title>` del documento también indica que la página no existe.
- **Foco y teclado:** Sin trampas de foco.
- **Propio de esta composición:** El mensaje no depende de color ni de ilustración para entenderse.

## Decisiones y descartes

**Decisiones tomadas:**
- Pantalla propia y no redirección a la home: lo decide REQ-002 (supuesto «Navegación»: «una ruta inexistente muestra una página 404 simple con enlace a la home»). Resuelve la pregunta abierta 4 del product-map.
- Un `game_id` desconocido en `/:game_id` cae en la misma pantalla: no hay una variante por juego porque no hay juego que mostrar.
- Un único CTA: la navegación del header ya ofrece `./stats` y `./about`; repetirlos sumaría opciones sin ayudar a volver.
- Mismo contenido en ambos viewports; en desktop se centra en 6/12 solo para acotar el largo de línea.

- REQ-012 (2026-11-25, story S-060): el panel se reemplaza por la ventana de terminal de la marca (`ErrorTerminal`) con la transcripción `$ cd <ruta>` decorativa; el contenido en prosa no cambia.
- REQ-003: se alinea al DS 1.0.0 sin cambiar contenido: el mensaje va dentro de un `panel` (radio 14), el título usa la tipografía de página del DS, el botón sigue `button.md` y el header es el `app-header` `default`. La tira `nav-movil` se elimina: la nav vive siempre en el header con `flex-wrap` (cambio solo de mobile).

**Alternativas descartadas:**
- Redirigir a la home con un aviso: el jugador no entiende por qué terminó ahí si llegó por un enlace roto.
- Sugerir juegos parecidos al `game_id` mal escrito: fuera del alcance del REQ.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- REQ-002 · supuesto «Navegación» · product-map, pregunta abierta 4 (resuelta).
- REQ-003: RF 4, 6, 8, 11 · CA 2.
- REQ-012 · S-060: ventana de terminal (`apps/web/src/components/not-found.tsx`, `error-terminal.tsx`).
