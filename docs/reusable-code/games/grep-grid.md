# Reusable Code - games / Grep Grid

Package `@nerdose/game-grep-grid` (`packages/games/grep-grid`). Entries: `./definition`, `./generator`. No React code yet.

## Shared

### Geometry
- **Location:** packages/games/grep-grid/src/shared/geometry.ts
- **Description:** Pure geometry of the 12x12 grid and the 4 forward directions (`right`, `down`, `down_right`, `up_right`). Used by definition, generator and (S-024) client.
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
- `PAYLOAD`, `GRID_DUPLICATE`, `ID`, `S0`, `NOW`, `CTX_ES`, `CTX_EN`, `select`, `selectWord`, `cellsOf`, `playAll` in `src/definition/test-fixtures.ts`.
- `BANK`, `BANK_FIXTURE`, `DATE`, `seed(n)`, `mk`, `history` in `src/generator/test-fixtures.ts`.
