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
version: "1.1"
date: 2026-11-04
---

# Pantalla: Home (catálogo)

## Identidad

- **Audiencia primaria:** [jugador](../../../audiences/jugador/research-context.md)
- **JTBD / Propósito:** Ver qué juegos faltan hoy, la racha global y cuánto falta para el próximo desafío, y entrar al juego que corresponde según el estado de cada partida.
- **Viewports:**
  - **mobile** — entrada principal del uso diario: hero compacto y tarjetas apiladas, un toque a la partida. La navegación del header se compacta en una tira `nav-movil` para caber en 320 px.
  - **desktop** — hero a dos columnas con el progreso del día al lado, y las 5 tarjetas en grilla 3+2 (el sexto lugar lo ocupa el resumen «Tu progreso»), para no estirar una columna única a 1200 px.

## Entrada y salida

**Entradas:**
- Desde fuera (hábito diario, enlace compartido)
- Desde cualquier pantalla · marca `> nerdose` o `./juegos`
- Desde `*-resultado` · «Volver a los juegos»

**Salidas user-driven:**
- A `{juego}-instrucciones` · tarjeta «sin jugar» (CTA «Jugar →»)
- A `{juego}-partida` · tarjeta «en curso» (CTA «Seguir jugando»)
- A `{juego}-resultado` · tarjeta «completado» (CTA «Ver resultado»)
- A O-02 · tarjeta «anulado» (CTA «Ver aviso de anulación»)
- A `estadisticas` · «ver estadísticas →»
- A `acerca-de` · «¿Cómo funciona?»

**Salidas automáticas:**
- Recarga del estado del día al llegar a 0 la cuenta regresiva (espera aleatoria 0–3 s, ADR-008): todas las tarjetas vuelven a «sin jugar».

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | ambos | viewport_overrides: desktop; state_overrides: antes del lanzamiento, error de sistema | Marca, #número del desafío del día e idioma |
| 2 | nav-movil | nav-bar | — | navigation | solo mobile | — | Navegación principal compacta en mobile (en desktop va en el header) |
| 3 | banner-cookies | alert | warning | feedback | ambos | visible_only_in_states: sin sesión | Aviso O-03 de sesión no creada, fijo bajo el header |
| 4 | hero-titulo | heading | h1 | content | ambos | — | Identidad del producto |
| 5 | hero-sub | paragraph | body | content | ambos | — | Propuesta de valor |
| 6 | cta-hero | button | primary | input | ambos | state_overrides: empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | CTA principal de la home |
| 7 | link-como-funciona | link | — | navigation | ambos | — | Ir a Acerca de |
| 8 | progreso-dia | progress-bar | — | feedback | ambos | hidden_in_states: loading, error de sistema; state_overrides: en curso, sin desafío hoy, anulado, empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | Progreso del día: juegos completados |
| 9 | racha-global | label | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | Racha global actual |
| 10 | cuenta-regresiva | paragraph | caption | content | ambos | hidden_in_states: loading, error de sistema | Cuenta regresiva a next_reset_at |
| 11 | card-devdle | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Devdle con descripción, racha y estado |
| 12 | cta-devdle | button | secondary | input | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Devdle según estado de la Play |
| 13 | card-bug-hunt | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, en curso, empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Bug Hunt con descripción, racha y estado |
| 14 | cta-bug-hunt | button | primary | input | ambos | hidden_in_states: loading, error de sistema; state_overrides: en curso, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Bug Hunt según estado de la Play |
| 15 | card-big-o | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, anulado, empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Big O con descripción, racha y estado |
| 16 | cta-big-o | button | primary | input | ambos | hidden_in_states: loading, error de sistema, anulado; state_overrides: anulado, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Big O según estado de la Play |
| 17 | card-timeline | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, sin desafío hoy, empty, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Tech Timeline con descripción, racha y estado |
| 18 | cta-timeline | button | primary | input | ambos | hidden_in_states: loading, error de sistema; state_overrides: sin desafío hoy, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Tech Timeline según estado de la Play |
| 19 | card-grep-grid | card | — | content | ambos | hidden_in_states: loading; state_overrides: error de sistema, en curso, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | Tarjeta de Grep Grid con descripción, racha y estado |
| 20 | cta-grep-grid | button | primary | input | ambos | hidden_in_states: loading, error de sistema; state_overrides: en curso, sin sesión, ningún desafío hoy, antes del lanzamiento, sesión no disponible | CTA de Grep Grid según estado de la Play |
| 21 | btn-aviso-anulado | button | secondary | input | ambos | visible_only_in_states: anulado | CTA de la tarjeta anulada: abre O-02 |
| 22 | resumen-progreso | card | — | content | ambos | hidden_in_states: loading, error de sistema; state_overrides: empty, sin sesión, sesión no disponible, ningún desafío hoy, antes del lanzamiento | Resumen: racha global, heatmap corto y enlace a estadísticas |
| 23 | link-stats | link | — | navigation | ambos | hidden_in_states: loading, error de sistema | Ir a estadísticas |
| 24 | loader | loader | — | feedback | ambos | visible_only_in_states: loading | Indicador de carga |
| 25 | alerta-sistema | alert | error | feedback | ambos | visible_only_in_states: error de sistema | Error de carga con causa y salida |
| 26 | btn-reintentar | button | secondary | input | ambos | visible_only_in_states: error de sistema | Reintentar la carga |
| 27 | footer | footer | — | layout | ambos | — | Aviso breve de privacidad y enlace a Acerca de |

## Layout por viewport

### mobile · 400px
- nav-movil
- banner-cookies
- hero-titulo
- hero-sub
- cta-hero
- link-como-funciona
- loader
- alerta-sistema
- btn-reintentar
- progreso-dia
- racha-global
- cuenta-regresiva
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
- resumen-progreso
- link-stats

### desktop · 1200px
- banner-cookies
- row `hero`
  - col 7/12: hero-titulo, hero-sub, cta-hero, link-como-funciona
  - col 5/12: progreso-dia, racha-global, cuenta-regresiva
- row `sistema`
  - col 12/12: loader, alerta-sistema, btn-reintentar
- row `juegos-1`
  - col 4/12: card-devdle, cta-devdle
  - col 4/12: card-bug-hunt, cta-bug-hunt
  - col 4/12: card-big-o, cta-big-o, btn-aviso-anulado
- row `juegos-2`
  - col 4/12: card-timeline, cta-timeline
  - col 4/12: card-grep-grid, cta-grep-grid
  - col 4/12: resumen-progreso, link-stats

## Contenido

### header
- Texto/label: > nerdose · #8 · ES|EN
- Icono: nada
- Override desktop: content="> nerdose     ./juegos   ./stats   ./about     #8     ES | EN"
- Annotation: #número = número de desafío del día, igual para los 5 juegos; se oculta cuando el servidor no lo informa (antes del lanzamiento o error de carga), nunca se muestra un número menor que 1. ES|EN es un control inline: cambia la interfaz sin recargar y persiste en el Player; sin sesión cambia solo en este navegador (REQ-002)

### nav-movil
- Texto/label: —
- Etiquetas: ./juegos · ./stats · ./about
- Icono: nada
- Annotation: nada

### banner-cookies
- Texto/label: Activá las cookies para poder jugar
- Icono: nada
- Annotation: Es el overlay O-03; persiste hasta que la sesión se crea. Solo aparece si la creación de la sesión respondió bien y el estado del día sigue sin sesión; si la creación fue rechazada por límite (429) no se muestra (estado «sesión no disponible», REQ-002)

### hero-titulo
- Texto/label: Cinco juegos tech. Un desafío por día.
- Icono: nada
- Annotation: nada

### hero-sub
- Texto/label: Sin registro, de 1 a 3 minutos por partida. El mismo desafío para todos, cada día.
- Icono: nada
- Annotation: nada

### cta-hero
- Texto/label: Seguir jugando
- Icono: arrow-right
- Annotation: baja a las tarjetas de juego

### link-como-funciona
- Texto/label: ¿Cómo funciona?
- Icono: arrow-right
- Annotation: nada

### progreso-dia
- Texto/label: 1 de 5 completados hoy
- Icono: nada
- Annotation: nada

### racha-global
- Texto/label: Racha global: 4 días
- Icono: nada
- Annotation: nada

### cuenta-regresiva
- Texto/label: Próximo desafío en 05:42:10 (HH:MM:SS, 00:00 UTC)
- Icono: nada
- Annotation: al llegar a 0 recarga el estado del día tras una espera aleatoria de 0–3 s. El reloj solo descuenta los segundos que informa el servidor y se re-sincroniza en cada respuesta; si la recarga falla, la home pasa a «error de sistema» con «Reintentar». No se anuncia cada segundo a lectores de pantalla

### card-devdle
- Texto/label: Devdle
- Texto secundario: Adiviná el término tech en 6 intentos · ~2 min · racha 3 · ✓ 4/6
- Icono: nada
- Annotation: nada

### cta-devdle
- Texto/label: Ver resultado
- Icono: nada
- Annotation: según el estado: sin jugar → instrucciones, en curso → partida, completado → resultado

### card-bug-hunt
- Texto/label: Bug Hunt
- Texto secundario: Encontrá la línea con el bug · ~2 min · racha 2 · sin jugar
- Icono: nada
- Annotation: nada

### cta-bug-hunt
- Texto/label: Jugar →
- Icono: nada
- Annotation: según el estado: sin jugar → instrucciones, en curso → partida, completado → resultado

### card-big-o
- Texto/label: Big O
- Texto secundario: Elegí la complejidad temporal · ~1 min · racha 5 · sin jugar
- Icono: nada
- Annotation: nada

### cta-big-o
- Texto/label: Jugar →
- Icono: nada
- Annotation: según el estado: sin jugar → instrucciones, en curso → partida, completado → resultado

### card-timeline
- Texto/label: Tech Timeline
- Texto secundario: Ordená 5 hitos de la tecnología · ~1 min · racha 1 · sin jugar
- Icono: nada
- Annotation: nada

### cta-timeline
- Texto/label: Jugar →
- Icono: nada
- Annotation: según el estado: sin jugar → instrucciones, en curso → partida, completado → resultado

### card-grep-grid
- Texto/label: Grep Grid
- Texto secundario: Encontrá 8 palabras en la grilla · sin tiempo · ~3 min · racha 0 · sin jugar
- Icono: nada
- Annotation: nada

### cta-grep-grid
- Texto/label: Jugar →
- Icono: nada
- Annotation: según el estado: sin jugar → instrucciones, en curso → partida, completado → resultado

### btn-aviso-anulado
- Texto/label: Ver aviso de anulación
- Icono: info
- Annotation: nada

### resumen-progreso
- Texto/label: Tu progreso
- Texto secundario: Racha global 4 · Récord 9 · 31 desafíos completados · heatmap de los últimos 90 días
- Icono: nada
- Annotation: nada

### link-stats
- Texto/label: ver estadísticas →
- Icono: arrow-right
- Annotation: nada

### loader
- Texto/label: Cargando los desafíos de hoy…
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos cargar los juegos de hoy. Revisá tu conexión e intentá de nuevo.
- Icono: nada
- Annotation: nada

### btn-reintentar
- Texto/label: Reintentar
- Icono: refresh
- Annotation: nada

### footer
- Texto/label: nerdose.dev · Sin cuenta: una única cookie funcional guarda tu progreso, sin datos personales ni cookies de terceros. · Acerca de
- Icono: nada
- Annotation: «Acerca de» es un enlace a `acerca-de`; el footer es del shell y es igual en todas las pantallas (REQ-002, C-07)

## Estados

### default
- Aplica: Sí
- Mensaje: Hoy hay 5 desafíos; Devdle ya está completado (✓ 4/6) y los otros 4 esperan.
- Cambios: ninguno respecto de default.

### en curso
- Aplica: Sí (sub-estado de default)
- Mensaje: Bug Hunt y Grep Grid tienen una partida empezada: etiqueta «en curso» y CTA «Seguir jugando».
- Cambios:
  - progreso-dia: content="1 de 5 completados hoy", fill=0.2 (state_override)
  - card-bug-hunt: paragraph="Encontrá la línea con el bug · ~2 min · racha 2 · en curso" (state_override)
  - cta-bug-hunt: content="Seguir jugando", variant="primary" (state_override)
  - card-grep-grid: paragraph="Encontrá 8 palabras en la grilla · sin tiempo · ~3 min · racha 0 · en curso" (state_override)
  - cta-grep-grid: content="Seguir jugando", variant="primary" (state_override)

### sin desafío hoy
- Aplica: Sí (sub-estado de default)
- Mensaje: Tech Timeline no tiene desafío publicado: «sin desafío hoy · no afecta tu racha», sin CTA de juego.
- Cambios:
  - progreso-dia: content="1 de 4 con desafío completados", fill=0.25 (state_override)
  - card-timeline: paragraph="Ordená 5 hitos de la tecnología · ~1 min · racha 1 · sin desafío hoy · no afecta tu racha" (state_override)
  - cta-timeline: content="Sin desafío hoy", variant="disabled" (state_override)

### anulado
- Aplica: Sí (sub-estado de default)
- Mensaje: El desafío de Big O fue anulado: etiqueta «anulado» y CTA «Ver aviso de anulación» que abre O-02.
- Cambios:
  - progreso-dia: content="1 de 5 completados hoy", fill=0.2 (state_override)
  - card-big-o: paragraph="Elegí la complejidad temporal · ~1 min · racha 5 · anulado" (state_override)
  - cta-big-o: oculto en este estado (hidden_in_states)
  - cta-big-o: content="—" (state_override)
  - btn-aviso-anulado: solo visible en este estado (visible_only_in_states)

### empty
- Aplica: Sí (sub-estado de default)
- Mensaje: Primera visita: todos «sin jugar», racha global 0 y resumen sin datos. Todavía no hay nada para mostrar: «Todavía no hay datos. Completá un desafío y acá vas a ver tu racha y tu heatmap.»
- Cambios:
  - cta-hero: content="Empezar a jugar" (state_override)
  - progreso-dia: content="0 de 5 completados hoy", fill=0.0 (state_override)
  - racha-global: content="Racha global: 0 días" (state_override)
  - card-devdle: paragraph="Adiviná el término tech en 6 intentos · ~2 min · racha 0 · sin jugar" (state_override)
  - cta-devdle: content="Jugar →", variant="primary" (state_override)
  - card-bug-hunt: paragraph="Encontrá la línea con el bug · ~2 min · racha 0 · sin jugar" (state_override)
  - card-big-o: paragraph="Elegí la complejidad temporal · ~1 min · racha 0 · sin jugar" (state_override)
  - card-timeline: paragraph="Ordená 5 hitos de la tecnología · ~1 min · racha 0 · sin jugar" (state_override)
  - resumen-progreso: paragraph="Todavía no hay datos. Completá un desafío y acá vas a ver tu racha y tu heatmap." (state_override)

### sin sesión
- Aplica: Sí (sub-estado de default)
- Mensaje: Cookies bloqueadas: se ven los 5 juegos pero los CTA están deshabilitados y aparece el banner O-03 «Activá las cookies para poder jugar».
- Cambios:
  - banner-cookies: solo visible en este estado (visible_only_in_states)
  - cta-hero: content="Empezar a jugar", variant="disabled" (state_override)
  - progreso-dia: content="Sin sesión: no podemos mostrar tu progreso", fill=0.0 (state_override)
  - racha-global: content="Racha global: —" (state_override)
  - card-devdle: paragraph="Adiviná el término tech en 6 intentos · ~2 min · racha 0 · sin sesión" (state_override)
  - cta-devdle: content="Jugar →", variant="disabled" (state_override)
  - card-bug-hunt: paragraph="Encontrá la línea con el bug · ~2 min · racha 0 · sin sesión" (state_override)
  - cta-bug-hunt: content="Jugar →", variant="disabled" (state_override)
  - card-big-o: paragraph="Elegí la complejidad temporal · ~1 min · racha 0 · sin sesión" (state_override)
  - cta-big-o: content="Jugar →", variant="disabled" (state_override)
  - card-timeline: paragraph="Ordená 5 hitos de la tecnología · ~1 min · racha 0 · sin sesión" (state_override)
  - cta-timeline: content="Jugar →", variant="disabled" (state_override)
  - card-grep-grid: paragraph="Encontrá 8 palabras en la grilla · sin tiempo · ~3 min · racha 0 · sin sesión" (state_override)
  - cta-grep-grid: content="Jugar →", variant="disabled" (state_override)
  - resumen-progreso: paragraph="Sin sesión no hay progreso para mostrar. Activá las cookies y recargá." (state_override)

### ningún desafío hoy
- Aplica: Sí (sub-estado de default)
- Mensaje: Hoy no hay desafíos publicados en ningún juego: los 5 figuran «sin desafío hoy · no afecta tu racha», sin «Jugar». Es el estado de la plataforma hasta que existan los generadores (REQ-002, CA 9).
- Cambios:
  - cta-hero: content="Ver los juegos" (state_override)
  - progreso-dia: content="Hoy no hay desafíos publicados", fill=0.0 (state_override)
  - racha-global: content="Racha global: 0 días" (state_override)
  - card-devdle: paragraph="Adiviná el término tech en 6 intentos · ~2 min · racha 0 · sin desafío hoy · no afecta tu racha" (state_override)
  - cta-devdle: content="Sin desafío hoy", variant="disabled" (state_override)
  - card-bug-hunt: paragraph="Encontrá la línea con el bug · ~2 min · racha 0 · sin desafío hoy · no afecta tu racha" (state_override)
  - cta-bug-hunt: content="Sin desafío hoy", variant="disabled" (state_override)
  - card-big-o: paragraph="Elegí la complejidad temporal · ~1 min · racha 0 · sin desafío hoy · no afecta tu racha" (state_override)
  - cta-big-o: content="Sin desafío hoy", variant="disabled" (state_override)
  - card-timeline: paragraph="Ordená 5 hitos de la tecnología · ~1 min · racha 0 · sin desafío hoy · no afecta tu racha" (state_override)
  - cta-timeline: content="Sin desafío hoy", variant="disabled" (state_override)
  - card-grep-grid: paragraph="Encontrá 8 palabras en la grilla · sin tiempo · ~3 min · racha 0 · sin desafío hoy · no afecta tu racha" (state_override)
  - cta-grep-grid: content="Sin desafío hoy", variant="disabled" (state_override)
  - resumen-progreso: paragraph="Todavía no hay datos. Cuando haya desafíos, acá vas a ver tu racha y tu heatmap." (state_override)

### antes del lanzamiento
- Aplica: Sí (sub-estado de default)
- Mensaje: Todavía no empezó el desafío #1: el header no muestra número y el catálogo funciona igual, con los 5 juegos sin desafío (REQ-002, CA 17).
- Cambios:
  - header: content="> nerdose · ES|EN" (state_override); override desktop content="> nerdose     ./juegos   ./stats   ./about     ES | EN"
  - cta-hero: content="Ver los juegos" (state_override)
  - progreso-dia: content="El primer desafío llega pronto", fill=0.0 (state_override)
  - racha-global: content="Racha global: 0 días" (state_override)
  - card-devdle: paragraph="Adiviná el término tech en 6 intentos · ~2 min · próximamente" (state_override)
  - cta-devdle: content="Próximamente", variant="disabled" (state_override)
  - card-bug-hunt: paragraph="Encontrá la línea con el bug · ~2 min · próximamente" (state_override)
  - cta-bug-hunt: content="Próximamente", variant="disabled" (state_override)
  - card-big-o: paragraph="Elegí la complejidad temporal · ~1 min · próximamente" (state_override)
  - cta-big-o: content="Próximamente", variant="disabled" (state_override)
  - card-timeline: paragraph="Ordená 5 hitos de la tecnología · ~1 min · próximamente" (state_override)
  - cta-timeline: content="Próximamente", variant="disabled" (state_override)
  - card-grep-grid: paragraph="Encontrá 8 palabras en la grilla · sin tiempo · ~3 min · próximamente" (state_override)
  - cta-grep-grid: content="Próximamente", variant="disabled" (state_override)
  - resumen-progreso: paragraph="Todavía no hay datos. Cuando empiecen los desafíos, acá vas a ver tu racha y tu heatmap." (state_override)

### sesión no disponible
- Aplica: Sí (sub-estado de default)
- Mensaje: No se pudo crear la sesión por exceso de pedidos (429): el catálogo se ve igual, los CTA quedan deshabilitados y se reintenta en la próxima carga. No aparece el banner de cookies, porque no es un problema del navegador (REQ-002, CA 13).
- Cambios:
  - cta-hero: content="Empezar a jugar", variant="disabled" (state_override)
  - progreso-dia: content="No pudimos iniciar tu sesión. Recargá en unos minutos para jugar.", fill=0.0 (state_override)
  - racha-global: content="Racha global: —" (state_override)
  - card-devdle: paragraph="Adiviná el término tech en 6 intentos · ~2 min" (state_override)
  - cta-devdle: content="Jugar →", variant="disabled" (state_override)
  - card-bug-hunt: paragraph="Encontrá la línea con el bug · ~2 min" (state_override)
  - cta-bug-hunt: content="Jugar →", variant="disabled" (state_override)
  - card-big-o: paragraph="Elegí la complejidad temporal · ~1 min" (state_override)
  - cta-big-o: content="Jugar →", variant="disabled" (state_override)
  - card-timeline: paragraph="Ordená 5 hitos de la tecnología · ~1 min" (state_override)
  - cta-timeline: content="Jugar →", variant="disabled" (state_override)
  - card-grep-grid: paragraph="Encontrá 8 palabras en la grilla · sin tiempo · ~3 min" (state_override)
  - cta-grep-grid: content="Jugar →", variant="disabled" (state_override)
  - resumen-progreso: paragraph="Sin sesión no hay progreso para mostrar. Recargá en unos minutos." (state_override)

### loading
- Aplica: Sí
- Mensaje: Cargando los desafíos de hoy…
- Cambios:
  - progreso-dia: oculto en este estado (hidden_in_states)
  - racha-global: oculto en este estado (hidden_in_states)
  - cuenta-regresiva: oculto en este estado (hidden_in_states)
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
  - resumen-progreso: oculto en este estado (hidden_in_states)
  - link-stats: oculto en este estado (hidden_in_states)
  - loader: solo visible en este estado (visible_only_in_states)

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos cargar los juegos de hoy. Revisá tu conexión e intentá de nuevo.
- Cambios:
  - header: content="> nerdose · ES|EN" (state_override; sin #número porque no se pudo leer el día)
  - progreso-dia: oculto en este estado (hidden_in_states)
  - racha-global: oculto en este estado (hidden_in_states)
  - cuenta-regresiva: oculto en este estado (hidden_in_states)
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
  - resumen-progreso: oculto en este estado (hidden_in_states)
  - link-stats: oculto en este estado (hidden_in_states)
  - alerta-sistema: solo visible en este estado (visible_only_in_states)
  - btn-reintentar: solo visible en este estado (visible_only_in_states)

## Interacciones

**Eventos:**
- cta-{juego} · on click → abre la fase que decide el estado de la Play
- cta-hero · on click → baja a las tarjetas
- btn-aviso-anulado · on click → abre O-02
- cuenta-regresiva · llega a 0 → recarga el estado del día
- header · ES|EN · on click → cambia el idioma de la interfaz sin recargar; con sesión lo guarda en el Player, sin sesión solo en este navegador
- btn-reintentar · on click → vuelve a pedir el estado del día
- footer · «Acerca de» · on click → navega a `acerca-de`

**Validaciones:**
- No aplica: la pantalla no tiene campos de entrada.

**Feedback:**
- La tarjeta cambia de estado al volver de una partida (sin recargar manualmente).

## Accesibilidad

- **Orden de foco:** header → cta-hero → tarjetas de juego en orden de lectura (card + CTA) → resumen «Tu progreso».
- **Landmarks y jerarquía:** `h1` único: «Cinco juegos tech. Un desafío por día.»; el nombre de cada juego es `h2`. Landmarks: header, nav, main, footer.
- **Foco y teclado:** El banner O-03 no atrapa el foco; los CTA deshabilitados siguen siendo alcanzables con `aria-disabled`.
- **Propio de esta composición:** El estado de cada tarjeta (en curso, completado, anulado) se comunica con texto, no solo con color (NFR-U04); la cuenta regresiva no se anuncia cada segundo.

## Decisiones y descartes

**Decisiones tomadas:**
- Una tarjeta por juego con un único CTA cuyo destino lo decide el estado de la Play (C-05): el jugador nunca elige entre instrucciones, partida y resultado.
- El `#número` del desafío vive en el header (decisión #12), no en un texto «desafío del 30/10» como en el prototipo.
- «Anulado» tiene su propio botón (`btn-aviso-anulado`) en lugar de un CTA de juego, porque el destino es un overlay (O-02).
- El estado de sin sesión se modela como estado de la home, no como pantalla: el catálogo sigue visible (C-02).
- Los estados `en curso`, `sin desafío hoy`, `anulado`, `empty` (primera visita) y `sin sesión` son sub-estados de `default` fuera de los 8 fijos, porque el PRD los define por tarjeta (C-05, C-14, C-42).
- REQ-002: se agrega `ningún desafío hoy` (los 5 juegos sin desafío a la vez, CA 9), que es como se ve la home hasta que existan generadores; se distingue de `sin desafío hoy` (un solo juego) porque el progreso del día no tiene juegos que contar.
- REQ-002: se agrega `antes del lanzamiento` (CA 17, decisión de diseño 3): el servidor devuelve `number: null` y la home oculta el `#número` en lugar de mostrar un valor ≤ 0. Las tarjetas dicen «próximamente».
- REQ-002: se agrega `sesión no disponible` (429 al crear la sesión, CA 13) separado de `sin sesión`: el banner O-03 solo aparece cuando la creación respondió bien y la cookie no vuelve, para no culpar al navegador de un límite del servidor (riesgo de falso positivo del diseño técnico).
- REQ-002: en `error de sistema` las 5 tarjetas siguen visibles con nombre y descripción, porque el catálogo es estático en el front (decisión de diseño 6); se ocultan los CTA y el estado del día. La home nunca queda en blanco (CA 18).
- REQ-002: el footer suma el enlace a «Acerca de» y aclara que no hay datos personales ni cookies de terceros (RF 14, RF 15, CA 19). Ningún cambio de layout: los cambios de este request son de estados y microcopy, iguales en ambos viewports.

**Alternativas descartadas:**
- La tarjeta «próximo juego / próximamente» del prototipo: no está en el PRD.
- Un menú hamburguesa con overlay en mobile: el PRD no lo exige; se resuelve con una tira de navegación.

**Preguntas abiertas:**
- Pregunta 5 del product-map: si el resultado enlaza a «Siguiente juego» o «Volver a los juegos».
- No hay copy definido para el error de carga: `No pudimos cargar los juegos de hoy…` es propuesta.
- Antes del lanzamiento: «próximamente» en las tarjetas es propuesta; el REQ admite omitir el número o mostrarlo como «próximamente».

## Trazabilidad

- F-02, C-05, C-06, C-14, C-41, C-42, C-02, C-01 · flujos 1, 2 y 3 de `user-flows.md`.
- REQ-002: RF 5, 10, 11, 12, 14, 16 · CA 9, 10, 13, 17, 18, 19.
