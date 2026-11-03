# ADR-009: Identidad del jugador anónimo (cookie `nd_pid`)

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** autenticación, identidad, cookies, privacidad, seguridad

## Contexto

Los jugadores juegan sin registrarse (decisión #20), pero sus partidas, rachas y estadísticas viven en el servidor. Hace falta una identidad anónima:
- sin PII y sin banner de cookies (NFR-PR01);
- imposible de adivinar;
- que no expire mientras el jugador siga volviendo;
- que no se mande al admin.

Más adelante se pueden sumar cuentas (`User`) sin migrar datos.

## Decisión

El jugador se identifica con la cookie funcional **`nd_pid`**, cuyo valor es `players.id` (UUID v4).

| Pieza | Definición |
|---|---|
| Emisión | `POST /api/session`, idempotente: si la cookie es válida y el player existe, renueva la cookie y actualiza `last_seen_at`; si no, crea un Player |
| Atributos | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, sin `Domain` (host-only en `nerdose.dev`) |
| Duración | `Max-Age=34560000` (400 días), renovada en cada `POST /api/session`. El front lo llama en cada carga |
| Cookies bloqueadas | `GET /api/today` funciona sin cookie (`has_session: false`). Si sigue en `false` después de `POST /api/session`, el front muestra un aviso y no deja jugar |
| CSRF | Mismo origen + `SameSite=Lax` + mutaciones solo con `Content-Type: application/json` + chequeo del header `Origin`. Sin token CSRF |
| CORS | Deshabilitado |

`players.user_id` (nullable) queda reservado para enlazar un `User` en el futuro.

## Reglas de Implementación

- El nombre de la cookie MUST ser `nd_pid` y su valor MUST ser el `players.id` (UUID v4) tal cual.
- La cookie MUST emitirse con `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=34560000` y MUST NOT llevar atributo `Domain`.
- `POST /api/session` MUST ser idempotente y responder `200 { locale, preferred_code_language, created }`.
- Al crear un Player, `locale` MUST salir de `Accept-Language` si es `es` o `en`, y si no, `es`. `preferred_code_language` MUST ser `js`.
- Un `nd_pid` que no corresponde a un Player existente MUST tratarse como ausente (se crea otro Player y se reemplaza la cookie).
- Las rutas de jugador que lo exigen MUST responder `401` con `{ "error": { "code": "no_session", … } }` si falta la cookie o no es válida.
- `GET /api/today` MUST funcionar sin cookie y devolver `has_session: false`.
- Toda mutación (`POST`, `PATCH`) MUST rechazar con `415` un `Content-Type` distinto de `application/json`, y con `403 forbidden_origin` un header `Origin` ausente o distinto del permitido: `WEB_ORIGIN` para las rutas de jugador y `ADMIN_ORIGIN` para `/api/admin/*`. Ambas variables son **obligatorias** en todos los ambientes (producción: `https://nerdose.dev` y `https://admin.nerdose.dev`; local: los orígenes del dev server de Vite). El chequeo nunca se desactiva por falta de configuración.
- La `api` MUST NOT emitir headers CORS.
- MUST NOT guardarse PII del jugador (ni IP, ni email, ni fingerprint) en `players`. El `user_agent` solo se guarda en el `context` de un reporte.

## Consecuencias

### Positivas
- Cero fricción para jugar y sin banner de cookies.
- El UUID v4 tiene 122 bits aleatorios: no se puede adivinar.
- La cookie host-only nunca llega a `admin.nerdose.dev`.
- Separar `Player` de `User` permite sumar cuentas sin migrar.

### Negativas
- Si se borra la cookie, se pierden el historial y las rachas (límite aceptado).
- Un jugador puede borrar la cookie, perder adrede y ver la respuesta (aceptado mientras no haya rankings).

### Riesgos
- **Riesgo:** creación masiva de Players por un bot.
  - **Mitigación:** rate limit de 20 por cada 10 min por IP en `POST /api/session` (ADR-012).

## Alternativas Consideradas

### Alternativa 1: Identificador en `localStorage` enviado como header

**Pros:**
- No depende de cookies.

**Contras:**
- Es accesible desde JS (XSS) y obliga a manejar el header en cada request.

**Por qué se descartó:** una cookie `HttpOnly` es más segura y transparente.

---

### Alternativa 2: Cuentas obligatorias (Better Auth, OAuth)

**Pros:**
- Progreso recuperable entre dispositivos.

**Contras:**
- Fricción de entrada y PII.

**Por qué se descartó:** contradice la decisión #20. Queda para el futuro.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Tokens y Autenticación (Cookie de jugador), F1, Arq-11, Arq-12
- `docs/discovery/analisis-dominio.md` — Player, User
