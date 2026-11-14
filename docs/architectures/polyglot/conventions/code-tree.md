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
│   └── builder.ts      # createTreeBuilder()
├── emit/
│   ├── languages.ts    # LANGUAGES, Language
│   ├── dialect.ts      # Dialect: syntax of each language (text only)
│   ├── js.ts, go.ts, java.ts
│   ├── printer.ts      # common traversal: lines + lineOf + precedence
│   ├── index.ts        # emit(func, lang) -> { code, lineOf }
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

- Statements: `func(name, params, body)`, `let(name, expr)`, `assign(name, expr)`, `inc(name)`, `compound(name, op, expr)` (`+=`, `*=`), `for(init, cond, step, body)` (`init` is a `let`; `step` is `inc`, `compound` or `assign`), `while(cond, body)`, `if(cond, then)`, `return(expr)`.
- Expressions: `num`, `var`, `bin` (`+ - * < <= > >= ==`), `half(expr)` (integer division by 2 of a non-negative) and `call(name, args)`.
- Types: only integers. No arrays, maps, strings, `len` or `break`: no construct has a data-dependent cost.
- Identifiers match `^[a-z][a-zA-Z0-9]*$` and are not in `RESERVED_IDENTIFIERS` (reserved words of JS, Go and Java plus `main`, `fmt`, `args`, `console`, `Math`, `System`, `String`, `Main`); otherwise `Error('invalid_identifier: <name>')`.
- `num(value)` takes an integer in `[0, 2^31 - 1]`, otherwise `RangeError('invalid_number: <value>')`. Negatives are written with `bin('-', ...)`.

### Emitters

- `emit(func, lang) -> { code, lineOf }` with `lang` in `'js' | 'go' | 'java'`. `code` is lines joined with `\n`, with no trailing newline.
- **One statement per line**, closing braces on their own line. Indentation: 2 spaces (JS), tab (Go), 4 spaces (Java).
- `lineOf` has one entry per node: `func` is line 1, a statement is its first line, an expression is the line of its statement (the expressions of a `for` header are on the header line). Closing braces have no node.
- A common printer decides the line structure and a `Dialect` per language only returns text, so the three languages line up by construction.
- JS emits `==` as `===` (same semantics for integers). `half` is `Math.trunc(x / 2)` in JS and `x / 2` in Go and Java.
- Parentheses: `*` binds 3, `+`/`-` 2, comparisons 1; `half` counts as 3 in Go and Java and is atomic in JS. The left child of a `bin` is wrapped if its precedence is lower, the right child if it is lower or equal; the operand of `half` is wrapped when it is a `bin` (or a `half` in Go and Java). So `x * half(n)` is `x * (n / 2)` in Go and Java.
- Java is emitted for source-file mode (`java Main.java`); Go is compiled as `main.go` (see `code-runner`).

### Programs

- `emitProgram(func, lang, { calls })` returns the full source: `package main` + `import "fmt"` (Go), `public class Main` (Java) or the bare function (JS), plus a `main` that calls the function once per argument list and prints one integer per line. The function is copied as is, with no instrumentation.
- `wrapFunction(code, lang, { entry, calls })` does the same for an already emitted function (the payload stores code, not the tree).
- `calls` needs at least one list (Go does not compile an unused `fmt`); every argument is an integer in `[-2^31, 2^31 - 1]` (Java `int`), otherwise `RangeError`. `emitProgram` also checks the arity.

### Pieces built on the tree (live in the game packages)

- Big O: a catalog of **blocks** (`constant`, `linear`, `dependent`, `doubling`, `halving`, `binary_search`, `divide_and_conquer` with 1, 2 or 4 recursive calls, `double_recursion`, `permutations`) composed into **recipes** by nesting (`nest`) and sequence (`seq`), each block with its exact cost and explanation in `es` and `en` (`packages/games/big-o/src/generator/catalog/`).
- Bug Hunt: **templates** of correct functions with parameters and **mutations** (loop bounds, comparison, operator, wrong variable or index, initialization, inverted condition, misplaced `return`).

## Rules

- The tree is language-neutral; no emitter-specific nodes leak into it.
- Emitters preserve the one-statement-per-line rule; a test asserts that the same node maps to the same line in the three languages.
- Only the portable subset is allowed in the tree (no integer division semantics, overflow or modulo of negatives).
- Emitters are pure and deterministic: same tree, same code. They never read clock, randomness or the environment.
- Emitted code is checked with the real compilers (`go build`, `javac`) in a CI job and in integration tests.
- Tree and emitters never execute code; execution lives only in the runner and only the `generator` may call it.
- Every node keeps a stable `id` so that games can reference nodes (for example `bugNodeId`) and translate lines through `lineOf`.

## Integration with other conventions

- **code-runner**: the runner executes what the emitters produce.
- **game-package**: `./generator` entries of `big-o` and `bug-hunt` use this package; `./definition` and `./client` never do.
- **testing**: emitter unit tests per language plus compile tests.

---

Actualizado por REQ-009 (S-041).
