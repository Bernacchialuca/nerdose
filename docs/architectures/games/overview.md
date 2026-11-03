# games — Overview

## Proposito
Los cinco paquetes de juego `packages/games/<game_id>` (`@nerdose/game-devdle`, `-grep-grid`, `-timeline`, `-big-o`, `-bug-hunt`). Cada uno implementa el contrato `GameDefinition` de `@nerdose/core` y expone tres entradas separadas: `./definition` (servidor: la usa la `api`), `./client` (React: `Instructions`, `Game`, `Result` y `share()`; la usan `web` y `admin`) y `./generator` (`generate` y `verify`; lo usa el `generator`). ADR-003 y ADR-006.

## Tipo de servicio
Library en node (TypeScript estricto); la entrada `./client` es React. Una arquitectura para los cinco paquetes porque comparten estructura y reglas.

## Modulos del dominio
Un módulo por juego: **devdle**, **grep-grid**, **timeline**, **big-o**, **bug-hunt**.

## Notas adicionales
- **Convenciones por entrada:** `definition` y `generator` siguen `game-registry`, `validation` y `testing` (copias de `api`); `client` sigue `styling`, `accessibility`, `testing-unit` y `game-clients` (copias de `web`). Todas llevan `library` en `applies_to`. `game-package` es propia (estructura, las tres entradas y qué puede importar cada una).
- **`game-clients` y `game-registry`** describen el lado de la app que consume cada entrada; aquí aplican como contrato que el paquete debe cumplir.
- **Idioma de `language`:** el manifest declara `node`; las copias de `web` conservan `language: react` en su frontmatter porque son idénticas a las originales.
- **Fuera de este grupo:** el detalle de cada juego (blocks de Big O, plantillas de Bug Hunt, lista de palabras de Devdle) se define con el feature group de cada juego.
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
