# workspace — Overview

## Proposito
Raíz del monorepo de nerdose. Reúne todo lo que no pertenece a una app ni a un paquete en particular: `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, la configuración de ESLint (flat config) con los límites de importación de ADR-003, la configuración raíz de Vitest, `compose.yaml` (PostgreSQL 16 local), los `.env.example` de la raíz, `.gitignore` y el README de arranque.

## Tipo de servicio
Library en node (TypeScript, Node.js 24 LTS, pnpm + Turborepo). No es desplegable: es la estructura sobre la que se construyen `api`, `generator`, `web`, `admin` y los paquetes compartidos. Las requests y stories lo nombran como `workspace` en "Servicios Afectados".

## Modulos del dominio
- **tooling**: workspaces, tareas de Turborepo (`dev`, `build`, `lint`, `typecheck`, `test`), base de TypeScript, ESLint con `no-restricted-imports` y Vitest raíz.
- **local-env**: `compose.yaml` con PostgreSQL 16, `.env.example`, `.gitignore` y README de arranque (`docker compose up -d` → `pnpm dev`, que corre `db:migrate` antes de `api` y `generator`). El README documenta los prerrequisitos Node 24, Go >= 1.25 y JDK 21 (toolchains de `@nerdose/polyglot`) y la regla de usuario no root del runner (`RUNNER_UID`/`RUNNER_GID`).

## Notas adicionales
- **Convención propia única:** `monorepo-tooling` se basa en ADR-003 y en el diseño técnico de REQ-001 (S-001, S-002 y S-005). `_base` es la del catálogo de node.
- **Paquetes internos sin build (JIT):** exportan su TypeScript fuente; el build para producción queda diferido con el hosting.
- **Fuera de alcance:** despliegue, CI/CD, hosting, DNS/TLS y secretos de producción.
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
