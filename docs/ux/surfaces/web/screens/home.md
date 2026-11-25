---
name: home
surface: web
route: /
viewports:
  - mobile
  - desktop
audiences:
  - jugador
fidelity: mid
status: diseñada
version: "1.3"
date: 2026-11-15
---

# Pantalla: Home (catálogo)

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver qué juegos faltan hoy, la racha global y cuánto falta para el próximo desafío, y entrar al juego que corresponde según el estado de cada partida.
- **Viewports:**
  - **mobile** — entrada principal del uso diario: todo en una columna (hero, terminal del día, tarjetas, "Tu progreso", "Cómo funciona"). El header es el mismo que en desktop y se acomoda en 2-3 renglones con `flex-wrap`; no hay tira de navegación aparte. Usable desde 320 px sin scroll horizontal.
  - **desktop** — la estructura del prototipo `docs/nerdose.html`: hero a dos columnas con la ventana de terminal al lado, grilla de tarjetas de 3 columnas (5 juegos + tarjeta "próximo juego"), panel "Tu progreso" a todo el ancho y los 4 pasos de "Cómo funciona" en fila. Contenedor de 1240 px con gutter de 32 px.

## Entrada y salida

**Entradas:**
- Desde fuera (hábito diario, enlace compartido)
- Desde cualquier pantalla · marca `> nerdose_` o `./juegos`
- Desde `*-resultado` · «Volver a los juegos»

**Salidas user-driven:**
- A `{juego}-instrucciones` · tarjeta «sin jugar» (CTA «Jugar →»)
- A `{juego}-partida` · tarjeta «en curso» (CTA «Seguir jugando»)
- A `{juego}-resultado` · tarjeta «completado» (CTA «Ver resultado»)
- A O-02 · tarjeta «anulado» (CTA «Ver aviso de anulación»)
- A `estadisticas` · «ver estadísticas →» o píldora de racha del header
- A `acerca-de` · `./about` del header
- Dentro de la misma pantalla · «¿Cómo funciona?» baja a la sección «Cómo funciona» (ancla `#como`) y mueve el foco a su título

**Salidas automáticas:**
- Recarga del estado del día al llegar a 0 la cuenta regresiva (espera aleatoria 0–3 s, ADR-008): todas las tarjetas vuelven a «sin jugar».

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | state_overrides: empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento, loading, error de sistema | Marca, nav, píldora de racha, #número e idioma (`app-header` variant `home`) |
| 2 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Aviso O-03 de sesión no creada, dentro del contenedor de página |
| 3 | hero-eyebrow | label | — | content | ambos | hidden_in_states: loading, error de sistema | Prompt de terminal con la fecha del día |
| 4 | hero-titulo | heading | h1 | content | ambos | — | Identidad del producto |
| 5 | hero-sub | paragraph | body | content | ambos | — | Propuesta de valor |
| 6 | cta-hero | button | primary | input | ambos | state_overrides: empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | CTA principal de la home (`lg`) |
| 7 | btn-como-funciona | button | secondary | input | ambos | — | Bajar a la sección «Cómo funciona» (`lg`) |
| 8 | terminal-hoy | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: en curso, sin desafío hoy, anulado, empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | Ventana de terminal con el estado de cada juego hoy (`terminal-window`) |
| 9 | racha-global | label | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | Racha global y récord, al pie de la terminal |
| 10 | cuenta-regresiva | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Cuenta regresiva a next_reset_at, última línea de la terminal |
| 11 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 12 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 13 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 14 | titulo-desafios | heading | h2 | content | ambos | — | Título de la sección de juegos (ancla `#juegos`) |
| 15 | progreso-dia | progress-bar | — | feedback | ambos | hidden_in_states: loading, error de sistema; state_overrides: en curso, sin desafío hoy, anulado, empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | Progreso del día: barra segmentada de 5 |
| 16 | card-devdle | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Devdle |
| 17 | cta-devdle | button | secondary | input | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Devdle según estado de la Play |
| 18 | card-bug-hunt | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, en curso, empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Bug Hunt |
| 19 | cta-bug-hunt | button | primary | input | ambos | hidden_in_states: loading, error de sistema; state_overrides: en curso, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Bug Hunt según estado de la Play |
| 20 | card-big-o | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, anulado, empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Big O |
| 21 | cta-big-o | button | primary | input | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Big O según estado de la Play |
| 22 | btn-aviso-anulado | button | secondary | input | ambos | visible_only_in_states: anulado | CTA de la tarjeta anulada: abre O-02 |
| 23 | card-timeline | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, sin desafío hoy, empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Tech Timeline |
| 24 | cta-timeline | button | primary | input | ambos | hidden_in_states: loading, error de sistema; state_overrides: sin desafío hoy, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Tech Timeline según estado de la Play |
| 25 | card-grep-grid | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, en curso, empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Grep Grid |
| 26 | cta-grep-grid | button | primary | input | ambos | hidden_in_states: loading, error de sistema; state_overrides: en curso, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Grep Grid según estado de la Play |
| 27 | card-proximo | card | — | content | ambos | hidden_in_states: loading | Tarjeta decorativa «próximo juego» (`card` variant `placeholder`) |
| 28 | titulo-progreso | heading | h2 | content | ambos | hidden_in_states: loading, error de sistema | Título del panel «Tu progreso» |
| 29 | link-stats | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Ir a estadísticas |
| 30 | racha-numero | label | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | Racha global protagonista (`streak-number` variant `compact`) |
| 31 | mini-stat-record | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | Récord de racha global (`card` variant `mini-stat`) |
| 32 | resumen-progreso | paragraph | caption | content | ambos | visible_only_in_states: empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | Explicación cuando todavía no hay progreso para mostrar |
| 33 | titulo-como | heading | h2 | content | ambos | — | Título de «Cómo funciona» (ancla `#como`, destino del foco) |
| 34 | paso-1 | card | — | content | ambos | — | Paso 01 (`card` variant `step`) |
| 35 | paso-2 | card | — | content | ambos | — | Paso 02 (`card` variant `step`) |
| 36 | paso-3 | card | — | content | ambos | — | Paso 03 (`card` variant `step`) |
| 37 | paso-4 | card | — | content | ambos | — | Paso 04 (`card` variant `step`) |
| 38 | footer | footer | — | layout | ambos | — | Lema y `exit 0` (`site-footer`) |

## Layout por viewport

### mobile · 400px
- banner-cookies
- hero-eyebrow
- hero-titulo
- hero-sub
- cta-hero
- btn-como-funciona
- row `terminal` (card)
  - col 12/12: terminal-hoy, racha-global, cuenta-regresiva
- loader
- alerta-sistema
- btn-reintentar
- titulo-desafios
- progreso-dia
- card-devdle
- cta-devdle
- card-bug-hunt
- cta-bug-hunt
- card-big-o
- cta-big-o
- btn-aviso-anulado
- card-timeline
- cta-timeline
- card-grep-grid
- cta-grep-grid
- card-proximo
- row `progreso` (card)
  - col 12/12: titulo-progreso, link-stats, racha-numero, mini-stat-record, resumen-progreso
- titulo-como
- paso-1
- paso-2
- paso-3
- paso-4

### desktop · 1200px
- banner-cookies
- row `hero`
  - col 7/12: hero-eyebrow, hero-titulo, hero-sub, cta-hero, btn-como-funciona
  - col 5/12 (card): terminal-hoy, racha-global, cuenta-regresiva
- row `sistema`
  - col 12/12: loader, alerta-sistema, btn-reintentar
- row `desafios-cabecera`
  - col 8/12: titulo-desafios
  - col 4/12: progreso-dia
- row `juegos-1`
  - col 4/12: card-devdle, cta-devdle
  - col 4/12: card-bug-hunt, cta-bug-hunt
  - col 4/12: card-big-o, cta-big-o, btn-aviso-anulado
- row `juegos-2`
  - col 4/12: card-timeline, cta-timeline
  - col 4/12: card-grep-grid, cta-grep-grid
  - col 4/12: card-proximo
- row `progreso` (card)
  - col 7/12: titulo-progreso, racha-numero, resumen-progreso
  - col 5/12: link-stats, mini-stat-record
- titulo-como
- row `pasos`
  - col 3/12: paso-1
  - col 3/12: paso-2
  - col 3/12: paso-3
  - col 3/12: paso-4

## Contenido

### header
- Texto/label: > nerdose_   ./juegos   ./stats   ./about   racha 4 días   #8   ES | EN
- Icono: nada
- Annotation: `app-header` variant `home` (fondo translúcido sobre la textura de puntos, cursor `_` parpadeante salvo con «reducir movimiento»). `./juegos` es el ítem activo. «racha 4 días» es la píldora de racha (`streak-pill`, ícono de llama, ámbar) y enlaza a `estadisticas` con `aria-label` «Racha global: 4 días». `#8` = número de desafío del día, igual para los 5 juegos; se oculta cuando el servidor no lo informa, nunca se muestra un número menor que 1. ES | EN es el grupo segmentado (`language-selector`): cambia la interfaz sin recargar y persiste en el Player; sin sesión cambia solo en este navegador. Sin media queries: en mobile el header se acomoda con `flex-wrap` (logo y acciones arriba, nav debajo) y a 320 px no hay scroll horizontal

### banner-cookies
- Texto/label: Activá las cookies para poder jugar
- Icono: nada
- Annotation: Es el overlay O-03 (`banner` variant `warning`), alineado al contenedor de página (no de borde a borde), con `role="status"`. Persiste hasta que la sesión se crea. Solo aparece si la creación de la sesión respondió bien y el estado del día sigue sin sesión; si la creación fue rechazada por límite (429) no se muestra (estado «sesión no disponible», REQ-002)

### hero-eyebrow
- Texto/label: $ nerdose --today // viernes 30 oct
- Icono: nada
- Annotation: la fecha es `date` de `/api/today`, formateada en el idioma activo (día de la semana, día y mes abreviado); `// fecha` va en el verde de la plataforma

### hero-titulo
- Texto/label: Una dosis diaria de nerdeo.
- Icono: nada
- Annotation: titular display (`type.display.hero`), texto del prototipo con «nerdeo» en el verde de la plataforma; a 320 px se reduce con el mismo criterio que `type.title.page`

### hero-sub
- Texto/label: Minijuegos para developers y curiosos de la tecnología. Un desafío nuevo por día, el mismo para todos. Dos minutos, algo aprendido, una racha que cuidar.
- Icono: nada
- Annotation: prosa en Inter (lede)

### cta-hero
- Texto/label: Seguir jugando
- Icono: arrow-right
- Annotation: botón `primary` `lg`; baja a «Los desafíos de hoy» (`#juegos`)

### btn-como-funciona
- Texto/label: ¿Cómo funciona?
- Icono: nada
- Annotation: botón `secondary` `lg`; baja a la sección «Cómo funciona» de esta misma pantalla (`#como`), sin animación si el sistema pide reducir movimiento, y mueve el foco a su título. Ya no lleva a `acerca-de`

### terminal-hoy
- Texto/label: ~/hoy — progreso.log
- Texto secundario: $ nerdose status · ✓ devdle 4/6 completado · ○ bug-hunt — sin jugar · ○ big-o — sin jugar · ○ timeline — sin jugar · ○ grep-grid — sin jugar
- Icono: nada
- Annotation: `terminal-window`: una fila por juego con ícono + slug + métrica + estado, en el orden de los 5 juegos. El estado se lee en texto, no solo por color. Íconos por estado: `✓` completado (métrica = etiqueta corta del resultado), `○` sin jugar, `◐` en curso, `–` sin desafío, `⊘` anulado, `○` próximamente. Decorativa en su forma, pero con datos reales del día

### racha-global
- Texto/label: racha global · 4 días · récord 9
- Icono: nada
- Annotation: separador punteado arriba; los números en ámbar. Con racha 0 se muestra en gris, nunca ámbar vacío

### cuenta-regresiva
- Texto/label: próximo desafío en 05:42:10 ▌
- Icono: nada
- Annotation: HH:MM:SS hasta las 00:00 UTC. Al llegar a 0 recarga el estado del día tras una espera aleatoria de 0–3 s. El reloj solo descuenta los segundos que informa el servidor y se re-sincroniza en cada respuesta; si la recarga falla, la home pasa a «error de sistema» con «Reintentar». No se anuncia cada segundo a lectores de pantalla. El cursor `▌` no parpadea con «reducir movimiento»

### loader
- Texto/label: Cargando los desafíos de hoy…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar los juegos de hoy. Revisá tu conexión e intentá de nuevo.
- Icono: nada
- Annotation: `alert` variant `error` del DS (tinte de error, borde de 1 px, radio 14, ícono `x`)

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: botón `secondary` `md`

### titulo-desafios
- Texto/label: Los desafíos de hoy
- Icono: nada
- Annotation: destino de «Seguir jugando» (`#juegos`)

### progreso-dia
- Texto/label: // 1 de 5 completados hoy
- Icono: nada
- Annotation: `progress-bar` variant `segmented`: 5 segmentos, uno lleno por juego completado. El texto va como etiqueta-comentario sobre el título y es también el nombre accesible de la barra

### card-devdle
- Texto/label: Devdle
- Texto secundario: [✓ 4/6] Adiviná el término tech en 6 intentos · ~2 min · ▲ racha 3
- Icono: nada
- Annotation: `card` variant `game`: miniatura del juego de 150 px arriba (decorativa, `aria-hidden`, `patterns/game-boards.md`), nombre como `h3` en el acento del juego, badge de estado a la derecha (`[…]` en el wireframe), descripción en Inter y metadatos con la racha en ámbar. Badge `success` para completado; `pending` para sin jugar y en curso; neutro para sin desafío, anulado, próximamente y sin sesión

### cta-devdle
- Texto/label: Ver resultado
- Icono: nada
- Annotation: `md`, ancho completo. Según el estado: sin jugar → «Jugar →» en el acento del juego, a instrucciones; en curso → «Seguir jugando», a partida; completado → `secondary` «Ver resultado», a resultado

### card-bug-hunt
- Texto/label: Bug Hunt
- Texto secundario: [sin jugar] Encontrá la línea con el bug · ~2 min · ▲ racha 2
- Icono: nada
- Annotation: es la tarjeta `next` (borde y anillo del acento del juego): el destino de «Seguir jugando», el primer juego en curso o, si no hay, el primero publicado sin jugar

### cta-bug-hunt
- Texto/label: Jugar →
- Icono: nada
- Annotation: acento del juego con su texto on-accent, `md`, ancho completo; según el estado: sin jugar → instrucciones, en curso → partida, completado → resultado

### card-big-o
- Texto/label: Big O
- Texto secundario: [sin jugar] Elegí la complejidad temporal · ~1 min · ▲ racha 5
- Icono: nada
- Annotation: nada

### cta-big-o
- Texto/label: Jugar →
- Icono: nada
- Annotation: acento del juego con su texto on-accent, `md`, ancho completo; según el estado: sin jugar → instrucciones, en curso → partida, completado → resultado

### btn-aviso-anulado
- Texto/label: Ver aviso de anulación
- Icono: info
- Annotation: `secondary` `md`, ancho completo

### card-timeline
- Texto/label: Tech Timeline
- Texto secundario: [sin jugar] Ordená 5 hitos de la tecnología · ~1 min · ▲ racha 1
- Icono: nada
- Annotation: nada

### cta-timeline
- Texto/label: Jugar →
- Icono: nada
- Annotation: acento del juego con su texto on-accent, `md`, ancho completo; según el estado: sin jugar → instrucciones, en curso → partida, completado → resultado

### card-grep-grid
- Texto/label: Grep Grid
- Texto secundario: [sin jugar] Encontrá 8 palabras en la grilla · sin tiempo · ~3 min · racha 0
- Icono: nada
- Annotation: con racha 0 el metadato va en gris y sin `▲`

### cta-grep-grid
- Texto/label: Jugar →
- Icono: nada
- Annotation: acento del juego con su texto on-accent, `md`, ancho completo; según el estado: sin jugar → instrucciones, en curso → partida, completado → resultado

### card-proximo
- Texto/label: $ git checkout -b próximo-juego
- Texto secundario: Más desafíos en camino. Cada juego nuevo suma su propia racha. · [próximamente]
- Icono: nada
- Annotation: `card` variant `placeholder`: borde punteado, sin fondo. Decorativa: no es interactiva, no entra en el orden de foco y no depende de datos

### titulo-progreso
- Texto/label: Tu progreso
- Icono: nada
- Annotation: `panel` variant `feature`; etiqueta-comentario «// racha global» sobre el título

### link-stats
- Texto/label: ver estadísticas →
- Icono: arrow-right
- Annotation: `link` del DS (sin subrayado, color del acento)

### racha-numero
- Texto/label: 4 días seguidos
- Icono: nada
- Annotation: `streak-number` variant `compact`: el número en display de 88 px, ámbar; «días / seguidos» en dos líneas al costado. Con racha 0 el número va en gris; sin datos se muestra `—`

### mini-stat-record
- Texto/label: 9
- Texto secundario: récord de racha
- Icono: nada
- Annotation: `card` variant `mini-stat`. El heatmap y los demás mini-stats del prototipo (desafíos completados, % de victorias) no se suman a la home: viven en `estadisticas` (REQ-011, decisión 10)

### resumen-progreso
- Texto/label: Todavía no hay datos. Completá un desafío y acá vas a ver tu racha.
- Icono: nada
- Annotation: solo aparece cuando no hay progreso para mostrar

### titulo-como
- Texto/label: Cómo funciona
- Icono: nada
- Annotation: ancla `#como`; recibe el foco al llegar desde «¿Cómo funciona?»

### paso-1
- Texto/label: 01 · todos los días
- Texto secundario: Cada juego publica un desafío nuevo a las 00:00 UTC. Es el mismo para todos.
- Icono: nada
- Annotation: `card` variant `step`; el número y el título van en Mono, en el verde de la plataforma

### paso-2
- Texto/label: 02 · reglas propias
- Texto secundario: Cada juego tiene su propia mecánica, sus intentos y su puntaje.
- Icono: nada
- Annotation: título en el acento de Bug Hunt

### paso-3
- Texto/label: 03 · aprendés algo
- Texto secundario: Al terminar, cada desafío explica la respuesta y su contexto.
- Icono: nada
- Annotation: título en el acento de Big O

### paso-4
- Texto/label: 04 · compartís sin spoilers
- Texto secundario: Copiás tu resultado en cuadraditos y lo pegás donde quieras.
- Icono: nada
- Annotation: título en el acento de Tech Timeline

### footer
- Texto/label: > nerdose — una plataforma, múltiples desafíos. · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de · exit 0
- Icono: nada
- Annotation: `site-footer`: una sola línea, como el prototipo: el lema a la izquierda y `exit 0` a la derecha, en Mono 13 gris. El aviso de privacidad vive en `acerca-de`. Es del shell e igual en todas las pantallas (REQ-002, C-07)

## Estados

### default
- Aplica: Sí
- Mensaje: Hoy hay 5 desafíos; Devdle ya está completado (✓ 4/6) y los otros 4 esperan. Bug Hunt es el próximo a jugar.
- Cambios: ninguno respecto de default.

### en curso
- Aplica: Sí (sub-estado de default)
- Mensaje: Bug Hunt y Grep Grid tienen una partida empezada: badge «en curso» y CTA «Seguir jugando».
- Cambios:
  - terminal-hoy: paragraph="$ nerdose status · ✓ devdle 4/6 completado · ◐ bug-hunt — en curso · ○ big-o — sin jugar · ○ timeline — sin jugar · ◐ grep-grid — en curso" (state_override)
  - progreso-dia: content="// 1 de 5 completados hoy", fill=0.2 (state_override)
  - card-bug-hunt: paragraph="[en curso] Encontrá la línea con el bug · ~2 min · ▲ racha 2" (state_override)
  - cta-bug-hunt: content="Seguir jugando", variant="primary" (state_override)
  - card-grep-grid: paragraph="[en curso] Encontrá 8 palabras en la grilla · sin tiempo · ~3 min · racha 0" (state_override)
  - cta-grep-grid: content="Seguir jugando", variant="primary" (state_override)

### sin desafío hoy
- Aplica: Sí (sub-estado de default)
- Mensaje: Tech Timeline no tiene desafío publicado: badge «sin desafío hoy» y «no afecta tu racha», sin CTA de juego.
- Cambios:
  - terminal-hoy: paragraph="$ nerdose status · ✓ devdle 4/6 completado · ○ bug-hunt — sin jugar · ○ big-o — sin jugar · – timeline — sin desafío · ○ grep-grid — sin jugar" (state_override)
  - progreso-dia: content="// 1 de 4 con desafío completados", fill=0.25 (state_override)
  - card-timeline: paragraph="[sin desafío hoy] Ordená 5 hitos de la tecnología · ~1 min · ▲ racha 1 · no afecta tu racha" (state_override)
  - cta-timeline: content="Sin desafío hoy", variant="disabled" (state_override)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: El desafío de Big O fue anulado: badge «anulado» y CTA «Ver aviso de anulación» que abre O-02.
- Cambios:
  - terminal-hoy: paragraph="$ nerdose status · ✓ devdle 4/6 completado · ○ bug-hunt — sin jugar · ⊘ big-o — anulado · ○ timeline — sin jugar · ○ grep-grid — sin jugar" (state_override)
  - progreso-dia: content="// 1 de 5 completados hoy", fill=0.2 (state_override)
  - card-big-o: paragraph="[anulado] Elegí la complejidad temporal · ~1 min · ▲ racha 5" (state_override)
  - cta-big-o: oculto en este estado (hidden_in_states)
  - btn-aviso-anulado: solo visible en este estado (visible_only_in_states)

### empty
- Aplica: Sí (sub-estado de default)
- Mensaje: Primera visita: todos «sin jugar», racha global 0 y «Tu progreso» sin datos: «Todavía no hay datos. Completá un desafío y acá vas a ver tu racha.»
- Cambios:
  - header: content="> nerdose_   ./juegos   ./stats   ./about   racha 0 días   #8   ES | EN" (state_override; píldora en gris)
  - cta-hero: content="Empezar a jugar" (state_override)
  - terminal-hoy: paragraph="$ nerdose status · ○ devdle — sin jugar · ○ bug-hunt — sin jugar · ○ big-o — sin jugar · ○ timeline — sin jugar · ○ grep-grid — sin jugar" (state_override)
  - racha-global: content="racha global · 0 días · récord 0" (state_override)
  - progreso-dia: content="// 0 de 5 completados hoy", fill=0.0 (state_override)
  - card-devdle: paragraph="[sin jugar] Adiviná el término tech en 6 intentos · ~2 min · racha 0" (state_override; es la tarjeta `next`)
  - cta-devdle: content="Jugar →", variant="primary" (state_override)
  - card-bug-hunt: paragraph="[sin jugar] Encontrá la línea con el bug · ~2 min · racha 0" (state_override)
  - card-big-o: paragraph="[sin jugar] Elegí la complejidad temporal · ~1 min · racha 0" (state_override)
  - card-timeline: paragraph="[sin jugar] Ordená 5 hitos de la tecnología · ~1 min · racha 0" (state_override)
  - card-grep-grid: paragraph="[sin jugar] Encontrá 8 palabras en la grilla · sin tiempo · ~3 min · racha 0" (state_override)
  - racha-numero: content="0 días seguidos" (state_override; número en gris)
  - mini-stat-record: content="0" (state_override)
  - resumen-progreso: content="Todavía no hay datos. Completá un desafío y acá vas a ver tu racha." (state_override)

### sin sesión
- Aplica: Sí (sub-estado de default)
- Mensaje: Cookies bloqueadas: se ven los 5 juegos pero los CTA están deshabilitados y aparece el banner O-03 «Activá las cookies para poder jugar».
- Cambios:
  - header: content="> nerdose_   ./juegos   ./stats   ./about   racha —   #8   ES | EN" (state_override; píldora en gris, sin datos)
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - cta-hero: content="Empezar a jugar", variant="disabled" (state_override)
  - terminal-hoy: paragraph="$ nerdose status · ○ devdle — sin sesión · ○ bug-hunt — sin sesión · ○ big-o — sin sesión · ○ timeline — sin sesión · ○ grep-grid — sin sesión" (state_override)
  - racha-global: content="racha global · — sin datos" (state_override)
  - progreso-dia: content="// Sin sesión: no podemos mostrar tu progreso", fill=0.0 (state_override)
  - card-devdle: paragraph="[sin sesión] Adiviná el término tech en 6 intentos · ~2 min" (state_override)
  - cta-devdle: content="Jugar →", variant="disabled" (state_override)
  - card-bug-hunt: paragraph="[sin sesión] Encontrá la línea con el bug · ~2 min" (state_override)
  - cta-bug-hunt: content="Jugar →", variant="disabled" (state_override)
  - card-big-o: paragraph="[sin sesión] Elegí la complejidad temporal · ~1 min" (state_override)
  - cta-big-o: content="Jugar →", variant="disabled" (state_override)
  - card-timeline: paragraph="[sin sesión] Ordená 5 hitos de la tecnología · ~1 min" (state_override)
  - cta-timeline: content="Jugar →", variant="disabled" (state_override)
  - card-grep-grid: paragraph="[sin sesión] Encontrá 8 palabras en la grilla · sin tiempo · ~3 min" (state_override)
  - cta-grep-grid: content="Jugar →", variant="disabled" (state_override)
  - racha-numero: content="— sin datos" (state_override)
  - mini-stat-record: content="—" (state_override)
  - resumen-progreso: content="Sin sesión no hay progreso para mostrar. Activá las cookies y recargá." (state_override)

### ningún desafío hoy
- Aplica: Sí (sub-estado de default)
- Mensaje: Hoy no hay desafíos publicados en ningún juego: los 5 figuran «sin desafío hoy», sin «Jugar», y la terminal muestra las 5 filas «sin desafío». Es el estado de la plataforma hasta que existan los generadores (REQ-002, CA 9; REQ-003, CA 6).
- Cambios:
  - header: content="> nerdose_   ./juegos   ./stats   ./about   racha 0 días   #8   ES | EN" (state_override; píldora en gris)
  - cta-hero: content="Ver los juegos" (state_override)
  - terminal-hoy: paragraph="$ nerdose status · – devdle — sin desafío · – bug-hunt — sin desafío · – big-o — sin desafío · – timeline — sin desafío · – grep-grid — sin desafío" (state_override)
  - racha-global: content="racha global · 0 días · récord 0" (state_override)
  - progreso-dia: content="// Hoy no hay desafíos publicados", fill=0.0 (state_override)
  - card-devdle: paragraph="[sin desafío hoy] Adiviná el término tech en 6 intentos · ~2 min · racha 0 · no afecta tu racha" (state_override)
  - cta-devdle: content="Sin desafío hoy", variant="disabled" (state_override)
  - card-bug-hunt: paragraph="[sin desafío hoy] Encontrá la línea con el bug · ~2 min · racha 0 · no afecta tu racha" (state_override)
  - cta-bug-hunt: content="Sin desafío hoy", variant="disabled" (state_override)
  - card-big-o: paragraph="[sin desafío hoy] Elegí la complejidad temporal · ~1 min · racha 0 · no afecta tu racha" (state_override)
  - cta-big-o: content="Sin desafío hoy", variant="disabled" (state_override)
  - card-timeline: paragraph="[sin desafío hoy] Ordená 5 hitos de la tecnología · ~1 min · racha 0 · no afecta tu racha" (state_override)
  - cta-timeline: content="Sin desafío hoy", variant="disabled" (state_override)
  - card-grep-grid: paragraph="[sin desafío hoy] Encontrá 8 palabras en la grilla · sin tiempo · ~3 min · racha 0 · no afecta tu racha" (state_override)
  - cta-grep-grid: content="Sin desafío hoy", variant="disabled" (state_override)
  - racha-numero: content="0 días seguidos" (state_override; número en gris)
  - mini-stat-record: content="0" (state_override)
  - resumen-progreso: content="Todavía no hay datos. Cuando haya desafíos, acá vas a ver tu racha." (state_override)

### antes del lanzamiento
- Aplica: Sí (sub-estado de default)
- Mensaje: Todavía no empezó el desafío #1: el header no muestra número y el catálogo funciona igual, con los 5 juegos «próximamente» (REQ-002, CA 17).
- Cambios:
  - header: content="> nerdose_   ./juegos   ./stats   ./about   racha 0 días   ES | EN" (state_override; sin #número, píldora en gris)
  - cta-hero: content="Ver los juegos" (state_override)
  - terminal-hoy: paragraph="$ nerdose status · ○ devdle — próximamente · ○ bug-hunt — próximamente · ○ big-o — próximamente · ○ timeline — próximamente · ○ grep-grid — próximamente" (state_override)
  - racha-global: content="racha global · 0 días · récord 0" (state_override)
  - progreso-dia: content="// El primer desafío llega pronto", fill=0.0 (state_override)
  - card-devdle: paragraph="[próximamente] Adiviná el término tech en 6 intentos · ~2 min" (state_override)
  - cta-devdle: content="Próximamente", variant="disabled" (state_override)
  - card-bug-hunt: paragraph="[próximamente] Encontrá la línea con el bug · ~2 min" (state_override)
  - cta-bug-hunt: content="Próximamente", variant="disabled" (state_override)
  - card-big-o: paragraph="[próximamente] Elegí la complejidad temporal · ~1 min" (state_override)
  - cta-big-o: content="Próximamente", variant="disabled" (state_override)
  - card-timeline: paragraph="[próximamente] Ordená 5 hitos de la tecnología · ~1 min" (state_override)
  - cta-timeline: content="Próximamente", variant="disabled" (state_override)
  - card-grep-grid: paragraph="[próximamente] Encontrá 8 palabras en la grilla · sin tiempo · ~3 min" (state_override)
  - cta-grep-grid: content="Próximamente", variant="disabled" (state_override)
  - racha-numero: content="0 días seguidos" (state_override; número en gris)
  - mini-stat-record: content="0" (state_override)
  - resumen-progreso: content="Todavía no hay datos. Cuando empiecen los desafíos, acá vas a ver tu racha." (state_override)

### sesión no disponible
- Aplica: Sí (sub-estado de default)
- Mensaje: No se pudo crear la sesión por exceso de pedidos (429): el catálogo se ve igual, los CTA quedan deshabilitados y se reintenta en la próxima carga. No aparece el banner de cookies, porque no es un problema del navegador (REQ-002, CA 13).
- Cambios:
  - header: content="> nerdose_   ./juegos   ./stats   ./about   racha —   #8   ES | EN" (state_override; píldora en gris, sin datos)
  - cta-hero: content="Empezar a jugar", variant="disabled" (state_override)
  - terminal-hoy: paragraph="$ nerdose status · ○ devdle — · ○ bug-hunt — · ○ big-o — · ○ timeline — · ○ grep-grid —" (state_override)
  - racha-global: content="racha global · — sin datos" (state_override)
  - progreso-dia: content="// No pudimos iniciar tu sesión. Recargá en unos minutos para jugar.", fill=0.0 (state_override)
  - card-devdle: paragraph="Adiviná el término tech en 6 intentos · ~2 min" (state_override; sin badge)
  - cta-devdle: content="Jugar →", variant="disabled" (state_override)
  - card-bug-hunt: paragraph="Encontrá la línea con el bug · ~2 min" (state_override)
  - cta-bug-hunt: content="Jugar →", variant="disabled" (state_override)
  - card-big-o: paragraph="Elegí la complejidad temporal · ~1 min" (state_override)
  - cta-big-o: content="Jugar →", variant="disabled" (state_override)
  - card-timeline: paragraph="Ordená 5 hitos de la tecnología · ~1 min" (state_override)
  - cta-timeline: content="Jugar →", variant="disabled" (state_override)
  - card-grep-grid: paragraph="Encontrá 8 palabras en la grilla · sin tiempo · ~3 min" (state_override)
  - cta-grep-grid: content="Jugar →", variant="disabled" (state_override)
  - racha-numero: content="— sin datos" (state_override)
  - mini-stat-record: content="—" (state_override)
  - resumen-progreso: content="Sin sesión no hay progreso para mostrar. Recargá en unos minutos." (state_override)

### loading
- Aplica: Sí
- Mensaje: Cargando los desafíos de hoy…
- Cambios:
  - header: content="> nerdose_   ./juegos   ./stats   ./about   ES | EN" (state_override; sin píldora ni #número hasta tener el día)
  - hero-eyebrow: oculto en este estado (hidden_in_states)
  - terminal-hoy: oculto en este estado (hidden_in_states)
  - racha-global: oculto en este estado (hidden_in_states)
  - cuenta-regresiva: oculto en este estado (hidden_in_states)
  - progreso-dia: oculto en este estado (hidden_in_states)
  - card-devdle: oculto en este estado (hidden_in_states)
  - cta-devdle: oculto en este estado (hidden_in_states)
  - card-bug-hunt: oculto en este estado (hidden_in_states)
  - cta-bug-hunt: oculto en este estado (hidden_in_states)
  - card-big-o: oculto en este estado (hidden_in_states)
  - cta-big-o: oculto en este estado (hidden_in_states)
  - card-timeline: oculto en este estado (hidden_in_states)
  - cta-timeline: oculto en este estado (hidden_in_states)
  - card-grep-grid: oculto en este estado (hidden_in_states)
  - cta-grep-grid: oculto en este estado (hidden_in_states)
  - card-proximo: oculto en este estado (hidden_in_states)
  - titulo-progreso: oculto en este estado (hidden_in_states)
  - link-stats: oculto en este estado (hidden_in_states)
  - racha-numero: oculto en este estado (hidden_in_states)
  - mini-stat-record: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar los juegos de hoy. Revisá tu conexión e intentá de nuevo.
- Cambios:
  - header: content="> nerdose_   ./juegos   ./stats   ./about   ES | EN" (state_override; sin píldora ni #número porque no se pudo leer el día)
  - hero-eyebrow: oculto en este estado (hidden_in_states)
  - terminal-hoy: oculto en este estado (hidden_in_states)
  - racha-global: oculto en este estado (hidden_in_states)
  - cuenta-regresiva: oculto en este estado (hidden_in_states)
  - progreso-dia: oculto en este estado (hidden_in_states)
  - card-devdle: paragraph="Adiviná el término tech en 6 intentos · ~2 min" (state_override; catálogo estático, sin estado del día)
  - cta-devdle: oculto en este estado (hidden_in_states)
  - card-bug-hunt: paragraph="Encontrá la línea con el bug · ~2 min" (state_override)
  - cta-bug-hunt: oculto en este estado (hidden_in_states)
  - card-big-o: paragraph="Elegí la complejidad temporal · ~1 min" (state_override)
  - cta-big-o: oculto en este estado (hidden_in_states)
  - card-timeline: paragraph="Ordená 5 hitos de la tecnología · ~1 min" (state_override)
  - cta-timeline: oculto en este estado (hidden_in_states)
  - card-grep-grid: paragraph="Encontrá 8 palabras en la grilla · sin tiempo · ~3 min" (state_override)
  - cta-grep-grid: oculto en este estado (hidden_in_states)
  - titulo-progreso: oculto en este estado (hidden_in_states)
  - link-stats: oculto en este estado (hidden_in_states)
  - racha-numero: oculto en este estado (hidden_in_states)
  - mini-stat-record: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- cta-{juego} · on click → abre la fase que decide el estado de la Play
- cta-hero · on click → baja a «Los desafíos de hoy»
- btn-como-funciona · on click / Enter → baja a «Cómo funciona» y mueve el foco a su título
- btn-aviso-anulado · on click → abre O-02
- link-stats · on click → navega a `estadisticas`
- header · píldora de racha · on click → navega a `estadisticas`
- header · ES | EN · on click → cambia el idioma de la interfaz sin recargar; con sesión lo guarda en el Player, sin sesión solo en este navegador
- cuenta-regresiva · llega a 0 → recarga el estado del día
- btn-reintentar · on click → vuelve a pedir el estado del día

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- La tarjeta, la terminal y la barra del día cambian de estado al volver de una partida (sin recargar manualmente).

## Accesibilidad

- **Orden de foco:** header (marca → `./juegos` → `./stats` → `./about` → píldora de racha → ES/EN) → «Seguir jugando» → «¿Cómo funciona?» → CTA de cada tarjeta en orden de lectura → «ver estadísticas →» → footer. La terminal, las miniaturas y la tarjeta «próximo juego» no entran en el orden de foco.
- **Landmarks y jerarquía:** `h1` único: «Una dosis diaria de nerdeo.»; `h2`: «Los desafíos de hoy», «Tu progreso», «Cómo funciona»; el nombre de cada juego es `h3`. Landmarks: header, nav, main, footer.
- **Foco y teclado:** El banner O-03 no atrapa el foco; los CTA deshabilitados siguen siendo alcanzables con `aria-disabled`. «¿Cómo funciona?» deja el foco en el título de la sección (`tabIndex=-1`) para que funcione con teclado.
- **Propio de esta composición:** El estado de cada juego (tarjeta y terminal) se comunica con texto e ícono, no solo con color (NFR-U04); la cuenta regresiva no se anuncia cada segundo; los cursores (`_` del logo, `▌` de la terminal) no parpadean con «reducir movimiento»; a 320 px no hay scroll horizontal (header con `flex-wrap`, grilla `auto-fit` que baja a una columna, titular del hero reducido).

## Decisiones y descartes

**Decisiones tomadas:**
- Una tarjeta por juego con un único CTA cuyo destino lo decide el estado de la Play (C-05): el jugador nunca elige entre instrucciones, partida y resultado.
- El `#número` del desafío vive en el header (decisión #12), no en un texto «desafío del 30/10» como en el prototipo.
- «Anulado» tiene su propio botón (`btn-aviso-anulado`) en lugar de un CTA de juego, porque el destino es un overlay (O-02).
- El estado de sin sesión se modela como estado de la home, no como pantalla: el catálogo sigue visible (C-02).
- Los estados `en curso`, `sin desafío hoy`, `anulado`, `empty` (primera visita) y `sin sesión` son sub-estados de `default` fuera de los 8 fijos, porque el PRD los define por tarjeta (C-05, C-14, C-42).
- REQ-002: `ningún desafío hoy` (CA 9), `antes del lanzamiento` (CA 17), `sesión no disponible` (CA 13) y el catálogo estático en `error de sistema` (CA 18) se mantienen sin cambios de comportamiento.
- REQ-003: la estructura pasa a ser la del prototipo `docs/nerdose.html` (fuente de verdad visual, NFR-U07, decisión #31): hero con prompt `$ nerdose --today`, titular display y botones `lg`; ventana de terminal con el progreso real del día; «Los desafíos de hoy» con barra segmentada y grilla `auto-fit`; panel `feature` «Tu progreso»; «Cómo funciona» con 4 pasos; footer con lema y `exit 0`. Se mantiene la microcopy de REQ-002 (titular, estados, CTA) y se suma la del prototipo para las piezas nuevas.
- REQ-003: la racha global ya no es una línea suelta: está en tres lugares con roles distintos (píldora del header → `estadisticas`; línea de la terminal con el récord; número de 88 px en «Tu progreso»). Los tres leen el mismo dato de `/api/today`.
- REQ-003: el header muestra la píldora de racha **y** el `#número` (supuesto «Número de desafío»): el prototipo solo tiene la píldora y el PRD pide el número.
- REQ-003: la navegación vive siempre en el header y se acomoda con `flex-wrap`; se elimina la tira `nav-movil`. Es una decisión de layout que afecta solo a mobile: en desktop el header ya tenía la nav.
- REQ-003: «¿Cómo funciona?» pasa de enlace a `acerca-de` a botón `secondary` que baja a la sección «Cómo funciona» de la misma home (como en el prototipo). «Acerca de» sigue accesible desde `./about` del header.
- REQ-003: la terminal y la barra segmentada usan solo los campos de `/api/today` (estado y etiqueta por juego, `completed_today`, racha global, `seconds_to_reset`). Las filas «sin desafío», «en curso», «anulado» y «próximamente» no están en el prototipo: se derivan de la identidad (ícono + texto) y se documentan en el DS en la misma story.
- REQ-003: el panel «Tu progreso» muestra solo racha y récord. El heatmap y los mini-stats de desafíos completados y % de victorias no se muestran con datos falsos: llegan con FG-3 / FG-10. Por eso los textos sin datos ya no prometen el heatmap.
- REQ-011: con la fuente de datos ya disponible, «Tu progreso» sigue con racha y récord leídos de `/api/today` (la misma regla de racha viva que `estadisticas`) y el enlace «ver estadísticas →». No se suman el heatmap ni los mini-stats de completados y % de victorias, para no pedir `/api/me/stats` en cada carga de la home (decisión 10 del diseño técnico). Sin cambios de layout.
- REQ-003: la tarjeta «próximo juego» (`placeholder`) entra como sexta tarjeta decorativa: en la grilla de 3 columnas completa la segunda fila, que antes ocupaba el resumen.
- REQ-003: la tarjeta `next` (destino de «Seguir jugando») se marca con el borde del acento del juego; en el estado actual de la plataforma (`ningún desafío hoy`) ninguna lo es.
- Layout desktop: hero 7/5 y grilla de 3 columnas salen de las reglas `flex-wrap` / `auto-fit minmax(300px, 1fr)` del prototipo a 1200 px (1176 px útiles). Mobile: la misma grilla baja a una columna; no hay breakpoints propios de la pantalla.

**Alternativas descartadas:**
- Un menú hamburguesa con overlay en mobile: el PRD no lo exige y el header del prototipo entra con `flex-wrap`.
- Mantener la tira `nav-movil` debajo del header: duplicaba la nav con un componente que el DS no tiene y obligaba a un breakpoint global.
- Mostrar el heatmap y los mini-stats con datos de ejemplo: el REQ prohíbe datos falsos.
- Reemplazar el titular por el del prototipo («Una dosis diaria de nerdeo.»): REQ-003 es de estilo y no cambia la microcopy existente.

**Preguntas abiertas:**
- Pregunta 5 del product-map: si el resultado enlaza a «Siguiente juego» o «Volver a los juegos».
- No hay copy definido para el error de carga: `No pudimos cargar los juegos de hoy…` es propuesta.
- Antes del lanzamiento: «próximamente» en las tarjetas y en la terminal es propuesta.
- Los íconos de las filas de terminal derivadas (`◐`, `–`, `⊘`) son propuesta hasta que la story los documente en `terminal-window.md`.

## Trazabilidad

- F-02, C-05, C-06, C-14, C-41, C-42, C-02, C-01 · flujos 1, 2 y 3 de `user-flows.md`.
- REQ-002: RF 5, 10, 11, 12, 14, 16 · CA 9, 10, 13, 17, 18, 19.
- REQ-003: RF 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14 · CA 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 · decisiones de diseño 1, 5, 6, 7, 9.
- REQ-011: RF 10 · decisión 10 del diseño técnico (alcance de «Tu progreso» sin cambios).
