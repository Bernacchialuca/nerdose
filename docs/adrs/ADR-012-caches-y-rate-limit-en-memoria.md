# ADR-012: Caches y rate limit en memoria de la api

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** rendimiento, cache, rate-limiting, escalabilidad

## Contexto

Con ~1.000 jugadores diarios y un pico a las 00:00 UTC, una sola instancia de la `api` alcanza (NFR-SC01). Una jugada tiene que responder en < 300 ms P95 (NFR-P01, NFR-P03).

En el camino caliente hay dos lecturas que se repiten mucho:
- El desafío de hoy de cada juego, que es inmutable durante el día salvo una anulación.
- La lista válida de Devdle (~200k palabras), que se consulta en cada intento.

Hacen falta límites para evitar abusos (NFR-S08), sin captcha. No hay Redis (ADR-001).

## Decisión

**Caches en memoria de la `api`:**

| Cache | Contenido | Se recarga |
|---|---|---|
| Desafíos de hoy | `Map<game_id, challenge>` (`published` o `voided` de `today`) | Al cambiar el día, al arrancar y al anular |
| Lista válida de Devdle | `Set<string>` = archivo base del paquete `devdle` (generado en build) ∪ `terms.term` (`approved`) | Al arrancar y al cambiar el día |

**Rate limit** con `hono-rate-limiter` y store en memoria. La respuesta es `429` con `{ "error": { "code": "rate_limited", "message": "…" } }` y el header `Retry-After`:

| Ruta | Clave | Límite |
|---|---|---|
| `POST /api/session` | IP | 20 / 10 min |
| `POST /api/games/{game_id}/today/move` | `player_id` | 60 / min |
| `POST /api/games/{game_id}/today/move` | IP | 300 / min |
| `POST …/start`, `POST …/acknowledge-void`, `PATCH /api/me/preferences` | `player_id` | 30 / min |
| `POST /api/games/{game_id}/today/report` | IP | 10 / hora |
| `GET /api/*` | IP | 600 / min |
| `POST /api/admin/login` | IP | 5 / 15 min |
| `/api/admin/*` con JWT | – | sin límite |

## Reglas de Implementación

- La cache de desafíos MUST invalidarse al cambiar el día (ADR-008), al arrancar y al terminar `POST /api/admin/challenges/{challenge_id}/void`.
- La lista válida de Devdle MUST cargarse al arrancar y recargarse al cambiar el día. MUST contener la unión del archivo base del paquete `devdle` y los `terms` `approved`. Sumar `terms` garantiza que toda respuesta posible sea un intento válido.
- La lista válida MUST NOT enviarse al cliente ni exponerse en ninguna ruta.
- Los límites MUST ser exactamente los de la tabla, configurados con `hono-rate-limiter` y store en memoria.
- La IP del cliente MUST tomarse del header del proxy de confianza configurado (`TRUST_PROXY_HEADER`), nunca de un header arbitrario sin configurar. Con `X-Forwarded-For` MUST usarse la entrada que agregó el proxy, contando `TRUST_PROXY_HOPS` (default 1) desde la derecha: las de la izquierda las escribe el cliente. Sin header configurado, o si el request no lo trae, MUST usarse la IP de la conexión. (Corregido el 2026-11-25: antes se tomaba la primera entrada y el límite se salteaba inventando una IP por request.)
- Un `429` MUST incluir `Retry-After` en segundos y el body `{ "error": { "code": "rate_limited", "message": … } }`. MUST NOT haber captcha.
- El límite por `player_id` MUST aplicarse después de resolver la cookie `nd_pid`. Si no hay cookie, aplica solo el límite por IP.

## Consecuencias

### Positivas
- Lookups O(1) sin tocar la base en cada intento de Devdle.
- Cero infraestructura extra.
- La cache de desafíos es trivialmente consistente: se invalida en el mismo proceso que la cambia.

### Negativas
- Un reinicio pierde los contadores del rate limit (aceptable).
- La lista de Devdle ocupa unos pocos MB de memoria.
- No escala horizontalmente sin cambios.

### Riesgos
- **Riesgo:** varios jugadores detrás de una misma IP (CGNAT) chocan con el límite.
  - **Mitigación:** los límites por IP tienen margen (300/min en jugadas, 20/10 min en sesión).
- **Riesgo:** hace falta más de una instancia.
  - **Mitigación:** el rate limit pasa a Postgres o Redis y las caches se invalidan por `NOTIFY` (NFR-SC03, post-MVP).

## Alternativas Consideradas

### Alternativa 1: Redis para cache y rate limit

**Pros:**
- Listo para varias instancias.

**Contras:**
- Una pieza más que operar, sin necesidad con una instancia.

**Por qué se descartó:** sobre-ingeniería para la escala actual.

---

### Alternativa 2: Consultar la base en cada intento de Devdle

**Pros:**
- Sin estado en memoria.

**Contras:**
- Una consulta por intento sobre ~200k palabras en el pico.

**Por qué se descartó:** el `Set` en memoria es más rápido y simple.

## Referencias

- `docs/discovery/analisis-tecnico.md` — S3 api, Rate limiting, Patrón 6, F10 (sin la ampliación automática, ver ADR-016), Arq-16, Arq-17
- `docs/prd/requirements.md` — NFR-P01, NFR-P03, NFR-S08, NFR-SC01, NFR-SC03
- `docs/requests/REQ-012.ajustes-post-v1.md` — corrección de la IP del rate limit (2026-11-25, story S-061)
