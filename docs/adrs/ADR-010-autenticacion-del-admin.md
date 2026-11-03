# ADR-010: Autenticación del admin

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** autenticación, admin, jwt, seguridad

## Contexto

El admin (`admin.nerdose.dev`) muestra las soluciones de los próximos 14 días y permite anular desafíos (decisión #21). Lo usa una sola persona: no hay multiusuario ni roles.

Hace falta proteger `/api/admin/*` con algo simple, sin una librería de auth completa y sin guardar la contraseña en texto plano. La sesión dura 8 horas y hay que protegerse de la fuerza bruta (NFR-S07).

## Decisión

- **Login:** `POST /api/admin/login { password }`. La `api` compara contra `ADMIN_PASSWORD_HASH` (scrypt de `node:crypto`) con `timingSafeEqual`.
- **Token:** JWT HS256 firmado con `ADMIN_JWT_SECRET`, con claims `{ sub: "admin", iat, exp }` y una duración de 8 h, sin refresh.
- **Almacenamiento y transporte:** `sessionStorage` del admin + `Authorization: Bearer <token>`.
- **Revocación:** rotar `ADMIN_JWT_SECRET` invalida todas las sesiones.

## Reglas de Implementación

- `ADMIN_PASSWORD_HASH` MUST tener el formato `scrypt$<N>$<r>$<p>$<salt_base64>$<hash_base64>`. La verificación MUST usar `crypto.scrypt` y `crypto.timingSafeEqual`. MUST NOT existir una variable con la contraseña en texto plano.
- El repo MUST incluir un script (`pnpm --filter api admin:hash`) que genere `ADMIN_PASSWORD_HASH` a partir de una contraseña ingresada por stdin.
- El JWT MUST firmarse con `hono/jwt`, algoritmo `HS256` y `ADMIN_JWT_SECRET` (≥ 32 bytes aleatorios). Claims: exactamente `sub: "admin"`, `iat` y `exp = iat + 28800`.
- `POST /api/admin/login` MUST responder `200 { token, expires_at }` (`expires_at` en ISO 8601 UTC) o `401` con `{ "error": { "code": "invalid_credentials", … } }`.
- `POST /api/admin/login` MUST limitarse a 5 intentos cada 15 minutos por IP (`429 rate_limited`).
- Todas las rutas `/api/admin/*`, salvo `POST /api/admin/login` y `GET /api/admin/health`, MUST exigir `Authorization: Bearer <jwt>` válido. Si falta, es inválido o venció, MUST responder `401` con `{ "error": { "code": "unauthorized", … } }`.
- El admin MUST guardar el token en `sessionStorage` (nunca en `localStorage` ni en una cookie) y, ante un `401`, MUST borrarlo y volver al login.
- Las rutas `/api/admin/*` MUST NOT leer ni emitir la cookie `nd_pid`.
- MUST NOT haber refresh tokens ni usuarios múltiples.

## Consecuencias

### Positivas
- No hace falta una librería de auth ni una tabla de usuarios.
- La contraseña no se guarda en claro y la comparación no filtra información por tiempo.
- El token se borra al cerrar la pestaña.

### Negativas
- No se puede revocar una sesión individual: solo todas, rotando el secreto.
- Re-login cada 8 h.

### Riesgos
- **Riesgo:** se filtra `ADMIN_JWT_SECRET`.
  - **Mitigación:** rotarlo invalida todo. Vive solo en el entorno de la `api`.
- **Riesgo:** XSS en el admin roba el token de `sessionStorage`.
  - **Mitigación:** el admin no renderiza HTML de terceros, y React escapa por defecto. Los textos de reportes de jugadores se muestran como texto.

## Alternativas Consideradas

### Alternativa 1: Cookie de sesión del admin

**Pros:**
- `HttpOnly`, inaccesible desde JS.

**Contras:**
- Habría que manejar CSRF también en el admin, y el JWT por header ya está resuelto en Hono.

**Por qué se descartó:** para un solo usuario, Bearer en `sessionStorage` es más simple. El riesgo de XSS es bajo en una app interna sin contenido de terceros.

---

### Alternativa 2: Proveedor externo (OAuth, Cloudflare Access)

**Pros:**
- 2FA y auditoría.

**Contras:**
- Dependencia externa y configuración extra.

**Por qué se descartó:** desproporcionado para un admin de una persona. Se puede sumar delante sin cambiar la `api`.

## Referencias

- `docs/discovery/analisis-tecnico.md` — JWT de admin, F11, Arq-13
- `docs/prd/requirements.md` — NFR-S07
