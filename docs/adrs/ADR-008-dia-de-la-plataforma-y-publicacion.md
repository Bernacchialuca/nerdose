# ADR-008: Día de la plataforma, publicación perezosa y jugada tardía

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** fechas, publicación, consistencia, api

## Contexto

Todos los jugadores juegan el mismo desafío por juego y día. El día cambia a las 00:00 UTC (decisión #2), y "hoy" lo calcula siempre el servidor.

La publicación del día no puede depender de que otro proceso esté vivo justo en el pico de tráfico de las 00:00 UTC (NFR-A02).

Las rutas de jugada son siempre `…/today/…`. Si un jugador tiene abierta la partida de ayer y manda una jugada a las 00:00:05, sin más información se aplicaría al desafío nuevo.

## Decisión

**Día de la plataforma:** `today = (now() AT TIME ZONE 'UTC')::date`, calculado en `@nerdose/core`. `number = today − LAUNCH_DATE + 1`.

**Publicación perezosa en la `api`:** el primer request con `today ≠ current_day` (variable en memoria) ejecuta, **una sola vez** (single-flight):
1. `UPDATE challenges SET status='published' WHERE status='approved' AND date = :today`
2. Recarga la cache de desafíos de hoy y la lista válida de Devdle.
3. `current_day = today`.

Lo mismo pasa al arrancar el proceso. Es idempotente y solo toca la fecha de hoy.

**Jugada tardía:** toda mutación de partida (`start`, `move`, `report`, `acknowledge-void`) lleva `challenge_number` en el body. Si no coincide con el `number` de hoy, la respuesta es `409 challenge_expired`. El cliente nunca manda una fecha.

## Reglas de Implementación

- `today` MUST calcularse siempre en el servidor con la función de `@nerdose/core` (día UTC). MUST NOT aceptarse una fecha del cliente en ninguna ruta de jugador.
- `number` MUST ser `today − LAUNCH_DATE + 1`, con `LAUNCH_DATE` (`YYYY-MM-DD`) como variable de entorno compartida por `api` y `generator`.
- La publicación MUST ejecutarse con el primer request del día y al arrancar, protegida con single-flight en memoria: un solo request ejecuta y los concurrentes esperan esa misma promesa.
- La sentencia de publicación MUST ser exactamente `UPDATE challenges SET status='published' WHERE status='approved' AND date = :today`. MUST NOT publicar fechas pasadas ni futuras.
- Un `approved` de un día en el que la `api` nunca corrió MUST quedarse `approved`, y ese día es neutro para las rachas.
- Los bodies de `POST /api/games/{game_id}/today/start`, `/move`, `/report` y `/acknowledge-void` MUST incluir `challenge_number` (entero ≥ 1).
- Si `challenge_number ≠ number` de hoy, la `api` MUST responder `409` con `{ "error": { "code": "challenge_expired", … } }`.
- Una Play `in_progress` de un día pasado MUST quedar `in_progress` para siempre y no contar como completada.
- `GET /api/today` MUST devolver `next_reset_at` (próxima 00:00 UTC, ISO 8601) y `seconds_to_reset`. Al llegar a 0, el front MUST esperar 0–3 s al azar antes de volver a pedir.

## Consecuencias

### Positivas
- La publicación no depende del `generator` ni de un cron a las 00:00.
- Es idempotente y segura ante reinicios.
- La jugada tardía se detecta sin que el cliente mande fechas.
- El jitter del cliente reparte el pico de las 00:00.

### Negativas
- El primer request del día paga la latencia de la publicación y de la recarga de caches.
- Depende de la instancia única: con varias instancias, el single-flight tiene que pasar a un advisory lock.

### Riesgos
- **Riesgo:** el reloj del servidor está desfasado.
  - **Mitigación:** NTP en el host (parte del hosting). Toda la lógica usa un único reloj, el del servidor.

## Alternativas Consideradas

### Alternativa 1: El generator publica con un job a las 00:00

**Pros:**
- Separa responsabilidades.

**Contras:**
- Si el `generator` está caído a las 00:00, no se publica nada.

**Por qué se descartó:** viola NFR-A02.

---

### Alternativa 2: Mandar la fecha del desafío en lugar del número

**Pros:**
- Más explícito.

**Contras:**
- Invita a confiar en una fecha del cliente.

**Por qué se descartó:** el número es el identificador público que ya usa el share, y el servidor sigue siendo el único que calcula "hoy".

## Referencias

- `docs/discovery/analisis-tecnico.md` — Patrón 5, F1, F4, Arq-7, Arq-14
- `docs/discovery/analisis-dominio.md` — Invariantes 3, 5, 15
