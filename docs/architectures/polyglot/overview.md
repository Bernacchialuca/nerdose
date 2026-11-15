# polyglot — Overview

## Proposito
Paquete `@nerdose/polyglot` (`packages/polyglot`): lo común de los juegos de código autogenerados (Big O y Bug Hunt, ADR-007). Contiene el árbol de código neutral al lenguaje, funciones con enteros, arrays de enteros de solo lectura y booleanos (firmas tipadas), los emisores a JavaScript, Go y Java (`emit(func, lang) → { code, lineOf, statementLines }`, una sentencia por línea), el intérprete de referencia `evaluate`, la primitiva de mutación `replaceNode`, los chequeos de portabilidad `checkPortable`, `emitProgram` / `wrapFunction` (la función más un `main` que la llama con una lista de argumentos, opcionalmente con `signature` tipada) y el runner `runInLanguage(lang, source)`, que ejecuta el código con `child_process.execFile`, timeout de 10 s y usuario no root.

## Tipo de servicio
Library en node (TypeScript). Solo `apps/generator` y las entradas `./generator` de `big-o` y `bug-hunt` pueden importarlo; `./definition`, `./client` y la `api` nunca. Toolchains: Node 24, Go >= 1.25, JDK 21.

## Modulos del dominio
- **tree**: nodos con ids estables, `createTreeBuilder()` (firmas tipadas, `bool`, `index`, `len`, literales negativos, `%`, `!=`, `&&`, `||`, `-=`), `evaluate` (int32, truncado, cortocircuito, `step_limit`), `replaceNode` y `checkPortable` (`type_mismatch`, `unused_local`, `unreachable_statement`, `missing_return`).
- **emit**: emisores `js`, `go` y `java` con precedencia segura y `statementLines`, `emitProgram` y `wrapFunction` (programas tipados con `signature`: arrays y booleanos, salida canónica).
- **runner**: `runInLanguage(lang, source, { timeoutMs })` → `RunOutcome` tipado, y `checkToolchains()`. Go se compila con `go build` y se ejecuta el binario (no `go run`).

## Notas adicionales
- **Convenciones:** `code-runner` copiada tal cual de `generator` (con `library` en `applies_to`); `code-tree` es propia y sale de ADR-007 y de `docs/ARCHITECTURE.md` §10.5 a 10.7 (documento histórico).
- **Aislamiento:** red y límites de recursos se definen con el hosting (diferido).
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
