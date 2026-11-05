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
version: "1.0"
date: 2026-11-04
---

# Pantalla: No encontrado (404)

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Avisar que la dirección no existe y devolver al jugador a los juegos en un toque, sin dejarlo en una página en blanco.
- **Viewports:**
  - **mobile** — una columna: mensaje corto y botón de ancho completo para volver a la home.
  - **desktop** — mismo contenido centrado en una columna angosta (6/12), para no estirar dos renglones a 1200 px.

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
| 1 | header | header | — | layout | ambos | viewport_overrides: desktop | Marca, #número del desafío del día e idioma |
| 2 | nav-movil | nav-bar | — | navigation | solo mobile | — | Navegación principal compacta en mobile (en desktop va en el header) |
| 3 | codigo | heading | h1 | content | ambos | — | Indica el error en el tono terminal de la marca |
| 4 | mensaje | paragraph | body | content | ambos | — | Explica qué pasó |
| 5 | btn-home | button | primary | input | ambos | — | Vuelve a la home |
| 6 | footer | footer | — | layout | ambos | — | Aviso breve de privacidad y enlace a Acerca de |

## Layout por viewport

### mobile · 400px
- nav-movil
- codigo
- mensaje
- btn-home

### desktop · 1200px
- row `centrado`
  - col 3/12: (vacía, margen)
  - col 6/12: codigo, mensaje, btn-home
  - col 3/12: (vacía, margen)

## Contenido

### header
- Texto/label: > nerdose · #8 · ES|EN
- Icono: nada
- Override desktop: content="> nerdose     ./juegos   ./stats   ./about     #8     ES | EN"
- Annotation: mismo header del shell; el #número se oculta si el servidor no lo informa

### nav-movil
- Texto/label: —
- Etiquetas: ./juegos · ./stats · ./about
- Icono: nada
- Annotation: nada

### codigo
- Texto/label: 404 · página no encontrada
- Icono: nada
- Annotation: nada

### mensaje
- Texto/label: Esta dirección no existe en nerdose. Los desafíos de hoy te esperan en la home.
- Icono: nada
- Annotation: nada

### btn-home
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: navega a `/`

### footer
- Texto/label: nerdose.dev · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de
- Icono: nada
- Annotation: «Acerca de» es un enlace a `acerca-de`; el footer es del shell y es igual en todas las pantallas (REQ-002, C-07)

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

**Alternativas descartadas:**
- Redirigir a la home con un aviso: el jugador no entiende por qué terminó ahí si llegó por un enlace roto.
- Sugerir juegos parecidos al `game_id` mal escrito: fuera del alcance del REQ.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- REQ-002 · supuesto «Navegación» · product-map, pregunta abierta 4 (resuelta).
