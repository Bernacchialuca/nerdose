# Reusable Code - games / Big O

Package `@nerdose/game-big-o` (`packages/games/big-o`). Entry: `./definition` (`./generator` and `./client` arrive with S-044/S-045/S-046).

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
