# ADR-007: Generator como worker siempre activo y pipeline de generación

**Estado:** Accepted
**Fecha:** 2026-11-03 (actualizado 2026-11-14: Go con `go build` + binario en el runner; actualizado 2026-11-15: nota de Bug Hunt)
**Decisores:** Responsable de nerdose
**Etiquetas:** generator, scheduler, seed, verificación, contenido

## Contexto

Todo el contenido es automático (decisiones #16 y #17): nadie carga ni revisa desafíos. Eso exige:
- Que siempre haya desafíos `approved` para los próximos 14 días por juego (invariante 33, NFR-A03).
- Que cada desafío se verifique antes de aprobarse. En Big O y Bug Hunt, eso significa ejecutar el código en JS, Go y Java.
- Que los desafíos sean imposibles de predecir con el código público (NFR-S03), pero reproducibles para debug.
- Que los pedidos de regeneración del admin se atiendan al instante (decisión del usuario).
- Que los bancos (`terms`, `timeline_facts`) estén cargados en la base. Salen de un dataset versionado en el repo (ADR-016).

## Decisión

El `generator` es un **worker long-running** con un scheduler interno (croner, expresiones cron en UTC), que también escucha `generation_requests` (ADR-005).

| Job | Cron (UTC) | Advisory lock | Qué hace |
|---|---|---|---|
| `fill` | `10 * * * *` (cada hora) | `fill` | Para cada juego y cada fecha en `[today+1 … today+14]` sin challenge `approved`/`published`/`voided`: genera, verifica y aprueba |
| `sync_banks` | Al arrancar (antes de habilitar `fill`) | `sync_banks` | Carga el dataset de `@nerdose/content` en `terms` y `timeline_facts` (UPSERT idempotente, ADR-016) |

**Seed y reintentos:** `seed = HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")` → `pure-rand` (xoroshiro128+), con `attempt` de 0 a `GENERATION_MAX_ATTEMPTS - 1` (20).

**Pipeline por candidato:**
1. `INSERT challenges (status='draft', number, payload, seed, generator_version)`.
2. `verify()`.
3. Si pasa: `approved` y se actualiza `last_used_*` en los bancos. Si no: `rejected` con la `verification`.

Si para `today+1` un juego sigue sin desafío después de todos los intentos, se hace `UPSERT generation_failures`: esa fila es la alerta y el admin la muestra en Próximos desafíos (ADR-017).

**Nunca se genera para `today`:** si llega el día sin desafío, el día es neutro.

**Runner:** `child_process.execFile` con timeout de 10 s, usuario no root y un `main` por variante y lenguaje que corre todos los inputs. Java en modo source-file (`java Main.java`). Go se compila con `go build` y se ejecuta el binario, no con `go run`: `go run` lanza el binario como un hijo propio y el `SIGKILL` del timeout lo dejaba huérfano consumiendo CPU; las dos fases comparten el presupuesto de 10 s (actualizado 2026-11-14, REQ-009 / S-041).

**Bug Hunt (REQ-010):** los valores esperados de los tests se calculan en `generate` con el intérprete `evaluate` de `@nerdose/polyglot` (sin procesos) y `verify` los confirma ejecutando la versión correcta y la mutada en los 3 lenguajes (un `main` por variante y lenguaje, 6 ejecuciones por candidato, los lenguajes en paralelo). Si el intérprete y la ejecución real no coinciden, el candidato se rechaza (`correct_agrees` / `mutant_agrees`).

## Reglas de Implementación

- `generator` MUST correr como proceso long-running. MUST NOT depender de cron del sistema ni de un scheduler externo.
- `fill` MUST definirse con croner y la expresión UTC `"10 * * * *"`. `sync_banks` MUST correr una vez al arrancar, antes de la primera corrida de `fill`. `fill` MUST correr también una vez al arrancar, después de `sync_banks`.
- Cada job MUST tomar `pg_try_advisory_lock` con su clave (`fill`, `sync_banks`). Si no lo obtiene, MUST salir sin hacer nada.
- Cada corrida MUST registrarse en `job_runs` (`job`, `status`, `started_at`, `finished_at`, `summary`).
- Los jobs MUST ser idempotentes: correrlos dos veces seguidas no cambia el resultado.
- El seed MUST ser `HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")`, con `date` en formato `YYYY-MM-DD`. `GENERATOR_SECRET` MUST existir solo en el entorno del `generator`.
- `GENERATION_MAX_ATTEMPTS` MUST valer 20 por defecto y ser configurable por variable de entorno.
- `fill` MUST generar solo para fechas en `[today+1, today+14]`. MUST NOT generar para `today` ni para fechas pasadas.
- `challenges.number` MUST calcularse con `core` (`date − LAUNCH_DATE + 1`) al insertar.
- Un candidato MUST pasar a `approved` solo si `verify()` devuelve `ok: true`. El log completo MUST guardarse en `challenges.verification`.
- El runner MUST usar `execFile` (nunca `exec` con shell), timeout de 10 000 ms, y MUST correr como usuario no root.
- Los toolchains MUST ser Node 24, Go ≥ 1.25 y JDK 21.
- El `generator` MUST NOT hacer requests HTTP a servicios externos. No tiene salida de red fuera de la base (ADR-017).
- El `generator` MUST cerrar ordenadamente con `SIGTERM`: termina el candidato en curso y libera los locks.

## Consecuencias

### Positivas
- Hay 14 días de margen: el `generator` puede estar caído hasta 13 días sin dejar un juego sin desafío.
- Las regeneraciones se atienden al instante y todos los jobs viven en un solo proceso versionado con el código.
- Los desafíos son reproducibles para debug (seed + intento) e imposibles de predecir sin el secreto.
- Ninguna respuesta depende de que el generador "tenga razón": la verificación ejecuta y prueba.

### Negativas
- Es un proceso más que tiene que estar siempre corriendo, con un entorno pesado (Node, Go y JDK).
- Correr `fill` cada hora hace trabajo de más cuando no falta nada (barato: chequea y sale).

### Riesgos
- **Riesgo:** el código emitido no compila en algún lenguaje.
  - **Mitigación:** la verificación lo rechaza y se reintenta con otro seed; además, un job de CI compila el código emitido.
- **Riesgo:** un snippet generado cuelga o consume recursos.
  - **Mitigación:** timeout de 10 s y usuario no root. El aislamiento del entorno (sin red, con límites) se define con el hosting.
- **Riesgo:** el banco no alcanza para respetar la ventana anti-repetición y `fill` no encuentra ítems.
  - **Mitigación:** el script de importación exige mínimos (ADR-016), y la alerta de falla de generación avisa con 14 días de margen.

## Alternativas Consideradas

### Alternativa 1: Cron diario (03:00 UTC) como proceso efímero

**Pros:**
- No consume recursos fuera de la corrida.

**Contras:**
- Las regeneraciones tendrían que esperar hasta la próxima corrida.
- Si una corrida falla, el hueco dura un día entero.

**Por qué se descartó:** el usuario quiere regeneración inmediata, y la corrida cada hora cubre reintentos sin dejar huecos.

---

### Alternativa 2: Generar el desafío en el momento del request

**Pros:**
- No hace falta almacenamiento anticipado.

**Contras:**
- La `api` tendría que ejecutar código y llamar a APIs externas.
- Sin tiempo para verificar ni reintentar.

**Por qué se descartó:** viola "la API nunca ejecuta código" y la verificación previa.

## Referencias

- `docs/discovery/analisis-tecnico.md` — S4 generator, F7, Arq-6, Arq-8 (F9 y F10 reemplazados por ADR-016)
- `docs/discovery/analisis-dominio.md` — Invariantes 4, 8–12, 31–33
- ADR-005 (regeneración), ADR-017 (alertas), ADR-016 (dataset de los bancos)
