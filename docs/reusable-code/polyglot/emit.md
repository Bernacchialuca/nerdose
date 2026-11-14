# Emit

## LANGUAGES / Language
- **Location:** packages/polyglot/src/emit/languages.ts
- **Description:** The three emitted languages, same values as `CODE_LANGUAGES` of `@nerdose/core` (polyglot does not depend on core).
- **Signature:** `LANGUAGES = ['js', 'go', 'java'] as const`; `type Language`
- **Usage:** `LANGUAGES.map((lang) => emit(tree, lang))`

## emit / EmitResult
- **Location:** packages/polyglot/src/emit/index.ts
- **Description:** Pure, deterministic emitter on a common printer with one dialect per language. One statement per line, so the three codes have the same line count. `lineOf` has an entry for every node (expressions on the line of their statement). `code` has no trailing newline. Throws `Error('duplicate_node_id: <id>')`.
- **Signature:** `emit(func: FuncNode, lang: Language): { code: string; lineOf: Record<NodeId, number> }`
- **Usage:** `const { code, lineOf } = emit(tree, 'go'); const line = lineOf[bugNodeId];`

## emitProgram
- **Location:** packages/polyglot/src/emit/program.ts
- **Description:** Full source (`main.js`, `main.go`, `Main.java`): the emitted function as is plus a `main` printing one integer per call. Throws `RangeError` (`calls_empty`, `invalid_argument: x`, `arity_mismatch: expected a, got b`).
- **Signature:** `emitProgram(func: FuncNode, lang: Language, options: { calls: readonly (readonly number[])[] }): string`
- **Usage:** `emitProgram(tree, 'java', { calls: [[1], [8]] })`

## wrapFunction
- **Location:** packages/polyglot/src/emit/program.ts
- **Description:** Same program for code already emitted (the payload stores code, not the tree). `emit(t, l).code` wrapped with `entry: t.name` equals `emitProgram(t, l, ...)`.
- **Signature:** `wrapFunction(code: string, lang: Language, options: { entry: string; calls: readonly (readonly number[])[] }): string`
- **Usage:** `wrapFunction(payload.code.go, 'go', { entry: 'f', calls })`
