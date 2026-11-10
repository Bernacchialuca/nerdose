# Reusable Code - games / Grep Grid

Package `@nerdose/game-grep-grid` (`packages/games/grep-grid`). Entries: `./definition`, `./client`, `./generator`.

## Shared

### Geometry
- **Location:** packages/games/grep-grid/src/shared/geometry.ts
- **Description:** Pure geometry of the 12x12 grid and the 4 forward directions (`right`, `down`, `down_right`, `up_right`). Used by definition, generator and client.
- **Signature:** `GRID_SIZE = 12`; `DIRECTIONS`; `DIRECTION_STEPS: Record<Direction, { dRow; dCol }>`; `type Cell = { row; col }`; `inGrid(cell): boolean`; `sameCell(a, b): boolean`; `directionOf(from, to): Direction | null`; `lineCells(from, to): Cell[] | null`
- **Usage:** `lineCells({ row: 3, col: 2 }, { row: 3, col: 7 })` returns 6 cells; reverse, unaligned, single-cell or out-of-grid lines return `null`.

## Definition

### grepGrid / definition
- **Location:** packages/games/grep-grid/src/definition/index.ts
- **Description:** `GameDefinition` of Grep Grid. `applyMove` handles `select` and `give_up`; "not a word" and "already found" are valid moves that keep the state. `toPublic(p, locale, state?)` reveals `definition` only for found words.
- **Signature:** `GameDefinition<GrepGridPayload, GrepGridPublicView, GrepGridState, GrepGridMove, GrepGridFeedback, GrepGridResult, GrepGridStats>`
- **Usage:** `createGameRegistry([grepGrid])`

### Schemas, constants and types
- **Location:** packages/games/grep-grid/src/definition/schemas.ts
- **Description:** `payloadSchema`, `moveSchema`, `stateSchema`, `publicViewSchema`, `feedbackSchema` (nullable), `feedbackFoundSchema`, `feedbackNotFoundSchema`, `resultSchema`, `statsSchema`, `cellSchema`, `WORD_PATTERN`, `WORDS_COUNT`, and the inferred `GrepGrid*` types.
- **Usage:** `payloadSchema.parse(generator.generate(...))`; `moveSchema.safeParse(body.move)`

## Client

### Instructions / Game / Result / share / i18n / HELP_TARGET_ID
- **Location:** packages/games/grep-grid/src/client/index.ts
- **Description:** The `./client` contract. `Game` consumes `feedback` (last `MoveResponse.feedback`) by identity after mount, learns definitions and cells from `feedback.found`, and hosts the O-04 dialog. `Result` takes an optional `publicView` (the 144 letters); without it, cells outside the words show a placeholder dot. `share` returns `🔎 Grep Grid #N\nS/8\nnerdose.dev`.
- **Signature:** `Game(props: GameProps)`; `Result(props: ResultProps)`; `Instructions(props: InstructionsProps)`; `share(result: unknown, number: number): string`; `i18n = { namespace: 'grep-grid', resources: { es, en } }`
- **Usage:** `<Game number={8} locale="es" t={t} publicView={today.public_view} state={play.state} feedback={move.data?.feedback ?? null} onMove={send} pending={false} moveError={null} />`

### Board
- **Location:** packages/games/grep-grid/src/client/board.tsx
- **Description:** 12x12 board. `mode: 'play'` renders `role="grid"` with a button per cell and roving tabindex (arrows, Home, End, Enter/Space, Escape); `mode: 'result'` renders a read-only `role="table"`.
- **Signature:** `Board(props: { mode: 'play'; cells; label; t; disabled; onCellPress; onCancel } | { mode: 'result'; cells; label; t })`

### WordList / CounterCard / ConsoleHint / SectionPanel
- **Location:** packages/games/grep-grid/src/client/{word-list,counter-card,console-hint,section-panel}.tsx
- **Description:** `WordList({ rows, mode, t })` (pending/found/revealed rows), `CounterCard({ found, t })` (no live region), `ConsoleHint({ text, announcement })` (one keyed node per announcement), `SectionPanel` (panel with `//` `h2`). `CounterCard` is a candidate for `@nerdose/ui`.

### SurrenderDialog / SURRENDER_BUTTON
- **Location:** packages/games/grep-grid/src/client/{surrender-dialog.tsx,surrender-button.ts}
- **Description:** O-04 modal (`alertdialog`, initial focus on "Seguir jugando", focus trap, Escape/close/overlay unless `busy`). `SURRENDER_BUTTON` is the `outline-tinted` error button class (candidate for `buttonClass`).
- **Signature:** `SurrenderDialog({ found, busy, t, onClose, onConfirm })`

### playCells / resultCells / moveFocus
- **Location:** packages/games/grep-grid/src/client/{cells,focus}.ts
- **Description:** Pure cell model (`start` > `found` > `revealed` > `free`; `found` wins over `revealed` where words cross) and arrow-key navigation clamped to 0-11.
- **Signature:** `playCells(grid, foundKeys: ReadonlySet<string>, start: Cell | null): BoardCell[]`; `resultCells(grid, words): BoardCell[]`; `moveFocus(pos, key): Cell | null`

## Generator

### generator / GrepGridTerm
- **Location:** packages/games/grep-grid/src/generator/index.ts
- **Description:** `GameGenerator` with `historySpec = { bank: 'terms', lastUsedField: 'last_used_grep', recentDays: 30 }`. `generate` throws `RangeError` with fewer than 8 bank terms.
- **Signature:** `generator: GameGenerator<GrepGridPayload, GrepGridTerm>`; `GrepGridTerm = { id; term; category; definition; summary; last_used_grep }`

### verifyPayload
- **Location:** packages/games/grep-grid/src/generator/verify.ts
- **Description:** Nine ordered checks (`grid_shape`, `words_count`, `words_in_bank`, `word_shape`, `texts_bilingual`, `no_substrings`, `placements_consistent`, `exactly_once`, `not_used_30`); first failure in `reason`.
- **Signature:** `verifyPayload(p, history): VerificationLog`

### eligibleTerms / isReusable / related / sortByTerm / REUSE_WINDOW_DAYS
- **Location:** packages/games/grep-grid/src/generator/eligibility.ts
- **Description:** 30-day reuse window; eligible terms also exclude `term_id`s of recent challenges.
- **Signature:** `eligibleTerms(bankItems, date, recentChallenges)`; `isReusable(lastUsed, date)`; `related(a, b)`

### chooseTerms
- **Location:** packages/games/grep-grid/src/generator/choose.ts
- **Signature:** `chooseTerms(eligible, bankItems, rng): GrepGridTerm[]` (8 terms)

### placeWords / fillGrid
- **Location:** packages/games/grep-grid/src/generator/placement.ts
- **Description:** Longest-first placement with crossings and backtracking bounded by `MAX_PLACEMENT_STEPS`; filler re-draws bounded by `MAX_FILL_REDRAWS`.
- **Signature:** `placeWords(words, rng): { grid; placements: (PlacedWord | null)[] }`; `fillGrid(grid, words, rng): string[][]`; `canPlace(grid, word, candidate)`

### countOccurrences
- **Location:** packages/games/grep-grid/src/generator/occurrences.ts
- **Signature:** `countOccurrences(grid, word): number` (reverse reading does not count)

### addDays / isValidDate
- **Location:** packages/games/grep-grid/src/generator/dates.ts
- **Description:** Copy of the Devdle helpers; cross-game imports are forbidden.

## Test fixtures (not exported)
- `PUBLIC_VIEW_0`, `PUBLIC_VIEW_3`, `STATE_0/3/4`, `FEEDBACK_*`, `RESULT_WIN`, `RESULT_GAVE_UP_5/0` in `src/client/test-fixtures.ts`; `makeT` in `src/client/test-utils.ts`.
- `PAYLOAD`, `GRID_DUPLICATE`, `ID`, `S0`, `NOW`, `CTX_ES`, `CTX_EN`, `select`, `selectWord`, `cellsOf`, `playAll` in `src/definition/test-fixtures.ts`.
- `BANK`, `BANK_FIXTURE`, `DATE`, `seed(n)`, `mk`, `history` in `src/generator/test-fixtures.ts`.
