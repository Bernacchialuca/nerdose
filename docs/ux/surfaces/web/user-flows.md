---
document: UX User Flows
surface: web
version: "1.6"
date: 2026-11-14
status: Draft - Punto de partida para discusión
flows_count: 5
---

# User Flows — web

> Flujos críticos internos de la superficie. **No son todos los flujos** —
> son los 3-5 que definen el valor del producto en esta superficie. Otros
> flujos derivan de estos o son operaciones secundarias. Si un flujo cruza
> a otra superficie, vive en `cross-surface-flows.md`, no acá.

Todo lo que sigue es hipótesis a validar. Los slugs de pantalla y overlays (O-01 a O-04) son los de `product-map.md`. Trazabilidad: `[fuente: PRD §requirements]` salvo indicación. Los pasos que dependen de una pregunta abierta del product-map se marcan como tales.

## Flujos Documentados

| # | Flujo | JTBD que resuelve | Audiencia |
|---|-------|-------------------|-----------|
| 1 | Jugar el desafío del día de un juego (incluye retomar) | "Cuando tengo unos minutos libres en el día, quiero resolver un desafío corto de tecnología igual al de todos, para sostener un hábito diario sin dedicarle más de 1 a 3 minutos por juego." | jugador |
| 2 | Cambio de día con la partida abierta (`challenge_expired`) | JTBD 1 (sostener el hábito diario sin perder el hilo cuando el día cambia) | jugador |
| 3 | Desafío anulado: marcar como completado | "Cuando completo un desafío... " (JTBD 1) con el beneficio de gain "mantiene su racha aunque el desafío haya sido anulado" | jugador |
| 4 | Reportar un problema del desafío | JTBD 2 (ver la solución con una explicación): cuando la solución o el enunciado parecen incorrectos, quiero avisarlo sin revelar la respuesta | jugador |
| 5 | Ver el resultado, compartirlo y revisar estadísticas | JTBD 3 y JTBD 2 | jugador |

---

## Flujo 1: Jugar el desafío del día de un juego (incluye retomar)

**JTBD que resuelve:** "Cuando tengo unos minutos libres en el día, quiero resolver un desafío corto de tecnología igual al de todos, para sostener un hábito diario sin dedicarle más de 1 a 3 minutos por juego." `[fuente: PRD §goals-and-context G-01, U-01]`
**Audiencia:** jugador ([research-context](../../audiences/jugador/research-context.md))
**Trigger:** El jugador abre `nerdose.dev` (por hábito diario) y elige una tarjeta de juego en `home`.

### Happy path

1. `home`: el jugador ve el estado del día (5 tarjetas, racha global, cuenta regresiva `HH:MM:SS`). Toca una tarjeta en estado "Sin jugar" ("Jugar →"). `[fuente: C-05, C-06]`
2. `{juego}-instrucciones`: lee las reglas (3 pasos) y toca "Empezar". El sistema crea la Play `in_progress` (C-09) y abre `{juego}-partida`. Ver pregunta abierta 1 del product-map (si las instrucciones se muestran todos los días).
3. `{juego}-partida`: juega según el juego:
   - Devdle: hasta 6 intentos con teclado en pantalla o físico; cada intento válido devuelve feedback por letra (C-15).
   - Bug Hunt / Big O / Tech Timeline: un solo intento; selecciona (línea, complejidad u orden) y luego "Confirmar" en un segundo paso (C-30, C-27, C-23, decisión #26).
   - Tech Timeline: ve la consigna fija y 5 hitos mezclados, con su nombre y su categoría (el desafío mezcla categorías). Los reordena arrastrando desde el asa de cada fila, con los botones ↑ ↓ o con el teclado (Espacio para tomar, flechas, Espacio para soltar, Escape para cancelar); cada movimiento se anuncia ("Go, posición 3 de 5") y no consulta al servidor. "Confirmar orden" envía el orden una sola vez: el servidor cierra la Play como `won` (5/5) o `lost` (0 a 4) y abre `timeline-resultado` con el orden correcto, la fecha y la nota de cada hito y el acierto por posición (C-23, C-25; REQ-006 CA 3-5, 9, 10).
   - Big O: lee una función `f(n)` que cuenta sus operaciones, en su lenguaje preferido (JavaScript por defecto); puede pasarla a Go o Java en cualquier momento sin requests y sin perder la opción elegida. Elige una de las 8 complejidades (grupo de selección única, operable con flechas) y toca "Confirmar respuesta": el servidor cierra la Play como `won` o `lost`, guarda el lenguaje de la pestaña visible como `code_language` de la Play y como su `preferred_code_language`, y abre `big-o-resultado` con la correcta junto a la elegida, el código con notas por línea, el paso a paso, "en números" y el consejo si la receta tenía trampa (C-26, C-27, C-29; REQ-009 CA 2-5).
   - Grep Grid: sin tiempo ni límite de selecciones; toca la primera y la última letra de cada palabra (dos toques, o flechas + Enter/Espacio). Cada palabra encontrada se tacha en la lista, se marca en la grilla, muestra su definición breve y el contador `N/8 encontradas` avanza; la octava cierra la partida como ganada (C-19; REQ-005 CA 3, 5, 9).
4. Al cumplirse el fin de partida del juego, el sistema cierra la Play como `won` o `lost`, actualiza rachas y estadísticas en la misma transacción (C-12, C-33) y abre `{juego}-resultado` con la solución, la explicación y las rachas actualizadas.
5. En `{juego}-resultado`, el jugador toca "Siguiente juego" o "Volver a los juegos" (pregunta abierta 5 del product-map) y vuelve a `home`, donde la tarjeta aparece como "Completado" con su `history_label`.

### Caminos alternativos

- **Retomar la partida** — El jugador sale (cierra la pestaña, vuelve a `home`) con la Play `in_progress` y regresa el mismo día. `home` muestra la tarjeta "En curso" con "Seguir jugando"; al tocarla, abre `{juego}-partida` en el estado exacto (intentos, selección, palabras encontradas). En Grep Grid vuelve con las palabras encontradas marcadas, tachadas y con su definición, y el contador en el valor real. En Tech Timeline el orden armado no se guarda: vuelve a los 5 hitos en el orden inicial mezclado (las instrucciones lo avisan). En Big O la opción elegida tampoco se guarda: vuelve al código en su lenguaje preferido y las 8 opciones sin selección, con el intento intacto (las instrucciones lo avisan). `[fuente: C-10, C-05; REQ-005 CA 14; REQ-006 CA 12; REQ-009 CA 8]`
- **Reabrir un juego ya completado** — Entrar a `/:game_id` con la Play terminada muestra `{juego}-resultado`, no una partida nueva. `[fuente: product-map, criterio de inventario]`
- **Primera visita** — Todos los juegos aparecen "Sin jugar", racha global 0; la sesión anónima se crea sola, sin registro, y la interfaz se muestra en el idioma del navegador (`es`/`en`; cualquier otro → `es`). `[fuente: C-01, F-01; REQ-002 CA 1, 2]`
- **Ningún desafío publicado hoy** — Hasta que existan los generadores, `home` muestra los 5 juegos "sin desafío hoy · no afecta tu racha", sin "Jugar"; el flujo termina en `home`. `[fuente: REQ-002 CA 9]`
- **Antes del lanzamiento** — El header no muestra el día del desafío («desafío del dd/mm») y las tarjetas dicen "próximamente"; el catálogo funciona igual. `[fuente: REQ-002 CA 17]`
- **Sin desafío hoy** — La tarjeta muestra "sin desafío hoy" y `{juego}-instrucciones` muestra el mensaje con "Volver a los juegos". El día es neutro para la racha de ese juego. `[fuente: C-14]`
- **Cambio de idioma o de lenguaje de código a mitad de partida** — Control inline ES/EN (C-03) o JS/Go/Java (C-26); la partida no cambia, solo la vista (en Grep Grid cambian las definiciones de las palabras encontradas; la grilla y las palabras son iguales en ES y EN, REQ-005 CA 19; en Tech Timeline cambian la consigna, las etiquetas de categoría, las notas y el formato de las fechas, y el orden armado se mantiene porque los nombres de los hitos no se traducen, REQ-006 CA 36; en Big O cambiar de lenguaje de código mantiene la opción elegida y no guarda la preferencia: solo la confirmación la guarda, REQ-009 CA 3). El cambio de idioma se aplica sin recargar y queda guardado en el Player (al volver, la interfaz sigue en ese idioma); sin sesión solo cambia en el navegador. `[fuente: REQ-002 CA 6]`
- **Dirección inexistente** — Un enlace roto o un `game_id` desconocido muestra `no-encontrado`; "Volver a los juegos" lleva a `home`. `[fuente: REQ-002, supuesto «Navegación»]`
- **Rendirse en Grep Grid** — "Rendirse" abre O-04 (foco inicial en "Seguir jugando"). "Sí, rendirme" cierra la Play como `lost` con `N/8`, cuenta para la racha y lleva a `grep-grid-resultado` con las faltantes reveladas y su definición; se puede rendir desde 0/8. "Seguir jugando" o Escape cierran O-04 sin cambios y devuelven el foco a "Rendirse". `[fuente: C-20; REQ-005 CA 10, 11, 12]`

### Errores y recuperación

- **Cookies bloqueadas** — `POST /api/session` responde bien pero el estado del día pedido después sigue sin sesión: aparece O-03 ("Activá las cookies para poder jugar"); los CTA de juego quedan deshabilitados y el catálogo, `estadisticas` y `acerca-de` siguen visibles. Recuperación: el jugador habilita cookies y recarga; la sesión se crea y los CTA se habilitan. `[fuente: C-02]`
- **Límite de creación de sesiones (429)** — `home` pasa a "sesión no disponible": catálogo visible, CTA deshabilitados y **sin** O-03 (no es un problema del navegador). Recuperación: se reintenta solo en la próxima carga. `[fuente: REQ-002 CA 13]`
- **No se puede cargar el estado del día (500, 429 o red)** — `home` muestra "No pudimos cargar los juegos de hoy. Revisá tu conexión e intentá de nuevo." con "Reintentar"; las 5 tarjetas siguen visibles con nombre y descripción, sin estado ni CTA. Nunca queda en blanco. `[fuente: REQ-002 CA 18]`
- **Palabra fuera de la lista en Devdle** — Hint "No está en la lista. Probá con otro término." bajo el tablero, sin consumir intento ni cambiar el tablero (`not_in_word_list`); el jugador corrige y reintenta. Palabra de otra longitud: el front no la envía y avisa "Faltan letras: el término tiene N." Caracteres que no son A–Z se ignoran con el aviso "Solo letras de la A a la Z." `[fuente: C-15; REQ-004 CA 6, 7]`
- **Sin sesión al empezar o al jugar (`no_session`)** — No se crea la Play ni se procesa la jugada; aparece O-03 explicando que hace falta una única cookie funcional, con "Reintentar" (recrea la sesión y repite la acción). `[fuente: REQ-004 CA 19]`
- **Desafío anulado a mitad de partida (`challenge_voided`)** — La jugada se rechaza, se muestra el aviso de anulación y el teclado desaparece; la racha no se ve afectada. `[fuente: REQ-004 CA 18]`
- **Selección inválida** — En Bug Hunt, línea no elegible (firma, solo llaves) o `invalid_move` del servidor: la selección no se acepta y el jugador elige otra; no se pierde el intento. En Grep Grid, el hint de consola bajo la grilla avisa sin penalizar ni cambiar la partida: "no es una palabra de la lista, probá de nuevo" (línea válida que no es una de las 8, incluido un tramo parcial) o "las palabras se marcan de la primera a la última letra, hacia adelante" (`invalid_move`: en reversa, no alineada o de una sola celda); volver a seleccionar una palabra ya encontrada se ignora sin aviso. En Tech Timeline, una confirmación que no es una permutación exacta de los 5 hitos (`invalid_move`, no debería pasar desde la interfaz) muestra "no pudimos registrar ese orden" en el hint; la partida sigue en curso, el orden armado se conserva y se puede confirmar otra vez. En Big O, una opción o un lenguaje fuera de los valores válidos (`invalid_move`, no debería pasar desde la interfaz) muestra "no pudimos registrar tu respuesta" en la línea de aviso; la Play sigue en curso, no se guarda ninguna preferencia y se puede confirmar otra vez. `[fuente: C-30, C-19, C-23, C-27; REQ-005 CA 4, 6, 7, 8; REQ-006 CA 6, 7; REQ-009 CA 7]`
- **Toque accidental al confirmar** — La selección y la confirmación van en dos pasos, de modo que el jugador puede cambiar la selección antes de confirmar. En Tech Timeline, "Confirmar orden" queda separado de la lista y el arrastre solo arranca desde el asa, así que mover un hito o hacer scroll nunca confirma; no hay un segundo diálogo. `[fuente: decisión #26, NFR-U01; REQ-006 CA 11]`
- **Jugada sobre una Play ya terminada (`game_finished`)** — Por ejemplo, desde una segunda pestaña: el front carga `{juego}-resultado` con el resultado ya registrado. `[fuente: C-11]`
- **Pérdida de conexión durante la partida** — El PRD supone conexión permanente y no hay modo offline; el copy y la pantalla de error no están definidos (product-map, Estados Globales). Recuperación a validar: al volver la conexión, el jugador recarga y retoma desde el estado del servidor (C-10), que es la fuente de verdad (validación 100% en el servidor). `[fuente: PRD §Supuestos, C-10]`
- **Límite de jugadas (60/min por jugador, 300/min por IP)** — HTTP 429: hint genérico "Vas muy rápido. Esperá unos segundos y probá de nuevo."; la jugada no se procesa ni consume intento. `[fuente: C-11; REQ-004 CA 20, NFR-S08]`

### Estado final

`{juego}-resultado` muestra el veredicto, la solución con su explicación, la stat propia del juego y las rachas actualizadas. En `home`, la tarjeta pasa a "Completado" (perder también es completado) y la racha global y la del juego reflejan el día.

### Criterios de éxito

- El jugador puede pasar de `home` a la primera jugada en no más de 2 toques (tarjeta + "Empezar"). `[hipótesis | inferida-PRD, NFR-U06]`
- Una partida mediana dura de 1 a 3 minutos, en teléfono desde 320 px. `[fuente: NFR-U06; no medido]`
- El jugador que sale y vuelve el mismo día retoma sin perder jugadas.
- El jugador entiende, sin ayuda, cuáles juegos le faltan hoy.

---

## Flujo 2: Cambio de día con la partida abierta (`challenge_expired`)

**JTBD que resuelve:** JTBD 1 — sostener el hábito diario: el desafío cambia a las 00:00 UTC, y el jugador que está jugando a esa hora debe entender qué pasó con su partida. `[fuente: PRD §goals-and-context G-01; requirements C-06, C-11]`
**Audiencia:** jugador ([research-context](../../audiences/jugador/research-context.md))
**Trigger:** Pasan las 00:00 UTC con `home` o `{juego}-partida` abiertas, o el jugador vuelve a una pestaña abierta del día anterior.

### Happy path

1. El jugador está en `{juego}-partida` (Play `in_progress` del desafío `#N`) y la medianoche UTC pasa.
2. Hace una jugada. El cliente envía `challenge_number = N`; el servidor responde `challenge_expired`: la jugada se rechaza. `[fuente: C-11]`
3. El front carga el desafío nuevo (`#N+1`) y vuelve a `{juego}-instrucciones` con la fecha nueva en el header («desafío del dd/mm») y el aviso "Empezó el desafío #N+1. La partida de ayer quedó sin terminar y no cuenta para tu racha." `[fuente: product-map, estado `challenge_expired`; REQ-004 supuesto «Jugada tardía», CA 17]`
4. El jugador lee las instrucciones y toca "Empezar": se crea la Play del nuevo desafío (C-09) y sigue con el flujo 1 desde el paso 3.
5. La Play vieja queda `in_progress` para siempre, sin contar para rachas ni estadísticas.

### Caminos alternativos

- **Jugador en `home` a medianoche** — La cuenta regresiva llega a 0, `home` recarga el estado del día tras una espera aleatoria de 0–3 s (ADR-008) y todas las tarjetas vuelven a "Sin jugar" con el nuevo `#número`. `[fuente: C-06]`
- **Partida terminada antes de medianoche** — No pasa nada: el resultado ya está cerrado y cuenta para el día `#N`.
- **El nuevo día no tiene desafío publicado en ese juego** — Tras `challenge_expired`, la fase de instrucciones muestra "sin desafío hoy" (día neutro). `[fuente: C-14, C-48]`
- **Jugador que vuelve a una pestaña vieja** — Misma respuesta `challenge_expired` en la primera acción, con el mismo recorrido.

### Errores y recuperación

- **Pérdida de la partida en curso al cambiar el día** — La jugada rechazada y la Play vieja no cuentan: el jugador pierde ese progreso y ese día no suma racha. Es una consecuencia de la regla del PRD, no un error del sistema. **Resuelto por REQ-004:** las instrucciones muestran el aviso informativo "día nuevo" (no un error) que explica que la partida anterior no cuenta. `[fuente: C-11; REQ-004 supuesto «Jugada tardía»]`
- **Cambio de día en el último intento de Devdle, Bug Hunt, Big O o Tech Timeline** — Mismo caso: el intento no se registra. Hipótesis a validar: es el momento más costoso para el jugador y el de mayor riesgo de abandono. `[hipótesis | por-analogía]`
- **Reintentos de recarga al llegar a 0 (`home`)** — La espera aleatoria de 0–3 s evita una avalancha de requests al servidor; si la recarga falla, `home` pasa al estado "error de carga" con "Reintentar" (REQ-002). `[fuente: ADR-008, PRD §Supuestos; REQ-002 CA 18]`
- **Reloj del dispositivo desfasado (`home`)** — La cuenta regresiva solo descuenta los segundos que informa el servidor y se re-sincroniza en cada respuesta; el número del día nunca lo calcula el cliente. `[fuente: REQ-002, Riesgos]`

### Estado final

El jugador ve las instrucciones (o la tarjeta "Sin jugar") del desafío nuevo con la fecha actualizada en el header («desafío del dd/mm»). En el sistema, la Play vieja queda `in_progress` sin contar y no hay Play del día nuevo hasta que el jugador empiece.

### Criterios de éxito

- El jugador nunca juega ni envía jugadas contra un desafío vencido sin enterarse: el desafío nuevo se carga en la primera jugada rechazada.
- El jugador puede empezar el desafío nuevo en la misma sesión, sin recargar manualmente.
- La fecha del header y el aviso con el `#número` nuevo le permiten entender que es otro desafío.

---

## Flujo 3: Desafío anulado y marcar como completado

**JTBD que resuelve:** JTBD 1 — sostener el hábito diario sin que un error del producto corte la racha. Gain asociado: "mantiene su racha aunque un día no tenga desafío publicado o haya sido anulado". `[fuente: PRD §goals-and-context decisiones #3, #5, #13; requirements C-33, C-42]`
**Audiencia:** jugador ([research-context](../../audiences/jugador/research-context.md))
**Trigger:** El jugador entra a `home` o a `{juego}-instrucciones` y el desafío de hoy fue anulado por el responsable (C-41) antes de que hubiera jugado.

### Happy path

1. `home`: la tarjeta del juego aparece en estado "anulado". El jugador la toca. `[fuente: C-05]`
2. Se abre O-02: "Este desafío tenía un error y fue anulado. Tu racha no se ve afectada", con la acción "Marcar como completado".
3. El jugador toca "Marcar como completado". El sistema crea una Play `voided` (C-42): cuenta para la racha del juego, la racha global y `total_completed`, pero no para `played`, `wins` ni `extra`.
4. Se abre `{juego}-resultado` en estado anulado (con el aviso de anulación). La racha queda protegida.
5. El jugador vuelve a `home`, donde la tarjeta aparece como completada.

### Caminos alternativos

- **Entrada por URL directa** — El jugador abre `/:game_id` y llega a `{juego}-instrucciones` en estado "Anulado y sin Play": se muestra O-02 y no se puede empezar. Mismo recorrido desde el paso 2. `[fuente: C-08, product-map]`
- **Anulación mientras jugaba (Play `in_progress`)** — La Play pasa a `voided` y se cierra como completada; al volver, el jugador ve `{juego}-resultado` con el aviso de anulación, sin tener que marcar nada. Si el jugador estaba en `{juego}-partida`, su siguiente jugada recibe `challenge_voided`. `[fuente: C-41, C-11]`
- **Anulación después de terminar (Play `won`/`lost`)** — La Play pasa a `voided` conservando su `result`; los agregados se recalculan (C-35): `played` y `wins` bajan, la racha no cambia. El jugador ve `{juego}-resultado` en estado anulado: aviso + rachas, sin solución ni Compartir (pregunta 2 del product-map, resuelta por REQ-007), y puede reportar. `[fuente: REQ-007 decisión 5, CA 18]`
- **Cerrar O-02 sin marcar** — El jugador cierra el modal y vuelve a `home`; la tarjeta sigue "anulado" y puede marcar después, el mismo día.
- **Varios juegos anulados el mismo día** — El jugador repite el flujo por cada juego (una acción por juego, C-42 es por `challenge_number`).

### Errores y recuperación

- **Doble toque o reintento en "Marcar como completado"** — La acción es idempotente: si la Play ya existe, devuelve la misma sin sumar dos veces y lleva al mismo `{juego}-resultado`. `[fuente: REQ-007 CA 26]`
- **Cambio de día con O-02 abierto (`challenge_expired`)** — El desafío anulado era de ayer: la acción se rechaza, las rachas no cambian y la pantalla recarga el desafío de hoy. `[fuente: REQ-007 CA 27]`
- **El desafío ya no figura anulado (`not_voided`)** — O-02 se cierra y la pantalla se refresca; no se crea ninguna Play. `[fuente: REQ-007 CA 28]`
- **Falla de red al marcar** — O-02 muestra "No pudimos marcar el desafío como completado. Probá de nuevo." y deja reintentar (idempotente).
- **El jugador no marca antes del cambio de día** — C-42 es solo para el Challenge `voided` de hoy; pasado el día no se puede marcar y el día no suma. El PRD no define un aviso previo; a validar si el jugador entiende que debe actuar el mismo día. `[fuente: C-42; pregunta a validar]`
- **Sin sesión (cookies bloqueadas)** — O-03 visible; no se puede crear la Play. Recuperación: habilitar cookies y recargar (flujo 1).
- **Dudas sobre la racha** — O-02 afirma "Tu racha no se ve afectada" y `acerca-de` explica las reglas de racha (completar cuenta, días neutros, anulados). `[fuente: product-map, `acerca-de`]`

### Estado final

El jugador ve `{juego}-resultado` en estado anulado y la tarjeta en `home` como completada. Las rachas del juego y global suman el día; `played`, `wins` y `extra` no cambian.

### Criterios de éxito

- El jugador conserva su racha sin hacer más que un toque ("Marcar como completado").
- El jugador entiende que el desafío fue anulado y que no perdió nada, sin leer `acerca-de`.
- No puede quedar con un desafío anulado "sin cerrar" sin saberlo: la tarjeta y el overlay le muestran el estado. `[hipótesis | inferida-PRD]`

---

## Flujo 4: Reportar un problema del desafío

**JTBD que resuelve:** JTBD 2 — "Cuando termino una partida, quiero ver la solución con una explicación, para aprender algo". Cuando la solución, la traducción o el enunciado parecen incorrectos, el jugador quiere avisarlo sin que eso interrumpa su partida. `[fuente: PRD §goals-and-context G-02; requirements C-36]`
**Audiencia:** jugador ([research-context](../../audiences/jugador/research-context.md))
**Trigger:** El jugador detecta un posible error (respuesta ambigua, explicación errónea, traducción, bug visual) en `{juego}-partida` o `{juego}-resultado` y toca "Reportar un problema".

### Happy path

1. En `{juego}-resultado` (o en `{juego}-partida`), el jugador toca "Reportar un problema" (`link-reportar`). Si ya había reportado ese desafío, el enlace dice "Ya reportaste este desafío" y está deshabilitado (`GameToday.reported`).
2. Se abre O-01 (bottom-sheet en mobile, modal en desktop). Elige un motivo de los 6 (`wrong_answer`, `ambiguous`, `wrong_explanation`, `translation`, `display_bug`, `other`) y, opcionalmente, escribe un mensaje de hasta 1000 caracteres (con contador). Si está en partida, ve el aviso "No incluyas la respuesta si todavía estás jugando".
3. Toca "Enviar reporte". El sistema guarda el reporte con el contexto que arma el servidor (idioma, lenguaje de código, estado de la partida, user agent) (C-36).
4. O-01 muestra "Gracias, recibimos tu reporte." El jugador toca "Cerrar" y el enlace pasa a "Ya reportaste este desafío". Sigue donde estaba, sin perder la partida. `[fuente: REQ-007 CA 1]`
5. Del lado del sistema (fuera de esta superficie): si se superan los umbrales, el desafío queda alertado en el admin (C-37). No es un flujo de la web: el desafío sigue jugable (CA 6).

### Caminos alternativos

- **Reporte desde la partida** — El jugador reporta sin salir de `{juego}-partida`; al cerrar O-01 la partida sigue en el mismo estado. `[fuente: C-36, product-map]`
- **Reporte tras ver el resultado** — Mismo formulario, con más contexto para el jugador (ya vio la solución), sin el aviso de no incluir la respuesta. `[fuente: product-map O-01]`
- **Cancelar** — El jugador cierra O-01 sin enviar; no se guarda nada y el estado del juego no cambia.
- **Reporte sobre un desafío anulado** — Permitido desde el resultado anulado: C-36 acepta Challenge `published` o `voided`. No genera alerta nueva (REQ-007 CA 30).

### Errores y recuperación

- **Ya reportó este desafío (`already_reported`)** — Un reporte por jugador y desafío: el enlace muestra "Ya reportaste este desafío" y no abre el formulario. Si el envío igual llega (otra pestaña), O-01 confirma "Ya reportaste este desafío. Lo vamos a revisar." Recuperación: ninguna necesaria; el reporte previo sigue vigente. `[fuente: C-36, REQ-007 CA 2]`
- **Límite por IP (10 por hora)** — El envío se rechaza con "Se enviaron muchos reportes desde esta conexión. Probá de nuevo más tarde."; el formulario conserva lo escrito. `[fuente: REQ-007 CA 7]`
- **Mensaje de más de 1000 caracteres o motivo inválido (`invalid_report`)** — El campo no acepta más de 1000; si el servidor rechaza, se marca el campo. `[fuente: REQ-007 CA 9]`
- **Cambio de día con O-01 abierto** — El reporte se guarda contra el desafío que el jugador estaba viendo (lleva `challenge_number`; la API acepta desafíos pasados `published` o `voided`). `[fuente: REQ-007 decisión 4]`
- **Sin sesión** — Si la sesión se perdió (`no_session`), se recrea y se reintenta una vez sin intervención; con cookies bloqueadas el enlace no se ofrece (no hay partida ni resultado). `[fuente: REQ-007 manejo de errores]`
- **Error de red al enviar** — "No pudimos enviar el reporte. Probá de nuevo."; el formulario conserva el motivo y el mensaje.
- **El jugador incluye la respuesta en el mensaje** — Se mitiga solo con el aviso del formulario; no hay validación del contenido. `[fuente: C-36]`

### Estado final

El reporte queda guardado y el enlace muestra "Ya reportaste este desafío". El jugador sigue en la pantalla de origen, con la partida intacta.

### Criterios de éxito

- El jugador puede reportar en menos de 30 segundos y sin salir de la partida. `[hipótesis | por-analogía]`
- El jugador no revela la respuesta a otros por error: el aviso aparece antes de escribir.
- El jugador sabe que ya reportó y no reporta dos veces.

---

## Flujo 5: Ver el resultado, compartirlo y revisar estadísticas

**JTBD que resuelve:** JTBD 3 — "Cuando completo un desafío, quiero compartir mi resultado en un toque sin revelar la respuesta, para que otros lo entiendan sin arruinarles el juego." Además, JTBD 2 (ver solución y explicación). `[fuente: PRD §goals-and-context G-02, G-05; requirements C-12, C-13, C-34]`
**Audiencia:** jugador ([research-context](../../audiences/jugador/research-context.md))
**Trigger:** El jugador termina una partida y llega a `{juego}-resultado`, o toca "ver estadísticas →" en `home`.

### Happy path

1. `{juego}-resultado`: el jugador ve el veredicto, la solución y la explicación, y las rachas actualizadas.
2. Toca "Compartir" en el header de la pantalla. El sistema abre el share nativo del dispositivo con el texto: emoji del juego + nombre + `#número`, una línea de resultado sin spoilers y `nerdose.dev` (C-13).
3. El jugador elige la app o contacto y envía. Vuelve a `{juego}-resultado`.
4. Toca "Ver mis estadísticas" y llega a `estadisticas`: racha global actual y récord, desafíos completados, heatmap de 365 días, bloque por juego (racha, récord, jugadas, % de victorias, stat propia) e historial paginado.
5. Vuelve a `home` desde el header, o sigue con "Siguiente juego".

### Caminos alternativos

- **Share nativo no disponible (típicamente desktop)** — El texto se copia al portapapeles y el botón confirma "✓ Copiado" (en Devdle, REQ-004; en Grep Grid, REQ-005; en Tech Timeline, REQ-006, y en Big O, REQ-009). `[fuente: C-13, PRD §Supuestos]`
- **Texto de Grep Grid** — "🔎 Grep Grid #N", "N/8" y "nerdose.dev" en tres líneas; nunca las palabras ni si el jugador se rindió. `[fuente: REQ-005 RF 14, CA 16]`
- **Texto de Tech Timeline** — "⏳ Tech Timeline #N", una línea con 5 cuadrados 🟩/🟥 (uno por posición, en el orden confirmado) seguida de `N/5` (por ejemplo "🟩🟥🟥🟩🟩 3/5") y "nerdose.dev"; nunca nombres, fechas ni el orden. `[fuente: REQ-006 RF 9, CA 3]`
- **Texto de Big O** — "🧮 Big O #N", una línea con 🟩 (acertó) o 🟥 (no acertó) seguida del lenguaje con el que confirmó (por ejemplo "🟩 Java") y "nerdose.dev"; igual en ES y EN, nunca la opción elegida ni la correcta. `[fuente: REQ-009 RF 7, CA 10]`
- **Texto de Devdle** — "🟩 Devdle #N · 4/6" (o "X/6"), una línea de 🟩🟨⬛ por intento y "nerdose.dev"; nunca la palabra ni la categoría. `[fuente: REQ-004 RF 16, CA 14]`
- **Sin juegos pendientes** — Si no queda otro juego con desafío sin completar, "Siguiente juego" no se muestra y la salida es "Volver a los juegos". `[fuente: REQ-004 supuesto «Juegos distintos de Devdle»]`
- **Entrada a estadísticas desde `home`** — El jugador toca "ver estadísticas →" en el panel "Tu progreso", la píldora de racha del header o "./stats"; llega a la misma pantalla. `[fuente: REQ-003, RF 4]`
- **Primera visita, sin datos** — `estadisticas` aparece vacía (racha 0, heatmap sin actividad), sin error. `[fuente: C-05, C-34]`
- **Racha viva o en 0** — La racha se muestra viva si el último día completado es hoy o ayer (contando días neutros); si no, 0 sin un job de reseteo. `[fuente: C-34]`
- **Historial** — "Ver historial completo" pagina dentro de `estadisticas` (pregunta abierta 3 del product-map; si fuera pantalla propia, cambia el recorrido).
- **Resultado de una Play `voided`** — Si es "Marcar como completado" no hay `result` ni partida y C-13 no cubre explícitamente compartir una Play `voided` (pregunta abierta 2 del product-map): puede no haber "Compartir".
- **Reabrir el resultado más tarde el mismo día** — Entrar a `/:game_id` muestra el resultado y permite compartir de nuevo. `[fuente: product-map]`

### Errores y recuperación

- **Falla el share o el portapapeles** — El PRD no define el mensaje; recuperación mínima: el jugador puede reintentar el toque sin salir de la pantalla. El texto no incluye la solución, por lo que un reintento o una copia manual no filtran la respuesta. `[fuente: C-13]`
- **Cancela el share nativo** — No es un error: el jugador queda en `{juego}-resultado` sin cambios.
- **Racha en 0 por borrar la cookie o cambiar de dispositivo** — `estadisticas` muestra 0 y sin historial: el PRD no tiene cuenta en v1, así que **no hay recuperación**. Es un pain declarado y la hipótesis de abandono es `por-analogía`. `[fuente: PRD §requirements, entidad Player; research-context, Pains y Lo que NO sabemos]`
- **Sin sesión (cookies bloqueadas)** — `estadisticas` aparece vacía con O-03; recuperación: habilitar cookies (flujo 1).
- **Error al cargar estadísticas** — Sin copy ni pantalla de error definidos (product-map, Estados Globales); a resolver en wireframes.
- **El jugador esperaba ver estadísticas dentro del resultado** — Hipótesis a validar: los jugadores de Wordle y Connections las ven al terminar; acá hay un toque extra. `[hipótesis | inferida-benchmark]`

### Estado final

El jugador compartió o copió su resultado (sin solución) y vio sus rachas y estadísticas actualizadas. En el sistema no cambia nada al compartir (el contador de shares de C-53 es opcional y sin cookies).

### Criterios de éxito

- El jugador puede compartir en un toque desde `{juego}-resultado`, y el texto no revela la respuesta.
- El jugador llega a sus estadísticas desde el resultado en un toque.
- El jugador entiende por qué su racha tiene el valor que tiene (completar cuenta, días neutros y anulados).

---

**Relacionados:** Las pantallas usadas en estos flujos están inventariadas en `product-map.md` de esta superficie. Los flujos que cruzan a otras superficies viven en `../cross-surface-flows.md`.
