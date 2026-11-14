# Reusable Code - games / Big O

Package `@nerdose/game-big-o` (`packages/games/big-o`). Entries: `./definition` and `./generator` (`./client` arrives with S-046).

## Shared

### OPTION_LABEL / LANGUAGE_LABEL
- **Location:** packages/games/big-o/src/shared/labels.ts
- **Description:** Language-neutral labels. `OPTION_LABEL` maps each `BigOOption` to `O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(n³)`, `O(2ⁿ)`, `O(n!)` (Unicode superscripts). `LANGUAGE_LABEL` maps `CodeLanguage` to `JavaScript`, `Go`, `Java`. Not re-exported by `./definition`: the future `./client` imports them from `../shared/labels`.
- **Signature:** `OPTION_LABEL: Record<BigOOption, string>`; `LANGUAGE_LABEL: Record<CodeLanguage, string>`
- **Usage:** `OPTION_LABEL.o_n_log_n` is `O(n log n)`.

## Definition

### bigO / definition
- **Location:** packages/games/big-o/src/definition/index.ts
- **Description:** `GameDefinition` of Big O. `toPublic` builds `{ code: { js, go, java }, options }` field by field (anti-spoiler) with the 8 options in fixed order, a fresh array each call, ignoring locale and state. `initState` is `{}` and stays so while the Play is in progress (the selection lives in the client). `applyMove` confirms `{ language, option }` in one move with `feedback: null`, and returns `invalid_move` on an already confirmed state. `result` localizes and copies the explanation (no shared references) and throws `big-o: result requires a confirmed state` on an unconfirmed one (the api only calls it for won/lost Plays). `score` is 1/0. `reduceStats` accumulates `by_category[recipe_category].{played, correct}` purely. `codeLanguage` is `s.language ?? null`. `historyLabel` is `✓ O(...)` or `✗`. `bankUsage` is `null` and `culprits` is `[]`.
- **Signature:** `GameDefinition<BigOPayload, BigOPublicView, BigOState, BigOMove, BigOFeedback, BigOResult, BigOStats>`
- **Usage:** `createGameRegistry([devdle, grepGrid, timeline, bigO])`

### Schemas and types
- **Location:** packages/games/big-o/src/definition/schemas.ts
- **Description:** `payloadSchema` (invariants: `trap_option !== answer`; `trap_option === null` implies no `example.trap_ops`), `moveSchema` (strict), `stateSchema` (strict, `language` and `option` both or none), `publicViewSchema` (strict, 8 options), `feedbackSchema` (`null`), `resultSchema` (strict, localized strings), `statsSchema`, `codeByLanguageSchema`, `MIN_STEPS = 2`, `MAX_STEPS = 6`, and the inferred types `BigOPayload`, `BigOPayloadExplanation`, `BigOMove`, `BigOState`, `BigOPublicView`, `BigOFeedback`, `BigOResult`, `BigOExplanation`, `BigOStats`, `CodeByLanguage`.
- **Usage:** `moveSchema.safeParse(body)`; a failure is `422 invalid_move`.

### Test fixtures
- **Location:** packages/games/big-o/src/definition/test-fixtures.ts
- **Description:** `PAYLOAD` (nested loops, trap `o_n2`), `PAYLOAD_RECURSION` (no trap, tip or example), `WON_JAVA`, `LOST_GO`, `withAnswer(answer)` (keeps `trap_option !== answer`), `CODE_NLOGN`, `NOW`, `CTX_ES`, `CTX_EN`, `S0`. Not exported by the entry: copy them in other packages' tests.

## Generator

Entry `./generator` (`packages/games/big-o/src/generator/index.ts`). It does not export the `generator` object yet: `GameGenerator` requires `verify`, which arrives with S-045, that will compose `{ historySpec, usedBankItems, generate, verify }` from these pieces.

### generate / historySpec / usedBankItems / TRAP_RATE
- **Location:** packages/games/big-o/src/generator/generate.ts
- **Description:** `generate` is deterministic and never mutates `history`. It consumes the rng in a fixed order: (1) the trap draw `rng.int(1, 100) <= 35`; (2) `rng.pick` over the eligible recipes of the chosen group (with trap or without), sorted by `id`, falling back to the other group when empty; (3) the recipe parameters in traversal order. With no eligible recipe it applies the same logic over the whole catalog and leaves the rejection to `verify`. `historySpec` is `{ bank: null, lastUsedField: '', recentDays: 30, aheadDays: 30 }` and `usedBankItems` returns `[]`.
- **Signature:** `generate: GameGenerator<BigOPayload>['generate']`; `historySpec: HistorySpec`; `usedBankItems(): string[]`; `TRAP_RATE = 0.35`
- **Usage:** `generate({ date: '2027-03-15', seed, history: { bankItems: [], recentChallenges } })`

### RECIPES / buildRecipe / buildPayload
- **Location:** packages/games/big-o/src/generator/catalog/{recipes,build,explain,texts,params,complexity,cost,dsl,types}.ts, src/generator/generate.ts
- **Description:** 43 recipes (blocks `constant`, `linear`, `dependent`, `doubling`, `halving`, `binary_search`, `divide_and_conquer`, `double_recursion`, `permutations`, composed with `nest` and `seq`). `buildRecipe(recipe, params)` always produces `f(n)` with neutral names (`f`, `n`, `i`, `j`, `k`, `ops`, `lo`, `hi`, `mid`) and no comments. Naming rules for the three languages: a `let` never redeclares a visible name, a `for` init never shadows one, every `let` is read, the body ends in `return`, and a function-level declaration repeated in sequence uses `assign`. Recursive calls only take `half(n)` or `n - c` (`c` in 1..2, only for `o_2n` and `o_n_fact`), so recursion depth stays within `MAX_RECURSION_DEPTH`. `cost(n)` is exact and computed in TS (closed forms, sums and memoized recurrences). `buildPayload` adds steps (blocks, compositions, phi note, final), line notes, tip (trap or category) and example `{ n: EXAMPLE_N[answer], ops: cost(n), trap_ops }`. Recipe ids are stable: they are part of the stored payload.
- **Signature:** `buildRecipe(recipe: Recipe, params: Params): BuiltRecipe`; `buildPayload(recipe: Recipe, params: Params): BigOPayload`; `RECIPES: readonly Recipe[]`
- **Usage:** `buildPayload(RECIPES.find((r) => r.id === 'nest(linear,doubling)')!, [1])`

### Variety
- **Location:** packages/games/big-o/src/generator/variety.ts
- **Description:** `recipesUsedNear(date, recent)` returns the recipes of `[D - 29, D + 29]` without the row of `D`. `answerWouldRepeat(answer, date, recent)` is true when `D-2,D-1,D`, `D-1,D,D+1` or `D,D+1,D+2` would all have `answer`. `eligibleRecipes` combines both and is ordered by `id`. S-045 reuses `recipesUsedNear` and `answerWouldRepeat` for `variety_recipe` and `variety_answer`.
- **Signature:** `recipesUsedNear(date, recent): Set<string>`; `answerWouldRepeat(answer, date, recent): boolean`; `eligibleRecipes(date, recent): Recipe[]`; `RECIPE_REPEAT_DAYS = 30`; `MAX_SAME_ANSWER_STREAK = 2`

### Scale and shape
- **Location:** packages/games/big-o/src/generator/{scale,shape}.ts
- **Description:** `SCALE` (sizes per answer, decision 10 of REQ-009), `EXAMPLE_N`, `classValue(option, n)` (exact integers, `RangeError` for the log of a non power of two), `COUNT_MAX = 2 ** 31 - 1` and `SCALE_WORK_BUDGET = 300_000_000` (sum of `cost(n)` over the scale; S-045 may recalibrate it). `measureCode(code, lang)` measures lines and nesting from the indentation, `treeNesting(func)` from the tree, with limits `MAX_LINES = 15`, `MAX_NESTING = 3`. S-045 reuses `SCALE`, `EXAMPLE_N`, `classValue` and `measureCode` for `code_shape`, `counts_in_range`, `example_matches_run` and the fit checks.

### Test utilities
- **Location:** packages/games/big-o/src/generator/{test-fixtures,test-utils}.ts
- **Description:** `seed(n)` / `seedFrom(prefix, n)` (SHA-256 seeds: uniform seeds collapse to a zero state in `rngFrom`), `D = '2027-03-15'`, `recipe(id)`, `recent(date, id, params?)`. `interpret(func, n)` evaluates the tree with the integer semantics of the portable subset (test only: it never runs emitted code, which belongs to S-045's runner).
