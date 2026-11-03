# db — Overview

## Proposito
Paquete `@nerdose/db` (`packages/db`): único lugar con el schema Drizzle y las migraciones (ADR-003, ADR-004). Expone `createDb(url)`, el schema, la migración `0000_roles_and_grants` (roles `nerdose_api` y `nerdose_generator` sin contraseña, `GRANT` explícitos), el script `db:migrate` (aplica migraciones con `nerdose_owner` y sincroniza credenciales) y la entrada `./testing` (`createRoles`, `migrateAsOwner`, `truncateAll`) para los tests de integración con Testcontainers. El diseño de las tablas está en `docs/db-schemas/nerdose-db.md`.

## Tipo de servicio
Library en node (TypeScript, Drizzle ORM + drizzle-kit + postgres.js). Vive en `packages/db` y lo importan solo `api` y `generator`; `web` y `admin` nunca.

## Modulos del dominio
- **schema**: tablas Drizzle, índices y vistas `metrics_*` (cada tabla con sus `GRANT`).
- **migrations**: `packages/db/migrations/`, SQL manual vía `drizzle-kit generate --custom` donde Drizzle no alcanza, y `db:migrate`.
- **roles**: roles de servicio y control de acceso por tabla y columna (ADR-004).
- **testing-utils**: entrada `./testing`.

## Notas adicionales
- **Convenciones copiadas tal cual** de `api` (con `library` agregado a `applies_to` cuando faltaba): `orm`, `env-config`, `testing` y `error-handling`. Si se cambia una, hay que cambiar la otra. No hay convenciones nuevas.
- **`error-handling`** se lista explícitamente porque ninguna convención activa del paquete la requiere por `required_by`.
- **Variables de entorno:** `DATABASE_URL_OWNER` (obligatoria para `db:migrate`), `DATABASE_URL_API` y `DATABASE_URL_GENERATOR` (opcionales, solo las lee el script de migración).
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
