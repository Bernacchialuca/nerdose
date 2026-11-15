# Nerdose

Plataforma de juegos diarios para nerds. Monorepo pnpm + Turborepo con `apps/{web,admin,api,generator}`, `packages/{core,db,ui,polyglot}` y un paquete por juego en `packages/games/*`.

## Estructura

### `apps/`

```
apps/
├── api/            # backend HTTP (Hono, :3000)
├── generator/      # worker con scheduler (sin puerto)
├── web/            # sitio público (React + Vite, :5173)
└── admin/          # panel de administración (React + Vite, :5174)
```

### `packages/`

```
packages/
├── core/           # tipos y contratos compartidos (isomorfo)
├── db/             # base de datos (Drizzle)
├── games/          # un paquete por juego: devdle, grep-grid, timeline, big-o, bug-hunt
├── polyglot/       # árbol de código, emisores JS/Go/Java y runner
└── ui/             # identidad visual compartida
```

### Raíz (workspace)

```
.
├── package.json          # scripts que delegan en Turborepo
├── pnpm-workspace.yaml   # apps/* y packages/*
├── turbo.json            # tareas dev, lint, typecheck, test
├── tsconfig.base.json
├── eslint.config.js      # incluye los límites de importación entre paquetes
├── vitest.config.ts
├── compose.yaml          # PostgreSQL 16 local
├── .env.example
└── test/                 # tests del workspace
```

## Requisitos

- Node.js 24 (`engines.node` `>=24 <25`).
- pnpm `11.6.0`, fijado en `packageManager` (`corepack enable`).
- Docker con Docker Compose v2.
- Go >= 1.25 y JDK 21, con `go` y `java` en el `PATH`. Los usa `@nerdose/polyglot` para ejecutar el código emitido en Go y en Java (Java en modo source-file, `java Main.java`); JavaScript corre con el mismo Node.js 24. Lo necesitan el `generator` (verifica por ejecución los desafíos de Big O y Bug Hunt) y los tests de integración de `@nerdose/polyglot`, `@nerdose/game-big-o` y `@nerdose/game-bug-hunt`.

Para verificarlos:

```bash
node --version   # v24.x
go version       # go1.25 o superior
java -version    # openjdk version "21.x"
```

Los tests de integración de `@nerdose/polyglot`, `@nerdose/game-big-o` y `@nerdose/game-bug-hunt` ejecutan los tres toolchains y fallan (no se saltean) si falta uno o la versión no es la pedida, con `Missing toolchain: …` o `Wrong toolchain version: …`. Las versiones no se sustituyen. Para verificarlos sin la cache de Turborepo: `pnpm --filter @nerdose/polyglot --filter @nerdose/game-big-o --filter @nerdose/game-bug-hunt test`.

**Usuario no root:** el runner de `@nerdose/polyglot` nunca ejecuta código como root. Si el proceso corre como root, exige `RUNNER_UID` y `RUNNER_GID` (enteros mayores que 0: el usuario y el grupo no root con los que corre cada programa) y, si faltan, no ejecuta nada y devuelve `runner_requires_non_root`. En local, corriendo como usuario normal, no hacen falta.

## Primer arranque

1. Instalar dependencias:

   ```bash
   pnpm install
   ```

2. Copiar las variables de entorno (ninguno de estos archivos se versiona):

   ```bash
   cp .env.example .env
   cp packages/db/.env.example packages/db/.env.local
   cp packages/content/.env.example packages/content/.env.local
   cp packages/games/devdle/.env.example packages/games/devdle/.env.local
   cp apps/api/.env.example apps/api/.env.local
   cp apps/generator/.env.example apps/generator/.env.local
   ```

   | Archivo destino                    | Variables                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
   | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `.env` (raíz, Compose)             | `POSTGRES_PASSWORD` (local: cualquier valor, p. ej. `localdev`)                                                                                                                                                                                                                                                                                                                                                                                                                                            |
   | `packages/db/.env.local`           | `DATABASE_URL_OWNER` (requerida; `postgres://nerdose_owner:<POSTGRES_PASSWORD>@127.0.0.1:5432/nerdose`), `DATABASE_URL_API` y `DATABASE_URL_GENERATOR` (opcionales; `db:migrate` fija con ellas la contraseña de `nerdose_api` y `nerdose_generator`)                                                                                                                                                                                                                                                      |
   | `packages/content/.env.local`      | `WIKIMEDIA_CONTACT` (requerida solo para `pnpm --filter @nerdose/content import:banks`; mail o URL que va en el `User-Agent` de Wikimedia)                                                                                                                                                                                                                                                                                                                                                                 |
   | `packages/games/devdle/.env.local` | `WIKIMEDIA_CONTACT` (requerida solo para `pnpm --filter @nerdose/game-devdle build:wordlist`; mail o URL que va en el `User-Agent` de Wikimedia)                                                                                                                                                                                                                                                                                                                                                           |
   | `apps/api/.env.local`              | `DATABASE_URL` (requerida; `postgres://nerdose_api:<password>@127.0.0.1:5432/nerdose`), `LAUNCH_DATE` (requerida, la misma que en el generator), `WEB_ORIGIN` y `ADMIN_ORIGIN` (requeridas; local `http://localhost:5173` y `http://localhost:5174`), `ADMIN_PASSWORD_HASH` (requerida; salida de `echo -n '<contraseña>' \| pnpm --filter api admin:hash`), `ADMIN_JWT_SECRET` (requerida, 32 o más caracteres aleatorios), `NODE_ENV`, `PORT` (default `3000`), `LOG_LEVEL`, `SERVICE_NAME` (opcionales) |
   | `apps/generator/.env.local`        | `DATABASE_URL` (requerida; `postgres://nerdose_generator:<password>@127.0.0.1:5432/nerdose`), `LAUNCH_DATE` (requerida, la misma que en la api), `GENERATOR_SECRET` (requerida, 32 o más caracteres aleatorios, solo en el generator), `GENERATION_MAX_ATTEMPTS` (opcional, default 20), `NODE_ENV`, `LOG_LEVEL`, `SERVICE_NAME` (opcionales)                                                                                                                                                              |

   `web` y `admin` no necesitan variables.

   **Consistencia de contraseñas:** la contraseña de `nerdose_api` en `apps/api/.env.local` (`DATABASE_URL`) debe ser la misma que en `packages/db/.env.local` (`DATABASE_URL_API`); ídem `nerdose_generator` entre `apps/generator/.env.local` y `DATABASE_URL_GENERATOR`. `db:migrate` sincroniza las contraseñas de los roles desde esas URLs.

3. Levantar PostgreSQL 16 en `127.0.0.1:5432` y esperar a que figure `healthy` en `docker compose ps`:

   ```bash
   docker compose up -d
   ```

4. Levantar todo. `pnpm dev` corre primero `db:migrate` (crea `nerdose_api` y `nerdose_generator`, fija sus contraseñas y aplica las migraciones pendientes; es idempotente) y después levanta las apps:

   ```bash
   pnpm dev
   ```

   Para migrar sin levantar las apps: `pnpm --filter @nerdose/db db:migrate`.

## Dataset de términos

El dataset de `@nerdose/content` está commiteado en `packages/content/data/`. Para regenerarlo (solo desarrollo, requiere red y `WIKIMEDIA_CONTACT` en `packages/content/.env.local`):

```bash
pnpm --filter @nerdose/content import:banks [--min-sitelinks N] [--cache-dir <ruta>]
```

## Lista válida de Devdle

La lista base de palabras válidas de Devdle está commiteada en `packages/games/devdle/wordlist/words.txt` (ENABLE filtrado A–Z de 4 a 12 letras, unido con labels en inglés de conceptos de computación de Wikidata). Se genera una sola vez y el resultado se commitea (solo desarrollo, requiere red y `WIKIMEDIA_CONTACT` en `packages/games/devdle/.env.local`):

```bash
pnpm --filter @nerdose/game-devdle build:wordlist --enable https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt
```

La fuente de ENABLE usada es el `enable1.txt` de `dolph/dictionary` (172.823 palabras en minúsculas); `--enable` también acepta una ruta local.

## Qué levanta `pnpm dev`

| App         | Script `dev`             | Puerto                | Proxy                                  |
| ----------- | ------------------------ | --------------------- | -------------------------------------- |
| `api`       | `tsx watch src/index.ts` | `3000`                | —                                      |
| `generator` | `tsx watch src/index.ts` | — (worker)            | —                                      |
| `web`       | `vite`                   | `5173` (`strictPort`) | `/api` → `http://localhost:3000`       |
| `admin`     | `vite`                   | `5174` (`strictPort`) | `/api/admin` → `http://localhost:3000` |

Logs esperados: la `api` informa `Database role verified` con `db_role: nerdose_api` y `Server started` en el puerto `3000`; el `generator` informa `Database role verified` con `db_role: nerdose_generator`, `Job finished` de `sync_banks` y de `fill`, y `Scheduler started` con `jobs: 1`.

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
- `pnpm test` (requiere Docker: los tests de integración usan Testcontainers; y los toolchains de "Requisitos": los de `@nerdose/polyglot`, `@nerdose/game-big-o` y `@nerdose/game-bug-hunt` ejecutan Go y Java)
- `pnpm --filter <paquete> <script>` para correr un script de un solo paquete.

## Base de datos

- `docker compose down` detiene PostgreSQL y conserva los datos en el volumen `nerdose-pgdata`.
- `docker compose down -v` borra el volumen; después hay que volver a correr `pnpm --filter @nerdose/db db:migrate`.

## Problemas comunes

- **Una tarea falla y se cortan todas:** `turbo run dev` detiene todo si una tarea termina con error. Lo típico es el `generator` sin base (`Database unavailable at startup`): levantar Postgres y migrar.
- **Los juegos siguen en "próximamente" con la base recién creada:** el `generator` solo genera desde mañana (`[hoy+1, hoy+14]`, ADR-007) y la `api` muestra "próximamente" antes de `LAUNCH_DATE`. En local, poner `LAUNCH_DATE` en una fecha pasada (la misma en `api` y `generator`), correr `pnpm --filter generator generate:today` (solo dev, se niega en producción) y reiniciar `pnpm dev`, porque la `api` publica el día una sola vez por día.
- **`502`/`504` en `/api/...` desde `web` o `admin`:** la `api` no está corriendo.
- **Puerto ocupado:** `5173` y `5174` usan `strictPort` y fallan en lugar de cambiar de puerto.
- **`password authentication failed for user "nerdose_api"`:** las contraseñas de los `.env.local` no coinciden. Corregirlas y volver a correr `db:migrate`.
- **`Missing toolchain` o `Wrong toolchain version` en los tests de `@nerdose/polyglot`, `@nerdose/game-big-o` o `@nerdose/game-bug-hunt`:** falta Go o JDK, o la versión no es la pedida. Instalar Go >= 1.25 y JDK 21, dejarlos en el `PATH` y verificar con `go version` y `java -version` (ver "Requisitos").

Hosting, CI/CD y despliegue: fuera de alcance por ahora.
