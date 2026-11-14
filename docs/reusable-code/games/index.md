# Reusable Code Index - games

Packages `@nerdose/game-devdle` (`packages/games/devdle`), entries `./definition`, `./client`, `./generator` and data resource `./wordlist`, `@nerdose/game-grep-grid` (`packages/games/grep-grid`), entries `./definition`, `./client` and `./generator`, and `@nerdose/game-timeline` (`packages/games/timeline`), entries `./definition`, `./generator` and `./client`. The build script lives in `scripts/` and is never importable from `src/` or other packages.

## Devdle definition (6 items) - see devdle.md
- **devdle / definition** (packages/games/devdle/src/definition/index.ts) - `GameDefinition` of Devdle (`id: 'devdle'`, `version: 1`); `definition` is an alias; implements `codeLanguage` -> `null`; implements `culprits(p)` (1 `term`, kind/id/label; test in `src/generator/culprits.test.ts`); declares `bankUsage` terms/last_used_devdle/365/1 (checked against `historySpec`/`REUSE_WINDOW_DAYS`/`usedBankItems` in `src/generator/bank-usage.test.ts`)
- **scoreGuess** (packages/games/devdle/src/definition/feedback.ts) - Pure per-letter feedback with repeated-letter handling (`correct` first, then left-to-right `present`)
- **payloadSchema / moveSchema / guessSchema / stateSchema / publicViewSchema / resultSchema / statsSchema / letterMarkSchema** (packages/games/devdle/src/definition/schemas.ts) - Zod schemas, snake_case as in `api.yaml`
- **WORD_PATTERN / MAX_GUESSES** (packages/games/devdle/src/definition/schemas.ts) - `/^[A-Z]{4,12}$/` and 6
- **DevdlePayload / DevdleMove / DevdleGuess / DevdleFeedback / DevdleState / DevdlePublicView / DevdleResult / DevdleStats / LetterMark** (packages/games/devdle/src/definition/schemas.ts) - Types inferred from the schemas
- **PAYLOAD_REACT / PAYLOAD_MERGE / ALL_VALID / NONE_VALID / NOW** (packages/games/devdle/src/definition/test-fixtures.ts) - Test-only fixtures, not exported from the entry; `ALL_VALID` / `NONE_VALID` carry `locale: 'es'` (required by `MoveContext`)

## Devdle client (11 items) - see devdle.md
- **Preview / PreviewProps / translatorFor** (packages/games/devdle/src/client/{preview.tsx,types.ts,translate.ts}) - Read-only solution-mode preview `{ payload: unknown; language: Locale }` for the admin (one solved `Board` row + `WordCard`, `h3` headings, root `lang`); parses with `payloadSchema`; `translatorFor(language)` is the production translator (returns the key if missing). `SectionPanel` gained `headingLevel?: 2 | 3`; `WordCard` takes `Pick<DevdleResult, 'word'|'category'|'definition'|'summary'>` and `headingLevel?`
- **Instructions / Game / Result** (packages/games/devdle/src/client/{instructions,game,result}.tsx) - React screens of the `./client` entry; game data props are `unknown` and parsed with the definition schemas
- **share** (packages/games/devdle/src/client/share.ts) - `share(result, number)`: `🟩 Devdle #N · k/6`, one emoji row per try, `nerdose.dev`; never the solution
- **i18n** (packages/games/devdle/src/client/i18n/index.ts) - `{ namespace: 'devdle', resources: { es, en } }` for web to register
- **HELP_TARGET_ID** (packages/games/devdle/src/client/help-target.ts) - `'game-help'`
- **Translate / ClientBaseProps / InstructionsProps / GameProps / ResultProps / MoveErrorInfo / GameStatsView** (packages/games/devdle/src/client/types.ts) - Prop contract
- **SectionPanel** (packages/games/devdle/src/client/section-panel.tsx) - Panel with a `//` header as `h2`
- **Board** (packages/games/devdle/src/client/board.tsx) - Scalable 4-12 column grid with non-chromatic glyphs
- **useDevdleInput** (packages/games/devdle/src/client/use-devdle-input.ts) - Physical keyboard normalized into letter/backspace/submit/invalid
- **keyStates / isFinished / MARK_EMOJI / MARK_GLYPH** (packages/games/devdle/src/client/marks.ts) - Pure helpers

## Devdle generator (5 items) - see devdle.md
- **generator / DevdleTerm** (packages/games/devdle/src/generator/index.ts) - `GameGenerator<DevdlePayload, DevdleTerm>` with `historySpec`, `usedBankItems`, `generate`, `verify` (`verify` is the synchronous `verifyPayload`, typed `VerificationLog | Promise<VerificationLog>` by the contract: tests use `verifyPayload` for checks and `await generator.verify` through the contract; no `aheadDays`)
- **verifyPayload** (packages/games/devdle/src/generator/verify.ts) - Five ordered checks returning a `VerificationLog`
- **eligibleTerms / sortByTerm / isReusable / REUSE_WINDOW_DAYS / RECENT_DAYS** (packages/games/devdle/src/generator/eligibility.ts) - 365-day and category-rotation filter, ordinal ordering by `term`
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

## Grep Grid client (15 items) - see grep-grid.md
- **Preview / PreviewProps / translatorFor** (packages/games/grep-grid/src/client/{preview.tsx,types.ts,translate.ts}) - Read-only solution-mode preview `{ payload: unknown; language: Locale }` for the admin (`Board mode="result"` with `solution` cells + `WordList mode="preview"`, `h3` headings, root `lang`); `translatorFor(language)` returns the key if missing
- **solutionKeys / previewCells** (packages/games/grep-grid/src/client/cells.ts) - `solutionKeys(payload)` walks `placements` with `DIRECTION_STEPS` (throws on an unknown `term_id`); `previewCells(grid, keys)` builds the 144 cells (`solution` / `free`). `CellState` and `WordRow.status` gained `solution`; `WordListMode = 'play' | 'result' | 'preview'`; `SectionPanel` gained `headingLevel`
- **Instructions / Game / Result** (packages/games/grep-grid/src/client/{instructions,game,result}.tsx) - React screens of the `./client` entry; data props are `unknown` and parsed with the definition schemas; `Game` also takes `feedback` (last `MoveResponse.feedback`, processed by identity after mount); `Result` takes an optional `publicView` for the 144 letters
- **share** (packages/games/grep-grid/src/client/share.ts) - `share(result, number)`: `🔎 Grep Grid #N` / `S/8` / `nerdose.dev`; never words nor surrender
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

## Timeline client (14 items) - see timeline.md
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


Note: Big O and Bug Hunt packages do not exist yet; when created, their `definition` must declare `bankUsage: null` and, as required members of the contract, `codeLanguage: (s) => s.language ?? null`.