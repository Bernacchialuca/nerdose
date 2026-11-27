# Reusable Code Index - games

Packages `@nerdose/game-devdle` (`packages/games/devdle`), entries `./definition`, `./client`, `./generator` and data resource `./wordlist`, `@nerdose/game-grep-grid` (`packages/games/grep-grid`), entries `./definition`, `./client` and `./generator`, `@nerdose/game-timeline` (`packages/games/timeline`), entries `./definition`, `./generator` and `./client`, `@nerdose/game-big-o` (`packages/games/big-o`), entries `./definition`, `./client` and `./generator`, and `@nerdose/game-bug-hunt` (`packages/games/bug-hunt`), entries `./definition`, `./client` and `./generator`. The build script lives in `scripts/` and is never importable from `src/` or other packages.

## Devdle definition (6 items) - see devdle.md
- **devdle / definition** (packages/games/devdle/src/definition/index.ts) - `GameDefinition` of Devdle (`id: 'devdle'`, `version: 1`); `definition` is an alias; implements `codeLanguage` -> `null`; implements `culprits(p)` (1 `term`, kind/id/label; test in `src/generator/culprits.test.ts`); declares `bankUsage` terms/last_used_devdle/365/1 (checked against `historySpec`/`REUSE_WINDOW_DAYS`/`usedBankItems` in `src/generator/bank-usage.test.ts`)
- **scoreGuess** (packages/games/devdle/src/definition/feedback.ts) - Pure per-letter feedback with repeated-letter handling (`correct` first, then left-to-right `present`)
- **payloadSchema / moveSchema / guessSchema / stateSchema / publicViewSchema / resultSchema / statsSchema / letterMarkSchema** (packages/games/devdle/src/definition/schemas.ts) - Zod schemas, snake_case as in `api.yaml`
- **WORD_PATTERN / MAX_GUESSES** (packages/games/devdle/src/definition/schemas.ts) - `/^[A-Z]{4,12}$/` and 6
- **DevdlePayload / DevdleMove / DevdleGuess / DevdleFeedback / DevdleState / DevdlePublicView / DevdleResult / DevdleStats / LetterMark** (packages/games/devdle/src/definition/schemas.ts) - Types inferred from the schemas
- **PAYLOAD_REACT / PAYLOAD_MERGE / ALL_VALID / NONE_VALID / NOW** (packages/games/devdle/src/definition/test-fixtures.ts) - Test-only fixtures, not exported from the entry; `ALL_VALID` / `NONE_VALID` carry `locale: 'es'` (required by `MoveContext`)

## Devdle client (13 items) - see devdle.md
- **StatsSummary / StatsSummaryProps / distributionRows / gamesCount / formatPercent / DistributionBars** (packages/games/devdle/src/client/{stats-summary.tsx,stats.ts,distribution-bars.tsx,types.ts}) - Own stats from `GameStatsView.extra`: attempts distribution 1..6 and X (`DistributionBars` extracted from `Distribution`, `highlight?` for the "today" bar); `stats.none` without games; pure functions in `stats.ts`
- **Preview / PreviewProps / translatorFor** (packages/games/devdle/src/client/{preview.tsx,types.ts,translate.ts}) - Read-only solution-mode preview `{ payload: unknown; language: Locale }` for the admin (one solved `Board` row + `WordCard`, `h3` headings, root `lang`); parses with `payloadSchema`; `translatorFor(language)` is the production translator (returns the key if missing). `SectionPanel` gained `headingLevel?: 2 | 3`; `WordCard` takes `Pick<DevdleResult, 'word'|'category'|'definition'|'summary'>` and `headingLevel?`
- **Instructions / Game / Result** (packages/games/devdle/src/client/{instructions,game,result}.tsx) - React screens of the `./client` entry; game data props are `unknown` and parsed with the definition schemas
- **share** (packages/games/devdle/src/client/share.ts) - `share(result, number)`: `🟩 Devdle #N · k/6` (plus ` 💡` if the hint was used), one emoji row per try (the host appends the site line); never the solution
- **i18n** (packages/games/devdle/src/client/i18n/index.ts) - `{ namespace: 'devdle', resources: { es, en } }` for web to register
- **HELP_TARGET_ID** (packages/games/devdle/src/client/help-target.ts) - `'game-help'`
- **Translate / ClientBaseProps / InstructionsProps / GameProps / ResultProps / MoveErrorInfo / GameStatsView** (packages/games/devdle/src/client/types.ts) - Prop contract
- **SectionPanel** (packages/games/devdle/src/client/section-panel.tsx) - Panel with a `//` header as `h2`
- **Board** (packages/games/devdle/src/client/board.tsx) - Scalable 4-12 column grid with non-chromatic glyphs; `hinted` cell and pickable positions for the letter hint (REQ-012)
- **LetterHintButton / SurrenderButton / SurrenderDialog** (packages/games/devdle/src/client/{letter-hint-button,surrender}.tsx) - Aside «💡 Pista» trigger and «⚑ Rendirse» (`error-outline`) with its confirmation dialog (REQ-012)
- **useDevdleInput** (packages/games/devdle/src/client/use-devdle-input.ts) - Physical keyboard normalized into letter/backspace/submit/invalid
- **keyStates / isFinished / MARK_EMOJI / MARK_GLYPH** (packages/games/devdle/src/client/marks.ts) - Pure helpers

## Devdle generator (6 items) - see devdle.md
- **generator / DevdleTerm** (packages/games/devdle/src/generator/index.ts) - `GameGenerator<DevdlePayload, DevdleTerm>` with `historySpec`, `usedBankItems`, `generate`, `verify` (`verify` is the synchronous `verifyPayload`, typed `VerificationLog | Promise<VerificationLog>` by the contract: tests use `verifyPayload` for checks and `await generator.verify` through the contract; no `aheadDays`)
- **verifyPayload** (packages/games/devdle/src/generator/verify.ts) - Five ordered checks returning a `VerificationLog`
- **eligibleTerms / blockedCategories / isExcluded / sortByTerm / isReusable / REUSE_WINDOW_DAYS / RECENT_DAYS** (packages/games/devdle/src/generator/eligibility.ts) - 365-day filter, exclusion list and 3-tier category rotation (last 3 days → yesterday → none, the strictest tier that leaves a candidate), ordinal ordering by `term` (REQ-012)
- **DEVDLE_LAUNCH_TERMS / LAUNCH_DAYS** (packages/games/devdle/src/generator/launch-terms.ts) - 77 easy bank terms; for challenges #1 to #50 Devdle picks only from them while one is reusable (`candidateTerms` / `inLaunchWindow` in `eligibility.ts`, check `launch_pool` in `verify`). More terms than days so the public list does not reveal the order
- **DEVDLE_EXCLUDED_TERMS** (packages/games/devdle/src/shared/excluded.ts) - 115 niche bank terms Devdle never picks as the answer (still used by Grep Grid and accepted as guesses); imported by the generator (`eligibility.ts`) and by the definition (`bankUsage.excludedItems`). `src/shared` imports nothing outside itself (boundaries test). Moved from `src/generator/` in S-067
- **addDays / isValidDate** (packages/games/devdle/src/generator/dates.ts) - Clock-free `YYYY-MM-DD` arithmetic in UTC
- **BANK / seed / payloadFrom / RECENT_GIT_DB_LINUX** (packages/games/devdle/src/generator/test-fixtures.ts) - Test-only fixtures (`seed(n)` is a SHA-256 digest: uniform seeds collapse to a zero state in `rngFrom`)

## Word list script (5 items) - see devdle.md
- **runBuildWordlist / EmptySourceError** (packages/games/devdle/scripts/build-wordlist/run.ts) - Orchestration of `build:wordlist`; validates sources before writing, writes atomically
- **buildWordList / filterWords / serializeWordList** (packages/games/devdle/scripts/build-wordlist/words.ts) - ENABLE filtered union Wikidata labels, uppercase, sorted, no duplicates
- **createHttpClient / buildUserAgent / HttpRequestError** (packages/games/devdle/scripts/build-wordlist/http.ts) - Polite HTTP client (`getText`, `getJson`): User-Agent, pause, retries with backoff
- **buildLabelsQuery / parseLabels / fetchClassLabels** (packages/games/devdle/scripts/build-wordlist/wikidata.ts) - SPARQL access to English labels per class
- **loadWordlistEnv / parseWordlistArgs / WORDLIST_CLASSES** (packages/games/devdle/scripts/build-wordlist/{env,args,classes}.ts) - `WIKIMEDIA_CONTACT`, `--enable` and the QID list

## Grep Grid shared (1 item) - see grep-grid.md
- **GRID_SIZE / DIRECTIONS / DIRECTION_STEPS / Cell / Direction / inGrid / sameCell / directionOf / lineCells** (packages/games/grep-grid/src/shared/geometry.ts) - Pure geometry of the 12x12 grid and the 4 forward directions; `lineCells` returns `null` for invalid lines

## Grep Grid definition (5 items) - see grep-grid.md
- **grepGrid / definition** (packages/games/grep-grid/src/definition/index.ts) - `GameDefinition` of Grep Grid (`id: 'grep-grid'`, `version: 1`); `definition` is an alias; implements `codeLanguage` -> `null`; implements `culprits(p)` (8 `term` in `words` order; test in `src/generator/culprits.test.ts`); declares `bankUsage` terms/last_used_grep/30/8 (checked against `historySpec`/`REUSE_WINDOW_DAYS`/`usedBankItems` in `src/generator/bank-usage.test.ts`)
- **payloadSchema / moveSchema / stateSchema / publicViewSchema / feedbackSchema / feedbackFoundSchema / feedbackNotFoundSchema / resultSchema / statsSchema / cellSchema** (packages/games/grep-grid/src/definition/schemas.ts) - Zod schemas, snake_case as in `api.yaml`
- **WORD_PATTERN / WORDS_COUNT** (packages/games/grep-grid/src/definition/schemas.ts) - `/^[A-Z]{4,12}$/` and 8
- **GrepGridPayload / GrepGridWord / GrepGridPlacement / GrepGridMove / GrepGridState / GrepGridPublicView / GrepGridFeedback / GrepGridResult / GrepGridStats** (packages/games/grep-grid/src/definition/schemas.ts) - Types inferred from the schemas
- **PAYLOAD / GRID_DUPLICATE / ID / NOW / CTX_ES / CTX_EN / S0 / select / selectWord / cellsOf / playAll** (packages/games/grep-grid/src/definition/test-fixtures.ts) - Test-only fixtures, not exported from the entry

## Grep Grid client (16 items) - see grep-grid.md
- **StatsSummary / StatsSummaryProps / averageWords / perfectRate / gamesCount / formatPercent / formatAverage / parseStats** (packages/games/grep-grid/src/client/{stats-summary.tsx,stats.ts,parse.ts,types.ts}) - Own stats: average of words found (one decimal) and % of 8/8, `—` without games; pure functions in `stats.ts`
- **Preview / PreviewProps / translatorFor** (packages/games/grep-grid/src/client/{preview.tsx,types.ts,translate.ts}) - Read-only solution-mode preview `{ payload: unknown; language: Locale }` for the admin (`Board mode="result"` with `solution` cells + `WordList mode="preview"`, `h3` headings, root `lang`); `translatorFor(language)` returns the key if missing
- **solutionKeys / previewCells** (packages/games/grep-grid/src/client/cells.ts) - `solutionKeys(payload)` walks `placements` with `DIRECTION_STEPS` (throws on an unknown `term_id`); `previewCells(grid, keys)` builds the 144 cells (`solution` / `free`). `CellState` and `WordRow.status` gained `solution`; `WordListMode = 'play' | 'result' | 'preview'`; `SectionPanel` gained `headingLevel`
- **Instructions / Game / Result** (packages/games/grep-grid/src/client/{instructions,game,result}.tsx) - React screens of the `./client` entry; data props are `unknown` and parsed with the definition schemas; `Game` also takes `feedback` (last `MoveResponse.feedback`, processed by identity after mount); `Result` takes an optional `publicView` for the 144 letters
- **share** (packages/games/grep-grid/src/client/share.ts) - `share(result, number)`: `🔎 Grep Grid #N` / `S/8` (the host appends the site line); never words nor surrender
- **i18n** (packages/games/grep-grid/src/client/i18n/index.ts) - `{ namespace: 'grep-grid', resources: { es, en } }` for web to register
- **HELP_TARGET_ID** (packages/games/grep-grid/src/client/help-target.ts) - `'game-help'`
- **Translate / ClientBaseProps / InstructionsProps / GameProps / ResultProps / MoveErrorInfo / GameStatsView** (packages/games/grep-grid/src/client/types.ts) - Prop contract
- **Board** (packages/games/grep-grid/src/client/board.tsx) - 12x12 grid, `play` mode (roving tabindex, two taps) and `result` mode (read-only table); scales with `@container` variables
- **WordList** (packages/games/grep-grid/src/client/word-list.tsx) - 8 word rows (pending / found / revealed) with definitions
- **ConsoleHint** (packages/games/grep-grid/src/client/console-hint.tsx) - Silent console line plus a polite region with one keyed node per announcement
- **SurrenderDialog / SURRENDER_BUTTON** (packages/games/grep-grid/src/client/{surrender-dialog.tsx,surrender-button.ts}) - O-04 `alertdialog` with focus trap and the error-tinted outline button class
- **SectionPanel** (packages/games/grep-grid/src/client/section-panel.tsx) - Copy of the Devdle panel with a `//` header as `h2`
- **playCells / resultCells / cellKey / CELL_GLYPH / moveFocus** (packages/games/grep-grid/src/client/{cells,focus}.ts) - Pure cell model (start > found > revealed > free) and arrow-key navigation
- **makeT / client fixtures** (packages/games/grep-grid/src/client/{test-utils,test-fixtures}.ts) - Test-only helpers, not exported from the entry

## Grep Grid generator (8 items) - see grep-grid.md
- **generator / GrepGridTerm** (packages/games/grep-grid/src/generator/index.ts) - `GameGenerator<GrepGridPayload, GrepGridTerm>` with `historySpec`, `usedBankItems`, `generate`, `verify` (`verify` is the synchronous `verifyPayload`, typed `VerificationLog | Promise<VerificationLog>` by the contract: tests use `verifyPayload` for checks and `await generator.verify` through the contract; no `aheadDays`)
- **verifyPayload** (packages/games/grep-grid/src/generator/verify.ts) - Nine ordered checks returning a `VerificationLog`; never throws
- **eligibleTerms / sortByTerm / isReusable / related / REUSE_WINDOW_DAYS** (packages/games/grep-grid/src/generator/eligibility.ts) - 30-day filter (excluding recent challenges), ordinal ordering, substring relation
- **chooseTerms** (packages/games/grep-grid/src/generator/choose.ts) - Picks 8 terms without substring relations, completing with ineligible ones when needed
- **placeWords / fillGrid / canPlace / MAX_PLACEMENT_STEPS / MAX_FILL_REDRAWS** (packages/games/grep-grid/src/generator/placement.ts) - Deterministic placement with crossings and bounded backtracking; filler with re-draws
- **countOccurrences** (packages/games/grep-grid/src/generator/occurrences.ts) - Occurrences of a word in the 4 forward directions
- **addDays / isValidDate** (packages/games/grep-grid/src/generator/dates.ts) - Copy of the Devdle helpers (cross-game imports are forbidden)
- **BANK / BANK_FIXTURE / DATE / seed / mk / history** (packages/games/grep-grid/src/generator/test-fixtures.ts) - Test-only fixtures

## Timeline shared (3 items) - see timeline.md
- **distinguishable / allDistinguishable / indistinguishablePairs / compareChronological / DatedFact** (packages/games/timeline/src/shared/dates.ts) - Date distinguishability by precision and chronological ordering
- **PROMPT** (packages/games/timeline/src/shared/prompts.ts) - Single fixed `{ es, en }` prompt for every day
- **formatEventDate** (packages/games/timeline/src/shared/format-date.ts) - UTC date formatting by precision

## Timeline definition (4 items) - see timeline.md
- **timeline / definition** (packages/games/timeline/src/definition/index.ts) - `GameDefinition` of Timeline (`id: 'timeline'`, `version: 1`); `definition` is an alias; implements `codeLanguage` -> `null`; implements `culprits(p)` (5 `timeline_fact` by `fact_id` in `items` order; test in `src/generator/culprits.test.ts`); declares `bankUsage` timeline_facts/last_used/90/5 (checked against `historySpec`/`REUSE_WINDOW_DAYS`/`usedBankItems` in `src/generator/bank-usage.test.ts`)
- **payloadSchema / moveSchema / stateSchema / publicViewSchema / feedbackSchema / resultSchema / statsSchema** (packages/games/timeline/src/definition/schemas.ts) - Zod schemas, snake_case as in `api.yaml`
- **ITEMS_COUNT / OPAQUE_ID_PATTERN** (packages/games/timeline/src/definition/schemas.ts) - 5 and `/^[a-z0-9]{6}$/`
- **TimelinePayload / TimelineItem / TimelineMove / TimelineState / TimelinePublicView / TimelineFeedback / TimelineResult / TimelineStats** (packages/games/timeline/src/definition/schemas.ts) - Types inferred from the schemas

## Timeline client (15 items) - see timeline.md
- **StatsSummary / StatsSummaryProps / categoryRates / bestCategory / gamesCount / formatPercent / StatBar / parseStats** (packages/games/timeline/src/client/{stats-summary.tsx,stats.ts,stat-bar.tsx,parse.ts,types.ts}) - Own stats: one row per category in catalog order (label, bar, %) and best category (tie -> first of the catalog); `StatBar` is the inline `streak` bar (duplicated in big-o and bug-hunt)
- **Preview / PreviewProps / translatorFor** (packages/games/timeline/src/client/{preview.tsx,types.ts,translate.ts}) - Read-only solution-mode preview `{ payload: unknown; language: Locale }` for the admin (`// consigna` line + `Rail` in `correct_order`, `h3` heading, root `lang`; throws on an unknown `opaque_id`); `translatorFor(language)` returns the key if missing. `SectionPanel` gained `headingLevel?: 2 | 3`
- **Instructions** (packages/games/timeline/src/client/instructions.tsx) - Instructions screen with a once-per-attempt "Start"
- **Game** (packages/games/timeline/src/client/game.tsx) - Playing screen with the dnd-kit sortable list, hint and confirmation
- **Result** (packages/games/timeline/src/client/result.tsx) - Verdict, score, "your order" and "correct order" rail
- **share** (packages/games/timeline/src/client/share.ts) - Spoiler-free share text
- **i18n / HELP_TARGET_ID / parse* / contract types** (packages/games/timeline/src/client/i18n/index.ts, help-target.ts, parse.ts, types.ts) - Namespace `timeline`, help anchor, schema parsers and props types
- **initialOrder / reorder / moveBy / sameIdSet** (packages/games/timeline/src/client/order.ts) - Pure ordering shared by drag, keyboard and buttons
- **positionMarks / squares** (packages/games/timeline/src/client/marks.ts) - Per-position hit marks and share squares
- **makeAnnouncements / makeScreenReaderInstructions** (packages/games/timeline/src/client/announcements.ts) - Translated dnd-kit announcements
- **useTimelineSensors / MousePointerSensor** (packages/games/timeline/src/client/sensors.ts) - Mouse, touch and keyboard sensors
- **SortableRow / useRowSortable** (packages/games/timeline/src/client/sortable-row.tsx, use-row-sortable.ts) - Playing row with handle and up/down buttons
- **ConsoleHint / SectionPanel** (packages/games/timeline/src/client/console-hint.tsx, section-panel.tsx) - Silent hint line with live region; panel with `h2` header
- **CategoryTag** (packages/games/timeline/src/client/category-tag.tsx) - `// <category>` tag per milestone
- **Score / Rail / YourOrder** (packages/games/timeline/src/client/score.tsx, rail.tsx, your-order.tsx) - Result pieces
- **makeT / test fixtures** (packages/games/timeline/src/client/test-utils.ts, test-fixtures.ts) - Test-only helpers

## Timeline generator (6 items) - see timeline.md
- **generator / TimelineFact** (packages/games/timeline/src/generator/index.ts) - `GameGenerator<TimelinePayload, TimelineFact>`; `TimelineFact` is the `bankItems` contract for S-028; `verify` is the synchronous `verifyPayload`, typed `VerificationLog | Promise<VerificationLog>` by the contract (tests use `verifyPayload` for checks and `await generator.verify` through the contract); no `aheadDays`
- **verifyPayload** (packages/games/timeline/src/generator/verify.ts) - Nine ordered checks returning a `VerificationLog`
- **eligibleFacts / sortById / isReusable / REUSE_WINDOW_DAYS** (packages/games/timeline/src/generator/eligibility.ts) - 90-day window and recent-challenge exclusion
- **chooseFacts** (packages/games/timeline/src/generator/choose.ts) - Greedy distinguishable selection from the whole bank (mixed categories)
- **shuffle / drawOpaqueIds / drawInitialOrder / sameOrder / OPAQUE_ID_ALPHABET / MAX_REDRAWS** (packages/games/timeline/src/generator/opaque.ts) - Seed-driven shuffle and opaque ids
- **addDays / isValidDate** (packages/games/timeline/src/generator/days.ts) - Clock-free `YYYY-MM-DD` arithmetic in UTC

## Big O shared (1 item) - see big-o.md
- **OPTION_LABEL / LANGUAGE_LABEL** (packages/games/big-o/src/shared/labels.ts) - Language-neutral labels of the 8 `BigOOption` (`O(n²)`, `O(2ⁿ)`...) and the 3 `CodeLanguage` (`JavaScript`, `Go`, `Java`)

## Big O definition (6 items) - see big-o.md
- **bigO / definition** (packages/games/big-o/src/definition/index.ts) - `GameDefinition` of Big O (`id: 'big-o'`, `version: 1`); `definition` is an alias; single-move game with `state = {}` until confirmed; `bankUsage: null`, `codeLanguage: (s) => s.language ?? null`, `culprits: () => []`; `historyLabel` is `✓ O(...)` / `✗`
- **payloadSchema / moveSchema / stateSchema / publicViewSchema / feedbackSchema / resultSchema / statsSchema / codeByLanguageSchema** (packages/games/big-o/src/definition/schemas.ts) - Zod schemas, snake_case as in `api.yaml`; payload invariants `trap_option !== answer` and no `trap_ops` without `trap_option`; state is "both or none"
- **MIN_STEPS / MAX_STEPS** (packages/games/big-o/src/definition/schemas.ts) - 2 and 6 explanation steps
- **BigOPayload / BigOPayloadExplanation / BigOMove / BigOState / BigOPublicView / BigOFeedback / BigOResult / BigOExplanation / BigOStats / CodeByLanguage** (packages/games/big-o/src/definition/schemas.ts) - Types inferred from the schemas
- **PAYLOAD / PAYLOAD_RECURSION / WON_JAVA / LOST_GO / withAnswer / NOW / CTX_ES / CTX_EN / S0 / CODE_NLOGN** (packages/games/big-o/src/definition/test-fixtures.ts) - Test-only fixtures, not exported from the entry

## Big O client (15 items) - see big-o.md
- **StatsSummary / StatsSummaryProps / categoryRates / gamesCount / formatPercent / StatBar / parseStats** (packages/games/big-o/src/client/{stats-summary.tsx,stats.ts,stat-bar.tsx,parse.ts,types.ts}) - Own stats: hits per recipe category (`N de M`, bar, %), labels in `stats.categories.*` of the i18n
- **Instructions / Game / Result** (packages/games/big-o/src/client/{instructions,game,result}.tsx) - Screens: once-per-attempt "Start"; code tabs + 8-option radiogroup + confirm (`moveSchema.parse` then `onMove`); verdict, code with line notes, marked options and step-by-step panel
- **Preview / translatorFor** (packages/games/big-o/src/client/{preview.tsx,translate.ts}) - Read-only plain-text solution mode `{ payload, language }` for the admin (answer and `trap_option` marked, `h3` headings, root `lang`)
- **share** (packages/games/big-o/src/client/share.ts) - `🧮 Big O #N` / `🟩|🟥 <Language>` (the host appends the site line), spoiler-free
- **i18n / HELP_TARGET_ID / parse* / contract types** (packages/games/big-o/src/client/{i18n/index.ts,help-target.ts,parse.ts,types.ts}) - Namespace `big-o`, help anchor, schema parsers and props types (`codeLanguage?` optional)
- **CodeBlock** (packages/games/big-o/src/client/code-block.tsx) - Read-only tabbed code block with numbered lines, per-line notes (container query) and optional Shiki color with plain fallback
- **CodeText** (packages/games/big-o/src/client/code-text.tsx) - Code line with a fixed indent and hanging-indent wrap, no horizontal scroll (REQ-012)
- **loadTokenizer / SHIKI_VARS / useTokenizer** (packages/games/big-o/src/client/{highlight.ts,shiki-vars.ts,use-tokenizer.ts}) - Dynamic memoised Shiki loader, `css-variables` theme mapped to DS tokens, tokenizer hook
- **OptionsGroup / Question** (packages/games/big-o/src/client/{options-group.tsx,question.tsx}) - Radiogroup of the 8 options with roving tabindex; fixed question with `f(n)` accent
- **ResultOptions / Explanation** (packages/games/big-o/src/client/{result-options.tsx,explanation.tsx}) - Marked read-only options and "Paso a paso" panel shared by result and preview
- **resultMarks / previewMarks** (packages/games/big-o/src/client/options.ts) - Per-option marks in fixed order
- **formatCount / moveRadio / codeLines / notesByLine** (packages/games/big-o/src/client/{format,radio,lines}.ts) - Locale number format, APG radio navigation, code line splitting and notes by line
- **ConsoleHint / SectionPanel** (packages/games/big-o/src/client/{console-hint,section-panel}.tsx) - Copies of Timeline's hint line and panel
- **makeT / test fixtures** (packages/games/big-o/src/client/{test-utils,test-fixtures}.ts) - Test-only helpers
- **contrast / styles guards** (packages/games/big-o/src/client/{contrast.test.ts,client-styles.test.ts}) - Tests: AA of every color pair against `@nerdose/ui/tokens.css` and the styling static check

## Big O generator (11 items) - see big-o.md
- **generate / historySpec / usedBankItems / TRAP_RATE** (packages/games/big-o/src/generator/generate.ts) - Deterministic `generate({ date, seed, history })` (rng order: trap draw, recipe pick over the `id`-sorted group, parameters), `historySpec` `{ bank: null, lastUsedField: '', recentDays: 30, aheadDays: 30 }`, `usedBankItems` `[]`, `TRAP_RATE = 0.35`.
- **generator** (packages/games/big-o/src/generator/index.ts) - `GameGenerator<BigOPayload>` composed of `historySpec`, `usedBankItems`, `generate` and `verify`; what `apps/generator` imports
- **verify / createVerify / VERIFY_CHECKS / Runner** (packages/games/big-o/src/generator/verify.ts) - Async verification with 13 named checks (texts, shape, variety, js/go/java execution, counts agree/range/example, fit); injectable runner, `reason` = first failed check or `run_<lang>: <kind>`
- **fitCounts / formatFit / FIT_MAX_CV / FIT_MIN_SECOND_CV / FIT_MIN_SEPARATION / EXP_BASE_MIN / EXP_BASE_MAX** (packages/games/big-o/src/generator/fit.ts) - Pure log-space fit of counts against the 8 classes with CV thresholds and verdict `ok | poor_fit | ambiguous_fit`
- **RECIPES / buildRecipe / buildPayload** (packages/games/big-o/src/generator/{catalog/recipes.ts,catalog/build.ts,generate.ts}) - 43 recipes sorted by `id`; `buildRecipe(recipe, params)` builds the `f(n)` tree with one `createTreeBuilder`, emits js/go/java and returns the exact `cost(n)`; `buildPayload` adds the bilingual explanation
- **Recipe / TrapKind / BlockKind** (packages/games/big-o/src/generator/catalog/types.ts) - Catalog types; `paramDomain` narrows constants (`nest(linear,nest(constant,linear))`, `permutations_constant` use `K = 10`)
- **eligibleRecipes / recipesUsedNear / answerWouldRepeat / RECIPE_REPEAT_DAYS / MAX_SAME_ANSWER_STREAK** (packages/games/big-o/src/generator/variety.ts) - Variety window: recipe not in `[D - 29, D + 29]`, answer never 3 days in a row (the row of `D` is ignored)
- **SCALE / EXAMPLE_N / classValue / COUNT_MAX / SCALE_WORK_BUDGET** (packages/games/big-o/src/generator/scale.ts) - Size scale per answer, size of the "in numbers" example, exact integer class value, count range and work budget
- **MAX_LINES / MAX_NESTING / MAX_RECURSION_DEPTH / measureCode / treeNesting** (packages/games/big-o/src/generator/shape.ts) - Shape limits and indentation-based measure of emitted code
- **addDays** (packages/games/big-o/src/generator/days.ts) - Clock-free `YYYY-MM-DD` arithmetic in UTC (copy of Timeline's)
- **seed / seedFrom / recipe / recent / D / fakeRunner / allLanguages / emptyHistory / withDate / noExample / interpret** (packages/games/big-o/src/generator/{test-fixtures.ts,test-utils.ts}) - Test-only: SHA-256 seeds, recipe lookup, `RecentChallenge` builder, a runner double and payload helpers, and a tree interpreter (never runs emitted code)

## Bug Hunt shared (2 items) - see bug-hunt.md
- **formatCall / formatValue / formatArgs** (packages/games/bug-hunt/src/shared/format.ts) - Pure call formatting (`maxIndex([5, 1, 5])`, `[3, 7, 2], 4`) shared by the client and the generator (`generator/format.ts` re-exports `formatCall` / `formatValue`)
- **LANGUAGE_LABEL / BUG_TYPE_LABEL** (packages/games/bug-hunt/src/shared/labels.ts) - `JavaScript`/`Go`/`Java` labels and the 7 `bug_type` labels in es and en; not re-exported by `./definition`

## Bug Hunt definition (6 items) - see bug-hunt.md
- **bugHunt / definition** (packages/games/bug-hunt/src/definition/index.ts) - `GameDefinition` of Bug Hunt (`id: 'bug-hunt'`, `version: 1`); `toPublic` with exactly 5 keys, single-move `applyMove` (`invalid_move` outside `pickable_lines`), localized `result` with `fix` `{ before, after }`, `reduceStats` by `code_language` and `bug_type`, `historyLabel` `✓ L<n>` / `✗ L<n>`, `culprits` `[]`, `bankUsage` `null`
- **payloadSchema / moveSchema / stateSchema / publicViewSchema / feedbackSchema / resultSchema / statsSchema / codeByLanguageSchema / testCaseSchema / visibleTestSchema** (packages/games/bug-hunt/src/definition/schemas.ts) - Zod schemas; payload validates structure only, content rules belong to `verify`
- **MIN_STEPS / MAX_STEPS / MIN_VISIBLE_TESTS / MAX_VISIBLE_TESTS** (packages/games/bug-hunt/src/definition/schemas.ts) - 2, 4, 2, 3
- **BugHuntPayload / BugHuntMove / BugHuntState / BugHuntPublicView / BugHuntFeedback / BugHuntResult / BugHuntLineFix / BugHuntExplanation / BugHuntStats / BugHuntTestCase / BugHuntVisibleTest / CodeByLanguage** (packages/games/bug-hunt/src/definition/schemas.ts) - Types inferred from the schemas
- **PAYLOAD / PAYLOAD_BOOL / WON_JAVA / LOST_GO / WON_BOOL_JS / NON_PICKABLE / NOW / CTX_ES / CTX_EN / S0** (packages/games/bug-hunt/src/definition/test-fixtures.ts) - Test-only fixtures, not exported from the entry

## Bug Hunt client (16 items) - see bug-hunt.md
- **StatsSummary / StatsSummaryProps / languageRates / bugTypeRates / gamesCount / formatPercent / StatBar / parseStats** (packages/games/bug-hunt/src/client/{stats-summary.tsx,stats.ts,stat-bar.tsx,parse.ts,types.ts}) - Own stats: hits by language and by bug type (`N de M`, bar, %), labels from `LANGUAGE_LABEL` / `BUG_TYPE_LABEL`
- **Instructions / Game / Result** (packages/games/bug-hunt/src/client/{instructions,game,result}.tsx) - React screens of the `./client` entry; data props are `unknown` and parsed with the definition schemas; `Game` validates `moveSchema.parse({ language, line })` before `onMove`
- **Preview / PreviewProps / translatorFor** (packages/games/bug-hunt/src/client/{preview.tsx,types.ts,translate.ts}) - Read-only solution-mode preview `{ payload: unknown; language: Locale }` for the admin (plain-text code with the bug line, type and mutation chips, tests, failing test, fix, steps; `h3` headings, root `lang`)
- **share** (packages/games/bug-hunt/src/client/share.ts) - `share(result, number, locale = 'es')`: `🐛 Bug Hunt #N · <Language>` / `🟩 bug encontrado | 🟥 se me escapó` (the host appends the site line); never the line nor the bug type
- **i18n / HELP_TARGET_ID** (packages/games/bug-hunt/src/client/{i18n/index.ts,help-target.ts}) - `{ namespace: 'bug-hunt', resources: { es, en } }` and `'game-help'`
- **Translate / ClientBaseProps / InstructionsProps / GameProps / ResultProps / MoveErrorInfo / GameStatsView** (packages/games/bug-hunt/src/client/types.ts) - Prop contract (`codeLanguage?` optional, default `'js'`)
- **CodeBlock** (packages/games/bug-hunt/src/client/code-block.tsx) - Tabs plus `select` / `result` / `preview` modes; eligible lines as roving-tabindex radios, marks with glyph + text tags, same tree with or without Shiki color
- **CodeText** (packages/games/bug-hunt/src/client/code-text.tsx) - Same hanging-indent code line as Big O, used by `CodeBlock` and `FixDiff` (REQ-012)
- **FixDiff** (packages/games/bug-hunt/src/client/fix-diff.tsx) - One-line `-` / `+` diff of the active tab's language
- **Statement / TestsCard / FailingTest / WhyPanel / TypeChip / Question** (packages/games/bug-hunt/src/client/{statement,tests-card,failing-test,why-panel,question}.tsx) - Blocks shared by `Game`, `Result` and `Preview`
- **loadTokenizer / SHIKI_VARS / useTokenizer** (packages/games/bug-hunt/src/client/{highlight,shiki-vars,use-tokenizer}.ts) - Copies of Big O's Shiki infrastructure with the `nerdose-bug-hunt` theme; Shiki only through `import()`
- **fileNames / resultLineMarks / previewLineMarks / payloadFix / moveRadio / moveLine / codeLines** (packages/games/bug-hunt/src/client/{files,marks,radio,lines}.ts) - Pure helpers
- **ConsoleHint / SectionPanel** (packages/games/bug-hunt/src/client/{console-hint,section-panel}.tsx) - Copies of Big O's
- **makeT / client fixtures** (packages/games/bug-hunt/src/client/{test-utils,test-fixtures}.ts) - Test-only helpers, not exported from the entry

## Bug Hunt generator (13 items) - see bug-hunt.md
- **generate / createGenerate / historySpec / usedBankItems / MAX_COMBOS** (packages/games/bug-hunt/src/generator/generate.ts) - Deterministic `generate({ date, seed, history })` (rng order: bug type, then per attempt template, parameters, random test inputs, candidate shuffle; up to `MAX_COMBOS = 30` attempts, then the best fallback so `verify` rejects it); `createGenerate(templates)` injects test templates; `historySpec` `{ bank: null, lastUsedField: '', recentDays: 60, aheadDays: 60 }`; `usedBankItems` `[]`.
- **generator / verify / createVerify / VERIFY_CHECKS / Runner** (packages/games/bug-hunt/src/generator/{index,verify}.ts) - `GameGenerator<BugHuntPayload>` consumed by `apps/generator`; async `verify` with the 13 checks (5 in memory, 6 runs with an injectable runner, `correct_agrees`, `mutant_agrees`), skip rule and `reason` format (`run_<variant>_<lang>: <kind>`, `tests_consistent: equivalent_mutant`)
- **correctCode / testSignature / buildSources / parseValues / Sources** (packages/games/bug-hunt/src/generator/harness.ts) - Pure harness: correct version from `code` + `fix`, signature from the tests, the 6 `wrapFunction` programs and the strict reading of the output
- **TEMPLATES / templateById / bugTypesOf / combosFor / Template / TemplateId / TemplateParams / TestInput / MutationSite / BuiltTemplate** (packages/games/bug-hunt/src/generator/catalog/index.ts, packages/games/bug-hunt/src/generator/types.ts) - 18 templates (62 parameter combinations, 6 added in REQ-012 to vary where the bug lands) sorted by `id`, each with `build`, `spec`, `edgeCases`, `randomInput` and an independent TypeScript `reference`; `bugTypesOf` / `combosFor` derive the admitted bug types from the declared sites
- **OPERATORS / OPERATOR_IDS / OperatorId / mutationsOf / MutationCandidate** (packages/games/bug-hunt/src/generator/mutation/{operators,candidates}.ts) - 15 mutation operators over `replaceNode`; `mutationsOf(built, bugType)` lists the candidates in a stable order
- **neutralExpr / neutralStmt** (packages/games/bug-hunt/src/generator/mutation/neutral.ts) - Language-neutral notation for `mutation.from` / `to` (`len(nums)`, `==`, `best = i`)
- **TEST_COUNT / MAX_TEST_DRAWS / EVAL_STEP_LIMIT / testSize / buildTests / selectTests** (packages/games/bug-hunt/src/generator/tests.ts) - 10 distinct generated tests with `expected` from `evaluate`; hidden test (smallest failing) and visible tests (smallest passing)
- **evaluateCandidate / CandidateVerdict** (packages/games/bug-hunt/src/generator/evaluate-candidate.ts) - Classifies a mutation as `invalid`, `equivalent`, `not_enough_passing`, `variety` or `ok`
- **formatCall / formatValue** (packages/games/bug-hunt/src/generator/format.ts) - Re-export of `shared/format.ts`
- **VARIETY_DAYS / canonicalJson / varietyKey / keysUsedNear** (packages/games/bug-hunt/src/generator/variety.ts) - Variety key and the `[D - 59, D + 59]` window without the row of `D`
- **MIN_LINES / MAX_LINES / MAX_NESTING / measureCode** (packages/games/bug-hunt/src/generator/shape.ts) - Shape limits and indentation-based measure of emitted code
- **addDays** (packages/games/bug-hunt/src/generator/days.ts) - Clock-free `YYYY-MM-DD` arithmetic in UTC (copy of Big O's)
- **D / seed / seedFrom / payloadWith / PROBE_* / recent / rowWithKey / emptyHistory / assertValidPayload / rebuild / allCandidates** (packages/games/bug-hunt/src/generator/{test-fixtures.ts,test-utils.ts}) - Test-only: SHA-256 seeds, one-combination probe templates (equivalent, few passing, variety), history rows and payload checks
- **fakeRunnerFor / catalogPayload / requireToolchains** (packages/games/bug-hunt/src/generator/{test-fixtures,test-utils}.ts, packages/games/bug-hunt/test/integration/toolchains.ts) - Test-only: scripted runner, deterministic payload per template x bug type (62), toolchain gate for integration tests
