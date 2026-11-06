---
name: acerca-de
surface: web
route: /about
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.2"
date: 2026-11-06
---

# Pantalla: Acerca de

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Explicar qué es nerdose, las reglas de racha y atribuir Wikipedia y Wikidata, con el aviso de privacidad.
- **Viewports:**
  - **mobile** — una columna de paneles cortos, lectura de arriba abajo. El header es el mismo que en desktop, acomodado con `flex-wrap`.
  - **desktop** — columna centrada (10/12) con las tarjetas en dos columnas, para no dejar renglones de más de ~80 caracteres.

## Entrada y salida

**Entradas:**
- Header · `./about`
- Cualquier pantalla · `./about` del header (el enlace del footer se quitó en REQ-003 para alinear el footer al prototipo)

**Salidas user-driven:**
- A `home` · «Volver a los juegos»

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | — | Marca, nav, #número e idioma (`app-header` variant `default`) |
| 2 | titulo | heading | h1 | content | ambos | — | Título de la pantalla |
| 3 | intro | paragraph | body | content | ambos | — | Qué es nerdose |
| 4 | card-juegos | card | — | content | ambos | — | Cómo funcionan los juegos, sin enumerarlos, con enlace «Ver los juegos →» a `home` (`panel`) |
| 5 | card-rachas | card | — | content | ambos | — | Reglas de racha (`panel`) |
| 6 | card-atribucion | card | — | content | ambos | — | Atribución obligatoria de Wikipedia y Wikidata (`panel`) |
| 7 | card-privacidad | card | — | content | ambos | — | Aviso de privacidad (`panel`) |
| 8 | link-volver | link | — | navigation | ambos | — | Salida a la home |
| 9 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- titulo
- intro
- card-juegos
- card-rachas
- card-atribucion
- card-privacidad
- link-volver

### desktop · 1200px
- row `centrado`
  - col 1/12: (vacía, margen)
  - col 10/12:
    - titulo
    - intro
    - row `info`
      - col 6/12: card-juegos, card-atribucion
      - col 6/12: card-rachas, card-privacidad
    - link-volver
  - col 1/12: (vacía, margen)

## Contenido

### header
- Texto/label: > nerdose_   ./juegos   ./stats   ./about   #8   ES | EN
- Icono: nada
- Annotation: `app-header` variant `default` (fondo transparente, cursor `_` estático, sin píldora de racha). `./about` es el ítem activo. #número = número de desafío del día, igual para los 5 juegos; ES | EN es el grupo segmentado (`language-selector`). En mobile se acomoda con `flex-wrap`, sin scroll horizontal a 320 px

### titulo
- Texto/label: Acerca de nerdose
- Icono: nada
- Annotation: nada

### intro
- Texto/label: Nerdose es una plataforma de minijuegos diarios sobre programación y tecnología: un desafío nuevo por día en cada juego, el mismo para todos, sin registro y en español e inglés.
- Icono: nada
- Annotation: nada

### card-juegos
- Texto/label: Los juegos
- Texto secundario: Cada juego tiene un desafío nuevo por día, igual para todos. Las partidas duran de 1 a 3 minutos y todos los juegos tratan sobre programación y tecnología. Ver los juegos →
- Icono: nada
- Annotation: `panel` variant `default` del DS (radio 14, título Mono sin peso 600, cuerpo en Inter); lo mismo vale para las otras tres tarjetas

### card-rachas
- Texto/label: Cómo funciona la racha
- Texto secundario: Completar un desafío, ganando o perdiendo, suma a tu racha. Un día sin desafío es neutro: no suma ni corta. Un desafío anulado no te afecta. Ver tus estadísticas →
- Icono: nada
- Annotation: nada

### card-atribucion
- Texto/label: Datos y atribución
- Texto secundario: Parte del contenido proviene de Wikipedia y Wikidata y se usa bajo licencia CC BY-SA 4.0.
- Icono: nada
- Annotation: «Wikipedia», «Wikidata» y «CC BY-SA 4.0» son enlaces externos (pestaña nueva); el texto se muestra en el idioma elegido (ES/EN)

### card-privacidad
- Texto/label: Privacidad
- Texto secundario: No hay cuenta ni registro. Usamos una única cookie funcional para guardar tu progreso: no guarda datos personales, no la usamos para seguirte y no hay cookies de terceros. Por eso no te mostramos un banner de cookies.
- Icono: nada
- Annotation: nada

### link-volver
- Texto/label: Volver a los juegos
- Icono: arrow-left
- Annotation: `link` del DS: sin subrayado, color del acento, tono más claro en hover; foco visible

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. El aviso de privacidad vive en `acerca-de`. Es del shell e igual en todas las pantallas (REQ-002, C-07)

## Estados

### default
- Aplica: Sí
- Mensaje: Contenido estático, sin dependencia de la sesión.
- Cambios: ninguno respecto de default.

## Interacciones

**Eventos:**
- link-volver · on click → navega a `home`

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- Sin feedback propio más allá de la navegación.

## Accesibilidad

- **Orden de foco:** header (marca → nav → ES/EN) → enlaces dentro de los paneles → «Volver a los juegos» → footer.
- **Landmarks y jerarquía:** `h1` «Acerca de nerdose»; cada tarjeta es `h2`. Landmarks: header, nav, main, footer.
- **Foco y teclado:** Sin trampas de foco.
- **Propio de esta composición:** Los enlaces a Wikipedia/Wikidata indican que abren una pestaña nueva.

## Decisiones y descartes

**Decisiones tomadas:**
- Pantalla estática de un solo estado: no hay datos de sesión ni de red, así que no hay `loading` ni error.
- La atribución CC BY-SA vive en esta pantalla por obligación de licencia (C-07).
- REQ-002: el aviso de privacidad explicita «una única cookie funcional, sin datos personales ni cookies de terceros» y por qué no hay banner (RF 15, NFR-PR01); la entrada principal pasa a ser el enlace del footer, presente en todas las pantallas (RF 14, CA 19). Sin cambios de layout.

- REQ-003: se alinea al DS 1.0.0 sin cambiar contenido ni layout: las tarjetas pasan a ser `panel` del DS (radio 14, tipografía Mono para títulos e Inter para la prosa, sin peso 600), el enlace de salida usa el estilo de `link` y el header es el `app-header` `default`. La tira `nav-movil` se elimina: la nav vive siempre en el header con `flex-wrap` (cambio solo de mobile).
- REQ-003: la entrada desde «¿Cómo funciona?» de la home desaparece: ese botón ahora baja a la sección «Cómo funciona» de la propia home. Esta pantalla se alcanza desde `./about` del header.

**Alternativas descartadas:**
- Un FAQ con acordeones: más interacción para un contenido corto.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-07, F-01 · flujo 3 (dudas sobre la racha).
- REQ-002: RF 14, RF 15 · CA 19, CA 21.
- REQ-003: RF 4, 6, 11, 13 · CA 2.
- REQ-003 (revisión visual): la intro presenta a nerdose como plataforma y no nombra la cantidad de juegos; la card «Los 5 juegos» pasa a «Los juegos», genérica y con enlace a `home`, para que escale al sumar juegos sin reescribir el texto. La card de la racha suma «Ver tus estadísticas →» (a `estadisticas`) para emparejar la altura de la fila.
