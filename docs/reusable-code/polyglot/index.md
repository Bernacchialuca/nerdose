# Reusable Code Index - polyglot

Package `@nerdose/polyglot` (`packages/polyglot`), single entry `.`. Only `apps/generator` and the `./generator` entries of the games may import it.

## Tree (3 items) - see tree.md
- **createTreeBuilder / TreeBuilder** (packages/polyglot/src/tree/builder.ts) - Builder with its own id counter (`n1`, `n2`, ...); one method per node kind
- **Node types** (packages/polyglot/src/tree/nodes.ts) - `NodeId`, `BinOp`, `CompoundOp`, `Expr`, `Stmt`, `StepStmt`, `FuncNode`, `TreeNode`
- **assertIdentifier / RESERVED_IDENTIFIERS** (packages/polyglot/src/tree/identifiers.ts) - Identifier validation shared by the builder and `wrapFunction`

## Emit (4 items) - see emit.md
- **LANGUAGES / Language** (packages/polyglot/src/emit/languages.ts) - Languages `js`, `go`, `java`
- **emit / EmitResult** (packages/polyglot/src/emit/index.ts) - `emit(func, lang)` returns `{ code, lineOf }`, same line per node in the 3 languages
- **emitProgram** (packages/polyglot/src/emit/program.ts) - Full runnable source from a tree and a list of calls
- **wrapFunction** (packages/polyglot/src/emit/program.ts) - Same, from already emitted code

## Runner (6 items) - see runner.md
- **runInLanguage** (packages/polyglot/src/runner/run.ts) - Runs source with `execFile`, returns a typed `RunOutcome`, never throws for a snippet problem
- **RunOutcome / RunFailureKind / RunOptions** (packages/polyglot/src/runner/outcome.ts) - Result and failure types
- **RUN_TIMEOUT_MS / RUN_MAX_BUFFER_BYTES** (packages/polyglot/src/runner/outcome.ts) - 10 000 ms and 1 MiB
- **checkToolchains / ToolchainReport** (packages/polyglot/src/runner/toolchains.ts) - Installed toolchains and versions
- **parseNodeMajor / parseGoVersion / parseJavaMajor** (packages/polyglot/src/runner/toolchains.ts) - Version parsers
- **classifyFailure** (packages/polyglot/src/runner/outcome.ts) - Internal: maps an `execFile` failure to a `RunFailureKind`
