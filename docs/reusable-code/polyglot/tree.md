# Tree

## createTreeBuilder / TreeBuilder
- **Location:** packages/polyglot/src/tree/builder.ts
- **Description:** Creates a builder whose counter starts at `n1`. Ids are assigned in construction order, children before their parent. Two builders building the same tree give identical nodes. Methods: `func`, `let`, `assign`, `inc`, `compound`, `for`, `while`, `if`, `return`, `num`, `bool`, `var`, `bin`, `half`, `call`, `index`, `len`. `func` takes `string[]` (untyped tree, same shape as always) or `Param[]` plus an optional `returns`; `let` takes an optional type; `num` accepts `[-2^31, 2^31 - 1]`; `bin('%')` needs a positive literal divisor. Throws `Error('invalid_identifier: x')`, `RangeError('invalid_number: n')` and `RangeError('invalid_modulo_divisor')`. The internal `createTreeBuilderAfter(maxId)` numbers from `maxId + 1`.
- **Signature:** `createTreeBuilder(): TreeBuilder`; e.g. `b.func(name: string, params: readonly string[] | readonly Param[], body: readonly Stmt[], returns?: ScalarType): FuncNode`
- **Usage:** `const b = createTreeBuilder(); const f = b.func('f', ['n'], [b.return(b.var('n'))]);`

## Node types
- **Location:** packages/polyglot/src/tree/nodes.ts
- **Description:** Discriminated unions by `kind` with `readonly` fields; plain JSON-serializable objects.
- **Signature:** `NodeId = "n${number}"`, `Type = 'int' | 'int[]' | 'bool'`, `ScalarType`, `Param`, `Signature`, `BinOp`, `CompoundOp`, `Expr` (incl. `BoolExpr`, `IndexExpr`, `LenExpr`), `Stmt`, `StepStmt`, `FuncNode` (optional `paramTypes`, `returns`), `TreeNode`
- **Usage:** `function visit(s: Stmt) { switch (s.kind) { case 'for': ... } }`

## assertIdentifier / RESERVED_IDENTIFIERS
- **Location:** packages/polyglot/src/tree/identifiers.ts
- **Description:** Checks `^[a-z][a-zA-Z0-9]*$` and the set of reserved words of JS, Go and Java plus the names of the generated `main`. Internal (not exported from the package entry).
- **Signature:** `assertIdentifier(name: string): void`; `RESERVED_IDENTIFIERS: ReadonlySet<string>`
- **Usage:** `assertIdentifier(options.entry)`

## evaluate / EVAL_MAX_STEPS
- **Location:** packages/polyglot/src/tree/evaluate.ts
- **Description:** Pure interpreter with the semantics of the portable subset: int32 results (`int_overflow`), truncation toward zero, short-circuit `&&`/`||`, `index_out_of_range`, `step_limit` by steps (default `EVAL_MAX_STEPS = 100_000`) and by call depth (1 000). Never returns `-0`. Arguments are validated against the signature (`RangeError` `arity_mismatch` / `invalid_argument`); a malformed tree throws `Error('evaluate: <detail>')`.
- **Signature:** `evaluate(func: FuncNode, args: readonly (number | readonly number[] | boolean)[], options?: { maxSteps?: number }): { ok: true; value: number | boolean } | { ok: false; error: 'int_overflow' | 'index_out_of_range' | 'step_limit' }`
- **Usage:** `const out = evaluate(tree, [[5, 1, 5]]); if (out.ok) expected = String(out.value);`

## replaceNode
- **Location:** packages/polyglot/src/tree/replace.ts
- **Description:** Returns a new tree with one node replaced; untouched nodes and reused children keep their ids, new nodes are numbered after the highest id. Errors: `node_not_found: <id>`, `replace_kind_mismatch: <id>`, `invalid_modulo_divisor`, `duplicate_node_id: <id>`.
- **Signature:** `replaceNode(func: FuncNode, nodeId: NodeId, build: (node: TreeNode, b: TreeBuilder) => TreeNode): FuncNode`
- **Usage:** `replaceNode(tree, cmpId, (n, b) => n.kind === 'bin' ? b.bin('>=', n.left, n.right) : n)`

## checkPortable
- **Location:** packages/polyglot/src/tree/portable.ts
- **Description:** Static checks of what does not compile in some language, in emission order, `[]` if portable; never throws. `unused_local` counts only reads through a `var`.
- **Signature:** `checkPortable(func: FuncNode): { kind: 'type_mismatch' | 'unused_local' | 'unreachable_statement' | 'missing_return'; nodeId: NodeId }[]`
- **Usage:** `if (checkPortable(mutant).length > 0) discard(mutant);`
