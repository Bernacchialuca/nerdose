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
├── tree/            # node types and builders: func, let, for, while, if, return, call, ...
├── emit/
│   ├── js.ts        # emit(tree, 'js')
│   ├── go.ts
│   ├── java.ts
│   └── index.ts     # emit(tree, lang) -> { code, lineOf }
└── runner/
    └── run.ts       # runInLanguage(...) - see code-runner
```

## How to use

```ts
import { emit } from '@nerdose/polyglot';

const { code, lineOf } = emit(tree, 'go');   // code: string, lineOf: Map<nodeId, line>
```

### The tree

A mini language with `func`, `let`, `for`, `while`, `if`, `return`, calls and arithmetic/comparison expressions. Every node has a stable `id` (Bug Hunt stores `bugNodeId`). It only uses constructs that behave the same in the three languages:

- small integers and arrays of integers;
- `for`, `while`, `if`, `return`;
- `len` / `length` as a builtin.

It avoids integer division (JS emits `Math.trunc(a / b)`), overflow and modulo of negatives.

### Emitters

- `emit(tree, lang) -> { code, lineOf }` with `lang` in `'js' | 'go' | 'java'`.
- **One statement per line**, and closing braces on their own line, so a statement lands on **the same line** in the three languages. `lineOf` maps each node to its line in case they ever differ.
- Java is emitted for source-file mode (`java Main.java`); Go for `go run main.go`.

### Pieces built on the tree (live in the game packages)

- Big O: a catalog of **blocks** (constant, linear, logarithmic, halving, dependent, binary search, divide and conquer, double recursion), each with its cost and explanation in `es` and `en`.
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
