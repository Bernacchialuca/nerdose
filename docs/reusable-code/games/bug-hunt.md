# Reusable Code - games / Bug Hunt

Package `@nerdose/game-bug-hunt` (`packages/games/bug-hunt`). Entry: `./definition` (`./generator` and `./client` arrive with S-049, S-050 and S-051).

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
