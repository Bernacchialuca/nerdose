# Reusable Code - games / Big O

Package `@nerdose/game-big-o` (`packages/games/big-o`). Entries: `./definition`, `./client` and `./generator`.

## Shared

### OPTION_LABEL / LANGUAGE_LABEL
- **Location:** packages/games/big-o/src/shared/labels.ts
- **Description:** Language-neutral labels. `OPTION_LABEL` maps each `BigOOption` to `O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`, `O(n³)`, `O(2ⁿ)`, `O(n!)` (Unicode superscripts). `LANGUAGE_LABEL` maps `CodeLanguage` to `JavaScript`, `Go`, `Java`. Not re-exported by `./definition`: the `./client` imports them from `../shared/labels`.
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
- **Description:** `payloadSchema` (optional `date`, `YYYY-MM-DD`, first key, never public; invariants: `trap_option !== answer`; `trap_option === null` implies no `example.trap_ops`), `moveSchema` (strict), `stateSchema` (strict, `language` and `option` both or none), `publicViewSchema` (strict, 8 options), `feedbackSchema` (`null`), `resultSchema` (strict, localized strings), `statsSchema`, `codeByLanguageSchema`, `MIN_STEPS = 2`, `MAX_STEPS = 6`, and the inferred types `BigOPayload`, `BigOPayloadExplanation`, `BigOMove`, `BigOState`, `BigOPublicView`, `BigOFeedback`, `BigOResult`, `BigOExplanation`, `BigOStats`, `CodeByLanguage`.
- **Usage:** `moveSchema.safeParse(body)`; a failure is `422 invalid_move`.

### Test fixtures
- **Location:** packages/games/big-o/src/definition/test-fixtures.ts
- **Description:** `PAYLOAD` (nested loops, trap `o_n2`), `PAYLOAD_RECURSION` (no trap, tip or example), `WON_JAVA`, `LOST_GO`, `withAnswer(answer)` (keeps `trap_option !== answer`), `CODE_NLOGN`, `NOW`, `CTX_ES`, `CTX_EN`, `S0`. Not exported by the entry: copy them in other packages' tests.

## Client

Entry `./client` (React 19, Shiki loaded dynamically). Same props contract as Timeline plus the optional `codeLanguage`; it imports only the schemas of `../definition/schemas` (never `../definition/index`, which carries the solution) and never `@nerdose/polyglot`.

### Instructions
- **Location:** packages/games/big-o/src/client/instructions.tsx
- **Description:** Instructions screen: `h1` in the game accent, meta, three `Card` `step`s (read the code, worst case, pick and confirm), count notice and a "Start" button that calls `onStart` once per attempt (re-armed when `starting` returns to `false`). Slots `notices` and `actions`; the rules section has `id={HELP_TARGET_ID}`. It shows neither the recipe category nor any code.
- **Signature:** `Instructions(props: InstructionsProps)`

### Game
- **Location:** packages/games/big-o/src/client/game.tsx
- **Description:** Playing screen: `// peor caso` line, question `h1`, `CodeBlock` starting at `codeLanguage ?? 'js'`, "// tu respuesta" with the 8 options as a radiogroup, hint line with a polite live region, "Confirmar respuesta →" full width right under the options (disabled label «Elegí una opción») and, in the aside, the "// cómo se juega" card (`#game-help`) then the report slot (REQ-012 common pattern). Selection and visible language are local state that survives a tab or language change and restarts when the code changes. `onMove(moveSchema.parse({ language, option }))` once per attempt (`submittedRef`, re-armed on `pending` end or `moveError`). `pending` locks the options, the tabs and the button; `locked` keeps only the question and the host slots. DOM in mobile order, desktop placed with `lg:` classes (D5).
- **Signature:** `Game(props: GameProps)`

### Result
- **Location:** packages/games/big-o/src/client/result.tsx
- **Description:** Verdict always as a `Banner` `titleAs="h1"` (`success` on a win with its own detail, `failure` otherwise; REQ-012 common pattern), question `h2`, `CodeBlock` at `result.code_language` with the line notes (the code comes from `publicView.code`; without `publicView` the question and code are omitted), the 8 marked options and the "Paso a paso" `aside`. Slots `notices`, `footer` and `aside`.
- **Signature:** `Result(props: ResultProps)`

### Preview
- **Location:** packages/games/big-o/src/client/preview.tsx
- **Description:** Read-only solution mode for the admin: parses the full payload, translates with `translatorFor(language)`, plain-text `CodeBlock` (`highlight={false}`, never loads Shiki, local view tabs, D8), options with the answer ("✓ correcta") and the `trap_option` ("trampa", dashed border) and the explanation in `language` under `h3` headings. Root `<div lang>`, no landmark, no controls beyond the tabs.
- **Signature:** `Preview(props: { payload: unknown; language: Locale })`

### share
- **Location:** packages/games/big-o/src/client/share.ts
- **Description:** `🧮 Big O #N` / `🟩|🟥 <Language>` (the host appends the site line), identical in es and en, never the chosen option or the answer. Throws `ZodError` on an invalid result.
- **Signature:** `share(result: unknown, number: number): string`

### i18n / HELP_TARGET_ID / contract types / parsers
- **Location:** packages/games/big-o/src/client/{i18n/index.ts,help-target.ts,types.ts,parse.ts}
- **Description:** Namespace `big-o` (es/en), help anchor `game-help`, the props types (`ClientBaseProps` adds the optional `codeLanguage?: CodeLanguage`, default `'js'`; `PreviewProps`) and the parsers `parsePublicView`, `parseState`, `parseResult`, `parsePayload`.

### CodeBlock
- **Location:** packages/games/big-o/src/client/code-block.tsx
- **Description:** Read-only code block: `tablist` of JavaScript / Go / Java (arrows, Home, End; `aria-disabled` when locked), file name, keyboard-reachable `tabpanel` (lines wrap through `CodeText` with a hanging indent, so it does not scroll sideways in practice; REQ-012), `aria-hidden` line numbers, highlighted lines with their note (below the line in blocks narrower than 32rem and at the right margin from there, by container query, D12). Same tree with or without color: Shiki tokens are drawn as `<span style={{ color }}>` once the tokenizer loads; while loading, on failure or when the line count differs the plain text is shown (D11). The root sets `SHIKI_VARS` (D2). Resets the tab when `initialLanguage` or `code` change.
- **Signature:** `CodeBlock({ code, initialLanguage, t, notes?, highlight?, disabled?, onLanguageChange?, className? })`

### CodeText
- **Location:** packages/games/big-o/src/client/code-text.tsx
- **Description:** One code line that never forces a horizontal scroll: the leading indent stays fixed (`flex-none`, `whitespace-pre`) and the rest wraps (`whitespace-pre-wrap wrap-anywhere`) aligned with the code of that line; Shiki tokens are trimmed across token boundaries (`dropPrefix`). Same file in Bug Hunt (REQ-012/S-066).
- **Signature:** `CodeText({ text, tokens? }: { text: string; tokens?: readonly HighlightToken[] })`

### loadTokenizer / SHIKI_VARS / useTokenizer
- **Location:** packages/games/big-o/src/client/{highlight.ts,shiki-vars.ts,use-tokenizer.ts}
- **Description:** `loadTokenizer()` imports Shiki only with `import()` (core, JS regex engine, js/go/java grammars, `css-variables` theme `nerdose-big-o`), memoises the promise and clears it on rejection. `SHIKI_VARS` maps the `--shiki-*` variables to DS tokens (no hex). `useTokenizer(enabled)` returns the tokenizer or `null`. Not exported by the entry.
- **Signature:** `loadTokenizer(): Promise<Tokenizer>`; `type Tokenizer = (code, language) => { content: string; color: string | null }[][]`; `useTokenizer(enabled: boolean): Tokenizer | null`

### OptionsGroup / Question
- **Location:** packages/games/big-o/src/client/{options-group.tsx,question.tsx}
- **Description:** `OptionsGroup` is the single-choice `radiogroup` of the 8 options (roving tabindex, arrows and Home/End move focus and selection, stable 2px border, `●` on the chosen one, 2 columns on mobile and 4 from `lg`). `Question` renders the fixed question with `f(n)` in the game accent as `h1`, `h2` or `p`.
- **Signature:** `OptionsGroup({ options, selected, onSelect, disabled, t })`; `Question({ t, as, className? })`

### ResultOptions / Explanation
- **Location:** packages/games/big-o/src/client/{result-options.tsx,explanation.tsx}
- **Description:** Shared by `Result` and `Preview`. `ResultOptions` is the read-only list of 8 options marked with icon and text (correct, chosen wrong, preview trap, `sr-only` label per item). `Explanation` is the "Paso a paso" panel (`aside` at level 2, `section` at level 3): numbered steps, the "en números" box (`ops` and `trap_ops` formatted by locale, trap line only with a trap) and the tip.
- **Signature:** `ResultOptions({ marks, title, headingLevel, t })`; `Explanation({ steps, tip, example, trapLabel, locale, t, headingLevel })`

### resultMarks / previewMarks / formatCount / moveRadio / codeLines / notesByLine
- **Location:** packages/games/big-o/src/client/{options.ts,format.ts,radio.ts,lines.ts}
- **Description:** Pure helpers. `resultMarks(r)` and `previewMarks(p)` give the 8 options in `BIG_O_OPTIONS` order with `correct` and `chosen` / `trap`; `formatCount(value, locale)` uses `Intl.NumberFormat`; `moveRadio(index, key, count)` is the APG radio navigation (wrap, Home, End, `null` for other keys); `codeLines(code)` splits lines and `notesByLine(notes)` indexes notes by 1-based line.
- **Signature:** `resultMarks(r: BigOResult): ResultMark[]`; `previewMarks(p: BigOPayload): PreviewMark[]`; `formatCount(value: number, locale: Locale): string`; `moveRadio(index: number, key: string, count: number): number | null`

### ConsoleHint / SectionPanel / translatorFor
- **Location:** packages/games/big-o/src/client/{console-hint.tsx,section-panel.tsx,translate.ts}
- **Description:** Copies of Timeline's (imports between games are forbidden): silent hint line with a polite live region, panel with an `h2`/`h3` `//` header, and the production translator for `Preview` (returns the key when missing).

### makeT / test fixtures
- **Location:** packages/games/big-o/src/client/{test-utils.ts,test-fixtures.ts}
- **Description:** Test-only: `makeT(locale)` (throws on a missing key) and the client fixtures (`CODE`, `PUBLIC_VIEW`, `PUBLIC_VIEW_OTHER`, `RESULT_WON_JAVA_ES/EN`, `RESULT_LOST_GO_ES`, `RESULT_PLAIN_ES`, `RESULT_NO_TRAP_EXAMPLE_ES`, `PREVIEW_PAYLOAD`, `PREVIEW_PAYLOAD_PLAIN`).

## Generator

Entry `./generator` (`packages/games/big-o/src/generator/index.ts`). It exports the `generator` object, `{ historySpec, usedBankItems, generate, verify }`, which `apps/generator` consumes.

### generator
- **Location:** packages/games/big-o/src/generator/index.ts
- **Description:** The `GameGenerator<BigOPayload>` of Big O. `verify` is the async one from `verify.ts`; `generate`, `historySpec` and `usedBankItems` come from `generate.ts`.
- **Signature:** `generator: GameGenerator<BigOPayload>`
- **Usage:** `import { generator } from '@nerdose/game-big-o/generator'; await generator.verify(payload, history)`

### generate / historySpec / usedBankItems / TRAP_RATE
- **Location:** packages/games/big-o/src/generator/generate.ts
- **Description:** `generate` is deterministic and never mutates `history`. It consumes the rng in a fixed order: (1) the trap draw `rng.int(1, 100) <= 35`; (2) `rng.pick` over the eligible recipes of the chosen group (with trap or without), sorted by `id`, falling back to the other group when empty; (3) the recipe parameters in traversal order. With no eligible recipe it applies the same logic over the whole catalog and leaves the rejection to `verify`. `historySpec` is `{ bank: null, lastUsedField: '', recentDays: 30, aheadDays: 30 }` and `usedBankItems` returns `[]`.
- **Signature:** `generate: GameGenerator<BigOPayload>['generate']`; `historySpec: HistorySpec`; `usedBankItems(): string[]`; `TRAP_RATE = 0.35`
- **Usage:** `generate({ date: '2027-03-15', seed, history: { bankItems: [], recentChallenges } })`
- **Note:** the returned payload carries `date` as its first key, because `verify` has no date argument and the variety checks need it.

### verify / createVerify / VERIFY_CHECKS
- **Location:** packages/games/big-o/src/generator/verify.ts
- **Description:** Async verification by execution. Always returns the 13 checks of `VERIFY_CHECKS` in this order: `texts_bilingual`, `code_shape`, `variety_recipe`, `variety_answer`, `run_js`, `run_go`, `run_java`, `counts_agree`, `counts_in_range`, `example_matches_run`, `fit_quality`, `fit_unambiguous`, `fit_matches_answer`. A check is `{ ok: false, detail: 'skipped' }` only when its input is missing: checks 1-4 failing skips 5-13 (nothing runs), any `run_*` failing skips 8-13, `counts_agree` failing skips 9-13, `counts_in_range` failing skips 11-13. The 3 languages run in parallel with `wrapFunction(code[lang], lang, { entry: 'f', calls })` over `SCALE[answer]`. `reason` is the name of the first failed check, or `run_<lang>: <kind>` (`timeout`, `compile_error`, `runtime_error`, `toolchain_missing`, `output_too_large`, `invalid_output`). `run_*` detail is `<kind> (<ms> ms): <first stderr line>` (the `# command-line-arguments` header of `go build` is skipped). A payload without `date` always fails the variety checks (`missing date`). Never throws for a payload or snippet problem.
- **Signature:** `createVerify(deps?: { run?: Runner; timeoutMs?: number }): (p: BigOPayload, history: GeneratorHistory<BigOPayload>) => Promise<VerificationLog>`; `verify = createVerify()`; `type Runner = (lang, source, options?) => Promise<RunOutcome>`
- **Usage:** `await createVerify({ run: fakeRunner({ js: counts, go: counts, java: counts }).run })(payload, history)`

### fitCounts / formatFit / fit constants
- **Location:** packages/games/big-o/src/generator/fit.ts
- **Description:** Pure fit of measured counts against the 8 classes, in log space: `lr = ln c - ln g(n)`, normalized by `max(lr)`, `CV = population std / mean`; the exponential model uses the least-squares base of `ln c` against `n`, clamped to `[EXP_BASE_MIN, EXP_BASE_MAX]` = `[1.55, 2.05]`. Models are sorted by CV (ties by `BIG_O_OPTIONS` order). Verdict `poor_fit` if `best.cv > FIT_MAX_CV` (0.1), `ambiguous_fit` if `second.cv < max(FIT_MIN_SEPARATION * best.cv, FIT_MIN_SECOND_CV)` (2 and 0.1), else `ok`. It does not use `classValue`, which throws for the log of a non power of two and overflows with `n!`. Throws `RangeError` (`big-o: fit_length_mismatch`, `fit_too_few_points`, `fit_non_positive`).
- **Signature:** `fitCounts(ns: readonly number[], counts: readonly number[]): FitResult`; `formatFit(fit): string`; `FitResult = { models, best, second, base, verdict }`
- **Usage:** `fitCounts(SCALE.o_n, counts).best.option`

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
- **Description:** `seed(n)` / `seedFrom(prefix, n)` (SHA-256 seeds: uniform seeds collapse to a zero state in `rngFrom`), `D = '2027-03-15'`, `recipe(id)`, `recent(date, id, params?)`, `fakeRunner(outputs)` (returns `{ run, calls }`; a number array is the printed counts, a string is the literal stdout, a `RunOutcome` is returned as is), `allLanguages(counts)`, `emptyHistory`, `withDate(p)` and `noExample(p, answer)`. `requireToolchains()` (packages/games/big-o/test/integration/toolchains.ts, copy of polyglot's) fails, never skips, when Node 24, Go >= 1.25 or JDK 21 is missing. `interpret(func, n)` evaluates the tree with the integer semantics of the portable subset (test only: it never runs emitted code, which belongs to S-045's runner).

## StatsSummary (REQ-011)

- **Location:** `src/client/stats-summary.tsx`, `src/client/stats.ts`, `src/client/stat-bar.tsx`
- **Description:** Own stats of Big O: one row per recipe category (`RECIPE_CATEGORIES` order) with `N de M`, bar and %.
- **Signature:** `categoryRates(stats): { category; played; correct; rate: number | null }[]`, `gamesCount(stats)`, `formatPercent(rate, locale)`, `StatBar({ rate })`
- **Usage:** `<StatsSummary extra={game.extra} locale="es" t={t} />`
