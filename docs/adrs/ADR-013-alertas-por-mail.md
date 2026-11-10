# ADR-013: Alertas por mail (SMTP con nodemailer)

**Estado:** Superseded by ADR-017

> Reemplazado el 2026-11-10 por [ADR-017](./ADR-017-alertas-registradas-en-el-admin.md): en v1 las alertas se registran en la base y se ven en el admin; no se envían mails.
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** alertas, notificaciones, mail, operación

## Contexto

Como no hay revisión humana del contenido, el responsable necesita enterarse de dos eventos:
- **Umbral de reportes** (`api`): un desafío acumula ≥ 3 reportes `wrong_answer`/`ambiguous` de jugadores distintos, o esos reportes superan el 5% de las Play terminadas con un mínimo de 2 (invariante 27).
- **Falla de generación** (`generator`): falta el desafío de mañana después de 20 intentos.

Cada alerta se manda una sola vez por evento y nunca anula nada (decisión #14).

El análisis técnico había propuesto un webhook de Discord/Slack. **El usuario decidió que en v1 las alertas salen solo por mail, con nodemailer.** El servidor SMTP concreto se define con el hosting (diferido).

## Decisión

Las alertas se mandan por **mail vía SMTP con nodemailer**, desde un helper `notify(subject, text)` de `@nerdose/core/notify` (entrada solo Node, ADR-003) que usan la `api` y el `generator`.

**Semántica best-effort y una sola vez:**
1. Dentro de la transacción del evento, se reclama el envío con un `UPDATE … SET alert_sent_at = now() WHERE … AND alert_sent_at IS NULL RETURNING …`.
   - Reportes: sobre `challenges`.
   - Falla de generación: sobre `generation_failures`.
2. Si devolvió fila, se manda el mail **después del commit**.
3. Si el envío falla, se vuelve `alert_sent_at` a `NULL` para que el próximo evento lo reintente.

**Configuración** (variables de entorno de `api` y `generator`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL_FROM`, `ALERT_EMAIL_TO`.

## Reglas de Implementación

- Todo envío de alertas MUST pasar por `notify()` de `@nerdose/core/notify`. MUST NOT llamarse a nodemailer directamente desde rutas o jobs.
- `notify()` MUST usar `nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })`, con `from = ALERT_EMAIL_FROM` y `to = ALERT_EMAIL_TO`, en texto plano.
- Si las variables `SMTP_*` o `ALERT_EMAIL_*` no están definidas, `notify()` MUST loguear la alerta con nivel `warn` y devolver `false`, sin lanzar error. El proceso MUST arrancar igual.
- El reclamo MUST hacerse con `UPDATE … WHERE alert_sent_at IS NULL RETURNING`, y el envío MUST ocurrir después del `COMMIT`.
- Si `notify()` devuelve `false` o lanza, MUST ejecutarse `UPDATE … SET alert_sent_at = NULL` sobre la misma fila.
- Un fallo de envío MUST NOT cambiar la respuesta HTTP del reporte (`201`) ni hacer fallar la corrida del job.
- El umbral MUST leerse de `REPORT_ALERT_COUNT` (default 3), `REPORT_ALERT_RATIO` (default 0.05) y `REPORT_ALERT_RATIO_MIN_COUNT` (default 2). Solo cuentan los reportes con `reason IN ('wrong_answer','ambiguous')`.
- Asunto del mail de reportes: `[nerdose] Desafío #{number} {game_id}: {n} reportes`. El cuerpo MUST incluir `challenge_id`, `date`, el conteo por `reason` y el link `https://admin.nerdose.dev`.
- Asunto del mail de falla de generación: `[nerdose] Sin desafío de {game_id} para {date}`. El cuerpo MUST incluir `attempts` y el último motivo de rechazo.
- Las alertas MUST NOT anular ni despublicar nada.

## Consecuencias

### Positivas
- No hace falta configurar Discord ni Slack: el mail llega a cualquier cliente.
- Cubre el pedido "Canal de alerta: mail" que el análisis técnico había diferido.
- La semántica "una sola vez, reintentable" no depende del canal.

### Negativas
- Hace falta un servidor SMTP. Cuál se usa queda diferido con el hosting.
- El mail tarda más en verse que un mensaje de chat.

### Riesgos
- **Riesgo:** el entorno de despliegue bloquea la salida SMTP y las alertas no llegan.
  - **Mitigación:** se define al configurar el hosting. Mientras tanto, las alertas quedan en los logs (`warn`) y en el admin (reportes, próximos desafíos).
- **Riesgo:** los mails de alerta caen en spam.
  - **Mitigación:** remitente con SPF/DKIM del dominio, a definir con el hosting.

## Alternativas Consideradas

### Alternativa 1: Webhook de Discord/Slack (propuesta del análisis técnico)

**Pros:**
- Un POST HTTP, sin servidor SMTP.

**Contras:**
- El usuario no tiene ni quiere ese canal por ahora.

**Por qué se descartó:** decisión del usuario. Se puede sumar más adelante como otro transporte de `notify()`.

---

### Alternativa 2: API de un proveedor de mail (Resend, Postmark)

**Pros:**
- Mejor entregabilidad y métricas.

**Contras:**
- Dependencia de un SDK y de un proveedor concreto.

**Por qué se descartó:** SMTP con nodemailer funciona con cualquier proveedor, incluidos esos, sin atarse a uno.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Patrón 7, F5, F7, Arq-18 (modificada: webhook → mail)
- `docs/discovery/analisis-dominio.md` — Invariante 27
- `docs/prd/requirements.md` — C-37, C-49
