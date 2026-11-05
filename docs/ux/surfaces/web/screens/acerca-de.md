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
version: "1.1"
date: 2026-11-04
---

# Pantalla: Acerca de

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Explicar qué es nerdose, las reglas de racha y atribuir Wikipedia y Wikidata, con el aviso de privacidad.
- **Viewports:**
  - **mobile** — una columna de tarjetas cortas, lectura de arriba abajo.
  - **desktop** — columna centrada (10/12) con las tarjetas en dos columnas, para no dejar renglones de más de ~80 caracteres.

## Entrada y salida

**Entradas:**
- `home` · «¿Cómo funciona?»
- Header · `./about`
- Cualquier pantalla · enlace «Acerca de» del footer (REQ-002, CA 19)

**Salidas user-driven:**
- A `home` · «Volver a los juegos»

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | viewport_overrides: desktop | Marca, #número del desafío del día e idioma |
| 2 | nav-movil | nav-bar | — | navigation | solo mobile | — | Navegación principal compacta en mobile (en desktop va en el header) |
| 3 | titulo | heading | h1 | content | ambos | — | Título de la pantalla |
| 4 | intro | paragraph | body | content | ambos | — | Qué es nerdose |
| 5 | card-juegos | card | — | content | ambos | — | Los 5 juegos en una línea cada uno |
| 6 | card-rachas | card | — | content | ambos | — | Reglas de racha |
| 7 | card-atribucion | card | — | content | ambos | — | Atribución obligatoria de Wikipedia y Wikidata |
| 8 | card-privacidad | card | — | content | ambos | — | Aviso de privacidad |
| 9 | link-volver | link | — | navigation | ambos | — | Salida a la home |
| 10 | footer | footer | — | layout | ambos | — | Aviso breve de privacidad y enlace a Acerca de |

## Layout por viewport

### mobile · 400px
- nav-movil
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
- Texto/label: > nerdose · #8 · ES|EN
- Icono: nada
- Override desktop: content="> nerdose     ./juegos   ./stats   ./about     #8     ES | EN"
- Annotation: #número = número de desafío del día, igual para los 5 juegos; ES|EN es un control inline

### nav-movil
- Texto/label: —
- Etiquetas: ./juegos · ./stats · ./about
- Icono: nada
- Annotation: nada

### titulo
- Texto/label: Acerca de nerdose
- Icono: nada
- Annotation: nada

### intro
- Texto/label: nerdose es un juego diario sobre programación y tecnología: cinco minijuegos cortos, un único desafío por día igual para todos, sin registro y en español e inglés.
- Icono: nada
- Annotation: nada

### card-juegos
- Texto/label: Los 5 juegos
- Texto secundario: Devdle: adiviná el término. Bug Hunt: encontrá la línea con el bug. Big O: elegí la complejidad. Tech Timeline: ordená los hitos. Grep Grid: encontrá las 8 palabras, sin tiempo.
- Icono: nada
- Annotation: nada

### card-rachas
- Texto/label: Cómo funciona la racha
- Texto secundario: Completar un desafío, ganando o perdiendo, suma a tu racha. Un día sin desafío es neutro: no suma ni corta. Un desafío anulado no te afecta.
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
- Annotation: nada

### footer
- Texto/label: nerdose.dev · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de
- Icono: nada
- Annotation: «Acerca de» es un enlace a `acerca-de`; el footer es del shell y es igual en todas las pantallas (REQ-002, C-07)

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

- **Orden de foco:** titulo → enlaces dentro de las tarjetas → «Volver a los juegos».
- **Landmarks y jerarquía:** `h1` «Acerca de nerdose»; cada tarjeta es `h2`. Landmarks: header, nav, main, footer.
- **Foco y teclado:** Sin trampas de foco.
- **Propio de esta composición:** Los enlaces a Wikipedia/Wikidata indican que abren una pestaña nueva.

## Decisiones y descartes

**Decisiones tomadas:**
- Pantalla estática de un solo estado: no hay datos de sesión ni de red, así que no hay `loading` ni error.
- La atribución CC BY-SA vive en esta pantalla por obligación de licencia (C-07).
- REQ-002: el aviso de privacidad explicita «una única cookie funcional, sin datos personales ni cookies de terceros» y por qué no hay banner (RF 15, NFR-PR01); la entrada principal pasa a ser el enlace del footer, presente en todas las pantallas (RF 14, CA 19). Sin cambios de layout.

**Alternativas descartadas:**
- Un FAQ con acordeones: más interacción para un contenido corto.

**Preguntas abiertas:**
- Ninguna propia de esta pantalla.

## Trazabilidad

- C-07, F-01 · flujo 3 (dudas sobre la racha).
- REQ-002: RF 14, RF 15 · CA 19, CA 21.
