# Reusable Code - games / Bug Hunt

Package `@nerdose/game-bug-hunt` (`packages/games/bug-hunt`). Entries: `./definition`, `./generator` (`./client` arrives with S-051; the `generator` object and `verify` with S-050).

## Shared

### LANGUAGE_LABEL / BUG_TYPE_LABEL
- **Location:** packages/games/bug-hunt/src/shared/labels.ts
- **Description:** `LANGUAGE_LABEL` maps `CodeLanguage` to `JavaScript`, `Go`, `Java` (a copy of Big O's: game packages never import each other). `BUG_TYPE_LABEL` maps each `BugType` to `{ es, en }` (e.g. `comparison` -> `comparación` / `comparison`). Client-side constants, never sent in a player response. Not re-exported by `./definition`.
- **Signature:** `LANGUAGE_LABEL: Record<CodeLanguage, string>`; `BUG_TYPE_LABEL: Record<BugType, Record<Locale, string>>`
- **Usage:** `BUG_TYPE_LABEL.off_by_one.en` is `off by one`.

### formatCall / formatValue / formatArgs
- **Location:** packages/games/bug-hunt/src/shared/format.ts
- **Description:** Pure call formatting shared by the client (visible tests, failing test) and the generator (server-side explanation). `formatArgs([[3, 7, 2], 4])` is `[3, 7, 2], 4` (used in the accessible text of each test). `generator/format.ts` re-exports `formatCall` and `formatValue`.
- **Signature:** `formatCall(name: string, input: readonly TestArg[]): string`; `formatValue(v: TestValue): string`; `formatArgs(input: readonly TestArg[]): string`

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

## Client

Entry `./client` (React 19, Shiki loaded dynamically). Same props contract as Big O (`codeLanguage?` optional, default `'js'`); it imports only the schemas of `../definition/schemas` (never `../definition/index`, which carries the solution) and never `@nerdose/polyglot`. Shiki infrastructure, `ConsoleHint`, `SectionPanel`, `translatorFor`, `makeT` and `radio`/`lines` are copies of Big O's (cross-game imports are forbidden, ADR-002).

### Instructions
- **Location:** packages/games/bug-hunt/src/client/instructions.tsx
- **Description:** Instructions screen: `h1` in the game accent, meta, three `Card` `step`s, count notice and a "Empezar" button that calls `onStart` once per attempt (re-armed when `starting` returns to `false`); inert with `starting` or `startDisabled`. Slots `notices` and `actions`; the rules section has `id={HELP_TARGET_ID}`. It shows no code nor bug types.
- **Signature:** `Instructions(props: InstructionsProps)`

### Game
- **Location:** packages/games/bug-hunt/src/client/game.tsx
- **Description:** Playing screen: consigna, question `h1`, `Statement`, `TestsCard` (visible tests as calls plus the hidden-test row), `CodeBlock mode="select"` starting at `codeLanguage ?? 'js'`, hint line with a polite live region, "Confirmar línea N" and the rules card (`#game-help`). Line and visible language are local state that survives a tab or locale change and restarts when the code changes (`state = {}` always starts without a selection). `onMove(moveSchema.parse({ language, line }))` once per attempt; `pending` locks tabs and lines; `invalid_move` keeps the line; `locked` hides the board. DOM in mobile order, `lg:` placement for desktop.
- **Signature:** `Game(props: GameProps)`

### Result
- **Location:** packages/games/bug-hunt/src/client/result.tsx
- **Description:** Verdict (`sr-only` `h1` on a win, `Banner` `failure` otherwise), question `h2`, `Statement`, `CodeBlock mode="result"` at `result.code_language` with the bug / wrong-pick marks, and the "Por qué falla" `aside` (`WhyPanel`: failing test, fix of the active tab, steps and the "tipo: …" chip). Without `publicView` the question, spec and code are omitted and the fix stays in `code_language`. Slots `notices`, `footer`, `aside`.
- **Signature:** `Result(props: ResultProps)`

### Preview
- **Location:** packages/games/bug-hunt/src/client/preview.tsx
- **Description:** Read-only solution mode for the admin: parses the full payload, translates with `translatorFor(language)`, plain-text `CodeBlock mode="preview"` (`highlight={false}`, never loads Shiki; non-eligible lines dimmed, bug line tagged) with local view tabs, chips "tipo" and "mutación: from → to", visible tests (no hidden row), failing test, fix following the tab and the steps in `language`. Root `<div lang>`, `h3` headings, no controls beyond the tabs.
- **Signature:** `Preview(props: { payload: unknown; language: Locale })`

### share
- **Location:** packages/games/bug-hunt/src/client/share.ts
- **Description:** `🐛 Bug Hunt #N · <Language>` / `🟩 bug encontrado` | `🟥 se me escapó` (en: `bug found` | `it got away`) / `nerdose.dev`; never the line, the bug type or the test. `locale` is optional (default `'es'`) so the client fits the host's current and future `GameClient.share`. Throws `ZodError` on an invalid result.
- **Signature:** `share(result: unknown, number: number, locale?: Locale): string`

### i18n / HELP_TARGET_ID / contract types / parsers
- **Location:** packages/games/bug-hunt/src/client/{i18n/index.ts,help-target.ts,types.ts,parse.ts}
- **Description:** Namespace `bug-hunt` (es/en), help anchor `game-help`, the props types (`ClientBaseProps` with the optional `codeLanguage?`, `PreviewProps`) and the parsers `parsePublicView`, `parseState`, `parseResult`, `parsePayload`.

### CodeBlock
- **Location:** packages/games/bug-hunt/src/client/code-block.tsx
- **Description:** Code block with `tablist` JavaScript / Go / Java (arrows, Home, End, wrap; `aria-disabled` when locked), file name from `fileNames(name)` and three modes. `select`: `radiogroup` where only `pickable` lines are `role="radio"` (roving tabindex; arrows move focus, Space picks, Enter does nothing), the rest plain `text-text-dim` text, `◀` tag fixed at the visible edge (text from `@lg`). `result`: marks `found` / `bug` / `wrong` with glyph + text tags under the line below 32rem and at the margin from there, tied by `aria-describedby`. `preview`: as `result` with plain text. Same tree with or without color (Shiki tokens only after the tokenizer loads; non-eligible lines never colored in `select`/`preview`).
- **Signature:** `CodeBlock({ mode, name, code, initialLanguage, t, pickable?, selected?, onSelect?, marks?, markLabel?, highlight?, disabled?, onLanguageChange?, className? })`

### FixDiff
- **Location:** packages/games/bug-hunt/src/client/fix-diff.tsx
- **Description:** `diff` code block of the one-line fix: `- ` / `+ ` literal prefixes with error / success tinted rows, own horizontal scroll (keyboard reachable), heading `h2` or `h3`.
- **Signature:** `FixDiff({ line, fix: { before, after }, language, t, headingLevel })`

### Statement / TestsCard / FailingTest / WhyPanel / TypeChip / Question
- **Location:** packages/games/bug-hunt/src/client/{statement,tests-card,failing-test,why-panel,question}.tsx
- **Description:** `Statement` is the amber `bug-hunt.statement` panel (`headingLevel: 2 | 3 | null`). `TestsCard` lists the visible tests as calls with a `sr-only` text and, with `showHidden`, the dashed "1 test oculto falla" row. `FailingTest` is the error box with expected / got in words. `WhyPanel` is the `aside` (level 2) or `section` (level 3) with failing test, `FixDiff`, numbered steps and optional chips; `TypeChip` is the accent chip. `Question` renders the fixed question as `h1` or `h2`.
- **Signature:** `Statement({ spec, t, headingLevel, className? })`; `TestsCard({ name, tests, t, headingLevel, showHidden, className? })`; `FailingTest({ name, failing, t, headingLevel })`; `WhyPanel({ name, failing, fixLine, fix, language, steps, chips?, t, headingLevel })`

### loadTokenizer / SHIKI_VARS / useTokenizer
- **Location:** packages/games/bug-hunt/src/client/{highlight.ts,shiki-vars.ts,use-tokenizer.ts}
- **Description:** Copies of Big O's with the `nerdose-bug-hunt` theme: `loadTokenizer()` imports Shiki only with `import()`, memoises the promise and clears it on rejection; `SHIKI_VARS` maps the 11 `--shiki-*` variables to Bug Hunt DS tokens (no hex; AA verified in `contrast.test.ts`); `useTokenizer(enabled)` returns the tokenizer or `null`. Not exported by the entry.
- **Signature:** `loadTokenizer(): Promise<Tokenizer>`; `useTokenizer(enabled: boolean): Tokenizer | null`

### fileNames / resultLineMarks / previewLineMarks / payloadFix / moveRadio / moveLine / codeLines
- **Location:** packages/games/bug-hunt/src/client/{files,marks,radio,lines}.ts
- **Description:** Pure helpers. `fileNames('maxIndex')` gives `max-index.js` / `max_index.go` / `MaxIndex.java`; `resultLineMarks` and `previewLineMarks` build the `Map<line, 'found' | 'bug' | 'wrong'>`; `payloadFix(p, lang)` builds `{ before, after }` for the admin; `moveRadio` is APG radio navigation; `moveLine` handles only ArrowUp/Down, Home and End; `codeLines` splits lines.
- **Signature:** `fileNames(name: string): Record<CodeLanguage, string>`; `moveLine(index: number, key: string, count: number): number | null`

### ConsoleHint / SectionPanel / translatorFor
- **Location:** packages/games/bug-hunt/src/client/{console-hint.tsx,section-panel.tsx,translate.ts}
- **Description:** Copies of Big O's: silent hint line with a polite live region, panel with an `h2`/`h3` `//` header, and the production translator for `Preview` (returns the key when missing).

### makeT / test fixtures
- **Location:** packages/games/bug-hunt/src/client/{test-utils.ts,test-fixtures.ts}
- **Description:** Test-only: `makeT(locale)` (throws on a missing key) and the client fixtures (`CODE`, `PUBLIC_VIEW`, `PUBLIC_VIEW_EN`, `PUBLIC_VIEW_BOOL`, `RESULT_WON_JAVA_ES/EN`, `RESULT_LOST_GO_ES`, `RESULT_BOOL_ES`, `PREVIEW_PAYLOAD`, `PREVIEW_PAYLOAD_BOOL`).

## Generator

Everything lives in `packages/games/bug-hunt/src/generator/` and is re-exported by `./generator`. `generate` and the catalog never run emitted code (they use `evaluate` of `@nerdose/polyglot`); only `verify` runs it, through an injectable runner.

### generate / createGenerate / historySpec / usedBankItems / MAX_COMBOS
- **Location:** packages/games/bug-hunt/src/generator/generate.ts
- **Description:** `generate` is deterministic with `rngFrom(seed)`: it picks the bug type, then (up to `MAX_COMBOS = 30` attempts) a template that admits it, a parameter combination, the tests and a shuffled list of mutation candidates, and returns the first `ok` payload (`date` is the first key). The bug type does not change between attempts. With no valid candidate it returns the best fallback (only variety fails, then too few passing tests, then equivalent; the last one found wins) so `verify` rejects it; it throws `bug-hunt: no evaluable candidate` only if nothing could be evaluated. `createGenerate(templates)` builds a `generate` over any template list (used with probe templates). `historySpec` is `{ bank: null, lastUsedField: '', recentDays: 60, aheadDays: 60 }`; `usedBankItems` returns `[]`.
- **Signature:** `createGenerate(templates: readonly Template[]): GameGenerator<BugHuntPayload>['generate']`
- **Usage:** `generate({ date, seed, history })`; the `generator` object composes `{ historySpec, usedBankItems, generate, verify }`.

### generator / verify / createVerify / VERIFY_CHECKS / Runner
- **Location:** packages/games/bug-hunt/src/generator/index.ts, packages/games/bug-hunt/src/generator/verify.ts
- **Description:** `generator` is the `GameGenerator<BugHuntPayload>` that `apps/generator` consumes. `verify` is async and returns the 13 checks of `VERIFY_CHECKS` in that order (`texts_bilingual`, `code_shape`, `lines_consistent`, `tests_consistent`, `variety_combo`, `run_{correct,mutant}_{js,go,java}`, `correct_agrees`, `mutant_agrees`). The 5 in-memory checks are always all computed; if any fails nothing runs and checks 6-13 are `{ ok: false, detail: 'skipped' }`. Otherwise the 3 languages run in parallel and, inside each, the correct then the mutant version. `correct_agrees` / `mutant_agrees` need the 3 valid outputs of their variant and compare them with each other and with `tests[].expected` / `tests[].actual`. `reason` is the name of the first failing check, except `run_<variant>_<lang>: <kind | invalid_output | harness_error>` and `tests_consistent: equivalent_mutant | not_enough_passing`. `detail` of a run is `<ms> ms` or `<kind> (<ms> ms): <first stderr line>`. It never throws for a bad payload or snippet. `createVerify` injects the runner and the timeout.
- **Signature:** `createVerify(deps?: { run?: Runner; timeoutMs?: number }): (p: BugHuntPayload, history: GeneratorHistory<BugHuntPayload>) => Promise<VerificationLog>`; `type Runner = (lang: Language, source: string, options?: RunOptions) => Promise<RunOutcome>`
- **Usage:** `await verify(payload, history)`; in tests `createVerify({ run: fakeRunnerFor(p).run })`.

### correctCode / testSignature / buildSources / parseValues
- **Location:** packages/games/bug-hunt/src/generator/harness.ts
- **Description:** Pure pieces of the execution. `correctCode` swaps `bug_line` for `fix[lang]`; `testSignature` derives the `Signature` from the first test; `buildSources` wraps the 6 programs with `wrapFunction` (returns `{ ok: false, error }` instead of throwing); `parseValues` reads one integer or boolean per line and nothing else. `firstStderrLine` is also exported from the file.
- **Signature:** `buildSources(p: BugHuntPayload): { ok: true; sources: Sources } | { ok: false; error: string }`; `parseValues(stdout: string, expected: number): { values: (number | boolean)[] } | { error: string }`
- **Usage:** `const r = buildSources(p); if (r.ok) run('go', r.sources.mutant.go)`.

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
- **Description:** Re-export of `shared/format.ts` (S-051 moved the implementation there so the client shows the same call text): `formatCall('maxIndex', [[5, 1, 5]])` is `maxIndex([5, 1, 5])`; `formatValue` prints integers, booleans and arrays.
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

### fakeRunnerFor / catalogPayload / requireToolchains
- **Location:** packages/games/bug-hunt/src/generator/test-fixtures.ts, packages/games/bug-hunt/src/generator/test-utils.ts, packages/games/bug-hunt/test/integration/toolchains.ts
- **Description:** `fakeRunnerFor(p, overrides?)` returns `{ run, calls }`, a runner that executes nothing: per language the 1st call is the correct version and the 2nd the mutant, and by default it prints `tests[].expected` / `tests[].actual`; `overrides` (`correct_<lang>` / `mutant_<lang>`) take values, a literal stdout or a `RunOutcome`. `catalogPayload(template, bugType, date?)` is a deterministic payload for each of the 62 template x bug type pairs. `requireToolchains()` (a copy of Big O's) fails, never skips, if Node 24, Go >= 1.25 or JDK 21 is missing. Not exported by the entry.
- **Signature:** `fakeRunnerFor(p: BugHuntPayload, overrides?: FakeOverrides): { run: Runner; calls: FakeCall[] }`; `catalogPayload(template: Template, bugType: BugType, date?: string): BugHuntPayload`
- **Usage:** `await createVerify({ run: fakeRunnerFor(p, { mutant_go: [0, 1] }).run })(p, emptyHistory)`.

## StatsSummary (REQ-011)

- **Location:** `src/client/stats-summary.tsx`, `src/client/stats.ts`, `src/client/stat-bar.tsx`
- **Description:** Own stats of Bug Hunt: two groups (by language, by bug type) with `N de M`, bar and %.
- **Signature:** `languageRates(stats)`, `bugTypeRates(stats)` (rows with `played`, `correct`, `rate: number | null`), `gamesCount(stats)`, `formatPercent(rate, locale)`, `StatBar({ rate })`
- **Usage:** `<StatsSummary extra={game.extra} locale="en" t={t} />`
