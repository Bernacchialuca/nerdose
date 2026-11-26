---
name: error-inesperado
surface: web
route: "(errorElement de la ruta raíz)"
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.0"
date: 2026-11-25
---

# Pantalla: Error inesperado

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Si algo de la interfaz se rompe al renderizar, no dejar al jugador frente a una página en blanco: decirle que su progreso está guardado y darle dos salidas (reintentar o volver a los juegos).
- **Viewports:**
  - **mobile** — una columna: ventana de terminal con la transcripción, título, mensaje y los dos botones apilados a ancho completo.
  - **desktop** — la misma ventana centrada en una columna angosta (`max-w-lede`, ~6/12), igual que `no-encontrado`.

## Entrada y salida

**Entradas:**
- Desde cualquier ruta · una excepción de render o un error que una query propaga al `errorElement` de la ruta raíz (convención `error-handling` de `web`). Reemplaza al shell entero.

**Salidas user-driven:**
- A la misma ruta · «Reintentar» (recarga completa de la página).
- A `home` · «← Volver a los juegos» (`<a href="/">`, carga limpia de la app).
- A `home` · la marca `> nerdose_` del header mínimo.

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | `app-header` mínimo | layout | ambos | — | Solo la marca, que lleva a `/`. Sin nav, sin #número, sin idioma ni racha: no depende de la sesión ni de queries (lo que rompió puede ser justamente eso) |
| 2 | terminal | code | — | content | ambos | — | Transcripción decorativa (`aria-hidden`): `$ nerdose --play`, la salida en rojo y `exit 1▌`, con la barra de ventana de la terminal de la home |
| 3 | titulo | heading | h1 | content | ambos | — | «Algo salió mal» en el tono terminal de la marca |
| 4 | mensaje | paragraph | body | content | ambos | — | Explica qué pasó y que el progreso está guardado |
| 5 | btn-reintentar | button | primary | input | ambos | — | Recarga la página |
| 6 | btn-volver | button | secondary | navigation | ambos | — | Vuelve a la home |
| 7 | footer | footer | — | layout | ambos | — | `site-footer` del shell (lema y `exit 0`) |

## Layout por viewport

### mobile · 400px
- header
- row `panel` (ventana de terminal)
  - col 12/12: terminal, titulo, mensaje, btn-reintentar, btn-volver
- footer

### desktop · 1200px
- header
- row `centrado`
  - col 3/12: (vacía, margen)
  - col 6/12 (ventana de terminal): terminal, titulo, mensaje, btn-reintentar, btn-volver
  - col 3/12: (vacía, margen)
- footer

## Contenido

### header
- Texto/label: > nerdose_
- Icono: nada
- Annotation: `AppHeader` de `@nerdose/ui` con solo la marca (`BrandMark`) como `<a href="/">` (no `<Link>`: fuerza una carga limpia). Target de 44 px y foco visible con el acento

### terminal
- Texto/label: $ nerdose --play · error: algo se rompió de nuestro lado · exit 1▌
- Icono: nada
- Annotation: componente `ErrorTerminal` de `web` (el mismo de `no-encontrado`): barra con tres puntos y `nerdose — bash`, sombra `window`, Mono `code-terminal`, la salida en `status.error` y el cursor `▌` que parpadea solo sin `prefers-reduced-motion`. En `vite dev` la salida es el error real (`Nombre: mensaje`); en build y en tests nunca se muestra (no filtra detalles internos)

### titulo
- Texto/label: Algo salió mal
- Icono: nada
- Annotation: título de página del DS (Mono, `title-page`), debajo de la transcripción, separado por una línea punteada, dentro de la misma ventana

### mensaje
- Texto/label: Tuvimos un error inesperado. Tu progreso está guardado: reintentá o volvé a los juegos.
- Icono: nada
- Annotation: prosa en Inter (`body`, `text-lede`). EN: «We hit an unexpected error. Your progress is saved: try again or go back to the games.»

### btn-reintentar
- Texto/label: Reintentar
- Icono: nada
- Annotation: `buttonClass` `primary`, ancho completo; `location.reload()`

### btn-volver
- Texto/label: ← Volver a los juegos
- Icono: arrow-left (glifo `←`, `aria-hidden`)
- Annotation: `buttonClass` `secondary`, ancho completo; enlace a `/`

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · exit 0
- Icono: nada
- Annotation: `site-footer` del shell, igual que en el resto de las pantallas

## Estados

### default
- Aplica: Sí — es el único estado: la pantalla solo existe cuando una ruta falla.
- Mensaje: Tuvimos un error inesperado. Tu progreso está guardado: reintentá o volvé a los juegos.
- Cambios: ninguno respecto de la estructura declarada. El error se registra con `console.error`.

## Interacciones

**Eventos:**
- btn-reintentar · on click → recarga la página
- btn-volver · on click → navega a `/` con carga completa
- marca · on click → navega a `/` con carga completa

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Sin feedback propio más allá de la navegación.

## Accesibilidad

- **Orden de foco:** marca → «Reintentar» → «Volver a los juegos».
- **Landmarks y jerarquía:** el contenido va en `role="alert"`; `h1` único «Algo salió mal». Landmarks: header (`banner`), main y footer (`contentinfo`). La transcripción es `aria-hidden`: el `h1` y el mensaje dicen lo mismo en prosa.
- **Foco y teclado:** sin trampas de foco; targets de 44 px.
- **Propio de esta composición:** nada depende del color (el rojo de la salida es decorativo); axe sin violaciones (test de `route-error`).

## Decisiones y descartes

**Decisiones tomadas:**
- REQ-012 (2026-11-25, implementado fuera del workflow, story S-060): la pantalla de error usa la misma ventana de terminal que `no-encontrado`, para que un fallo se vea como parte del producto y no como una página genérica.
- Header y footer propios y mínimos: como reemplaza al shell, no puede depender de la sesión, del idioma guardado ni de queries.
- Dos salidas: reintentar (primaria, porque muchos fallos son transitorios) y volver a los juegos (secundaria).
- El mensaje real del error solo se ve en `vite dev`.

**Alternativas descartadas:**
- Mostrar el mensaje del error en producción: expone detalles internos (convención `error-handling`).
- Un solo botón «Reintentar» dentro de un `panel`: era la versión anterior; dejaba al jugador sin salida si el error se repetía.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla. El copy de error de red en pantallas de juego sigue sin definir (product-map, Estados Globales).

## Trazabilidad

- REQ-012 · story S-060 · `apps/web/src/app/route-error.tsx`, `apps/web/src/components/error-terminal.tsx`.
- Convención `web/error-handling` (un `errorElement` por árbol de rutas; nunca una página en blanco).
