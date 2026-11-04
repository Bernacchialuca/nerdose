# Nerdose

Plataforma de juegos diarios para nerds. Monorepo pnpm + Turborepo con `apps/{web,admin,api,generator}` y `packages/{core,db,ui}`.

## Requisitos

- Node.js 24 (`engines.node` `>=24 <25`).
- pnpm `11.6.0`, fijado en `packageManager` (`corepack enable`).
- Docker con Docker Compose v2.

## Primer arranque

1. Instalar dependencias:

   ```bash
   pnpm install
   ```

2. Copiar las variables de entorno (ninguno de estos archivos se versiona):

   ```bash
   cp .env.example .env
   cp packages/db/.env.example packages/db/.env.local
   cp apps/api/.env.example apps/api/.env.local
   cp apps/generator/.env.example apps/generator/.env.local
   ```

   | Archivo destino | Variables |
   |---|---|
   | `.env` (raíz, Compose) | `POSTGRES_PASSWORD` (local: cualquier valor, p. ej. `localdev`) |
   | `packages/db/.env.local` | `DATABASE_URL_OWNER` (requerida; `postgres://nerdose_owner:<POSTGRES_PASSWORD>@127.0.0.1:5432/nerdose`), `DATABASE_URL_API` y `DATABASE_URL_GENERATOR` (opcionales; `db:migrate` fija con ellas la contraseña de `nerdose_api` y `nerdose_generator`) |
   | `apps/api/.env.local` | `DATABASE_URL` (requerida; `postgres://nerdose_api:<password>@127.0.0.1:5432/nerdose`), `NODE_ENV`, `PORT` (default `3000`), `LOG_LEVEL`, `SERVICE_NAME` (opcionales) |
   | `apps/generator/.env.local` | `DATABASE_URL` (requerida; `postgres://nerdose_generator:<password>@127.0.0.1:5432/nerdose`), `NODE_ENV`, `LOG_LEVEL`, `SERVICE_NAME` (opcionales) |

   `web` y `admin` no necesitan variables.

   **Consistencia de contraseñas:** la contraseña de `nerdose_api` en `apps/api/.env.local` (`DATABASE_URL`) debe ser la misma que en `packages/db/.env.local` (`DATABASE_URL_API`); ídem `nerdose_generator` entre `apps/generator/.env.local` y `DATABASE_URL_GENERATOR`. `db:migrate` sincroniza las contraseñas de los roles desde esas URLs.

3. Levantar PostgreSQL 16 en `127.0.0.1:5432` y esperar a que figure `healthy` en `docker compose ps`:

   ```bash
   docker compose up -d
   ```

4. Migrar la base (crea `nerdose_api` y `nerdose_generator` y fija sus contraseñas; es idempotente):

   ```bash
   pnpm --filter @nerdose/db db:migrate
   ```

5. Levantar todo:

   ```bash
   pnpm dev
   ```

## Qué levanta `pnpm dev`

| App | Script `dev` | Puerto | Proxy |
|---|---|---|---|
| `api` | `tsx watch src/index.ts` | `3000` | — |
| `generator` | `tsx watch src/index.ts` | — (worker) | — |
| `web` | `vite` | `5173` (`strictPort`) | `/api` → `http://localhost:3000` |
| `admin` | `vite` | `5174` (`strictPort`) | `/api/admin` → `http://localhost:3000` |

Logs esperados: la `api` informa `Database role verified` con `db_role: nerdose_api` y `Server started` en el puerto `3000`; el `generator` informa `Database role verified` con `db_role: nerdose_generator` y `Scheduler started` con `jobs: 0`.

## Verificar

```bash
curl -i http://localhost:5173/api/health
# HTTP/1.1 200 · {"status":"ok","db":"ok"}

curl -i http://localhost:5174/api/admin/health
# HTTP/1.1 200 · {"status":"ok","db":"ok"}

curl -i http://localhost:5174/api/health
# NO llega a la api: responde index.html (text/html), no JSON
```

`admin` solo reenvía `/api/admin` a propósito: replica el comportamiento de producción.

## Comandos útiles

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` (requiere Docker: los tests de integración usan Testcontainers)
- `pnpm --filter <paquete> <script>` para correr un script de un solo paquete.

## Base de datos

- `docker compose down` detiene PostgreSQL y conserva los datos en el volumen `nerdose-pgdata`.
- `docker compose down -v` borra el volumen; después hay que volver a correr `pnpm --filter @nerdose/db db:migrate`.

## Problemas comunes

- **Una tarea falla y se cortan todas:** `turbo run dev` detiene todo si una tarea termina con error. Lo típico es el `generator` sin base (`Database unavailable at startup`): levantar Postgres y migrar.
- **`502`/`504` en `/api/...` desde `web` o `admin`:** la `api` no está corriendo.
- **Puerto ocupado:** `5173` y `5174` usan `strictPort` y fallan en lugar de cambiar de puerto.
- **`password authentication failed for user "nerdose_api"`:** las contraseñas de los `.env.local` no coinciden. Corregirlas y volver a correr `db:migrate`.

Hosting, CI/CD y despliegue: fuera de alcance por ahora.
