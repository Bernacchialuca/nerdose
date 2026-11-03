# polyglot — Overview

## Proposito
Paquete `@nerdose/polyglot` (`packages/polyglot`): lo común de los juegos de código autogenerados (Big O y Bug Hunt, ADR-007). Contiene el árbol de código neutral al lenguaje, los emisores a JavaScript, Go y Java (`emit(tree, lang) → { code, lineOf }`, una sentencia por línea) y el runner que ejecuta el código con `child_process.execFile`, timeout de 10 s y usuario no root.

## Tipo de servicio
Library en node (TypeScript). Solo `apps/generator` y las entradas `./generator` de `big-o` y `bug-hunt` pueden importarlo; `./definition`, `./client` y la `api` nunca. Toolchains: Node 24, Go >= 1.25, JDK 21.

## Modulos del dominio
- **tree**: nodos y constructores del árbol de código.
- **emit**: emisores `js`, `go` y `java`.
- **runner**: `runInLanguage(...)`.

## Notas adicionales
- **Convenciones:** `code-runner` copiada tal cual de `generator` (con `library` en `applies_to`); `code-tree` es propia y sale de ADR-007 y de `docs/ARCHITECTURE.md` §10.5 a 10.7 (documento histórico).
- **Aislamiento:** red y límites de recursos se definen con el hosting (diferido).
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
