# ADR-015: Contratos JSON en `snake_case`, i18n de respuestas y formato de errores

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** api, contratos, errores, i18n, convenciones

## Contexto

Los nombres de entidades, campos y enums del dominio están en inglés y en `snake_case`. Esos nombres se transcriben a la base, a la API, a los flujos y al código.

Si el JSON de la API usara `camelCase`, cada capa tendría que traducir nombres. Además, los flujos y las specs OpenAPI dejarían de coincidir literalmente con el DBML. Esa coincidencia es un requisito de los estándares técnicos del proyecto.

El contenido bilingüe se guarda como `{ es, en }`, pero el cliente necesita recibir un solo idioma. Los errores tienen que ser tipados para que el front reaccione: por ejemplo, ante `challenge_expired` recarga el desafío.

## Decisión

- **JSON en `snake_case`**, con los mismos nombres que el dominio y la DB, sin traducir a `camelCase`.
- **Locale de la respuesta:** `?lang=` → `players.locale` → `Accept-Language` → `es`. La `api` resuelve los campos `{ es, en }` antes de responder. El admin es la excepción: recibe `payload` con los dos idiomas.
- **Errores:** `{ "error": { "code": "<code>", "message": "<texto en el locale>" } }` con un catálogo cerrado de códigos en `@nerdose/core`.
- **Rutas sin versión:** `/api/*` y `/api/admin/*`. La `api` y sus únicos clientes (`web`, `admin`) se despliegan juntos.

**Catálogo de códigos de error:**

| HTTP | `code` | Cuándo |
|---|---|---|
| 401 | `no_session` | Ruta de jugador sin cookie `nd_pid` válida |
| 401 | `unauthorized` | Ruta de admin sin JWT válido |
| 401 | `invalid_credentials` | Login de admin con contraseña incorrecta |
| 403 | `forbidden_origin` | Mutación con `Origin` no permitido |
| 404 | `no_challenge_today` | No hay desafío de hoy publicado ni anulado para ese juego |
| 404 | `not_found` | Recurso inexistente (`game_id`, `challenge_id`, `report_id`) |
| 409 | `challenge_expired` | `challenge_number` distinto del de hoy |
| 409 | `challenge_voided` | Jugada sobre un desafío anulado |
| 409 | `game_finished` | Jugada sobre una Play que no está `in_progress` |
| 409 | `already_reported` | Segundo reporte del mismo jugador al mismo desafío |
| 409 | `not_voidable` | Anular un desafío que no está `published` |
| 409 | `not_regenerable` | Regenerar un desafío que no está `approved` o con `date <= today` |
| 409 | `not_voided` | `acknowledge-void` sobre un desafío que no está anulado |
| 409 | `report_not_open` | Resolver o descartar un reporte que ya no está `open` |
| 415 | `unsupported_media_type` | Mutación sin `Content-Type: application/json` |
| 422 | `invalid_move` | La jugada no pasa `moveSchema` o es inválida para el estado |
| 422 | `not_in_word_list` | Intento de Devdle fuera de la lista válida (no consume intento) |
| 422 | `invalid_report` | Reporte con `reason` inválido o `message` > 1000 caracteres |
| 422 | `validation_error` | Cualquier otro body, query o param inválido |
| 429 | `rate_limited` | Límite superado (con `Retry-After`) |
| 500 | `internal_error` | Error no previsto |

## Reglas de Implementación

- Todas las propiedades JSON de requests y responses MUST estar en `snake_case` y coincidir con los nombres de `docs/apis/api.yaml` y `docs/db-schemas/nerdose-db.md`. MUST NOT haber transformaciones a `camelCase` en la `api` ni en los clientes HTTP de `web` y `admin`.
- Toda respuesta de error MUST tener exactamente la forma `{ "error": { "code": string, "message": string } }`, con `code` del catálogo de arriba (exportado como enum desde `@nerdose/core`).
- `message` MUST estar en el locale resuelto de la request. MUST NOT incluir stack traces ni detalles internos.
- El locale MUST resolverse en este orden: query `lang` (`es`|`en`) → `players.locale` → `Accept-Language` → `es`.
- Las respuestas de jugador MUST NOT incluir objetos `{ es, en }`: todo texto de contenido llega ya resuelto como string.
- Las respuestas de `/api/admin/*` que incluyen `payload` MUST devolverlo completo, con los dos idiomas.
- Las fechas de día MUST serializarse como `YYYY-MM-DD` y los instantes como ISO 8601 UTC con `Z`.
- Los enums MUST serializarse con sus valores exactos del dominio (`game_id`: `devdle | bug-hunt | big-o | timeline | grep-grid`; `code_language`: `js | go | java`; `locale`: `es | en`).
- Los errores no previstos MUST loguearse con pino (nivel `error`, con stack) y responder `500 internal_error`.

## Consecuencias

### Positivas
- Los nombres coinciden en dominio, DB, OpenAPI, flujos y código.
- El front maneja errores por `code`, no por texto.
- El cliente nunca recibe los dos idiomas: menos peso y nada que resolver en el front.

### Negativas
- El `snake_case` en TypeScript se aparta de la convención habitual de JS.
- Rutas sin versión: un cambio rompedor exige desplegar `api` y clientes juntos.

### Riesgos
- **Riesgo:** algún código de error se usa con un significado distinto según el endpoint.
  - **Mitigación:** catálogo cerrado en `core`, y la spec OpenAPI declara qué códigos devuelve cada endpoint.

## Alternativas Consideradas

### Alternativa 1: `camelCase` en la API con mapeo desde la DB

**Pros:**
- Idiomático en JS.

**Contras:**
- Una capa de traducción en cada borde, y flujos y specs que no coinciden con el DBML.

**Por qué se descartó:** rompe la coincidencia literal entre contratos que exigen los estándares técnicos.

---

### Alternativa 2: Versionado en la URL (`/api/v1`)

**Pros:**
- Permite convivir versiones.

**Contras:**
- No hay clientes externos: `web` y `admin` se despliegan con la `api`.

**Por qué se descartó:** complejidad sin consumidores que la necesiten.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Convención de nombres, Convenciones de todos los flujos, Arq-20
- `.claude/specs/technical-standards.md` — System Flows (nombres de campos idénticos)
