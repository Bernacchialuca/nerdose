# Arquitectura — nerdose

> ⚠️ **Documento histórico, superado.** La arquitectura vigente está en [`prd/architecture.md`](prd/architecture.md), los ADRs de [`adrs/`](adrs/), [`apis/api.yaml`](apis/api.yaml), [`db-schemas/nerdose-db.md`](db-schemas/nerdose-db.md) y [`architectures/`](architectures/). Este archivo tiene decisiones que se cambiaron después (por ejemplo, Grep Grid con tiempo, Node 22, webhook, reposición de bancos en vivo). No usarlo como fuente.

> Documento vivo. Complementa a [brief.md](brief.md), que define el producto; acá se define cómo se construye.
> Última actualización: 2026-11-03.

## 1. Resumen

nerdose es una plataforma de minijuegos diarios para developers. El MVP incluye cinco juegos: **Devdle**, **Bug Hunt**, **Big O Challenge**, **Tech Timeline** y **Grep Grid**.

La arquitectura se apoya en tres ideas:

1. **El servidor es dueño de la verdad.** El cliente nunca recibe la solución de un desafío. Cada jugada se valida en el servidor, y la respuesta y la explicación llegan recién cuando la partida terminó.
2. **El contenido se genera antes de publicarse, nunca en el request.** Un generador offline llena los desafíos de los próximos días, los verifica automáticamente y los guarda. Cuando un jugador juega, la API solo lee.
3. **Cada juego es un módulo enchufable.** Todos implementan el mismo contrato (`GameDefinition`). La API, el shell del front y el sistema de rachas no conocen ningún juego en particular. Sumar un juego nuevo es sumar un paquete.

## 2. Decisiones

| # | Decisión | Motivo |
|---|---|---|
| D1 | TypeScript en front, back y generador, dentro de un monorepo | Los contratos de cada juego (jugadas, resultados) y los schemas de validación se escriben una sola vez |
| D2 | PostgreSQL como única base de datos | Relacional para jugadores, partidas y rachas, más `jsonb` para el payload propio de cada juego. No hace falta Redis en el MVP |
| D3 | Validación 100% server-side | Requisito del brief (§11): el resultado no puede obtenerse desde el cliente |
| D4 | El día de la plataforma es UTC | Todos los desafíos cambian a las 00:00 UTC (21:00 en Argentina). Simplifica la consistencia y el cálculo de rachas |
| D5 | Desafíos pregenerados con ~14 días de anticipación | Consistencia entre jugadores, margen para reintentar si un generador falla, y cambiar el generador no altera desafíos ya publicados |
| D6 | Los juegos de código (Big O, Bug Hunt) se generan desde un árbol de código con un emisor por lenguaje (JS, Go, Java) | Un desafío, tres lenguajes, la misma respuesta. Sumar un lenguaje es sumar un emisor |
| D7 | Los desafíos generados se verifican ejecutándolos | Ninguna respuesta depende de que el generador "tenga razón": la ejecución lo prueba |
| D8 | La API nunca ejecuta código | Solo el generador, offline, ejecuta código. La API queda simple, rápida y sin superficie de sandbox |
| D9 | Jugadores anónimos con identidad server-side, separados de `users` | Permite stats y rachas sin login hoy, y sumar autenticación después sin migrar datos |
| D10 | Async Arena queda fuera del MVP | El orden de ejecución depende del modelo de concurrencia de cada lenguaje (no determinista en Go y Java). Se reemplaza por Bug Hunt |
| D11 | Perder también cuenta como completar | Las rachas miden constancia, no aciertos. El porcentaje de victorias ya refleja los aciertos |
| D12 | Sin archivo de desafíos pasados | Solo se juega el desafío de hoy. Si un día no jugaste, ese desafío ya no está disponible |
| D13 | Bilingüe ES/EN desde el MVP | Todo el contenido que lee el jugador se guarda en los dos idiomas. Los textos tienen que significar lo mismo, pero no son traducciones literales. La solución de cada desafío es la misma en ambos |
| D14 | Publicación automática de todo lo que pasa la verificación | No hay revisión humana obligatoria. La verificación automática es el control de calidad principal, y los reportes de los jugadores son el segundo |
| D15 | Los jugadores pueden reportar un desafío | Es la red de seguridad de D14: alerta sobre desafíos con errores y permite anularlos |
| D16 | Devdle solo acepta palabras de una lista válida (banco + diccionario de inglés + términos técnicos) | Evita adivinar con combinaciones de letras sin sentido y no rechaza términos reales que no estén en el banco |
| D17 | El admin es una app aparte en un subdominio (`admin.nerdose.dev`), con login y JWT en los endpoints de admin | Simple para el MVP, pero el admin no queda abierto: muestra las soluciones de los próximos días y permite anular desafíos |
| D18 | Todo el contenido es automático y se basa en reglas, sin LLM en el MVP | No hay una persona a cargo de los juegos. Los bancos salen de datos abiertos (Wikidata, Wikipedia), el código se genera combinando piezas programadas una vez, y todo se verifica con reglas y ejecutando. El LLM queda como funcionalidad futura (§10.9) |

## 3. Vista general

```
                        ┌──────────────────────────────┐
  Navegador             │  apps/web (React + Vite)     │
  ───────────           │  shell · catálogo · stats    │
                        │  UI de cada juego            │
                        └──────────────┬───────────────┘
                                       │ HTTPS / JSON (cookie httpOnly con playerId)
                        ┌──────────────▼───────────────┐
                        │  apps/api (Node + Hono)      │
                        │  sesiones · jugadas · rachas │
                        │  registry de GameDefinition  │
                        └──────────────┬───────────────┘
                                       │ SQL (Drizzle)
                        ┌──────────────▼───────────────┐
                        │  PostgreSQL                  │
                        │  contenido · desafíos ·      │
                        │  jugadores · partidas · stats│
                        └──────────────▲───────────────┘
                                       │ escribe desafíos (draft → approved)
                        ┌──────────────┴───────────────┐
  Offline (cron diario) │  apps/generator              │
                        │  Node + Go + JDK (Docker)    │
                        │  genera · ejecuta · verifica │
                        └──────────────────────────────┘
```

El generador corre en un contenedor con los tres toolchains (Node, Go, JDK), porque necesita compilar y ejecutar los snippets de Big O y Bug Hunt. La API no necesita nada de eso.

## 4. Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | Turborepo es opcional; ayuda con el cache de builds y tests |
| Front | React + Vite + TypeScript | SPA. No hace falta SSR: los juegos son 100% interactivos |
| Estilos | Tailwind | Los tokens de la identidad visual del prototipo (`#0A0C0F`, `#3DDC84`…) van al theme |
| Drag & drop | `dnd-kit` | Tech Timeline. Soporta touch y teclado |
| Routing / datos | React Router + TanStack Query | Cache de `/today` y de stats; invalidación al terminar una partida |
| Back | Node 22 + Hono | Hono es liviano y tipado. Fastify es una alternativa igual de válida |
| Validación | Zod | Los schemas de jugadas viven en el paquete de cada juego y los usan front y back |
| ORM | Drizzle | Tipado, migraciones en SQL legible |
| DB | PostgreSQL 16 | |
| Tests | Vitest + Playwright | Unit por juego, e2e del flujo jugar → terminar → racha |
| Generador | Node + subprocesos `go` y `javac`/`java` | Ver §10 |

## 5. Estructura del monorepo

```
apps/
  web/                 shell, catálogo, stats, rutas /:game
  admin/               reportes, próximos desafíos, contenido (admin.nerdose.dev)
  api/                 endpoints genéricos + registry de juegos + rutas /admin/*
  generator/           CLI y cron: generar, verificar, publicar
packages/
  core/                contrato GameDefinition, tipos comunes, lógica de rachas y fechas UTC
  db/                  schema de Drizzle, migraciones, queries compartidas
  ui/                  componentes compartidos (header, banners, share, stats cards)
  polyglot/            árbol de código, emisores JS/Go/Java, runner multi-lenguaje
  games/
    devdle/            definition.ts · client/ · generator.ts · share.ts
    bug-hunt/
    big-o/
    timeline/
    grep-grid/
```

Cada paquete de juego exporta tres cosas:

- `definition` (server): reglas, validación de jugadas, resultado y stats.
- `client` (web): pantallas de instrucciones, partida y resultado.
- `generator` (offline): cómo producir un desafío para una fecha.

## 6. Contrato de juegos

```ts
// packages/core/src/game.ts
export interface GameDefinition<
  Challenge,      // payload completo, con solución. Nunca sale del server
  PublicView,     // lo que ve el cliente antes de terminar
  State,          // estado de la partida en curso (se persiste en plays.state)
  Move,           // una jugada del cliente
  Feedback,       // respuesta a una jugada en curso
  Result,         // resultado final: score, win, explicación
  Stats,          // stats propias del juego (jsonb)
> {
  id: string;                                  // 'devdle', 'bug-hunt', …
  version: number;                             // del schema de Challenge
  moveSchema: z.ZodType<Move>;

  toPublic(c: Challenge): PublicView;
  initState(c: Challenge, now: Date): State;
  applyMove(c: Challenge, s: State, m: Move, now: Date):
    { state: State; feedback: Feedback } | { error: MoveError };
  isFinished(s: State): boolean;
  result(c: Challenge, s: State): Result;      // incluye la explicación completa
  isWin(r: Result): boolean;

  initialStats(): Stats;
  reduceStats(prev: Stats, r: Result): Stats;
  historyLabel(r: Result): string;             // "✓ 4/6", "✗ L7", "02:31"…
}
```

**Cómo lo implementa cada juego en el MVP:**

| Juego | Move | Fin de partida | Win | Stats propias |
|---|---|---|---|---|
| Devdle | `{ guess: string }` | adivinó o 6 intentos | adivinó | distribución de intentos |
| Bug Hunt | `{ language, line }` | 1 jugada | línea correcta | aciertos por lenguaje y por tipo de bug |
| Big O | `{ language, option }` | 1 jugada | opción correcta | aciertos por categoría (recursión, loops…) |
| Tech Timeline | `{ order: string[] }` | 1 jugada | 5/5 | promedio de posiciones, por categoría |
| Grep Grid | `{ from: [r,c], to: [r,c] }` | 8 palabras | completó | tiempo promedio y mejor tiempo |

El share text lo arma el cliente a partir del `Result` y nunca incluye la solución.

## 7. API

Todas las rutas usan la cookie `nd_pid` (httpOnly, `SameSite=Lax`, `Secure`) con el `playerId`.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/session` | Crea el jugador anónimo si no existe la cookie. Idempotente |
| `GET` | `/api/today` | Fecha UTC actual, número de desafío, segundos al próximo reset y estado de hoy de cada juego para este jugador |
| `GET` | `/api/games/:game/today` | `PublicView` + estado de la partida (para retomar). Si terminó, también trae el `Result` |
| `POST` | `/api/games/:game/today/start` | Marca `started_at`. Lo usa Grep Grid para el tiempo oficial |
| `POST` | `/api/games/:game/today/move` | Valida con `moveSchema`, aplica la jugada y responde `Feedback`. Si la partida terminó, responde además el `Result` y las rachas y stats actualizadas |
| `GET` | `/api/me/stats` | Rachas, stats por juego, heatmap e historial |
| `POST` | `/api/games/:game/today/report` | Reporta un problema con el desafío de hoy (ver §11.1) |
| `PUT` | `/api/me/locale` | Guarda el idioma preferido (`es` / `en`) |

Las rutas de administración viven bajo `/api/admin/*` y se protegen con JWT (§10.10). No usan la cookie de jugador.

Reglas:

- **Siempre "today" en UTC, calculado en el server.** El cliente no manda la fecha. Si una partida arranca a las 23:59 UTC y la jugada llega a las 00:01, la jugada se rechaza con `challenge_expired` y el front recarga el desafío nuevo.
- **Una partida por jugador y desafío** (`UNIQUE(player_id, challenge_id)`). Una partida terminada no acepta más jugadas.
- **Rate limit** por `playerId` e IP en `/move` y `/session` (en memoria para el MVP).
- **Errores tipados**: `invalid_move`, `game_finished`, `challenge_expired`, `not_started`, `not_in_word_list` (Devdle: no consume intento).
- **Idioma**: cada respuesta trae el texto en el idioma pedido (`?lang=`, si no `players.locale`, si no `Accept-Language`, y por defecto `es`). El server resuelve los campos `{ es, en }` antes de responder.
- **Sin archivo**: no hay rutas para fechas pasadas. `/today` es la única forma de acceder a un desafío.

## 8. Modelo de datos

### 8.1 Contenido

```sql
-- Banco de términos, compartido entre Devdle y Grep Grid
terms (
  id              uuid pk,
  term            text unique,        -- solo A-Z, en mayúsculas
  length          int generated,
  category        text,               -- git, linux, apis, seguridad, …
  definition      jsonb,              -- { es, en }: descripción corta de Wikidata
  summary         jsonb,              -- { es, en }: primer párrafo de Wikipedia
  example         jsonb null,         -- { es, en }: ejemplo de uso (futuro, §10.9)
  wikidata_id     text unique,
  sitelinks       int,
  status          text,               -- draft | approved | rejected (automático)
  last_used_devdle date,
  last_used_grep   date
)

-- Hechos históricos para Tech Timeline
timeline_facts (
  id              uuid pk,
  label           text,               -- "Docker"
  category        text,               -- lenguajes, empresas, so, …
  event_date      date,
  date_precision  text,               -- year | month | day
  note            jsonb,              -- { es, en }: "Solomon Hykes lo muestra en PyCon…"
  wikidata_id     text unique,        -- Q15206305 (Docker)
  sitelinks       int,                -- cantidad de Wikipedias que lo tienen: mide qué tan conocido es
  status          text                -- draft | approved | rejected (automático)
)

-- Un desafío por juego y por día
challenges (
  id                uuid pk,
  game_id           text,
  date              date,             -- día UTC
  number            int,              -- #128 (para compartir)
  payload           jsonb,            -- Challenge completo, CON solución
  status            text,             -- draft | approved | published | rejected | voided
  generator_version text,
  seed              text,
  verification      jsonb,            -- log de la verificación automática
  created_at        timestamptz,
  unique (game_id, date)
)
```

### 8.2 Jugadores y progreso

```sql
players (
  id          uuid pk,
  user_id     uuid null references users(id),  -- se completa al registrarse
  locale      text default 'es',          -- es | en
  created_at  timestamptz,
  last_seen   timestamptz
)

plays (
  id            uuid pk,
  player_id     uuid references players,
  challenge_id  uuid references challenges,
  game_id       text,                -- denormalizado para queries de stats
  date          date,                -- denormalizado
  state         jsonb,
  status        text,                -- in_progress | won | lost
  result        jsonb null,
  started_at    timestamptz,
  finished_at   timestamptz null,
  unique (player_id, challenge_id)
)

player_game_stats (
  player_id           uuid,
  game_id             text,
  current_streak      int,
  max_streak          int,
  played              int,
  wins                int,
  last_completed_date date,
  extra               jsonb,          -- Stats propias del juego (reduceStats)
  primary key (player_id, game_id)
)

player_stats (
  player_id          uuid pk,
  global_streak      int,
  max_global_streak  int,
  last_active_date   date,
  total_completed    int
)

challenge_reports (
  id            uuid pk,
  challenge_id  uuid references challenges,
  player_id     uuid references players,
  reason        text,          -- wrong_answer | ambiguous | wrong_explanation | translation | display_bug | other
  message       text null,     -- texto libre, máx. 1000 caracteres
  locale        text,          -- idioma en el que jugaba
  context       jsonb,         -- lenguaje elegido (Bug Hunt / Big O), estado de la partida, user agent
  status        text,          -- open | resolved | dismissed
  created_at    timestamptz,
  unique (player_id, challenge_id)    -- un reporte por jugador y desafío
)

-- Intentos de Devdle rechazados por no estar en la lista (§10.3)
rejected_guesses (
  word        text,
  player_id   uuid,
  created_at  timestamptz,
  primary key (word, player_id)
)

-- Para cuando se sume autenticación
users ( id uuid pk, email text unique, created_at timestamptz, … )
```

`plays` es la fuente de verdad del historial. `player_game_stats` y `player_stats` son agregados que se actualizan en la **misma transacción** que cierra la partida. Si algún día se corrompen, se pueden recalcular desde `plays`.

## 9. Día, rachas y estadísticas

**Día:** `today = (now() AT TIME ZONE 'UTC')::date`. Toda la lógica de fechas vive en `packages/core/date.ts` y se testea con relojes falsos.

**Cerrar una partida** (en una transacción):

```
1. plays.status = won|lost, result, finished_at
2. player_game_stats:
     si last_completed_date = D - 1  → current_streak + 1
     si last_completed_date = D      → sin cambios (no debería pasar)
     si no                           → current_streak = 1
     max_streak = max(max_streak, current_streak)
     played + 1, wins + (win ? 1 : 0), extra = reduceStats(extra, result)
     last_completed_date = D
3. player_stats: misma lógica con last_active_date y global_streak
```

**Lectura:** la racha se muestra "viva" solo si `last_completed_date >= today - 1`; si no, se muestra 0. No hace falta un cron que resetee rachas.

**Completar ≠ ganar (D11):** una partida perdida también cuenta como completada y mantiene las rachas. El porcentaje de victorias refleja los aciertos.

**Desafío anulado:** si un desafío se anula por un reporte confirmado (§11.1), las partidas jugadas siguen contando para las rachas, pero no cuentan como derrota: se excluyen del porcentaje de victorias y de las stats propias del juego. Para eso se recalculan los agregados de los jugadores afectados desde `plays`.

## 10. Generación de contenido

### 10.1 Pipeline común

```
reposición de bancos (semanal, §10.2)
        ↓
seleccionar / generar  →  verificar  →  aprobar (automático)  →  publicar en su fecha  →  reportes
   generator.ts          ejecutando        status                 la API lee por fecha    §11.1
```

**Bilingüe (D13):** cada generador produce los textos en `es` y `en` a partir de plantillas en los dos idiomas (specs, explicaciones, consignas). **No son traducciones literales:** cada idioma usa frases naturales para ese idioma, y lo único obligatorio es que digan lo mismo. Por eso las plantillas se escriben por separado en cada idioma, no se traduce una a partir de la otra. El contenido curado (`terms`, `timeline_facts`, `code_seeds`) también se guarda en los dos idiomas. El contenido de los bancos sale de Wikidata y Wikipedia en cada idioma (§10.2), y un ítem sin los dos idiomas no pasa a `approved`. La verificación incluye ese chequeo: un desafío sin alguno de los textos no se publica.

- Un cron diario (por ejemplo a las 03:00 UTC) se asegura de que cada juego tenga desafíos aprobados para los próximos 14 días.
- **Publicación automática (D14):** todo desafío que pasa la verificación queda `approved` y se publica solo en su fecha. Si falla, se descarta y se genera otro con un seed derivado. No hay revisión humana obligatoria; el admin permite mirar los próximos días si uno quiere.
- **Alerta:** si después de N reintentos un juego no logra generar el desafío de mañana, se notifica (webhook a Discord, Slack o mail). Si llega el día sin desafío, ese juego se muestra como "sin desafío hoy" y no rompe las rachas.
- **Seed:** `hash(gameId + date + GENERATOR_SECRET)`. Es reproducible para debug, y como el secreto no está en el repo, nadie puede calcular los desafíos futuros aunque el código sea público.
- Se guarda el **resultado** de la generación, no solo el seed. Si mañana cambia el generador, los desafíos ya publicados no cambian.
- **Todo al azar:** no hay dificultad planificada. Cada juego sortea su desafío con el seed del día.
- **Antirepetición:** lo único que se controla es no repetir. Cada generador consulta el historial (`last_used_*`, desafíos de los últimos N días) para no repetir contenido y rotar categorías.

### 10.2 Bancos de contenido: se llenan solos, con reglas

Nadie carga ni aprueba contenido a mano, y en el MVP **no se usa ningún LLM**. Los bancos se llenan con datos abiertos y estructurados, y se filtran con reglas. Un job de reposición (en `apps/generator`, semanal) revisa cuánto contenido sin usar le queda a cada banco. Si alcanza para menos de un año, importa más. Lo que cumple las reglas queda `approved` y lo que no, `rejected`.

| Banco | De dónde sale | Reglas para aceptarlo |
|---|---|---|
| `terms` (Devdle y Grep Grid) | **Wikidata**: conceptos de computación (lenguajes, protocolos, estructuras de datos, algoritmos, herramientas, conceptos de seguridad, bases de datos…), con su nombre y su descripción corta en `es` y en `en`. El texto más largo sale del primer párrafo del artículo de Wikipedia en cada idioma | El nombre en inglés, pasado a mayúsculas, tiene que ser solo A–Z y medir entre 4 y 12 letras. Tiene que tener descripción en los dos idiomas y artículo en Wikipedia en los dos. Tiene que ser conocido: un mínimo de páginas en Wikipedias de distintos idiomas (*sitelinks*). Sin duplicados y sin palabras de una lista de exclusión |
| `timeline_facts` (Tech Timeline) | **Wikidata**: lenguajes de programación, empresas tech, sistemas operativos, videojuegos y hardware, con su fecha de creación o fundación (P571) o de publicación (P577). La nota sale del primer párrafo de Wikipedia en cada idioma | Una sola fecha, sin contradicciones. Un mínimo de *sitelinks*. Si la nota menciona un año distinto del de Wikidata, se usa la descripción corta en su lugar |
| Big O y Bug Hunt | No tienen banco: el código se genera con reglas que forman parte del generador (§10.5 a §10.7) | — |

Como el texto de cada idioma sale de Wikidata y Wikipedia en ese idioma, las versiones en `es` y `en` dicen lo mismo sin ser traducciones literales (D13).

**Categorías:** cada clase de Wikidata se mapea a una categoría del juego (por ejemplo, "protocolo de comunicación" → networking). El mapeo es una tabla en el código.

**Lo único que se hace a mano es programar, una sola vez:** los generadores, el catálogo de bloques de Big O, las plantillas de funciones y las mutaciones de Bug Hunt, las consultas a Wikidata, el mapeo de categorías y las plantillas de texto. Después de eso, ningún juego necesita que una persona intervenga.

### 10.3 Devdle — elige del banco

- Elige un término `approved` de `terms` que no se haya usado en los últimos 365 días, rotando la categoría respecto de los últimos 3 días.
- `Challenge = { termId, word, category, definition, summary }`. `PublicView = { length, categories }`: la lista de categorías posibles, no la del día.
- **Validación de intentos:** el server calcula verde, amarillo y gris (con el manejo estándar de letras repetidas).
- **Lista de palabras válidas (D16):** un intento solo se acepta si la palabra está en la lista de palabras válidas. Esa lista une tres fuentes:
  1. todos los términos de `terms`;
  2. un diccionario de inglés de licencia libre (por ejemplo ENABLE, de dominio público, o SCOWL), filtrado a palabras A–Z de 4 a 12 letras;
  3. los nombres en inglés de **todos** los conceptos de computación de Wikidata que sean A–Z, aunque no cumplan las reglas para ser respuesta (`KUBECTL`, `NGINX`, `GOLANG`…).
- Un intento rechazado **no consume intento**: el server responde `not_in_word_list` y el front muestra "no está en la lista".
- **Dónde vive:** la lista se arma en build (`packages/games/devdle/wordlist/`) y la API la carga en memoria como un `Set` al arrancar. Son ~200k palabras, unos pocos MB, y no hace falta tabla en la base.
- **Sin spoilers:** si algún día se manda la lista al cliente para validar al instante, se manda **la unión mezclada y ordenada alfabéticamente**, nunca la lista de respuestas por separado (el error clásico de Wordle).
- **La lista crece sola:** el server registra los intentos rechazados (`rejected_guesses`). Si una palabra la intentan 5 jugadores distintos y existe como nombre de algún ítem de Wikidata o como entrada de Wiktionary, se agrega a la lista automáticamente.

### 10.4 Grep Grid — elige del banco + algoritmo

1. Elige 8 términos de `terms` con longitud ≤ 12, sin tema común, evitando los usados en Grep Grid en los últimos 30 días.
2. Los ubica en una grilla de 12×12, en direcciones al azar (horizontal, vertical y diagonal, solo hacia adelante), ordenados de más largo a más corto y con backtracking.
3. Rellena las celdas vacías con letras al azar.
4. **Verificación:** recorre toda la grilla y comprueba que cada palabra aparezca **exactamente una vez** en las direcciones permitidas. Si no, reintenta con otro seed derivado.
5. `PublicView = { grid, words }`, porque la lista de palabras es pública según el brief. Las posiciones son la solución.
6. **Tiempo oficial:** `finished_at - started_at`, medidos en el server. El reloj del cliente es solo visual.

### 10.5 Juegos de código autogenerados: la idea

Todos los juegos se generan solos. Lo que cambia es de dónde sale el material: Devdle, Grep Grid y Timeline **eligen y combinan** elementos de un banco que se llena solo (§10.2), mientras que Big O y Bug Hunt **inventan** el código de cada día.

Para inventarlo, el generador combina **piezas** con propiedades conocidas:

- en Big O, *bloques* de código con su costo (por ejemplo, "un loop que duplica su variable cuesta log n"). Se programan una vez, como parte del generador;
- en Bug Hunt, *plantillas de funciones correctas* con parámetros (por ejemplo, "índice del mayor o del menor, quedándose con el primero o el último") y *mutaciones* (por ejemplo, "cambiar `>` por `>=`"). También se programan una vez.

Cada día el generador sortea una combinación de piezas, calcula la respuesta a partir de lo que sabe de cada una, arma el código en los tres lenguajes y **lo ejecuta para confirmar** que la respuesta calculada es la real. Si no coincide, lo descarta y sortea otra combinación.

Las dos partes comunes viven en el paquete `polyglot`:

- **Árbol de código:** un mini-lenguaje (`func`, `let`, `for`, `if`, `return`…) que se puede escribir en JS, Go y Java. Solo usa lo que se comporta igual en los tres: enteros chicos, arrays de enteros, `for`, `if`, `return` y `len`/`length`. Se evitan la división entera (en JS se emite `Math.trunc(a / b)`), el overflow y el módulo de negativos.
- **Emisores:** `emit(tree, lang) → { code, lineOf }` escribe el árbol en cada lenguaje. Cada sentencia ocupa una línea y las llaves de cierre van en su propia línea, así que una sentencia cae en **la misma línea** en los tres lenguajes. `lineOf` mapea cada nodo a su línea por si alguna vez difieren.
- **Runner:** `run(tree, lang, inputs) → outputs` arma un `main` que llama a la función con cada input, lo compila, lo ejecuta como subproceso con timeout y devuelve los resultados en JSON.
- **CI:** tests de los emisores y compilación real con `go build` y `javac`, para detectar código mal emitido.

### 10.6 Big O — cómo se genera un desafío

**Las piezas: un catálogo de bloques.** Cada bloque es un fragmento de árbol con su costo y el texto que lo explica (en `es` y `en`). Viven en código, en `packages/games/big-o/blocks/`.

| Bloque | Forma (en JS) | Costo |
|---|---|---|
| Constante | `for (let k = 0; k < 10; k++)` | 1 |
| Lineal | `for (let i = 0; i < n; i++)` | n |
| Lineal con paso | `for (let i = 0; i < n; i += 2)` | n |
| Logarítmico | `for (let j = 1; j < n; j *= 2)` | log n |
| Mitades | `while (m > 1) m = Math.trunc(m / 2)` | log n |
| Dependiente | `for (let j = 0; j < i; j++)`, dentro de un lineal | junto con el loop externo, n² |
| Búsqueda binaria | función recursiva que parte el rango a la mitad | log n |
| Divide y vencerás | 2 llamadas con n/2 + un loop lineal | n log n |
| Recursión doble | `f(n - 1) + f(n - 2)` | 2ⁿ |

**Paso a paso, con el ejemplo del prototipo:**

1. **Sortear la receta.** Con el seed del día se elige una combinación de bloques: cuáles, cuáles van anidados y cuáles en secuencia. Hay límites para que entre en pantalla: hasta 3 niveles de anidamiento y unas 15 líneas. Las recursiones van solo en el nivel superior.
   *Ejemplo:* `Lineal` que contiene a `Logarítmico`.
2. **Calcular la respuesta.** Con dos reglas: los bloques anidados **se multiplican** y los que van en secuencia **se suman**, y de la suma se queda el término mayor. Después se descartan las constantes.
   *Ejemplo:* n × log n → **O(n log n)**.
3. **Vestir el código.** Lo anterior es solo el esqueleto. El generador elige al azar un nombre de función, nombres de variables y qué hace el cuerpo (contar, sumar, comparar elementos). Esas plantillas no cambian el costo: solo hacen que el código no se vea siempre igual.
4. **Escribirlo en los tres lenguajes** con los emisores de `polyglot`.
5. **Armar la explicación.** Cada bloque aporta su paso ("el loop externo corre n veces", "el interno duplica `j`: log₂ n vueltas"). Cada regla aplicada aporta otro ("están anidados, se multiplican"), y se cierra con la simplificación final. Es la explicación que muestra el prototipo.
6. **Verificar ejecutando.** Se genera una versión instrumentada que cuenta las operaciones y se ejecuta con varios tamaños: n = 2⁸, 2⁹ … 2¹⁶ (para las recursiones exponenciales, n = 10 … 20). Para cada una de las 8 respuestas posibles se divide la cantidad de operaciones por esa función, por ejemplo `ops / (n · log n)`. La respuesta real es aquella en la que esa división da **más o menos lo mismo para todos los tamaños**.
   - Si coincide con el paso 2, el desafío se aprueba.
   - Si no coincide, o si dos respuestas se ajustan casi igual de bien, se descarta y se sortea otra receta.
7. **Guardar.** `Challenge = { recipe, code: { js, go, java }, answer, explanation: { es, en }, verification }`.

**Reglas para que la respuesta sea indiscutible:**

- Siempre se pregunta por la complejidad temporal en el **peor caso**.
- No se usan bloques cuyo costo dependa de los datos (un `break` que depende del contenido del array) ni de un promedio (operaciones de hash map).
- La recursión doble se responde como O(2ⁿ), que es la convención. La explicación aclara que la cota exacta es φⁿ (≈ 1,618ⁿ).

**Trampas:** algunas recetas se eligen a propósito porque engañan, y el generador las sortea con cierta frecuencia:

- dos loops **en secuencia**, que parecen O(n²) pero son O(n);
- un loop **hasta una constante**, que parece O(n) pero es O(1);
- un loop interno que **duplica** su variable (el caso del prototipo), que parece O(n²) pero es O(n log n).

**Variedad:** todo es al azar, sin dificultad planificada. Solo se evita repetir la misma receta en los últimos 30 días y que la misma respuesta salga más de 2 días seguidos.

**Opciones:** siempre las mismas 8: O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2ⁿ) y O(n!).

### 10.7 Bug Hunt — cómo se genera un desafío

Funciona igual que Big O: el generador arma el código combinando piezas que se programan una sola vez, y la ejecución confirma el resultado.

**Las piezas:**

- **Plantillas de funciones correctas.** Cada plantilla es un algoritmo chico con *parámetros* que se sortean. Cada combinación de parámetros produce una función distinta, con su especificación en `es` y `en` armada a partir de los mismos parámetros. Ejemplos:

  | Plantilla | Parámetros que se sortean | Una función posible |
  |---|---|---|
  | Índice del extremo | mayor o menor · ante empate, el primero o el último | `maxIndex`: "índice del mayor valor; si se repite, el primero" |
  | Contar con condición | condición (`> k`, `< k`, par, impar, múltiplo de k) · valor de k | "cuántos elementos son mayores que 3" |
  | Sumar un rango | desde/hasta · incluye o no los extremos | "suma de los elementos entre las posiciones a y b, inclusive" |
  | Primera posición que cumple | condición · si no hay ninguna, devuelve -1 o la longitud | "primer índice con un valor negativo, o -1" |
  | Todos / alguno | todos o alguno · condición | "¿son todos pares?" |
  | Búsqueda binaria | busca el valor exacto o el primer mayor o igual | "posición de x en un array ordenado, o -1" |
  | Es palíndromo | array o string · ignorar o no el elemento del medio | "¿se lee igual al derecho y al revés?" |
  | Mínimo / máximo de una ventana | tamaño de la ventana | "mayor suma de k elementos seguidos" |

  Con unas 15 plantillas y sus parámetros salen miles de funciones distintas.

- **Mutaciones:** cambios chicos que se aplican a un nodo del árbol, cada uno con su plantilla de explicación:
  - límites de loop (`<` ↔ `<=`, `i = 0` ↔ `i = 1`);
  - comparación (`>` ↔ `>=`);
  - operador aritmético o lógico (`+` ↔ `-`, `&&` ↔ `||`);
  - variable o índice equivocado (`nums[i]` → `nums[best]`);
  - inicialización (`0` → `1`);
  - condición invertida y `return` mal ubicado.

**Paso a paso, con el ejemplo del prototipo:**

1. **Sortear** una plantilla, sus parámetros y una mutación que se le pueda aplicar.
   *Ejemplo:* "índice del extremo" con *mayor* y *el primero* → `maxIndex`, más la mutación "cambiar `>` por `>=`" en el `if`.
2. **Generar los tests automáticamente.** Se arman inputs: casos borde (array de un elemento, todos iguales, empates, negativos, el valor en la primera o la última posición) y varios inputs al azar. El resultado esperado de cada uno se obtiene **ejecutando la versión correcta**.
3. **Aplicar la mutación** al árbol. Se guarda qué nodo cambió (`bugNodeId`) y cómo era antes (el fix).
4. **Verificar ejecutando** las dos versiones con todos los tests, en los tres lenguajes:
   - la correcta da el mismo resultado en los tres;
   - la mutada falla **al menos un** test, con el mismo resultado en los tres lenguajes;
   - con el bug, al menos 2 tests siguen pasando: esos son los tests visibles;
   - si la mutación no cambia ningún resultado (un "mutante equivalente", que en realidad no es un bug), se descarta;
   - como test que falla se elige **el más chico**, para que la explicación sea fácil de seguir.
   *Ejemplo:* `[3, 7, 2] → 1`, `[4] → 0` y `[-2, -9, -1] → 2` siguen pasando. `[5, 1, 5]` falla: se esperaba 0 y devuelve 2.
5. **Escribir el código** en los tres lenguajes y marcar las líneas que se pueden elegir: las que tienen una sentencia. Las que solo tienen llaves y la firma de la función no se pueden elegir.
6. **Armar la explicación:** la plantilla de la mutación completada con los valores del test que falla ("con `>=`, cada valor igual al máximo actual también mueve `best`… en `[5, 1, 5]` devuelve el último máximo").
7. **Guardar.** `Challenge = { template, params, tree, bugNodeId, mutation, fix, visibleTests, failingTest, explanation: { es, en } }`.

**Por qué la respuesta es confiable:** las plantillas se programan una vez y tienen sus propios tests unitarios. Los resultados esperados no los escribe nadie: salen de ejecutar la versión correcta.

**En el juego:**

- `PublicView = { spec, code: { js, go, java }, pickableLines, visibleTests }`. El test que falla no se envía.
- El cliente manda `{ language, line }`. El server traduce la línea a un nodo con el `lineOf` de ese lenguaje y lo compara con `bugNodeId`. **Un solo intento.**

**Variedad:** plantilla, parámetros y mutación al azar, sin repetir la misma combinación en los últimos 60 días.

### 10.8 Tech Timeline — elige del banco + algoritmo

1. Elige una categoría y 5 hechos `approved` de `timeline_facts`, sin repetir hechos usados en los últimos 90 días.
2. **Una sola respuesta posible:** los 5 hechos deben tener al menos 1 año de diferencia entre sí, o la precisión suficiente (mes o día) para distinguirlos.
3. `PublicView` muestra los items con **IDs opacos aleatorios por desafío**, en orden mezclado. Así el orden no se filtra por los IDs.
4. Score: cantidad de posiciones correctas (0–5).

### 10.9 Futuro: LLM

En el MVP todo se genera con reglas. Más adelante, un LLM puede sumar variedad y funcionalidades nuevas, siempre offline y nunca como única fuente de verdad: lo que produzca tiene que pasar las mismas verificaciones (ejecución, Wikidata, formato) o una segunda opinión independiente.

Ideas para esa etapa:

- **Más variedad de código:** proponer plantillas de funciones nuevas para Bug Hunt y bloques nuevos para Big O, que entran al generador después de pasar sus tests.
- **Contenido más rico:** ejemplos de uso para Devdle y explicaciones mejor redactadas, sin cambiar el contenido técnico (línea, valores, complejidad), que siempre lo pone el generador.
- **Juez de calidad:** revisar automáticamente definiciones y notas, y confirmar que el texto en `es` y en `en` dice lo mismo.
- **Juegos o mecánicas nuevas** que dependan de generar lenguaje natural.

### 10.10 Admin

El admin es una app aparte (`apps/admin`), servida en `admin.nerdose.dev` y separada de la app de jugadores (D17).

**Acceso:** subdominio + login + JWT.

- `POST /api/admin/login` recibe la contraseña y la compara con `ADMIN_PASSWORD` (variable de entorno). Si coincide, devuelve un JWT firmado con `ADMIN_JWT_SECRET`, que vence a las 8 horas.
- Todas las rutas `/api/admin/*`, salvo el login, pasan por un middleware que verifica el JWT. Si falta, es inválido o venció, responden `401` y el admin vuelve a la pantalla de login.

El admin tiene tres secciones:

- **Reportes:** reportes agrupados por desafío, ordenados por cantidad. Para cada uno se ve el desafío completo con su solución, los motivos, los mensajes y el contexto. Acciones: marcar como resuelto o descartado, y **anular el desafío** (§11.1).
- **Próximos desafíos:** los próximos 14 días por juego, con preview real y log de verificación. Solo para mirar; opcionalmente se puede regenerar uno.
- **Stock de contenido:** cuánto contenido sin usar queda en cada banco y cuántos ítems rechazó la verificación en la última reposición. Solo lectura.

## 11. Seguridad y anti-spoiler

- El `payload` de `challenges` nunca se serializa al cliente. Solo pasa por `toPublic` y, al terminar, por `result`.
- Los IDs públicos no revelan información (Timeline usa IDs opacos; Grep Grid no expone posiciones).
- `GENERATOR_SECRET` fuera del repo, para que no se puedan predecir los desafíos futuros.
- **Límite conocido:** un jugador anónimo puede borrar la cookie, perder adrede y ver la respuesta. No importa mientras no haya rankings. Si se suman, van atados a cuentas autenticadas.
- CORS restringido al dominio del front, cookies `Secure` + `httpOnly`, y rate limit en las jugadas.

### 11.1 Reportes de jugadores

Como los desafíos se publican sin revisión humana (D14), los reportes de los jugadores son la segunda línea de control.

**En la UI:** cada pantalla de juego tiene un botón "Reportar un problema", tanto durante la partida como en el resultado. Abre un formulario corto:

- motivo, elegido de una lista: la respuesta es incorrecta · la consigna es ambigua · la explicación está mal · error de traducción · algo se ve mal · otro;
- comentario opcional;
- aviso: "No incluyas la respuesta si todavía estás jugando".

**En el server:**

1. `POST /api/games/:game/today/report` guarda el reporte con el contexto (idioma, lenguaje de código elegido, estado de la partida). Un reporte por jugador y desafío, con rate limit.
2. **Umbral de alerta:** si un desafío junta **3 reportes** de `wrong_answer` o `ambiguous` de jugadores distintos, o si esos reportes superan el **5%** de las partidas terminadas, se envía una notificación. Los valores son configurables.
3. **Nunca se despublica automáticamente:** un grupo de jugadores podría abusar de los reportes. Anular un desafío siempre es una acción manual desde el admin.

**Anular un desafío** (`status = voided`):

- el desafío deja de aceptar jugadas y se muestra un aviso: "Este desafío tenía un error y fue anulado. Tu racha no se ve afectada";
- quien no había jugado puede marcarlo como completado, y mantiene la racha;
- las partidas ya jugadas se excluyen del porcentaje de victorias (§9);
- se registra la causa en el desafío. Si el error vino de un ítem de un banco, ese ítem pasa a `rejected` y no se vuelve a usar; si vino de una plantilla o un bloque, se corrige en el código y se suma un test.

**Mejorar el generador con los reportes:** cada reporte confirmado se convierte en un test de regresión del generador o en una regla nueva de verificación.

## 12. Identidad y autenticación futura

- Hoy: `POST /api/session` crea un `player` y setea la cookie.
- Mañana, con auth (Better Auth u otra librería similar): se crea el `user` y se le asigna `players.user_id`.
- Si un usuario inicia sesión en un dispositivo nuevo que ya tenía un player anónimo con historial, se **fusionan**: se mueven los `plays` (ante conflicto en el mismo desafío, queda el más antiguo) y se recalculan los agregados desde `plays`.

## 13. Preguntas abiertas

No hay preguntas abiertas por ahora. Las decisiones tomadas están en §2.

## 14. Plan de construcción

| Fase | Contenido | Valida |
|---|---|---|
| 0 | Monorepo, `core`, `db`, sesión anónima, `/api/today`, shell del front con la identidad visual e i18n ES/EN | La base |
| 1 | **Devdle** de punta a punta + rachas + stats + share | Todo el contrato `GameDefinition` |
| 2 | **Grep Grid** y **Tech Timeline** + scheduler común + reportes + `apps/admin` (reportes y anulación) | Bancos de contenido, generadores simples y la red de seguridad de la publicación automática |
| 3 | Paquete `polyglot` (árbol, 3 emisores, runner, CI con `go`/`javac`) | La infraestructura de los juegos de código |
| 4 | **Big O** (catálogo de bloques) y **Bug Hunt** (mutaciones), con verificación ejecutando | Generación verificada multi-lenguaje |
| 5 | Pantalla de stats completa, heatmap, historial, pulido mobile | La experiencia completa |
| 6 | **Plausible** (analítica). El detalle se define más adelante, con referencias por sumar | Métricas de uso |

**Después del MVP:** integrar un LLM para generar y validar contenido y funcionalidades nuevas (§10.9).
