# ADR-003: Monorepo y paquetes compartidos

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** estructura, monorepo, paquetes

## Contexto

Cuatro servicios comparten código en serio:
- el contrato `GameDefinition` y la lógica de cada juego (la usan la `api`, el `generator`, `web` y `admin`);
- el schema de la base (la `api` y el `generator`);
- la lógica de rachas y del día UTC (la `api`, y `web` para mostrar);
- los componentes de UI (`web` y `admin`).

Un solo desarrollador tiene que poder cambiar un contrato y todos sus usos en un mismo commit.

El análisis técnico fijó los **componentes** compartidos (`core`, `db`, `games/*`, `polyglot`, `ui`), pero dejó el layout del repo para esta fase.

## Decisión

Vamos a usar un **monorepo con pnpm workspaces y Turborepo**:

```
apps/
  web/          SPA de jugadores (nerdose.dev)
  admin/        SPA del responsable (admin.nerdose.dev)
  api/          Hono: rutas de jugador + /api/admin/* + registry de juegos
  generator/    worker: scheduler, jobs, generación y verificación
packages/
  core/         GameDefinition, día UTC, número de desafío, rachas, PRNG (rngFrom sobre pure-rand), códigos de error
  db/           schema Drizzle, migraciones, queries compartidas, vistas metrics_*
  ui/           componentes compartidos (header, banners, share, stat cards), tokens, track()
  polyglot/     árbol de código, emisores JS/Go/Java, runner multi-lenguaje
  content/      dataset versionado de los bancos (data/*.json) + script offline import:banks (ADR-016)
  games/
    devdle/     definition · client (incluye share) · generator
    grep-grid/
    timeline/
    big-o/
    bug-hunt/
```

Cada paquete de juego expone tres entradas separadas: `definition` (la usa la `api`), `client` (`web` y `admin`) y `generator` (el `generator`).

## Reglas de Implementación

- El gestor de paquetes MUST ser pnpm, con workspaces declarados en `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `packages/games/*`). MUST NOT usarse npm, yarn ni bun.
- Las tareas (`build`, `lint`, `typecheck`, `test`) MUST orquestarse con Turborepo desde `turbo.json`.
- Los paquetes internos MUST llamarse `@nerdose/<nombre>` (`@nerdose/core`, `@nerdose/db`, `@nerdose/ui`, `@nerdose/polyglot`, `@nerdose/content`, `@nerdose/game-<game_id>`).
- Cada paquete de juego MUST exponer por `exports` tres entradas: `./definition`, `./client` y `./generator`.
- `apps/api` MUST importar solo `./definition` de cada juego. `apps/web` y `apps/admin` MUST importar solo `./client`. `apps/generator` MUST importar solo `./generator` (y `./definition` si lo necesita para validar).
- `./definition` y `./client` MUST NOT importar `polyglot`, `node:child_process` ni nada que ejecute código.
- `apps/web` y `apps/admin` MUST NOT importar `@nerdose/db`.
- `@nerdose/core` MUST exponer una sola entrada `.`, isomorfa (corre en Node y en el navegador, sin dependencias de Node): MUST NOT importar `node:*`. (Hasta el ADR-017 existía una entrada `./notify`; se eliminó.)
- `@nerdose/db` MUST ser el único lugar con el schema Drizzle y las migraciones.
- MUST NOT haber dependencias entre apps (`apps/*` no importa de otro `apps/*`). Lo compartido va en `packages/`.

## Consecuencias

### Positivas
- Un cambio de contrato y todos sus usos van en un mismo commit, con typecheck de punta a punta.
- Sumar un juego es sumar un paquete `games/<game_id>` y registrarlo, sin tocar la `api` ni el shell.
- Turborepo cachea builds y tests, y solo corre lo afectado.

### Negativas
- La configuración de TypeScript, de exports y del build de paquetes internos lleva un costo inicial.
- Hay que vigilar que los `client` no arrastren código de servidor al bundle.

### Riesgos
- **Riesgo:** un `client` importa por error la solución o el `generator`, y el bundle filtra lógica o datos sensibles.
  - **Mitigación:** las entradas `exports` separadas, las reglas de importación de arriba y los tests de contrato anti-spoiler.

## Alternativas Consideradas

### Alternativa 1: Un repo por servicio

**Pros:**
- Deploys e historiales independientes.

**Contras:**
- Los contratos compartidos tendrían que publicarse como paquetes versionados.
- Un cambio de un juego tocaría 3 o 4 repos.

**Por qué se descartó:** demasiada fricción para una sola persona y para contratos que cambian juntos.

---

### Alternativa 2: Monorepo sin Turborepo (solo pnpm workspaces)

**Pros:**
- Una herramienta menos.

**Contras:**
- Sin cache ni orden de tareas entre paquetes.

**Por qué se descartó:** Turborepo cuesta poco y acelera el CI. Es opcional y se puede quitar sin cambiar el layout.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Componentes compartidos; Decisiones Operativas Fuera de Alcance (estructura del proyecto)
- `docs/ARCHITECTURE.md` — §5 Estructura del monorepo
