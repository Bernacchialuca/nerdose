# ADR-005: Comunicación api ↔ generator por PostgreSQL

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** comunicación, cola, listen-notify, regeneración

## Contexto

`api` y `generator` necesitan coordinarse en pocos puntos:
- La `api` lee los desafíos que el `generator` aprobó.
- La `api` publica los del día (ADR-008).
- La `api` anula desafíos y rechaza ítems de los bancos (anulación).
- El admin pide **regenerar** un desafío aprobado, y el responsable espera el resultado "al instante" (el worker siempre activo es una decisión del usuario).

El `generator` no expone interfaz de red (ADR-001), y no hay broker (ADR-001).

## Decisión

**`api` y `generator` no se llaman entre sí: se coordinan solo a través de PostgreSQL**, con la propiedad de tablas de ADR-004.

El único mensaje entre backends es el **pedido de regeneración**, implementado como cola en Postgres:

1. La `api` hace `INSERT` en `generation_requests` (`status='pending'`; uno pendiente por challenge) y ejecuta `SELECT pg_notify('generation_requests', <request_id>)`.
2. El `generator` escucha con `LISTEN generation_requests` y, además, hace un poll cada 60 s como respaldo.
3. El `generator` toma el pedido con `SELECT … FROM generation_requests WHERE status='pending' FOR UPDATE SKIP LOCKED`.
4. Si genera y verifica uno nuevo, hace el reemplazo en una transacción: el viejo pasa a `rejected` (`verification.reason='regenerated'`), el nuevo a `approved` y el pedido a `done` con `new_challenge_id`.
5. Si falla tras los reintentos, el pedido pasa a `failed` con `error`, y el viejo sigue `approved`.
6. El admin hace polling de `GET /api/admin/challenges/upcoming` mientras haya pedidos pendientes.

## Reglas de Implementación

- `api` y `generator` MUST NOT comunicarse por HTTP, sockets ni archivos. Toda coordinación MUST pasar por tablas de `nerdose-db`.
- El nombre del canal MUST ser exactamente `generation_requests`, y el payload del `NOTIFY` MUST ser solo el `request_id` (uuid). El dato real se lee de la tabla.
- `POST /api/admin/challenges/{challenge_id}/regenerate` MUST responder `409 not_regenerable` si `challenges.status ≠ 'approved'` o `challenges.date <= today`.
- Si ya existe un `generation_requests` con `status='pending'` para ese `challenge_id`, la `api` MUST devolver ese `request_id` (`202`) sin crear otro.
- El `generator` MUST tomar pedidos con `FOR UPDATE SKIP LOCKED` y MUST hacer un poll de respaldo cada 60 s.
- El reemplazo viejo→nuevo MUST hacerse en una sola transacción. El desafío viejo MUST seguir `approved` hasta que el nuevo esté verificado.
- `generation_requests.status` MUST ser uno de `pending | done | failed | cancelled`. `cancelled` (REQ-008) marca el pedido que el `generator` no atiende porque la fecha llegó o el challenge dejó de ser `approved`; `failed` queda para la verificación fallida tras todos los intentos.
- El `NOTIFY` es fire-and-forget: la respuesta al admin MUST NOT depender de que el `generator` esté vivo.

## Consecuencias

### Positivas
- No hace falta broker ni API interna: una cola durable con reacción inmediata.
- Si el `generator` está caído, los pedidos quedan en la tabla y se procesan al volver (el poll cubre los `NOTIFY` perdidos).
- Regenerar nunca deja un día sin desafío.

### Negativas
- La `api` no sabe en el momento si la regeneración funcionó: el admin tiene que hacer polling.
- `LISTEN` requiere una conexión dedicada y persistente en el `generator`.

### Riesgos
- **Riesgo:** se pierde la conexión de `LISTEN` y no se reconecta.
  - **Mitigación:** el poll de 60 s procesa los pendientes igual, y el cliente reconecta al detectar el error.

## Alternativas Consideradas

### Alternativa 1: Endpoint HTTP interno en el `generator`

**Pros:**
- Respuesta síncrona al admin.

**Contras:**
- El `generator` expondría un puerto y necesitaría auth interna.
- La regeneración puede tardar (ejecuta código), lo que dejaría requests largos.

**Por qué se descartó:** agrega superficie de red y acoplamiento temporal sin necesidad.

---

### Alternativa 2: Redis + BullMQ

**Pros:**
- Cola con reintentos y UI de jobs.

**Contras:**
- Una pieza más de infraestructura para unos pocos mensajes por semana.

**Por qué se descartó:** Postgres ya resuelve la cola con `SKIP LOCKED` y `NOTIFY`.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Comunicación entre Servicios (Patrones 2 y 3, Canales de mensajería), F8, Arq-9, Arq-10
- ADR-001, ADR-004, ADR-007
