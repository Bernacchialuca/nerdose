# Reusable Code - games / Bug Hunt

Package `@nerdose/game-bug-hunt` (`packages/games/bug-hunt`). Entries: `./definition`, `./generator` (`./client` arrives with S-051; the `generator` object and `verify` with S-050).

## Shared

### LANGUAGE_LABEL / BUG_TYPE_LABEL
- **Location:** packages/games/bug-hunt/src/shared/labels.ts
- **Description:** `LANGUAGE_LABEL` maps `CodeLanguage` to `JavaScript`, `Go`, `Java` (a copy of Big O's: game packages never import each other). `BUG_TYPE_LABEL` maps each `BugType` to `{ es, en }` (e.g. `comparison` -> `comparación` / `comparison`). Client-side constants, never sent in a player response. Not re-exported by `./definition`.
- **Signature:** `LANGUAGE_LABEL: Record<CodeLanguage, string>`; `BUG_TYPE_LABEL: Record<BugType, Record<Locale, string>>`
- **Usage:** `BUG_TYPE_LABEL.off_by_one.en` is `off by one`.

## Definition

### bugHunt / definition
- **Location:** packages/games/bug-hunt/src/definition/index.ts
- **Description:** `GameDefinition` of Bug Hunt. `toPublic` builds exactly `{ function_name, spec, code: { js, go, java }, pickable_lines, visible_tests }` field by field (anti-spoiler), copying test inputs and sorting `pickable_lines` ascending so its shape never depends on `bug_line`; it ignores state. `initState` is `{}` until the Play is confirmed. `applyMove` returns `invalid_move` for a line outside `pickable_lines` or on an already confirmed state; otherwise `{ state: { language, line }, feedback: null }` (win or loss is decided by `result`). `result` localizes and copies (no shared references), builds `fix[lang]` as `{ before: code[lang] line bug_line, after: fix[lang] }`, and throws `bug-hunt: result requires a confirmed state` or `bug-hunt: bug_line out of range` on broken invariants. `reduceStats` accumulates `by_language` and `by_bug_type` purely. `historyLabel` is `✓ L<n>` / `✗ L<n>` (n = bug line). `codeLanguage` is `s.language ?? null`; `culprits` is `[]`; `bankUsage` is `null`.
- **Signature:** `GameDefinition<BugHuntPayload, BugHuntPublicView, BugHuntState, BugHuntMove, BugHuntFeedback, BugHuntResult, BugHuntStats>`
- **Usage:** `createGameRegistry([devdle, grepGrid, timeline, bigO, bugHunt])`

### Schemas, constants and types
- **Location:** packages/games/bug-hunt/src/definition/schemas.ts
- **Description:** `payloadSchema` (loose `z.object`; validates structure only: types, non-empty code/fix, 2-4 steps, int32 test values, `function_name` identifier; counts of tests, ordering of `pickable_lines`, `bug_line` membership and text emptiness are left to `verify`), `moveSchema` (strict `{ language, line >= 1 }`), `stateSchema` (strict, `language` and `line` both or none), `publicViewSchema` (strict, 2-3 visible tests), `feedbackSchema` (`null`), `resultSchema` (strict, localized strings), `statsSchema`, `codeByLanguageSchema`, `testCaseSchema`, `visibleTestSchema`, `MIN_STEPS = 2`, `MAX_STEPS = 4`, `MIN_VISIBLE_TESTS = 2`, `MAX_VISIBLE_TESTS = 3`, and the inferred types `BugHuntPayload`, `BugHuntMove`, `BugHuntState`, `BugHuntPublicView`, `BugHuntFeedback`, `BugHuntResult`, `BugHuntLineFix`, `BugHuntExplanation`, `BugHuntStats`, `BugHuntTestCase`, `BugHuntVisibleTest`, `CodeByLanguage`.
- **Usage:** `moveSchema.safeParse(body)`; a failure is `422 invalid_move`.

### Test fixtures
- **Location:** packages/games/bug-hunt/src/definition/test-fixtures.ts
- **Description:** `PAYLOAD` (`maxIndex`, `comparison`, bug on line 4), `PAYLOAD_BOOL` (`anyAbove`, two arguments, boolean result, `bad_initialization`), `WON_JAVA`, `LOST_GO`, `WON_BOOL_JS`, `NON_PICKABLE`, `NOW`, `CTX_ES`, `CTX_EN`, `S0`. Not exported by the entry: copy them in other packages' tests.

## Generator

Everything lives in `packages/games/bug-hunt/src/generator/` and is re-exported by `./generator`. Nothing here runs emitted code: tests use `evaluate` of `@nerdose/polyglot`.

### generate / createGenerate / historySpec / usedBankItems / MAX_COMBOS
- **Location:** packages/games/bug-hunt/src/generator/generate.ts
- **Description:** `generate` is deterministic with `rngFrom(seed)`: it picks the bug type, then (up to `MAX_COMBOS = 30` attempts) a template that admits it, a parameter combination, the tests and a shuffled list of mutation candidates, and returns the first `ok` payload (`date` is the first key). The bug type does not change between attempts. With no valid candidate it returns the best fallback (only variety fails, then too few passing tests, then equivalent; the last one found wins) so `verify` rejects it; it throws `bug-hunt: no evaluable candidate` only if nothing could be evaluated. `createGenerate(templates)` builds a `generate` over any template list (used with probe templates). `historySpec` is `{ bank: null, lastUsedField: '', recentDays: 60, aheadDays: 60 }`; `usedBankItems` returns `[]`.
- **Signature:** `createGenerate(templates: readonly Template[]): GameGenerator<BugHuntPayload>['generate']`
- **Usage:** `generate({ date, seed, history })`; S-050 composes `{ historySpec, usedBankItems, generate, verify }`.

### TEMPLATES / templateById / bugTypesOf / combosFor / Template
- **Location:** packages/games/bug-hunt/src/generator/catalog/index.ts, packages/games/bug-hunt/src/generator/types.ts
- **Description:** 12 templates sorted by `id` (`all_where`, `any_where`, `binary_search`, `count_equal_neighbors`, `count_where`, `extreme_index`, `first_index_where`, `is_palindrome`, `is_sorted`, `last_index_where`, `max_window_sum`, `sum_range`) with 48 parameter combinations. Each declares `functionName`, `build(params, builder)` (the correct tree and its mutation sites), `spec` (separate ES/EN texts), `edgeCases`, `randomInput` and `reference`. `templateById` throws `bug-hunt: unknown template <id>`. `bugTypesOf` / `combosFor` derive from the declared sites which bug types a template admits.
- **Signature:** `templateById(id: string): Template`; `combosFor(template, bugType): TemplateParams[]`
- **Usage:** `templateById('extreme_index').build({ extreme: 'max', tie: 'first' }, createTreeBuilder())`

### OPERATORS / OPERATOR_IDS / mutationsOf / neutralExpr / neutralStmt
- **Location:** packages/games/bug-hunt/src/generator/mutation/operators.ts, packages/games/bug-hunt/src/generator/mutation/candidates.ts, packages/games/bug-hunt/src/generator/mutation/neutral.ts
- **Description:** 15 operators (`loop_cond_relax`, `loop_cond_tighten`, `loop_start_shift`, `bound_minus_one`, `bound_plus_one`, `relax_comparison`, `tighten_comparison`, `swap_arith`, `swap_compound`, `swap_logical`, `swap_variable`, `shift_init`, `flip_bool_init`, `early_return`, `negate_condition`), each with a `bugType` and `variants(node, site)` (empty for a node it does not fit). `mutationsOf(built, bugType)` returns `{ site, operator, from, to, mutant }[]` in a stable order, dropping variants `replaceNode` rejects. `neutralExpr` / `neutralStmt` print `from` / `to` in neutral notation.
- **Signature:** `mutationsOf(built: BuiltTemplate, bugType: BugType): MutationCandidate[]`
- **Usage:** `mutationsOf(built, 'comparison')[0].to` is `'>='` for `maxIndex`.

### TEST_COUNT / testSize / buildTests / selectTests / evaluateCandidate
- **Location:** packages/games/bug-hunt/src/generator/tests.ts, packages/games/bug-hunt/src/generator/evaluate-candidate.ts
- **Description:** `buildTests` returns `TEST_COUNT = 10` distinct tests (edge cases first, then random inputs, at most `MAX_TEST_DRAWS = 200` draws) with `expected` from `evaluate`. `testSize` is array elements plus scalar arguments. `selectTests` returns `equivalent`, `not_enough_passing` or `ok` with `failing` (smallest failing) and `visible` (up to 3 smallest passing). `evaluateCandidate` classifies a mutation as `invalid`, `equivalent`, `not_enough_passing`, `variety` or `ok`.
- **Signature:** `selectTests(tests: BugHuntTestCase[]): Selection`
- **Usage:** S-050 `tests_consistent` checks that the hidden test is the smallest with `testSize`.

### formatCall / formatValue
- **Location:** packages/games/bug-hunt/src/generator/format.ts
- **Description:** `formatCall('maxIndex', [[5, 1, 5]])` is `maxIndex([5, 1, 5])`; `formatValue` prints integers, booleans and arrays.
- **Signature:** `formatCall(name: string, input: TestInput): string`

### VARIETY_DAYS / canonicalJson / varietyKey / keysUsedNear
- **Location:** packages/games/bug-hunt/src/generator/variety.ts
- **Description:** `varietyKey` is `template:canonicalJson(params):operator@node:to`. `keysUsedNear(date, rows)` returns the keys of the rows in `[D - 59, D + 59]` without the row of `D`.
- **Signature:** `keysUsedNear(date: string, recent: readonly RecentChallenge<BugHuntPayload>[]): Set<string>`
- **Usage:** S-050 `variety_combo` fails if `keysUsedNear(date, history).has(varietyKey(payload))`.

### MIN_LINES / MAX_LINES / MAX_NESTING / measureCode
- **Location:** packages/games/bug-hunt/src/generator/shape.ts
- **Description:** `MIN_LINES = 8`, `MAX_LINES = 15`, `MAX_NESTING = 3` and `measureCode(code, lang)` returning `{ lines, nesting }` from the indentation (a copy of Big O's with the minimum added).
- **Signature:** `measureCode(code: string, lang: CodeLanguage): { lines: number; nesting: number }`

### addDays
- **Location:** packages/games/bug-hunt/src/generator/days.ts
- **Description:** Clock-free `YYYY-MM-DD` arithmetic in UTC (a copy of Big O's).
- **Signature:** `addDays(date: string, days: number): string`

### Generator test fixtures
- **Location:** packages/games/bug-hunt/src/generator/test-fixtures.ts, packages/games/bug-hunt/src/generator/test-utils.ts
- **Description:** `D`, `seed(n)` / `seedFrom(prefix, n)` (SHA-256 digests), `payloadWith`, `recent`, `rowWithKey`, `emptyHistory`, the probe templates `PROBE_EQUIV`, `PROBE_ONLY_EQUIV`, `PROBE_FEW`, `PROBE_FEW_ONLY`, `PROBE_VARIETY` (one combination, random inputs are the edge cases), `assertValidPayload`, `rebuild` and `allCandidates`. Not exported by the entry.
