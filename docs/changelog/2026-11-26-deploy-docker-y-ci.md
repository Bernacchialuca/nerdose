# 2026-11-26: Imágenes Docker por servicio y CI en GitHub Actions

Cambio fuera del workflow (sin REQ ni stories). Es la parte del deploy que vale para cualquier hosting. El hosting, la publicación de las imágenes, el proxy/TLS y el despliegue siguen diferidos.

## Qué se suma

- **`Dockerfile`** (raíz, multi-target, monorepo como contexto):
  - `api`.
  - `generator`: Node 24 + Go 1.25 + JDK 21, usuario no root.
  - `migrate`: aplica las migraciones y termina.
  - `static`: build de `web` y `admin` para exportar con `--output`.

  Las apps corren con `tsx`, igual que en desarrollo, con solo sus dependencias de producción.
- **`.dockerignore`**: deja afuera los `.env`, `node_modules`, `.git` y `docs`.
- **`.github/workflows/ci.yml`**: format, lint, typecheck, build, tests (con Go y JDK) y build de las 4 imágenes, en cada PR y push a `dev`/`main`.
- **`test/docker.test.ts`**: targets del Dockerfile, usuario no root y exclusiones del contexto.

## Cambios en el código

- `web` y `admin` tienen script `build` (`vite build`); `pnpm build` los construye.
- `@nerdose/db`: `dotenv` pasa a `dependencies` porque lo importa el script de migración, que corre en la imagen `migrate`.
- `packages/games/timeline/test/boundaries.test.ts`: formato de Prettier (ya fallaba `pnpm format:check` en `dev`).

## Verificado en local

Se levantaron las imágenes con Postgres:
- `migrate` aplica y termina.
- La `api` queda sana.
- El `generator`, sin salida a internet, generó 14 días aprobados de los 5 juegos, incluidos Big O y Bug Hunt, que ejecutan Go y Java.

Hallazgo: Docker monta los `tmpfs` como `noexec`, y el binario de Go no corre. Si `/tmp` del `generator` es un tmpfs, hay que montarlo con `exec` (anotado en el `Dockerfile` y en el README).

## Documentos actualizados

- `README.md`: sección "Docker y CI", árbol de la raíz y `pnpm build`.
- `docs/prd/architecture.md` y `docs/prd/feature-groups.md`: imágenes y CI definidos; el resto del despliegue sigue diferido.
