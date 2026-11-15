---
id: code-tree
display_name: Arbol de codigo y emisores (JS, Go, Java)
language: node
description: Language-neutral code tree, line-preserving emitters for JS, Go and Java, and the portable subset that behaves identically in the three languages
applies_to: [library]
required_by: []
package: null
---

# Code Tree and Emitters (Node, @nerdose/polyglot)

Big O and Bug Hunt invent their code every day (ADR-007). The generator combines pieces with known properties into a **language-neutral tree**, writes it in JavaScript, Go and Java with **emitters**, and runs it to confirm the answer. This convention defines the tree and the emitters; the runner is covered by `code-runner`.

## When to use

- Building or changing the code tree, a node type or an emitter.
- Writing the generators of `big-o` and `bug-hunt` (blocks, templates, mutations).

## Package

```
@nerdose/polyglot    # internal; imported only by apps/generator and by ./generator entries of games
```

No third-party package is required for the tree or the emitters (pure TypeScript). Compilation checks use the real toolchains (Node 24, Go >= 1.25, JDK 21).

## Structure

```
packages/polyglot/src/
├── tree/
│   ├── nodes.ts        # node types (discriminated union by `kind`)
│   ├── identifiers.ts  # IDENTIFIER_PATTERN, RESERVED_IDENTIFIERS, assertIdentifier
│   ├── int32.ts        # MIN_INT, MAX_INT, isInt32, describeArg (internal)
│   ├── builder.ts      # createTreeBuilder(), createTreeBuilderAfter(maxId) (internal)
│   ├── walk.ts         # childrenOf, walk, findNode, maxNodeId, isExpr, isStmt (internal)
│   ├── signature.ts    # signatureOf(func) (internal)
│   ├── evaluate.ts     # evaluate, EVAL_MAX_STEPS
│   ├── replace.ts      # replaceNode
│   └── portable.ts     # checkPortable
├── emit/
│   ├── languages.ts    # LANGUAGES, Language
│   ├── dialect.ts      # Dialect: syntax of each language (text only)
│   ├── js.ts, go.ts, java.ts
│   ├── printer.ts      # common traversal: lines + lineOf + precedence
│   ├── index.ts        # emit(func, lang) -> { code, lineOf, statementLines }
│   └── program.ts      # wrapFunction, emitProgram
└── runner/             # see code-runner
```

## How to use

```ts
import { createTreeBuilder, emit, emitProgram } from '@nerdose/polyglot';

const b = createTreeBuilder();
const f = b.func('f', ['n'], [b.return(b.bin('+', b.var('n'), b.num(1)))]);

const { code, lineOf } = emit(f, 'go');   // lineOf: Record<NodeId, number>, 1-based
const source = emitProgram(f, 'go', { calls: [[1], [5]] });
```

### The tree

Nodes are plain serializable objects with a stable `id` (`n1`, `n2`, ...). Each `createTreeBuilder()` has its own counter starting at 1, and a constructor assigns the next id after its children were created, so two builders that build the same tree produce identical nodes. `emit` throws `duplicate_node_id: <id>` if an id repeats (for example a tree mixing nodes of two builders).

- Types: `Type = 'int' | 'int[]' | 'bool'`, `ScalarType = 'int' | 'bool'` (return types), `Param = { name, type }`, `Signature = { params: Type[]; returns: ScalarType }`.
- Statements: `func(name, params, body, returns?)`, `let(name, expr, type?)`, `assign(name, expr)`, `inc(name)`, `compound(name, op, expr)` (`+=`, `-=`, `*=`), `for(init, cond, step, body)` (`init` is a `let`; `step` is `inc`, `compound` or `assign`), `while(cond, body)`, `if(cond, then)`, `return(expr)`.
- Expressions: `num`, `bool`, `var`, `bin` (`+ - * % < <= > >= == != && ||`), `half(expr)` (integer division by 2, truncating toward zero), `call(name, args)`, `index(array, index)` and `len(array)`.
- Subset: integers, read-only arrays of integers and booleans. No strings, maps, `else`, `break` or assignment to array elements.
- `func(name, params, body, returns?)` takes `params` as `string[]` (every parameter is an `int` and the function returns `int`) or as `Param[]`. An untyped tree keeps exactly the shape it always had: `FuncNode` is `{ kind, id, name, params: string[], body }` with no `paramTypes` or `returns` key. A typed one adds `paramTypes: Type[]` and `returns` (default `'int'`); `params` stays the list of names. With `string[]` and an explicit `returns`, only `returns` is added.
- `let(name, expr, type?)` stores `type` only when it is not `'int'`.
- Identifiers match `^[a-z][a-zA-Z0-9]*$` and are not in `RESERVED_IDENTIFIERS` (reserved words of JS, Go and Java plus `main`, `fmt`, `args`, `console`, `Math`, `System`, `String`, `Main`); otherwise `Error('invalid_identifier: <name>')`.
- `num(value)` takes an integer in `[-2^31, 2^31 - 1]`, otherwise `RangeError('invalid_number: <value>')`.
- `bin('%', left, right)` requires `right` to be a `num` with `value > 0`, otherwise `RangeError('invalid_modulo_divisor')` (`replaceNode` applies the same check to its result).

### Emitters

- `emit(func, lang) -> { code, lineOf, statementLines }` with `lang` in `'js' | 'go' | 'java'`. `code` is lines joined with `\n`, with no trailing newline.
- **One statement per line**, closing braces on their own line. Indentation: 2 spaces (JS), tab (Go), 4 spaces (Java).
- `lineOf` has one entry per node: `func` is line 1, a statement is its first line, an expression is the line of its statement (the expressions of a `for` header are on the header line). Closing braces have no node.
- `statementLines` lists, ascending and without repeats, the lines where a statement starts (simple statements and `for`/`while`/`if` headers); never line 1 nor a closing `}`. It is identical in the three languages.
- A common printer decides the line structure and a `Dialect` per language only returns text, so the three languages line up by construction.
- JS emits `==` as `===` and `!=` as `!==` (same semantics for integers and booleans). `half` is `Math.trunc(x / 2)` in JS and `x / 2` in Go and Java.
- Text of the new nodes: `bool` is `true`/`false`; `index(a, e)` is `a[e]`; `len(a)` is `a.length` (JS, Java) and `len(a)` (Go); `&&`, `||`, `%` and `-=` are the same in the three. Types: `int[]` is `[]int` (Go) and `int[]` (Java); `bool` is `bool` (Go) and `boolean` (Java); JS has no types. Declarations: `let x = e` (JS), `x := e` (Go), `<type> x = e` (Java). Signatures: `function f(a, b) {`, `func f(a []int, b int) bool {`, `static boolean f(int[] a, int b) {`.
- Precedence (higher binds tighter): `*` `%` 3, `+` `-` 2, comparisons (`< <= > >= == !=`) 1, `&&` 0, `||` -1; `half` counts as 3 in Go and Java and is atomic in JS; `bool`, `var`, `index`, `len`, `call` and non-negative `num` are atomic. The left child of a `bin` is wrapped if its precedence is lower, the right child if it is lower or equal. Two extra rules: (a) a comparison operand of another comparison is always wrapped (`(a < b) == true`: Go puts `==` and `<` on the same level, JS and Java do not); (b) a negative `num` that is the right operand of a `bin` is wrapped (`a - (-1)`, `x < (-1)`), elsewhere it is printed as is (`-1 + a`, `return -1`, `x -= -1`). The operand of `half` is wrapped when it is a `bin` (or a `half` in Go and Java). So `x * half(n)` is `x * (n / 2)` in Go and Java.
- Java is emitted for source-file mode (`java Main.java`); Go is compiled as `main.go` (see `code-runner`).

### Programs

- `emitProgram(func, lang, { calls })` returns the full source: `package main` + `import "fmt"` (Go), `public class Main` (Java) or the bare function (JS), plus a `main` that calls the function once per argument list and prints one integer per line. The function is copied as is, with no instrumentation.
- `wrapFunction(code, lang, { entry, calls })` does the same for an already emitted function (the payload stores code, not the tree).
- `calls` needs at least one list (Go does not compile an unused `fmt`), otherwise `RangeError('calls_empty')`. `CallArg = number | readonly number[]`.
- Without `signature` (the Big O path) every argument is an integer in `[-2^31, 2^31 - 1]` (Java `int`) and the output is exactly the one described above; anything else is `RangeError('invalid_argument: <value>')` (numbers as `String`, arrays as JSON, e.g. `invalid_argument: [5,1,5]`). `emitProgram` checks the arguments first and the arity after.
- With `signature: Signature` (`WrapOptions.signature`): arity first (`arity_mismatch: expected <n>, got <m>`), then each argument against its type (`int` is an int32, `int[]` is an array, possibly empty, of int32; otherwise `invalid_argument: <JSON>`). Array literals: `[5, 1, 5]` (JS), `[]int{5, 1, 5}` (Go), `new int[]{5, 1, 5}` (Java); empty: `[]`, `[]int{}`, `new int[]{}`. JS prints `console.log(String(f(...)))` (normalizes `-0` and booleans); Go and Java already print `true`/`false`.
- `emitProgram(func, lang, { calls })` passes `signatureOf(func)` when the tree has `paramTypes` or `returns`; otherwise nothing changes.

### Evaluation

`evaluate(func, args, { maxSteps = EVAL_MAX_STEPS }) -> EvalOutcome` is the reference interpreter: pure, deterministic, it walks the tree (no `eval`, no `vm`, no process).

- `EvalOutcome = { ok: true; value: number | boolean } | { ok: false; error: EvalError }`, `EvalError = 'int_overflow' | 'index_out_of_range' | 'step_limit'`. `EVAL_MAX_STEPS = 100_000`.
- Semantics: every arithmetic result (`+ - * %`, `half`, `inc`, `compound`) outside `[-2^31, 2^31 - 1]` is `int_overflow`; `half` and `%` truncate toward zero; `&&` and `||` short-circuit; an `index` outside `[0, len)` is `index_out_of_range`; the returned value is never `-0`.
- Steps: 1 per executed statement, per evaluation of a loop condition and per call; more than `maxSteps` is `step_limit`. Calls may only target the function itself; a call depth above `MAX_CALL_DEPTH = 1_000` is also `step_limit` (a stack overflow in the real languages).
- Scopes are block scopes as in the three languages (a `for` init lives in the loop, a `let` in its block). Input arrays are never modified.
- Arguments are validated against `signatureOf(func)`: `RangeError('arity_mismatch: expected <n>, got <m>')` and `RangeError('invalid_argument: <JSON>')`.
- A malformed tree (unbound variable, call to another function, no `return`, non-boolean condition, type mismatch) throws `Error('evaluate: <detail>')`; it is a tree `checkPortable` would reject, not a semantic result.

### Mutation

`replaceNode(func, nodeId, build) -> FuncNode` returns a new tree (the original is untouched) where the node is replaced by `build(node, b)`. `b` numbers from the highest id of the tree plus one; untouched nodes, and the children `build` reuses, keep their ids. Errors: `node_not_found: <id>`; `replace_kind_mismatch: <id>` (expression for statement or the reverse, a `for` init that is not a `let`, a `for` step that is not `inc`/`compound`/`assign`, or the `func` node); `RangeError('invalid_modulo_divisor')`; `duplicate_node_id: <id>`.

### Portability checks

`checkPortable(func) -> PortabilityIssue[]` (`{ kind, nodeId }`, in emission order, `[]` when portable, never throws) reports what does not compile in some language:

- `type_mismatch`: a type error at the node whose expression has the wrong type (a condition that is not `bool`, a `return` or `let`/`assign` of the wrong type, arithmetic or ordering on non-`int`, `==`/`!=` between different types or arrays, `&&`/`||` on non-`bool`, `index`/`len` on a non-array, a call with another signature), an undeclared variable, or a call to another function. A wrong subexpression is reported once and not again by its parent.
- `unused_local`: a `let` (including a `for` init) whose variable is never read through a `var`. Conservative on purpose: `inc`, `compound` and `assign` do not count as use (Go rejects `x := 0; x = 1` as "declared and not used").
- `unreachable_statement`: the first statement after a `return` in the same block, and a `while`/`for` whose condition is constant (no `var`, `index`, `len` or `call`), reported on the loop node.
- `missing_return` (on the `func` node): the last statement of the body is not a `return`.

### Pieces built on the tree (live in the game packages)

- Big O: a catalog of **blocks** (`constant`, `linear`, `dependent`, `doubling`, `halving`, `binary_search`, `divide_and_conquer` with 1, 2 or 4 recursive calls, `double_recursion`, `permutations`) composed into **recipes** by nesting (`nest`) and sequence (`seq`), each block with its exact cost and explanation in `es` and `en` (`packages/games/big-o/src/generator/catalog/`).
- Bug Hunt: **templates** of correct functions with parameters and **mutations** (loop bounds, comparison, operator, wrong variable or index, initialization, inverted condition, misplaced `return`).

## Rules

- The tree is language-neutral; no emitter-specific nodes leak into it.
- Emitters preserve the one-statement-per-line rule; a test asserts that the same node maps to the same line in the three languages.
- Only the portable subset is allowed in the tree. `evaluate` defines its semantics (int32 with an error on overflow, truncation toward zero, `%` only with a positive literal divisor) and the generator discards whatever `checkPortable` or `evaluate` rejects.
- Emitters are pure and deterministic: same tree, same code. They never read clock, randomness or the environment.
- Emitted code is checked with the real compilers (`go build`, `javac`) in a CI job and in integration tests.
- Tree and emitters never execute code; execution lives only in the runner and only the `generator` may call it.
- Every node keeps a stable `id` so that games can reference nodes (for example `bugNodeId`) and translate lines through `lineOf`.

## Integration with other conventions

- **code-runner**: the runner executes what the emitters produce.
- **game-package**: `./generator` entries of `big-o` and `bug-hunt` use this package; `./definition` and `./client` never do.
- **testing**: emitter unit tests per language plus compile tests.

---

Actualizado por REQ-010 (S-047).
