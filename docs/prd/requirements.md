---
created: 2026-11-03
last_updated: 2026-11-03
status: "Draft - In Definition"
---

# Requerimientos — nerdose

> Derivado del discovery: [análisis funcional](../discovery/analisis-funcional.md) · [análisis de dominio](../discovery/analisis-dominio.md)

> **Convención:** los nombres de entidades, campos y valores de enums están **en inglés** (`snake_case`) y se usan tal cual en APIs, schemas y código. Las definiciones y las reglas están en español.

## Entidades del Dominio

Vocabulario compartido de todo el PRD. Los requerimientos referencian estas entidades por su nombre exacto.

**Enums comunes:**
- `game_id` (enum: devdle/bug-hunt/big-o/timeline/grep-grid). No es una tabla: cada juego se registra en el código (`GameDefinition`).
- `locale` (enum: es/en).
- `code_language` (enum: js/go/java).
- `big_o_option` (enum: o_1/o_log_n/o_n/o_n_log_n/o_n2/o_n3/o_2n/o_n_fact).
- `recipe_category` (enum: simple_loops/nested_loops/recursion/divide_and_conquer/binary_search). Conjunto inicial; se amplía con el catálogo de bloques de Big O.
- `bug_type` (enum: off_by_one/comparison/wrong_operator/wrong_variable/bad_initialization/misplaced_return/inverted_condition).

**Conceptos de tiempo:**
- **Día de la plataforma:** día calendario UTC; cambia a las 00:00 UTC. "Hoy" siempre lo calcula el servidor.
- **Número de desafío:** días transcurridos desde el lanzamiento + 1 (#1 = día de lanzamiento). Es el mismo para los 5 juegos ese día.

### Player
- **Key attributes:** id (uuid, req), locale (enum locale, req, default: el del navegador si es es/en, si no `es`), preferred_code_language (enum code_language, req, default: js), user_id (uuid, opt, ref User), created_at (timestamp, req), last_seen_at (timestamp, req)
- **Relationships:** has_many Play, has_many PlayerGameStats (uno por juego jugado), has_one PlayerStats, has_many ChallengeReport, has_many RejectedGuess, belongs_to User (opt)
- **Notes:** Identidad anónima de quien juega. Se crea en la primera visita y se identifica por una cookie funcional httpOnly. No guarda PII. Si se borra la cookie, se crea otro Player (no hay recuperación en v1). `preferred_code_language` se actualiza con el lenguaje con el que confirmó en Bug Hunt o Big O, o desde el selector. Retención indefinida. Tiene a lo sumo un PlayerGameStats por juego y un PlayerStats.

### User *(placeholder, fuera de v1)*
- **Key attributes:** id (uuid, req), email (string, req, único), created_at (timestamp, req)
- **Relationships:** has_many Player
- **Notes:** No se implementa en v1. Al loguearse en un dispositivo con un Player anónimo se fusionan las Play (ante conflicto en el mismo Challenge, queda la más antigua) y se recalculan los agregados.

### Challenge
- **Key attributes:** id (uuid, req), game_id (enum game_id, req), date (date UTC, req), number (int, req, ≥ 1), payload (json, req, específico del juego: incluye la solución y los textos `{es, en}`), status (enum: draft/approved/published/rejected/voided, default: draft), generator_version (string, req), seed (string, req), verification (json, req, log de la verificación), void_reason (string, opt, req si status = voided), voided_at (timestamp, opt), alerted_at (timestamp, opt), created_at (timestamp, req)
- **Relationships:** has_many Play, has_many ChallengeReport, references Term (devdle: 1; grep-grid: 8), references TimelineFact (timeline: 5)
- **Notes:**
  - El contenido jugable de un juego para un día, con su solución y su explicación. Hay a lo sumo un Challenge vigente (approved/published/voided) por (game_id, date).
  - El `payload` es inmutable desde que se aprueba: cambiar el generador no altera desafíos ya generados.
  - Solo un Challenge `published` cuya `date` es hoy acepta jugadas.
  - Solo lo crea el Sistema. Solo se puede regenerar uno `approved` con `date` > hoy, nunca uno `published`. Anular es siempre una acción manual del Responsable y exige `void_reason`.
  - Regenerar (GenerationRequest) reemplaza un `approved` futuro de forma atómica: el nuevo queda `approved` y el viejo pasa a `rejected` (`verification.reason = regenerated`) en la misma transacción; hasta entonces el viejo sigue vigente. El reemplazo usa un `attempt` nuevo (mayor que todos los ya usados para ese juego y fecha) y solo ítems `approved` del banco.
  - **Payload** (con solución, nunca sale del servidor antes de terminar la partida) y **vista pública** (lo que ve el cliente antes de terminar) por juego:

  | game_id | Payload (resumen) | Vista pública |
  |---|---|---|
  | devdle | term_id, word, category, definition `{es,en}`, summary `{es,en}` | length, possible_categories |
  | grep-grid | grid (12×12), words (8: term_id, word, definition `{es,en}`), placements (posición y dirección de cada palabra) | grid, words (term_id, word; definition solo de las ya encontradas por la Play en curso) |
  | timeline | prompt `{es,en}` (consigna única), items (5: fact_id, opaque_id, label, category, event_date, date_precision, note `{es,en}`), correct_order (opaque_ids) | prompt, items mezclados (opaque_id, label, category) |
  | big-o | recipe (id estable de la receta), recipe_category, code `{js,go,java}` (función `f(n)` que cuenta sus operaciones y devuelve `ops`; misma línea por sentencia en los 3), answer (enum big_o_option), trap_option (big_o_option o null: la respuesta equivocada típica), explanation (steps `[{es,en}]`, line_notes `[{ line, text {es,en} }]`, tip `{es,en}` o null, example `{ n, ops, trap_ops }` o null) — REQ-009 | code, options (las 8 `big_o_option`, en orden fijo) |
  | bug-hunt | template, params, tree, bug_node_id, bug_type, mutation, fix (diff), spec `{es,en}`, code `{js,go,java}`, line_of `{js,go,java}`, pickable_lines, visible_tests, failing_test, explanation `{es,en}` | spec, code, pickable_lines, visible_tests |

### Play
- **Key attributes:** id (uuid, req), player_id (uuid, req), challenge_id (uuid, req), game_id (enum game_id, req, denormalizado), date (date UTC, req, denormalizado), state (json, req, estado propio del juego), status (enum: in_progress/won/lost/voided, default: in_progress), result (json, opt, req si status ∈ won/lost), code_language (enum code_language, opt, solo bug-hunt y big-o: lenguaje con el que confirmó), score (int, opt), started_at (timestamp, req), finished_at (timestamp, opt, req si status ≠ in_progress)
- **Relationships:** belongs_to Player, belongs_to Challenge
- **Notes:**
  - El intento de un Player sobre un Challenge. Hay a lo sumo una Play por (player_id, challenge_id).
  - Es la **fuente de verdad del historial**: los agregados se recalculan a partir de Play.
  - Una Play que no está `in_progress` no acepta jugadas. Una jugada sobre una Play cuya `date` < hoy se rechaza (`challenge_expired`). Si queda `in_progress` en un día pasado, queda así para siempre y no cuenta, salvo que su Challenge se anule: entonces pasa a `voided` y cuenta como completada (C-41).
  - **Completada** = `won`, `lost` o `voided`. Una Play a medias no está completada.
  - Criterios por juego:

  | game_id | State | Fin de partida | Score | Win | Etiqueta en el historial |
  |---|---|---|---|---|---|
  | devdle | guesses (con feedback por letra) | adivina o 6 intentos válidos | intentos usados (1–6) | adivinó | "✓ 4/6" / "✗ X/6" |
  | grep-grid | found_words, gave_up | 8 encontradas o se rinde | palabras encontradas (0–8) | 8/8 | "8/8" / "5/8" |
  | timeline | order (vacío hasta confirmar; los 5 opaque_id confirmados) | 1 confirmación | posiciones correctas (0–5) | 5/5 | "3/5" |
  | big-o | vacío hasta confirmar; `{ language, option }` confirmados (REQ-009) | 1 confirmación | 1/0 | opción correcta | "✓ O(n log n)" / "✗" |
  | bug-hunt | — | 1 confirmación | 1/0 | línea correcta | "✓ L7" / "✗ L7" |

### PlayerGameStats
- **Key attributes:** player_id (uuid, req), game_id (enum game_id, req), current_streak (int, req, default: 0), max_streak (int, req, default: 0), played (int, req, default: 0), wins (int, req, default: 0), last_completed_date (date, opt), extra (json, req, stats propias del juego)
- **Relationships:** belongs_to Player
- **Notes:** PK (player_id, game_id). Agregado que se actualiza en la misma transacción que cierra la Play. `played` y `wins` excluyen las Play `voided`. Contenido de `extra`:
  - devdle: distribución de intentos (1–6 y derrotas);
  - grep-grid: distribución de palabras encontradas por partida (0–8), de la que salen el promedio de palabras encontradas y el porcentaje de 8/8;
  - timeline: por categoría y **por hito**, hitos jugados y hitos en su lugar (`{ by_category: { <category>: { played, correct } } }`): cada uno de los 5 items de la partida suma `played += 1` a la categoría de su hecho y `correct += 1` si quedó en su posición correcta. De ahí sale el porcentaje de acierto por categoría (`correct / played`); la mejor categoría es la de mayor promedio;
  - big-o: aciertos por `recipe_category` (`{ by_category: { <recipe_category>: { played, correct } } }`, una partida suma `played += 1` a la categoría de su receta y `correct += 1` si ganó; REQ-009);
  - bug-hunt: aciertos por `code_language` y por `bug_type`.

### PlayerStats
- **Key attributes:** player_id (uuid, req), global_streak (int, req, default: 0), max_global_streak (int, req, default: 0), last_active_date (date, opt), total_completed (int, req, default: 0)
- **Relationships:** belongs_to Player
- **Notes:** Agregado global; se actualiza en la misma transacción que cierra la Play. `total_completed` incluye las Play `voided`.

### ChallengeReport
- **Key attributes:** id (uuid, req), challenge_id (uuid, req), player_id (uuid, req), reason (enum: wrong_answer/ambiguous/wrong_explanation/translation/display_bug/other, req), message (string, opt, max: 1000), locale (enum locale, req), context (json, req: code_language, estado de la partida, user agent), status (enum: open/resolved/dismissed, default: open), created_at (timestamp, req)
- **Relationships:** belongs_to Challenge, belongs_to Player
- **Notes:** Hay a lo sumo un reporte por (player_id, challenge_id), y solo sobre Challenge `published` o `voided` de hoy o de un día pasado (el jugador que sigue en el resultado después del cambio de día puede reportarlo); nunca sobre uno `approved` futuro. Se puede crear durante la partida o en el resultado. Solo `wrong_answer` y `ambiguous` cuentan para el umbral de alerta.

### Term
- **Key attributes:** id (uuid, req), term (string, req, único, solo A–Z en mayúsculas, 4–12 letras), category (enum: programming_languages/git/databases/networking/linux/apis/security/software_engineering, req), definition (json `{es,en}`, req), summary (json `{es,en}`, req), example (json `{es,en}`, opt, futuro), wikidata_id (string, req, único), sitelinks (int, req), status (enum: draft/approved/rejected, default: draft), rejection_reason (string, opt), last_used_devdle (date, opt), last_used_grep (date, opt)
- **Relationships:** referenced_by Challenge (devdle, grep-grid)
- **Notes:** Término técnico del banco que usan Devdle y Grep Grid. Solo los `approved` se usan. Para aprobarse necesita los dos idiomas, artículo de Wikipedia en ES y EN, un mínimo de `sitelinks` y no estar en la lista de exclusión. Lo llena solo el Sistema desde Wikidata. Pasa a `rejected` si un Challenge anulado lo señala como causa.

### TimelineFact
- **Key attributes:** id (uuid, req), label (string, req), category (enum: programming_languages/frameworks/companies/operating_systems/hardware/video_games/databases/software_tools, req), event_date (date, req), date_precision (enum: year/month/day, req), note (json `{es,en}`, req), wikidata_id (string, req, único), sitelinks (int, req), status (enum: draft/approved/rejected, default: draft), rejection_reason (string, opt), last_used (date, opt)
- **Relationships:** referenced_by Challenge (timeline)
- **Notes:** Hito tech que usa Tech Timeline. Requiere una única fecha, sin contradicciones en Wikidata. Si la nota menciona un año distinto del de `event_date`, se usa la descripción corta. Las categorías `internet` y `general_history` quedan diferidas hasta tener una fuente fiable. No hay mínimo por categoría: entra toda categoría con hechos que pasen el filtro de calidad (fecha única, notas ES/EN, `sitelinks` ≥ el mínimo calibrado), porque el desafío mezcla hechos de todas. Categorías v1: `programming_languages`, `frameworks`, `companies`, `operating_systems`, `hardware`, `video_games`, `databases` (sistemas de bases de datos, fecha de creación o primera versión) y `software_tools` (navegadores, editores e IDEs, control de versiones, contenedores; fecha de creación o lanzamiento). Pasa a `rejected` si un Challenge anulado lo señala como causa.

### RejectedGuess
- **Key attributes:** word (string, req, A–Z), player_id (uuid, req), created_at (timestamp, req)
- **Relationships:** belongs_to Player
- **Notes:** PK (word, player_id): cuenta jugadores distintos, no intentos. Se registra cada vez que un intento de Devdle se rechaza por no estar en la lista de palabras válidas. No amplía la lista sola: el admin muestra las palabras más rechazadas, y sumarlas a la lista base es un cambio de código (ver F-15).

### GenerationFailure
- **Key attributes:** game_id (enum game_id, req), date (date UTC, req), attempts (int, req), last_reason (string, opt), created_at (timestamp, req), updated_at (timestamp, req)
- **Relationships:** — (referencia lógica al juego y la fecha del Challenge que no se pudo generar)
- **Notes:** PK (game_id, date). La crea el Sistema cuando un juego no logra el desafío de mañana tras 20 reintentos. Es la alerta: no se envía mail, se muestra en el admin (Próximos desafíos). Si una corrida posterior vuelve a fallar para esa fecha, se actualiza (`attempts`, `last_reason`, `updated_at`) sin duplicarse. Nunca se borra: está **activa** mientras su `date` esté en los próximos 14 días y el (game_id, date) siga sin Challenge vigente.

### GenerationRequest
- **Key attributes:** id (uuid, req), challenge_id (uuid, req, ref Challenge: el `approved` a reemplazar), status (enum: pending/done/failed/cancelled, req, default: pending), new_challenge_id (uuid, opt, ref Challenge, req si status = done), error (string, opt: motivo del último candidato rechazado si status = failed), requested_at (timestamp, req), processed_at (timestamp, opt, req si status ≠ pending)
- **Relationships:** belongs_to Challenge (el reemplazado), references Challenge (el nuevo, opt)
- **Notes:** Pedido de regeneración del Responsable (C-44). Lo crea la `api` y lo atiende el Sistema (generator). A lo sumo un `pending` por Challenge: repetir el pedido devuelve el pendiente. `done` = el reemplazo pasó la verificación y se hizo de forma atómica (viejo `rejected`, nuevo `approved`). `failed` = ningún candidato pasó tras 20 reintentos; el actual sigue `approved` y no se registra una GenerationFailure. `cancelled` = cuando se iba a atender, el Challenge ya no era `approved` o su fecha había llegado; se publica sin cambios. Estados terminales: done, failed, cancelled.

### Ciclos de Vida

**Challenge**

| Estado | Cuándo | Transiciones permitidas | Prohibidas |
|---|---|---|---|
| draft | El Sistema lo generó y está en verificación | → approved, → rejected | → published, → voided |
| approved | Pasó la verificación; espera su fecha | → published (al llegar su fecha), → rejected (regenerar) | → draft, → voided |
| published | Llegó su fecha: se puede jugar si es hoy | → voided | → draft, → approved, → rejected |
| rejected | Falló la verificación o se reemplazó al regenerar | (terminal) | → cualquier otro |
| voided | El Responsable lo anuló por un error confirmado | (terminal) | → cualquier otro |

**Play**

| Estado | Cuándo | Transiciones permitidas | Prohibidas |
|---|---|---|---|
| in_progress | El jugador empezó el desafío de hoy | → won, → lost (solo mientras `date` = hoy), → voided (al anularse el Challenge) | → won/lost si `date` < hoy |
| won | Se cumplió el criterio de victoria | → voided (al anularse el Challenge) | → in_progress, → lost |
| lost | Terminó sin cumplir el criterio (intentos agotados, respuesta incorrecta, rendirse) | → voided (al anularse el Challenge) | → in_progress, → won |
| voided | Su Challenge se anuló, o el jugador marcó como completado un Challenge anulado de hoy | (terminal) | → cualquier otro |

**ChallengeReport**

| Estado | Cuándo | Transiciones permitidas | Prohibidas |
|---|---|---|---|
| open | Recién creado | → resolved, → dismissed | — |
| resolved | El Responsable confirmó el problema (anuló el Challenge o registró la causa) | (terminal) | → open |
| dismissed | El Responsable lo descartó | (terminal) | → open |

**Term / TimelineFact**

| Estado | Cuándo | Transiciones permitidas | Prohibidas |
|---|---|---|---|
| approved | Pasó las reglas del banco en el script de importación y se cargó desde el dataset | → rejected (causa de un Challenge anulado) | — |
| rejected | No pasó las reglas en la importación, o causó un error confirmado | (terminal) | → approved |

No hay estado `draft`: las reglas se aplican en el script de importación, offline, y el dataset ya trae cada ítem `approved` o `rejected`.

## Funcionalidades Principales

**Actores:** U-01 Jugador y U-02 Responsable de la plataforma (ver `goals-and-context.md`). **Sistema** = procesos automáticos (generación, verificación, publicación, carga de los bancos, alertas); no es un usuario.

**Errores tipados de partida:** `no_session`, `no_challenge_today`, `challenge_expired`, `challenge_voided`, `game_finished`, `invalid_move`, `not_in_word_list`, `already_reported`, `rate_limited`.

---

### F-01: Sesión anónima y preferencias

**Descripción:** El jugador entra sin registrarse. Se le crea una identidad anónima guardada en el servidor y referida por una cookie funcional. Puede elegir idioma y lenguaje de código preferido.

**Historia de usuario:**
Como jugador,
quiero jugar sin crear una cuenta y en mi idioma,
para empezar en segundos sin fricción.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-01 | Crear o renovar la sesión anónima | U-01 | Player | CREATE | locale (enum: es/en, derivado de `Accept-Language`, default: es), preferred_code_language (enum: js/go/java, default: js) | Idempotente: con cookie válida y Player existente, renueva la cookie y actualiza `last_seen_at` sin crear nada. Sin cookie crea un Player y setea una cookie funcional httpOnly con su id. Sin PII. Límite: 20 por IP cada 10 min |
| C-02 | Detectar cookies bloqueadas | U-01 | Player | READ | has_session (bool) | Si después de crear la sesión el navegador sigue sin enviar la cookie, se muestra un aviso: el catálogo se ve, pero no se puede jugar |
| C-03 | Cambiar preferencias | U-01 | Player | UPDATE | locale (enum: es/en, opt), preferred_code_language (enum: js/go/java, opt) | Solo se actualizan los campos enviados. Se puede cambiar el idioma a mitad de partida: la partida no cambia y los textos vuelven en el idioma nuevo |
| C-04 | Resolver el idioma de cada respuesta | Sistema | Player | READ | — | Orden: `locale` del Player → `Accept-Language` → `es`. Los campos `{es, en}` del contenido se resuelven en el servidor |

**Criterios de Aceptación:**
- DADO un navegador sin cookie con `Accept-Language: en-US`
  CUANDO entra a nerdose.dev
  ENTONCES se crea un Player con `locale = en` y `preferred_code_language = js`
  Y la interfaz se muestra en inglés.
- DADO un navegador con `Accept-Language: pt-BR` y sin cookie
  CUANDO entra por primera vez
  ENTONCES el Player se crea con `locale = es`.
- DADO un jugador en el intento 3 de Devdle con `locale = es`
  CUANDO cambia el idioma a `en`
  ENTONCES sigue en el intento 3 con los mismos intentos previos
  Y la consigna y las categorías se muestran en inglés.
- DADO un navegador que bloquea cookies
  CUANDO entra a la home
  ENTONCES ve los 5 juegos y el aviso "Activá las cookies para poder jugar"
  Y no puede empezar ninguna partida.

**Prioridad:** Alta

**Dependencias:** Ninguna

---

### F-02: Catálogo, día de la plataforma y cuenta regresiva

**Descripción:** La home funciona como catálogo de juegos: muestra la identidad, una presentación breve, los 5 juegos con su descripción y estado del día, la racha global, un resumen de progreso y la cuenta regresiva hasta el próximo desafío. Debe sentirse como un producto de entretenimiento, no como un dashboard.

**Historia de usuario:**
Como jugador,
quiero ver de un vistazo qué juegos me faltan hoy y cuánto falta para los próximos,
para no cortar mis rachas.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-05 | Ver el estado del día | U-01 | Challenge, Play | READ | date (date), number (int), games[]: game_id (enum game_id), challenge_status (enum: published/voided/none), play_status (enum: in_progress/won/lost/voided, opt), history_label (string, opt), current_streak (int); global_streak (int), completed_today (int) | "Hoy" lo calcula el servidor; el cliente nunca manda la fecha. Funciona sin sesión (sin estado de partidas). Estados visibles: sin jugar, en curso, completado, sin desafío, anulado |
| C-06 | Cuenta regresiva y cambio de día | U-01 | Challenge | READ | next_reset_at (timestamp UTC), seconds_to_reset (int) | El desafío cambia a las 00:00 UTC. Al llegar a 0, la home recarga el estado del día |
| C-07 | Ver "Acerca de" y aviso de privacidad | U-01 | — | READ | — | "Acerca de" atribuye las fuentes de Wikipedia y Wikidata (CC BY-SA) e incluye el aviso de privacidad (REQ-003: el footer queda como en el prototipo) |

**Criterios de Aceptación:**
- DADO que hoy es 2026-12-01 y el lanzamiento fue el 2026-11-24
  CUANDO el jugador abre la home
  ENTONCES ve el desafío #8 para los 5 juegos.
- DADO que el jugador completó Devdle y Big O hoy, tiene Grep Grid en curso y Bug Hunt no tiene desafío publicado
  CUANDO abre la home
  ENTONCES ve Devdle y Big O "completado", Grep Grid "en curso", Tech Timeline "sin jugar" y Bug Hunt "sin desafío hoy".
- DADO que son las 23:59:50 UTC y la home está abierta
  CUANDO la cuenta regresiva llega a 0
  ENTONCES la home recarga y muestra el desafío del día siguiente con todos los juegos "sin jugar".

**Prioridad:** Alta

**Dependencias:** F-01

---

### F-03: Ciclo común de partida

**Descripción:** Reglas que comparten los 5 juegos: pantallas de instrucciones, partida y resultado; una partida por jugador, juego y día; retomar; validación 100% en el servidor; rechazo de la jugada tardía; resultado con la solución y su explicación; share sin spoilers.

**Historia de usuario:**
Como jugador,
quiero que cada juego funcione igual en lo básico (empezar, retomar, terminar y compartir),
para concentrarme en el desafío y no en la interfaz.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-08 | Abrir el juego de hoy | U-01 | Challenge, Play | READ | game_id (enum game_id, req); respuesta: challenge_status, public_view (json, opt), play (opt), result (json, opt) | Antes de terminar, la respuesta nunca incluye datos del `payload` fuera de la vista pública. Si la Play terminó, incluye `result`. `none` → "sin desafío hoy". `voided` → aviso de anulación |
| C-09 | Empezar la partida | U-01 | Play | CREATE | challenge_number (int, req) | Se crea al salir de las instrucciones, en `in_progress`. Idempotente: a lo sumo una Play por (player_id, challenge_id). `challenge_number` ≠ número de hoy → `challenge_expired`. Requiere sesión (`no_session`) |
| C-10 | Retomar la partida | U-01 | Play | READ | state (json) | Si el jugador sale y vuelve el mismo día, retoma la Play en el estado exacto en que la dejó |
| C-11 | Hacer una jugada | U-01 | Play | UPDATE | challenge_number (int, req), move (json, req, según el juego) | Validación 100% en el servidor. Play terminada → `game_finished`. `challenge_number` ≠ hoy → `challenge_expired`: la jugada se rechaza, el front carga el desafío nuevo y la Play vieja queda `in_progress` para siempre, sin contar. Challenge `voided` → `challenge_voided`. Move inválido → `invalid_move`. Límite: 60/min por jugador y 300/min por IP |
| C-12 | Cerrar la partida y mostrar el resultado | Sistema | Play, PlayerGameStats, PlayerStats | UPDATE | status (enum: won/lost), result (json), score (int), finished_at (timestamp) | Al cumplirse el fin de partida del juego. En la misma transacción se actualizan las rachas y las stats (C-33). La respuesta incluye la solución con su explicación, el resultado del jugador, el share y las rachas actualizadas |
| C-13 | Compartir el resultado | U-01 | Play | ACTION | — | Formato: emoji del juego + nombre + `#número`, una línea de resultado sin spoilers y `nerdose.dev`. Share nativo del dispositivo o copiar al portapapeles. Nunca incluye la solución |
| C-14 | Mostrar "sin desafío hoy" | Sistema | Challenge | READ | challenge_status = none | Si un juego no tiene Challenge publicado hoy, se muestra "sin desafío hoy" y el día es neutro para la racha de ese juego |

**Criterios de Aceptación:**
- DADO un jugador con una Play de Devdle en el intento 2, abierta el 2026-12-01 a las 23:58 UTC
  CUANDO envía el intento 3 a las 00:00:05 UTC del 2026-12-02 con `challenge_number = 8`
  ENTONCES recibe `challenge_expired`
  Y el front carga el desafío #9
  Y la Play del #8 queda `in_progress`, sin contar como completada ni como derrota.
- DADO un jugador que terminó Tech Timeline #8 con 3/5
  CUANDO vuelve a abrir Tech Timeline el mismo día
  ENTONCES ve la pantalla de resultado con el orden correcto y su 3/5
  Y cualquier jugada nueva recibe `game_finished`.
- DADO un jugador que encontró 3 palabras en Grep Grid y cerró el navegador
  CUANDO vuelve 2 horas después, el mismo día UTC
  ENTONCES ve la grilla con esas 3 palabras tachadas y sigue jugando.
- DADO un jugador que perdió Bug Hunt #8 en JavaScript
  CUANDO toca "Compartir" en un celular
  ENTONCES se abre el share nativo con "🐛 Bug Hunt #8 · JavaScript\n🟥 se me escapó\nnerdose.dev".

**Prioridad:** Alta

**Dependencias:** F-01, F-02, F-14

---

### F-04: Devdle

**Descripción:** Adivinar el término técnico del día en hasta 6 intentos, con feedback por letra. Solo se aceptan palabras de una lista válida, armada en build.

**Historia de usuario:**
Como jugador,
quiero adivinar una palabra técnica con pistas por letra,
para poner a prueba mi vocabulario tech en un par de minutos.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-15 | Intentar una palabra | U-01 | Play | UPDATE | move.guess (string, req, solo A–Z, largo = `length` de la vista pública) | Mayúsculas y minúsculas indistintas; el input ignora los caracteres que no son A–Z; una palabra de otra longitud no se envía (aviso del front). Fuera de la lista válida → `not_in_word_list`: no consume intento ni cambia el estado. Válida → feedback por letra (enum: correct/present/absent) con el manejo estándar de letras repetidas. Termina al adivinar (won) o con 6 intentos válidos (lost). Sin modo difícil |
| C-16 | Registrar un intento rechazado | Sistema | RejectedGuess | CREATE | word (string, req, A–Z), player_id (uuid, req) | Una fila por (word, player_id): cuenta jugadores distintos, no intentos |
| C-17 | Elegir la respuesta del día | Sistema | Challenge, Term | CREATE | term_id (uuid, req) | Term `approved` no usado en Devdle en los últimos 365 días, con categoría distinta de las de los últimos 3 días. La vista pública muestra la longitud y la lista de categorías posibles (no la del día). Las respuestas posibles nunca se envían al cliente |
| C-18 | Ver el resultado de Devdle | U-01 | Play | READ | result: word, category, definition, summary | Muestra la palabra, su categoría, una definición breve y un resumen. Share: grilla 🟩🟨⬛ por intento y `N/6` (o `X/6`). Stat propia: distribución de intentos (1–6 y derrotas) |

**Criterios de Aceptación:**
- DADO que la respuesta del día es `REACT`
  CUANDO el jugador intenta `TRACE`
  ENTONCES recibe T=present, R=present, A=correct, C=correct, E=present
  Y le quedan 5 intentos.
- DADO que la respuesta es `NGINX` y el jugador ya usó 2 intentos
  CUANDO intenta `XQZWV`, que no está en la lista válida
  ENTONCES recibe `not_in_word_list` y el aviso "no está en la lista"
  Y sigue con 2 intentos usados
  Y se registra la RejectedGuess (`XQZWV`, su player_id).
- DADO que la respuesta es `LINUX` y el jugador falló 5 intentos
  CUANDO falla el sexto
  ENTONCES la Play pasa a `lost` y ve `LINUX`, su categoría, la definición y el resumen
  Y el share termina en `X/6`.
- DADO que Devdle usó términos de las categorías `git`, `databases` y `linux` en los últimos 3 días
  CUANDO el Sistema elige la respuesta de mañana
  ENTONCES elige un Term de una categoría distinta de esas tres, no usado en Devdle en los últimos 365 días.

**Prioridad:** Alta

**Dependencias:** F-03, F-15

---

### F-05: Grep Grid

**Descripción:** Encontrar 8 términos técnicos escondidos en una sopa de letras de 12×12, sin límite de tiempo.

**Historia de usuario:**
Como jugador,
quiero buscar palabras técnicas en una grilla a mi ritmo,
para jugar algo relajado que no exige programar.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-19 | Seleccionar una palabra | U-01 | Play | UPDATE | move.type (enum: select/give_up, req), move.from (row: int 0–11, col: int 0–11, req si select), move.to (row, col, req si select) | El jugador toca la primera y la última letra. Correcta → se tacha, se marca en la grilla y se revela su definición breve. No es una palabra de la lista → "no es una palabra", sin penalización. Ya encontrada → se ignora. Fuera de las direcciones permitidas (por ejemplo, en reversa) → `invalid_move`. 8/8 → won |
| C-20 | Rendirse | U-01 | Play | UPDATE | move.type = give_up | Cierra la Play como `lost` con N/8, cuenta para la racha y revela las palabras faltantes |
| C-21 | Generar la grilla del día | Sistema | Challenge, Term | CREATE | grid (12×12), words (8), placements | 8 Term `approved` al azar, sin tema común, de ≤ 12 letras, no usados en Grep Grid en los últimos 30 días. Direcciones: horizontal, vertical y diagonal, solo hacia adelante. Cada palabra aparece exactamente una vez (verificado). La lista de palabras es pública; las posiciones nunca se envían al cliente |
| C-22 | Ver el resultado de Grep Grid | U-01 | Play | READ | score (int 0–8) | Puntaje = palabras encontradas; victoria solo con 8/8. Sin tiempo. Share: `N/8`, sin revelar las palabras. Stats propias: promedio de palabras encontradas y porcentaje de 8/8 |

**Criterios de Aceptación:**
- DADO que `DOCKER` está en la fila 3 de la columna 2 a la 7, horizontal
  CUANDO el jugador toca (3,2) y luego (3,7)
  ENTONCES `DOCKER` se tacha, las 6 celdas se marcan y se muestra su definición.
- DADO el mismo `DOCKER`
  CUANDO el jugador toca (3,7) y luego (3,2) (en reversa)
  ENTONCES recibe `invalid_move` y la palabra no se marca.
- DADO un jugador con 5/8 encontradas
  CUANDO toca "Rendirse"
  ENTONCES la Play pasa a `lost` con score 5, se revelan las 3 faltantes en la grilla
  Y su racha de Grep Grid suma el día.

**Prioridad:** Alta

**Dependencias:** F-03, F-15

---

### F-06: Tech Timeline

**Descripción:** Ordenar cronológicamente 5 hitos de la historia tech, del más antiguo al más reciente, en un solo intento.

**Historia de usuario:**
Como jugador,
quiero ordenar hitos de la historia tech,
para descubrir cuándo pasaron las cosas que uso todos los días.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-23 | Ordenar y confirmar | U-01 | Play | UPDATE | move.order (string[5], req, opaque_id) | Arrastrar y soltar con touch y teclado; seleccionar el orden y después confirmar. **Un solo intento.** Elementos faltantes o duplicados → `invalid_move`. Puntaje = posiciones correctas (0–5); victoria solo con 5/5 |
| C-24 | Generar el desafío del día | Sistema | Challenge, TimelineFact | CREATE | prompt `{es,en}`, items (5, cada uno con la category de su hecho) | 5 TimelineFact `approved` elegidos al azar (con el seed) de todo el banco, **sin importar la categoría** (el desafío mezcla categorías y no tiene una propia), no usados en los últimos 90 días, distinguibles sin ambigüedad (≥ 1 año de diferencia, o fecha con precisión de mes o día que los separe). Orden pedido: siempre del más antiguo al más reciente, con una consigna única y fija para todos los días (ES «Ordená estos hitos del más antiguo al más reciente», EN «Order these milestones from oldest to newest»). Los `opaque_id` son aleatorios por desafío. Se muestran mezclados y sin fecha, cada uno con la etiqueta de su categoría (no revela la fecha) |
| C-25 | Ver el resultado de Tech Timeline | U-01 | Play | READ | result.items[]: label, category, event_date, date_precision, note, posición correcta, posición del jugador | Orden correcto con la fecha, la categoría y una nota breve de cada elemento, y las posiciones acertadas. Share: 5 cuadrados 🟩/🟥 y `N/5`. Stat propia: porcentaje de hitos en su lugar por categoría, acumulado por hito (cada item suma a la categoría de su hecho) |

**Criterios de Aceptación:**
- DADO los hechos Python (1991), Java (1995), Go (2009), Node.js (2009-05) y Docker (2013)
  CUANDO el Sistema arma el desafío
  ENTONCES lo descarta, porque Go y Node.js caen en 2009 y "Go" solo tiene precisión de año.
- DADO el orden correcto [Python, Java, Go, Docker, Kubernetes]
  CUANDO el jugador confirma [Python, Go, Java, Docker, Kubernetes]
  ENTONCES obtiene 3/5 (Python, Docker y Kubernetes en su lugar), la Play pasa a `lost`
  Y el share es "🟩🟥🟥🟩🟩 3/5".
- DADO que el jugador envía solo 4 opaque_id
  CUANDO confirma
  ENTONCES recibe `invalid_move` y la Play sigue `in_progress`.

**Prioridad:** Alta

**Dependencias:** F-03, F-15

---

### F-07: Big O Challenge

**Descripción:** Identificar la complejidad temporal en el peor caso de un fragmento de código, eligiendo entre 8 opciones fijas, en el lenguaje que prefiera el jugador.

**Historia de usuario:**
Como developer,
quiero estimar la complejidad de un fragmento de código,
para entrenar mi intuición algorítmica y aprender de la explicación.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-26 | Cambiar el lenguaje del código (Big O y Bug Hunt) | U-01 | Challenge | READ | code_language (enum: js/go/java) | Es solo una vista: la vista pública trae el código en los 3 lenguajes. No cambia la Play ni la respuesta. Arranca en `preferred_code_language` |
| C-27 | Elegir la complejidad y confirmar | U-01 | Play | UPDATE | move.language (enum: js/go/java, req), move.option (enum: o_1/o_log_n/o_n/o_n_log_n/o_n2/o_n3/o_2n/o_n_fact, req) | Seleccionar y después confirmar; **un solo intento**. Se guarda el lenguaje en `Play.code_language` y como `Player.preferred_code_language` |
| C-28 | Generar el desafío del día | Sistema | Challenge | CREATE | recipe, recipe_category (enum), code `{js,go,java}`, answer (enum big_o_option), explanation `{es,en}` | Complejidad temporal en el **peor caso**. Sin construcciones cuyo costo dependa de los datos o de un promedio (por ejemplo, operaciones de hash map). La recursión doble se responde como O(2ⁿ) y la explicación aclara que la cota exacta es φⁿ. Incluye trampas con cierta frecuencia (loops en secuencia, loops hasta una constante, loops internos que duplican su variable). Hasta ~15 líneas y 3 niveles de anidamiento. La respuesta calculada se confirma ejecutando el código con varios tamaños de entrada; si no coincide o es ambigua, se descarta. No se repite la receta en 30 días, y la misma respuesta no sale más de 2 días seguidos |
| C-29 | Ver el resultado de Big O | U-01 | Play | READ | result: answer, explanation | Respuesta correcta y explicación paso a paso (costo de cada bloque, reglas de anidamiento y secuencia, simplificación final). Share: 🟩/🟥 y el lenguaje, sin revelar la opción. Stat propia: aciertos por `recipe_category` |

**Criterios de Aceptación:**
- DADO un jugador con `preferred_code_language = js`
  CUANDO abre Big O #8
  ENTONCES ve el código en JavaScript
  Y al cambiar a Go ve el mismo algoritmo en Go, sin ningún cambio en su Play.
- DADO un desafío cuya respuesta es `o_n_log_n`
  CUANDO el jugador elige `o_n2` en Go y confirma
  ENTONCES la Play pasa a `lost` con `code_language = go`
  Y su `preferred_code_language` pasa a `go`
  Y ve la explicación "el loop externo corre n veces… el interno duplica j: log₂ n vueltas… n × log n".
- DADO una receta cuya ejecución con n = 2⁸…2¹⁶ se ajusta tan bien a O(n) como a O(n log n)
  CUANDO el Sistema la verifica
  ENTONCES la descarta por ambigua y sortea otra.

**Prioridad:** Media

**Dependencias:** F-03, F-14

---

### F-08: Bug Hunt

**Descripción:** Encontrar la línea con el bug en una función corta que no cumple su especificación. Los desafíos se generan con mutation testing en JS, Go y Java, y la línea del bug es la misma en los tres.

**Historia de usuario:**
Como developer,
quiero encontrar el bug en una función corta,
para entrenar la lectura atenta de código y el razonamiento sobre casos borde.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-30 | Elegir la línea y confirmar | U-01 | Play | UPDATE | move.language (enum: js/go/java, req), move.line (int, req, ∈ `pickable_lines`) | No se pueden elegir la firma de la función ni las líneas que solo tienen llaves (`invalid_move`). Seleccionar y después confirmar; **un solo intento**. El cambio de lenguaje es solo una vista (C-26). Se guarda el lenguaje en `Play.code_language` y como `Player.preferred_code_language` |
| C-31 | Generar el desafío del día | Sistema | Challenge | CREATE | template, params, mutation, bug_type (enum), spec `{es,en}`, code `{js,go,java}`, pickable_lines, visible_tests, failing_test, fix, explanation `{es,en}` | Plantilla de función correcta con parámetros al azar + **una** mutación. Función de 8 a 15 líneas; una sentencia cae en la misma línea en los 3 lenguajes. Se acepta solo si: la versión correcta da el mismo resultado en los 3 lenguajes; la mutada falla al menos un test con el mismo resultado en los 3; al menos 2 tests siguen pasando (son los visibles); no es un mutante equivalente. Test oculto = el más chico que falla. No se repite la combinación plantilla + parámetros + mutación en 60 días |
| C-32 | Ver el resultado de Bug Hunt | U-01 | Play | READ | result: line, failing_test (input, expected, actual), fix (diff), explanation | La línea correcta, el test que falla (esperado vs. obtenido), el fix como diff y una explicación paso a paso. Share: `🐛 Bug Hunt #N · <lenguaje>` y `🟩 bug encontrado` / `🟥 se me escapó`, sin revelar la línea. Stats propias: aciertos por `code_language` y por `bug_type` |

**Criterios de Aceptación:**
- DADO la función `maxIndex` ("índice del mayor valor; si se repite, el primero") con la mutación `>` → `>=` en la línea 4
  CUANDO el jugador elige la línea 4 en Java y confirma
  ENTONCES la Play pasa a `won` y ve el test que falla `[5, 1, 5]` (esperado 0, obtenido 2), el diff `>=` → `>` y la explicación.
- DADO la misma función
  CUANDO el jugador toca la línea 1 (la firma)
  ENTONCES la línea no se puede seleccionar.
- DADO una mutación que no cambia el resultado de ningún test
  CUANDO el Sistema la verifica
  ENTONCES la descarta como mutante equivalente.

**Prioridad:** Media

**Dependencias:** F-03, F-14, F-07 (C-26)

---

### F-09: Rachas y estadísticas

**Descripción:** Rachas por juego y global, con días neutros, y una pantalla de estadísticas completa: rachas y récords, completados, porcentaje de victorias, stats propias de cada juego, heatmap e historial.

**Historia de usuario:**
Como jugador,
quiero ver mis rachas y mi progreso,
para tener un motivo para volver todos los días.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-33 | Actualizar rachas y stats al completar | Sistema | PlayerGameStats, PlayerStats | UPDATE | current_streak, max_streak, played, wins, last_completed_date, extra; global_streak, max_global_streak, last_active_date, total_completed | En la misma transacción que cierra la Play. **Racha por juego:** días UTC consecutivos con ese juego completado (ganado, perdido o anulado). **Racha global:** días UTC consecutivos con al menos un juego completado. **Día neutro:** un día sin Challenge publicado no suma ni corta la racha de ese juego; para la global, el día es neutro solo si ningún juego tuvo Challenge. Las Play `voided` cuentan para las rachas y `total_completed`, pero no para `played`, `wins` ni `extra` |
| C-34 | Ver estadísticas | U-01 | PlayerStats, PlayerGameStats, Play | READ | global: current_streak, max_streak, total_completed; games[]: game_id, current_streak, max_streak, played, wins, win_rate, extra; heatmap[]: date, completed (int); history[]: date, number, game_id, status, label | La racha se muestra viva si el último día completado es hoy o ayer (contando los días neutros intermedios); si no, se muestra 0, sin ningún job de reseteo. Heatmap de los últimos 365 días. Historial paginado, con etiqueta corta por partida ("✓ 4/6", "✗ L7", "6/8") |
| C-35 | Recalcular agregados | Sistema | PlayerGameStats, PlayerStats | UPDATE | — | El historial (Play) es la fuente de verdad: los agregados siempre se pueden recalcular desde Play. Se recalculan para los jugadores afectados al anular un Challenge |

**Criterios de Aceptación:**
- DADO un jugador con racha de Devdle 4 y `last_completed_date` = 2026-12-01
  CUANDO pierde Devdle el 2026-12-02
  ENTONCES su racha de Devdle pasa a 5 y su porcentaje de victorias baja.
- DADO que Devdle no tuvo desafío el 2026-12-02 y el jugador completó Devdle el 2026-12-01
  CUANDO completa Devdle el 2026-12-03
  ENTONCES su racha de Devdle continúa (+1), porque el 2026-12-02 fue neutro.
- DADO un jugador cuya última Play completada fue el 2026-11-28
  CUANDO abre sus stats el 2026-12-02
  ENTONCES ve la racha global actual en 0 y conserva su récord.
- DADO un jugador con 10 partidas de Big O, 6 ganadas, una de ellas en un desafío luego anulado
  CUANDO se anula ese desafío
  ENTONCES pasa a `played = 9`, `wins = 5`, y su racha no cambia.

**Prioridad:** Alta

**Dependencias:** F-03

---

### F-10: Reporte de problemas y umbral de alerta

**Descripción:** El jugador puede avisar que un desafío está mal, durante la partida o en el resultado. Si se acumulan reportes, el desafío queda marcado como alertado y el Responsable lo ve en el admin. Nunca se despublica automáticamente.

**Historia de usuario:**
Como jugador,
quiero avisar cuando un desafío está mal,
para que se corrija y no me afecte la racha.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-36 | Reportar un problema | U-01 | ChallengeReport | CREATE | challenge_number (int, req), reason (enum: wrong_answer/ambiguous/wrong_explanation/translation/display_bug/other, req), message (string, opt, max: 1000), code_language (enum: js/go/java, opt) | Disponible durante la partida y en el resultado. El formulario muestra "No incluyas la respuesta si todavía estás jugando". Se guarda con contexto: idioma, lenguaje de código, estado de la partida y user agent. Un reporte por jugador y Challenge (`already_reported`). Solo sobre Challenge `published` o `voided`. Límite: 10 por IP por hora |
| C-37 | Alertar al alcanzar el umbral | Sistema | Challenge, ChallengeReport | ACTION | alerted_at (timestamp) | Se marca **una sola vez** por Challenge (`alerted_at`) cuando hay ≥ 3 reportes `wrong_answer`/`ambiguous` de jugadores distintos, o cuando esos reportes superan el 5% de las Play terminadas con un mínimo de 2. Umbrales configurables. La alerta no envía mail: queda registrada en la base y se ve en la sección Reportes del admin. La alerta nunca anula nada |

**Criterios de Aceptación:**
- DADO un jugador jugando Devdle #8 en `es`
  CUANDO reporta `ambiguous` con el mensaje "dos palabras posibles"
  ENTONCES se guarda el reporte con `locale = es` y el estado de su partida.
- DADO que ese jugador ya reportó Devdle #8
  CUANDO intenta reportarlo de nuevo
  ENTONCES recibe `already_reported`.
- DADO que Big O #8 tiene 2 reportes `wrong_answer` de jugadores distintos y 200 partidas terminadas
  CUANDO llega un tercer reporte `wrong_answer` de otro jugador
  ENTONCES el desafío queda marcado como alertado y aparece destacado en la sección Reportes del admin con la cantidad de reportes
  Y un cuarto reporte no genera otra alerta.
- DADO 50 reportes coordinados contra un desafío
  CUANDO se alcanza el umbral
  ENTONCES solo queda marcado como alertado: el desafío sigue `published`.

**Prioridad:** Alta

**Dependencias:** F-03

---

### F-11: Admin — acceso, reportes y anulación

**Descripción:** App aparte en `admin.nerdose.dev` con una sola contraseña. El Responsable ve los reportes agrupados por desafío, los resuelve o descarta, y puede anular un desafío con error confirmado.

**Historia de usuario:**
Como responsable de la plataforma,
quiero revisar los reportes y anular un desafío roto,
para que un error del generador no castigue a los jugadores.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-38 | Iniciar sesión en el admin | U-02 | — | ACTION | password (string, req) | Contraseña única. Sesión de 8 horas. Credencial inválida, vencida o ausente → 401 y vuelta al login. Límite: 5 intentos por IP cada 15 min |
| C-39 | Ver reportes agrupados | U-02 | ChallengeReport, Challenge | READ | status (enum: open/resolved/dismissed, opt, default: open) | Agrupados por Challenge y ordenados por cantidad (desc). Los Challenge que alcanzaron el umbral (`alerted_at`) se marcan como alertados: es el aviso al Responsable. Para cada uno: el Challenge completo con su solución, en ES y EN, y los motivos, mensajes y contexto |
| C-40 | Resolver o descartar un reporte | U-02 | ChallengeReport | UPDATE | status (enum: resolved/dismissed, req) | Solo desde `open`; ambos estados son terminales |
| C-41 | Anular un desafío | U-02 | Challenge, Play, ChallengeReport, Term, TimelineFact | ACTION | void_reason (string, req), culprit.kind (enum: term/timeline_fact/template/none, req), culprit.id (uuid, opt, req si kind ∈ term/timeline_fact) | Solo un Challenge `published`, y siempre manual. Efectos: deja de aceptar jugadas y muestra "Este desafío tenía un error y fue anulado. Tu racha no se ve afectada"; todas sus Play pasan a `voided` (las terminadas conservan su `result`; las en curso se cierran como completadas); los reportes `open` pasan a `resolved`; si el culpable es un Term o TimelineFact, pasa a `rejected`; se recalculan los agregados de los jugadores afectados (C-35) |
| C-42 | Marcar un desafío anulado como completado | U-01 | Play | CREATE | challenge_number (int, req) | Solo para el Challenge `voided` de hoy y si el jugador no tenía Play. Crea una Play `voided`: cuenta para las rachas y `total_completed`, no para `played`, `wins` ni `extra` |

**Criterios de Aceptación:**
- DADO un token de admin emitido hace 8 h 1 min
  CUANDO el Responsable abre Reportes
  ENTONCES recibe 401 y vuelve al login.
- DADO Devdle #8 con 12 Play terminadas y 3 en curso, y el Term `REDIS` como culpable
  CUANDO el Responsable lo anula con `void_reason = "definición incorrecta"` y `culprit = { kind: term, id: <REDIS> }`
  ENTONCES las 15 Play pasan a `voided`, el Term `REDIS` pasa a `rejected`, los reportes abiertos pasan a `resolved`
  Y los 15 jugadores conservan su racha.
- DADO un jugador que no jugó Devdle #8, anulado hoy
  CUANDO toca "Marcar como completado"
  ENTONCES se crea su Play `voided` y su racha de Devdle y la global suman el día.
- DADO un Challenge `approved` de mañana
  CUANDO el Responsable intenta anularlo
  ENTONCES se rechaza: solo se anulan desafíos publicados.

**Prioridad:** Alta

**Dependencias:** F-10

---

### F-12: Admin — próximos desafíos y stock de contenido

**Descripción:** El Responsable ve los próximos 14 días de cada juego, con la solución y el log de verificación, y puede regenerar uno. También ve el stock de contenido de los bancos, la última carga del dataset y las palabras más rechazadas en Devdle.

**Historia de usuario:**
Como responsable de la plataforma,
quiero mirar lo que se va a publicar y cuánto contenido queda,
para anticipar problemas sin tener que cargar nada a mano.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-43 | Ver los próximos desafíos | U-02 | Challenge | READ | days (int, opt, default: 14) | Por día y por juego: preview real (como la ve el jugador, con la solución superpuesta), en ES y EN, con su log de verificación. Indica los días sin desafío, las fallas de generación registradas (intentos y motivo del último rechazo) y las regeneraciones pendientes |
| C-44 | Regenerar un desafío | U-02 | Challenge | ACTION | challenge_id (uuid, req) | Solo un Challenge `approved` con `date` > hoy. El actual sigue `approved` hasta que su reemplazo pasa la verificación; el reemplazo es atómico (el viejo pasa a `rejected`). Si la regeneración falla, queda el actual |
| C-45 | Ver el stock de contenido | U-02 | Term, TimelineFact, RejectedGuess | READ | — | Por banco: ítems aprobados disponibles, aprobados totales, rechazados (con su motivo), días de stock estimados, si el banco alcanza para ciclar respetando la ventana anti-repetición, y la última carga del dataset (fecha, versión, insertados, actualizados). Además, las 50 palabras más rechazadas en Devdle por cantidad de jugadores distintos. Solo lectura |

**Criterios de Aceptación:**
- DADO que hoy es 2026-12-01
  CUANDO el Responsable abre Próximos desafíos
  ENTONCES ve los días 2026-12-02 a 2026-12-15 con un desafío por juego y su log de verificación.
- DADO el Challenge `approved` de Grep Grid del 2026-12-05
  CUANDO el Responsable toca "Regenerar"
  ENTONCES la vista muestra "regeneración pendiente"
  Y en cuanto el nuevo pasa la verificación, el 2026-12-05 muestra el nuevo y el viejo queda `rejected`.
- DADO el Challenge `published` de hoy
  CUANDO el Responsable intenta regenerarlo
  ENTONCES se rechaza.

**Prioridad:** Media

**Dependencias:** F-11, F-14, F-15

---

### F-13: Admin — métricas

**Descripción:** Sección del admin con las métricas de uso, retención y calidad, calculadas desde la base (no desde Plausible). *Alcance agregado en el análisis técnico.*

**Historia de usuario:**
Como responsable de la plataforma,
quiero ver cuánta gente juega, si vuelve y qué desafíos fallan,
para saber si el producto se usa y si los desafíos funcionan bien.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-46 | Ver métricas | U-02 | Play, Player, PlayerStats, Challenge, ChallengeReport | READ | from (date, req), to (date, req) | **Jugadores únicos diarios**, total y por juego (Player distintos con alguna Play iniciada). **Retención D1/D7**: cohorte por fecha de la primera Play completada; % con una Play completada en cohorte+1 y cohorte+7. **Distribución de rachas globales** vivas por tramos (0, 1, 2–6, 7–29, 30+). **Calidad por desafío**: Play iniciadas, terminadas (won + lost), tasa de completado, % de victorias, reportes y estado. Se muestran en tablas |

**Criterios de Aceptación:**
- DADO que el 2026-12-01 hubo 120 jugadores en Devdle y 80 en Bug Hunt, 150 distintos en total
  CUANDO el Responsable consulta ese día
  ENTONCES ve 150 en total, 120 en Devdle y 80 en Bug Hunt.
- DADO 100 jugadores cuya primera Play completada fue el 2026-12-01, de los cuales 40 completaron alguna el 2026-12-02
  CUANDO consulta la retención
  ENTONCES ve D1 = 40% para la cohorte del 2026-12-01.
- DADO Big O #8 con 300 Play iniciadas, 290 terminadas y 23 ganadas
  CUANDO consulta la calidad por desafío
  ENTONCES ve tasa de completado 96,7% y victorias 7,9%.

**Prioridad:** Baja

**Dependencias:** F-11, F-09

---

### F-14: Generación, verificación y publicación automáticas

**Descripción:** El Sistema mantiene siempre desafíos aprobados para los próximos 14 días por juego, los verifica automáticamente (ejecutando el código cuando corresponde) y los publica en su fecha, sin revisión humana.

**Historia de usuario:**
Como responsable de la plataforma,
quiero que los desafíos se generen y publiquen solos,
para que nerdose funcione todos los días sin que yo intervenga.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-47 | Generar y verificar los próximos 14 días | Sistema | Challenge | CREATE | game_id (enum), date (date), number (int), payload (json), seed (string), generator_version (string), verification (json), status (enum: draft/approved/rejected) | Siempre hay Challenge `approved` para los próximos 14 días por juego. Nunca se genera para hoy. El seed depende de `game_id`, `date`, el número de intento y un secreto que no está en el repo. Si falla la verificación, se reintenta con un seed derivado. Un Challenge sin los textos en ES y EN no se aprueba. Lo que pasa la verificación se aprueba sin revisión humana. Se guarda el desafío generado, no solo el seed: el `payload` aprobado es inmutable. Sin LLM: todo por reglas y ejecución |
| C-48 | Publicar el desafío del día | Sistema | Challenge | UPDATE | status (approved → published) | Al cambiar el día (00:00 UTC) se publican los Challenge `approved` con `date` = hoy. Un `approved` de un día pasado nunca se publica: ese día queda neutro |
| C-49 | Alertar una falla de generación | Sistema | GenerationFailure | CREATE | game_id, date, attempts (int), last_reason (string) | Si tras 20 reintentos un juego no tiene el desafío de mañana, se registra una GenerationFailure, una sola por juego y fecha. No se envía mail: la falla se ve en el admin (Próximos desafíos) |

**Criterios de Aceptación:**
- DADO que hoy es 2026-12-01 y Tech Timeline tiene desafíos aprobados hasta el 2026-12-14
  CUANDO corre la generación
  ENTONCES se genera y verifica el del 2026-12-15.
- DADO un candidato de Grep Grid donde `REDIS` aparece 2 veces en la grilla
  CUANDO se verifica
  ENTONCES se rechaza y se genera otro con el seed del intento siguiente.
- DADO que Bug Hunt no logró un desafío válido para mañana tras 20 intentos
  CUANDO termina la corrida
  ENTONCES se registra la falla de generación de Bug Hunt para mañana y se ve en Próximos desafíos del admin
  Y la corrida siguiente no registra otra falla por la misma fecha.
- DADO el Challenge `approved` de Devdle del 2026-12-02
  CUANDO llega el primer request después de las 00:00 UTC del 2026-12-02
  ENTONCES pasa a `published` y es el desafío jugable del día.

**Prioridad:** Alta

**Dependencias:** F-15 (para Devdle, Grep Grid y Tech Timeline)

---

### F-15: Bancos de contenido y lista de palabras

**Descripción:** Los bancos `Term` y `TimelineFact` salen de un **dataset versionado en el repo**, generado offline por un script de importación desde Wikidata y Wikipedia, con reglas de aceptación. El `generator` lo carga en la base al arrancar. En producción no se consulta ninguna API de Wikimedia. La lista de palabras válidas de Devdle se arma en build y no crece sola.

**Historia de usuario:**
Como responsable de la plataforma,
quiero que el contenido salga de datos abiertos con reglas automáticas, guardado de antemano,
para no cargar ni aprobar nada a mano ni depender de una API externa en producción.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-50 | Importar el banco de términos | Sistema (script offline) | Term | CREATE | term, category (enum), definition `{es,en}`, summary `{es,en}`, wikidata_id, sitelinks, status, rejection_reason | Script `import:banks` que se corre a mano en desarrollo y escribe el dataset versionado. Desde Wikidata (conceptos de computación, por SPARQL) y el primer párrafo de Wikipedia en cada idioma. Se aprueba si: el nombre en inglés en mayúsculas es solo A–Z, de 4 a 12 letras; tiene descripción y artículo en ES y EN; tiene un mínimo de `sitelinks`; no está en la lista de exclusión; no es duplicado. Si no, `rejected` con su motivo. El script falla si quedan menos de 500 términos `approved` |
| C-51 | Importar el banco de hechos | Sistema (script offline) | TimelineFact | CREATE | label, category (enum), event_date, date_precision (enum), note `{es,en}`, wikidata_id, sitelinks, status, rejection_reason | Mismo script. Desde Wikidata (fecha de creación, fundación o publicación). Se aprueba si tiene una única fecha sin contradicciones, un mínimo de `sitelinks` y nota en ES y EN. Si la nota menciona un año distinto, se usa la descripción corta. Fecha discutida → `rejected`. Sin mínimo por categoría. El script falla si el total de hechos `approved` (todas las categorías juntas) es menor que 450 = 5 hechos por día × 90 días de ventana anti-repetición |
| C-52 | Cargar los bancos en la base | Sistema (generator) | Term, TimelineFact | CREATE / UPDATE | dataset_version | Al arrancar, el generator hace UPSERT del dataset por `wikidata_id`. Es idempotente. Nunca vuelve a `approved` un ítem que en la base está `rejected` y nunca pisa `last_used_*`. Registra la carga (versión, insertados, actualizados, rechazados) |

**Criterios de Aceptación:**
- DADO el ítem de Wikidata "Kubernetes" (label en `Kubernetes`, descripción y artículo en ES y EN, sitelinks sobre el mínimo)
  CUANDO se corre el script de importación
  ENTONCES el dataset incluye el Term `KUBERNETES` (10 letras) `approved`.
- DADO el ítem "C++"
  CUANDO se corre el script de importación
  ENTONCES el dataset lo incluye `rejected` con el motivo "caracteres fuera de A–Z".
- DADO un dataset nuevo desplegado con 40 términos más
  CUANDO arranca el generator
  ENTONCES se insertan los 40 términos y queda registrada la carga con su versión.
- DADO el Term `REDIS`, que en la base está `rejected` porque causó un desafío anulado, y que el dataset trae `approved`
  CUANDO arranca el generator
  ENTONCES `REDIS` sigue `rejected`.

**Prioridad:** Alta

**Dependencias:** Ninguna

---

### F-16: Analítica web

**Descripción:** Pageviews, orígenes del tráfico y clicks en compartir con Plausible Community Edition self-hosted, sin cookies. Viene integrado pero **apagado por defecto** y se activa con un flag de build.

**Historia de usuario:**
Como responsable de la plataforma,
quiero saber de dónde llega la gente y si el share trae visitas,
sin agregar cookies ni un banner.

**Capabilities:**

| ID | Capability | Actor | Entity | Operation | Key Fields | Business Rules |
|----|-----------|-------|--------|-----------|------------|----------------|
| C-53 | Registrar visitas y shares | Sistema | — | ACTION | evento `share:<game_id>` | Solo si el flag está activo; apagado, no se carga ningún script de terceros. Sin cookies. No se usa en el admin. No reemplaza a las métricas de C-46 |

**Criterios de Aceptación:**
- DADO el flag de analítica vacío
  CUANDO un jugador abre nerdose.dev
  ENTONCES no se pide ningún script de Plausible.
- DADO el flag activo apuntando al Plausible self-hosted
  CUANDO un jugador comparte Devdle
  ENTONCES se registra el evento `share:devdle`.

**Prioridad:** Baja

**Dependencias:** F-03

## Requerimientos No Funcionales

### Rendimiento

| ID | Requerimiento | Meta | Medición |
|----|--------------|------|----------|
| NFR-P01 | Respuesta de una jugada | < 300 ms (P95) | Tiempo de respuesta del endpoint de jugada |
| NFR-P02 | Carga inicial de la home en mobile | < 3 s en un celular con 4G | Lighthouse (perfil mobile) |
| NFR-P03 | Pico del cambio de día (00:00 UTC) | Se mantiene NFR-P01 con ~1.000 jugadores entrando en los primeros minutos | Load test del cambio de día |

### Seguridad y Anti-spoiler

| ID | Requerimiento | Meta | Medición |
|----|--------------|------|----------|
| NFR-S01 | Solución protegida | Ninguna respuesta incluye datos del `payload` fuera de la vista pública antes de que termine la Play | Tests de contrato por juego sobre todas las respuestas pre-resultado |
| NFR-S02 | Validación en el servidor | 100% de las jugadas se validan en el servidor; la API nunca ejecuta código | Revisión de código |
| NFR-S03 | Imprevisibilidad | El seed depende de un secreto fuera del repo; no se pueden calcular desafíos futuros con el código público | Revisión de configuración |
| NFR-S04 | IDs públicos | No revelan la solución (IDs opacos en Timeline, sin posiciones en Grep Grid, sin nodo del bug en Bug Hunt) | Tests de contrato |
| NFR-S05 | Transporte | HTTPS obligatorio | Configuración verificable |
| NFR-S06 | Cookie de jugador | HttpOnly, Secure, SameSite=Lax; sin PII | Inspección de la cookie |
| NFR-S07 | Acceso al admin | Contraseña única guardada hasheada; sesión de 8 h; 5 intentos de login por IP cada 15 min | Test funcional |
| NFR-S08 | Rate limiting | Sesión: 20/10 min por IP · Jugadas: 60/min por jugador y 300/min por IP · Reportes: 1 por jugador y desafío + 10/h por IP · Lecturas: 600/min por IP. HTTP 429 con mensaje genérico, sin captcha | Test funcional (verificar 429) |

### Privacidad

| ID | Requerimiento | Meta | Medición |
|----|--------------|------|----------|
| NFR-PR01 | Cookies | Una sola cookie funcional, sin cookies de terceros y **sin banner** | Inspección del navegador |
| NFR-PR02 | Analítica | Sin cookies; apagada por defecto | Inspección de requests |
| NFR-PR03 | Retención | Indefinida para jugadores anónimos (historial y rachas) | — |
| NFR-PR04 | Aviso | Aviso de privacidad y atribución CC BY-SA en "Acerca de", accesible desde `./about` en el header de todas las pantallas | Revisión visual |

### Usabilidad y Accesibilidad

| ID | Requerimiento | Meta | Medición |
|----|--------------|------|----------|
| NFR-U01 | Mobile-first | Usable desde 320 px de ancho (reflow WCAG) hasta desktop | Test visual en mobile y desktop |
| NFR-U02 | Accesibilidad | WCAG 2.1 AA (contraste, foco visible, labels) | axe-core sin violaciones + revisión manual |
| NFR-U03 | Teclado | Los 5 juegos se pueden jugar completos con teclado, incluido el drag & drop de Timeline | Test funcional por juego |
| NFR-U04 | Color | El feedback no depende solo del color (Devdle, Timeline): suma ícono o patrón | Revisión visual |
| NFR-U05 | Bilingüe | 100% de lo que lee el jugador existe en ES y EN, con textos naturales en cada idioma | Verificación de contenido + revisión de la UI |
| NFR-U06 | Duración de la partida | Mediana de 1 a 3 minutos por juego | `finished_at − started_at` de las Play terminadas |
| NFR-U07 | Diseño UI/UX fiel a la identidad del prototipo | `docs/nerdose.html` es la **fuente de verdad visual**: identidad (estética terminal/dev oscura, Inter para prosa y JetBrains Mono para el resto, acento `#3DDC84` y acento propio por juego), tipografía, radios, espaciado, sombras, texturas, layout, componentes y tono. Sus valores están formalizados en el Design System de `web` (`docs/design-system/web/`), que es lo que consumen las stories. No se pide una copia píxel a píxel: todo lo implementado, incluidas las piezas que el prototipo no tiene, tiene que reconocerse como el mismo producto | Revisión visual contra el prototipo y el Design System |

**Diseño base: `docs/nerdose.html`.** El prototipo tiene 7 pantallas: Home, Estadísticas, Devdle (partida), Bug Hunt (partida), Big O (resultado), Tech Timeline (resultado) y Grep Grid (partida). Las que no están (instrucciones de cada juego, resultados faltantes, "Acerca de", formulario de reporte, avisos de anulación y de "sin desafío", y todo el admin) se diseñan extendiendo su mismo lenguaje visual.

**Precedencia:** en lo visual (estética, tipografía, radios, espaciado, componentes, layout) **manda el prototipo**, a través del Design System de `web`. Los agentes pueden tomar decisiones y crear piezas nuevas (un botón, un estado, una pantalla) derivándolas de la identidad descrita en el README del DS, y las documentan en el DS; lo que no pueden es contradecir valores ya definidos ni caer en estilos genéricos. En datos y métricas que se muestran, reglas de juego, textos y accesibilidad (NFR-U01 a NFR-U05) **manda el PRD**: si el prototipo choca con WCAG 2.1 AA o con el ancho mínimo de 320 px, se adapta lo mínimo necesario y la adaptación queda documentada en el DS. Por ejemplo, las estadísticas que muestra el prototipo pueden cambiar según C-34.

**Cambios ya decididos respecto del prototipo** (nerdose hace lo que dice el PRD; el prototipo es anterior a estas decisiones):
- **Grep Grid sin tiempo:** el prototipo muestra un reloj ("02:14 tiempo"); se reemplaza por el contador `N/8 encontradas` (decisión #6). Se agrega el botón **"Rendirse"** (decisión #7).
- **Reportar un problema:** el prototipo no lo tiene; se agrega en cada juego, durante la partida y en el resultado (C-36).
- **Número de desafío:** el header del prototipo muestra "desafío del 30/10"; se suma el `#número`, que es lo que usa el share (decisión #12).
- **Estados de la home:** además de "resuelto" y "pendiente", la home muestra "en curso", "sin desafío hoy" y "anulado" (C-05).
- **Selector de lenguaje de código** en Big O y Bug Hunt (C-26), si el prototipo no lo expone en todas las pantallas.
- **Accesibilidad:** el feedback no depende solo del color y todo se juega con teclado (NFR-U03, NFR-U04), aunque el prototipo no lo resuelva.

### Escalabilidad

| ID | Requerimiento | Meta | Fase |
|----|--------------|------|------|
| NFR-SC01 | Capacidad | ~1.000 jugadores diarios, con pico a las 00:00 UTC, en una sola instancia de API y un PostgreSQL | MVP |
| NFR-SC02 | Extensibilidad | Sumar un juego nuevo como módulo, sin cambiar la API, el shell ni las rachas | MVP |
| NFR-SC03 | Escalado horizontal | Varias instancias de API (rate limit y caches en un store compartido) | Post-MVP |

### Disponibilidad

| ID | Requerimiento | Meta | Fase |
|----|--------------|------|------|
| NFR-A01 | SLA | Sin SLA: tolera caídas | MVP |
| NFR-A02 | Cambio de día | La publicación del día no depende de que un proceso aparte esté vivo a las 00:00 UTC | MVP |
| NFR-A03 | Margen del generador | Con 14 días de desafíos aprobados por adelantado, una caída del generador de hasta 13 días no deja a ningún juego sin desafío | MVP |

## Supuestos

- Los jugadores tienen conexión a internet mientras juegan (no hay modo offline).
- Los jugadores usan navegadores modernos con soporte de Web Share o Clipboard API; si falta el share nativo, se copia al portapapeles.
- ~1.000 jugadores diarios el primer año, como orden de magnitud.
- Perder la cookie significa perder el historial y las rachas; es un límite aceptado mientras no haya cuentas.
- Un jugador puede borrar la cookie, perder adrede y ver la respuesta. Se acepta porque no hay rankings.
- Wikidata y Wikipedia tienen cobertura suficiente en ES y EN para llenar los bancos en las categorías v1 (a validar, ver Preguntas Abiertas).
- Los bancos se reutilizan cuando vence su ventana anti-repetición (365 días en Devdle, 30 en Grep Grid, 90 en Timeline). Con un dataset suficientemente grande, el contenido no se agota y no hace falta reponerlo seguido.

## Preguntas Abiertas

- **Cobertura real de Wikidata/Wikipedia:** ¿cuántos ítems aprobables hay por categoría de Term y TimelineFact, y qué calidad tienen los textos en español? Se valida con la primera corrida del script de importación antes del lanzamiento.
- **Mínimo de `sitelinks`:** el valor concreto para aprobar un Term o un TimelineFact no está definido. Se calibra con esa primera corrida.
- **Lista de exclusión de términos:** su contenido inicial no está definido (por ejemplo, términos ofensivos o demasiado genéricos).
- **Fecha de lanzamiento:** define el desafío #1 y la numeración; todavía no está fijada.
- **Diccionario:** el análisis técnico eligió ENABLE sobre SCOWL; confirmar al armar la lista base.

