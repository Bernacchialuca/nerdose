# ADR-017: Alertas registradas en la base y visibles en el admin

**Estado:** Accepted
**Fecha:** 2026-11-10
**Decisores:** Responsable de nerdose
**Etiquetas:** alertas, operación, admin

**Reemplaza a:** ADR-013 (Alertas por mail)

## Contexto

Como no hay revisión humana del contenido, el responsable necesita enterarse de dos eventos:
- **Umbral de reportes** (`api`): un desafío acumula ≥ 3 reportes `wrong_answer`/`ambiguous` de jugadores distintos, o esos reportes superan el 5% de las Play terminadas con un mínimo de 2 (invariante 27).
- **Falla de generación** (`generator`): falta el desafío de mañana después de 20 intentos.

El ADR-013 resolvía esto con mails por SMTP (nodemailer). Eso obligaba a tener un servidor SMTP, que es una decisión diferida con el hosting, y sumaba una lógica de "reclamar, enviar después del commit y liberar si falla". **El usuario decidió que en v1 las alertas no salgan del sistema:** quedan registradas en la base y el responsable las ve en el admin.

## Decisión

Una alerta es **un registro en la base**, no un mensaje. No hay canal de salida (ni mail, ni webhook, ni push) en v1.

- **Umbral de reportes:** dentro de la transacción del reporte, la `api` marca el desafío con `UPDATE challenges SET alerted_at = now() WHERE id = … AND alerted_at IS NULL`. La marca se pone una sola vez y nunca se borra. `GET /api/admin/reports` devuelve `alerted_at` en cada grupo y ordena primero los alertados.
- **Falla de generación:** el `generator` hace `UPSERT generation_failures` (una fila por `game_id` + `date`, con `attempts` y `last_reason`). La fila es la alerta. `GET /api/admin/challenges/upcoming` devuelve las fallas de los días que muestra.

Se eliminan `nodemailer`, la entrada `@nerdose/core/notify`, la convención `alerts-mail` y las variables `SMTP_*` / `ALERT_EMAIL_*`. La columna `challenges.alert_sent_at` se renombra a `alerted_at`, y `generation_failures` no tiene columna de alerta.

## Reglas de Implementación

- Las alertas MUST NOT salir del sistema en v1: ningún servicio MUST enviar mails, webhooks ni notificaciones push.
- La marca del umbral MUST hacerse con `UPDATE challenges SET alerted_at = now() WHERE id = $1 AND alerted_at IS NULL` en la **misma transacción** que inserta el reporte. MUST NOT volver a `NULL`.
- El umbral MUST leerse de `REPORT_ALERT_COUNT` (default 3), `REPORT_ALERT_RATIO` (default 0.05) y `REPORT_ALERT_RATIO_MIN_COUNT` (default 2). Solo cuentan los reportes con `reason IN ('wrong_answer','ambiguous')`, de jugadores distintos.
- La falla de generación MUST registrarse con `INSERT … ON CONFLICT (game_id, date) DO UPDATE SET attempts, last_reason, updated_at`. Una corrida posterior para la misma fecha MUST actualizar esa fila, no crear otra.
- `GET /api/admin/reports` MUST incluir `alerted_at` por grupo y ordenar primero los grupos con `alerted_at` no nulo.
- `GET /api/admin/challenges/upcoming` MUST incluir, por día y juego, la falla registrada (`attempts`, `last_reason`) cuando no hay desafío.
- Las alertas MUST NOT anular ni despublicar nada.

## Consecuencias

### Positivas
- No hace falta servidor SMTP ni secretos de mail. Una dependencia menos (`nodemailer`) y una entrada menos en `@nerdose/core`.
- La semántica "una sola vez" queda en una sola sentencia SQL, sin envío después del commit ni liberación ante fallas.
- Los tests no necesitan stubs de envío: alcanza con verificar la base.

### Negativas
- El responsable se entera solo si entra al admin. No hay aviso activo.

### Riesgos
- **Riesgo:** el responsable no entra al admin y una falla de generación pasa desapercibida.
  - **Mitigación:** con 14 días aprobados por adelantado, el `generator` puede estar caído hasta 13 días sin dejar un juego sin desafío (NFR-A03). El admin muestra los huecos y las fallas en Próximos desafíos. Un canal activo (mail, webhook) se puede sumar más adelante leyendo estos mismos registros, sin cambiar el modelo.
- **Riesgo:** un desafío con reportes masivos queda publicado hasta que el responsable lo revisa.
  - **Mitigación:** es lo mismo que con mail: las alertas nunca anulan nada (decisión #14). El desafío alertado aparece primero en Reportes.

## Alternativas Consideradas

### Alternativa 1: Mantener el mail por SMTP (ADR-013)

**Pros:**
- Aviso activo, sin entrar al admin.

**Contras:**
- Requiere servidor SMTP, que depende del hosting (diferido), y una lógica de reclamo y liberación.

**Por qué se descartó:** decisión del usuario. Se puede volver a sumar como consumidor de `alerted_at` y `generation_failures`.

---

### Alternativa 2: Webhook de Discord/Slack

**Pros:**
- Un POST HTTP, sin servidor SMTP.

**Contras:**
- Agrega una salida de red y un canal que el usuario no usa.

**Por qué se descartó:** mismo motivo; queda como posible canal futuro.

## Referencias

- ADR-013 — Alertas por mail (reemplazado)
- `docs/discovery/analisis-dominio.md` — Invariante 27
- `docs/prd/requirements.md` — C-37, C-39, C-43, C-49
