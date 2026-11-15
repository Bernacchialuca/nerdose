---
id: generacion-diaria
title: Generación de desafíos (relleno de 14 días) y alerta de falla
type: event
status: Draft
created: 2026-11-03
last_updated: 2026-11-14
stories: [S-022, S-023, S-036, S-042, S-045, S-049, S-050]
---

# Generación de desafíos (relleno de 14 días) y alerta de falla

**Tipo:** Evento
**Status:** Draft
**Creado:** 2026-11-03
**Última actualización:** 2026-11-14
**Stories:** S-022, S-023, S-036, S-042, S-045

## Descripción

El job `fill` del `generator` corre cada hora (y al arrancar). Para cada juego y cada fecha entre `today+1` y `today+14` sin desafío vigente, genera candidatos, los verifica y aprueba el primero que pasa. Si mañana queda sin desafío tras todos los intentos, registra la falla en `generation_failures` (la fila es la alerta y el admin la muestra; ADR-017). Nunca genera para hoy. Cubre C-17, C-21, C-24, C-28, C-31, C-47 y C-49 (F7, ADR-007).

## Servicios Involucrados

| Servicio | Rol | Tipo de Participación |
|----------|-----|-----------------------|
| generator | Scheduler, generación, verificación (ejecución de código con `@nerdose/polyglot` en big-o / bug-hunt) y registro de fallas | Iniciador / Procesador |
| toolchains locales (`node`, `go`, `java`) | Compilan y ejecutan el código de big-o / bug-hunt en subprocesos del `generator` | Procesador |
| nerdose-db | `challenges`, `terms`, `timeline_facts`, `generation_failures`, `job_runs` | Procesador |

## Pasos del Flujo

```mermaid
sequenceDiagram
    participant G as generator
    participant DB as nerdose-db

    G->>G: croner "10 * * * *" (UTC)
    G->>DB: pg_try_advisory_lock('fill')
    G->>DB: INSERT job_runs (job='fill', status='running')
    loop por game_id y date en [today+1 … today+14] sin challenge vigente
        G->>DB: SELECT history (challenges no rejected del juego en [D - recentDays, D + aheadDays] sin D, ítems approved del banco)
        loop attempt 0 … GENERATION_MAX_ATTEMPTS-1
            G->>G: generate({ date, seed, history })
            G->>DB: INSERT challenges (draft)
            G->>G: await verify() (runInLanguage js/go/java en big-o / bug-hunt)
            alt ok
                G->>DB: UPDATE challenges SET status='approved'; UPDATE last_used_* del banco
            else no ok
                G->>DB: UPDATE challenges SET status='rejected', verification
            end
        end
    end
    opt date = today+1 sigue sin desafío
        G->>DB: UPSERT generation_failures (attempts, last_reason)
    end
    G->>DB: UPDATE job_runs SET status, finished_at, summary
```

### Paso 1: Disparo y exclusión

**Origen:** generator
**Destino:** nerdose-db
**Tipo:** Interno

**Acción:** croner dispara `fill` con `"10 * * * *"` UTC, y una vez al arrancar, después de `sync_banks`.

**Operación de BD:**
- `SELECT pg_try_advisory_lock(hashtext('fill'))`. Si devuelve false, sale sin hacer nada.
- **Tabla:** `job_runs` — INSERT (`job = 'fill'`, `status = 'running'`, `started_at`)

---

### Paso 2: Detectar huecos

**Origen:** generator
**Destino:** nerdose-db
**Tipo:** Interno

**Operación de BD:**
- **Tabla:** `challenges` — SELECT (`game_id`, `date`) WHERE `date BETWEEN today+1 AND today+14` AND `status IN ('approved','published','voided')`. Los pares que faltan de (registry × fechas) son los huecos.

---

### Paso 3: Generar y verificar cada hueco

**Origen:** generator
**Destino:** nerdose-db
**Tipo:** Interno

**Historia (una vez por fecha `D`, antes de los intentos):** `historyWindow(D, historySpec)` de `apps/generator/src/domain/challenge-publishing/generate.ts`.
- `recentChallenges`: **Tabla** `challenges` — SELECT `date`, `payload` WHERE `game_id` AND `date BETWEEN D - recentDays AND D + aheadDays` AND `date <> D` AND `status IN ('approved','published','voided')` ORDER BY `date`. `aheadDays` es opcional en `HistorySpec` (default 0: la ventana queda `[D - recentDays, D - 1]`). Se excluye la fila de `D` para que, en una regeneración, el `approved` viejo de `D` no cuente contra su reemplazo. Los `voided` sí cuentan; los `rejected` (incluido un regenerado) no.
- `bankItems`: en devdle, grep-grid y timeline, los ítems `approved` del banco con su `last_used_*`. En big-o (`bank: null`) es `[]`.
- `historySpec` por juego: devdle `{ bank: 'terms', lastUsedField: 'last_used_devdle', recentDays: 3 }` (los 365 días del término los cubre `last_used_devdle`); grep-grid `{ bank: 'terms', lastUsedField: 'last_used_grep', recentDays: 30 }`; timeline `{ bank: 'timeline_facts', lastUsedField: 'last_used', recentDays: 90 }`; big-o `{ bank: null, lastUsedField: '', recentDays: 30, aheadDays: 30 }`. Los juegos con banco no necesitan `aheadDays`, porque `GREATEST(last_used_*, D)` ya refleja los aprobados a futuro. Big O no tiene banco: sin la ventana hacia adelante, rellenar un hueco intermedio o regenerar podría repetir una receta ya aprobada para días posteriores.

**Acción por intento:**
- `seed = HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")` → `pure-rand`.
- `candidate = payloadSchema.parse(games[game_id].generator.generate({ date, seed, history }))`. El payload de big-o lleva `date` (= `D`, primera clave): `verify` no recibe la fecha y los checks de variedad la necesitan.

**Operación de BD:**
- **Tabla:** `challenges` — INSERT (`game_id`, `date`, `number = date − LAUNCH_DATE + 1`, `payload`, `status = 'draft'`, `generator_version`, `seed`, `attempt`)

**Verificación** (`await generator.verify(payload, history)`, resultado en `verification`). `verify` puede devolver `VerificationLog` o `Promise<VerificationLog>`: los juegos que ejecutan código son asíncronos y el `await` de un valor síncrono no cambia nada para los demás.
- comunes: textos `es` y `en` presentes; reglas de variedad del juego;
- devdle: término no usado en 365 días (`terms.last_used_devdle`); categoría distinta de los últimos 3 días;
- grep-grid: checks en este orden, con `name` estable (el primero que falla va en `verification.reason`): `grid_shape` (12×12, solo A–Z), `words_count` (8 `term_id` distintos), `words_in_bank`, `word_shape` (`^[A-Z]{4,12}$`), `texts_bilingual` (`definition.es` y `.en`), `no_substrings` (ninguna palabra es subcadena de otra), `placements_consistent` (cada placement es una línea hacia adelante —`right`, `down`, `down_right`, `up_right`— y sus celdas deletrean la palabra), `exactly_once` (cada palabra exactamente 1 vez contando solo esas 4 direcciones; la reversa no cuenta), `not_used_30` (`terms.last_used_grep IS NULL` o `<= date − 30`, y el `term_id` no aparece en los challenges recientes);
- timeline: 5 hechos de todo el banco, sin importar la categoría (cada item lleva la de su hecho), ordenables sin ambigüedad, no usados en 90 días (`timeline_facts.last_used`); consigna única;
- big-o (`packages/games/big-o/src/generator/verify.ts`): checks en este orden, con `name` estable. Los 4 primeros corren en memoria; si alguno falla, la ejecución no corre y los checks siguientes quedan `ok: false` con `detail = 'skipped'`:
  1. `texts_bilingual`: todos los `{ es, en }` de `explanation` (`steps`, `line_notes`, `tip`) no vacíos.
  2. `code_shape`: en cada lenguaje ≤ 15 líneas y ≤ 3 niveles de anidamiento, la misma cantidad de líneas en los 3, y cada `line_notes[].line` existe.
  3. `variety_recipe`: `recipe` no aparece en los `recentChallenges` de `[D - 29, D + 29]`.
  4. `variety_answer`: `answer` no forma 3 días seguidos con los vecinos (`D-2,D-1,D` / `D-1,D,D+1` / `D,D+1,D+2`). Si el payload no trae `date`, los dos checks de variedad fallan con `missing date`: un payload sin fecha nunca se aprueba.
  5. `run_js`, `run_go`, `run_java`: `wrapFunction(code[lang], lang, { entry: 'f', calls })` arma el programa con la función guardada tal cual (lo que se ejecuta es lo que ve el jugador) y `runInLanguage` de `@nerdose/polyglot` lo corre en los 3 lenguajes **en paralelo**, un proceso por lenguaje con toda la escala de `n`, timeout de 10 s, `execFile` sin shell, entorno mínimo y usuario no root. JS: `node main.js`; Java: `java Main.java` (source-file); Go: `go build -o main main.go` y después el binario (no `go run`: con `go run` el `SIGKILL` del timeout mataba a `go run` y dejaba vivo al binario; las dos fases comparten el presupuesto de 10 s). Falla con `detail` = `kind (duración): primera línea de stderr` si el runner devuelve `toolchain_missing`, `timeout`, `compile_error`, `runtime_error` u `output_too_large`, o con `invalid_output` si la salida no es un entero por `n`.
  6. `counts_agree`: los 3 lenguajes dan la misma secuencia de conteos.
  7. `counts_in_range`: todos los conteos en `[1, 2³¹ − 1]`.
  8. `example_matches_run`: si `explanation.example` no es null, su `n` está en la escala y `ops` es igual al conteo medido en ese `n`.
  9. `fit_quality`, `fit_unambiguous`, `fit_matches_answer`: ajuste de los conteos contra las 8 clases por coeficiente de variación de `c(n) / g(n)` (`FIT_MAX_CV = 0.10` → si no, `poor_fit`; segundo mejor con `CV ≥ max(2 × CV_mejor, 0.10)` → si no, `ambiguous_fit`; el mejor modelo tiene que ser `answer` → si no, `fit_mismatch`). El `detail` guarda la escala, los conteos y el CV de cada modelo para el log del admin.

  Escala de `n` según `answer` (`SCALE` en `scale.ts`): `o_1`, `o_log_n`, `o_n`, `o_n_log_n` → 2⁸ … 2¹⁶; `o_n2` → 2⁶ … 2¹²; `o_n3` → 2⁴ … 2⁹; `o_2n` → 10 … 20; `o_n_fact` → 4 … 10. `verification.reason` es el `name` del primer check que falla, salvo en los `run_<lang>`, donde es `run_<lang>: <kind>` (p. ej. `run_go: timeout`, `run_java: toolchain_missing`, `run_js: invalid_output`);
- bug-hunt: `polyglot.run` de la correcta y la mutada en js/go/java; la correcta coincide; la mutada falla ≥ 1 test con el mismo resultado en los 3; ≥ 2 pasan; línea del bug ∈ `pickable_lines`.

**Operación de BD (ok):**
- **Tabla:** `challenges` — UPDATE `status = 'approved'`, `verification`
- **Tabla:** `terms` — UPDATE `last_used_devdle = GREATEST(last_used_devdle, date)` (devdle) o `last_used_grep = GREATEST(last_used_grep, date)` (grep-grid)
- **Tabla:** `timeline_facts` — UPDATE `last_used = GREATEST(last_used, date)` (timeline)

**Operación de BD (no ok):**
- **Tabla:** `challenges` — UPDATE `status = 'rejected'`, `verification`

**Eventos de dominio:** `ChallengeGenerated`, `ChallengeApproved` / `ChallengeRejected`, solo en los logs.

---

### Paso 4: Falla para mañana

**Origen:** generator
**Destino:** nerdose-db
**Tipo:** Interno

**Condición:** para `date = today+1`, un juego sigue sin desafío vigente después de todos los intentos.

**Operación de BD:**
- **Tabla:** `generation_failures` — INSERT (`game_id`, `date`, `attempts`, `last_reason`) ON CONFLICT (`game_id`, `date`) DO UPDATE `attempts`, `last_reason`; `attempts` = `GENERATION_MAX_ATTEMPTS` de la corrida y `last_reason` = `verification.reason` del último candidato

La fila es la alerta (ADR-017): no se envía nada. El admin la ve en Próximos desafíos (`GET /api/admin/challenges/upcoming`, campo `failure`). Una corrida posterior para la misma fecha actualiza la fila, no crea otra. Una falla es **activa** si su `date` está en `[today+1, today+14]` y no existe challenge vigente para ese (`game_id`, `date`): deja de mostrarse sola cuando una corrida logra el desafío (la fila no se borra).

**Evento de dominio:** `ChallengeGenerationFailed` (`game_id`, `date`, `attempts`), solo en los logs.

---

### Paso 5: Cierre del job

**Operación de BD:**
- **Tabla:** `job_runs` — UPDATE `status = 'success' | 'failed'`, `finished_at`, `summary = { generated, approved, rejected, missing }`
- `pg_advisory_unlock(hashtext('fill'))`

**Ref:** `docs/db-schemas/nerdose-db.md` tablas `challenges`, `generation_failures`, `job_runs`

## Manejo de Errores

| Paso | Error | Código | Response | Comportamiento |
|------|-------|--------|----------|---------------|
| 1 | Otra corrida tiene el lock | — | — | Sale sin hacer nada |
| 3 | El código emitido no compila o el runner hace timeout (10 s) | — | `verification.ok = false`, `reason = run_<lang>: compile_error \| timeout` | Candidato `rejected`; siguiente `attempt` |
| 3 | Falta un toolchain (`node`, `go` o `java` no está en el `PATH`) | — | `reason = run_<lang>: toolchain_missing` | Candidato `rejected`, nunca una excepción. El job sigue; si es mañana, termina en el paso 4. Al arrancar, el `generator` loguea un `warn` `Toolchain missing at startup` por cada toolchain que falte (Go ≥ 1.25, JDK 21), pero no se niega a arrancar |
| 3 | Big O: los lenguajes no concuerdan, el ajuste es ambiguo o no coincide con `answer`, o la receta/respuesta viola la variedad | — | `reason = counts_agree \| fit_unambiguous \| fit_matches_answer \| variety_recipe \| variety_answer …` | Candidato `rejected`; siguiente `attempt` con otro seed. La regla de variedad no se relaja: si el catálogo no alcanza, la falla queda en `generation_failures` |
| 3 | El banco no tiene ítems fuera de la ventana | — | `verification.reason` | Candidatos `rejected`; termina en el paso 4 si es mañana |
| 3 | Error de BD en un candidato | — | — | Se loguea; sigue con el próximo hueco; `job_runs.status = 'failed'` al final |

## Resultado

**Éxito:** cada juego tiene un desafío `approved` para cada uno de los próximos 14 días.

**Estado final:**
- Challenges: `approved` para los huecos cubiertos; `rejected` para los candidatos descartados (quedan para auditoría).
- Bancos: `last_used_*` actualizados.
- `generation_failures`, solo si mañana quedó sin desafío (visible en el admin).
- `job_runs`: una fila por corrida.

## Notas

- Nunca se genera para `today`: si llega el día sin desafío, el juego muestra "sin desafío hoy" y el día es neutro (ADR-007).
- Con 14 días de margen, el `generator` puede estar caído hasta 13 días sin dejar un juego sin desafío (NFR-A03).
- El `payload` y el `seed` quedan inmutables desde `approved` (trigger `challenges_payload_immutable`).
- La verificación de big-o ejecuta código solo en el `generator`, y solo el código emitido por los emisores de `@nerdose/polyglot` (nunca texto externo). Agrega unos segundos por candidato (arranque de la JVM y `go build`); el margen de 14 días lo absorbe y nunca está en la ruta de una jugada.

> Actualizado por REQ-006 (stories S-025 a S-029): ver el diseño técnico del request para los cambios de Timeline.

> Actualizado por REQ-009 (stories S-042 y S-045): ventana de historia con `aheadDays` sin la fila de `D`, `verify` asíncrono, checks de verificación de Big O con ejecución en JS, Go y Java, y `toolchain_missing`.
