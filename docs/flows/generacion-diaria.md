---
id: generacion-diaria
title: Generación de desafíos (relleno de 14 días) y alerta de falla
type: event
status: Draft
created: 2026-11-03
last_updated: 2026-11-03
stories: []
---

# Generación de desafíos (relleno de 14 días) y alerta de falla

**Tipo:** Evento
**Status:** Draft
**Creado:** 2026-11-03
**Última actualización:** 2026-11-03
**Stories:** —

## Descripción

El job `fill` del `generator` corre cada hora (y al arrancar). Para cada juego y cada fecha entre `today+1` y `today+14` sin desafío vigente, genera candidatos, los verifica y aprueba el primero que pasa. Si mañana queda sin desafío tras todos los intentos, alerta por mail una sola vez. Nunca genera para hoy. Cubre C-17, C-21, C-24, C-28, C-31, C-47 y C-49 (F7, ADR-007).

## Servicios Involucrados

| Servicio | Rol | Tipo de Participación |
|----------|-----|-----------------------|
| generator | Scheduler, generación, verificación (polyglot en big-o / bug-hunt) y alerta | Iniciador / Procesador |
| nerdose-db | `challenges`, `terms`, `timeline_facts`, `generation_failures`, `job_runs` | Procesador |
| Servidor SMTP | Entrega el mail de falla | Consumidor |

## Pasos del Flujo

```mermaid
sequenceDiagram
    participant G as generator
    participant DB as nerdose-db
    participant M as SMTP

    G->>G: croner "10 * * * *" (UTC)
    G->>DB: pg_try_advisory_lock('fill')
    G->>DB: INSERT job_runs (job='fill', status='running')
    loop por game_id y date en [today+1 … today+14] sin challenge vigente
        loop attempt 0 … GENERATION_MAX_ATTEMPTS-1
            G->>DB: SELECT history (challenges no rejected del juego, ítems approved del banco)
            G->>G: generate({ date, seed, history })
            G->>DB: INSERT challenges (draft)
            G->>G: verify() (polyglot.run en big-o / bug-hunt)
            alt ok
                G->>DB: UPDATE challenges SET status='approved'; UPDATE last_used_* del banco
            else no ok
                G->>DB: UPDATE challenges SET status='rejected', verification
            end
        end
    end
    opt date = today+1 sigue sin desafío
        G->>DB: UPSERT generation_failures; UPDATE alert_sent_at WHERE NULL RETURNING
        G->>M: notify() "[nerdose] Sin desafío de {game_id} para {date}"
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

**Acción por intento:**
- `seed = HMAC-SHA256(GENERATOR_SECRET, "{game_id}:{date}:{attempt}")` → `pure-rand`.
- `history`: challenges no `rejected` del juego en la ventana anti-repetición. En devdle, grep-grid y timeline, además, los ítems `approved` del banco con su `last_used_*`.
- `candidate = games[game_id].generator.generate({ date, seed, history })`.

**Operación de BD:**
- **Tabla:** `challenges` — INSERT (`game_id`, `date`, `number = date − LAUNCH_DATE + 1`, `payload`, `status = 'draft'`, `generator_version`, `seed`, `attempt`)

**Verificación** (`verify()`, resultado en `verification`):
- comunes: textos `es` y `en` presentes; reglas de variedad del juego;
- devdle: término no usado en 365 días (`terms.last_used_devdle`); categoría distinta de los últimos 3 días;
- grep-grid: cada palabra exactamente 1 vez en direcciones permitidas; no usada en 30 días (`terms.last_used_grep`);
- timeline: misma categoría, ordenables sin ambigüedad, no usados en 90 días (`timeline_facts.last_used`);
- big-o: `polyglot.run` de la versión instrumentada en js/go/java con varios `n`; el mejor ajuste es `answer` y no hay empate;
- bug-hunt: `polyglot.run` de la correcta y la mutada en js/go/java; la correcta coincide; la mutada falla ≥ 1 test con el mismo resultado en los 3; ≥ 2 pasan; línea del bug ∈ `pickable_lines`.

**Operación de BD (ok):**
- **Tabla:** `challenges` — UPDATE `status = 'approved'`, `verification`
- **Tabla:** `terms` — UPDATE `last_used_devdle = date` (devdle) o `last_used_grep = date` (grep-grid)
- **Tabla:** `timeline_facts` — UPDATE `last_used = date` (timeline)

**Operación de BD (no ok):**
- **Tabla:** `challenges` — UPDATE `status = 'rejected'`, `verification`

**Eventos de dominio:** `ChallengeGenerated`, `ChallengeApproved` / `ChallengeRejected`, solo en los logs.

---

### Paso 4: Falla para mañana

**Origen:** generator
**Destino:** nerdose-db, Servidor SMTP
**Tipo:** Interno + Evento (best-effort)

**Condición:** para `date = today+1`, un juego sigue sin desafío vigente después de todos los intentos.

**Operación de BD:**
- **Tabla:** `generation_failures` — INSERT (`game_id`, `date`, `attempts`, `last_reason`) ON CONFLICT (`game_id`, `date`) DO UPDATE `attempts`, `last_reason`
- **Tabla:** `generation_failures` — UPDATE `alert_sent_at = now()` WHERE (`game_id`, `date`) AND `alert_sent_at IS NULL` RETURNING

**Acción:** si devolvió fila, `notify()`:
- **Asunto:** `[nerdose] Sin desafío de {game_id} para {date}`
- **Cuerpo:** `attempts`, `last_reason`

Si el envío falla: UPDATE `alert_sent_at = NULL`.

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
| 3 | El código emitido no compila o el runner hace timeout (10 s) | — | `verification.ok = false` | Candidato `rejected`; siguiente `attempt` |
| 3 | El banco no tiene ítems fuera de la ventana | — | `verification.reason` | Candidatos `rejected`; termina en el paso 4 si es mañana |
| 3 | Error de BD en un candidato | — | — | Se loguea; sigue con el próximo hueco; `job_runs.status = 'failed'` al final |
| 4 | Falla SMTP o falta configuración | — | — | `alert_sent_at` vuelve a NULL; log `warn`; se reintenta en la próxima hora |

## Resultado

**Éxito:** cada juego tiene un desafío `approved` para cada uno de los próximos 14 días.

**Estado final:**
- Challenges: `approved` para los huecos cubiertos; `rejected` para los candidatos descartados (quedan para auditoría).
- Bancos: `last_used_*` actualizados.
- `generation_failures` y un mail, solo si mañana quedó sin desafío.
- `job_runs`: una fila por corrida.

## Notas

- Nunca se genera para `today`: si llega el día sin desafío, el juego muestra "sin desafío hoy" y el día es neutro (ADR-007).
- Con 14 días de margen, el `generator` puede estar caído hasta 13 días sin dejar un juego sin desafío (NFR-A03).
- El `payload` y el `seed` quedan inmutables desde `approved` (trigger `challenges_payload_immutable`).
