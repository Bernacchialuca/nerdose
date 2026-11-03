---
id: monorepo-tooling
display_name: Tooling del monorepo (pnpm + Turborepo + ESLint)
language: node
description: Workspace layout, Turborepo tasks, shared TypeScript base, ESLint flat config enforcing the ADR-003 import boundaries, root Vitest config, local PostgreSQL via Compose and env files
applies_to: [library]
required_by: []
package: turbo
---

# Monorepo Tooling (Node, pnpm + Turborepo)

Everything that lives at the root of the repository and is shared by all apps and packages: workspaces, task orchestration, TypeScript base, lint rules that enforce the import boundaries of ADR-003, Vitest root config, local PostgreSQL and environment files. This is the only convention whose subject is the repo itself; per-package rules live in each package's own architecture.

## When to use

- Adding or changing a workspace, a root script, a Turborepo task, a lint boundary, the local database container or the `.env.example` files.
- Creating a new app or package (it must plug into the pieces below).

## Package

```
pnpm                  # package manager, pinned in packageManager of the root package.json
turbo                 # Turborepo task runner
typescript            # tsc --noEmit per package
eslint                # flat config (eslint.config.js)
typescript-eslint
eslint-plugin-react-hooks   # SPAs only
eslint-plugin-jsx-a11y      # SPAs only (see web/admin accessibility)
vitest                # runner; root config with projects
tsx                   # runs TypeScript scripts (db:migrate)
```

## Structure

```
/
├── package.json              # private, packageManager, engines.node ">=24 <25", root scripts
├── pnpm-workspace.yaml       # apps/*, packages/*, packages/games/*
├── turbo.json                # build, dev, lint, typecheck, test
├── tsconfig.base.json        # strict base extended by every package
├── eslint.config.js          # flat config + no-restricted-imports boundaries
├── vitest.config.ts          # (or vitest.workspace) shared root config
├── compose.yaml              # PostgreSQL 16 for local development
├── .env.example              # root variables (POSTGRES_PASSWORD), no values
├── .gitignore
├── README.md                 # start-up guide
├── apps/{web,admin,api,generator}/
└── packages/{core,db,ui,polyglot,content}/ and packages/games/<game_id>/
```

## Configuration

### Workspaces and tasks

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'packages/games/*'
```

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":       { "persistent": true, "cache": false },
    "lint":      {},
    "typecheck": { "dependsOn": ["^typecheck"] },
    "test":      { "dependsOn": ["^test"] }
  }
}
```

Root scripts delegate to Turborepo: `dev`, `build`, `lint`, `typecheck`, `test` (`turbo run <task>`).

### Internal packages without a build step

Internal packages (`core`, `db`, `ui`, and the others) export their TypeScript source (`"exports": { ".": "./src/index.ts" }`). Vite and `tsx` consume it directly and `typecheck` is `tsc --noEmit` in each package. A production build of packages is deferred together with hosting.

### TypeScript base

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

Each package has a `tsconfig.json` that extends it.

### ESLint flat config with import boundaries (ADR-003)

```js
// eslint.config.js (excerpt)
const noGameInternals = {
  group: ['@nerdose/game-*/generator', '@nerdose/polyglot', 'node:child_process'],
};

export default [
  // base: typescript-eslint recommended for every package
  {
    files: ['apps/web/**', 'apps/admin/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [
      { group: ['@nerdose/db', '@nerdose/db/*'], message: 'Frontends never import the database package.' },
      { group: ['@nerdose/core/notify'], message: 'notify is Node-only.' },
      { group: ['@nerdose/game-*/definition', '@nerdose/game-*/generator', '@nerdose/polyglot'], message: 'Frontends import only ./client.' },
      { group: ['../../api/*', '../../generator/*', '../admin/*', '../web/*'], message: 'Apps never import from other apps.' },
    ] }] },
  },
  {
    files: ['apps/api/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [
      { group: ['@nerdose/game-*/client', '@nerdose/game-*/generator', '@nerdose/polyglot'], message: 'api imports only ./definition.' },
    ] }] },
  },
  {
    files: ['apps/generator/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [
      { group: ['@nerdose/game-*/client'], message: 'generator imports ./generator (and ./definition if needed).' },
    ] }] },
  },
  {
    files: ['packages/games/*/src/{definition,client}/**'],
    rules: { 'no-restricted-imports': ['error', noGameInternals] },
  },
  {
    files: ['packages/core/src/**'],
    ignores: ['packages/core/src/notify.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['node:*', './notify', '**/notify'] }] },
  },
  // SPAs: eslint-plugin-react-hooks and jsx-a11y recommended sets
];
```

Exact globs adapt to the final folder layout; the **set of boundaries** is the contract.

### Local PostgreSQL

```yaml
# compose.yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nerdose
      POSTGRES_USER: nerdose_owner
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - '127.0.0.1:5432:5432'
    volumes:
      - nerdose-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U nerdose_owner -d nerdose']
      interval: 5s
      retries: 10
volumes:
  nerdose-pgdata:
```

The image is the same one Testcontainers uses in tests.

### Ports in development

`api` 3000, `web` 5173, `admin` 5174. `web` proxies `/api/*` to the api and `admin` proxies `/api/admin/*` (same origin emulation, no CORS).

## How to use

- Start-up order (documented in `README.md`): `docker compose up -d` → `pnpm --filter @nerdose/db db:migrate` → `pnpm dev`.
- Copy each `.env.example` to `.env.local` (and the root one to `.env` for Compose) and fill the values. Real values are never committed.
- Add a workspace by creating its folder under `apps/`, `packages/` or `packages/games/`; it must define `lint`, `typecheck` and `test` scripts so Turborepo picks it up.
- Run a single package: `pnpm --filter @nerdose/<name> <script>`.

## Rules

- pnpm is the only package manager. No `npm`, `yarn` or `bun` lockfiles or commands.
- `engines.node` is `">=24 <25"` and `packageManager` is pinned in the root `package.json`.
- Tasks (`build`, `dev`, `lint`, `typecheck`, `test`) are orchestrated by Turborepo; `dev` is `persistent` and uncached.
- Internal packages are named `@nerdose/<name>` (`@nerdose/game-<game_id>` for games) and use `workspace:*` for internal dependencies.
- The ADR-003 import boundaries are enforced by ESLint (`no-restricted-imports`) and a violation fails `pnpm lint`: apps never import from other apps; `web` and `admin` never import `@nerdose/db` or `@nerdose/core/notify`; `api` imports only `./definition` of games, frontends only `./client`, `generator` only `./generator` (and `./definition`); `./definition` and `./client` never import `@nerdose/polyglot` or `node:child_process`; `@nerdose/core` entry `.` never imports `node:*` or `./notify`.
- No `.js` source files in `apps/` or `packages/` except tool configuration.
- `.gitignore` excludes `.env`, `.env.local`, `.env.test`, `node_modules`, build output and Turborepo cache. Only `.env.example` files are committed, with empty values and a comment per variable.
- `compose.yaml` publishes PostgreSQL only on `127.0.0.1` and keeps data in the named volume `nerdose-pgdata`. Rebuilding from scratch is an explicit `docker compose down -v`.
- No secrets in the repository: `.env.example` files never contain real values.
- Deployment, CI/CD, hosting and production secrets are out of scope until they are defined.

## Integration with other conventions

- **env-config**: each service declares its variables in its own `env.ts` and keeps `.env.example` in sync; the root `.env.example` only holds Compose variables.
- **testing**: the root Vitest config runs each package's tests; integration tests need Docker (Testcontainers) and fail with a clear message without a daemon.
- **orm**: `db:migrate` is the single migration command and reads `DATABASE_URL_OWNER`.
- **accessibility** (web/admin): `eslint-plugin-jsx-a11y` is wired here.
- **game-package**: the three entries of each game are protected by the boundaries above.
