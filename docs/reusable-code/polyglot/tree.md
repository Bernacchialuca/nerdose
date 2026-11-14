# Tree

## createTreeBuilder / TreeBuilder
- **Location:** packages/polyglot/src/tree/builder.ts
- **Description:** Creates a builder whose counter starts at `n1`. Ids are assigned in construction order, children before their parent. Two builders building the same tree give identical nodes. Methods: `func`, `let`, `assign`, `inc`, `compound`, `for`, `while`, `if`, `return`, `num`, `var`, `bin`, `half`, `call`. Throws `Error('invalid_identifier: x')` and `RangeError('invalid_number: n')`.
- **Signature:** `createTreeBuilder(): TreeBuilder`; e.g. `b.func(name: string, params: readonly string[], body: readonly Stmt[]): FuncNode`
- **Usage:** `const b = createTreeBuilder(); const f = b.func('f', ['n'], [b.return(b.var('n'))]);`

## Node types
- **Location:** packages/polyglot/src/tree/nodes.ts
- **Description:** Discriminated unions by `kind` with `readonly` fields; plain JSON-serializable objects.
- **Signature:** `NodeId = "n${number}"`, `BinOp`, `CompoundOp`, `Expr`, `Stmt`, `StepStmt`, `FuncNode`, `TreeNode`
- **Usage:** `function visit(s: Stmt) { switch (s.kind) { case 'for': ... } }`

## assertIdentifier / RESERVED_IDENTIFIERS
- **Location:** packages/polyglot/src/tree/identifiers.ts
- **Description:** Checks `^[a-z][a-zA-Z0-9]*$` and the set of reserved words of JS, Go and Java plus the names of the generated `main`. Internal (not exported from the package entry).
- **Signature:** `assertIdentifier(name: string): void`; `RESERVED_IDENTIFIERS: ReadonlySet<string>`
- **Usage:** `assertIdentifier(options.entry)`
