# 2026-11-26: Devdle arranca con términos fáciles

Cambio chico fuera del workflow (sin REQ ni stories).

## Qué cambia

- **Contrato del generator (`@nerdose/core`, ADR-006):** `generate` y `verify` reciben `number`, el número del desafío (`GenerationContext`). El `generator` lo manda siempre; los juegos que no lo usan lo ignoran.
- **Devdle:** en los desafíos #1 a #50 (`LAUNCH_DAYS`) la palabra sale solo de `DEVDLE_LAUNCH_TERMS` (`packages/games/devdle/src/generator/launch-terms.ts`), mientras quede alguno sin usar. Desde el #51, de todo el banco como antes.
- **Verificación de Devdle:** nuevo check `launch_pool`. La rotación de categorías se evalúa sobre el mismo conjunto que usa `generate`.

## La lista

77 términos de las 8 categorías: los ~120 elegibles con más `sitelinks` del banco, filtrados a mano por lo que un dev reconoce sin dudar. Son más que 50 a propósito: la lista es pública y, con exactamente 50, los últimos días del tramo serían predecibles. Un test (`packages/games/devdle/test/launch-terms.test.ts`) la valida contra el dataset versionado.

## Documentos actualizados

- `docs/adrs/ADR-006-contrato-gamedefinition.md`
- `docs/flows/generacion-diaria.md`
- `docs/reusable-code/core/game-contract.md`
- `docs/reusable-code/games/devdle.md`, `docs/reusable-code/games/index.md`
