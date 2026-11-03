---
created: 2026-11-03
last_updated: 2026-11-03
status: "Análisis de dominio cerrado"
analisis_funcional: "docs/discovery/analisis-funcional.md"
---

# Análisis de Dominio — nerdose

> DDD-light. Los nombres de entidades, campos y valores de enums están **en inglés** y se transcriben tal cual al PRD, las APIs, los schemas y el código. Las definiciones y las reglas están en español.

## Lenguaje Ubicuo

| Término | Definición | Notas |
|---|---|---|
| Game (Juego) | Uno de los minijuegos de la plataforma, con mecánica, puntaje y stats propias | Enum `game_id`, no es una tabla. Registro en el código (`GameDefinition`) |
| Platform day (Día de la plataforma) | Día calendario UTC; cambia a las 00:00 UTC | "Hoy" siempre lo calcula el servidor |
| Challenge number (Número de desafío) | Número del día de la plataforma, donde #1 es el día de lanzamiento | Es el mismo para los 5 juegos ese día; se usa en el share |
| Challenge (Desafío) | Contenido jugable de un juego para un día, con su solución y su explicación | Uno por juego y día. No confundir con Play |
| Payload | Contenido completo del desafío, **con la solución** | Nunca sale del servidor antes de terminar la partida |
| Public view (Vista pública) | Lo que el cliente ve del desafío antes de terminar | Sin nada que revele la solución |
| Play (Partida) | El intento de un jugador sobre un desafío | Una por jugador y desafío |
| Move (Jugada) | Una acción del jugador dentro de una partida (un intento de Devdle, una selección de Grep Grid, una confirmación) | Se valida en el servidor |
| Completed (Completada) | Partida terminada, ganada o perdida, o anulada | Una partida a medias no está completada |
| Win (Victoria) | Partida terminada que cumple el criterio de victoria de su juego | Ver la tabla de criterios por juego |
| Voided (Anulado) | Desafío retirado manualmente por un error confirmado. También se dice de sus partidas | Cuenta para la racha; no cuenta como victoria ni como derrota |
| Streak (Racha) | Días de la plataforma consecutivos con al menos una partida completada | Por juego (`game streak`) y global (`global streak`) |
| Neutral day (Día neutro) | Día en el que un juego no tuvo desafío publicado | No suma ni corta la racha de ese juego |
| Live streak (Racha viva) | Racha cuyo último día completado es hoy o ayer | Si no está viva, se muestra 0 |
| Player (Jugador) | Identidad anónima de quien juega, guardada en el servidor y referida por una cookie | No es User |
| User (Usuario) | Cuenta autenticada | Fuera de v1; placeholder |
| Report (Reporte) | Aviso de un jugador sobre un problema en un desafío | Uno por jugador y desafío |
| Alert threshold (Umbral de alerta) | Condición de reportes que dispara una notificación al responsable | Nunca anula automáticamente |
| Content bank (Banco de contenido) | Conjunto de ítems verificados a partir del cual se arman desafíos | `Term`, `TimelineFact` |
| Term (Término) | Término técnico con definición y resumen en ES/EN | Lo usan Devdle y Grep Grid |
| Timeline fact (Hecho) | Hito tech con fecha y nota en ES/EN | Lo usa Tech Timeline |
| Valid word list (Lista de palabras válidas) | Palabras que Devdle acepta como intento | La base se arma en build y se amplía con `WordListAddition` |
| Code language (Lenguaje de código) | Lenguaje en el que se muestra el código de Bug Hunt y Big O | `js / go / java`. Es una vista: no cambia la respuesta |
| Recipe (Receta) | Combinación de bloques con costo conocido con la que se genera un desafío de Big O | |
| Template / Mutation (Plantilla / Mutación) | Función correcta parametrizada / cambio único que introduce el bug en Bug Hunt | |
| Seed | Valor derivado de `game_id + date + secreto` con el que se generan los desafíos | Reproducible, pero imposible de predecir sin el secreto |
| Verification (Verificación) | Chequeo automático (ejecución, unicidad, idiomas) que un desafío o ítem debe pasar para aprobarse | |
| Give up (Rendirse) | Acción de Grep Grid que cierra la partida como derrota con N/8 | |

## Entidades

### Player
- **Atributos clave:** id (uuid, req), locale (enum: es/en, default: el del navegador, si no `es`), preferred_code_language (enum: js/go/java, default: js), user_id (uuid, opt, ref User), created_at (timestamp, req), last_seen_at (timestamp, req)
- **Relaciones:** has_many Play, has_many PlayerGameStats (uno por juego jugado), has_one PlayerStats, has_many ChallengeReport, belongs_to User (opt)
- **Notas:** Se crea en la primera visita y se identifica por una cookie funcional httpOnly. No guarda PII. Si se borra la cookie, se crea otro Player (no hay recuperación en v1). `preferred_code_language` se actualiza con el lenguaje con el que confirmó en Bug Hunt o Big O. Retención indefinida.

### User *(placeholder, fuera de v1)*
- **Atributos clave:** id (uuid, req), email (string, req, único), created_at (timestamp, req)
- **Relaciones:** has_many Player
- **Notas:** No se implementa en v1. Al loguearse en un dispositivo con un Player anónimo, se fusionan las Play (ante conflicto en el mismo desafío, queda la más antigua) y se recalculan los agregados.

### Challenge
- **Atributos clave:** id (uuid, req), game_id (enum: devdle/bug-hunt/big-o/timeline/grep-grid, req), date (date UTC, req), number (int, req, ≥ 1, = días desde el lanzamiento + 1), payload (json, req, específico del juego, incluye la solución y los textos `{es, en}`), status (enum: draft/approved/published/rejected/voided, default: draft), generator_version (string, req), seed (string, req), verification (json, req, log de la verificación), void_reason (string, opt, req si status=voided), voided_at (timestamp, opt), alert_sent_at (timestamp, opt), created_at (timestamp, req)
- **Relaciones:** has_many Play, has_many ChallengeReport, references Term (Devdle: 1; Grep Grid: 8), references TimelineFact (Timeline: 5)
- **Notas:** Único por (game_id, date) entre los desafíos no `rejected`. El payload es inmutable desde que se aprueba. El contenido de `payload` por juego:

| game_id | Payload (resumen) | Vista pública |
|---|---|---|
| devdle | term_id, word, category, definition `{es,en}`, summary `{es,en}` | length, possible_categories |
| grep-grid | grid (12×12), words (8 term_id + word + definition), placements (posición y dirección de cada palabra) | grid, words |
| timeline | category, prompt `{es,en}`, items (5: fact_id, opaque_id, label, event_date, date_precision, note `{es,en}`), correct_order (opaque_ids) | category, prompt, items mezclados (opaque_id, label) |
| big-o | recipe, recipe_category, code `{js,go,java}`, answer (enum big_o_option), explanation `{es,en}` | code, options (las 8) |
| bug-hunt | template, params, tree, bug_node_id, bug_type, mutation, fix (diff), spec `{es,en}`, code `{js,go,java}`, line_of `{js,go,java}`, pickable_lines, visible_tests, failing_test, explanation `{es,en}` | spec, code, pickable_lines, visible_tests |

  Enums auxiliares del payload:
  - `big_o_option` (enum: o_1/o_log_n/o_n/o_n_log_n/o_n2/o_n3/o_2n/o_n_fact)
  - `recipe_category` (enum: simple_loops/nested_loops/recursion/divide_and_conquer/binary_search, conjunto inicial que se amplía con el catálogo de bloques)
  - `bug_type` (enum: off_by_one/comparison/wrong_operator/wrong_variable/bad_initialization/misplaced_return/inverted_condition)

### Play
- **Atributos clave:** id (uuid, req), player_id (uuid, req), challenge_id (uuid, req), game_id (enum game_id, req, denormalizado), date (date UTC, req, denormalizado), state (json, req, estado propio del juego), status (enum: in_progress/won/lost/voided, default: in_progress), result (json, opt, req si status ∈ won/lost), code_language (enum: js/go/java, opt, solo bug-hunt y big-o: el lenguaje con el que confirmó), score (int, opt), started_at (timestamp, req), finished_at (timestamp, opt, req si status ≠ in_progress)
- **Relaciones:** belongs_to Player, belongs_to Challenge
- **Notas:** Único por (player_id, challenge_id). Es la fuente de verdad del historial: los agregados de stats se recalculan a partir de Play. Si queda en `in_progress` en un día pasado, queda así para siempre y no cuenta. Criterios por juego:

| game_id | State | Fin de partida | Score | Win | Etiqueta en el historial |
|---|---|---|---|---|---|
| devdle | guesses (con feedback por letra) | adivina o 6 intentos válidos | intentos usados (1–6) | adivinó | "✓ 4/6" / "✗ X/6" |
| grep-grid | found_words | 8 encontradas o se rinde | palabras encontradas (0–8) | 8/8 | "8/8" / "5/8" |
| timeline | — | 1 confirmación | posiciones correctas (0–5) | 5/5 | "3/5" |
| big-o | — | 1 confirmación | 1/0 | opción correcta | "✓ O(n log n)" / "✗" |
| bug-hunt | — | 1 confirmación | 1/0 | línea correcta | "✓ L7" / "✗ L7" |

### PlayerGameStats
- **Atributos clave:** player_id (uuid, req), game_id (enum game_id, req), current_streak (int, req, default: 0), max_streak (int, req, default: 0), played (int, req, default: 0), wins (int, req, default: 0), last_completed_date (date, opt), extra (json, req, stats propias del juego)
- **Relaciones:** belongs_to Player
- **Notas:** PK (player_id, game_id). Es un agregado que se actualiza en la misma transacción que cierra la Play. `played` y `wins` excluyen las Play `voided`. Contenido de `extra`:
  - devdle: distribución de intentos (1–6 y derrotas);
  - grep-grid: promedio de palabras encontradas y porcentaje de 8/8;
  - timeline: promedio de posiciones correctas por categoría;
  - big-o: aciertos por `recipe_category`;
  - bug-hunt: aciertos por `code_language` y por `bug_type`.

### PlayerStats
- **Atributos clave:** player_id (uuid, req), global_streak (int, req, default: 0), max_global_streak (int, req, default: 0), last_active_date (date, opt), total_completed (int, req, default: 0)
- **Relaciones:** belongs_to Player
- **Notas:** Es un agregado global. Se actualiza en la misma transacción que cierra la Play. `total_completed` incluye las Play `voided`.

### ChallengeReport
- **Atributos clave:** id (uuid, req), challenge_id (uuid, req), player_id (uuid, req), reason (enum: wrong_answer/ambiguous/wrong_explanation/translation/display_bug/other, req), message (string, opt, max: 1000), locale (enum: es/en, req), context (json, req: code_language, estado de la partida, user agent), status (enum: open/resolved/dismissed, default: open), created_at (timestamp, req)
- **Relaciones:** belongs_to Challenge, belongs_to Player
- **Notas:** Único por (player_id, challenge_id). Se puede crear durante la partida o en el resultado. Solo `wrong_answer` y `ambiguous` cuentan para el umbral de alerta.

### Term
- **Atributos clave:** id (uuid, req), term (string, req, único, solo A–Z en mayúsculas, 4–12 letras), category (enum: programming_languages/git/databases/networking/linux/apis/security/software_engineering, req), definition (json `{es,en}`, req), summary (json `{es,en}`, req), example (json `{es,en}`, opt, futuro), wikidata_id (string, req, único), sitelinks (int, req), status (enum: draft/approved/rejected, default: draft), rejection_reason (string, opt), last_used_devdle (date, opt), last_used_grep (date, opt)
- **Relaciones:** referenced_by Challenge (devdle, grep-grid)
- **Notas:** Solo los `approved` se pueden usar. Para aprobarse necesita los dos idiomas, artículo de Wikipedia en ES y EN, un mínimo de `sitelinks` y no estar en la lista de exclusión. Se llena solo desde Wikidata. Pasa a `rejected` si un desafío anulado lo señala como causa.

### TimelineFact
- **Atributos clave:** id (uuid, req), label (string, req), category (enum: programming_languages/frameworks/companies/operating_systems/hardware/video_games, req), event_date (date, req), date_precision (enum: year/month/day, req), note (json `{es,en}`, req), wikidata_id (string, req, único), sitelinks (int, req), status (enum: draft/approved/rejected, default: draft), rejection_reason (string, opt), last_used (date, opt)
- **Relaciones:** referenced_by Challenge (timeline)
- **Notas:** Se requiere una única fecha, sin contradicciones en Wikidata. Si la nota menciona un año distinto del de `event_date`, se usa la descripción corta. Las categorías `internet` y `general_history` quedan diferidas hasta tener una fuente fiable.

### RejectedGuess
- **Atributos clave:** word (string, req, A–Z), player_id (uuid, req), created_at (timestamp, req)
- **Relaciones:** belongs_to Player
- **Notas:** PK (word, player_id): cuenta jugadores distintos, no intentos. Se registra cada vez que un intento de Devdle se rechaza por no estar en la lista.

### WordListAddition
- **Atributos clave:** word (string, req, único, A–Z, 4–12 letras), source (enum: wikidata/wiktionary, req), distinct_players (int, req, ≥ 5), added_at (timestamp, req)
- **Relaciones:** — (se deriva de RejectedGuess)
- **Notas:** Son las palabras que se suman solas a la lista base de Devdle. La API las une con la lista base al cargar la lista válida.

## Ciclos de Vida y Estados

### Challenge

| Estado | Cuándo | Transiciones permitidas | Prohibidas |
|---|---|---|---|
| draft | Lo generó el Generator y está en verificación | → approved, → rejected | → published, → voided |
| approved | Pasó la verificación; espera su fecha | → published (a las 00:00 UTC de su fecha), → rejected (regenerar desde el admin) | → draft, → voided |
| published | Llegó su fecha: se puede jugar si es hoy | → voided | → draft, → approved, → rejected |
| rejected | Falló la verificación o se reemplazó al regenerar | (terminal) | → cualquier otro |
| voided | Un admin lo anuló por un error confirmado | (terminal) | → cualquier otro |

### Play

| Estado | Cuándo | Transiciones permitidas | Prohibidas |
|---|---|---|---|
| in_progress | Primera vista o jugada del desafío de hoy | → won, → lost (solo mientras `date` = hoy), → voided (al anularse el desafío) | → won/lost si `date` < hoy |
| won | Se cumplió el criterio de victoria | → voided (al anularse el desafío) | → in_progress, → lost |
| lost | Terminó sin cumplir el criterio (intentos agotados, respuesta incorrecta, rendirse) | → voided (al anularse el desafío) | → in_progress, → won |
| voided | Su desafío se anuló, o el jugador marcó como completado un desafío anulado de hoy | (terminal) | → cualquier otro |

### ChallengeReport

| Estado | Cuándo | Transiciones permitidas | Prohibidas |
|---|---|---|---|
| open | Recién creado | → resolved, → dismissed | — |
| resolved | El admin confirmó el problema (anuló el desafío o registró la causa) | (terminal) | → open |
| dismissed | El admin lo descartó | (terminal) | → open |

### Term / TimelineFact

| Estado | Cuándo | Transiciones permitidas | Prohibidas |
|---|---|---|---|
| draft | Importado desde Wikidata, sin validar | → approved, → rejected | — |
| approved | Pasó las reglas del banco | → rejected (causa de un desafío anulado) | → draft |
| rejected | No pasó las reglas, o causó un error confirmado | (terminal) | → approved, → draft |

## Invariantes y Reglas de Negocio

**Desafíos**

1. **Challenge** — Hay a lo sumo un Challenge no `rejected` por (game_id, date).
2. **Challenge** — El `payload` de un Challenge `approved`, `published` o `voided` es inmutable. Cambiar el generador no altera desafíos ya generados.
3. **Challenge** — Solo un Challenge `published` cuya `date` es hoy (UTC) acepta jugadas.
4. **Challenge** — Un desafío pasa a `approved` solo si la verificación pasó, incluidos todos los textos en ES y EN.
5. **Challenge** — `number` = días transcurridos desde el lanzamiento + 1, igual para todos los juegos ese día.
6. **Challenge** — Solo se puede regenerar un Challenge `approved` con `date` > hoy. Nunca uno `published`.
7. **Challenge** — Anular es siempre una acción manual del admin, y requiere `void_reason`.
8. **Challenge (Devdle)** — El término no se usó en Devdle en los últimos 365 días, y su categoría difiere de las de los últimos 3 días.
9. **Challenge (Grep Grid)** — Cada una de las 8 palabras aparece exactamente una vez en la grilla, en las direcciones permitidas (horizontal, vertical y diagonal, solo hacia adelante). Ninguna se usó en Grep Grid en los últimos 30 días.
10. **Challenge (Timeline)** — Los 5 hechos son de una misma categoría, se ordenan sin ambigüedad (≥ 1 año de diferencia o precisión suficiente) y no se usaron en los últimos 90 días. Los `opaque_id` son aleatorios por desafío.
11. **Challenge (Big O)** — La respuesta calculada coincide con la medida al ejecutar, y ninguna otra opción se ajusta casi igual de bien. No se repite la receta en 30 días, y la misma respuesta no sale más de 2 días seguidos.
12. **Challenge (Bug Hunt)** — La versión correcta da el mismo resultado en los 3 lenguajes. La mutada falla al menos un test, con el mismo resultado en los 3, y al menos 2 tests siguen pasando. El bug está en una línea elegible. No se repite la combinación plantilla + parámetros + mutación en 60 días.

**Partidas**

13. **Play** — Hay a lo sumo una Play por (player_id, challenge_id).
14. **Play** — Una Play que no está `in_progress` no acepta jugadas.
15. **Play** — Una jugada sobre una Play cuya `date` < hoy se rechaza (`challenge_expired`).
16. **Play (Devdle)** — Un intento que no está en la lista de palabras válidas no consume intento ni cambia el estado.
17. **Play (Bug Hunt / Big O / Timeline)** — Es exactamente una confirmación. Cambiar `code_language` antes de confirmar no altera la Play.
18. **Anti-spoiler** — Antes de que la Play termine, ninguna respuesta del servidor incluye datos del `payload` fuera de la vista pública (solución, posiciones, orden, línea del bug, test que falla, lista de respuestas de Devdle).

**Progreso**

19. **Streak** — Una Play cuenta como completada si su estado es `won`, `lost` o `voided`.
20. **PlayerGameStats** — `current_streak` = días consecutivos hasta `last_completed_date` con una Play completada del juego, salteando los días neutros (sin Challenge publicado de ese juego).
21. **PlayerStats** — `global_streak` = días consecutivos con al menos una Play completada de cualquier juego. Un día es neutro solo si ningún juego tuvo Challenge publicado.
22. **Streak** — La racha se muestra viva solo si el último día completado es hoy o ayer, contando los días neutros intermedios. Si no, se muestra 0, sin necesidad de un job de reseteo.
23. **Stats** — Las Play `voided` cuentan para las rachas y para `total_completed`, pero no para `played`, `wins` ni `extra`.
24. **Stats** — Los agregados (PlayerGameStats, PlayerStats) se actualizan en la misma transacción que cierra la Play, y siempre se pueden recalcular desde Play. Al anular un desafío se recalculan los de los jugadores afectados.
25. **Player** — Tiene a lo sumo un PlayerGameStats por juego y un PlayerStats.

**Calidad**

26. **ChallengeReport** — Hay a lo sumo un reporte por (player_id, challenge_id), y solo sobre desafíos `published` o `voided`.
27. **ChallengeReport** — Se alerta una sola vez por desafío (`alert_sent_at`), cuando hay ≥ 3 reportes `wrong_answer`/`ambiguous` de jugadores distintos o cuando superan el 5% de las Play completadas. Los umbrales son configurables.
28. **Challenge voided** — Al anular, todas sus Play pasan a `voided` y conservan su `result`. Si es el desafío de hoy, un jugador sin Play puede crear una directamente en `voided`.

**Contenido**

29. **Term / TimelineFact** — Solo los ítems `approved` se usan en desafíos, y `approved` exige los textos en ES y EN.
30. **Term** — `term` es A–Z en mayúsculas, de 4 a 12 letras, y único.
31. **WordListAddition** — Una palabra se suma solo si ≥ 5 Player distintos la intentaron (RejectedGuess) y existe como nombre de un ítem de Wikidata o como entrada de Wiktionary.
32. **Bancos** — Cuando a un banco le queda stock sin usar para menos de un año, se repone automáticamente.
33. **Generación** — El seed depende de un secreto fuera del repo. Hay desafíos `approved` para los próximos 14 días por juego.

## Eventos de Dominio

| Evento | Disparado por | Datos clave | Contexto |
|---|---|---|---|
| PlayerCreated | Primera visita sin cookie | player_id, locale | Identity |
| PlayerPreferencesChanged | Cambio de idioma o de lenguaje de código preferido | player_id, locale, preferred_code_language | Identity |
| ChallengeGenerated | El Generator produce un desafío en `draft` | challenge_id, game_id, date, seed | Challenge Publishing |
| ChallengeApproved | Pasa la verificación | challenge_id, game_id, date | Challenge Publishing |
| ChallengeRejected | Falla la verificación o se regenera | challenge_id, game_id, date, reason | Challenge Publishing |
| ChallengeGenerationFailed | N reintentos fallidos para una fecha próxima | game_id, date, attempts | Challenge Publishing |
| ChallengePublished | Llega su fecha (00:00 UTC) | challenge_id, game_id, date, number | Challenge Publishing |
| PlayStarted | Primera vista o jugada del desafío de hoy | play_id, player_id, challenge_id | Gameplay |
| GuessRejected | Intento de Devdle fuera de la lista | word, player_id | Gameplay |
| MoveApplied | Jugada válida | play_id, move, feedback | Gameplay |
| PlayFinished | La Play pasa a `won` o `lost` | play_id, player_id, game_id, date, status, score, code_language | Gameplay |
| StreaksUpdated | Consecuencia de PlayFinished o del recálculo por anulación | player_id, game_id, current_streak, global_streak | Progress |
| ChallengeReported | Un jugador envía un reporte | report_id, challenge_id, reason, locale | Quality |
| ReportThresholdReached | Se supera el umbral de alerta | challenge_id, report_count, ratio | Quality |
| ChallengeVoided | El admin anula un desafío | challenge_id, void_reason, culprit (term/fact/template) | Quality → Challenge Publishing, Progress, Content Banks |
| ReportResolved / ReportDismissed | Acción del admin sobre un reporte | report_id, status | Quality |
| ContentItemApproved / ContentItemRejected | Reposición del banco o anulación | item_id, bank, reason | Content Banks |
| ContentBankReplenished | Job semanal de reposición | bank, imported, approved, rejected, stock | Content Banks |
| WordListExtended | Promoción de una palabra rechazada | word, source | Content Banks |

## Contextos Delimitados

| Contexto | Entidades | Responsabilidad | Servicio(s) |
|---|---|---|---|
| Identity | Player, User (futuro) | Jugador anónimo, cookie, preferencias (idioma, lenguaje de código), fusión futura con User | `api` |
| Gameplay | Play, RejectedGuess (lectura de Challenge) | Servir la vista pública, validar jugadas con el `GameDefinition` de cada juego, cerrar partidas, aplicar el anti-spoiler, validar la lista de palabras de Devdle | `api` (registro de juegos) + `web` (UI de cada juego) |
| Progress | PlayerGameStats, PlayerStats | Rachas, días neutros, stats propias por juego, historial y heatmap; recálculo desde Play | `api` |
| Quality | ChallengeReport (y la anulación de Challenge) | Recibir reportes, umbral de alerta, gestión de reportes, anular desafíos | `api` (rutas `/admin/*`, con JWT) + `admin` (UI) |
| Challenge Publishing | Challenge | Generar, verificar, aprobar, regenerar y publicar desafíos con 14 días de anticipación; alertar fallas de generación | `generator` (único que crea desafíos) |
| Content Banks | Term, TimelineFact, WordListAddition | Reponer bancos desde Wikidata y Wikipedia, aplicar las reglas de aceptación, ampliar la lista de palabras | `generator` |

Además hay dos frontends: `web` (shell, catálogo, juegos, stats) y `admin` (reportes, próximos desafíos, stock), y un PostgreSQL compartido.

**Relaciones entre contextos:**
- **Challenge Publishing → Gameplay** (upstream): Gameplay solo lee los Challenge `published` de hoy. La única escritura de la API sobre Challenge es la anulación (Quality), que cambia `status`, `void_reason`, `voided_at` y `alert_sent_at`, nunca el `payload`.
- **Content Banks → Challenge Publishing** (upstream): los generadores eligen ítems `approved` y marcan su `last_used_*`.
- **Gameplay → Progress** (downstream, en la misma transacción): cada PlayFinished actualiza los agregados.
- **Quality → Progress, Content Banks**: ChallengeVoided dispara el recálculo de agregados y el rechazo del ítem que causó el error.
- **Gameplay → Content Banks**: los RejectedGuess alimentan WordListAddition (promoción en el `generator`). La API recarga la lista válida con las adiciones.
- **Identity** es compartido: todos los contextos de jugador referencian `player_id`.

## Notas de Consistencia

- **Grep Grid sin tiempo:** el `ARCHITECTURE.md` todavía menciona el tiempo oficial (`started_at`/`finished_at`), el endpoint `/start` y "tiempo promedio y mejor tiempo". Según la decisión funcional #6, se reemplazan por palabras encontradas. Hay que actualizar `ARCHITECTURE.md` en la fase técnica.
- **Estado `voided` en Play:** `ARCHITECTURE.md` define `plays.status` como `in_progress | won | lost`. Este modelo suma `voided`, por la decisión #13 y el invariante 28.
- **Categorías de Timeline:** el brief lista 8 categorías; el modelo v1 tiene 6 (decisión #9). `internet` y `general_history` quedan diferidas.
- **Tabla de Term:** se agregó `rejection_reason`, y `last_used` en TimelineFact, para trazar el rechazo por anulación y la regla de no repetir en 90 días.
- **Nuevos en el modelo:** `Play.code_language`, `Play.score`, `Player.preferred_code_language`, `Challenge.void_reason / voided_at / alert_sent_at` y `WordListAddition` no estaban en `ARCHITECTURE.md`; surgen de decisiones de este discovery.
