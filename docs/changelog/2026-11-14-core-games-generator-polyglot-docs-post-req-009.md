---
date: 2026-11-14
type: technical-change
service: core, games, generator, polyglot (+ flujos, ADR-007, PRD)
---

# Cambio Técnico: core, games, generator, polyglot — alinear la documentación con lo implementado en REQ-009

## Requerimiento Original

> Alinear la documentación técnica con lo que se implementó en REQ-009 (Big O Challenge, stories S-041 a S-046, ya mergeadas en `dev`). El código es la fuente de verdad. Puntos: (1) `generacion-diaria` sin la ventana `[D - recentDays, D + aheadDays]` sin D, sin el `verify` asíncrono ni los checks de Big O; (2) `jugada-y-cierre-de-partida`, paso 3, dice `move.language` en vez de `codeLanguage(state)`; (3) la tabla de exports de `game-package` sin `culprits`, `bankUsage` ni `codeLanguage`; (4) `challenge-generation` y `core/overview` sin los cambios de REQ-009 (`codeLanguage`, `verify` que puede devolver Promise, `aheadDays`, `BIG_O_OPTIONS`/`RECIPE_CATEGORIES`, warn de toolchains); (5) flujos `abrir-y-retomar-juego`, `preferencias-y-share`, `regenerar-desafio` y `estadisticas-del-jugador` sin los cambios que pedía el diseño; (6) desvíos: Go con `go build` + binario en lugar de `go run`, y `date` opcional en el payload de Big O.

## Resumen

Solo cambia la documentación; el código ya estaba bien y testeado. Los flujos y las convenciones describen ahora el contrato de juegos de código que se implementó: `codeLanguage(state)`, `verify` asíncrono y la ventana de historia con `aheadDays` sin la fila de `D`. También quedan documentados los 13 checks de verificación de Big O, que ejecutan el código en JS, Go y Java, y el `warn` de toolchains al arrancar el generator.

Se registran dos desvíos respecto del diseño de REQ-009. Go se compila con `go build` y se ejecuta el binario, porque con `go run` el timeout no mataba al binario. El payload de Big O lleva `date`, porque `verify` no recibe la fecha y los checks de variedad la necesitan.

## Documentos Modificados

| Documento | Cambio |
|-----------|--------|
| `docs/flows/generacion-diaria.md` | La historia se lee una vez por fecha, con `historyWindow`: `[D - recentDays, D + aheadDays]` sin `D`, más el `historySpec` de cada juego. Se agregan `await verify` y los 13 checks de Big O en orden, con la escala de `n` por clase y el formato de `verification.reason` (`run_<lang>: <kind>`). Go va con `go build` + binario. Nuevos errores: `toolchain_missing`, más el `warn` de arranque, y rechazos por ajuste o variedad. |
| `docs/flows/jugada-y-cierre-de-partida.md` | Paso 2: estado y jugada de Big O. Paso 3: `code_language = codeLanguage(state)` (antes decía `move.language`), además de `result` y `extra` de Big O, y la preferencia en la misma transacción. Paso 4: `play.code_language` y `game_stats` en la respuesta, y la actualización de la sesión en la web. |
| `docs/flows/abrir-y-retomar-juego.md` | `public_view` de Big O con `options` en orden fijo y la lista de campos que nunca salen. Lenguaje inicial `codeLanguage` desde la sesión (`ClientBaseProps`). La selección queda solo en el cliente y se pierde al salir. |
| `docs/flows/preferencias-y-share.md` | Formato de share de Big O (`🧮 Big O #N` / `🟩\|🟥 <Lenguaje>` / `nerdose.dev`). La preferencia que se guarda al confirmar se copia a la cache de la sesión sin otro request. |
| `docs/flows/regenerar-desafio.md` | La historia excluye la fila de `D`. En Big O, la verificación por ejecución tarda segundos y no hay banco (`rejected_items` vacío); se agregan su `Preview` y el `VerificationLog` en el admin. El encabezado se sincroniza con el frontmatter. |
| `docs/flows/estadisticas-del-jugador.md` | `extra` de Big O (`by_category`; la pantalla es de FG-10) y la etiqueta del historial (`✓ O(…)` / `✗`). |
| `docs/architectures/games/conventions/game-package.md` | La tabla de exports pasa a tener todos los miembros de `GameDefinition` (`id`, `version`, `bankUsage`, `codeLanguage`, `culprits`, …), los schemas, `Preview`, `i18n`, `HELP_TARGET_ID`, `historySpec`/`usedBankItems` y `verify(payload, history)`, que puede ser async. Hay una tabla nueva de miembros con valor neutro. Nueva regla: `verify` async, y la fecha viaja en el payload. Sección `Update (REQ-009)`. |
| `docs/architectures/generator/conventions/challenge-generation.md` | El ejemplo del pipeline usa `historyWindow`, `payloadSchema.parse` y `await verify`. Reglas nuevas: `verify` async, ventana de historia sin `D` y `warn` de toolchains. Se corrige "claim + send the alert" (ADR-017: no se envía nada). Sección `Update (REQ-009)`: `aheadDays`, registro `big-o@1` y `date` en el payload. |
| `docs/architectures/generator/overview.md` | Sección `Update (REQ-009)`: Big O en el registry, `warn` de toolchains al arrancar y `HOME`/`GOCACHE` en el entorno del runner. |
| `docs/architectures/core/overview.md` | Sección `Update (REQ-009)`: `codeLanguage`, `verify` que puede devolver `Promise`, `aheadDays`, `BIG_O_OPTIONS` y `RECIPE_CATEGORIES`. El warn de toolchains vive en el generator, no en core. |
| `docs/architectures/polyglot/conventions/code-tree.md` | Lista de bloques de Big O alineada con el catálogo implementado: `doubling` en lugar de "logarithmic", más `permutations`, `nest` y `seq`. |
| `docs/architectures/polyglot/conventions/code-runner.md` y `docs/architectures/generator/conventions/code-runner.md` | El ejemplo usa el check real `counts_agree` en lugar de `same_output_all_languages`. Las dos copias siguen idénticas, salvo `applies_to`. |
| `docs/adrs/ADR-007-generator-worker-y-pipeline.md` | Runner: Go con `go build` + binario, con el motivo. Fecha de actualización. |
| `docs/prd/requirements.md` | El payload de Big O suma `date`: opcional en el schema, siempre puesta por `generate` y necesaria para la variedad en `verify`. |
