---
id: reporte-de-problema
title: Reporte de un problema y alerta por umbral
type: feature
status: Draft
created: 2026-11-03
last_updated: 2026-11-03
stories: []
---

# Reporte de un problema y alerta por umbral

**Tipo:** Feature
**Status:** Draft
**Creado:** 2026-11-03
**Última actualización:** 2026-11-03
**Stories:** —

## Descripción

El jugador reporta un problema con el desafío de hoy, durante la partida o en el resultado. Si los reportes `wrong_answer`/`ambiguous` alcanzan el umbral, el responsable recibe un mail, una sola vez por desafío. La alerta nunca anula nada. Cubre C-36 y C-37 (F5, ADR-013).

## Servicios Involucrados

| Servicio | Rol | Tipo de Participación |
|----------|-----|-----------------------|
| web | Envía el formulario de reporte | Iniciador |
| api | Guarda el reporte, evalúa el umbral y manda el mail | Procesador / Notificador |
| nerdose-db | `challenge_reports`, `plays` (conteo), `challenges` (`alert_sent_at`) | Procesador |
| Servidor SMTP | Entrega el mail al responsable (`ALERT_EMAIL_TO`) | Consumidor |

## Pasos del Flujo

```mermaid
sequenceDiagram
    participant W as web
    participant A as api
    participant DB as nerdose-db
    participant M as SMTP

    W->>A: POST /api/games/{game_id}/today/report { challenge_number, reason, message?, code_language? }
    A->>DB: BEGIN; INSERT challenge_reports
    alt ya reportó
        A-->>W: 409 already_reported
    else nuevo
        A->>DB: count reportes wrong_answer/ambiguous (n) y plays won+lost (f)
        opt umbral alcanzado y alert_sent_at IS NULL
            A->>DB: UPDATE challenges SET alert_sent_at=now() WHERE alert_sent_at IS NULL RETURNING id
        end
        A->>DB: COMMIT
        A-->>W: 201 { report_id }
        opt el UPDATE devolvió fila
            A->>M: notify() → mail "[nerdose] Desafío #N game_id: n reportes"
            alt el envío falla
                A->>DB: UPDATE challenges SET alert_sent_at = NULL
            end
        end
    end
```

### Paso 1: Enviar el reporte

**Origen:** web
**Destino:** api
**Tipo:** REST

**Request:**
- **Método:** POST
- **Endpoint:** `/api/games/{game_id}/today/report`
- **Body:**
  ```json
  {
    "challenge_number": "integer",
    "reason": "wrong_answer | ambiguous | wrong_explanation | translation | display_bug | other",
    "message": "string (opcional, ≤ 1000)",
    "code_language": "js | go | java (opcional)"
  }
  ```

**Validaciones:** `nd_pid` → desafío de hoy con `status IN ('published','voided')` → `challenge_number == number` → body válido.

**Ref:** `docs/apis/api.yaml` POST /api/games/{game_id}/today/report (`ReportRequest`)

---

### Paso 2: Guardar el reporte

**Origen:** api
**Destino:** nerdose-db
**Tipo:** Interno (transacción)

**Operación de BD:**
- **Tabla:** `challenge_reports`
- **Operación:** INSERT (falla por `uq_reports_player_challenge` → `409 already_reported`)
- **Campos:** `challenge_id`, `player_id`, `reason`, `message`, `locale` (locale resuelto), `context = { code_language, play_status, play_state, user_agent }` (de la Play actual del jugador y del header `User-Agent`), `status = 'open'`, `created_at`

**Evento de dominio:** `ChallengeReported` (`report_id`, `challenge_id`, `reason`, `locale`), solo en los logs.

---

### Paso 3: Evaluar el umbral

**Origen:** api
**Destino:** nerdose-db
**Tipo:** Interno (misma transacción)

**Operación de BD:**
- **Tabla:** `challenge_reports` — `n = count(DISTINCT player_id)` WHERE `challenge_id` AND `reason IN ('wrong_answer','ambiguous')`
- **Tabla:** `plays` — `f = count(*)` WHERE `challenge_id` AND `status IN ('won','lost')`
- **Condición:** `n >= REPORT_ALERT_COUNT (3)` o (`n >= REPORT_ALERT_RATIO_MIN_COUNT (2)` y `n / f > REPORT_ALERT_RATIO (0.05)`)
- **Tabla:** `challenges` — UPDATE `alert_sent_at = now()` WHERE `id` AND `alert_sent_at IS NULL` RETURNING `id`

**Response (éxito):**
- **Status:** 201
- **Body:** `{ "report_id": "uuid" }`

---

### Paso 4: Mail de alerta (después del COMMIT)

**Origen:** api
**Destino:** Servidor SMTP
**Tipo:** Evento (best-effort)

**Acción:** si el UPDATE del paso 3 devolvió una fila, se ejecuta `notify(subject, text)` (nodemailer):
- **Asunto:** `[nerdose] Desafío #{number} {game_id}: {n} reportes`
- **Cuerpo:** `challenge_id`, `date`, conteo por `reason`, link `https://admin.nerdose.dev`

**Evento de dominio:** `ReportThresholdReached` (`challenge_id`, `report_count`, `ratio`), solo en los logs.

**Si falla el envío:** `challenges` UPDATE `alert_sent_at = NULL` WHERE `id`, para que el próximo reporte lo reintente.

## Manejo de Errores

| Paso | Error | Código | Response | Comportamiento |
|------|-------|--------|----------|---------------|
| 1 | Sin sesión | 401 | `{ "error": { "code": "no_session", … } }` | web recrea la sesión |
| 1 | No hay desafío de hoy `published`/`voided` | 404 | `{ "error": { "code": "no_challenge_today", … } }` | web cierra el formulario |
| 1 | `challenge_number` ≠ hoy | 409 | `{ "error": { "code": "challenge_expired", … } }` | web recarga el juego |
| 1 | `reason` inválido o `message` > 1000 | 422 | `{ "error": { "code": "invalid_report", … } }` | web marca el campo |
| 2 | Ya reportó este desafío | 409 | `{ "error": { "code": "already_reported", … } }` | web muestra "ya reportaste este desafío" |
| 1 | Rate limit (10/hora por IP) | 429 | `{ "error": { "code": "rate_limited", … } }` | web muestra el mensaje genérico |
| 4 | Falla SMTP o falta configuración | — | (no afecta la respuesta 201) | `alert_sent_at` vuelve a NULL; log `warn` |

## Resultado

**Éxito:** el jugador ve "gracias por avisar". Si se alcanzó el umbral, el responsable recibe un mail y el desafío aparece primero en Reportes del admin.

**Estado final:**
- ChallengeReport: `status = 'open'`.
- Challenge: `alert_sent_at` con fecha si se envió la alerta.

## Notas

- Solo `wrong_answer` y `ambiguous` cuentan para el umbral. Los demás motivos se ven en el admin, pero no alertan.
- 50 reportes coordinados generan una sola alerta y nunca anulan: la anulación es siempre manual (decisión #14).
- Los umbrales son configurables por variables de entorno (ADR-013).
